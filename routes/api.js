const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { reservationValidationRules } = require('../code/validatorManager');
const { processReservation, checkAvailability } = require('../code/reservationManager');
const { displayCalendar, updateCalendar, cleanCalendar } = require('../code/calendarRoutes');
const { getReviews, handleUpvote } = require('../code/reviewRoutes');
const router = express.Router();

// Calendar API routes
router.get('/calendar/:id', displayCalendar);
router.get('/update-calendar/:id', updateCalendar);
router.get('/clean-calendar/:id', cleanCalendar);

// Reviews API routes
router.get('/reviews/:id', getReviews);
router.post('/reviews/:unitId/:reviewIndex/upvote', handleUpvote);

// Reservation API routes
router.post('/submit-reservation', reservationValidationRules, processReservation);
router.post('/check-availability', checkAvailability);

// Backyard Management API routes for ESP32 for solar data
router.post('/backyard-management', async (req, res) => {
  try {
    // Validacija secret key-a
    const secretKey = req.body.secret_key;
    if (!secretKey || secretKey !== process.env.SECRET_API_KEY) {
      return res.status(401).json({ error: 'Invalid secret key' });
    }

    // Ukloni secret_key iz podataka prije spremanja
    const solarData = { ...req.body };
    delete solarData.secret_key;

    // Dodaj timestamp (hrvatsko vrijeme - UTC+1/UTC+2)
    const now = new Date();
    const croatianTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (2 * 3600000)); // UTC+2 za ljeto
    solarData.timestamp = croatianTime.toISOString();
    solarData.local_time = croatianTime.toLocaleString('hr-HR', { 
      timeZone: 'Europe/Zagreb',
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // Spremi u solars_public.json (dodaj u history)
    const publicDataPath = path.join(__dirname, '../data/public_data/solars_public.json');
    let history = [];
    
    try {
      const existingData = await fs.readFile(publicDataPath, 'utf8');
      history = JSON.parse(existingData);
    } catch (err) {
      // Fajl ne postoji, kreiraj prazan niz
      history = [];
    }

    history.push(solarData);
    
    // Zadrži samo zadnjih 1000 zapisa da ne naraste preveć
    if (history.length > 1000) {
      history = history.slice(-1000);
    }

    await fs.writeFile(publicDataPath, JSON.stringify(history, null, 2));

    res.json({ 
      status: 'success', 
      message: 'Data saved successfully',
      timestamp: solarData.local_time
    });

  } catch (error) {
    console.error('Error in backyard-management POST:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/backyard-management', async (req, res) => {
  try {
    // Učitaj relay statuse iz solar_control.json
    const controlDataPath = path.join(__dirname, '../data/private/solar_control.json');
    
    try {
      const controlData = await fs.readFile(controlDataPath, 'utf8');
      const parsed = JSON.parse(controlData);
      
      res.json({
        relej1_on: parsed.relay_1 || false,
        relej2_on: parsed.relay_2 || false,
        relej3_on: parsed.relay_3 || false,
        relej4_on: parsed.relay_4 || false
      });
    } catch (err) {
      // Ako fajl ne postoji, vrati defaultne vrijednosti
      res.json({
        relej1_on: false,
        relej2_on: false,
        relej3_on: false,
        relej4_on: false
      });
    }

  } catch (error) {
    console.error('Error in backyard-management GET:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
