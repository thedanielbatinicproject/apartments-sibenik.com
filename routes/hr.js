const express = require('express');
const { fetchCalendars } = require('../code/calendarAPI');
const router = express.Router();

router.get('/', (req, res) => {
  const isMobile = req.useragent && req.useragent.isMobile;
  res.redirect(isMobile ? '/hr/mobile' : '/hr/desktop');
});

router.get('/mobile', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    res.render('hr/mobile', { language: 'hr', device: 'mobile', calendar });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Greška pri dohvaćanju kalendara",
        "error-message": err.message || "Neuspješno dohvaćanje kalendara."
      }
    });
  }
});

router.get('/desktop', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    res.render('hr/desktop', { language: 'hr', device: 'desktop', calendar });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Greška pri dohvaćanju kalendara",
        "error-message": err.message || "Neuspješno dohvaćanje kalendara."
      }
    });
  }
});

module.exports = router;