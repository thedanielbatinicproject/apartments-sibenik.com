const express = require('express');
const router = express.Router();

router.get('/mobile', (req, res) => {
  res.render('de/mobile', { language: 'de', device: 'mobile' });
});

router.get('/desktop', (req, res) => {
  res.render('de/desktop', { language: 'de', device: 'desktop' });
});

module.exports = router;
