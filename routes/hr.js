
const express = require('express');
const { fetchCalendars } = require('../code/calendar/calendarAPI');
const { generateGalleryImages, generateApartmentGalleryImages } = require('../code/utils/galleryHelper');
const { getCombinedReviews } = require('../code/reviews/reviewsAPI');
const reviewUpvoteManager = require('../code/reviews/reviewUpvoteManager');
const router = express.Router();

// Desktop podstranice
router.get('/desktop/apartman-s-vrtom', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const apartmentImages = generateApartmentGalleryImages('apartman-vrt');
    
    // Get reviews and upvote data for unit "1" (apartman s vrtom)
    const reviews = await getCombinedReviews('1'); // Dohvaćamo sve recenzije
    const userId = reviewUpvoteManager.getUserId(req, res);
    const upvoteData = reviewUpvoteManager.getUserUpvoteData(
      userId,
      reviews.allReviews, // Koristimo sve recenzije za upvote data
      '1'
    );
    
    res.render('hr/apartman-s-vrtom', { 
      language: 'hr', 
      device: 'desktop',
      calendar1: calendars.calendar1,
      calendar2: calendars.calendar2,
      images: apartmentImages,
      reviewsData: reviews,
      upvoteData: upvoteData,
      galleryImages: apartmentImages // Pass gallery images for the page
    });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Greška pri dohvaćanju podataka",
        "error-message": err.message || "Neuspješno dohvaćanje podataka."
      },
      validBackPage: req.session.validBackPage
    });
  }
});

router.get('/desktop/studio-apartman', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const studioImages = generateGalleryImages('studio');
    res.render('hr/studio-apartman', { 
      language: 'hr', 
      device: 'desktop',
      calendar2: calendars.calendar2,
      images: studioImages
    });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Greška pri dohvaćanju podataka",
        "error-message": err.message || "Neuspješno dohvaćanje podataka."
      },
      validBackPage: req.session.validBackPage
    });
  }
});

router.get('/desktop/soba', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const roomImages = generateGalleryImages('room');
    res.render('hr/soba', { 
      language: 'hr', 
      device: 'desktop',
      calendar3: calendars.calendar3,
      images: roomImages
    });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Greška pri dohvaćanju podataka",
        "error-message": err.message || "Neuspješno dohvaćanje podataka."
      },
      validBackPage: req.session.validBackPage
    });
  }
});

router.get('/desktop/o-sibeniku', (req, res) => {
  const sibenikImages = generateGalleryImages('sibenik');
  res.render('hr/o-sibeniku', { 
    language: 'hr', 
    device: 'desktop',
    images: sibenikImages
  });
});

router.get('/desktop/kontakt', (req, res) => {
  res.render('hr/kontakt', { language: 'hr', device: 'desktop' });
});

router.get('/', (req, res) => {
  const isMobile = req.useragent && req.useragent.isMobile;
  res.redirect(isMobile ? '/hr/mobile' : '/hr/desktop');
});

router.get('/mobile', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    
    // Dohvati reviews podatke
    const { getCombinedReviews } = require('../code/reviews/reviewsAPI');
    let reviewsData = {};
    try {
      for (let unitId of ['1', '2']) {
        reviewsData[unitId] = await getCombinedReviews(unitId);
      }
    } catch (error) {
      console.error('Error fetching reviews for mobile:', error);
      reviewsData = { '1': { reviews: [], rating: 0 }, '2': { reviews: [], rating: 0 } };
    }
    
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
    res.render('hr/home', { language: 'hr', device: 'mobile', calendar, galleryImages, reviewsData });
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

router.get('/mobile/apartman-s-vrtom', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const apartmentImages = generateApartmentGalleryImages('apartman-vrt');
    
    // Get reviews and upvote data for unit "1" (apartman s vrtom)
    const reviews = await getCombinedReviews('1');
    const userId = reviewUpvoteManager.getUserId(req, res);
    const upvoteData = reviewUpvoteManager.getUserUpvoteData(
      userId,
      reviews.reviews,
      '1'
    );
    
    res.render('hr/apartman-s-vrtom', { 
      language: 'hr', 
      device: 'mobile',
      calendar1: calendars.calendar1,
      images: apartmentImages,
      reviewsData: reviews,
      upvoteData: upvoteData,
      galleryImages: apartmentImages // Pass gallery images for the page
    });
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

router.get('/mobile/studio-apartman', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const studioImages = generateGalleryImages('studio');
    res.render('hr/studio-apartman', { 
      language: 'hr', 
      device: 'mobile',
      calendar2: calendars.calendar2,
      images: studioImages
    });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Greška pri dohvaćanju podataka",
        "error-message": err.message || "Neuspješno dohvaćanje podataka."
      },
      validBackPage: req.session.validBackPage
    });
  }
});

router.get('/mobile/soba', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const roomImages = generateGalleryImages('room');
    res.render('hr/soba', { 
      language: 'hr', 
      device: 'mobile',
      calendar3: calendars.calendar3,
      images: roomImages
    });
  } catch (err) {
    res.status(500).render('error', {
      error: {
        "error-code": 500,
        "error-title": "Greška pri dohvaćanju podataka",
        "error-message": err.message || "Neuspješno dohvaćanje podataka."
      },
      validBackPage: req.session.validBackPage
    });
  }
});

router.get('/mobile/o-sibeniku', (req, res) => {
  const sibenikImages = generateGalleryImages('sibenik');
  res.render('hr/o-sibeniku', { 
    language: 'hr', 
    device: 'mobile',
    images: sibenikImages
  });
});

router.get('/mobile/kontakt', (req, res) => {
  res.render('hr/kontakt', { language: 'hr', device: 'mobile' });
});

router.get('/desktop', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    
    // Dohvati reviews podatke
    const { getCombinedReviews } = require('../code/reviews/reviewsAPI');
    let reviewsData = {};
    try {
      for (let unitId of ['1', '2']) {
        reviewsData[unitId] = await getCombinedReviews(unitId);
      }
    } catch (error) {
      console.error('Error fetching reviews for desktop:', error);
      reviewsData = { '1': { reviews: [], rating: 0 }, '2': { reviews: [], rating: 0 } };
    }
    
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
    res.render('hr/home', { language: 'hr', device: 'desktop', calendar, galleryImages, reviewsData });
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
