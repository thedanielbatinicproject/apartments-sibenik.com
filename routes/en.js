const express = require('express');
const { fetchCalendars } = require('../code/calendarAPI');
const router = express.Router();

router.get('/', (req, res) => {
  const isMobile = req.useragent && req.useragent.isMobile;
  res.redirect(isMobile ? '/en/mobile' : '/en/desktop');
});

router.get('/mobile', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    res.render('en/mobile', { language: 'en', device: 'mobile', calendar });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Error fetching calendar",
        "error-message": err.message || "Failed to fetch calendar."
      }
    });
  }
});

router.get('/desktop', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    res.render('en/desktop', { language: 'en', device: 'desktop', calendar });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Error fetching calendar",
        "error-message": err.message || "Failed to fetch calendar."
      }
    });
  }
});

module.exports = router;