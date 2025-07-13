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
    const galleryImages = [
      { thumbnail: "/images/gallery/studio/studio-slike-1-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-1.jpg", alt: "Studio slika 1" },
      { thumbnail: "/images/gallery/studio/studio-slike-2-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-2.jpg", alt: "Studio slika 2" },
      { thumbnail: "/images/gallery/studio/studio-slike-3-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-3.jpg", alt: "Studio slika 3" },
      { thumbnail: "/images/gallery/studio/studio-slike-4-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-4.jpg", alt: "Studio slika 4" },
      { thumbnail: "/images/gallery/studio/studio-slike-5-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-5.jpg", alt: "Studio slika 5" },
      { thumbnail: "/images/gallery/studio/studio-slike-6-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-6.jpg", alt: "Studio slika 6" },
      { thumbnail: "/images/gallery/studio/studio-slike-7-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-7.jpg", alt: "Studio slika 7" },
      { thumbnail: "/images/gallery/studio/studio-slike-8-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-8.jpg", alt: "Studio slika 8" },
      { thumbnail: "/images/gallery/studio/studio-slike-9-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-9.jpg", alt: "Studio slika 9" }
    ];
    res.render('hr/mobile', { language: 'hr', device: 'mobile', calendar, galleryImages });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Greška pri dohvaćanju kalendara",
        "error-message": err.message || "Neuspješno dohvaćanje kalendara."
      },
      validBackPage: req.session.validBackPage
    });
  }
});

router.get('/desktop', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    const galleryImages = [
      { thumbnail: "/images/gallery/studio/studio-slike-1-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-1.jpg", alt: "Studio slika 1" },
      { thumbnail: "/images/gallery/studio/studio-slike-2-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-2.jpg", alt: "Studio slika 2" },
      { thumbnail: "/images/gallery/studio/studio-slike-3-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-3.jpg", alt: "Studio slika 3" },
      { thumbnail: "/images/gallery/studio/studio-slike-4-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-4.jpg", alt: "Studio slika 4" },
      { thumbnail: "/images/gallery/studio/studio-slike-5-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-5.jpg", alt: "Studio slika 5" },
      { thumbnail: "/images/gallery/studio/studio-slike-6-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-6.jpg", alt: "Studio slika 6" },
      { thumbnail: "/images/gallery/studio/studio-slike-7-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-7.jpg", alt: "Studio slika 7" },
      { thumbnail: "/images/gallery/studio/studio-slike-8-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-8.jpg", alt: "Studio slika 8" },
      { thumbnail: "/images/gallery/studio/studio-slike-9-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-9.jpg", alt: "Studio slika 9" }
    ];
    res.render('hr/desktop', { language: 'hr', device: 'desktop', calendar, galleryImages });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Greška pri dohvaćanju kalendara",
        "error-message": err.message || "Neuspješno dohvaćanje kalendara."
      },
      validBackPage: req.session.validBackPage
    });
  }
});

module.exports = router;
