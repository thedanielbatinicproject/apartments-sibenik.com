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

  // Use delta compression
  const lastData = getLastSignificantData();
  const deltaResult = createDeltaRecord(completeRealtimeData, lastData);

  // Log file path
  const logPath = path.join(__dirname, '../../data/public_data/solar-app.log');

  // Helper for logging
  async function logToFile(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    try {
      await fs.appendFile(logPath, line);
    } catch (e) {
      // fallback: ignore log error
    }
  }

  if (deltaResult.type === 'skip') {
    const logMsg = `[SKIPPED] ${deltaResult.reason}`;
    console.log(logMsg);
    await logToFile(logMsg);
    return { skipped: true, reason: deltaResult.reason };
  }

  // Read existing data
  let existingData = [];
  try {
    const data = await fs.readFile(publicDataPath, 'utf8');
    existingData = JSON.parse(data);
  } catch (err) {
    // File doesn't exist, start with empty array
    existingData = [];
  }

  // Add new record
  existingData.push(deltaResult.data);

  // Update last significant data
  if (deltaResult.type === 'full') {
    setLastSignificantData(deltaResult.data);
    await logToFile('[FULL] New full record saved.');
  } else if (deltaResult.type === 'delta' && lastData) {
    // Apply delta to create new last significant data
    const updatedData = { ...lastData, ...deltaResult.data };
    setLastSignificantData(updatedData);
    await logToFile('[DELTA] New delta record saved.');
  }

  // Save to file
  await fs.writeFile(publicDataPath, JSON.stringify(existingData, null, 2));
  await logToFile(`[SAVE] Record saved. Total records: ${existingData.length}`);

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
