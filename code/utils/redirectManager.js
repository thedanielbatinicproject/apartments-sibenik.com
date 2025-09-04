const axios = require('axios');
const authManager = require('../auth/authManager');

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



  if (!page) return res.status(404).render('error', { 
    error: { 
      'error-message': 'The page you requested: ' + page + ' could not be found.',
      'error-code': '404', 
      'error-title': 'Page not found' 
    }
  });

  if (isMobile && fs.existsSync(mobilePath)) {
    return res.redirect(`/${lang}/mobile/${page}`);
  } else if (!isMobile && fs.existsSync(desktopPath)) {
    return res.redirect(`/${lang}/desktop/${page}`);
  } else if (fs.existsSync(mobilePath)) {
    return res.redirect(`/${lang}/mobile/${page}`);
  } else if (fs.existsSync(desktopPath)) {
    return res.redirect(`/${lang}/desktop/${page}`);
  } else {
    return res.status(404).render('error', { 
      error: { 
        'error-message': 'The page you requested: ' + page + ' could not be found.', 
        'error-code': '404', 
        'error-title': 'Page not found' 
      }
    });
  }
}

// Get user's location and redirect to appropriate language
async function handleRootRedirect(req, res) {
  // First check if user has a preferred language cookie
  let lang = "en"; // default
  
  if (req.cookies && req.cookies.preferred_language) {
    // User has saved language preference
    lang = req.cookies.preferred_language;
    console.log('handleRootRedirect: Using saved language preference:', lang);
  } else {
    // No saved preference, use geolocation
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
        validBackPage: req.session.validBackPage
      });
    }

    if (countryCode === "HR") lang = "hr";
    else if (countryCode === "DE") lang = "de";
    else lang = "en";
    
    console.log('handleRootRedirect: No saved preference, using geolocation. Country:', countryCode, 'Language:', lang);
  }

  

  const isMobile = req.useragent.isMobile;
  const device = isMobile ? "mobile" : "desktop";
  if (req.page) {
    if (req.page === 'soba'){
        res.redirect(`/${lang}/${device}/soba`);
    }
    if (req.page === 'studio'){
        res.redirect(`/${lang}/${device}/studio-apartman`);
    }
    if(req.page === 'apartment' || req.page === 'apartman'){
        res.redirect(`/${lang}/${device}/apartman-s-vrtom`);
    }

  }
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
