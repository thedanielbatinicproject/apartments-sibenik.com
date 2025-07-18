const express = require('express');
const { handleRootRedirect, handleDesktopRedirect, handleMobileRedirect } = require('../code/utils/redirectManager');
const { handleHeaderTest } = require('../code/utils/headerTestManager');
const { displayGallery } = require('../code/gallery/galleryRoutes');
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
