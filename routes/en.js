const express = require('express');
const { fetchCalendars } = require('../code/calHelper');
const router = express.Router();

// Glavna ruta -> detekcija IP + uređaja + redirect
router.get('/', (req, res) => {
  const isMobile = req.useragent && req.useragent.isMobile;
  res.redirect(isMobile ? '/en/mobile' : '/en/desktop');
});

router.get('/mobile', async (req, res) => {
  try {
    const calendar = await fetchCalendars(req);
    res.render('en/mobile', { language: 'en', device: 'mobile', calendar });
  } catch (err) {
    res.status(500).send('Error fetching calendar');
  }
});

router.get('/desktop', async (req, res) => {
  try {
    const calendar = await fetchCalendars(req);
    res.render('en/desktop', { language: 'en', device: 'desktop', calendar });
  } catch (err) {
    res.status(500).send('Error fetching calendar');
  }
});

module.exports = router;