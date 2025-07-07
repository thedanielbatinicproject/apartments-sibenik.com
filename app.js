const express = require('express');
const axios = require('axios');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const useragent = require('express-useragent');

const app = express();
app.use(useragent.express());

// EJS konfiguracija
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Učitavanje ruta
app.use('/hr', require('./routes/hr'));
app.use('/de', require('./routes/de'));
app.use('/en', require('./routes/en'));

// Glavna ruta → detekcija IP + uređaja + redirect
app.get('/', async (req, res) => {
  // Dohvati IP adresu
  const clientIp =
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.connection.remoteAddress;

  console.log('📡 IP klijenta:', clientIp);

  let countryCode = 'EN'; // Default

  try {
    const response = await axios.get(`http://ip-api.com/json/${clientIp}`);
    console.log('🌍 GeoIP odgovor:', response.data);

    if (response.data && response.data.countryCode) {
      countryCode = response.data.countryCode;
    }
  } catch (error) {
    console.warn('⚠️ Greška pri geolokaciji:', error.message);
  }

  // Detekcija jezika
  let lang = 'en';
  if (countryCode === 'HR') lang = 'hr';
  else if (countryCode === 'DE') lang = 'de';

  // Detekcija uređaja
  const isMobile = req.useragent.isMobile;
  const device = isMobile ? 'mobile' : 'desktop';

  console.log(`➡️ Redirect na /${lang}/${device}`);

  res.redirect(`/${lang}/${device}`);
});

// HTTPS certifikati
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'https-auth', 'private.key')),
  cert: fs.readFileSync(path.join(__dirname, 'https-auth', 'certificate.crt')),
  ca: fs.readFileSync(path.join(__dirname, 'https-auth', 'ca_bundle.crt')),
};

// HTTPS server
const httpsServer = https.createServer(sslOptions, app);

// HTTP → HTTPS redirect server
const httpApp = express();
httpApp.use((req, res) => {
  const host = req.headers.host.split(':')[0];
  res.redirect(`https://${host}${req.url}`);
});

// Pokretanje HTTP i HTTPS servera
http.createServer(httpApp).listen(80, () => {
  console.log('🌐 HTTP port 80 → redirect na HTTPS');
});

httpsServer.listen(443, () => {
  console.log('🔐 HTTPS port 443 aktivan');
});
