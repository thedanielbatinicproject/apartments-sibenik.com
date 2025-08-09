const fs = require('fs').promises;
const path = require('path');

// Global variable to store last significant data
let lastSignificantData = null;

// On module load, initialize from file (auto)
initializeLastSignificantData();
/**
 * Reset last significant data (RAM)
 */
function resetLastSignificantData() {
  lastSignificantData = null;
}

/**
 * Initialize last significant data on startup
 */
async function initializeLastSignificantData() {
  try {
    const publicDataPath = path.join(__dirname, '../../data/public_data/solars_public.json');
    const existingData = await fs.readFile(publicDataPath, 'utf8');
    const history = JSON.parse(existingData);
    
    if (history && history.length > 0) {
      // Reconstruct full data from last full record
      let reconstructedData = null;
      
      // Find last full record
      for (let i = history.length - 1; i >= 0; i--) {
        if (!history[i]._type || history[i]._type !== 'delta') {
          reconstructedData = { ...history[i] };
          
          // Apply all delta changes after this record
          for (let j = i + 1; j < history.length; j++) {
            if (history[j]._type === 'delta') {
              Object.assign(reconstructedData, history[j]);
            }
          }
          break;
        }
      }
      
      if (reconstructedData) {
        lastSignificantData = reconstructedData;
        console.log('[INIT] Data system initialized successfully');
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

/**
 * Get last significant data
 */
function getLastSignificantData() {
  return lastSignificantData;
}

/**
 * Set last significant data
 */
function setLastSignificantData(data) {
  lastSignificantData = data;
}

/**
 * Function to reconstruct full data from delta records with proper base resolution
 */
function reconstructDeltaData(dataArray) {
  if (!dataArray || dataArray.length === 0) return [];
  
  const reconstructed = [];
  let currentFullData = {};
  
  // If the first record is a delta, we need to find the last full record before it
  // For now, we'll use the global lastSignificantData as base if first is delta
  if (dataArray[0]._type === 'delta' && lastSignificantData) {
    currentFullData = { ...lastSignificantData };
  }
  
  for (const record of dataArray) {
    if (!record._type || record._type !== 'delta') {
      // Full record - use as new base
      currentFullData = { ...record };
    } else {
      // Delta record - apply changes to current base
      currentFullData = { ...currentFullData, ...record };
    }
    
    // Add complete reconstructed record
    reconstructed.push({ ...currentFullData });
  }
  
  return reconstructed;
}

/**
 * Advanced function for history reconstruction that handles proper delta base resolution
 */
async function reconstructDeltaDataWithHistory(dataArray, allHistoryData) {
  if (!dataArray || dataArray.length === 0) return [];
  if (!allHistoryData || allHistoryData.length === 0) return reconstructDeltaData(dataArray);
  
  const reconstructed = [];
  let baseData = {};
  
  // Find the appropriate base record for reconstruction
  const firstRecord = dataArray[0];
  const firstTimestamp = new Date(firstRecord.timestamp);
  
  // Find the last full record before our data range
  for (let i = allHistoryData.length - 1; i >= 0; i--) {
    const historyRecord = allHistoryData[i];
    const historyTimestamp = new Date(historyRecord.timestamp);
    
    if (historyTimestamp < firstTimestamp && (!historyRecord._type || historyRecord._type !== 'delta')) {
      baseData = { ...historyRecord };
      
      // Apply all delta changes between base and first record
      for (let j = i + 1; j < allHistoryData.length; j++) {
        const deltaRecord = allHistoryData[j];
        const deltaTimestamp = new Date(deltaRecord.timestamp);
        
        if (deltaTimestamp >= firstTimestamp) break;
        
        if (deltaRecord._type === 'delta') {
          Object.assign(baseData, deltaRecord);
        } else {
          baseData = { ...deltaRecord };
        }
      }
      break;
    }
  }
  
  // If no base found, use global lastSignificantData
  if (Object.keys(baseData).length === 0 && lastSignificantData) {
    baseData = { ...lastSignificantData };
  }
  
  // Now reconstruct our target data array
  let currentData = baseData;
  
  for (const record of dataArray) {
    if (!record._type || record._type !== 'delta') {
      // Full record
      currentData = { ...record };
    } else {
      // Delta record
      currentData = { ...currentData, ...record };
    }
    
    reconstructed.push({ ...currentData });
  }
  
  return reconstructed;
}

/**
 * File cache for performance
 */
const fileCache = {
  data: null,
  timestamp: 0,
  FILE_CACHE_DURATION: 30000 // 30 seconds
};

/**
 * Read solar data with caching
 */
async function readSolarDataWithCache() {
  const publicDataPath = path.join(__dirname, '../../data/public_data/solars_public.json');
  
  // Check if we need to read file from disk
  let solarData;
  if (!fileCache.data || (Date.now() - fileCache.timestamp) > fileCache.FILE_CACHE_DURATION) {
    const rawData = await fs.readFile(publicDataPath, 'utf8');
    solarData = JSON.parse(rawData);
    
    // Update file cache
    fileCache.data = solarData;
    fileCache.timestamp = Date.now();
  } else {
    solarData = fileCache.data;
  }
  
  return solarData;
}

module.exports = {
  initializeLastSignificantData,
  getLastSignificantData,
  setLastSignificantData,
  resetLastSignificantData,
  reconstructDeltaData,
  reconstructDeltaDataWithHistory,
  readSolarDataWithCache
};
