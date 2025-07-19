/**
 * Delta compression for solar data
 */

/**
 * Create delta record from new data and last data
 */
function createDeltaRecord(newData, lastData) {
  // RULE 1: If Error_code > 0 or Warning_code > 0, save entire object
  if (newData.Error_code > 0 || newData.Warning_code > 0) {
    return { 
      type: 'full', 
      data: newData, 
      reason: `Error=${newData.Error_code}, Warning=${newData.Warning_code}` 
    };
  }

  // RULE 2: If no errors, create delta record
  if (!lastData) {
    return { 
      type: 'full', 
      data: newData, 
      reason: 'First record in file' 
    };
  }

  // Create delta - save only changed fields
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
    }
  }

  if (changesFound === 0) {
    return { 
      type: 'skip', 
      data: null, 
      reason: 'Identical data - blocked' 
    };
  }

  delta._type = 'delta'; // Mark as delta record
  return { 
    type: 'delta', 
    data: delta, 
    reason: `${changesFound} promjena: ${Object.keys(delta).filter(k => !['timestamp', 'local_time', '_type'].includes(k)).join(', ')}` 
  };
}

module.exports = {
  createDeltaRecord
};
