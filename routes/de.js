const express = require('express');
const { fetchCalendars } = require('../code/calendar/calendarAPI');
const router = express.Router();

router.get('/', (req, res) => {
  const isMobile = req.useragent && req.useragent.isMobile;
  res.redirect(isMobile ? '/de/mobile' : '/de/desktop');
});

router.get('/mobile', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    const galleryImages = [
      { thumbnail: "/images/gallery/studio/studio-slike-1-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-1.jpg", alt: "Studio Bild 1" },
      { thumbnail: "/images/gallery/studio/studio-slike-2-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-2.jpg", alt: "Studio Bild 2" },
      { thumbnail: "/images/gallery/studio/studio-slike-3-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-3.jpg", alt: "Studio Bild 3" },
      { thumbnail: "/images/gallery/studio/studio-slike-4-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-4.jpg", alt: "Studio Bild 4" },
      { thumbnail: "/images/gallery/studio/studio-slike-5-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-5.jpg", alt: "Studio Bild 5" },
      { thumbnail: "/images/gallery/studio/studio-slike-6-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-6.jpg", alt: "Studio Bild 6" },
      { thumbnail: "/images/gallery/studio/studio-slike-7-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-7.jpg", alt: "Studio Bild 7" },
      { thumbnail: "/images/gallery/studio/studio-slike-8-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-8.jpg", alt: "Studio Bild 8" },
      { thumbnail: "/images/gallery/studio/studio-slike-9-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-9.jpg", alt: "Studio Bild 9" }
    ];
    res.render('de/home', { language: 'de', device: 'mobile', calendar, galleryImages });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Fehler beim Laden des Kalenders",
        "error-message": err.message || "Kalender konnte nicht geladen werden."
      },
      validBackPage: req.session.validBackPage
    });
  }
});

router.get('/desktop', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    const galleryImages = [
      { thumbnail: "/images/gallery/studio/studio-slike-1-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-1.jpg", alt: "Studio Bild 1" },
      { thumbnail: "/images/gallery/studio/studio-slike-2-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-2.jpg", alt: "Studio Bild 2" },
      { thumbnail: "/images/gallery/studio/studio-slike-3-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-3.jpg", alt: "Studio Bild 3" },
      { thumbnail: "/images/gallery/studio/studio-slike-4-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-4.jpg", alt: "Studio Bild 4" },
      { thumbnail: "/images/gallery/studio/studio-slike-5-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-5.jpg", alt: "Studio Bild 5" },
      { thumbnail: "/images/gallery/studio/studio-slike-6-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-6.jpg", alt: "Studio Bild 6" },
      { thumbnail: "/images/gallery/studio/studio-slike-7-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-7.jpg", alt: "Studio Bild 7" },
      { thumbnail: "/images/gallery/studio/studio-slike-8-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-8.jpg", alt: "Studio Bild 8" },
      { thumbnail: "/images/gallery/studio/studio-slike-9-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-9.jpg", alt: "Studio Bild 9" }
    ];
    res.render('de/home', { language: 'de', device: 'desktop', calendar, galleryImages });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Fehler beim Laden des Kalenders",
        "error-message": err.message || "Kalender konnte nicht geladen werden."
      },
      validBackPage: req.session.validBackPage
    });
  }
});

module.exports = router;
