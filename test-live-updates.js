const http = require('http');
require('dotenv').config();

// Funkcija za generiranje nasumičnih vrijednosti
function generateRandomSolarData() {
    const now = new Date();
    
    // Simuliramo realistične solarne podatke
    const hour = now.getHours();
    const isDayTime = hour >= 6 && hour <= 18;
    
    return {
        timestamp: now.toISOString(),
        secret_key: process.env.SECRET_API_KEY || 'test-secret-key',
        PV_voltage_V: isDayTime ? (15 + Math.random() * 20).toFixed(2) : (0 + Math.random() * 5).toFixed(2),
        Battery_voltage_V: (11.5 + Math.random() * 2).toFixed(2),
        Charger_current_A: isDayTime ? (2 + Math.random() * 8).toFixed(2) : (0 + Math.random() * 2).toFixed(2),
        Charger_power_W: isDayTime ? (50 + Math.random() * 200).toFixed(2) : (0 + Math.random() * 20).toFixed(2),
        Accum_power_Wh: (500 + Math.random() * 1000).toFixed(0),
        External_temp_C: (15 + Math.random() * 20).toFixed(1),
        Radiator_temp_C: (20 + Math.random() * 25).toFixed(1),
        Humidity_percent: (40 + Math.random() * 40).toFixed(0),
        DC_current_A: (1 + Math.random() * 5).toFixed(2),
        DC_voltage_V: (11 + Math.random() * 3).toFixed(2),
        DC_power_W: (20 + Math.random() * 80).toFixed(0),
        AC_power_W: (15 + Math.random() * 60).toFixed(0),
        Status: Math.random() > 0.9 ? '1' : '0',
        Error_code: Math.random() > 0.95 ? '1' : '0'
    };
}

// Funkcija za slanje POST request-a
function sendSolarData() {
    const data = generateRandomSolarData();
    const postData = JSON.stringify(data);
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/backyard-management',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const req = http.request(options, (res) => {
        console.log(`📡 POST Response: ${res.statusCode} - PV: ${data.PV_voltage_V}V, Power: ${data.Charger_power_W}W, Temp: ${data.Radiator_temp_C}°C`);
        
        let responseData = '';
        res.on('data', (chunk) => {
            responseData += chunk;
        });
        
        res.on('end', () => {
            if (res.statusCode !== 200) {
                console.log('Response body:', responseData);
            }
        });
    });
    
    req.on('error', (e) => {
        console.error(`❌ Request error: ${e.message}`);
    });
    
    req.write(postData);
    req.end();
}

// Početni test
console.log('🚀 Starting live solar data simulator...');
console.log('📊 Sending POST requests every 3 seconds to http://localhost:3000/api/backyard-management');
console.log('Press Ctrl+C to stop\n');

// Pošalji odmah prvi podatak
sendSolarData();

// Zatim pošalji svakih 3 sekunde
const interval = setInterval(sendSolarData, 3000);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping simulator...');
    clearInterval(interval);
    process.exit(0);
});

// Prikaz informacija o tome što simulator radi
console.log('📈 Simulator will generate realistic solar data:');
console.log('   - PV Voltage: 15-35V (day) / 0-5V (night)');
console.log('   - Battery Voltage: 11.5-13.5V');
console.log('   - Charger Power: 50-250W (day) / 0-20W (night)');
console.log('   - Temperatures: 15-40°C');
console.log('   - Accumulated Power: 500-1500Wh');
