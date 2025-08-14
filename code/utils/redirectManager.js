const axios = require('axios');

const path = require('path');
const fs = require('fs');

// Smart redirect for subpages like /hr/apartman-s-vrtom or /de/apartman-s-vrtom
function handleSmartPageRedirect(req, res) {
  // Get lang and page from route params
  const lang = req.params.lang || 'hr';
  const page = req.params.page;
  const isMobile = req.useragent && req.useragent.isMobile;

  // Build paths to EJS files
  const desktopPath = path.join(__dirname, '..', '..', 'views', lang, `${page}.ejs`);
  const mobilePath = path.join(__dirname, '..', '..', 'views', lang, `${page}.ejs`);

  if (!page) return res.status(404).render('error', { message: 'Stranica nije pronađena.' });

  if (isMobile && fs.existsSync(mobilePath)) {
    return res.redirect(`/${lang}/mobile/${page}`);
  } else if (!isMobile && fs.existsSync(desktopPath)) {
    return res.redirect(`/${lang}/desktop/${page}`);
  } else if (fs.existsSync(mobilePath)) {
    return res.redirect(`/${lang}/mobile/${page}`);
  } else if (fs.existsSync(desktopPath)) {
    return res.redirect(`/${lang}/desktop/${page}`);
  } else {
    return res.status(404).render('error', { message: 'Stranica nije pronađena.' });
  }
}

// Get user's location and redirect to appropriate language
async function handleRootRedirect(req, res) {
  const clientIp = req.ip;
  let countryCode = "EN";
  
  try {
    const response = await axios.get(`http://ip-api.com/json/${clientIp}`);
    if (response.data && response.data.countryCode) {
      countryCode = response.data.countryCode;
    }
  } catch (error) {
    return res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Geolocation error",
        "error-message": error.message || "Failed to fetch location.",
      },
      validBackPage: req.session.validBackPage,
    });
  }

  let lang = "en";
  if (countryCode === "HR") lang = "hr";
  else if (countryCode === "DE") lang = "de";

  const isMobile = req.useragent.isMobile;
  const device = isMobile ? "mobile" : "desktop";
  res.redirect(`/${lang}/${device}`);
}

// Handle desktop redirect
async function handleDesktopRedirect(req, res) {
  let countryCode = "EN";
  
  try {
    const response = await axios.get(`http://ip-api.com/json/${req.ip}`);
    if (response.data && response.data.countryCode) {
      countryCode = response.data.countryCode;
    }
  } catch (error) {
    return res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Geolocation error",
        "error-message": error.message || "Failed to fetch location.",
      },
      lastVisitedPage: req.session.lastVisitedPage,
    });
  }

  let lang = "en";
  if (countryCode === "HR") lang = "hr";
  else if (countryCode === "DE") lang = "de";

  res.redirect(`/${lang}/desktop`);
}

// Handle mobile redirect
async function handleMobileRedirect(req, res) {
  let countryCode = "EN";
  
  try {
    const response = await axios.get(`http://ip-api.com/json/${req.ip}`);
    if (response.data && response.data.countryCode) {
      countryCode = response.data.countryCode;
    }
  } catch (error) {
    return res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Geolocation error",
        "error-message": error.message || "Failed to fetch location.",
      },
      lastVisitedPage: req.session.lastVisitedPage,
    });
  }

  let lang = "en";
  if (countryCode === "HR") lang = "hr";
  else if (countryCode === "DE") lang = "de";

  res.redirect(`/${lang}/mobile`);
}

module.exports = {
  handleRootRedirect,
  handleDesktopRedirect,
  handleMobileRedirect,
  handleSmartPageRedirect
};
