const express = require('express');
const { handleRootRedirect, handleDesktopRedirect, handleMobileRedirect } = require('../code/redirectManager');
const { handleHeaderTest } = require('../code/headerTestManager');
const { displayGallery } = require('../code/galleryRoutes');
const router = express.Router();

// Root and redirect routes
router.get('/', handleRootRedirect);
router.get('/desktop', handleDesktopRedirect);
router.get('/mobile', handleMobileRedirect);

// Gallery route
router.get('/gallery', displayGallery);

// Header test route
router.get('/header', handleHeaderTest);

module.exports = router;
