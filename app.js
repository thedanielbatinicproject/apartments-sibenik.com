const express = require("express");
const axios = require("axios");
const path = require("path");
const useragent = require("express-useragent");
const ical = require("node-ical");
const os = require("os");
const session = require("express-session");
require('dotenv').config();

const {
  fetchCalendars,
  fetchIcalReservations,
  updateCalendarFromIcal,
  cleanDuplicatesFromCalendar
} = require("./code/calendarAPI");

const app = express();
app.use(useragent.express());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware to track valid visited pages history
app.use((req, res, next) => {
  // Skip tracking for error pages, API endpoints, and static files
  if (!req.path.includes('/error') && 
      !req.path.includes('/kalendar/') && 
      !req.path.includes('/calendar/') && 
      !req.path.includes('/clean-calendar/') &&
      !req.path.includes('/gallery') &&
      !req.path.includes('.') && // Skip static files
      req.method === 'GET') {
    
    // Initialize pages history if it doesn't exist
    if (!req.session.pagesHistory) {
      req.session.pagesHistory = [];
    }
    
    // Add current page to history (avoid duplicates)
    if (req.session.pagesHistory[req.session.pagesHistory.length - 1] !== req.originalUrl) {
      req.session.pagesHistory.push(req.originalUrl);
      
      // Keep only last 10 pages to avoid memory issues
      if (req.session.pagesHistory.length > 10) {
        req.session.pagesHistory.shift();
      }
    }
  }
  next();
});

// Middleware to set valid back page (excluding current page)
app.use((req, res, next) => {
  if (req.session.pagesHistory && req.session.pagesHistory.length > 1) {
    // Get the second-to-last page (exclude current page)
    req.session.validBackPage = req.session.pagesHistory[req.session.pagesHistory.length - 2];
  } else {
    req.session.validBackPage = null;
  }
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.set("trust proxy", true);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/hr", require("./routes/hr"));
app.use("/de", require("./routes/de"));
app.use("/en", require("./routes/en"));

app.get("/", async (req, res) => {
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
        "error-title": "Greška pri geolokaciji",
        "error-message": error.message || "Neuspješno dohvaćanje lokacije.",
      },
      validBackPage: req.session.validBackPage
    });
  }

  let lang = "en";
  if (countryCode === "HR") lang = "hr";
  else if (countryCode === "DE") lang = "de";

  const isMobile = req.useragent.isMobile;
  const device = isMobile ? "mobile" : "desktop";
  res.redirect(`/${lang}/${device}`);
});

app.get("/desktop", async (req, res) => {
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
        "error-title": "Greška pri geolokaciji",
        "error-message": error.message || "Neuspješno dohvaćanje lokacije.",
      },
      lastVisitedPage: req.session.lastVisitedPage
    });
  }

  let lang = "en";
  if (countryCode === "HR") lang = "hr";
  else if (countryCode === "DE") lang = "de";

  res.redirect(`/${lang}/desktop`);
});

app.get("/mobile", async (req, res) => {
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
        "error-title": "Greška pri geolokaciji",
        "error-message": error.message || "Neuspješno dohvaćanje lokacije.",
      },
      lastVisitedPage: req.session.lastVisitedPage
    });
  }

  let lang = "en";
  if (countryCode === "HR") lang = "hr";
  else if (countryCode === "DE") lang = "de";

  res.redirect(`/${lang}/mobile`);
});

// Prikaz kalendara 1 ili 2 - ograničeno na prva dva apartmana
app.get("/calendar/:id", async (req, res) => {
  try {
    const calendarId = req.params.id;
    
    // Ograniči na kalendare 1 i 2
    if (calendarId !== '1' && calendarId !== '2') {
      return res.status(404).render("error", {
        error: {
          "error-code": 404,
          "error-title": "Kalendar nije pronađen",
          "error-message": `Kalendar ${calendarId} ne postoji. Dostupni su samo kalendari 1 i 2.`,
        },
        lastVisitedPage: req.session.lastVisitedPage
      });
    }
    
    const calendars = await fetchCalendars();
    const calendarKey = calendarId === '2' ? 'calendar2' : 'calendar1';
    const calendar = calendars[calendarKey] || [];
    res.render("modules/calendar", { calendar });
  } catch (err) {
    res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Greška pri dohvaćanju kalendara",
        "error-message": err.message || "Neuspješno dohvaćanje kalendara.",
      },
      lastVisitedPage: req.session.lastVisitedPage
    });
  }
});

// Update kalendara iz Airbnb-a, dodaje samo nove evente - ograničeno na prva dva apartmana
const airbnbIcalUrl1 = process.env.AIRBNB_ICAL_URL_1;
const airbnbIcalUrl2 = process.env.AIRBNB_ICAL_URL_2;

app.get("/kalendar/:id", async (req, res) => {
  try {
    const calendarId = req.params.id;
    
    // Ograniči na kalendare 1 i 2
    if (calendarId !== '1' && calendarId !== '2') {
      return res.status(404).render("error", {
        error: {
          "error-code": 404,
          "error-title": "Kalendar nije pronađen",
          "error-message": `Kalendar ${calendarId} ne postoji. Dostupni su samo kalendari 1 i 2.`,
        },
        lastVisitedPage: req.session.lastVisitedPage
      });
    }
    
    const url = calendarId === '1' ? airbnbIcalUrl1 : airbnbIcalUrl2;
    const fileName = 'calendar' + calendarId + '.json';
    const dodaniEventi = await updateCalendarFromIcal(url, fileName);
    res.json(dodaniEventi);
  } catch (err) {
    res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Error fetching iCal",
        "error-message": err.message || "Failed to fetch iCal calendar " + req.params.id + ".",
      },
      lastVisitedPage: req.session.lastVisitedPage
    });
  }
});

// Čišćenje duplikata iz kalendara
app.get("/clean-calendar/:id", async (req, res) => {
  try {
    const calendarId = req.params.id;
    
    // Ograniči na kalendare 1 i 2
    if (calendarId !== '1' && calendarId !== '2') {
      return res.status(404).json({
        error: `Kalendar ${calendarId} ne postoji. Dostupni su samo kalendari 1 i 2.`
      });
    }
    
    const cleanedEvents = await cleanDuplicatesFromCalendar(calendarId);
    res.json({
      message: `Calendar ${calendarId} cleaned successfully`,
      eventsCount: cleanedEvents.length
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Failed to clean calendar duplicates"
    });
  }
});

app.get("/gallery", (req, res) => {
  res.render("modules/gallery", {
    isStandalone: true,
    images: [
      { thumbnail: "/images/gallery/studio/studio-slike-1-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-1.jpg", alt: "Image 1" },
      { thumbnail: "/images/gallery/studio/studio-slike-2-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-2.jpg", alt: "Image 2" },
      { thumbnail: "/images/gallery/studio/studio-slike-3-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-3.jpg", alt: "Image 3" },
      { thumbnail: "/images/gallery/studio/studio-slike-4-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-4.jpg", alt: "Image 4" },
      { thumbnail: "/images/gallery/studio/studio-slike-5-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-5.jpg", alt: "Image 5" },
      { thumbnail: "/images/gallery/studio/studio-slike-6-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-6.jpg", alt: "Image 6" },
      { thumbnail: "/images/gallery/studio/studio-slike-7-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-7.jpg", alt: "Image 7" },
      { thumbnail: "/images/gallery/studio/studio-slike-8-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-8.jpg", alt: "Image 8" },
      { thumbnail: "/images/gallery/studio/studio-slike-9-thumb.jpg", fullsize: "/images/gallery/studio/studio-slike-9.jpg", alt: "Image 9" }
    ]
  });
})

app.get("/header", async (req, res) => {
  try {
    // Fetch real calendar data
    const calendar1 = await fetchCalendars('1');
    const calendar2 = await fetchCalendars('2');
    res.render("header-test", {
      calendar1: calendar1 || [],
      calendar2: calendar2 || []
    });
  } catch (error) {
    console.error('Error loading calendars for header test:', error);
    res.render("header-test", {
      calendar1: [],
      calendar2: []
    });
  }
})

// Error handling for unsupported routes
app.use((req, res) => {
  let errorTitle = "Page not found";
  let errorMessage = "The requested page does not exist.";

  if (req.url.startsWith("/hr")) {
    errorTitle = "Stranica nije pronađena";
    errorMessage = "Tražena stranica ne postoji.";
  } else if (req.url.startsWith("/de")) {
    errorTitle = "Seite nicht gefunden";
    errorMessage = "Die angeforderte Seite existiert nicht.";
  }

  // Remove the current invalid page from history
  if (req.session.pagesHistory && req.session.pagesHistory.length > 0) {
    const lastPage = req.session.pagesHistory[req.session.pagesHistory.length - 1];
    if (lastPage === req.originalUrl) {
      req.session.pagesHistory.pop();
    }
  }

  // Set valid back page after removing invalid page
  let validBackPage = null;
  if (req.session.pagesHistory && req.session.pagesHistory.length > 0) {
    validBackPage = req.session.pagesHistory[req.session.pagesHistory.length - 1];
  }

  res.status(404).render("error", {
    error: {
      "error-code": 404,
      "error-title": errorTitle,
      "error-message": errorMessage,
    },
    validBackPage: validBackPage
  });
});

function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const PORT = process.env.PORT || 3000;
const localIPAddress = getLocalIPAddress();
const localAddress = `http://${localIPAddress}:${PORT}`;

app.listen(PORT, () => {
  console.log(`App pokrenuta na portu ${PORT} (${localAddress})`);
});