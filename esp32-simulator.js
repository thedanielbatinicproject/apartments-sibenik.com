const http = require('http');
require('dotenv').config();

// Simuliraj ESP32 klijenta koji šalje sve podatke kao pravi uređaj
class ESP32Simulator {
    constructor() {
        this.secretKey = process.env.SECRET_API_KEY || 'your-secret-key';
        this.serialNumber = "ESP32_001_SOLAR";
        this.hwVersion = "v2.1";
        this.fwVersion = "v1.0.3";
        this.calPVCoeff = 1.05;
        this.calBattCoeff = 0.98;
        
        // Inicijalni vrijednosti
        this.accumPower = 0;
        this.accumTime = 0;
        this.startTime = Date.now();
    }
    
    // Generiraj realistične podatke za sve ESP32 senzore
    generateRealisticData() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Provjeri je li dnevno vrijeme (6:00-20:00) za solarne panele
        const isDaylight = hour >= 6 && hour <= 20;
        const isOptimalSun = hour >= 10 && hour <= 16;
        const isMorningSun = hour >= 6 && hour <= 10;
        const isEveningSun = hour >= 16 && hour <= 20;
        
        // Solarna intenzivnost (0-1)
        let solarIntensity = 0;
        if (isDaylight) {
            if (isOptimalSun) {
                solarIntensity = 0.7 + (Math.random() * 0.3); // 70-100%
            } else if (isMorningSun || isEveningSun) {
                solarIntensity = 0.3 + (Math.random() * 0.4); // 30-70%
            }
        }
        
        // Temperatura okoline (realističko kolebanje)
        const baseTemp = 22;
        const dailyTempVariation = Math.sin((hour / 24) * 2 * Math.PI) * 8;
        const randomVariation = (Math.random() - 0.5) * 4;
        const externalTemp = baseTemp + dailyTempVariation + randomVariation;
        
        // Radiator i cabinet temperatura
        const radiatorTemp = externalTemp + (solarIntensity * 15) + (Math.random() * 5);
        const cabinetTemp = externalTemp + (solarIntensity * 8) + (Math.random() * 3);
        
        // Vlažnost (obrnuto proporcionalna temperaturi)
        const humidity = Math.max(30, Math.min(90, 80 - (externalTemp - 20) * 2 + (Math.random() * 20)));
        
        // PV podatci (chargerDisp[0-11])
        const pvVoltage = solarIntensity > 0 ? 
            Math.round((12 + solarIntensity * 8 + (Math.random() * 2)) * 10) : // 120-220 (x10)
            Math.round((0.5 + Math.random() * 1) * 10); // 5-15 (x10)
            
        const batteryVoltage = Math.round((11.5 + (Math.random() * 2.5) + (solarIntensity * 1)) * 10); // x10
        
        const chargerCurrent = solarIntensity > 0.2 ? 
            Math.round((solarIntensity * 15 + (Math.random() * 5)) * 10) : // x10
            0;
            
        const chargerPower = Math.round((chargerCurrent / 10) * (batteryVoltage / 10));
        
        // Relay statusi (0 ili 1)
        const batteryRelay = solarIntensity > 0.3 ? 1 : 0;
        const pvRelay = solarIntensity > 0.1 ? 1 : 0;
        
        // Error i warning kodovi
        const errorCode = Math.random() < 0.02 ? Math.floor(Math.random() * 10) : 0;
        const warningCode = Math.random() < 0.05 ? Math.floor(Math.random() * 5) : 0;
        
        // Battery voltage grade (obično 12V sistem = 12)
        const battVoltageGrade = 12;
        
        // Rated current (maksimalna struja punjača, npr. 20A)
        const ratedCurrent = 20;
        
        // Akumulirana snaga (raste tijekom dana)
        const timeElapsed = (Date.now() - this.startTime) / 1000; // sekunde
        this.accumTime = Math.floor(timeElapsed);
        this.accumPower += solarIntensity * 5; // Dodaj 0-5Wh ovisno o suncu
        
        // DC i AC podatci (sunSpec[0-8])
        const status = errorCode > 0 ? 0 : 1;
        const dcCurrent = Math.round((solarIntensity * 18 + (Math.random() * 3)) * 100); // x100
        const dcVoltage = Math.round((30 + solarIntensity * 20 + (Math.random() * 5)) * 100); // x100
        const dcPower = Math.round((dcCurrent / 100) * (dcVoltage / 100));
        const acPower = Math.round(dcPower * 0.95); // 95% efikasnost
        const acFreq = Math.round((49.8 + (Math.random() * 0.4)) * 100); // x100
        
        return {
            // chargerDisp array simulation [0-11]
            chargerDisp: [
                pvVoltage,          // [0] PV_voltage_V * 10
                batteryVoltage,     // [1] Battery_voltage_V * 10  
                chargerCurrent,     // [2] Charger_current_A * 10
                chargerPower,       // [3] Charger_power_W
                Math.round(radiatorTemp), // [4] Radiator_temp_C
                Math.round(externalTemp), // [5] External_temp_C
                batteryRelay,       // [6] Battery_relay
                pvRelay,           // [7] PV_relay
                errorCode,         // [8] Error_code
                warningCode,       // [9] Warning_code
                battVoltageGrade,  // [10] Batt_voltage_grade
                ratedCurrent       // [11] Rated_current_A
            ],
            
            // Dodatni podatci
            accum_power: Math.round(this.accumPower),
            accum_time: this.accumTime,
            serial_number: this.serialNumber,
            
            // sysInfo array simulation [2-5]
            sysInfo: [
                null, null,         // [0], [1] - ne koriste se
                this.hwVersion,     // [2] HW_version
                this.fwVersion,     // [3] FW_version
                this.calPVCoeff,    // [4] Cal_PV_coeff
                this.calBattCoeff   // [5] Cal_Batt_coeff
            ],
            
            // sunSpec array simulation [0-8]
            sunSpec: [
                status,            // [0] Status
                dcCurrent,         // [1] DC_current_A * 100
                dcVoltage,         // [2] DC_voltage_V * 100
                dcPower,           // [3] DC_power_W
                acPower,           // [4] AC_power_W
                acFreq,            // [5] AC_freq_Hz * 100
                null, null,        // [6], [7] - ne koriste se
                Math.round(cabinetTemp * 10) // [8] Temp_cabinet_C * 10
            ],
            
            humidity: Math.round(humidity)
        };
    }
    
    // Stvori JSON kao pravi ESP32
    createESP32JSON(data) {
        let json = "{";
        json += "\"PV_voltage_V\":" + String(data.chargerDisp[0]/10.0) + ",";
        json += "\"Battery_voltage_V\":" + String(data.chargerDisp[1]/10.0) + ",";
        json += "\"Charger_current_A\":" + String(data.chargerDisp[2]/10.0) + ",";
        json += "\"Charger_power_W\":" + String(data.chargerDisp[3]) + ",";
        json += "\"Radiator_temp_C\":" + String(data.chargerDisp[4]) + ",";
        json += "\"External_temp_C\":" + String(data.chargerDisp[5]) + ",";
        json += "\"Battery_relay\":" + String(data.chargerDisp[6]) + ",";
        json += "\"PV_relay\":" + String(data.chargerDisp[7]) + ",";
        json += "\"Error_code\":" + String(data.chargerDisp[8]) + ",";
        json += "\"Warning_code\":" + String(data.chargerDisp[9]) + ",";
        json += "\"Batt_voltage_grade\":" + String(data.chargerDisp[10]) + ",";
        json += "\"Rated_current_A\":" + String(data.chargerDisp[11]) + ",";
        json += "\"Accum_power_Wh\":" + String(data.accum_power) + ",";
        json += "\"Accum_time_combined\":" + String(data.accum_time) + ",";
        json += "\"Serial_number\":" + String(data.serial_number) + ",";
        json += "\"HW_version\":" + String(data.sysInfo[2]) + ",";
        json += "\"FW_version\":" + String(data.sysInfo[3]) + ",";
        json += "\"Cal_PV_coeff\":" + String(data.sysInfo[4]) + ",";
        json += "\"Cal_Batt_coeff\":" + String(data.sysInfo[5]) + ",";
        json += "\"DC_current_A\":" + String(data.sunSpec[1]/100.0) + ",";
        json += "\"DC_voltage_V\":" + String(data.sunSpec[2]/100.0) + ",";
        json += "\"DC_power_W\":" + String(data.sunSpec[3]) + ",";
        json += "\"AC_power_W\":" + String(data.sunSpec[4]) + ",";
        json += "\"AC_freq_Hz\":" + String(data.sunSpec[5]/100.0) + ",";
        json += "\"Temp_cabinet_C\":" + String(data.sunSpec[8]/10.0) + ",";
        json += "\"Status\":" + String(data.sunSpec[0]) + ",";
        json += "\"Humidity_percent\":" + String(data.humidity) + ",";
        json += "\"secret_key\":\"" + String(this.secretKey) + "\"";
        json += "}";
        
        return json;
    }
    
    // Pošalji podatke na server
    sendData() {
        const data = this.generateRealisticData();
        const jsonString = this.createESP32JSON(data);
        const jsonObj = JSON.parse(jsonString);
        
        const postData = JSON.stringify(jsonObj);
        
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
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                console.log(`📡 [${new Date().toLocaleTimeString()}] Status: ${res.statusCode}`);
                console.log(`📊 PV: ${jsonObj.PV_voltage_V}V, Battery: ${jsonObj.Battery_voltage_V}V, Power: ${jsonObj.Charger_power_W}W`);
                console.log(`🌡️  Radiator: ${jsonObj.Radiator_temp_C}°C, External: ${jsonObj.External_temp_C}°C, Humidity: ${jsonObj.Humidity_percent}%`);
                
                if (res.statusCode !== 200) {
                    console.log('Response:', responseData);
                }
                console.log('---');
            });
        });
        
        req.on('error', (err) => {
            console.error('❌ Request error:', err.message);
        });
        
        req.write(postData);
        req.end();
    }
    
    // Pokreni kontinuirano slanje
    start(intervalSeconds = 30) {
        console.log(`🚀 ESP32 Simulator started - sending data every ${intervalSeconds} seconds`);
        console.log(`🔑 Using secret key: ${this.secretKey.substring(0, 8)}...`);
        console.log(`📡 Target: http://localhost:3000/api/backyard-management`);
        console.log('---');
        
        // Pošalji odmah
        this.sendData();
        
        // Zatim svakih X sekundi
        this.interval = setInterval(() => {
            this.sendData();
        }, intervalSeconds * 1000);
    }
    
    // Zaustavi simulator
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            console.log('🛑 ESP32 Simulator stopped');
        }
    }
}

// Pokreni simulator ako je script pokrenut direktno
if (require.main === module) {
    const simulator = new ESP32Simulator();
    
    // Slušaj Ctrl+C za graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, stopping simulator...');
        simulator.stop();
        process.exit(0);
    });
    
    // Pokreni s intervalom od 10 sekundi za testiranje
    simulator.start(10);
}

module.exports = ESP32Simulator;
