const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Cache for relay states
let relayStatesCache = {
  relay1: false,
  relay2: false,
  relay3: false,
  relay4: false
};

let lastUpdateTime = 0;
let fileWatcher = null;
let ioInstance = null;

/**
 * Get the path to relay states file
 */
function getRelayStatesPath() {
  return path.join(__dirname, '../../data/public_data/relay_states.json');
}

/**
 * Initialize relay states from file or create default
 */
async function initializeRelayStates() {
  try {
    const relayStatesPath = getRelayStatesPath();
    const data = await fs.readFile(relayStatesPath, 'utf8');
    const states = JSON.parse(data);
    
    relayStatesCache = {
      relay1: states.relay1 || false,
      relay2: states.relay2 || false,
      relay3: states.relay3 || false,
      relay4: states.relay4 || false
    };
    
    lastUpdateTime = states.lastUpdate || Date.now();
  } catch (error) {
    // File doesn't exist, create with defaults
    lastUpdateTime = Date.now();
    try {
      await saveRelayStates();
    } catch (saveError) {
      console.error('[RELAY] Error creating default relay states file:', saveError);
      throw saveError;
    }
  }
}

/**
 * Get current relay states
 */
function getRelayStates() {
  return {
    ...relayStatesCache,
    lastUpdate: lastUpdateTime
  };
}

/**
 * Update relay states
 */
async function updateRelayStates(newStates) {
  // Update only provided states
  if (typeof newStates.relay1 !== 'undefined') relayStatesCache.relay1 = newStates.relay1;
  if (typeof newStates.relay2 !== 'undefined') relayStatesCache.relay2 = newStates.relay2;
  if (typeof newStates.relay3 !== 'undefined') relayStatesCache.relay3 = newStates.relay3;
  if (typeof newStates.relay4 !== 'undefined') relayStatesCache.relay4 = newStates.relay4;
  
  lastUpdateTime = Date.now();
  
  // Save to file
  await saveRelayStates();
  
  return getRelayStates();
}

/**
 * Save relay states to file
 */
async function saveRelayStates() {
  try {
    const relayStatesPath = getRelayStatesPath();
    const data = {
      ...relayStatesCache,
      lastUpdate: lastUpdateTime
    };
    
    await fs.writeFile(relayStatesPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('[RELAY] Error saving relay states:', error);
    throw error;
  }
}

/**
 * Set specific relay state
 */
async function setRelayState(relayNumber, state) {
  const relayKey = `relay${relayNumber}`;
  if (relayStatesCache.hasOwnProperty(relayKey)) {
    return await updateRelayStates({ [relayKey]: state });
  } else {
    throw new Error(`Invalid relay number: ${relayNumber}`);
  }
}

/**
 * Toggle specific relay state
 */
async function toggleRelayState(relayNumber) {
  const relayKey = `relay${relayNumber}`;
  if (relayStatesCache.hasOwnProperty(relayKey)) {
    const currentState = relayStatesCache[relayKey];
    return await updateRelayStates({ [relayKey]: !currentState });
  } else {
    throw new Error(`Invalid relay number: ${relayNumber}`);
  }
}

/**
 * Set Socket.IO instance for real-time updates
 */
function setSocketIO(io) {
  ioInstance = io;
}

/**
 * Start file watcher for relay_states.json
 */
function startFileWatcher() {
  if (fileWatcher) {
    return;
  }

  const relayStatesPath = getRelayStatesPath();
  
  try {
    fileWatcher = fsSync.watch(relayStatesPath, (eventType, filename) => {
      if (eventType === 'change') {
        reloadRelayStatesFromFile();
      }
    });
  } catch (error) {
    console.error('[RELAY] Error starting file watcher:', error);
  }
}

/**
 * Stop file watcher
 */
function stopFileWatcher() {
  if (fileWatcher) {
    fileWatcher.close();
    fileWatcher = null;
  }
}

/**
 * Reload relay states from file and emit Socket.IO update
 */
async function reloadRelayStatesFromFile() {
  try {
    const relayStatesPath = getRelayStatesPath();
    const data = await fs.readFile(relayStatesPath, 'utf8');
    const fileStates = JSON.parse(data);
    
    // Check if states actually changed
    const hasChanged = 
      relayStatesCache.relay1 !== fileStates.relay1 ||
      relayStatesCache.relay2 !== fileStates.relay2 ||
      relayStatesCache.relay3 !== fileStates.relay3 ||
      relayStatesCache.relay4 !== fileStates.relay4;
    
    if (hasChanged) {
      // Update cache
      relayStatesCache = {
        relay1: fileStates.relay1 || false,
        relay2: fileStates.relay2 || false,
        relay3: fileStates.relay3 || false,
        relay4: fileStates.relay4 || false
      };
      
      lastUpdateTime = fileStates.lastUpdate || Date.now();
      
      // Emit Socket.IO update if available
      if (ioInstance) {
        const currentStates = getRelayStates();
        ioInstance.emit('relayStatesUpdate', currentStates);
      }
    }
  } catch (error) {
    console.error('[RELAY] Error reloading relay states from file:', error);
  }
}

module.exports = {
  initializeRelayStates,
  getRelayStates,
  updateRelayStates,
  setRelayState,
  toggleRelayState,
  setSocketIO,
  startFileWatcher,
  stopFileWatcher
};
