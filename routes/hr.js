const express = require('express');
const router = express.Router();

router.get('/mobile', (req, res) => {
  res.render('hr/mobile', { language: 'hr', device: 'mobile' });
});

router.get('/desktop', (req, res) => {
  res.render('hr/desktop', { language: 'hr', device: 'desktop' });
});

module.exports = router;
