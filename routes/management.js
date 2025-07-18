const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { calendarScheduler } = require('../code/calendar/calendarScheduler');
const { reconstructDeltaData, reconstructDeltaDataWithHistory } = require('./api');
const router = express.Router();

// Middleware for basic authentication (can be extended later)
const requireAuth = (req, res, next) => {
  // Simple check for now - add proper authentication later
  const isAuthenticated = req.session.isAdmin || false;
  if (!isAuthenticated) {
    // Temporarily skip authentication for development
    // return res.redirect('/management/login');
  }
  next();
};

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
      console.log('No solar data found, using empty array');
      solarData = [];
    }

    // Load solar variables information
    const variablesPath = path.join(__dirname, '../data/public_data/solar_variables.json');
    let variablesData = {};
    
    try {
      const variables = await fs.readFile(variablesPath, 'utf8');
      variablesData = JSON.parse(variables);
    } catch (err) {
      console.log('No solar variables data found, using empty object');
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
    schedulerStatus: calendarScheduler.getStatus()
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
