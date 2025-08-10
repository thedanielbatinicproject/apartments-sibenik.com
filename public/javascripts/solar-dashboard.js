// Optimized Solar Dashboard JS
// All core functionalities, no duplicates, global functions for HTML onclick

let pvVoltageChart = null;
let batteryVoltageChart = null;
let chargePowerChart = null;
let displayedRecords = 10;
let totalAvailableRecords = 0;
let lastKnownDashboardValues = {};
let lastKnownChartValues = { Bus_voltage_V: null, Battery_voltage_V: null, P_Inverter_W: null };
let lastKnownTableValues = {};

// --- TOOLTIP ---
async function showTooltip(event, title, variableName) {
    const tooltip = document.getElementById('infoTooltip');
    const titleElement = document.getElementById('tooltipTitle');
    const descElement = document.getElementById('tooltipDescription');
    if (!tooltip || !titleElement || !descElement) return;
    titleElement.textContent = title;
    descElement.textContent = 'Loading description...';
    tooltip.style.display = 'block';
    tooltip.style.position = 'fixed';
    tooltip.style.transform = 'none';
    const rect = event.target.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 10) + 'px';
    try {
        const response = await fetch(`/management/api/variable-description/${encodeURIComponent(variableName)}`, {
            headers: { 'x-api-key': window.API_SECRET }
        });
        const data = await response.json();
        descElement.textContent = (data.success && data.description) ? data.description : 'No description available';
    } catch {
        descElement.textContent = 'Error loading description';
    }
}
function hideTooltip() {
    const tooltip = document.getElementById('infoTooltip');
    if (tooltip) tooltip.style.display = 'none';
}

// --- TABLE ---
function loadMoreData() {
    const button = document.getElementById('loadMoreBtn');
    const tbody = document.getElementById('historyTableBody');
    if (!button || !tbody) return;
    button.disabled = true;
    button.textContent = 'Loading...';
    fetch(`/management/api/solar-data/load-more?offset=${displayedRecords}&limit=10`, {
        method: 'GET', headers: { 'x-api-key': window.API_SECRET }
    })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.data.length > 0) {
            data.data.forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(record.timestamp).toLocaleString()}</td>
                    <td>${record.Bus_voltage_V ?? '-'}</td>
                    <td>${record.Battery_voltage_V ?? '-'}</td>
                    <td>${record.P_Inverter_W ?? '-'}</td>
                    <td>${record.P_Load_W ?? '-'}</td>
                    <td>${record.P_Grid_W ?? '-'}</td>`;
                tbody.appendChild(row);
            });
            displayedRecords += data.data.length;
            if (!data.hasMore || data.data.length < 10) button.style.display = 'none';
            else { button.disabled = false; button.textContent = 'Load More Data'; }
        } else button.style.display = 'none';
    })
    .catch(() => { button.disabled = false; button.textContent = 'Load More Data'; });
}

// --- CHARTS ---
function updateAllCharts(data) {
    if (!data) return;
    // Destroy existing charts
    if (pvVoltageChart) pvVoltageChart.destroy();
    if (batteryVoltageChart) batteryVoltageChart.destroy();
    if (chargePowerChart) chargePowerChart.destroy();
    // Prepare data
    const labels = data.timePoints.map(time => new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    // Bus Voltage Chart
    const pvCtx = document.getElementById('pvVoltageChart');
    if (pvCtx) {
        pvVoltageChart = new Chart(pvCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Bus Voltage [V]',
                        data: data.busVoltage,
                        borderColor: '#FF6B6B',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 1,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Weekly Average',
                        data: Array(labels.length).fill(data.weeklyAverages?.busVoltage || 0),
                        borderColor: 'rgba(128, 128, 128, 0.9)',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        tension: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            color: '#fff',
                        }
                    },
                    y: {
                        min: 390, max: 410,
                        ticks: {
                            color: '#fff',
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                        }
                    }
                }
            }
        });
    }
    // Battery Voltage Chart
    const batteryCtx = document.getElementById('batteryVoltageChart');
    if (batteryCtx) {
        batteryVoltageChart = new Chart(batteryCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Battery Voltage [V]',
                        data: data.batteryVoltage,
                        borderColor: '#4ECDC4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 1,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Weekly Average',
                        data: Array(labels.length).fill(data.weeklyAverages?.batteryVoltage || 0),
                        borderColor: 'rgba(128, 128, 128, 0.9)',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        tension: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            color: '#fff',
                        }
                    },
                    y: {
                        min: 5, max: 15,
                        ticks: {
                            color: '#fff',
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                        }
                    }
                }
            }
        });
    }
    // Inverter Power Chart
    const powerCtx = document.getElementById('chargePowerChart');
    if (powerCtx) {
        chargePowerChart = new Chart(powerCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Inverter Power [W]',
                        data: data.inverterPower,
                        borderColor: '#45B7D1',
                        backgroundColor: 'rgba(69, 183, 209, 0.1)',
                        tension: 0.4,
                        borderWidth: 2,
                        pointRadius: 1,
                        pointHoverRadius: 4
                    },
                    {
                        label: 'Weekly Average',
                        data: Array(labels.length).fill(data.weeklyAverages?.inverterPower || 0),
                        borderColor: 'rgba(128, 128, 128, 0.9)',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        tension: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        ticks: {
                            color: '#fff',
                        }
                    },
                    y: {
                        min: 0, max: 1000,
                        ticks: {
                            color: '#fff',
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#fff',
                        }
                    }
                }
            }
        });
    }
    checkChartLimitsAndApplyStyles();
}

function loadAllCharts(timeRange) {
    document.cookie = `chartTimeRange=${timeRange}; path=/; max-age=${30*24*60*60}`;
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.classList.remove('active');
        const btnText = btn.textContent.toLowerCase();
        if ((timeRange === '1h' && btnText.includes('1 hour')) ||
            (timeRange === '6h' && btnText.includes('6 hours')) ||
            (timeRange === '12h' && btnText.includes('12 hours')) ||
            (timeRange === '24h' && btnText.includes('24 hours'))) btn.classList.add('active');
    });
    fetch(`/api/solar/chart-data?range=${timeRange}`, { headers: { 'x-api-key': window.API_SECRET } })
    .then(r => r.json())
    .then(data => {
        if (data.success && data.data) updateAllCharts(data.data);
        else if (data.success && data.timePoints && data.busVoltage) {
            updateAllCharts({
                timePoints: data.timePoints,
                busVoltage: data.busVoltage,
                batteryVoltage: data.batteryVoltage,
                inverterPower: data.inverterPower,
                weeklyAverages: data.weeklyAverages
            });
        }
    });
}
function loadChartByRange(timeRange) { loadAllCharts(timeRange); }

// --- EXPORT ---
function exportJsonData() {
    const button = document.getElementById('exportBtn');
    if (!button) return;
    button.disabled = true;
    button.textContent = 'Exporting...';
    const now = new Date();
    const dateString = `${String(now.getDate()).padStart(2,'0')}.${String(now.getMonth()+1).padStart(2,'0')}.${now.getFullYear()}`;
    const timeString = `${String(now.getHours()).padStart(2,'0')}h${String(now.getMinutes()).padStart(2,'0')}m${String(now.getSeconds()).padStart(2,'0')}s`;
    const filename = `SOLAR-EXPORT-${dateString}-${timeString}.json`;
    fetch('/api/export-solar-data', { method: 'GET', headers: { 'Content-Type': 'application/json' } })
    .then(r => { if (!r.ok) throw new Error('Export failed'); return r.blob(); })
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        button.disabled = false;
        button.textContent = 'EXPORT JSON DATA';
    })
    .catch(() => { button.disabled = false; button.textContent = 'EXPORT JSON DATA'; });
}

// --- ALERT ---
function showCustomAlert(message) {
    const alertModal = document.createElement('div');
    alertModal.className = 'modal';
    alertModal.style.display = 'block';
    alertModal.innerHTML = `<div class=\"modal-content\" style=\"max-width: 400px; text-align: center;\"><div class=\"modal-body\" style=\"padding: 2rem;\"><div style=\"color: #fff; font-size: 1.1rem; margin-bottom: 1.5rem; line-height: 1.4;\">${message}</div><button onclick=\"this.closest('.modal').remove()\" class=\"btn-primary\" style=\"min-width: 100px;\">OK</button></div></div>`;
    document.body.appendChild(alertModal);
    alertModal.onclick = function(event) { if (event.target === alertModal) alertModal.remove(); };
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function initializeLastKnownDashboardValues(latestDataFromServer) {
    if (!latestDataFromServer) return;
    const allDashboardVariables = [
        'Machine_type_high', 'Machine_type_low', 'Serial_number_high', 'Serial_number_low',
        'Hardware_version', 'Software_version', 'Protocol_version',
        'AC_voltage_grade', 'Rated_power_VA',
        'Battery_voltage_V', 'Inverter_voltage_V', 'Grid_voltage_V', 'Bus_voltage_V',
        'Control_current_A', 'Inverter_current_A', 'Grid_current_A', 'Load_current_A',
        'P_Inverter_W', 'P_Grid_W', 'P_Load_W', 'Load_percent',
        'S_Inverter_VA', 'S_Grid_VA', 'S_Load_VA',
        'Q_Inverter_var', 'Q_Grid_var', 'Q_Load_var',
        'Inverter_freq_Hz', 'Grid_freq_Hz',
        'Inverter_max_number', 'Combine_type', 'Inverter_number',
        'AC_radiator_temp_C', 'Transformer_temp_C', 'DC_radiator_temp_C',
        'Inverter_relay_state', 'Grid_relay_state', 'Load_relay_state',
        'N_Line_relay_state', 'DC_relay_state', 'Earth_relay_state',
        'Accum_charger_power_total_KWH', 'Accum_discharger_power_total_KWH',
        'Accum_buy_power_total_KWH', 'Accum_sell_power_total_KWH',
        'Accum_load_power_total_KWH', 'Accum_selfuse_power_total_KWH',
        'Accum_PVsell_power_total_KWH', 'Accum_grid_charger_power_total_KWH',
        'Error_message_1', 'Error_message_2', 'Error_message_3',
        'Warning_message_1', 'Warning_message_2',
        'Batt_serial_high', 'Batt_serial_low', 'Batt_hardware_version', 'Batt_software_version',
        'Batt_power_W', 'Batt_current_A', 'Batt_voltage_grade_V',
        'Batt_rated_power_W', 'Batt_protocol_version'
    ];
    allDashboardVariables.forEach(variable => {
        if (latestDataFromServer[variable] !== undefined && latestDataFromServer[variable] !== null) {
            lastKnownDashboardValues[variable] = latestDataFromServer[variable];
            const elementId = variable.toLowerCase().replace(/_/g, '-');
            const element = document.getElementById(elementId);
            if (element && (!element.textContent || element.textContent.trim() === '')) {
                element.textContent = latestDataFromServer[variable];
            }
        }
    });
}

function checkChartLimitsAndApplyStyles() {
    const limits = {
        busVoltage: { min: 390, max: 410 },
        batteryVoltage: { min: 5, max: 15 },
        inverterPower: { min: 0, max: 1000 }
    };
    let busExceeded = false, batteryExceeded = false, powerExceeded = false;
    if (pvVoltageChart && pvVoltageChart.data && pvVoltageChart.data.datasets[0]) {
        const displayedBusData = pvVoltageChart.data.datasets[0].data || [];
        busExceeded = displayedBusData.some(value => value < limits.busVoltage.min || value > limits.busVoltage.max);
    }
    if (batteryVoltageChart && batteryVoltageChart.data && batteryVoltageChart.data.datasets[0]) {
        const displayedBatteryData = batteryVoltageChart.data.datasets[0].data || [];
        batteryExceeded = displayedBatteryData.some(value => value < limits.batteryVoltage.min || value > limits.batteryVoltage.max);
    }
    if (chargePowerChart && chargePowerChart.data && chargePowerChart.data.datasets[0]) {
        const displayedPowerData = chargePowerChart.data.datasets[0].data || [];
        powerExceeded = displayedPowerData.some(value => value < limits.inverterPower.min || value > limits.inverterPower.max);
    }
    const chartContainers = document.querySelectorAll('.chart-container');
    if (chartContainers[0]) chartContainers[0].classList.toggle('chart-warning', busExceeded);
    if (chartContainers[1]) chartContainers[1].classList.toggle('chart-warning', batteryExceeded);
    if (chartContainers[2]) chartContainers[2].classList.toggle('chart-warning', powerExceeded);
}

function initializeSocketIO(socket) {
    socket.on('connect', () => console.log('Socket.IO connected successfully'));
    socket.on('disconnect', () => console.log('Socket.IO disconnected'));
    socket.on('solarDataUpdate', (data) => updateDashboard(data));
}


window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;
window.loadMoreData = loadMoreData;
window.loadAllCharts = loadAllCharts;
window.exportJsonData = exportJsonData;
window.loadChartByRange = loadChartByRange;
window.showCustomAlert = showCustomAlert;
window.initializeSocketIO = initializeSocketIO;
window.checkChartLimitsAndApplyStyles = checkChartLimitsAndApplyStyles;
window.initializeLastKnownDashboardValues = initializeLastKnownDashboardValues;
window.updateAllCharts = updateAllCharts;

document.addEventListener('DOMContentLoaded', function() {
    fetch('/management/api/solar-data/latest', {
        headers: { 'x-api-key': window.API_SECRET }
    })
    .then(async res => {
        if (!res.ok) throw new Error('Server error: ' + await res.text());
        return res.json();
    })
    .then(result => {
        if (result.success && result.data) initializeLastKnownDashboardValues(result.data);
    })
    .catch(err => console.error('Error fetching latest data:', err));
});