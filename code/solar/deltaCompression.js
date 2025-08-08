/**
 * Delta compression for solar data
 */

/**
 * Create delta record from new data and last data
 */
function createDeltaRecord(newData, lastData) {
  // RULE 1: If Error_message_1 > 0 or Warning_message_1 > 0, save entire object
  if (newData.Error_message_1 > 0 || newData.Warning_message_1 > 0) {
    return { 
      type: 'full', 
      data: newData, 
      reason: `Error=${newData.Error_message_1}, Warning=${newData.Warning_message_1}` 
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
    // New Arduino format variable names
    'Battery_voltage_V', 'Inverter_voltage_V', 'Grid_voltage_V', 'Bus_voltage_V',
    'Control_current_A', 'Inverter_current_A', 'Grid_current_A', 'Load_current_A',
    'P_Inverter_W', 'P_Grid_W', 'P_Load_W', 'Load_percent',
    'S_Inverter_VA', 'S_Grid_VA', 'S_Load_VA',
    'Q_Inverter_var', 'Q_Grid_var', 'Q_Load_var',
    'Inverter_freq_Hz', 'Grid_freq_Hz',
    'AC_radiator_temp_C', 'Transformer_temp_C', 'DC_radiator_temp_C',
    'Inverter_relay_state', 'Grid_relay_state', 'Load_relay_state', 
    'N_Line_relay_state', 'DC_relay_state', 'Earth_relay_state',
    'Error_message_1', 'Error_message_2', 'Error_message_3',
    'Warning_message_1', 'Warning_message_2',
    'Machine_type_high', 'Batt_power_W', 'Batt_current_A',
    'relay1', 'relay2', 'relay3', 'relay4'
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
