const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { reservationValidationRules } = require('../code/booking/validatorManager');
const { processReservation, checkAvailability } = require('../code/booking/reservationManager');
const { displayCalendar, updateCalendar, cleanCalendar } = require('../code/calendar/calendarRoutes');
const { getReviews, handleUpvote } = require('../code/reviews/reviewRoutes');
const router = express.Router();

// API Security Configuration
const API_SECRET = process.env.API_SECRET || 'your-secret-api-key-here';

const requireAPIKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'] || req.query.apikey;
  
  if (!providedKey || providedKey !== API_SECRET) {
    // Redirect to error page instead of JSON response
    return res.status(401).render('error', {
      error: {
        'error-code': '401',
        'error-title': 'UNAUTHORIZED ACCESS',
        'error-message': 'API access denied. Valid API key required for accessing this resource.'
      },
      validBackPage: req.session?.validBackPage || '/'
    });
  }
  
  next();
};

// Global variable to store last significant data for delta compression
let lastSignificantData = null;

// Initialize lastSignificantData from existing file
async function initializeLastSignificantData() {
  try {
    const publicDataPath = path.join(__dirname, '../data/public_data/solars_public.json');
    const existingData = await fs.readFile(publicDataPath, 'utf8');
    const history = JSON.parse(existingData);
    
    if (history && history.length > 0) {
      // Reconstruct full data from last full record
      let reconstructedData = null;
      
      // Find last full record
      for (let i = history.length - 1; i >= 0; i--) {
        if (!history[i]._type || history[i]._type !== 'delta') {
          reconstructedData = { ...history[i] };
          console.log('[INIT] Found base record from:', reconstructedData.local_time);
          
          // Apply all delta changes after this record
          for (let j = i + 1; j < history.length; j++) {
            if (history[j]._type === 'delta') {
              Object.assign(reconstructedData, history[j]);
              console.log('[INIT] Applied delta from:', history[j].local_time);
            }
          }
          break;
        }
      }
      
      if (reconstructedData) {
        lastSignificantData = reconstructedData;
        console.log('[INIT] Reconstructed data initialized with:', Object.keys(lastSignificantData).length, 'fields');
      } else {
        // If no full record exists, take the last one (even if it's delta)
        lastSignificantData = history[history.length - 1];
        console.log('[INIT] No full record found, using last delta:', lastSignificantData.local_time);
      }
    }
  } catch (err) {
    console.log('[INIT] No existing data file found, starting fresh');
    lastSignificantData = null;
  }
}

// Initialize on startup
initializeLastSignificantData();

// Delta compression function
function createDeltaRecord(newData, lastData) {
  console.log('[DELTA] === DELTA COMPRESSION ANALIZA ===');
  console.log('[DELTA] Error_code:', newData.Error_code);
  console.log('[DELTA] Warning_code:', newData.Warning_code);
  
  // RULE 1: If Error_code > 0 or Warning_code > 0, save entire object
  if (newData.Error_code > 0 || newData.Warning_code > 0) {
    console.log('[DELTA] FULL RECORD - Has errors/warnings');
    return { 
      type: 'full', 
      data: newData, 
      reason: `Error=${newData.Error_code}, Warning=${newData.Warning_code}` 
    };
  }

  // RULE 2: If no errors, create delta record
  if (!lastData) {
    console.log('[DELTA] FULL RECORD - First record');
    return { 
      type: 'full', 
      data: newData, 
      reason: 'First record in file' 
    };
  }

  // Kreiraj delta - spremi samo promijenjena polja
  const delta = {
    timestamp: newData.timestamp,
    local_time: newData.local_time
  };

  const significantFields = [
    'PV_voltage_V', 'Battery_voltage_V', 'Charger_current_A', 'Charger_power_W',
    'Radiator_temp_C', 'External_temp_C', 'AC_freq_Hz', 'Humidity_percent',
    'Error_code', 'Warning_code', 'Status'
  ];

  let changesFound = 0;

  for (const field of significantFields) {
    const oldVal = lastData[field];
    const newVal = newData[field];
    
    // If values are different, add to delta
    if (oldVal !== newVal) {
      delta[field] = newVal;
      changesFound++;
      console.log(`[DELTA] CHANGE: ${field}: ${oldVal} → ${newVal}`);
    }
  }

  if (changesFound === 0) {
    console.log('[DELTA] BLOCKED - No changes');
    return { 
      type: 'skip', 
      data: null, 
      reason: 'Identical data - blocked' 
    };
  }

  console.log(`[DELTA] DELTA RECORD - ${changesFound} changes`);
  delta._type = 'delta'; // Mark as delta record
  return { 
    type: 'delta', 
    data: delta, 
    reason: `${changesFound} promjena: ${Object.keys(delta).filter(k => !['timestamp', 'local_time', '_type'].includes(k)).join(', ')}` 
  };
}

// Calendar API routes
router.get('/calendar/:id', displayCalendar);
router.get('/update-calendar/:id', updateCalendar);
router.get('/clean-calendar/:id', cleanCalendar);

// Reviews API routes
router.get('/reviews/:id', getReviews);
router.post('/reviews/:unitId/:reviewIndex/upvote', handleUpvote);

// Reservation API routes
router.post('/submit-reservation', reservationValidationRules, processReservation);
router.post('/check-availability', checkAvailability);

// Backyard Management API routes for ESP32 for solar data
router.post('/backyard-management', async (req, res) => {
  try {
    // Validacija secret key-a
    const secretKey = req.body.secret_key;
    if (!secretKey || secretKey !== process.env.SECRET_API_KEY) {
      return res.status(401).json({ error: 'Invalid secret key' });
    }

    // Ukloni secret_key iz podataka prije spremanja
    const incomingData = { ...req.body };
    delete incomingData.secret_key;

    // Dodaj timestamp (hrvatsko vrijeme - UTC+1/UTC+2)
    const now = new Date();
    const croatianTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (2 * 3600000)); // UTC+2 za ljeto
    incomingData.timestamp = croatianTime.toISOString();
    incomingData.local_time = croatianTime.toLocaleString('hr-HR', { 
      timeZone: 'Europe/Zagreb',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Check if this data should be saved using delta compression
    const deltaResult = createDeltaRecord(incomingData, lastSignificantData);
    
    console.log('[API] Delta result:', deltaResult.type, '-', deltaResult.reason);
    
    if (deltaResult.type === 'skip') {
      // Data is identical, don't save to file but emit real-time update
      const io = req.app.get('io');
      if (io) {
        // Send current data for real-time (without saving to file)
        const realtimeData = {
          ...incomingData,
          source_ip: req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'Unknown'
        };
        console.log('[SOCKET] Emitting identical data update to clients');
        io.emit('solarDataUpdate', realtimeData);
      }
      
      return res.json({ 
        status: 'skipped', 
        message: deltaResult.reason,
        timestamp: incomingData.local_time
      });
    }

    let dataToSave;
    
    if (deltaResult.type === 'full') {
      // Full record
      dataToSave = deltaResult.data;
      lastSignificantData = dataToSave; // Update baseline
    } else {
      // Delta record - only changed fields
      dataToSave = deltaResult.data;
      
      // Update lastSignificantData with new values
      if (lastSignificantData) {
        for (const [key, value] of Object.entries(deltaResult.data)) {
          if (!['timestamp', 'local_time', '_type'].includes(key)) {
            lastSignificantData[key] = value;
          }
        }
        lastSignificantData.timestamp = deltaResult.data.timestamp;
        lastSignificantData.local_time = deltaResult.data.local_time;
      }
    }

    // Spremi u solars_public.json (dodaj u history)
    const publicDataPath = path.join(__dirname, '../data/public_data/solars_public.json');
    let history = [];
    
    try {
      const existingData = await fs.readFile(publicDataPath, 'utf8');
      history = JSON.parse(existingData);
    } catch (err) {
      // File doesn't exist, create empty array
      history = [];
    }

    history.push(dataToSave);
    
    // Keep only last 500 records (reduced from 1000 for additional optimization)
    if (history.length > 500) {
      history = history.slice(-500);
    }

    await fs.writeFile(publicDataPath, JSON.stringify(history, null, 2));

    // Emit Socket.IO event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // For real-time, always send full data (reconstruct from lastSignificantData)
      const realtimeData = deltaResult.type === 'delta' ? lastSignificantData : dataToSave;
      console.log('[SOCKET] Emitting solar data update to clients');
      io.emit('solarDataUpdate', realtimeData);
    }

    res.json({ 
      status: 'success', 
      message: deltaResult.reason,
      type: deltaResult.type,
      timestamp: dataToSave.local_time,
      records_in_file: history.length,
      saved_fields: deltaResult.type === 'delta' ? Object.keys(dataToSave).filter(k => !['timestamp', 'local_time', '_type'].includes(k)).length : 'full'
    });

  } catch (error) {
    console.error('Error in backyard-management POST:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Solar Dashboard API endpoints (protected)
router.get('/backyard-management', requireAPIKey, async (req, res) => {
  try {
    // Load relay statuses from solar_control.json
    const controlDataPath = path.join(__dirname, '../data/private/solar_control.json');
    
    try {
      const controlData = await fs.readFile(controlDataPath, 'utf8');
      const parsed = JSON.parse(controlData);
      
      res.json({
        relej1_on: parsed.relay_1 || false,
        relej2_on: parsed.relay_2 || false,
        relej3_on: parsed.relay_3 || false,
        relej4_on: parsed.relay_4 || false
      });
    } catch (err) {
      // Ako fajl ne postoji, vrati defaultne vrijednosti
      res.json({
        relej1_on: false,
        relej2_on: false,
        relej3_on: false,
        relej4_on: false
      });
    }

  } catch (error) {
    console.error('Error in backyard-management GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cache for chart data optimization
const chartDataCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds cache

// File cache to avoid repeated file reading
let fileCache = {
  data: null,
  timestamp: 0,
  FILE_CACHE_DURATION: 60000 // 1 minute file cache
};

// Chart data API endpoint for different time ranges (protected)
router.get('/chart-data/:timeRange', requireAPIKey, async (req, res) => {
  try {
    const timeRange = req.params.timeRange;
    const cacheKey = `chart-data-${timeRange}`;
    
    // Check response cache first
    const cachedData = chartDataCache.get(cacheKey);
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      return res.json(cachedData.data);
    }

    const publicDataPath = path.join(__dirname, '../data/public_data/solars_public.json');
    
    // Check if we need to read file from disk
    let solarData;
    if (!fileCache.data || (Date.now() - fileCache.timestamp) > fileCache.FILE_CACHE_DURATION) {
      console.log('Reading file from disk...');
      const startRead = Date.now();
      const rawData = await fs.readFile(publicDataPath, 'utf8');
      const readTime = Date.now() - startRead;
      
      const startParse = Date.now();
      solarData = JSON.parse(rawData);
      const parseTime = Date.now() - startParse;
      
      console.log(`   File read: ${readTime}ms, Parse: ${parseTime}ms, Records: ${solarData.length}`);
      
      // Update file cache
      fileCache.data = solarData;
      fileCache.timestamp = Date.now();
    } else {
      console.log('Using cached file data');
      solarData = fileCache.data;
    }

    const now = new Date();
    
    // Determine time range, intervals and max points
    let hoursBack, intervalMinutes, maxPoints;
    switch(timeRange) {
      case '1h':
        hoursBack = 1;
        intervalMinutes = 1; // 1-minute intervals
        maxPoints = 60; // 60 points for 1 hour
        break;
      case '12h':
        hoursBack = 12;
        intervalMinutes = 2; // 2-minute intervals
        maxPoints = 360; // 360 points for 12 hours (12*60/2)
        break;
      case '24h':
      default:
        hoursBack = 24;
        intervalMinutes = 5; // 5-minute intervals
        maxPoints = 288; // 288 points for 24 hours (24*60/5)
        break;
    }
    
    const timeRangeStart = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000));
    const last7DaysStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Pre-filter data to only what we need (major performance boost)
    const startTotal = Date.now();
    console.log(`Filtering data from ${solarData.length} records...`);
    const startFilter = Date.now();
    const relevantData = solarData.filter(record => {
      const recordTime = new Date(record.timestamp);
      return recordTime >= last7DaysStart; // Only last 7 days for all calculations
    });
    const filterTime = Date.now() - startFilter;
    console.log(`   Filtered to ${relevantData.length} records in ${filterTime}ms`);

    // Create time points with fixed intervals
    const timeInterval = intervalMinutes * 60 * 1000; // Convert minutes to milliseconds
    
    const timePoints = [];
    const labels = [];
    
    for (let i = 0; i < maxPoints; i++) {
      const timePoint = new Date(timeRangeStart.getTime() + (i * timeInterval));
      timePoints.push(timePoint);
      
      // Format labels based on time range
      if (timeRange === '1h') {
        labels.push(timePoint.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }));
      } else {
        labels.push(timePoint.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' }));
      }
    }

    // Helper function for linear interpolation with pre-filtered data
    function interpolateValue(records, targetTime, valueField) {
      if (records.length === 0) return null;
      
      // Find closest records before and after target time
      let beforeRecord = null;
      let afterRecord = null;
      
      for (const record of records) {
        const recordTime = new Date(record.timestamp);
        if (recordTime <= targetTime) {
          if (!beforeRecord || recordTime > new Date(beforeRecord.timestamp)) {
            beforeRecord = record;
          }
        } else {
          if (!afterRecord || recordTime < new Date(afterRecord.timestamp)) {
            afterRecord = record;
          }
        }
      }
      
      // If we have exact match or only one record, use it
      if (beforeRecord && !afterRecord) return beforeRecord[valueField] || 0;
      if (!beforeRecord && afterRecord) return afterRecord[valueField] || 0;
      if (!beforeRecord && !afterRecord) return null;
      
      // Linear interpolation
      const beforeTime = new Date(beforeRecord.timestamp).getTime();
      const afterTime = new Date(afterRecord.timestamp).getTime();
      const targetTimeMs = targetTime.getTime();
      
      const ratio = (targetTimeMs - beforeTime) / (afterTime - beforeTime);
      const beforeValue = beforeRecord[valueField] || 0;
      const afterValue = afterRecord[valueField] || 0;
      
      return beforeValue + ratio * (afterValue - beforeValue);
    }

    // Separate data by time periods
    const timeRangeData = [];
    const last7DaysData = [];
    
    // Process all data and reconstruct delta records
    console.log(`Processing ${relevantData.length} filtered records...`);
    const startProcessing = Date.now();
    let reconstructedData = {};
    
    for (const record of relevantData) {
      const recordTime = new Date(record.timestamp);
      
      // Reconstruct full data for delta records
      if (record._type === 'delta') {
        reconstructedData = { ...reconstructedData, ...record };
      } else {
        reconstructedData = { ...record };
      }
      
      // Add to appropriate time period arrays
      if (recordTime >= timeRangeStart) {
        timeRangeData.push({ ...reconstructedData, timestamp: record.timestamp });
      }
      if (recordTime >= last7DaysStart) {
        last7DaysData.push({ ...reconstructedData, timestamp: record.timestamp });
      }
    }
    const processingTime = Date.now() - startProcessing;
    console.log(`   Processing completed in ${processingTime}ms`);
    console.log(`   TimeRange data points: ${timeRangeData.length}, Last7Days: ${last7DaysData.length}`);

    // Calculate data for each time point
    console.log(`Interpolating ${timePoints.length} time points...`);
    const startInterpolation = Date.now();
    const liveData = {
      pvVoltage: [],
      accumPower: [],
      radiatorTemp: []
    };

    const hourlyHistoryData = {
      pvVoltage: [],
      accumPower: [],
      radiatorTemp: []
    };

    // Calculate weekly averages (horizontal lines)
    const weeklyTotals = { pvVoltage: [], accumPower: [], radiatorTemp: [] };
    
    for (const record of last7DaysData) {
      if (record.PV_voltage_V !== undefined) weeklyTotals.pvVoltage.push(record.PV_voltage_V);
      if (record.Accum_power_Wh !== undefined) weeklyTotals.accumPower.push(record.Accum_power_Wh);
      if (record.Radiator_temp_C !== undefined) weeklyTotals.radiatorTemp.push(record.Radiator_temp_C);
    }

    const weeklyAverages = {
      pvVoltage: weeklyTotals.pvVoltage.length > 0 ? 
        weeklyTotals.pvVoltage.reduce((a, b) => a + b, 0) / weeklyTotals.pvVoltage.length : 0,
      accumPower: weeklyTotals.accumPower.length > 0 ? 
        weeklyTotals.accumPower.reduce((a, b) => a + b, 0) / weeklyTotals.accumPower.length : 0,
      radiatorTemp: weeklyTotals.radiatorTemp.length > 0 ? 
        weeklyTotals.radiatorTemp.reduce((a, b) => a + b, 0) / weeklyTotals.radiatorTemp.length : 0
    };

    // Pre-group data by days for hourly history (MAJOR OPTIMIZATION)
    const dataByDays = {};
    for (const record of last7DaysData) {
      const recordTime = new Date(record.timestamp);
      const dayKey = `${recordTime.getFullYear()}-${recordTime.getMonth()}-${recordTime.getDate()}`;
      if (!dataByDays[dayKey]) {
        dataByDays[dayKey] = [];
      }
      dataByDays[dayKey].push(record);
    }
    console.log(`   Grouped into ${Object.keys(dataByDays).length} days`);

    // Process each time point
    for (const timePoint of timePoints) {
      // Live data (current time range)
      liveData.pvVoltage.push(interpolateValue(timeRangeData, timePoint, 'PV_voltage_V'));
      liveData.accumPower.push(interpolateValue(timeRangeData, timePoint, 'Accum_power_Wh'));
      liveData.radiatorTemp.push(interpolateValue(timeRangeData, timePoint, 'Radiator_temp_C'));

      // Hourly history data (average for this time point over last 7 days)
      // OPTIMIZATION: Skip hourly history for short time ranges
      if (timeRange === '1h') {
        hourlyHistoryData.pvVoltage.push(null);
        hourlyHistoryData.accumPower.push(null);
        hourlyHistoryData.radiatorTemp.push(null);
        continue; // Skip expensive calculation for 1h view
      }
      
      // OPTIMIZATION: Calculate hourly history only every 5th point for 12h view
      const timePointIndex = timePoints.indexOf(timePoint);
      if (timeRange === '12h' && timePointIndex % 5 !== 0) {
        hourlyHistoryData.pvVoltage.push(null);
        hourlyHistoryData.accumPower.push(null);
        hourlyHistoryData.radiatorTemp.push(null);
        continue;
      }
      
      // OPTIMIZATION: Calculate hourly history only every 3rd point for 24h view  
      if (timeRange === '24h' && timePointIndex % 3 !== 0) {
        hourlyHistoryData.pvVoltage.push(null);
        hourlyHistoryData.accumPower.push(null);
        hourlyHistoryData.radiatorTemp.push(null);
        continue;
      }
      
      const dayAverages = { pvVoltage: [], accumPower: [], radiatorTemp: [] };
      
      // For each of the last 7 days, find value at this time point
      for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
        const historicalTime = new Date(timePoint.getTime() - (dayOffset * 24 * 60 * 60 * 1000));
        const dayKey = `${historicalTime.getFullYear()}-${historicalTime.getMonth()}-${historicalTime.getDate()}`;
        const dayData = dataByDays[dayKey] || [];
        
        const dayValue_pv = interpolateValue(dayData, historicalTime, 'PV_voltage_V');
        const dayValue_power = interpolateValue(dayData, historicalTime, 'Accum_power_Wh');
        const dayValue_temp = interpolateValue(dayData, historicalTime, 'Radiator_temp_C');
        
        if (dayValue_pv !== null) dayAverages.pvVoltage.push(dayValue_pv);
        if (dayValue_power !== null) dayAverages.accumPower.push(dayValue_power);
        if (dayValue_temp !== null) dayAverages.radiatorTemp.push(dayValue_temp);
      }
      
      // Calculate averages for this time point (with fallback to nearby values)
      const calculateAverage = (values) => {
        if (values.length > 0) {
          return values.reduce((a, b) => a + b, 0) / values.length;
        }
        return null;
      };
      
      hourlyHistoryData.pvVoltage.push(calculateAverage(dayAverages.pvVoltage));
      hourlyHistoryData.accumPower.push(calculateAverage(dayAverages.accumPower));
      hourlyHistoryData.radiatorTemp.push(calculateAverage(dayAverages.radiatorTemp));
    }

    // Interpolate null values for better line continuity
    const interpolateNullValues = (data) => {
      for (let key in data) {
        const values = data[key];
        for (let i = 0; i < values.length; i++) {
          if (values[i] === null) {
            // Find previous non-null value
            let prevValue = null;
            let prevIndex = i - 1;
            while (prevIndex >= 0 && values[prevIndex] === null) {
              prevIndex--;
            }
            if (prevIndex >= 0) prevValue = values[prevIndex];
            
            // Find next non-null value
            let nextValue = null;
            let nextIndex = i + 1;
            while (nextIndex < values.length && values[nextIndex] === null) {
              nextIndex++;
            }
            if (nextIndex < values.length) nextValue = values[nextIndex];
            
            // Interpolate
            if (prevValue !== null && nextValue !== null) {
              const distance = nextIndex - prevIndex;
              const position = i - prevIndex;
              values[i] = prevValue + (nextValue - prevValue) * (position / distance);
            } else if (prevValue !== null) {
              values[i] = prevValue; // Use previous value
            } else if (nextValue !== null) {
              values[i] = nextValue; // Use next value
            } else {
              values[i] = 0; // Default fallback
            }
          }
        }
      }
    };

    // Apply interpolation to hourly history
    interpolateNullValues(hourlyHistoryData);

    const responseData = {
      success: true,
      labels,
      liveData,
      hourlyHistoryData,
      weeklyAverages,
      timePoints: timePoints.map(tp => tp.toISOString()),
      dataTimestamp: now.toISOString()
    };

    // Cache the response
    chartDataCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chart data' 
    });
  }
});

module.exports = router;
