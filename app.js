const express = require("express");
const path = require("path");
const useragent = require("express-useragent");
const session = require("express-session");
const cookieParser = require("cookie-parser");
require('dotenv').config();

const { reservationValidationRules } = require("./code/validatorManager");
const { processReservation, checkAvailability } = require("./code/reservationManager");
const { handleRootRedirect, handleDesktopRedirect, handleMobileRedirect } = require("./code/redirectManager");
const { handleHeaderTest } = require("./code/headerTestManager");
const { getLocalIPAddress, handle404Error } = require("./code/utils");
const { displayCalendar, updateCalendar, cleanCalendar } = require("./code/calendarRoutes");
const { getReviews, handleUpvote } = require("./code/reviewRoutes");
const { displayGallery } = require("./code/galleryRoutes");

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

app.get("/", handleRootRedirect);

app.get("/desktop", handleDesktopRedirect);

app.get("/mobile", handleMobileRedirect);

// Display calendar 1 or 2 - limited to first two apartments
app.get("/calendar/:id", displayCalendar);

// Update calendar from Airbnb, adds only new events - limited to first two apartments
app.get("/kalendar/:id", updateCalendar);

// Clean duplicates from calendar
app.get("/clean-calendar/:id", cleanCalendar);

app.get("/gallery", displayGallery);

// Reservation form submission route
app.post("/submit-reservation", reservationValidationRules, processReservation);

// Check availability route
app.post('/check-availability', checkAvailability);

// API route for reviews
app.get("/reviews/:id", getReviews);

// API route for upvote/downvote review
app.post("/reviews/:unitId/:reviewIndex/upvote", handleUpvote);

app.get("/header", handleHeaderTest);

// Error handling for unsupported routes
app.use(handle404Error);

const PORT = process.env.PORT || 3000;
const localIPAddress = getLocalIPAddress();
const localAddress = `http://${localIPAddress}:${PORT}`;

app.listen(PORT, () => {
  console.log(`App started on port ${PORT} (${localAddress})`);
});
