const express = require('express');
const { fetchCalendars } = require('../code/calHelper');
const router = express.Router();

// Glavna ruta -> detekcija IP + uređaja + redirect
router.get('/', (req, res) => {
  const isMobile = req.useragent && req.useragent.isMobile;
  res.redirect(isMobile ? '/de/mobile' : '/de/desktop');
});

router.get('/mobile', async (req, res) => {
  try {
    const calendar = await fetchCalendars(req);
    res.render('de/mobile', { language: 'de', device: 'mobile', calendar });
  } catch (err) {
    res.status(500).send('Fehler beim Laden des Kalenders');
  }
});

router.get('/desktop', async (req, res) => {
  try {
    const calendar = await fetchCalendars(req);
    res.render('de/desktop', { language: 'de', device: 'desktop', calendar });
  } catch (err) {
    res.status(500).send('Fehler beim Laden des Kalenders');
  }
});

module.exports = router;