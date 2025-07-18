const express = require('express');
const router = express.Router();

// Legacy routes for backward compatibility (redirect to new API routes)
router.get('/calendar/:id', (req, res) => res.redirect(`/api/calendar/${req.params.id}`));
router.get('/kalendar/:id', (req, res) => res.redirect(`/api/update-calendar/${req.params.id}`));
router.get('/clean-calendar/:id', (req, res) => res.redirect(`/api/clean-calendar/${req.params.id}`));
router.get('/reviews/:id', (req, res) => res.redirect(`/api/reviews/${req.params.id}`));
router.post('/submit-reservation', (req, res) => res.redirect(307, '/api/submit-reservation'));
router.post('/check-availability', (req, res) => res.redirect(307, '/api/check-availability'));

module.exports = router;
