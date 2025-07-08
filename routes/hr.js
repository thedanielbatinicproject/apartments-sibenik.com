const express = require('express');
const { fetchCalendars } = require('../code/calHelper');
const router = express.Router();

// Glavna ruta -> detekcija IP + uređaja + redirect
router.get('/', (req, res) => {
  const isMobile = req.useragent && req.useragent.isMobile;
  res.redirect(isMobile ? '/hr/mobile' : '/hr/desktop');
});

router.get('/mobile', async (req, res) => {
  try {
    const calendar = await fetchCalendars(req);
    res.render('hr/mobile', { language: 'hr', device: 'mobile', calendar });
  } catch (err) {
    res.status(500).send('Greška pri dohvaćanju kalendara');
  }
});

router.get('/desktop', async (req, res) => {
  try {
    const calendar = await fetchCalendars(req);
    res.render('hr/desktop', { language: 'hr', device: 'desktop', calendar });
  } catch (err) {
    res.status(500).send('Greška pri dohvaćanju kalendara');
  }
});

module.exports = router;