const express = require('express');
const { handleRootRedirect, handleDesktopRedirect, handleMobileRedirect } = require('../code/utils/redirectManager');
const { handleHeaderTest } = require('../code/utils/headerTestManager');
const { displayGallery } = require('../code/gallery/galleryRoutes');
const { handleSmartPageRedirect } = require('../code/utils/redirectManager');
const router = express.Router();

// Root and redirect routes
router.get('/', handleRootRedirect);
router.get('/desktop', handleDesktopRedirect);
router.get('/mobile', handleMobileRedirect);
router.get('/gallery', displayGallery);
router.get('/header', handleHeaderTest);
router.get('/:lang/:page', handleSmartPageRedirect); // univerzalna ruta na kraj!

module.exports = router;
