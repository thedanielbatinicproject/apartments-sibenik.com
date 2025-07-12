const express = require('express');
const { fetchCalendars } = require('../code/calendarAPI');
const router = express.Router();

router.get('/', (req, res) => {
  const isMobile = req.useragent && req.useragent.isMobile;
  res.redirect(isMobile ? '/de/mobile' : '/de/desktop');
});

router.get('/mobile', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    res.render('de/mobile', { language: 'de', device: 'mobile', calendar });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Fehler beim Laden des Kalenders",
        "error-message": err.message || "Kalender konnte nicht geladen werden."
      }
    });
  }
});

router.get('/desktop', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    res.render('de/desktop', { language: 'de', device: 'desktop', calendar });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Fehler beim Laden des Kalenders",
        "error-message": err.message || "Kalender konnte nicht geladen werden."
      }
    });
  }
});

module.exports = router;