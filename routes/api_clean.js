const express = require('express');
const { reservationValidationRules } = require('../code/booking/validatorManager');
const { processReservation } = require('../code/booking/reservationManager');
const { displayCalendar, updateCalendar, cleanCalendar } = require('../code/calendar/calendarRoutes');
const { getReviews, handleUpvote } = require('../code/reviews/reviewRoutes');

// Solar data modules
const { 
  initializeLastSignificantData, 
  reconstructDeltaData, 
  reconstructDeltaDataWithHistory,
  readSolarDataWithCache 
} = require('../code/solar/solarDataManager');
const { saveSolarData, exportSolarData } = require('../code/solar/solarFileManager');
const { calculateWeeklyAverages, filterDataByTimeRange, sampleDataPoints, extractChartData } = require('../code/data/dataAnalysis');
const { handleError, createAPIKeyMiddleware, parseTimeRangeParams, createAPIResponse } = require('../code/api/apiHelpers');

const router = express.Router();

// Initialize solar data on startup
initializeLastSignificantData();

// Create API key middleware
const requireAPIKey = createAPIKeyMiddleware();

// Calendar API routes
router.get('/calendar/:id', displayCalendar);
router.get('/update-calendar/:id', updateCalendar);
router.get('/clean-calendar/:id', cleanCalendar);

// Reviews API routes
router.get('/reviews/:id', getReviews);
router.post('/reviews/:unitId/:reviewIndex/upvote', handleUpvote);

// Reservation API routes
router.post('/submit-reservation', reservationValidationRules, processReservation);

// Solar data endpoint - receives data from ESP32/sensors
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

    // Save data using solar file manager
    const saveResult = await saveSolarData(incomingData);
    
    if (saveResult.skipped) {
      return res.json({ 
        success: true, 
        message: 'Data unchanged - not saved',
        reason: saveResult.reason
      });
    }

    // Emit real-time data to connected clients
    const io = req.app.get('io');
    if (io && saveResult.completeData) {
      io.emit('solarDataUpdate', saveResult.completeData);
    }

    res.json({ 
      success: true, 
      message: 'Data saved successfully',
      type: saveResult.type,
      records: saveResult.recordsCount
    });

  } catch (error) {
    return handleError(req, res, error, '500', 'DATA SAVE ERROR');
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

module.exports = router;
module.exports.reconstructDeltaData = reconstructDeltaData;
module.exports.reconstructDeltaDataWithHistory = reconstructDeltaDataWithHistory;
