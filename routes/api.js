const express = require('express');
const { reservationValidationRules } = require('../code/booking/validatorManager');
const { processReservation } = require('../code/booking/reservationManager');
const { displayCalendar, updateCalendar, cleanCalendar } = require('../code/calendar/calendarRoutes');
const { getReviews, handleUpvote, getInternalReviews, addInternalReview, verifyInternalAPI } = require('../code/reviews/reviewRoutes');

// Solar data modules
const { 
  initializeLastSignificantData, 
  reconstructDeltaData, 
  reconstructDeltaDataWithHistory,
  readSolarDataWithCache 
} = require('../code/solar/solarDataManager');
const { saveSolarData, exportSolarData } = require('../code/solar/solarFileManager');
const { 
  initializeRelayStates, 
  getRelayStates, 
  updateRelayStates, 
  setRelayState, 
  toggleRelayState 
} = require('../code/solar/relayStateManager');
const { calculateWeeklyAverages, filterDataByTimeRange, sampleDataPoints, extractChartData } = require('../code/data/dataAnalysis');
const { handleError, createAPIKeyMiddleware, parseTimeRangeParams, createAPIResponse } = require('../code/api/apiHelpers');

const router = express.Router();

// Initialize solar data on startup
initializeLastSignificantData();

// Initialize relay states on startup
initializeRelayStates().catch(error => {
  console.error('[INIT] Failed to initialize relay states:', error);
});

// Create API key middleware
const requireAPIKey = createAPIKeyMiddleware();

// Calendar API routes
router.get('/calendar/:id', displayCalendar);
router.get('/update-calendar/:id', updateCalendar);
router.get('/clean-calendar/:id', cleanCalendar);

// Reviews API routes
router.get('/reviews/:id', getReviews);
router.post('/reviews/:reviewId/upvote', handleUpvote);

// Internal Reviews API routes (require secret key)
router.get('/internal/reviews', verifyInternalAPI, getInternalReviews);
router.post('/internal/reviews', verifyInternalAPI, addInternalReview);

// Reservation API routes
router.post('/submit-reservation', reservationValidationRules, processReservation);
router.post('/check-availability', require('../code/booking/reservationManager').checkAvailability);

// Solar data endpoint - GET: returns relay states for ESP32
router.get('/backyard-management', async (req, res) => {
  try {
    // Validacija secret key-a
    const secretKey = req.query.secret_key || req.headers['x-secret-key'] || req.headers['secret_key'];
    if (!secretKey || secretKey !== process.env.API_SECRET) {
      return res.status(401).json({ error: 'Invalid secret key' });
    }

    // Get current relay states from dedicated file
    const relayStatesData = getRelayStates();
    
    res.json({
      success: true,
      relayStates: {
        relay1: relayStatesData.relay1,
        relay2: relayStatesData.relay2,
        relay3: relayStatesData.relay3,
        relay4: relayStatesData.relay4
      },
      timestamp: relayStatesData.lastUpdate,
      message: 'Current relay states retrieved'
    });

  } catch (error) {
    console.error('[API] Error in GET backyard-management:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Error reading relay states'
    });
  }
});

// Solar data endpoint - POST: receives data from ESP32/sensors
router.post('/backyard-management', async (req, res) => {
  try {
    // Validacija secret key-a
    const secretKey = req.body.secret_key;
    if (!secretKey || secretKey !== process.env.API_SECRET) {
      return res.status(401).json({ error: 'Invalid secret key' });
    }

    // Ukloni secret_key iz podataka prije spremanja
    const incomingData = { ...req.body };
    delete incomingData.secret_key;

    // Use incoming data directly (new Arduino format)
    const solarData = incomingData;

    // Extract relay states if present and update them separately
    const relayStates = {};
    let hasRelayData = false;
    
    if (typeof solarData.relay1 !== 'undefined') {
      relayStates.relay1 = solarData.relay1;
      delete solarData.relay1;
      hasRelayData = true;
    }
    if (typeof solarData.relay2 !== 'undefined') {
      relayStates.relay2 = solarData.relay2;
      delete solarData.relay2;
      hasRelayData = true;
    }
    if (typeof solarData.relay3 !== 'undefined') {
      relayStates.relay3 = solarData.relay3;
      delete solarData.relay3;
      hasRelayData = true;
    }
    if (typeof solarData.relay4 !== 'undefined') {
      relayStates.relay4 = solarData.relay4;
      delete solarData.relay4;
      hasRelayData = true;
    }

    // Update relay states in separate file if relay data is present
    if (hasRelayData) {
      try {
        await updateRelayStates(relayStates);
        console.log('[API] Relay states updated:', relayStates);
      } catch (relayError) {
        console.error('[API] Error updating relay states:', relayError);
        return res.status(500).json({ 
          error: 'Internal server error',
          message: 'Error updating relay states',
          details: relayError.message
        });
      }
    }

    // Save solar data (new Arduino format)
    let saveResult;
    try {
      saveResult = await saveSolarData(solarData);
    } catch (saveError) {
      console.error('[API] Error saving solar data:', saveError);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: 'Error saving solar data',
        details: saveError.message
      });
    }
    
    if (saveResult.skipped) {
      return res.json({ 
        success: true, 
        message: 'Data unchanged - not saved',
        reason: saveResult.reason,
        relayStatesUpdated: hasRelayData
      });
    }

    // Emit real-time data to connected clients
    const io = req.app.get('io');
    if (io && saveResult.completeData) {
      io.emit('solarDataUpdate', saveResult.completeData);
      
      // Also emit relay states if updated
      if (hasRelayData) {
        io.emit('relayStatesUpdate', getRelayStates());
      }
    }

    res.json({ 
      success: true, 
      message: 'Data saved successfully',
      type: saveResult.type,
      records: saveResult.recordsCount,
      relayStatesUpdated: hasRelayData
    });

  } catch (error) {
    console.error('[API] Error in POST backyard-management:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Error saving solar data'
    });
  }
});

// Solar chart data endpoint - provides data for dashboard charts
router.get('/solar/chart-data', requireAPIKey, async (req, res) => {
  try {
    const timeRange = req.query.range || '24h';
    const { hoursBack, maxPoints } = parseTimeRangeParams(timeRange);
    
    // Read solar data
    const solarData = await readSolarDataWithCache();
    
    if (solarData.length === 0) {
      return res.json(createAPIResponse(false, null, 'No solar data records found'));
    }
    
    // Filter data by time range
    const relevantData = filterDataByTimeRange(solarData, hoursBack);
    
    if (relevantData.length === 0) {
      return res.json(createAPIResponse(false, null, `No data available for the last ${timeRange}`));
    }

    // Reconstruct delta records
    const reconstructedData = await reconstructDeltaDataWithHistory(relevantData, solarData);
    
    // Sample data points for chart
    const sampledData = sampleDataPoints(reconstructedData, maxPoints);
    
    // Extract chart data arrays
    const chartData = extractChartData(sampledData);
    
    // Calculate weekly averages
    const weeklyAverages = calculateWeeklyAverages(solarData);

    const responseData = createAPIResponse(true, {
      timeRange: timeRange,
      ...chartData,
      weeklyAverages,
      dataTimestamp: new Date().toISOString()
    });

    res.json(responseData);

  } catch (error) {
    return handleError(req, res, error, '500', 'CHART DATA ERROR');
  }
});

// Get latest solar data
router.get('/backyard-management', requireAPIKey, async (req, res) => {
  try {
    const solarData = await readSolarDataWithCache();
    
    if (solarData.length === 0) {
      return res.json(createAPIResponse(false, null, 'No solar data available'));
    }

    // Get latest record and reconstruct if needed
    const latestRecord = solarData[solarData.length - 1];
    let latestData;
    
    if (latestRecord._type === 'delta') {
      const reconstructed = await reconstructDeltaDataWithHistory([latestRecord], solarData);
      latestData = reconstructed[0];
    } else {
      latestData = latestRecord;
    }

    res.json(createAPIResponse(true, { 
      latestData,
      totalRecords: solarData.length,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    return handleError(req, res, error, '500', 'LATEST DATA ERROR');
  }
});

// Export solar data
router.get('/export-solar-data', async (req, res) => {
  try {
    const fileContent = await exportSolarData();
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="solars_public.json"');
    
    // Send the file content
    res.send(fileContent);
    
  } catch (error) {
    return handleError(req, res, error, '404', 'EXPORT ERROR');
  }
});

// Load more data for dashboard tables
router.get('/solar/load-more', requireAPIKey, async (req, res) => {
  try {
    const offset = parseInt(req.query.offset) || 0;
    const limit = parseInt(req.query.limit) || 50;
    
    const solarData = await readSolarDataWithCache();
    
    if (solarData.length === 0) {
      return res.json(createAPIResponse(false, null, 'No solar data available'));
    }

    // Get slice of data
    const startIndex = Math.max(0, solarData.length - offset - limit);
    const endIndex = solarData.length - offset;
    const dataSlice = solarData.slice(startIndex, endIndex).reverse(); // Newest first
    
    // Reconstruct delta records
    const reconstructedData = await reconstructDeltaDataWithHistory(dataSlice, solarData);

    res.json(createAPIResponse(true, {
      data: reconstructedData,
      hasMore: startIndex > 0,
      totalRecords: solarData.length,
      nextOffset: offset + limit
    }));

  } catch (error) {
    return handleError(req, res, error, '500', 'LOAD MORE ERROR');
  }
});

// Relay control endpoints
// GET relay states only
router.get('/relay-states', async (req, res) => {
  try {
    // Validacija secret key-a
    const secretKey = req.query.secret_key || req.headers['x-secret-key'] || req.headers['secret_key'];
    if (!secretKey || secretKey !== process.env.API_SECRET) {
      return res.status(401).json({ error: 'Invalid secret key' });
    }

    const relayStates = getRelayStates();
    res.json({
      success: true,
      relayStates: {
        relay1: relayStates.relay1,
        relay2: relayStates.relay2,
        relay3: relayStates.relay3,
        relay4: relayStates.relay4
      },
      lastUpdate: relayStates.lastUpdate
    });
  } catch (error) {
    console.error('[API] Error getting relay states:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Error reading relay states'
    });
  }
});

// PUT relay states - update specific relays
router.put('/relay-states', async (req, res) => {
  try {
    // Validacija secret key-a
    const secretKey = req.body.secret_key || req.headers['x-secret-key'] || req.headers['secret_key'];
    if (!secretKey || secretKey !== process.env.API_SECRET) {
      return res.status(401).json({ error: 'Invalid secret key' });
    }

    const newStates = {};
    if (typeof req.body.relay1 !== 'undefined') newStates.relay1 = req.body.relay1;
    if (typeof req.body.relay2 !== 'undefined') newStates.relay2 = req.body.relay2;
    if (typeof req.body.relay3 !== 'undefined') newStates.relay3 = req.body.relay3;
    if (typeof req.body.relay4 !== 'undefined') newStates.relay4 = req.body.relay4;

    if (Object.keys(newStates).length === 0) {
      return res.status(400).json({ error: 'No relay states provided' });
    }

    const updatedStates = await updateRelayStates(newStates);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('relayStatesUpdate', updatedStates);
    }

    res.json({
      success: true,
      message: 'Relay states updated',
      relayStates: {
        relay1: updatedStates.relay1,
        relay2: updatedStates.relay2,
        relay3: updatedStates.relay3,
        relay4: updatedStates.relay4
      },
      lastUpdate: updatedStates.lastUpdate
    });
  } catch (error) {
    console.error('[API] Error updating relay states:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Error updating relay states'
    });
  }
});

// POST toggle specific relay
router.post('/relay-states/:relayNumber/toggle', async (req, res) => {
  try {
    // Validacija secret key-a
    const secretKey = req.body.secret_key || req.headers['x-secret-key'] || req.headers['secret_key'];
    if (!secretKey || secretKey !== process.env.API_SECRET) {
      return res.status(401).json({ error: 'Invalid secret key' });
    }

    const relayNumber = parseInt(req.params.relayNumber);
    if (relayNumber < 1 || relayNumber > 4) {
      return res.status(400).json({ error: 'Invalid relay number. Must be 1-4.' });
    }

    const updatedStates = await toggleRelayState(relayNumber);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('relayStatesUpdate', updatedStates);
    }

    res.json({
      success: true,
      message: `Relay ${relayNumber} toggled`,
      relayStates: {
        relay1: updatedStates.relay1,
        relay2: updatedStates.relay2,
        relay3: updatedStates.relay3,
        relay4: updatedStates.relay4
      },
      lastUpdate: updatedStates.lastUpdate
    });
  } catch (error) {
    console.error('[API] Error toggling relay state:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
module.exports.reconstructDeltaData = reconstructDeltaData;
module.exports.reconstructDeltaDataWithHistory = reconstructDeltaDataWithHistory;
