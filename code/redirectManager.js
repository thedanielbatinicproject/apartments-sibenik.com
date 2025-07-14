const axios = require('axios');

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
  handleMobileRedirect
};
