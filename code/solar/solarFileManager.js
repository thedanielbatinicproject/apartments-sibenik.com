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

  await logToFile('--- saveSolarData called ---');
  await logToFile('incomingData: ' + JSON.stringify(incomingData));

  // Read existing data
  let existingData = [];
  try {
    const data = await fs.readFile(publicDataPath, 'utf8');
    await logToFile('Read solars_public.json: ');
    existingData = JSON.parse(data);
    await logToFile('existingData parsed: ' + JSON.stringify(existingData));
  } catch (err) {
    await logToFile('solars_public.json read error: ' + err.toString());
    // File doesn't exist, start with empty array
    existingData = [];
  }

  // Use delta compression, but if file is empty, always save as full
  let lastData;
  try {
    lastData = getLastSignificantData();
    await logToFile('lastData: ' + JSON.stringify(lastData));
  } catch (e) {
    await logToFile('getLastSignificantData ERROR: ' + e.toString());
    lastData = undefined;
  }

  let deltaResult;
  if (existingData.length === 0) {
    await logToFile('File is empty, saving first record as FULL');
    deltaResult = { type: 'full', data: completeRealtimeData };
  } else {
    try {
      deltaResult = createDeltaRecord(completeRealtimeData, lastData);
      await logToFile('deltaResult: ' + JSON.stringify(deltaResult));
    } catch (e) {
      await logToFile('createDeltaRecord ERROR: ' + e.toString());
      throw e;
    }
  }

  if (deltaResult.type === 'skip') {
    const logMsg = `[SKIPPED] ${deltaResult.reason}`;
    console.log(logMsg);
    await logToFile(logMsg);
    return { skipped: true, reason: deltaResult.reason };
  }

  // Add new record
  await logToFile('Adding new record: ' + JSON.stringify(deltaResult.data));
  existingData.push(deltaResult.data);
  await logToFile('existingData after push: ' + JSON.stringify(existingData));

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
  try {
    await logToFile(`[PRE-SAVE] Attempting to write to solars_public.json. Data length: ${existingData.length}`);
    await logToFile(`[PRE-SAVE] Data to write: ${JSON.stringify(existingData, null, 2)}`);
    await fs.writeFile(publicDataPath, JSON.stringify(existingData, null, 2));
    await logToFile(`[SAVE] Record saved. Total records: ${existingData.length}`);
    // Immediately read back and log file content for verification
    try {
      const verifyData = await fs.readFile(publicDataPath, 'utf8');
      await logToFile(`[POST-SAVE] File content after write: ${verifyData}`);
    } catch (verifyErr) {
      await logToFile(`[POST-SAVE] ERROR reading file after write: ${verifyErr.toString()}`);
    }
  } catch (e) {
    await logToFile('fs.writeFile ERROR: ' + e.toString());
    throw e;
  }

  await logToFile('Returning from saveSolarData');
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
