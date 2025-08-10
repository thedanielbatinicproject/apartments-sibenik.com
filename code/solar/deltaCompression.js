/**
 * Delta compression for solar data
 */

/**
 * Create delta record from new data and last data
 */
function createDeltaRecord(newData, lastData) {
  // RULE 1: If error_message_1 > 0 or warning_message_1 > 0, save entire object
  if (newData.error_message_1 > 0 || newData.warning_message_1 > 0) {
    return { 
      type: 'full', 
      data: newData, 
      reason: `Error=${newData.error_message_1}, Warning=${newData.warning_message_1}` 
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
    "pv_charger_voltage",
    "pv_charger_power",
    "pv_charger_radiator_temp",
    "pv_relay",
    "pv_charger_accumulated_day",
    "pv_charger_accumulated_hour",
    "pv_charger_accumulated_minute",
    "charger_total_produced_energy",
    "inverter_work_state",
    "pv_charger_battery_voltage",
    "inverter_battery_voltage",
    "inverter_voltage",
    "inverter_bus_voltage",
    "inverter_current",
    "inverter_load_current",
    "inverter_power",
    "inverter_load_power",
    "inverter_system_load",
    "inverter_ac_radiator_temp",
    "inverter_transformer_temp",
    "inverter_dc_radiator_temp",
    "discharger_total_mwh",
    "discharger_total_kwh",
    "inverter_battery_power",
    "inverter_battery_current",
    "pv_charger_workstate",
    "error_message_1",
    "error_message_2",
    "warning_message_1",
    "inverter_arrow_flag",
    "load_percent",
    "charger_error_message",
    "charger_warning_message"
    // timestamp, local_time, _type se ne uspoređuju jer su meta podaci
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
