const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { calendarScheduler } = require('../code/calendarScheduler');
const router = express.Router();

// Middleware za osnovnu autentifikaciju (možeš proširiti kasnije)
const requireAuth = (req, res, next) => {
  // Za sada jednostavna provjera - možeš dodati pravu autentifikaciju kasnije
  const isAuthenticated = req.session.isAdmin || false;
  if (!isAuthenticated) {
    // Privremeno preskačemo autentifikaciju za development
    // return res.redirect('/management/login');
  }
  next();
};

// Solar Dashboard route
router.get('/solar-dashboard', requireAuth, async (req, res) => {
  try {
    // Učitaj solar podatke
    const solarDataPath = path.join(__dirname, '../data/public_data/solars_public.json');
    let solarData = [];
    
    try {
      const data = await fs.readFile(solarDataPath, 'utf8');
      solarData = JSON.parse(data);
    } catch (err) {
      console.log('No solar data found, using empty array');
      solarData = [];
    }

    // Uzmi zadnjih 50 zapisa za prikaz
    const recentData = solarData.slice(-50);
    const latestData = solarData.length > 0 ? solarData[solarData.length - 1] : null;

    res.render('management/solar-dashboard', {
      title: 'Solar Dashboard - Management',
      solarData: recentData,
      latestData: latestData,
      totalRecords: solarData.length
    });
  } catch (error) {
    console.error('Error loading solar dashboard:', error);
    res.status(500).render('error', { 
      error: { status: 500, message: 'Error loading solar dashboard' } 
    });
  }
});

// Management home page
router.get('/', requireAuth, (req, res) => {
  res.render('management/index', {
    title: 'Management Dashboard',
    schedulerStatus: calendarScheduler.getStatus()
  });
});

// Scheduler control routes
router.post('/scheduler/start', requireAuth, (req, res) => {
  calendarScheduler.start();
  res.json({ success: true, status: calendarScheduler.getStatus() });
});

router.post('/scheduler/stop', requireAuth, (req, res) => {
  calendarScheduler.stop();
  res.json({ success: true, status: calendarScheduler.getStatus() });
});

router.get('/scheduler/status', requireAuth, (req, res) => {
  res.json(calendarScheduler.getStatus());
});

module.exports = router;
