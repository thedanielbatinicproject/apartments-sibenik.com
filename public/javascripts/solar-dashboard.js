// --- ALERT BOXES ---
async function showDashboardAlerts(latestData) {
    // Inverter alert container
    const inverterContainer = document.getElementById('inverter-messages-alerts');
    if (inverterContainer) inverterContainer.innerHTML = '';
    // Charger alert container
    const chargerContainer = document.getElementById('charger-messages-alerts');
    if (chargerContainer) chargerContainer.innerHTML = '';

    // --- INVERTER ---
    const inverterVars = [
        { variable: 'error_message_1', dictKey: 'inverter_errors1', type: 'error' },
        { variable: 'error_message_2', dictKey: 'inverter_errors2', type: 'error' },
        { variable: 'warning_message_1', dictKey: 'inverter_warnings1', type: 'warning' }
    ];
    let inverterAlerts = [];
    for (const { variable, dictKey, type } of inverterVars) {
        const value = latestData[variable];
        if (!value || value === 0) continue;
        const n = Number(value);
        if (isNaN(n)) continue;
        // Fetch mapping via API
        let dict = {};
        try {
            const resp = await fetch(`/management/api/variable-description/${dictKey}`);
            const data = await resp.json();
            if (data && data.codes) dict = data.codes;
            else if (data && data.mapping) dict = data.mapping;
        } catch {}
        console.debug(`[${variable}] value:`, value, '| dictKey:', dictKey, '| dict:', dict);
        const bits = n.toString(2).split('').reverse();
        bits.forEach((bit, idx) => {
            if (bit === '1') {
                const msg = dict[String(idx)] || `Nepoznat kod: ${idx}`;
                if (!dict.hasOwnProperty(String(idx))) {
                    console.warn(`[${variable}] Nepoznat kod:`, idx, '| Dostupni kodovi:', Object.keys(dict));
                }
                inverterAlerts.push({ type, code: idx, message: msg });
            }
        });
    }
    if (inverterContainer && inverterAlerts.length > 0) {
        inverterAlerts.forEach(alert => {
            const box = document.createElement('div');
            box.className = `dashboard-alert-box dashboard-alert-${alert.type}`;
            box.innerHTML = `<span class="dashboard-alert-code">${alert.code}</span> ${alert.message}`;
            inverterContainer.appendChild(box);
        });
    }

    // --- CHARGER ---
    const chargerVars = [
        { variable: 'charger_error_message', dictKey: 'charger_errors', type: 'error' },
        { variable: 'charger_warning_message', dictKey: 'charger_warnings', type: 'warning' }
    ];
    let chargerAlerts = [];
    for (const { variable, dictKey, type } of chargerVars) {
        const value = latestData[variable];
        if (!value || value === 0) continue;
        const n = Number(value);
        if (isNaN(n)) continue;
        // Fetch mapping via API
        let dict = {};
        try {
            const resp = await fetch(`/management/api/variable-description/${dictKey}`);
            const data = await resp.json();
            if (data && data.codes) dict = data.codes;
            else if (data && data.mapping) dict = data.mapping;
        } catch {}
        console.debug(`[${variable}] value:`, value, '| dictKey:', dictKey, '| dict:', dict);
        const bits = n.toString(2).split('').reverse();
        bits.forEach((bit, idx) => {
            if (bit === '1') {
                const msg = dict[String(idx)] || `Nepoznat kod: ${idx}`;
                if (!dict.hasOwnProperty(String(idx))) {
                    console.warn(`[${variable}] Nepoznat kod:`, idx, '| Dostupni kodovi:', Object.keys(dict));
                }
                chargerAlerts.push({ type, code: idx, message: msg });
            }
        });
    }
    if (chargerContainer && chargerAlerts.length > 0) {
        chargerAlerts.forEach(alert => {
            const box = document.createElement('div');
            box.className = `dashboard-alert-box dashboard-alert-${alert.type}`;
            box.innerHTML = `<span class="dashboard-alert-code">${alert.code}</span> ${alert.message}`;
            chargerContainer.appendChild(box);
        });
    }
}
// Funkcija koja uvijek prepisuje vrijednosti za binarne flagove na dashboardu
function updateBinaryFlagFields(data) {
    if (!data) return;
    BINARY_FLAG_FIELDS.forEach(variable => {
        const elementId = variable.replace(/_/g, '-');
        const el = document.getElementById(elementId);
        const n = Number(data[variable]);
        const binaryStr = !isNaN(n) ? n.toString(2) : '';
        const bits = getActiveBits(n);
        if (el) {
            if (!isNaN(n)) {
                if (n === 0 || bits === '') {
                    el.innerHTML = '<span style="font-style:italic;opacity:0.5;">No messages</span>';
                } else {
                    el.textContent = bits;
                }
            } else {
                el.innerHTML = '<span style="font-style:italic;opacity:0.5;">No messages</span>';
            }
        }
    });
}
// Vrati popis aktivnih bitova za binarni flag broj
function getActiveBits(decimalValue) {
    if (typeof decimalValue !== 'number' || isNaN(decimalValue)) return '';
    const bits = decimalValue.toString(2).split('').reverse();
    const active = [];
    for (let i = 0; i < bits.length; i++) {
        if (bits[i] === '1') active.push(i);
    }
    return active.join(', ');
}

// Polja koja su binarni flagovi
const BINARY_FLAG_FIELDS = [
    'error_message_1',
    'error_message_2',
    'warning_message_1',
    'charger_error_message',
    'charger_warning_message'
];
// Auto-select 12h chart range after full page load
window.addEventListener('DOMContentLoaded', function() {
    loadAllCharts('12h');
});

// --- DASHBOARD LIVE UPDATE ---
function updateDashboard(data) {
    updateBinaryFlagFields(data);
    showDashboardAlerts(data);

    // PV CHARGER WORKSTATE
    const workstateMap = {
        0: 'Inicijalizacija',
        1: 'Mod za samotestiranje',
        2: 'Običan način rada',
        3: 'Zaustavljen'
    };
    const workstateEl = document.getElementById('pv-charger-workstate');
    if (workstateEl) {
        const val = Number(data['pv_charger_workstate']);
        workstateEl.textContent = workstateMap[val] || val;
        if (val === 3) {
            workstateEl.style.color = '#ff3333';
            workstateEl.style.fontWeight = 'bold';
            workstateEl.style.fontStyle = 'normal';
        } else {
            workstateEl.style.color = '#22c55e';
            workstateEl.style.fontWeight = '300';
            workstateEl.style.fontStyle = 'italic';
        }
    }

    // PV RELAY
    const relayMap = { 0: 'Odspojen', 1: 'Spojen' };
    const relayEl = document.getElementById('pv-relay');
    if (relayEl) {
        const val = Number(data['pv_relay']);
        relayEl.textContent = relayMap[val] || val;
    }

    // INVERTER BATTERY VOLTAGE
    const invBattEl = document.getElementById('inverter-battery-voltage');
    if (invBattEl) {
        const val = Number(data['inverter_battery_voltage']);
        invBattEl.textContent = val;
        if (val < 12 || val > 14) {
            invBattEl.style.color = '#ff3333';
            invBattEl.style.fontWeight = 'bold';
        } else {
            invBattEl.style.color = '';
            invBattEl.style.fontWeight = '';
        }
    }

    // INVERTER WORK STATE
    const invWorkMap = {
        0: 'Uključeno',
        1: 'Samotestiranje',
        2: 'Off Grid',
        3: 'On Grid',
        4: 'ByPass',
        5: 'Zaustavljeno',
        6: 'Punjenje iz gradske mreže'
    };
    const invWorkEl = document.getElementById('inverter-work-state');
    if (invWorkEl) {
        const val = Number(data['inverter_work_state']);
        invWorkEl.textContent = invWorkMap[val] || val;
    }

    // ENERGY USED - formatiraj tisućice
    const mwh = Number(data['discharger_total_mwh']) || 0;
    const kwh = Number(data['discharger_total_kwh']) || 0;
    const mwhToKwh = mwh * 1000;
    const totalKwh = mwhToKwh + kwh;
    function formatThousand(n) {
        return n.toLocaleString('hr-HR').replace(/\./g, ',').replace(/\s/g, ' ');
    }
    const mwhEl = document.getElementById('energy-mwh');
    const kwhEl = document.getElementById('energy-kwh');
    const totalKwhEl = document.getElementById('energy-total-kwh');
    if (mwhEl) mwhEl.textContent = formatThousand(mwh);
    if (kwhEl) kwhEl.textContent = formatThousand(kwh);
    if (totalKwhEl) totalKwhEl.textContent = formatThousand(totalKwh);

    // INVERTER/CHARGER MESSAGES - boje
    const errorIds = ['error-message-1', 'error-message-2', 'charger-error-message'];
    const warningIds = ['warning-message-1', 'charger-warning-message'];
    errorIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && Number(el.textContent) !== 0) {
            el.style.color = '#ff3333';
            el.style.fontWeight = 'bold';
        } else if (el) {
            el.style.color = '';
            el.style.fontWeight = '';
        }
    });
    warningIds.forEach(id => {
        const el = document.getElementById(id);
        if (el && Number(el.textContent) !== 0) {
            el.style.color = '#ff9900';
            el.style.fontWeight = 'bold';
        } else if (el) {
            el.style.color = '';
            el.style.fontWeight = '';
        }
    });
}
window.updateDashboard = updateDashboard;
// All core functionalities, no duplicates, global functions for HTML onclick

let pvVoltageChart = null;
let batteryVoltageChart = null;
let chargePowerChart = null;
let displayedRecords = 10;
let totalAvailableRecords = 0;
let lastKnownDashboardValues = {};
let lastKnownChartValues = { inverter_bus_voltage: null, inverter_battery_voltage: null, inverter_power: null };
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
    descElement.innerHTML = (data.success && data.description) ? data.description : 'No description available';
    } catch {
        descElement.textContent = 'Error loading description';
    }
}
function hideTooltip() {
    const tooltip = document.getElementById('infoTooltip');
    if (tooltip) tooltip.style.display = 'none';
}
function formatNumber(n) {
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
    return n;
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
            data.data.slice().reverse().forEach(record => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(record.timestamp).toLocaleString()}</td>
                    <td>${record.inverter_bus_voltage ?? '-'}</td>
                    <td>${record.inverter_battery_voltage ?? '-'}</td>
                    <td>${record.inverter_power ?? '-'}</td>
                    <td>${record.inverter_load_power ?? '-'}</td>
                    <td>${record.pv_charger_power ?? '-'}</td>`;
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
                let value = latestDataFromServer[variable];
                if (BINARY_FLAG_FIELDS.includes(variable)) {
                    const n = Number(value);
                    if (!isNaN(n)) {
                        const bits = getActiveBits(n);
                        value = bits || '0';
                    }
                }
                element.textContent = value;
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
    .then(res => {
        if (!res.ok) throw new Error('Server error: ' + res.statusText);
        return res.json();
    })
    .then(result => {
        if (result.success && result.data) {
            initializeLastKnownDashboardValues(result.data);
            updateBinaryFlagFields(result.data);
            showDashboardAlerts(result.data);
            const title = document.getElementById('historyTitle');
            if (title) {
                // Pronađi broj u tekstu
                const match = title.textContent.match(/\((\d+) total records\)/);
                if (match) {
                    const num = Number(match[1]);
                    const formatted = formatNumber(num); // koristi tvoju funkciju
                    title.textContent = title.textContent.replace(match[1], formatted);
                }
            }
        }
    })
    .catch(err => console.error('Error fetching latest data:', err));
});
// Minimalni CSS za alert boxove (ako već ne postoji)
if (!document.getElementById('dashboard-alert-box-styles')) {
    const style = document.createElement('style');
    style.id = 'dashboard-alert-box-styles';
    style.innerHTML = `
        .dashboard-alerts-container {
            margin-top: 10px;
            margin-bottom: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
        }
        .dashboard-alert-box {
            width: 100%;
            border-radius: 12px;
            padding: 12px 18px;
            font-size: 1rem;
            font-weight: 500;
            box-shadow: 0 2px 12px 0 rgba(0,0,0,0.08);
            background: rgba(255,255,255,0.25);
            border: 2px solid #e0e0e0;
            backdrop-filter: blur(6px);
            color: #222;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background 0.2s;
        }
        .dashboard-alert-error {
            border-color: #ff4d4f;
            background: rgba(255,77,79,0.12);
        }
        .dashboard-alert-warning {
            border-color: #faad14;
            background: rgba(250,173,20,0.12);
        }
        .dashboard-alert-code {
            font-weight: bold;
            font-size: 1.1em;
            color: #fff;
            background: #ff4d4f;
            border-radius: 6px;
            padding: 2px 10px;
            margin-right: 8px;
            box-shadow: 0 1px 4px 0 rgba(0,0,0,0.08);
            letter-spacing: 1px;
            display: inline-block;
        }
        .dashboard-alert-warning .dashboard-alert-code {
            background: #faad14;
            color: #222;
        }
        @media (max-width: 600px) {
            .dashboard-alert-box {
                font-size: 0.95rem;
                padding: 10px 8px;
            }
        }
    `;
    document.head.appendChild(style);
}


