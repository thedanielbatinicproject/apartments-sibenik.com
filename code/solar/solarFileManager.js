const fs = require('fs').promises;
const path = require('path');
const { createDeltaRecord } = require('./deltaCompression');
const { getLastSignificantData, setLastSignificantData } = require('./solarDataManager');

/**
 * Save solar data to file with delta compression
 */
async function saveSolarData(incomingData) {
  const publicDataPath = path.join(__dirname, '../../data/public_data/solars_public.json');
  
  // Generate timestamp and local time
  const now = new Date();
  const completeRealtimeData = {
    ...incomingData,
    timestamp: now.toISOString(),
    local_time: now.toLocaleString('hr-HR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  };



  // Read existing data
  let existingData = [];
  try {
    const data = await fs.readFile(publicDataPath, 'utf8');
    existingData = JSON.parse(data);
  } catch (err) {
    // File doesn't exist, start with empty array
    existingData = [];
  }

  // Use delta compression, but if file is empty, always save as full
  let lastData;
  try {
    lastData = getLastSignificantData();
  } catch (e) {
    lastData = undefined;
  }

  let deltaResult;
  if (existingData.length === 0) {
    deltaResult = { type: 'full', data: completeRealtimeData };
  } else {
    try {
      deltaResult = createDeltaRecord(completeRealtimeData, lastData);
    } catch (e) {
      throw e;
    }
  }

  if (deltaResult.type === 'skip') {
    return { skipped: true, reason: deltaResult.reason };
  }

  // Add new record
  existingData.push(deltaResult.data);

  // Update last significant data
  if (deltaResult.type === 'full') {
    setLastSignificantData(deltaResult.data);
  } else if (deltaResult.type === 'delta' && lastData) {
    // Apply delta to create new last significant data
    const updatedData = { ...lastData, ...deltaResult.data };
    setLastSignificantData(updatedData);
  }

  // Save to file

  try {
    await fs.writeFile(publicDataPath, JSON.stringify(existingData, null, 2));
  } catch (e) {
    throw e;
  }

  return { 
    saved: true, 
    type: deltaResult.type,
    recordsCount: existingData.length,
    completeData: deltaResult.type === 'full' ? deltaResult.data : { ...lastData, ...deltaResult.data }
  };

}

/**
 * Read solar data from file
 */
async function readSolarData() {
  const publicDataPath = path.join(__dirname, '../../data/public_data/solars_public.json');
  
  try {
    const rawData = await fs.readFile(publicDataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (err) {
    throw new Error('No solar data found');
  }
}

/**
 * Export solar data for download
 */
async function exportSolarData() {
  const publicDataPath = path.join(__dirname, '../../data/public_data/solars_public.json');
  
  // Check if file exists
  try {
    await fs.access(publicDataPath);
  } catch (error) {
    throw new Error('Solar data file not found');
  }
  
  // Read the file
  const fileContent = await fs.readFile(publicDataPath, 'utf8');
  return fileContent;
}

module.exports = {
  saveSolarData,
  readSolarData,
  exportSolarData
};
