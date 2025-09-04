const express = require('express');
const { fetchCalendars } = require('../code/calendar/calendarAPI');
const { generateGalleryImages } = require('../code/utils/galleryHelper');
const { getCombinedReviews } = require('../code/reviews/reviewsAPI');
const reviewUpvoteManager = require('../code/reviews/reviewUpvoteManager');
const authManager = require('../code/auth/authManager');
const router = express.Router();

// Desktop subpages
router.get('/desktop/apartman-s-vrtom', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const apartmentImages = generateGalleryImages('apartment');
    
    // Get reviews and upvote data for unit "1" (apartman s vrtom)
    const reviews = await getCombinedReviews('1');
    const userId = reviewUpvoteManager.getUserId(req, res);
    const upvoteData = reviewUpvoteManager.getUserUpvoteData(
      userId,
      reviews.allReviews,
      '1'
    );
    
    res.render('en/apartman-s-vrtom', { language: 'en', 
      device: 'desktop',
      calendar1: calendars.calendar1,
      calendar2: calendars.calendar2,
      images: apartmentImages,
      reviewsData: reviews,
      upvoteData: upvoteData,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  } catch (err) {
    res.status(500).render('error', { error: {
        "error-code": 500,
        "error-title": "Error fetching data",
        "error-message": err.message || "Failed to fetch data."
      },
      validBackPage: req.session.validBackPage,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  }
});

router.get('/desktop/studio-apartman', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const reviews = await getCombinedReviews('2');
    const studioImages = generateGalleryImages('studio');
    const userId = reviewUpvoteManager.getUserId(req, res);
    const upvoteData = reviewUpvoteManager.getUserUpvoteData(
      userId,
      reviews.allReviews,
      '2'
    );
    res.render('en/studio-apartman', { language: 'en', 
      device: 'desktop',
      calendar1: calendars.calendar1,
      images: studioImages,
      reviewsData: reviews,
      upvoteData: upvoteData,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  } catch (err) {
    res.status(500).render('error', { error: {
        "error-code": 500,
        "error-title": "Error fetching data",
        "error-message": err.message || "Failed to fetch data."
      },
      validBackPage: req.session.validBackPage,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  }
});

router.get('/desktop/soba', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const roomImages = generateGalleryImages('room');
    res.render('en/soba', { language: 'en', 
      device: 'desktop',
      calendar3: calendars.calendar3,
      images: roomImages,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  } catch (err) {
    res.status(500).render('error', { error: {
        "error-code": 500,
        "error-title": "Error fetching data",
        "error-message": err.message || "Failed to fetch data."
      },
      validBackPage: req.session.validBackPage,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  }
});

router.get('/desktop/o-sibeniku', (req, res) => {
  const sibenikImages = generateGalleryImages('sibenik');
  res.render('en/o-sibeniku', { language: 'en', 
    device: 'desktop',
    images: sibenikImages,
      isAuthenticated: authManager.isUserAuthenticated(req) });
});

router.get('/desktop/kontakt', (req, res) => {
  res.render('en/kontakt', { language: 'en', device: 'desktop',
      isAuthenticated: authManager.isUserAuthenticated(req) });
});

router.get('/', (req, res) => {
  const isMobile = req.useragent && req.useragent.isMobile;
  res.redirect(isMobile ? '/en/mobile' : '/en/desktop');
});

router.get('/mobile', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    
    // Fetch reviews data
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
      { thumbnail: "/images/gallery/studio/studio-slike-1-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-1.jpg", alt: "Studio Image 1" },
      { thumbnail: "/images/gallery/studio/studio-slike-2-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-2.jpg", alt: "Studio Image 2" },
      { thumbnail: "/images/gallery/studio/studio-slike-3-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-3.jpg", alt: "Studio Image 3" },
      { thumbnail: "/images/gallery/studio/studio-slike-4-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-4.jpg", alt: "Studio Image 4" },
      { thumbnail: "/images/gallery/studio/studio-slike-5-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-5.jpg", alt: "Studio Image 5" },
      { thumbnail: "/images/gallery/studio/studio-slike-6-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-6.jpg", alt: "Studio Image 6" },
      { thumbnail: "/images/gallery/studio/studio-slike-7-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-7.jpg", alt: "Studio Image 7" },
      { thumbnail: "/images/gallery/studio/studio-slike-8-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-8.jpg", alt: "Studio Image 8" },
      { thumbnail: "/images/gallery/studio/studio-slike-9-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-9.jpg", alt: "Studio Image 9" }
    ];
    res.render('en/home', { language: 'en', device: 'mobile', calendar, galleryImages, reviewsData,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  } catch (err) {
    res.status(500).render('error', { error: {
        "error-code": 500,
        "error-title": "Error fetching calendar",
        "error-message": err.message || "Failed to fetch calendar."
      },
      validBackPage: req.session.validBackPage,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  }
});

router.get('/mobile/apartman-s-vrtom', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const apartmentImages = generateGalleryImages('apartment');
    
    // Get reviews and upvote data for unit "1" (apartman s vrtom)
    const reviews = await getCombinedReviews('1');
    const userId = reviewUpvoteManager.getUserId(req, res);
    const upvoteData = reviewUpvoteManager.getUserUpvoteData(
      userId,
      reviews.reviews,
      '1'
    );
    
    res.render('en/apartman-s-vrtom', { language: 'en', 
      device: 'mobile',
      calendar1: calendars.calendar1,
      images: apartmentImages,
      reviewsData: reviews,
      upvoteData: upvoteData,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  } catch (err) {
    res.status(500).render('error', { error: {
        "error-code": 500,
        "error-title": "Error fetching calendar",
        "error-message": err.message || "Failed to fetch calendar."
      },
      validBackPage: req.session.validBackPage,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  }
});

router.get('/mobile/studio-apartman', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const studioImages = generateGalleryImages('studio');
    res.render('en/studio-apartman', { language: 'en', 
      device: 'mobile',
      calendar2: calendars.calendar2,
      images: studioImages,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  } catch (err) {
    res.status(500).render('error', { error: {
        "error-code": 500,
        "error-title": "Error fetching data",
        "error-message": err.message || "Failed to fetch data."
      },
      validBackPage: req.session.validBackPage,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  }
});

router.get('/mobile/soba', async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const roomImages = generateGalleryImages('room');
    res.render('en/soba', { language: 'en', 
      device: 'mobile',
      calendar3: calendars.calendar3,
      images: roomImages,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  } catch (err) {
    res.status(500).render('error', { error: {
        "error-code": 500,
        "error-title": "Error fetching data",
        "error-message": err.message || "Failed to fetch data."
      },
      validBackPage: req.session.validBackPage,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  }
});

router.get('/mobile/o-sibeniku', (req, res) => {
  const sibenikImages = generateGalleryImages('sibenik');
  res.render('en/o-sibeniku', { language: 'en', 
    device: 'mobile',
    images: sibenikImages,
      isAuthenticated: authManager.isUserAuthenticated(req) });
});

router.get('/mobile/kontakt', (req, res) => {
  res.render('en/kontakt', { language: 'en', device: 'mobile',
      isAuthenticated: authManager.isUserAuthenticated(req) });
});

router.get('/desktop', async (req, res) => {
  try {
    const calendar = await fetchCalendars();
    
    // Fetch reviews data
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
      { thumbnail: "/images/gallery/studio/studio-slike-1-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-1.jpg", alt: "Studio Image 1" },
      { thumbnail: "/images/gallery/studio/studio-slike-2-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-2.jpg", alt: "Studio Image 2" },
      { thumbnail: "/images/gallery/studio/studio-slike-3-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-3.jpg", alt: "Studio Image 3" },
      { thumbnail: "/images/gallery/studio/studio-slike-4-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-4.jpg", alt: "Studio Image 4" },
      { thumbnail: "/images/gallery/studio/studio-slike-5-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-5.jpg", alt: "Studio Image 5" },
      { thumbnail: "/images/gallery/studio/studio-slike-6-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-6.jpg", alt: "Studio Image 6" },
      { thumbnail: "/images/gallery/studio/studio-slike-7-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-7.jpg", alt: "Studio Image 7" },
      { thumbnail: "/images/gallery/studio/studio-slike-8-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-8.jpg", alt: "Studio Image 8" },
      { thumbnail: "/images/gallery/studio/studio-slike-9-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-9.jpg", alt: "Studio Image 9" }
    ];
    res.render('en/home', { language: 'en', device: 'desktop', calendar, galleryImages, reviewsData,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  } catch (err) {
    res.status(500).render('error', { error: {
        "error-code": 500,
        "error-title": "Error fetching calendar",
        "error-message": err.message || "Failed to fetch calendar."
      },
      validBackPage: req.session.validBackPage,
      isAuthenticated: authManager.isUserAuthenticated(req) });
  }
});

module.exports = router;
