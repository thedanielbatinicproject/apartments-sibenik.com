const express = require('express');
const axios = require('axios');
const path = require('path');
const useragent = require('express-useragent');

const app = express();
app.use(useragent.express());

app.use(express.static(path.join(__dirname, 'public')));

// Ako koristiš Plesk ili proxy
app.set('trust proxy', true);

// EJS konfiguracija
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Učitavanje ruta
app.use('/hr', require('./routes/hr'));
app.use('/de', require('./routes/de'));
app.use('/en', require('./routes/en'));

// Glavna ruta → detekcija IP + uređaja + redirect
app.get('/', async (req, res) => {
  const clientIp = req.ip;
  console.log('IP klijenta:', clientIp);

  let countryCode = 'EN'; // Default
  try {
    const response = await axios.get(`http://ip-api.com/json/${clientIp}`);
    if (response.data && response.data.countryCode) {
      countryCode = response.data.countryCode;
    }
  } catch (error) {
    console.warn('Greška pri geolokaciji:', error.message);
  }

  let lang = 'en';
  if (countryCode === 'HR') lang = 'hr';
  else if (countryCode === 'DE') lang = 'de';

  const isMobile = req.useragent.isMobile;
  const device = isMobile ? 'mobile' : 'desktop';

  console.log(`Redirect na /${lang}/${device}`);
  res.redirect(`/${lang}/${device}`);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App pokrenuta na portu ${PORT}`);
});
