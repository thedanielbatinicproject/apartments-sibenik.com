const express = require("express");
const axios = require("axios");
const path = require("path");
const useragent = require("express-useragent");
const ical = require("node-ical");
const os = require("os");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const { body, validationResult } = require("express-validator");
const fs = require("fs");
require('dotenv').config();
require("dotenv").config();

const {
  fetchCalendars,
  fetchIcalReservations,
  updateCalendarFromIcal,
  cleanDuplicatesFromCalendar,
} = require("./code/calendarAPI");

const { getCombinedReviews } = require("./code/reviewsAPI");

const reviewUpvoteManager = require("./code/reviewUpvoteManager");
const emailSenderManager = require("./code/emailSenderManager");

const app = express();
app.use(useragent.express());
app.use(express.json());
app.use(cookieParser()); // Add cookie parser middleware

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: true, // Save session even if empty
    cookie: {
      secure: false, // Set to true in production with HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

// Middleware to track valid visited pages history
app.use((req, res, next) => {
  // Skip tracking for error pages, API endpoints, and static files
  if (
    !req.path.includes("/error") &&
    !req.path.includes("/kalendar/") &&
    !req.path.includes("/calendar/") &&
    !req.path.includes("/clean-calendar/") &&
    !req.path.includes("/gallery") &&
    !req.path.includes(".") && // Skip static files
    req.method === "GET"
  ) {
    // Initialize pages history if it doesn't exist
    if (!req.session.pagesHistory) {
      req.session.pagesHistory = [];
    }

    // Add current page to history (avoid duplicates)
    if (
      req.session.pagesHistory[req.session.pagesHistory.length - 1] !==
      req.originalUrl
    ) {
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
    req.session.validBackPage =
      req.session.pagesHistory[req.session.pagesHistory.length - 2];
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
});

// Display calendar 1 or 2 - limited to first two apartments
app.get("/calendar/:id", async (req, res) => {
  try {
    const calendarId = req.params.id;

    // Limit to calendars 1 and 2
    if (calendarId !== "1" && calendarId !== "2") {
      return res.status(404).render("error", {
        error: {
          "error-code": 404,
          "error-title": "Calendar not found",
          "error-message": `Calendar ${calendarId} does not exist. Only calendars 1 and 2 are available.`,
        },
        lastVisitedPage: req.session.lastVisitedPage,
      });
    }

    const calendars = await fetchCalendars();
    const calendarKey = calendarId === "2" ? "calendar2" : "calendar1";
    const calendar = calendars[calendarKey] || [];
    res.render("modules/calendar", { calendar });
  } catch (err) {
    res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Error fetching calendar",
        "error-message": err.message || "Failed to fetch calendar.",
      },
      lastVisitedPage: req.session.lastVisitedPage,
    });
  }
});

// Update calendar from Airbnb, adds only new events - limited to first two apartments
const airbnbIcalUrl1 = process.env.AIRBNB_ICAL_URL_1;
const airbnbIcalUrl2 = process.env.AIRBNB_ICAL_URL_2;

app.get("/kalendar/:id", async (req, res) => {
  try {
    const calendarId = req.params.id;

    // Limit to calendars 1 and 2
    if (calendarId !== "1" && calendarId !== "2") {
      return res.status(404).render("error", {
        error: {
          "error-code": 404,
          "error-title": "Calendar not found",
          "error-message": `Calendar ${calendarId} does not exist. Only calendars 1 and 2 are available.`,
        },
        lastVisitedPage: req.session.lastVisitedPage,
      });
    }

    const url = calendarId === "1" ? airbnbIcalUrl1 : airbnbIcalUrl2;
    const fileName = "calendar" + calendarId + ".json";
    const addedEvents = await updateCalendarFromIcal(url, fileName);
    res.json(addedEvents);
  } catch (err) {
    res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Error fetching iCal",
        "error-message":
          err.message || "Failed to fetch iCal calendar " + req.params.id + ".",
      },
      lastVisitedPage: req.session.lastVisitedPage,
    });
  }
});

// Clean duplicates from calendar
app.get("/clean-calendar/:id", async (req, res) => {
  try {
    const calendarId = req.params.id;

    // Limit to calendars 1 and 2
    if (calendarId !== "1" && calendarId !== "2") {
      return res.status(404).json({
        error: `Calendar ${calendarId} does not exist. Only calendars 1 and 2 are available.`,
      });
    }

    const cleanedEvents = await cleanDuplicatesFromCalendar(calendarId);
    res.json({
      message: `Calendar ${calendarId} cleaned successfully`,
      eventsCount: cleanedEvents.length,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Failed to clean calendar duplicates",
    });
  }
});

app.get("/gallery", (req, res) => {
  res.render("modules/gallery", {
    isStandalone: true,
    images: [
      {
        thumbnail: "/images/gallery/studio/studio-slike-1-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-1.jpg",
        alt: "Image 1",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-2-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-2.jpg",
        alt: "Image 2",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-3-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-3.jpg",
        alt: "Image 3",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-4-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-4.jpg",
        alt: "Image 4",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-5-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-5.jpg",
        alt: "Image 5",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-6-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-6.jpg",
        alt: "Image 6",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-7-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-7.jpg",
        alt: "Image 7",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-8-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-8.jpg",
        alt: "Image 8",
      },
      {
        thumbnail: "/images/gallery/studio/studio-slike-9-thumb.jpg",
        fullsize: "/images/gallery/studio/studio-slike-9.jpg",
        alt: "Image 9",
      },
    ],
  });
});

// Reservation form submission route
app.post("/submit-reservation", [
  body('fullName').notEmpty().withMessage('Full name is required').isLength({min: 2}).withMessage('Full name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email address'),
  body('countryCode').notEmpty().withMessage('Country code is required'),
  body('phone').notEmpty().withMessage('Phone number is required').matches(/^\d{6,15}$/).withMessage('Phone number must be 6-15 digits'),
  body('apartment').notEmpty().withMessage('Apartment selection is required').isIn(['1', '2', '3']).withMessage('Invalid apartment selection'),
  body('checkIn').notEmpty().withMessage('Check-in date is required').isISO8601().withMessage('Invalid check-in date'),
  body('checkOut').notEmpty().withMessage('Check-out date is required').isISO8601().withMessage('Invalid check-out date'),
  body('message').optional().isLength({max: 1000}).withMessage('Message must be less than 1000 characters')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fullName, email, countryCode, phone, apartment, checkIn, checkOut, message } = req.body;

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Check-in date cannot be in the past'
      });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }

    // Check for calendar conflicts (for apartments 1 and 2)
    if (apartment === '1' || apartment === '2') {
      const calendars = await fetchCalendars();
      const calendarKey = apartment === '2' ? 'calendar2' : 'calendar1';
      const calendarEvents = calendars[calendarKey] || [];
      
      const hasConflict = calendarEvents.some(event => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return (checkInDate < eventEnd && checkOutDate > eventStart);
      });

      if (hasConflict) {
        return res.status(409).json({
          success: false,
          message: 'There is already a reservation that conflicts with your selected dates.'
        });
      }
    }

    // Prepare reservation data
    const reservationData = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      fullName,
      email: email || null,
      phone: `${countryCode}${phone}`,
      apartment: getApartmentName(apartment),
      checkIn,
      checkOut,
      message: message || null,
      status: 'pending'
    };

    // Save to JSON file
    const filePath = path.join(__dirname, 'data', 'form_requests', 'reservation_requests.json');
    
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let existingData = [];
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(fileContent);
    }

    existingData.push(reservationData);
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2));

    // Send email notification
    await emailSenderManager.sendReservationEmail(reservationData);

    res.json({
      success: true,
      message: 'Reservation request submitted successfully!'
    });

  } catch (error) {
    console.error('Error processing reservation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
});

// Test email connection route
app.get('/test-email', async (req, res) => {
  try {
    const testResult = await emailSenderManager.testConnection();
    
    if (testResult) {
      res.json({
        success: true,
        message: 'Email connection successful',
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER ? 'Set' : 'Not set'
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Email connection failed',
        smtp: {
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT,
          user: process.env.SMTP_USER ? 'Set' : 'Not set'
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing email connection',
      error: error.message
    });
    // Check for conflicts
    const hasConflict = calendarEvents.some(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      return (checkInDate < eventEnd && checkOutDate > eventStart);
    });
    
    res.json({ hasConflict });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.json({ hasConflict: false });
  }
});

// API route for reviews
app.get("/reviews/:id", async (req, res) => {
  try {
    const unitId = req.params.id;

    // Limit to apartments 1 and 2
    if (unitId !== "1" && unitId !== "2") {
      return res.status(404).json({
        error: `Apartment ${unitId} does not exist. Only apartments 1 and 2 are available.`,
      });
    }

    const reviews = await getCombinedReviews(unitId);

    // Add upvote data
    const userId = reviewUpvoteManager.getUserId(req, res);
    const upvoteData = reviewUpvoteManager.getUserUpvoteData(
      userId,
      reviews.reviews,
      unitId
    );

    res.json({
      ...reviews,
      upvoteData,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      error: "Error fetching reviews",
    });
  }
});

// API route for upvote/downvote review
app.post("/reviews/:unitId/:reviewIndex/upvote", (req, res) => {
  try {
    const { unitId, reviewIndex } = req.params;

    // Limit to apartments 1 and 2
    if (unitId !== "1" && unitId !== "2") {
      return res.status(404).json({
        error: `Apartment ${unitId} does not exist. Only apartments 1 and 2 are available.`,
      });
    }

    const userId = reviewUpvoteManager.getUserId(req, res);
    const reviewId = reviewUpvoteManager.getReviewId(unitId, reviewIndex);
    const result = reviewUpvoteManager.toggleUpvote(userId, reviewId);

    res.json({
      success: true,
      reviewId,
      upvoted: result.upvoted,
      count: result.count,
    });
  } catch (error) {
    console.error("Error toggling upvote:", error);
    res.status(500).json({
      error: "Error managing upvote",
    });
  }
});

app.get("/header", async (req, res) => {
  try {
    // Fetch real calendar data
    const calendar1 = await fetchCalendars("1");
    const calendar2 = await fetchCalendars("2");

    // Fetch reviews data
    const reviews1 = await getCombinedReviews("1");
    const reviews2 = await getCombinedReviews("2");

    // Add upvote data
    const userId = reviewUpvoteManager.getUserId(req, res);
    const upvoteData1 = reviewUpvoteManager.getUserUpvoteData(
      userId,
      reviews1.reviews,
      "1"
    );
    const upvoteData2 = reviewUpvoteManager.getUserUpvoteData(
      userId,
      reviews2.reviews,
      "2"
    );

    res.render("header-test", {
      calendar1: calendar1 || [],
      calendar2: calendar2 || [],
      reviews1: { ...reviews1, upvoteData: upvoteData1 },
      reviews2: { ...reviews2, upvoteData: upvoteData2 },
    });
  } catch (error) {
    console.error("Error loading calendars for header test:", error);
    res.render("header-test", {
      calendar1: [],
      calendar2: [],
      reviews1: {
        averageRating: 0,
        totalReviews: 0,
        reviews: [],
        platforms: {},
        upvoteData: {},
      },
      reviews2: {
        averageRating: 0,
        totalReviews: 0,
        reviews: [],
        platforms: {},
        upvoteData: {},
      },
    });
  }
});

// Error handling for unsupported routes
app.use((req, res) => {
  let errorTitle = "Page not found";
  let errorMessage = "The requested page does not exist.";

  if (req.url.startsWith("/hr")) {
    errorTitle = "Page not found";
    errorMessage = "The requested page does not exist.";
  } else if (req.url.startsWith("/de")) {
    errorTitle = "Seite nicht gefunden";
    errorMessage = "Die angeforderte Seite existiert nicht.";
  }

  // Remove the current invalid page from history
  if (req.session.pagesHistory && req.session.pagesHistory.length > 0) {
    const lastPage =
      req.session.pagesHistory[req.session.pagesHistory.length - 1];
    if (lastPage === req.originalUrl) {
      req.session.pagesHistory.pop();
    }
  }

  // Set valid back page after removing invalid page
  let validBackPage = null;
  if (req.session.pagesHistory && req.session.pagesHistory.length > 0) {
    validBackPage =
      req.session.pagesHistory[req.session.pagesHistory.length - 1];
  }

  res.status(404).render("error", {
    error: {
      "error-code": 404,
      "error-title": errorTitle,
      "error-message": errorMessage,
    },
    validBackPage: validBackPage,
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
  console.log(`App started on port ${PORT} (${localAddress})`);
});
