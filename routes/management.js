

const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const multer = require('multer');
const { calendarScheduler } = require('../code/calendar/calendarScheduler');
const { reconstructDeltaData, reconstructDeltaDataWithHistory } = require('../code/solar/solarDataManager');
const { getRelayStates, setRelayState, toggleRelayState, updateRelayStates } = require('../code/solar/relayStateManager');

/**
 * Gets variable description for tooltips and help
 * @param {string} variableName - Variable name (new Arduino format)
 * @returns {string} Description of the variable
 */
const fsSync = require('fs');
let solarVariablesCache = null;
let solarVariablesCacheTime = 0;
const SOLAR_VARIABLES_PATH = path.join(__dirname, '../data/public_data/solar_variables.json');

function getVariableDescription(variableName) {
  // Simple cache for 60s
  const now = Date.now();
  if (!solarVariablesCache || now - solarVariablesCacheTime > 60000) {
    try {
      const raw = fsSync.readFileSync(SOLAR_VARIABLES_PATH, 'utf8');
      solarVariablesCache = JSON.parse(raw);
      solarVariablesCacheTime = now;
    } catch (e) {
      solarVariablesCache = {};
    }
  }
  if (solarVariablesCache[variableName] && solarVariablesCache[variableName].description) {
    return solarVariablesCache[variableName].description;
  }
  return 'No description available';
}
const authManager = require('../code/auth/authManager');
const { readReviewsFromDB, writeReviewsToDB, addReview } = require('../code/reviews/reviewsAPI');
const { getAvailableCompanies, getCompanyData, saveCompanyData, isValidCompanyId, getCompanyName, initializeCompanyData, getNextInvoiceNumber, addInvoice, updateInvoice, deleteInvoice, getInvoice } = require('../code/invoices/invoiceManager');
const invoiceManager = require('../code/invoices/invoiceManager');
const router = express.Router();

// Function to synchronize upvotes from upvotes.json to reviews.json
function syncUpvotesData() {
  try {
    // Read upvotes.json (now uses reviewId -> upvote_count format)
    const upvotesPath = path.join(__dirname, '../data/public_data/upvotes.json');
    let upvotesData = {};
    try {
      const upvotesFileData = require('fs').readFileSync(upvotesPath, 'utf8');
      upvotesData = JSON.parse(upvotesFileData);
    } catch (error) {
      // File doesn't exist yet, use empty object
    }
    
    const reviewsData = readReviewsFromDB();
    let updated = false;
    
    // Go through each unit and platform
    for (const [unitId, unit] of Object.entries(reviewsData)) {
      for (const [platform, platformData] of Object.entries(unit)) {
        if (platformData.reviews && Array.isArray(platformData.reviews)) {
          platformData.reviews.forEach((review) => {
            const actualUpvotes = upvotesData[review.id] || 0;
            
            if (review.upvotes !== actualUpvotes) {
              review.upvotes = actualUpvotes;
              updated = true;
            }
          });
        }
      }
    }
    
    if (updated) {
      writeReviewsToDB(reviewsData);
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing upvotes:', error);
    return false;
  }
}

// Function to update upvotes.json when upvotes are changed in management
function updateUpvotesFile(reviewId, newUpvoteCount) {
  try {
    const upvotesPath = path.join(__dirname, '../data/public_data/upvotes.json');
    let upvotesData = {};
    
    try {
      const upvotesFileData = require('fs').readFileSync(upvotesPath, 'utf8');
      upvotesData = JSON.parse(upvotesFileData);
    } catch (error) {
      // File doesn't exist yet, use empty object
    }
    
    upvotesData[reviewId] = newUpvoteCount;
    
    require('fs').writeFileSync(upvotesPath, JSON.stringify(upvotesData, null, 2));
    return true;
  } catch (error) {
    console.error('Error updating upvotes.json:', error);
    return false;
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images/avatars/'));
  },
  filename: function (req, file, cb) {
    // Generate filename based on guest name with counter for duplicates
    const guestName = req.body.guestName || 'guest';
    const cleanName = guestName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const extension = path.extname(file.originalname);
    
    // Check for existing files and generate unique filename
    let counter = 1;
    let fileName = `${cleanName}${extension}`;
    
    // This will be handled synchronously for simplicity
    cb(null, fileName);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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

// API ruta za najnoviji puni solar zapis (delta aware)
router.get('/api/solar-data/latest', requireAuth, async (req, res) => {
  try {
    const solarDataPath = path.join(__dirname, '../data/public_data/solars_public.json');
    let solarData = [];
    try {
      const data = await fs.readFile(solarDataPath, 'utf8');
      solarData = JSON.parse(data);
    } catch (err) {
      return res.json({ success: false, message: 'No solar data' });
    }
    let latestData = null;
    if (solarData.length > 0) {
      try {
        if (typeof reconstructDeltaDataWithHistory === 'function') {
          const latestRecords = await reconstructDeltaDataWithHistory([solarData[solarData.length - 1]], solarData);
          latestData = latestRecords.length > 0 ? latestRecords[0] : solarData[solarData.length - 1];
        } else {
          latestData = solarData[solarData.length - 1];
        }
      } catch (deltaError) {
        latestData = solarData[solarData.length - 1];
      }
    }
    if (latestData) res.json({ success: true, data: latestData });
    else res.json({ success: false, message: 'No data' });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

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

// Change user password
router.put('/api/users/:userUuid/password', requireAuth, async (req, res) => {
  const { userUuid } = req.params;
  const { newPassword, currentPassword } = req.body;
  
  if (!newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password is required'
    });
  }
  
  const result = authManager.changePassword(
    userUuid, 
    newPassword, 
    req.cookies.management_auth, 
    currentPassword
  );
  
  res.json(result);
});

// Relay Management API Routes
router.get('/api/relay-states', requireAuth, async (req, res) => {
  try {
    // Force reload from file to ensure fresh data
    await require('../code/solar/relayStateManager').initializeRelayStates();
    const relayStates = getRelayStates();
    res.json({ 
      success: true, 
      relayStates: relayStates 
    });
  } catch (error) {
    console.error('[MANAGEMENT] Error getting relay states:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error getting relay states',
      error: error.message
    });
  }
});

router.post('/api/relay-toggle/:relayNumber', requireAuth, async (req, res) => {
  try {
    const relayNumber = parseInt(req.params.relayNumber);
    
    if (isNaN(relayNumber) || relayNumber < 1 || relayNumber > 4) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid relay number. Must be 1-4.' 
      });
    }

    // Get current state first
    const currentStates = getRelayStates();
    const currentState = currentStates[`relay${relayNumber}`];
    const newState = !currentState;

    // Update relay state directly using relayStateManager
    try {
      const updatedStates = await updateRelayStates({
        [`relay${relayNumber}`]: newState
      });
      
      // Emit real-time update to all connected clients
      const io = req.app.get('io');
      if (io) {
        io.emit('relayStatesUpdate', updatedStates);
      }

      res.json({ 
        success: true, 
        message: `Relay ${relayNumber} ${newState ? 'turned ON' : 'turned OFF'}`,
        relayStates: updatedStates,
        changedRelay: relayNumber,
        newState: newState
      });
      
    } catch (error) {
      console.error('[MANAGEMENT] Error updating relay state:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update relay state',
        error: error.message
      });
    }

  } catch (error) {
    console.error('[MANAGEMENT] Error toggling relay:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error toggling relay state',
      error: error.message
    });
  }
});

// API route for variable descriptions
router.get('/api/variable-description/:variableName', requireAuth, (req, res) => {
  try {
    const variableName = req.params.variableName;
    // Simple cache for 60s
    const now = Date.now();
    if (!solarVariablesCache || now - solarVariablesCacheTime > 60000) {
      try {
        const raw = fsSync.readFileSync(SOLAR_VARIABLES_PATH, 'utf8');
        solarVariablesCache = JSON.parse(raw);
        solarVariablesCacheTime = now;
      } catch (e) {
        solarVariablesCache = {};
      }
    }
    const variable = solarVariablesCache[variableName];
    // Ako je obična varijabla s opisom
    if (variable && variable.description) {
      return res.json({ success: true, variable: variableName, description: variable.description });
    }
    // Inače vrati cijeli objekt kao codes (za mappinge)
    if (variable && typeof variable === 'object' && !Array.isArray(variable)) {
      return res.json({ success: true, variable: variableName, codes: variable });
    }
    // Ako ništa nije pronađeno
    res.json({ success: false, variable: variableName, message: 'No description or codes found.' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error getting variable description',
      error: error.message
    });
  }
});

// API route for loading more solar data
router.get('/api/solar-data/load-more', requireAuth, async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 10;
    
    // Load solar data
    const solarDataPath = path.join(__dirname, '../data/public_data/solars_public.json');
    let solarData = [];
    
    try {
      const data = await fs.readFile(solarDataPath, 'utf8');
      solarData = JSON.parse(data);
    } catch (err) {
      return res.json({ 
        success: true, 
        data: [],
        hasMore: false,
        totalRecords: 0
      });
    }

    // Calculate the range to return (from end backwards)
    const totalRecords = solarData.length;
    const startIndex = Math.max(0, totalRecords - offset - limit);
    const endIndex = totalRecords - offset;
    
    // Get the slice of data
    const dataSlice = solarData.slice(startIndex, endIndex);
    
    // Reconstruct delta data if available
    let reconstructedData;
    try {
      if (typeof reconstructDeltaDataWithHistory === 'function') {
        reconstructedData = await reconstructDeltaDataWithHistory(dataSlice, solarData);
      } else if (typeof reconstructDeltaData === 'function') {
        reconstructedData = reconstructDeltaData(dataSlice);
      } else {
        reconstructedData = dataSlice;
      }
    } catch (error) {
      reconstructedData = dataSlice;
    }

    // Check if there's more data available
    const hasMore = startIndex > 0;

    res.json({ 
      success: true, 
      data: reconstructedData,
      hasMore: hasMore,
      totalRecords: totalRecords,
      nextOffset: offset + limit
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error loading more solar data',
      error: error.message
    });
  }
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
  // Get current relay states
  const relayStates = getRelayStates();
  
  res.render('management/index', {
    title: 'Management Dashboard',
    schedulerStatus: calendarScheduler.getStatus(),
    user: req.user,
    relayStates: relayStates
  });
});

// Reviews management page
router.get('/reviews', requireAuth, (req, res) => {
  // Sync upvotes before rendering the page
  syncUpvotesData();
  
  res.render('management/reviews', {
    title: 'Reviews Management',
    user: req.user
  });
});

// API Routes for Reviews Management

// Get all reviews for management interface
router.get('/api/reviews', requireAuth, (req, res) => {
  try {
    // Sync upvotes before returning data
    syncUpvotesData();
    
    const reviewsData = readReviewsFromDB();
    const allReviews = [];
    
    // Flatten all reviews with unit and platform info
    for (const [unitId, unit] of Object.entries(reviewsData)) {
      for (const [platform, platformData] of Object.entries(unit)) {
        if (platformData.reviews) {
          for (const review of platformData.reviews) {
            allReviews.push({
              ...review,
              unitId,
              platform
            });
          }
        }
      }
    }
    
    // Sort by ID descending (newest first)
    allReviews.sort((a, b) => b.id - a.id);
    
    res.json(allReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Add new review
router.post('/api/reviews', requireAuth, upload.single('avatarFile'), async (req, res) => {
  try {
    const { unitId, platform, guestName, reviewDate, rating, comment, isVerified, upvotes } = req.body;
    
    // Validate required fields
    if (!unitId || !platform || !guestName || !reviewDate || !rating || !comment) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate avatar path
    let avatarPath = '/images/avatars/default.png';
    if (req.file) {
      // Generate unique filename with counter for duplicates
      const cleanName = guestName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const extension = path.extname(req.file.originalname);
      
      // Check existing files to generate unique name
      const avatarsDir = path.join(__dirname, '../public/images/avatars/');
      const existingFiles = await fs.readdir(avatarsDir);
      
      let counter = 1;
      let fileName = `${cleanName}${extension}`;
      
      while (existingFiles.includes(fileName)) {
        fileName = `${cleanName}-${counter}${extension}`;
        counter++;
      }
      
      // Rename uploaded file
      const oldPath = req.file.path;
      const newPath = path.join(avatarsDir, fileName);
      await fs.rename(oldPath, newPath);
      
      avatarPath = `/images/avatars/${fileName}`;
    }

    // Format date
    const formattedDate = new Date(reviewDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const reviewData = {
      guestName,
      guestAvatar: avatarPath,
      date: formattedDate,
      rating: parseInt(rating),
      comment,
      isVerified: isVerified === 'on' || isVerified === true,
      platform,
      upvotes: parseInt(upvotes) || 0
    };

    const success = await addReview(unitId, platform, reviewData);
    
    if (success) {
      // Recalculate platform statistics
      const reviewsData = readReviewsFromDB();
      const platformData = reviewsData[unitId][platform];
      
      if (platformData && platformData.reviews) {
        // Find the newly added review to get its ID
        const newReview = platformData.reviews[platformData.reviews.length - 1];
        
        // Update upvotes.json with new upvote count using review ID
        updateUpvotesFile(newReview.id, parseInt(upvotes) || 0);
        
        // Recalculate average rating
        const totalRating = platformData.reviews.reduce((sum, r) => sum + r.rating, 0);
        platformData.rating = Math.round((totalRating / platformData.reviews.length) * 10) / 10;
        
        // Update total reviews count
        platformData.totalReviews = platformData.reviews.length;
        
        // Save updated data
        writeReviewsToDB(reviewsData);
      }
      
      res.json({ success: true, message: 'Review added successfully' });
    } else {
      res.status(500).json({ error: 'Failed to add review' });
    }
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update existing review
router.put('/api/reviews/:reviewId', requireAuth, upload.single('avatarFile'), async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const { unitId, platform, guestName, reviewDate, rating, comment, isVerified, upvotes, removeAvatar } = req.body;
    
    const reviewsData = readReviewsFromDB();
    
    // Find and update the review
    let reviewFound = false;
    let avatarPath = null;
    let oldUnitId = null;
    let oldPlatform = null;
    
    // First find the existing review to get current avatar and location
    for (const [uId, unit] of Object.entries(reviewsData)) {
      for (const [pf, platformData] of Object.entries(unit)) {
        const review = platformData.reviews?.find(r => r.id === reviewId);
        if (review) {
          avatarPath = review.guestAvatar; // Keep existing avatar by default
          oldUnitId = uId;
          oldPlatform = pf;
          reviewFound = true;
          break;
        }
      }
      if (reviewFound) break;
    }
    
    if (!reviewFound) {
      return res.status(404).json({ error: 'Review not found' });
    }
    
    // Handle avatar removal or new upload
    if (removeAvatar === 'true') {
      // Remove current avatar, set to default
      avatarPath = '/images/avatars/default-avatar.png';
    } else if (req.file) {
      const cleanName = guestName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const extension = path.extname(req.file.originalname);
      
      const avatarsDir = path.join(__dirname, '../public/images/avatars/');
      const existingFiles = await fs.readdir(avatarsDir);
      
      let counter = 1;
      let fileName = `${cleanName}${extension}`;
      
      while (existingFiles.includes(fileName)) {
        fileName = `${cleanName}-${counter}${extension}`;
        counter++;
      }
      
      const oldPath = req.file.path;
      const newPath = path.join(avatarsDir, fileName);
      await fs.rename(oldPath, newPath);
      
      avatarPath = `/images/avatars/${fileName}`;
    }

    // Format date
    const formattedDate = new Date(reviewDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    // Remove review from old location
    const oldPlatformData = reviewsData[oldUnitId][oldPlatform];
    const reviewIndex = oldPlatformData.reviews.findIndex(r => r.id === reviewId);
    if (reviewIndex !== -1) {
      oldPlatformData.reviews.splice(reviewIndex, 1);
      
      // Recalculate old platform statistics
      if (oldPlatformData.reviews.length > 0) {
        const totalRating = oldPlatformData.reviews.reduce((sum, r) => sum + r.rating, 0);
        oldPlatformData.rating = Math.round((totalRating / oldPlatformData.reviews.length) * 10) / 10;
      } else {
        oldPlatformData.rating = 0;
      }
      oldPlatformData.totalReviews = oldPlatformData.reviews.length;
    }

    // Add review to new location (or same if not changed)
    const newReview = {
      id: reviewId,
      guestName,
      guestAvatar: avatarPath,
      date: formattedDate,
      rating: parseInt(rating),
      comment,
      isVerified: isVerified === 'on' || isVerified === true,
      platform,
      upvotes: parseInt(upvotes) || 0
    };

    // Ensure the new unit and platform exist
    if (!reviewsData[unitId]) {
      reviewsData[unitId] = {};
    }
    if (!reviewsData[unitId][platform]) {
      reviewsData[unitId][platform] = {
        rating: 0,
        totalReviews: 0,
        reviews: []
      };
    }

    reviewsData[unitId][platform].reviews.push(newReview);
    
    // Update upvotes.json with new upvote count using review ID
    updateUpvotesFile(reviewId, parseInt(upvotes) || 0);
    
    // Recalculate new platform statistics
    const newPlatformData = reviewsData[unitId][platform];
    const totalRating = newPlatformData.reviews.reduce((sum, r) => sum + r.rating, 0);
    newPlatformData.rating = Math.round((totalRating / newPlatformData.reviews.length) * 10) / 10;
    newPlatformData.totalReviews = newPlatformData.reviews.length;
    
    const success = writeReviewsToDB(reviewsData);
    if (success) {
      res.json({ success: true, message: 'Review updated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to save updated review' });
    }
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete review
router.delete('/api/reviews/:reviewId', requireAuth, async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const reviewsData = readReviewsFromDB();
    
    let reviewFound = false;
    
    // Find and remove the review
    for (const unit of Object.values(reviewsData)) {
      for (const platformData of Object.values(unit)) {
        const reviewIndex = platformData.reviews?.findIndex(r => r.id === reviewId);
        if (reviewIndex !== -1) {
          platformData.reviews.splice(reviewIndex, 1);
          
          // Recalculate platform statistics
          if (platformData.reviews.length > 0) {
            const totalRating = platformData.reviews.reduce((sum, r) => sum + r.rating, 0);
            platformData.rating = Math.round((totalRating / platformData.reviews.length) * 10) / 10;
          } else {
            platformData.rating = 0;
          }
          platformData.totalReviews = platformData.reviews.length;
          
          reviewFound = true;
          break;
        }
      }
      if (reviewFound) break;
    }
    
    if (reviewFound) {
      const success = writeReviewsToDB(reviewsData);
      if (success) {
        res.json({ success: true, message: 'Review deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to save changes' });
      }
    } else {
      res.status(404).json({ error: 'Review not found' });
    }
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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

// Invoice management routes
router.get('/invoices', requireAuth, async (req, res) => {
  try {
    let selectedCompany = null;
    let selectedCompanyId = req.session.selectedCompanyId;

    if (selectedCompanyId && isValidCompanyId(selectedCompanyId)) {
      selectedCompany = await getCompanyData(selectedCompanyId);
      
      // Add UIDs to existing invoices that don't have them
      await invoiceManager.addUIDsToExistingInvoices(selectedCompanyId);
      
      // Reload company data after UID update
      selectedCompany = await getCompanyData(selectedCompanyId);
    }

    res.render('management/invoices', { 
      title: 'Upravljanje računima - Apartments Šibenik',
      user: req.user,
      selectedCompany,
      selectedCompanyId
    });
  } catch (error) {
    console.error('Error loading invoices page:', error);
    res.status(500).render('error', { 
      title: 'Greška',
      message: 'Greška prilikom učitavanja stranice računa'
    });
  }
});

// API route to select company
router.post('/api/invoices/select-company', requireAuth, async (req, res) => {
  try {
    const { companyId } = req.body;

    if (!companyId || !isValidCompanyId(companyId)) {
      return res.status(400).json({ error: 'Invalid company ID' });
    }

    // Initialize company data if it doesn't exist
    await initializeCompanyData(companyId);

    // Get company data
    const companyData = await getCompanyData(companyId);
    if (!companyData) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Save selection to session
    req.session.selectedCompanyId = companyId;

    res.json({ 
      success: true,
      companyId,
      company: companyData
    });
  } catch (error) {
    console.error('Error selecting company:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API route to get selected company
router.get('/api/invoices/selected-company', requireAuth, async (req, res) => {
  try {
    const selectedCompanyId = req.session.selectedCompanyId;

    if (!selectedCompanyId || !isValidCompanyId(selectedCompanyId)) {
      return res.json({ company: null, companyId: null });
    }

    const companyData = await getCompanyData(selectedCompanyId);
    res.json({ 
      company: companyData,
      companyId: selectedCompanyId
    });
  } catch (error) {
    console.error('Error getting selected company:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API route to get invoices for selected company
router.get('/api/invoices/list', requireAuth, async (req, res) => {
  try {
    const selectedCompanyId = req.session.selectedCompanyId;
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 5;

    if (!selectedCompanyId || !isValidCompanyId(selectedCompanyId)) {
      return res.status(400).json({ error: 'No company selected' });
    }

    const companyData = await getCompanyData(selectedCompanyId);
    if (!companyData) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Sort invoices by creation date (newest first)
    // We'll use the invoice ID as a timestamp since it contains the creation timestamp
    const sortedInvoices = [...companyData.invoices].sort((a, b) => {
      // Convert invoice ID to number for comparison (newer IDs are larger)
      const idA = parseInt(a.id) || 0;
      const idB = parseInt(b.id) || 0;
      return idB - idA; // Descending order (newest first)
    });

    // Calculate pagination
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const paginatedInvoices = sortedInvoices.slice(startIndex, endIndex);
    
    const totalInvoices = sortedInvoices.length;
    const hasMoreInvoices = endIndex < totalInvoices;

    res.json({ 
      invoices: paginatedInvoices,
      company: companyData,
      pagination: {
        page: page,
        limit: limit,
        total: totalInvoices,
        hasMore: hasMoreInvoices,
        loaded: Math.min(endIndex, totalInvoices)
      }
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API route to get next invoice number
router.get('/api/invoices/next-number', requireAuth, async (req, res) => {
  try {
    const selectedCompanyId = req.session.selectedCompanyId;

    if (!selectedCompanyId || !isValidCompanyId(selectedCompanyId)) {
      return res.status(400).json({ error: 'No company selected' });
    }

    const nextNumber = await getNextInvoiceNumber(selectedCompanyId);
    res.json({ invoiceNumber: nextNumber });
  } catch (error) {
    console.error('Error getting next invoice number:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API route to create new invoice
router.post('/api/invoices/create', requireAuth, async (req, res) => {
  try {
    const selectedCompanyId = req.session.selectedCompanyId;

    if (!selectedCompanyId || !isValidCompanyId(selectedCompanyId)) {
      return res.status(400).json({ error: 'No company selected' });
    }

    const success = await addInvoice(selectedCompanyId, req.body);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to create invoice' });
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API route to update invoice
router.put('/api/invoices/:invoiceId', requireAuth, async (req, res) => {
  try {
    const selectedCompanyId = req.session.selectedCompanyId;
    const { invoiceId } = req.params;

    if (!selectedCompanyId || !isValidCompanyId(selectedCompanyId)) {
      return res.status(400).json({ error: 'No company selected' });
    }

    const success = await updateInvoice(selectedCompanyId, invoiceId, req.body);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to update invoice' });
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API route to delete invoice
router.delete('/api/invoices/:invoiceId', requireAuth, async (req, res) => {
  try {
    const selectedCompanyId = req.session.selectedCompanyId;
    const { invoiceId } = req.params;

    if (!selectedCompanyId || !isValidCompanyId(selectedCompanyId)) {
      return res.status(400).json({ error: 'No company selected' });
    }

    const success = await deleteInvoice(selectedCompanyId, invoiceId);
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to delete invoice' });
    }
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API route to get single invoice
router.get('/api/invoices/:invoiceId', requireAuth, async (req, res) => {
  try {
    const selectedCompanyId = req.session.selectedCompanyId;
    const { invoiceId } = req.params;

    if (!selectedCompanyId || !isValidCompanyId(selectedCompanyId)) {
      return res.status(400).json({ error: 'No company selected' });
    }

    const invoice = await getInvoice(selectedCompanyId, invoiceId);
    if (invoice) {
      res.json({ invoice });
    } else {
      res.status(404).json({ error: 'Invoice not found' });
    }
  } catch (error) {
    console.error('Error getting invoice:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Print invoice route
router.get('/invoices/print', requireAuth, async (req, res) => {
  try {
    const { company: companyId, invoice: invoiceNumber } = req.query;

    if (!companyId || !invoiceNumber) {
      return res.status(400).render('error', { 
        title: 'Greška',
        message: 'Nedostaju parametri za ispis računa'
      });
    }

    if (!isValidCompanyId(companyId)) {
      return res.status(400).render('error', { 
        title: 'Greška',
        message: 'Neispravna firma'
      });
    }

    const companyData = await getCompanyData(companyId);
    if (!companyData) {
      return res.status(404).render('error', { 
        title: 'Greška',
        message: 'Firma nije pronađena'
      });
    }

    // Find invoice by invoice number
    const invoice = companyData.invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) {
      return res.status(404).render('error', { 
        title: 'Greška',
        message: 'Račun nije pronađen'
      });
    }

    res.render('management/templates/invoice', {
      title: `Račun ${invoiceNumber} - ${companyData.companyName}`,
      company: companyData,
      invoice: invoice,
      isGuest: false
    });
  } catch (error) {
    console.error('Error printing invoice:', error);
    res.status(500).render('error', { 
      title: 'Greška',
      message: 'Greška prilikom učitavanja računa'
    });
  }
});

module.exports = router;
