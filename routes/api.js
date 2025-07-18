const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { reservationValidationRules } = require('../code/validatorManager');
const { processReservation, checkAvailability } = require('../code/reservationManager');
const { displayCalendar, updateCalendar, cleanCalendar } = require('../code/calendarRoutes');
const { getReviews, handleUpvote } = require('../code/reviewRoutes');
const router = express.Router();

// Global variable to store last significant data for delta compression
let lastSignificantData = null;

// Initialize lastSignificantData from existing file
async function initializeLastSignificantData() {
  try {
    const publicDataPath = path.join(__dirname, '../data/public_data/solars_public.json');
    const existingData = await fs.readFile(publicDataPath, 'utf8');
    const history = JSON.parse(existingData);
    
    if (history && history.length > 0) {
      // Rekonstruiraj pune podatke od zadnjeg full zapisa
      let reconstructedData = null;
      
      // Pronađi zadnji full zapis
      for (let i = history.length - 1; i >= 0; i--) {
        if (!history[i]._type || history[i]._type !== 'delta') {
          reconstructedData = { ...history[i] };
          console.log('[INIT] Found base record from:', reconstructedData.local_time);
          
          // Primjeni sve delta promjene nakon ovog zapisa
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
        // Ako nema full zapisa, uzmi zadnji (čak i ako je delta)
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
  
  // RULE 1: Ako ima Error_code > 0 ili Warning_code > 0, spremi cijeli objekt
  if (newData.Error_code > 0 || newData.Warning_code > 0) {
    console.log('[DELTA] FULL RECORD - Ima greške/upozorenja');
    return { 
      type: 'full', 
      data: newData, 
      reason: `Error=${newData.Error_code}, Warning=${newData.Warning_code}` 
    };
  }

  // RULE 2: Ako nema grešaka, kreiraj delta zapis
  if (!lastData) {
    console.log('[DELTA] FULL RECORD - Prvi zapis');
    return { 
      type: 'full', 
      data: newData, 
      reason: 'Prvi zapis u datoteci' 
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
    
    // Ako su vrijednosti različite, dodaj u delta
    if (oldVal !== newVal) {
      delta[field] = newVal;
      changesFound++;
      console.log(`[DELTA] PROMJENA: ${field}: ${oldVal} → ${newVal}`);
    }
  }

  if (changesFound === 0) {
    console.log('[DELTA] BLOKIRA - Nema promjena');
    return { 
      type: 'skip', 
      data: null, 
      reason: 'Identični podaci - blokirano' 
    };
  }

  console.log(`[DELTA] DELTA RECORD - ${changesFound} promjena`);
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
        // Pošalji current podatke za real-time (bez spremanja u file)
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
      // Fajl ne postoji, kreiraj prazan niz
      history = [];
    }

    history.push(dataToSave);
    
    // Zadrži samo zadnjih 500 zapisa (smanjeno s 1000 za dodatnu optimizaciju)
    if (history.length > 500) {
      history = history.slice(-500);
    }

    await fs.writeFile(publicDataPath, JSON.stringify(history, null, 2));

    // Emit Socket.IO event za real-time updates
    const io = req.app.get('io');
    if (io) {
      // Za real-time, uvijek pošalji pune podatke (rekonstruiraj iz lastSignificantData)
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

router.get('/backyard-management', async (req, res) => {
  try {
    // Učitaj relay statuse iz solar_control.json
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

// Chart data API endpoint for different time ranges
router.get('/chart-data/:timeRange', async (req, res) => {
  try {
    const timeRange = req.params.timeRange;
    const publicDataPath = path.join(__dirname, '../data/public_data/solars_public.json');
    const rawData = await fs.readFile(publicDataPath, 'utf8');
    const solarData = JSON.parse(rawData);

    const now = new Date();
    
    // Determine time range and max points
    let hoursBack, maxPoints;
    switch(timeRange) {
      case '1h':
        hoursBack = 1;
        maxPoints = 60; // 1 point per minute
        break;
      case '12h':
        hoursBack = 12;
        maxPoints = 150; // 1 point per ~5 minutes
        break;
      case '24h':
      default:
        hoursBack = 24;
        maxPoints = 300; // 1 point per ~5 minutes
        break;
    }
    
    const timeRangeStart = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000));
    const last7DaysStart = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    // Create time points evenly distributed over the selected range
    const timeInterval = (hoursBack * 60 * 60 * 1000) / maxPoints;
    
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

    // Helper function for linear interpolation
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
    let reconstructedData = {};
    
    for (const record of solarData) {
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

    // Calculate data for each time point
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

    // Process each time point
    for (const timePoint of timePoints) {
      // Live data (current time range)
      liveData.pvVoltage.push(interpolateValue(timeRangeData, timePoint, 'PV_voltage_V'));
      liveData.accumPower.push(interpolateValue(timeRangeData, timePoint, 'Accum_power_Wh'));
      liveData.radiatorTemp.push(interpolateValue(timeRangeData, timePoint, 'Radiator_temp_C'));

      // Hourly history data (average for this time point over last 7 days)
      const dayAverages = { pvVoltage: [], accumPower: [], radiatorTemp: [] };
      
      // For each of the last 7 days, find value at this time point
      for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
        const historicalTime = new Date(timePoint.getTime() - (dayOffset * 24 * 60 * 60 * 1000));
        const dayData = last7DaysData.filter(record => {
          const recordTime = new Date(record.timestamp);
          const dayStart = new Date(historicalTime.getFullYear(), historicalTime.getMonth(), historicalTime.getDate());
          const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
          return recordTime >= dayStart && recordTime < dayEnd;
        });
        
        const dayValue_pv = interpolateValue(dayData, historicalTime, 'PV_voltage_V');
        const dayValue_power = interpolateValue(dayData, historicalTime, 'Accum_power_Wh');
        const dayValue_temp = interpolateValue(dayData, historicalTime, 'Radiator_temp_C');
        
        if (dayValue_pv !== null) dayAverages.pvVoltage.push(dayValue_pv);
        if (dayValue_power !== null) dayAverages.accumPower.push(dayValue_power);
        if (dayValue_temp !== null) dayAverages.radiatorTemp.push(dayValue_temp);
      }
      
      // Calculate averages for this time point
      hourlyHistoryData.pvVoltage.push(
        dayAverages.pvVoltage.length > 0 ? 
        dayAverages.pvVoltage.reduce((a, b) => a + b, 0) / dayAverages.pvVoltage.length : null
      );
      hourlyHistoryData.accumPower.push(
        dayAverages.accumPower.length > 0 ? 
        dayAverages.accumPower.reduce((a, b) => a + b, 0) / dayAverages.accumPower.length : null
      );
      hourlyHistoryData.radiatorTemp.push(
        dayAverages.radiatorTemp.length > 0 ? 
        dayAverages.radiatorTemp.reduce((a, b) => a + b, 0) / dayAverages.radiatorTemp.length : null
      );
    }

    res.json({
      success: true,
      labels,
      liveData,
      hourlyHistoryData,
      weeklyAverages,
      timePoints: timePoints.map(tp => tp.toISOString()),
      dataTimestamp: now.toISOString()
    });

  } catch (error) {
    console.error('Error fetching chart data:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch chart data' 
    });
  }
});

module.exports = router;
