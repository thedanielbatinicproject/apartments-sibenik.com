/**
 * Solar Data Mapper - Maps new Arduino format to legacy format for compatibility
 */

/**
 * Maps new Arduino format to legacy format variable names
 */
const VARIABLE_MAPPING = {
  // Basic voltages (legacy -> new)
  'PV_voltage_V': 'Bus_voltage_V',           // Using Bus voltage as PV equivalent
  'Battery_voltage_V': 'Battery_voltage_V',  // Same name
  'Grid_voltage_V': 'Grid_voltage_V',        // Same name
  'Inverter_voltage_V': 'Inverter_voltage_V', // Same name

  // Currents (legacy -> new)
  'Charger_current_A': 'Control_current_A',   // Using control current as charger equivalent
  'Load_current_A': 'Load_current_A',         // Same name
  'Grid_current_A': 'Grid_current_A',         // Same name
  'Inverter_current_A': 'Inverter_current_A', // Same name

  // Powers (legacy -> new)
  'Charger_power_W': 'P_Grid_W',              // Using grid power as charger equivalent
  'Load_power_W': 'P_Load_W',                 // Same concept
  'Grid_power_W': 'P_Grid_W',                 // Same name
  'Inverter_power_W': 'P_Inverter_W',         // Same name

  // System info
  'Load_percent': 'Load_percent',             // Same name

  // Temperatures
  'Temperature_C': 'AC_radiator_temp_C',      // Using AC radiator temp as main temp
  'Transformer_temp_C': 'Transformer_temp_C', // Same name
  'DC_radiator_temp_C': 'DC_radiator_temp_C', // Same name

  // Frequencies
  'AC_freq_Hz': 'Grid_freq_Hz',               // Map old AC_freq_Hz to new Grid_freq_Hz
  'Grid_freq_Hz': 'Grid_freq_Hz',             // Same name
  'Inverter_freq_Hz': 'Inverter_freq_Hz',     // Same name

  // Temperature mappings for old variables used in dashboard
  'Radiator_temp_C': 'AC_radiator_temp_C',    // Map old radiator temp
  'External_temp_C': 'Transformer_temp_C',    // Map external temp to transformer temp
  'Temp_cabinet_C': 'DC_radiator_temp_C',     // Map cabinet temp to DC radiator

  // Power mappings for old dashboard variables
  'DC_current_A': 'Control_current_A',        // Map old DC current
  'DC_voltage_V': 'Bus_voltage_V',            // Map old DC voltage to bus voltage
  'DC_power_W': 'P_Grid_W',                   // Map old DC power 
  'AC_power_W': 'P_Inverter_W',               // Map old AC power to inverter power

  // Legacy system variables still used in dashboard
  'Battery_relay': 'DC_relay_state',          // Map battery relay to DC relay
  'PV_relay': 'Grid_relay_state',             // Map PV relay to grid relay
  'Error_code': 'Error_message_1',            // Map error code
  'Warning_code': 'Warning_message_1',        // Map warning code
  'Status': 'Machine_type_high',              // Map status to machine type
  'Batt_voltage_grade': 'Batt_voltage_grade_V', // Battery voltage grade

  // Additional legacy variables
  'Accum_power_high': 'Accum_charger_power_total_KWH', // Legacy accumulated power
  'Accum_power_low': 'Accum_discharger_power_total_KWH', // Legacy accumulated power
  'Accum_time_days': 'Accum_time_days',       // Same name if exists
  'Accum_time_hours': 'Accum_time_hours',     // Same name if exists  
  'Accum_time_minutes': 'Accum_time_minutes', // Same name if exists
  'Serial_high': 'Serial_number_high',        // Serial number high part
  'Serial_low': 'Serial_number_low',          // Serial number low part
  'HW_version': 'Hardware_version',           // Hardware version
  'FW_version': 'Software_version',           // Firmware/software version
  'Cal_PV_coeff': 'Cal_PV_coeff',             // Calibration coefficient
  'Cal_Batt_coeff': 'Cal_Batt_coeff',         // Battery calibration coefficient
  'Rated_current_A': 'Rated_current_A',       // Rated current

  // Accumulated energy (new comprehensive data)
  'Total_charger_power_KWH': 'Accum_charger_power_total_KWH',
  'Total_discharger_power_KWH': 'Accum_discharger_power_total_KWH', 
  'Total_buy_power_KWH': 'Accum_buy_power_total_KWH',
  'Total_sell_power_KWH': 'Accum_sell_power_total_KWH',
  'Total_load_power_KWH': 'Accum_load_power_total_KWH',
  'Total_selfuse_power_KWH': 'Accum_selfuse_power_total_KWH',
  'Total_PVsell_power_KWH': 'Accum_PVsell_power_total_KWH',
  'Total_grid_charger_power_KWH': 'Accum_grid_charger_power_total_KWH',

  // Battery data
  'Batt_power_W': 'Batt_power_W',             // Same name
  'Batt_current_A': 'Batt_current_A',         // Same name
  'Batt_voltage_V': 'Batt_voltage_grade_V',   // Using battery voltage grade

  // System status
  'Machine_type': 'Machine_type_high',        // Using high part
  'Serial_number': 'Serial_number_high',      // Using high part
  'Hardware_version': 'Hardware_version',     // Same name
  'Software_version': 'Software_version',     // Same name

  // Relay states
  'Inverter_relay': 'Inverter_relay_state',
  'Grid_relay': 'Grid_relay_state',
  'Load_relay': 'Load_relay_state',
  'DC_relay': 'DC_relay_state',
  'Earth_relay': 'Earth_relay_state',

  // Errors and warnings
  'Error_1': 'Error_message_1',
  'Error_2': 'Error_message_2', 
  'Error_3': 'Error_message_3',
  'Warning_1': 'Warning_message_1',
  'Warning_2': 'Warning_message_2'
};

/**
 * Reverse mapping (new -> legacy) for incoming data processing
 */
const REVERSE_MAPPING = {};
Object.keys(VARIABLE_MAPPING).forEach(legacy => {
  const newVar = VARIABLE_MAPPING[legacy];
  REVERSE_MAPPING[newVar] = legacy;
});

/**
 * Maps new Arduino format data to legacy format for dashboard compatibility
 * @param {Object} newData - Data in new Arduino format
 * @returns {Object} Data in legacy format
 */
function mapNewToLegacy(newData) {
  const legacyData = { ...newData }; // Start with all original data
  
  // Map new variables to legacy names
  Object.keys(REVERSE_MAPPING).forEach(newVar => {
    if (newData.hasOwnProperty(newVar)) {
      const legacyVar = REVERSE_MAPPING[newVar];
      legacyData[legacyVar] = newData[newVar];
    }
  });

  return legacyData;
}

/**
 * Maps legacy format data to new Arduino format
 * @param {Object} legacyData - Data in legacy format
 * @returns {Object} Data in new Arduino format
 */
function mapLegacyToNew(legacyData) {
  const newData = { ...legacyData }; // Start with all original data
  
  // Map legacy variables to new names
  Object.keys(VARIABLE_MAPPING).forEach(legacyVar => {
    if (legacyData.hasOwnProperty(legacyVar)) {
      const newVar = VARIABLE_MAPPING[legacyVar];
      newData[newVar] = legacyData[legacyVar];
    }
  });

  return newData;
}

/**
 * Gets variable description for tooltips and help
 * @param {string} variableName - Variable name (legacy or new format)
 * @returns {string} Description of the variable
 */
function getVariableDescription(variableName) {
  const descriptions = {
    // Voltage descriptions
    'PV_voltage_V': 'Photovoltaic panel DC voltage output',
    'Battery_voltage_V': 'Current battery bank voltage level',
    'Grid_voltage_V': 'AC grid voltage from utility connection',
    'Inverter_voltage_V': 'AC voltage output from inverter',
    'Bus_voltage_V': 'DC bus voltage level in the system',
    
    // Current descriptions
    'Charger_current_A': 'Battery charging current from solar panels',
    'Load_current_A': 'Current consumption by connected loads',
    'Grid_current_A': 'Current draw/feed from/to utility grid',
    'Inverter_current_A': 'AC current output from inverter',
    'Control_current_A': 'System control circuit current',
    
    // Power descriptions
    'Charger_power_W': 'Power being used to charge batteries',
    'Load_power_W': 'Total power consumption by connected loads',
    'Grid_power_W': 'Power exchange with utility grid (+ = buying, - = selling)',
    'Inverter_power_W': 'AC power output from inverter to loads',
    'P_Inverter_W': 'Real power output from inverter',
    'P_Grid_W': 'Real power exchange with grid',
    'P_Load_W': 'Real power consumed by loads',
    
    // System status
    'Load_percent': 'Current load as percentage of rated capacity',
    'Temperature_C': 'Main system operating temperature',
    'AC_radiator_temp_C': 'AC section heat sink temperature',
    'Transformer_temp_C': 'Transformer winding temperature',
    'DC_radiator_temp_C': 'DC section heat sink temperature',
    
    // Frequency
    'AC_freq_Hz': 'AC grid frequency (should be ~50Hz) - legacy variable',
    'Grid_freq_Hz': 'AC grid frequency (should be ~50Hz)',
    'Inverter_freq_Hz': 'Inverter output frequency',
    
    // Temperature descriptions (including legacy mappings)
    'Radiator_temp_C': 'System radiator/heat sink temperature',
    'External_temp_C': 'External environmental temperature sensor',
    'Temp_cabinet_C': 'Internal cabinet/enclosure temperature',
    
    // Power and electrical (legacy mappings)
    'DC_current_A': 'DC circuit current measurement',
    'DC_voltage_V': 'DC bus/circuit voltage measurement', 
    'DC_power_W': 'DC circuit power measurement',
    'AC_power_W': 'AC circuit power measurement',
    
    // System status (legacy)
    'Battery_relay': 'Battery connection relay status',
    'PV_relay': 'Photovoltaic connection relay status',
    'Error_code': 'System error code indicator',
    'Warning_code': 'System warning code indicator',
    'Status': 'Overall system operational status',
    'Batt_voltage_grade': 'Battery system voltage rating/grade',
    
    // Legacy accumulated data
    'Accum_power_high': 'Accumulated power total (high value)',
    'Accum_power_low': 'Accumulated power total (low value)',
    'Accum_time_days': 'Total accumulated operational days',
    'Accum_time_hours': 'Total accumulated operational hours',
    'Accum_time_minutes': 'Total accumulated operational minutes',
    'Serial_high': 'Device serial number (high part)',
    'Serial_low': 'Device serial number (low part)',
    'HW_version': 'Hardware version/revision number',
    'FW_version': 'Firmware/software version number',
    'Cal_PV_coeff': 'Photovoltaic calibration coefficient',
    'Cal_Batt_coeff': 'Battery measurement calibration coefficient',
    'Rated_current_A': 'System rated current capacity',
    
    // Energy totals
    'Total_charger_power_KWH': 'Total energy used for battery charging',
    'Total_discharger_power_KWH': 'Total energy discharged from batteries',
    'Total_buy_power_KWH': 'Total energy purchased from grid',
    'Total_sell_power_KWH': 'Total energy sold to grid',
    'Total_load_power_KWH': 'Total energy consumed by loads',
    'Total_selfuse_power_KWH': 'Total solar energy used directly',
    'Total_PVsell_power_KWH': 'Total solar energy sold to grid',
    'Total_grid_charger_power_KWH': 'Total grid energy used for charging',
    
    // Battery info
    'Batt_power_W': 'Battery charge/discharge power (+ = charging, - = discharging)',
    'Batt_current_A': 'Battery current (+ = charging, - = discharging)',
    'Batt_voltage_V': 'Battery pack voltage measurement',
    'Batt_voltage_grade_V': 'Battery system voltage rating',
    
    // System info
    'Machine_type': 'Inverter model/type identifier',
    'Serial_number': 'Device serial number',
    'Hardware_version': 'Hardware revision number',
    'Software_version': 'Firmware version number',
    
    // Relay states
    'Inverter_relay': 'Inverter connection relay status',
    'Grid_relay': 'Grid connection relay status',
    'Load_relay': 'Load connection relay status',
    'DC_relay': 'DC circuit relay status',
    'Earth_relay': 'Earth/ground relay status',
    
    // Error states
    'Error_1': 'Primary error status code',
    'Error_2': 'Secondary error status code',
    'Error_3': 'Tertiary error status code',
    'Warning_1': 'Primary warning status code',
    'Warning_2': 'Secondary warning status code'
  };
  
  return descriptions[variableName] || 'No description available';
}

module.exports = {
  VARIABLE_MAPPING,
  REVERSE_MAPPING,
  mapNewToLegacy,
  mapLegacyToNew,
  getVariableDescription
};
