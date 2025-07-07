const express = require('express');
const router = express.Router();

router.get('/mobile', (req, res) => {
  res.render('en/mobile', { language: 'en', device: 'mobile' });
});

router.get('/desktop', (req, res) => {
  res.render('en/desktop', { language: 'en', device: 'desktop' });
});

module.exports = router;
