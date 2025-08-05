const express = require("express");
const path = require("path");
const useragent = require("express-useragent");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const http = require("http");
const socketIo = require("socket.io");
require('dotenv').config();

const { getLocalIPAddress, handle404Error } = require("./code/utils/utils");
const { calendarScheduler } = require("./code/calendar/calendarScheduler");
const authManager = require("./code/auth/authManager");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Make io accessible to routes
app.set('io', io);

app.use(useragent.express());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add form data parser
app.use(cookieParser()); // Add cookie parser middleware

// API Security middleware - require valid API key for all API endpoints
app.use('/api', (req, res, next) => {
  try {
    // Skip API key requirement for upvote endpoint from browser
    if (req.path.includes('/upvote') && req.get('User-Agent') && 
        (req.get('User-Agent').includes('Mozilla') || 
         req.get('User-Agent').includes('Chrome') || 
         req.get('User-Agent').includes('Safari') || 
         req.get('User-Agent').includes('Firefox'))) {
      return next();
    }

    // Skip API key requirement for backyard-management (has its own secret_key validation)
    if (req.path.includes('/backyard-management') && (req.method === 'POST' || req.method === 'GET')) {
      return next();
    }

    // Skip API key requirement for export-solar-data when called from browser (authenticated users)
    if (req.path.includes('/export-solar-data') && req.get('User-Agent') &&
        (req.get('User-Agent').includes('Mozilla') || 
         req.get('User-Agent').includes('Chrome') || 
         req.get('User-Agent').includes('Safari') || 
         req.get('User-Agent').includes('Firefox'))) {
      return next();
    }

    // Skip API key requirement for check-availability endpoint from browser
    if (req.path.includes('/check-availability') && req.get('User-Agent') &&
        (req.get('User-Agent').includes('Mozilla') || 
         req.get('User-Agent').includes('Chrome') || 
         req.get('User-Agent').includes('Safari') || 
         req.get('User-Agent').includes('Firefox'))) {
      return next();
    }

    // Skip API key requirement for submit-reservation endpoint from browser
    if (req.path.includes('/submit-reservation') && req.get('User-Agent') &&
        (req.get('User-Agent').includes('Mozilla') || 
         req.get('User-Agent').includes('Chrome') || 
         req.get('User-Agent').includes('Safari') || 
         req.get('User-Agent').includes('Firefox'))) {
      return next();
    }

    // Check if this is an internal server-to-server request
    const userAgent = req.get('User-Agent') || '';
    const isInternalServerRequest = (
      userAgent.includes('node-internal-api-client') ||
      ((userAgent.includes('node') || userAgent.includes('axios')) &&
       !userAgent.includes('Mozilla') && // Exclude browsers
       !userAgent.includes('Chrome') &&
       !userAgent.includes('Safari') &&
       !userAgent.includes('Firefox'))
    );

    // Add API key for internal server requests
    if (isInternalServerRequest) {
      req.headers['x-api-key'] = process.env.API_SECRET || 'your-secret-api-key-here';
    }

    // NOW CHECK: All API requests must have valid API key
    const providedApiKey = req.headers['x-api-key'] || req.query.api_key || (req.body && req.body.api_key);
    const validApiKey = process.env.API_SECRET || 'your-secret-api-key-here';

    if (!providedApiKey || providedApiKey !== validApiKey) {
      return res.status(401).render('error', {
        error: {
          'error-code': '401',
          'error-title': 'API ACCESS DENIED',
          'error-message': 'Valid API key required to access this endpoint. Unauthorized API access is not permitted.'
        },
        validBackPage: '/'
      });
    }

    next();
  } catch (error) {
    console.error('API Security Middleware Error:', error);
    return res.status(500).render('error', {
      error: {
        'error-code': '500',
        'error-title': 'API SECURITY ERROR',
        'error-message': 'An error occurred while validating API access. Please try again later.'
      },
      validBackPage: '/'
    });
  }
});

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

// Management routes
app.use("/management", require("./routes/management"));

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

// Socket.IO connection handling
io.on('connection', (socket) => {
  // console.log('Client connected to socket'); // Too verbose
  
  socket.on('disconnect', () => {
    // console.log('Client disconnected from socket'); // Too verbose
  });
});

server.listen(PORT, () => {
  console.log(`[SERVER] App started on port ${PORT} (${localAddress})`);
  
  // Start calendar scheduler after server starts
  setTimeout(() => {
    calendarScheduler.start();
  }, 2000); // Wait 2 seconds for server to fully start
  
  // Clean expired sessions every hour
  setInterval(() => {
    authManager.cleanExpiredSessions();
  }, 60 * 60 * 1000); // 1 hour
});
