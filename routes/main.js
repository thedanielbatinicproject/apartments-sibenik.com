const express = require('express');
const { handleRootRedirect, handleDesktopRedirect, handleMobileRedirect } = require('../code/utils/redirectManager');
const { handleHeaderTest } = require('../code/utils/headerTestManager');
const { displayGallery } = require('../code/gallery/galleryRoutes');
const { handleSmartPageRedirect } = require('../code/utils/redirectManager');
const { handleCheckInvoice, processInvoiceCheck } = require('../code/utils/invoiceChecker');
const router = express.Router();

// Root and redirect routes
router.get('/', handleRootRedirect);
router.get('/soba', (req, res) => {req.page = "soba";handleRootRedirect(req, res)});
router.get('/studio', (req, res) => {req.page = "studio";handleRootRedirect(req, res)});
router.get('/apartment', (req, res) => {req.page = "apartment";handleRootRedirect(req, res)});
router.get('/desktop', handleDesktopRedirect);
router.get('/mobile', handleMobileRedirect);
router.get('/gallery', displayGallery);
router.get('/header', handleHeaderTest);

// Invoice checking routes
router.get('/check-invoice', handleCheckInvoice);
router.post('/check-invoice', processInvoiceCheck);

router.get('/:lang/:page', handleSmartPageRedirect); // univerzalna ruta na kraj!

module.exports = router;
