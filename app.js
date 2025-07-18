const express = require("express");
const path = require("path");
const useragent = require("express-useragent");
const session = require("express-session");
const cookieParser = require("cookie-parser");
require('dotenv').config();

const { getLocalIPAddress, handle404Error } = require("./code/utils");
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
    !req.path.includes("/api/") && // Skip all API routes
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

// Main routes (root, desktop, mobile, gallery, header)
app.use("/", require("./routes/main"));

// API routes with /api prefix
app.use("/api", require("./routes/api"));

// Legacy routes for backward compatibility
app.use("/", require("./routes/legacy"));

// Error handling for unsupported routes
app.use(handle404Error);

const PORT = process.env.PORT || 3000;
const localIPAddress = getLocalIPAddress();
const localAddress = `http://${localIPAddress}:${PORT}`;

app.listen(PORT, () => {
  console.log(`App started on port ${PORT} (${localAddress})`);
});
