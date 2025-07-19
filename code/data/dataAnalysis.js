/**
 * Data analysis utilities for solar data
 */

/**
 * Calculate averages for different data fields
 */
function calculateAverages(data, fields) {
  if (!data || data.length === 0) return {};
  
  const averages = {};
  
  for (const field of fields) {
    const validValues = data.filter(record => 
      record[field] != null && !isNaN(record[field])
    );
    
    if (validValues.length > 0) {
      const sum = validValues.reduce((acc, record) => acc + parseFloat(record[field]), 0);
      averages[field] = sum / validValues.length;
    } else {
      averages[field] = 0;
    }
  }
  
  return averages;
}

/**
 * Linear interpolation for missing data points
 */
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

/**
 * Calculate weekly averages for solar data
 */
function calculateWeeklyAverages(data) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
  
  const weeklyData = data.filter(record => {
    const recordTime = new Date(record.timestamp);
    return recordTime >= weekAgo && recordTime <= now;
  });
  
  const fields = ['PV_voltage_V', 'Battery_voltage_V', 'Charger_power_W'];
  const averages = calculateAverages(weeklyData, fields);
  
  return {
    pvVoltage: Math.round(averages.PV_voltage_V * 100) / 100,
    batteryVoltage: Math.round(averages.Battery_voltage_V * 100) / 100,
    chargerPower: Math.round(averages.Charger_power_W * 100) / 100
  };
}

/**
 * Filter data by time range
 */
function filterDataByTimeRange(data, hoursBack) {
  const now = new Date();
  const timeRangeStart = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000));
  
  return data.filter(record => {
    const recordTime = new Date(record.timestamp);
    return recordTime >= timeRangeStart && recordTime <= now;
  }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/**
 * Sample data points evenly for chart display
 */
function sampleDataPoints(data, maxPoints) {
  if (data.length <= maxPoints) return data;
  
  const step = Math.max(1, Math.floor(data.length / maxPoints));
  const sampled = [];
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }
  
  return sampled;
}

/**
 * Extract chart data arrays from records
 */
function extractChartData(records) {
  const timePoints = [];
  const pvVoltage = [];
  const batteryVoltage = [];
  const chargerPower = [];
  
  for (const record of records) {
    timePoints.push(record.timestamp);
    pvVoltage.push(parseFloat(record.PV_voltage_V) || 0);
    batteryVoltage.push(parseFloat(record.Battery_voltage_V) || 0);
    chargerPower.push(parseFloat(record.Charger_power_W) || 0);
  }
  
  return {
    timePoints,
    pvVoltage,
    batteryVoltage,
    chargerPower
  };
}

module.exports = {
  calculateAverages,
  interpolateValue,
  calculateWeeklyAverages,
  filterDataByTimeRange,
  sampleDataPoints,
  extractChartData
};
