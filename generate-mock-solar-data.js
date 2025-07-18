const fs = require('fs').promises;
const path = require('path');

// Generiraj mock podatke za prošli tjedan (7 dana, svaku minutu)
function generateMockSolarData() {
    const data = [];
    const now = new Date();
    
    // Počni od prije 7 dana
    const startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    // Generiraj podatke za svaku minutu kroz 7 dana
    for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute++) {
                const timestamp = new Date(startDate.getTime() + 
                    (day * 24 * 60 * 60 * 1000) + 
                    (hour * 60 * 60 * 1000) + 
                    (minute * 60 * 1000)
                );
                
                // Provjeri je li dnevno vrijeme (6:00-20:00) za solarne panele
                const isDaylight = hour >= 6 && hour <= 20;
                const isOptimalSun = hour >= 10 && hour <= 16; // Najbolje sunce
                const isMorningSun = hour >= 6 && hour <= 10;   // Jutarnje sunce
                const isEveningSun = hour >= 16 && hour <= 20;  // Večernje sunce
                
                // Osnovni faktori za solarne podatke
                let solarIntensity = 0;
                if (isDaylight) {
                    if (isOptimalSun) {
                        solarIntensity = 0.7 + (Math.random() * 0.3); // 70-100%
                    } else if (isMorningSun || isEveningSun) {
                        solarIntensity = 0.3 + (Math.random() * 0.4); // 30-70%
                    }
                }
                
                // Temperatura okoline (realističko kolebanje)
                const baseTemp = 22; // Osnovna temperatura
                const dailyTempVariation = Math.sin((hour / 24) * 2 * Math.PI) * 8; // Dnevno kolebanje ±8°C
                const randomVariation = (Math.random() - 0.5) * 4; // Random ±2°C
                const externalTemp = baseTemp + dailyTempVariation + randomVariation;
                
                // Radiator temperatura (ovisi o solarnoj aktivnosti)
                const radiatorTemp = externalTemp + (solarIntensity * 15) + (Math.random() * 5);
                
                // Vlažnost (obrnuto proporcionalna temperaturi)
                const humidity = Math.max(30, Math.min(90, 80 - (externalTemp - 20) * 2 + (Math.random() * 20)));
                
                // PV napon (ovisi o suncu)
                const pvVoltage = solarIntensity > 0 ? 
                    (12 + solarIntensity * 8 + (Math.random() * 2)) : // 12-22V kad ima sunca
                    (0.5 + Math.random() * 1); // Minimalni napon u mraku
                
                // Napón baterije (realistično 11-14V)
                const batteryVoltage = 11.5 + (Math.random() * 2.5) + (solarIntensity * 1);
                
                // Struja punjača (ovisi o PV naponu)
                const chargerCurrent = solarIntensity > 0.2 ? 
                    (solarIntensity * 15 + (Math.random() * 5)) : // 0-20A kad ima sunca
                    0;
                
                // Snaga punjača (P = U * I)
                const chargerPower = chargerCurrent * batteryVoltage;
                
                // Akumulirana snaga (simuliraj dnevni rast)
                const dailyProgress = hour / 24; // 0-1 kroz dan
                const baseAccumPower = day * 2000; // 2kWh po danu
                const dailyAccumPower = dailyProgress * 2000 * solarIntensity;
                const accumPower = baseAccumPower + dailyAccumPower + (Math.random() * 100);
                
                // AC frekvencija (uglavnom stabilna oko 50Hz)
                const acFreq = 49.8 + (Math.random() * 0.4);
                
                // Error i warning kodovi (rijetko)
                const errorCode = Math.random() < 0.02 ? Math.floor(Math.random() * 10) : 0;
                const warningCode = Math.random() < 0.05 ? Math.floor(Math.random() * 5) : 0;
                
                // Status (uglavnom 1 = OK)
                const status = errorCode > 0 ? 0 : 1;
                
                // Formatiraj hrvatski timestamp
                const croatianTime = new Date(timestamp.getTime() + (timestamp.getTimezoneOffset() * 60000) + (2 * 3600000));
                
                const record = {
                    timestamp: croatianTime.toISOString(),
                    local_time: croatianTime.toLocaleString('hr-HR', { 
                        timeZone: 'Europe/Zagreb',
                        year: 'numeric',
                        month: '2-digit', 
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }),
                    PV_voltage_V: Math.round(pvVoltage * 10) / 10,
                    Battery_voltage_V: Math.round(batteryVoltage * 10) / 10,
                    Charger_current_A: Math.round(chargerCurrent * 10) / 10,
                    Charger_power_W: Math.round(chargerPower * 10) / 10,
                    Accum_power_Wh: Math.round(accumPower),
                    Radiator_temp_C: Math.round(radiatorTemp * 10) / 10,
                    External_temp_C: Math.round(externalTemp * 10) / 10,
                    AC_freq_Hz: Math.round(acFreq * 10) / 10,
                    Humidity_percent: Math.round(humidity),
                    Error_code: errorCode,
                    Warning_code: warningCode,
                    Status: status,
                    source_ip: "127.0.0.1"
                };
                
                data.push(record);
            }
        }
        console.log(`Generated day ${day + 1}/7 (${1440} records per day)`);
    }
    
    return data;
}

async function saveMockData() {
    try {
        console.log('🚀 Generating mock solar data for the past week...');
        console.log('⏱️  This will create 10,080 records (7 days × 24 hours × 60 minutes)');
        
        const startTime = Date.now();
        const mockData = generateMockSolarData();
        const endTime = Date.now();
        
        console.log(`✅ Generated ${mockData.length} records in ${endTime - startTime}ms`);
        
        // Spremi u public data file
        const publicDataPath = path.join(__dirname, 'data/public_data/solars_public.json');
        await fs.writeFile(publicDataPath, JSON.stringify(mockData, null, 2));
        
        console.log(`💾 Saved mock data to: ${publicDataPath}`);
        console.log(`📊 Data range: ${mockData[0].local_time} to ${mockData[mockData.length-1].local_time}`);
        console.log(`📈 File size: ${Math.round((JSON.stringify(mockData).length / 1024 / 1024) * 100) / 100} MB`);
        
        // Prikaži primjer nekoliko zapisa
        console.log('\n📋 Sample records:');
        console.log('First record:', JSON.stringify(mockData[0], null, 2));
        console.log('Last record:', JSON.stringify(mockData[mockData.length-1], null, 2));
        
    } catch (error) {
        console.error('❌ Error generating mock data:', error);
    }
}

// Pokreni generiranje ako je script pokrenut direktno
if (require.main === module) {
    saveMockData();
}

module.exports = { generateMockSolarData, saveMockData };
