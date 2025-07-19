const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { calendarScheduler } = require('../code/calendar/calendarScheduler');
const { reconstructDeltaData, reconstructDeltaDataWithHistory } = require('./api');
const authManager = require('../code/auth/authManager');
const router = express.Router();

// Authentication middleware
const requireAuth = (req, res, next) => {
  const authCookie = req.cookies.management_auth;
  const session = authManager.validateSession(authCookie);
  
  if (!session) {
    // For API endpoints, render error page instead of JSON
    if (req.path.startsWith('/api/')) {
      return res.status(401).render('error', {
        error: {
          'error-code': '401',
          'error-title': 'NOT AUTHENTICATED',
          'error-message': 'You must be logged in to access this resource. Please log in first.'
        },
        validBackPage: '/management/login'
      });
    }
    
    // For regular pages, redirect to login
    return res.redirect('/management/login');
  }
  
  // Attach user info to request
  req.user = session;
  next();
};

// Admin-only middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    // For API endpoints, render error page instead of JSON
    if (req.path.startsWith('/api/')) {
      return res.status(403).render('error', {
        error: {
          'error-code': '403',
          'error-title': 'NOT AUTHORIZED',
          'error-message': 'Admin access required for this resource. You do not have sufficient permissions.'
        },
        validBackPage: '/management'
      });
    }
    
    // For regular pages, render error page
    return res.status(403).render('error', {
      error: {
        'error-code': '403',
        'error-title': 'ACCESS DENIED',
        'error-message': 'Admin access required for this resource.'
      },
      validBackPage: '/management'
    });
  }
  next();
};

// Login page
router.get('/login', (req, res) => {
  // If already logged in, redirect to dashboard
  const authCookie = req.cookies.management_auth;
  const session = authManager.validateSession(authCookie);
  
  if (session) {
    return res.redirect('/management');
  }
  
  res.render('management/login-page', {
    error: null,
    username: ''
  });
});

// Login POST handler
router.post('/login', async (req, res) => {
  const { username, password, rememberMe } = req.body;
  
  try {
    const authResult = authManager.authenticate(username, password);
    
    if (authResult.success) {
      const sessionId = authManager.createSession(authResult.user, !!rememberMe);
      
      // Set cookie - temporary session cookie that expires when browser closes
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
        // No maxAge = session cookie (expires when browser closes)
      };
      
      // If rememberMe is checked, make it a longer-lasting cookie
      if (rememberMe) {
        cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days for "remember me"
      }
      // If not checked, no maxAge = session cookie (browser close)
      
      res.cookie('management_auth', sessionId, cookieOptions);
      return res.redirect('/management');
    } else {
      return res.render('management/login-page', {
        error: authResult.message || 'Invalid credentials',
        username: username
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.render('management/login-page', {
      error: 'Server error. Please try again.',
      username: username
    });
  }
});

// Logout handler
router.post('/logout', (req, res) => {
  const authCookie = req.cookies.management_auth;
  if (authCookie) {
    authManager.logout(authCookie);
  }
  res.clearCookie('management_auth');
  res.redirect('/management/login');
});

// API Routes for user management (admin only)
router.post('/api/users', requireAuth, requireAdmin, async (req, res) => {
  const { name, username, password } = req.body;
  
  if (!name || !username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, username, and password are required'
    });
  }
  
  const result = authManager.addUser(name, username, password, req.cookies.management_auth);
  res.json(result);
});

router.delete('/api/users/:userUuid', requireAuth, requireAdmin, async (req, res) => {
  const { userUuid } = req.params;
  const result = authManager.removeUser(userUuid, req.cookies.management_auth);
  res.json(result);
});

router.get('/api/users', requireAuth, requireAdmin, async (req, res) => {
  const result = authManager.getAllUsers(req.cookies.management_auth);
  res.json(result);
});

// Solar Dashboard route
router.get('/solar-dashboard', requireAuth, async (req, res) => {
  try {
    // Load solar data
    const solarDataPath = path.join(__dirname, '../data/public_data/solars_public.json');
    let solarData = [];
    
    try {
      const data = await fs.readFile(solarDataPath, 'utf8');
      solarData = JSON.parse(data);
    } catch (err) {
      console.log('[WARNING] No solar data found, using empty array');
      solarData = [];
    }

    // Load solar variables information
    const variablesPath = path.join(__dirname, '../data/public_data/solar_variables.json');
    let variablesData = {};
    
    try {
      const variables = await fs.readFile(variablesPath, 'utf8');
      variablesData = JSON.parse(variables);
    } catch (err) {
      console.log('[WARNING] No solar variables data found, using empty object');
      variablesData = {};
    }

    // Take last 10 records for initial display
    const recentData = solarData.slice(-10);
    
    // Reconstruct delta records for table display with proper base resolution
    let reconstructedData;
    
    try {
      if (typeof reconstructDeltaDataWithHistory === 'function') {
        reconstructedData = await reconstructDeltaDataWithHistory(recentData, solarData);
      } else if (typeof reconstructDeltaData === 'function') {
        reconstructedData = reconstructDeltaData(recentData);
      } else {
        console.warn('Delta reconstruction functions not available, using raw data');
        reconstructedData = recentData;
      }
    } catch (deltaError) {
      console.warn('Error in delta reconstruction:', deltaError.message);
      reconstructedData = recentData; // fallback to raw data
    }

    // Get latest data with delta reconstruction for dashboard cards
    let latestData = null;
    if (solarData.length > 0) {
      try {
        if (typeof reconstructDeltaDataWithHistory === 'function') {
          // Use delta reconstruction to get the latest complete record
          const latestRecords = await reconstructDeltaDataWithHistory([solarData[solarData.length - 1]], solarData);
          latestData = latestRecords.length > 0 ? latestRecords[0] : solarData[solarData.length - 1];
        } else {
          latestData = solarData[solarData.length - 1];
        }
      } catch (deltaError) {
        console.warn('Error reconstructing latest data for dashboard:', deltaError.message);
        latestData = solarData[solarData.length - 1];
      }
    }

    res.render('management/solar-dashboard', {
      title: 'Solar Dashboard - Management',
      solarData: reconstructedData,
      latestData: latestData,
      totalRecords: solarData.length,
      solarVariables: variablesData
    });
  } catch (error) {
    console.error('Error loading solar dashboard:', error);
    res.status(500).render('error', { 
      error: { 
        'error-code': '500',
        'error-title': 'SOLAR DASHBOARD ERROR',
        'error-message': `Failed to load solar dashboard data: ${error.message}`
      },
      validBackPage: req.session?.validBackPage || '/management'
    });
  }
});

// Management home page
router.get('/', requireAuth, (req, res) => {
  res.render('management/index', {
    title: 'Management Dashboard',
    schedulerStatus: calendarScheduler.getStatus(),
    user: req.user
  });
});

// Scheduler control routes
router.post('/scheduler/start', requireAuth, (req, res) => {
  calendarScheduler.start();
  res.json({ success: true, status: calendarScheduler.getStatus() });
});

router.post('/scheduler/stop', requireAuth, (req, res) => {
  calendarScheduler.stop();
  res.json({ success: true, status: calendarScheduler.getStatus() });
});

router.get('/scheduler/status', requireAuth, (req, res) => {
  res.json(calendarScheduler.getStatus());
});

module.exports = router;
