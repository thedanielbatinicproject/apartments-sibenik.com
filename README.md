# Apartments Šibenik

[![License](https://img.shields.io/badge/License-Non--Commercial-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://test.apartments-sibenik.com)

**Professional apartment rental website for premium accommodations in Šibenik, Croatia - featuring advanced solar monitoring system and comprehensive management tools**

![Apartments Šibenik Screenshot](https://via.placeholder.com/800x400/0D47A1/FFFFFF?text=Apartments+%C5%A0ibenik)

## 🚀 Recent Major Updates & Improvements

### **Code Quality & Maintenance**
- ✅ **Complete cleanup** - Removed all test files, mock data generators, and performance analysis tools
- ✅ **Internationalization** - All Croatian code comments translated to English for better maintainability
- ✅ **Emoji-free codebase** - Removed all emojis from code for professional standards
- ✅ **Organized CSS structure** - Restructured stylesheets into `index/` and `management/` folders
- ✅ **Organized code structure** - Restructured `/code` directory into logical feature-based folders
- ✅ **Updated file references** - All imports and requires updated to match new folder structure

### **Advanced Solar Monitoring System**
- 🌞 **Real-time solar data collection** with ESP32 integration
- 📊 **Solar dashboard** with live charts and historical data
- 🔄 **Delta compression** for efficient data storage and transmission
- ⚡ **Socket.IO integration** for real-time updates
- 📈 **Multi-timeframe analysis** (1h, 12h, 24h views)
- 🛡️ **API security** with authentication and rate limiting

### **Enhanced Review System**
- ⭐ **Upvote functionality** with persistent user tracking
- 🔒 **Cookie-based user identification** for anonymous voting
- 📱 **Platform integration** (Airbnb & Booking.com reviews)
- 💾 **Persistent data storage** for review interactions

### **Improved Management Interface**
- 🖥️ **Dedicated management routes** (`/management`)
- 📊 **Solar data visualization** with interactive charts
- ⚙️ **Scheduler controls** for automated calendar updates
- 🔐 **Basic authentication middleware** (development-ready)

## Features

### **Core Rental Website Features**
- **Glassmorphism UI** - Beautiful glass-like effects with backdrop blur
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Multi-language Support** - Croatian, German, and English localization
- **Device Detection** - Automatic mobile/desktop version selection

### **Advanced Image Gallery**
- **Rotational Thumbnail System** - Innovative circular thumbnail navigation
- **Touch & Swipe Support** - Intuitive mobile interaction
- **Auto-slide with Pause** - Smart auto-progression that pauses on user interaction
- **Adaptive Layout** - Adjusts to parent container or standalone mode
- **Smooth Animations** - Fluid transitions and hover effects

### **Smart Calendar Integration**
- **Airbnb Sync** - Real-time availability updates from Airbnb iCal feeds
- **Dual Calendar Support** - Manage multiple properties simultaneously
- **Reservation Management** - Automatic booking status updates
- **API Endpoints** - RESTful calendar data access
- **Automated Scheduler** - Background sync with configurable intervals

### **Solar Monitoring System** ⚡
- **Real-time Data Collection** - Live solar panel performance monitoring
- **ESP32 Integration** - Hardware-level data acquisition
- **Interactive Charts** - Multiple timeframe views (1h, 12h, 24h)
- **Delta Compression** - Efficient data storage with change tracking
  - Only changed values are stored in delta records (marked with `_type: 'delta'`)
  - Missing variables in delta records use last known values for reconstruction
  - Automatically switches to full records when errors/warnings occur
- **API Security** - Protected endpoints with authentication
- **Socket.IO Updates** - Real-time data streaming to dashboards

### **Review & Rating System** ⭐
- **Multi-platform Reviews** - Aggregate from Airbnb and Booking.com
- **Upvote System** - Guest interaction with anonymous tracking
- **Persistent User Data** - Cookie-based user identification
- **Review Management** - Truncation and display optimization

### **Management Dashboard** 🖥️
- **Enhanced Solar Dashboard** - Comprehensive monitoring interface with 30+ variables
- **Variable Descriptions** - Interactive info tooltips for all solar metrics
- **Responsive Design** - Optimized for desktop and mobile viewing
- **Real-time Charts** - Multiple timeframe analysis (1h, 6h, 12h, 24h)
- **Full-screen Layout** - Maximized data visualization space
- **Horizontal Scrolling** - Mobile-optimized data table navigation
- **API-secured Variables** - Protected endpoint for solar variable information
- **Scheduler Control** - Start/stop automated calendar sync
- **Data Visualization** - Charts and graphs for performance analysis
- **Authentication Ready** - Basic auth middleware implementation

### **Intelligent Routing**
- **Geolocation-based Redirects** - Automatic language detection by visitor's location
- **SEO-friendly URLs** - Clean, semantic URL structure
- **Error Handling** - Graceful error pages in multiple languages
- **Device-specific Views** - Tailored experiences for different devices

## Live Demo

Experience the website live at: **[test.apartments-sibenik.com](https://test.apartments-sibenik.com)**

## Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Server Runtime | 20.x |
| **Express.js** | Web Framework | 4.x |
| **EJS** | Template Engine | 3.x |
| **Socket.IO** | Real-time Communication | 4.x |
| **Axios** | HTTP Client | 1.x |
| **node-ical** | Calendar Processing | Latest |
| **express-useragent** | Device Detection | Latest |
| **express-session** | Session Management | Latest |
| **uuid** | Unique ID Generation | Latest |
| **dotenv** | Environment Variables | Latest |

### **Hardware Integration**
| Component | Purpose | Communication |
|-----------|---------|---------------|
| **ESP32** | Solar Data Collection | WiFi/HTTP |
| **Solar Panels** | Energy Generation | Analog Sensors |
| **Temperature Sensors** | Environmental Monitoring | I2C/SPI |

## Project Structure

```
apartments-sibenik.com/
├── code/                       # Core application logic (organized by feature)
│   ├── auth/                   # Authentication & security
│   │   └── apiAuthManager.js   # API authentication middleware
│   ├── booking/                # Reservation & booking management
│   │   ├── reservationManager.js   # Booking processing logic
│   │   ├── validatorManager.js     # Form validation rules
│   │   └── emailSenderManager.js   # Email notifications
│   ├── calendar/               # Calendar integration & scheduling
│   │   ├── calendarAPI.js      # Calendar synchronization
│   │   ├── calendarRoutes.js   # Calendar route handlers
│   │   └── calendarScheduler.js # Automated sync scheduler
│   ├── gallery/                # Image gallery functionality
│   │   ├── galleryHelper.js    # Gallery utilities
│   │   └── galleryRoutes.js    # Gallery endpoints
│   ├── reviews/                # Review & rating system
│   │   ├── reviewsAPI.js       # Review system logic
│   │   ├── reviewRoutes.js     # Review route handlers
│   │   └── reviewUpvoteManager.js # Upvote functionality
│   └── utils/                  # Utility functions & helpers
│       ├── utils.js            # Core utility functions
│       ├── redirectManager.js  # URL redirect logic
│       ├── headerTestManager.js # Header testing utilities
│       └── internalAPIClient.js # Internal API communication
├── data/                       # Data storage
│   ├── calendars/              # Calendar cache
│   │   ├── calendar1.json      # Property 1 availability
│   │   └── calendar2.json      # Property 2 availability
│   ├── public_data/            # Public datasets
│   │   ├── solars_public.json  # Solar monitoring data
│   │   ├── solar_variables.json # Solar variable definitions
│   │   └── upvotes.json        # Review upvotes
│   ├── user_data/              # User-specific data
│   │   └── user_upvotes.json   # User voting history
│   ├── form_requests/          # Form submissions
│   │   └── reservation_requests.json
│   └── private/                # Private configuration
│       └── solar_control.json  # Solar system controls
├── https-auth/                 # SSL certificates
│   ├── certificate.crt
│   ├── private.key
│   └── ca_bundle.crt
├── public/                     # Static assets
│   ├── images/
│   │   ├── gallery/            # Property images
│   │   │   ├── apartment/      # Apartment photos
│   │   │   └── studio/         # Studio photos
│   │   ├── icons/              # Platform icons
│   │   └── avatars/            # User avatars
│   ├── javascripts/
│   │   ├── calendar.js         # Calendar interactions
│   │   ├── gallery.js          # Advanced gallery
│   │   ├── reviews.js          # Review system UI
│   │   ├── reservation-form.js # Booking form
│   │   └── header.js           # Header functionality
│   └── stylesheets/
│       ├── index/              # Main site styles
│       │   ├── desktop.css     # Desktop layout
│       │   ├── mobile.css      # Mobile optimizations
│       │   ├── gallery.css     # Gallery styling
│       │   ├── calendar.css    # Calendar styling
│       │   ├── reviews.css     # Review system
│       │   ├── header.css      # Header styles
│       │   ├── reservation-form.css # Booking form
│       │   └── error-page.css  # Error pages
│       └── management/         # Admin interface
│           └── solar-dashboard.css # Solar dashboard
├── routes/                     # Express routes
│   ├── main.js                 # Main application routes
│   ├── api.js                  # API endpoints
│   ├── hr.js                   # Croatian routes
│   ├── de.js                   # German routes
│   ├── en.js                   # English routes
│   ├── management.js           # Admin dashboard
│   └── legacy.js               # Backward compatibility
├── views/                      # EJS templates
│   ├── hr/, de/, en/           # Language-specific views
│   │   ├── desktop.ejs         # Desktop templates
│   │   └── mobile.ejs          # Mobile templates
│   ├── management/             # Admin templates
│   │   ├── index.ejs           # Management dashboard
│   │   └── solar-dashboard.ejs # Solar monitoring
│   ├── modules/                # Reusable components
│   │   ├── calendar.ejs        # Calendar component
│   │   ├── gallery.ejs         # Gallery component
│   │   ├── reviews.ejs         # Review system
│   │   ├── header.ejs          # Header component
│   │   ├── footer.ejs          # Footer component
│   │   └── reservation-form.ejs # Booking form
│   ├── error.ejs               # Error pages
│   └── header-test.ejs         # Header testing
├── app.js                      # Main application server
├── package.json                # Dependencies and scripts
├── nodemon.json                # Development configuration
├── .env                        # Environment variables
└── README.md                   # This documentation
```

## Installation & Setup

### Prerequisites
- Node.js 20.x or higher
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone https://github.com/thedanielbatinicproject/apartments-sibenik.com.git
cd apartments-sibenik.com
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Airbnb iCal URLs for calendar synchronization
AIRBNB_ICAL_URL_1=your_airbnb_ical_url_1
AIRBNB_ICAL_URL_2=your_airbnb_ical_url_2

# Server Configuration
PORT=3000

# API Security
API_SECRET=your-secret-api-key-here
SESSION_SECRET=your-session-secret-here

# Solar Monitoring (Optional)
SOLAR_API_ENABLED=true
ESP32_IP_ADDRESS=192.168.1.100
```

### 4. Start the Application
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## Key Features Explained

### **Solar Monitoring System** ⚡
The integrated solar monitoring system provides comprehensive energy tracking:

#### **Real-time Data Collection**
- **ESP32 Integration**: Hardware-level data acquisition from solar panels
- **Multiple Sensors**: Voltage, current, temperature, and power measurements
- **WiFi Communication**: Wireless data transmission to the server
- **Error Detection**: Automatic identification of system issues

#### **Data Processing & Storage**
- **Delta Compression**: Efficient storage by tracking only changes
- **Automatic Cleanup**: Maintains last 500 records for optimal performance
- **JSON Storage**: Human-readable data format for easy debugging
- **Backup Systems**: Redundant data storage for reliability

#### **Enhanced Dashboard Features**
- **30+ Solar Variables**: Complete monitoring of all ESP32 sensor data
- **Interactive Tooltips**: Click 'i' button for detailed variable descriptions
- **Full-screen Design**: Dashboard spans entire viewport for maximum data visibility
- **Responsive Grid**: 5 cards per row on desktop, 2 on mobile, 1 on small screens
- **Glassy Modern UI**: Backdrop blur effects with rounded corners
- **Mobile Scrolling**: Horizontal scroll for data tables on mobile devices
- **Variable Definitions**: JSON-based variable descriptions with units and explanations
- **API Protection**: Solar variables endpoint secured with secret key authentication
- **Real-time Updates**: Socket.IO integration for live data streaming
- **Multiple Chart Views**: 1h, 6h, 12h, and 24h data visualization options

### **Advanced Review System** ⭐
Comprehensive guest feedback management:

#### **Multi-platform Integration**
- **Airbnb Reviews**: Automatic synchronization with Airbnb API
- **Booking.com Reviews**: Integration with Booking.com platform
- **Manual Reviews**: Direct guest feedback submission
- **Review Aggregation**: Combined scoring and display

#### **Interactive Features**
- **Upvote System**: Guests can vote on helpful reviews
- **Anonymous Tracking**: Cookie-based user identification
- **Persistent Storage**: Vote history maintained across sessions
- **Spam Prevention**: Rate limiting and validation

### **Rotational Gallery System**
The gallery features a unique rotational thumbnail system where:
- Active thumbnail is always centered and highlighted
- Thumbnails rotate smoothly when navigating
- Supports touch/swipe gestures on mobile
- Auto-slide pauses for 20 seconds after user interaction
- Adapts to both embedded and standalone modes

### **Smart Calendar Integration**
Advanced booking management system:

#### **Automated Synchronization**
- **Background Scheduler**: Configurable sync intervals
- **iCal Processing**: Parse and convert calendar data
- **Conflict Detection**: Identify booking overlaps
- **Status Updates**: Real-time availability updates

#### **API Endpoints**
- **RESTful Design**: Clean, predictable URL structure
- **JSON Responses**: Structured data for easy consumption
- **Error Handling**: Comprehensive error responses
- **Rate Limiting**: API protection and performance optimization

### **Responsive Design Philosophy**
- **Mobile-first approach** with progressive enhancement
- **Viewport-based sizing** for optimal screen utilization
- **Touch-optimized interactions** with appropriate target sizes
- **Adaptive layouts** that work in any container

### **Smart Internationalization**
- **Automatic language detection** based on visitor's IP geolocation
- **Fallback mechanisms** for unsupported regions
- **Device-specific routing** (mobile/desktop versions)
- **SEO-optimized URLs** for each language variant

### **Management Dashboard** 🖥️
Comprehensive administrative interface:

#### **Solar Dashboard**
- **Live Monitoring**: Real-time solar panel performance
- **Historical Data**: Trend analysis and reporting
- **System Controls**: Remote relay management
- **Performance Analytics**: Efficiency metrics and alerts

#### **Booking Management**
- **Calendar Overview**: Multi-property availability
- **Scheduler Controls**: Start/stop automatic sync
- **Data Validation**: Booking conflict detection
- **Manual Overrides**: Administrative booking controls

#### **Security Features**
- **Authentication Middleware**: Basic auth implementation
- **API Key Protection**: Secure endpoint access
- **Session Management**: User state persistence
- **Input Validation**: XSS and injection prevention

## API Endpoints

### **Public API**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Root redirect with geolocation |
| `/gallery` | GET | Standalone gallery view |
| `/calendar/:id` | GET | Calendar display (1 or 2) |
| `/kalendar/:id` | GET | Calendar sync from Airbnb |
| `/:lang/:device` | GET | Localized views |

### **Calendar API**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/calendar/:id` | GET | Get calendar data |
| `/api/calendar/:id/sync` | POST | Force calendar sync |
| `/api/calendar/status` | GET | Get sync status |

### **Solar Monitoring API** (Protected)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/solar-data` | POST | Submit solar data (ESP32) |
| `/api/solar/chart-data?range=` | GET | Get chart data (1h/6h/12h/24h) |
| `/api/solar/variables` | GET | Get solar variable definitions |
| `/api/solar/history` | POST | Get paginated solar history data |
| `/api/backyard-management` | GET | Get relay status |
| `/api/relay/:id/toggle` | POST | Toggle relay control |

> **Delta Compression**: Solar data uses intelligent delta compression where only changed values are stored. Records with errors/warnings always save as full records. The system automatically reconstructs missing values from the last known state when displaying data or charts.

### **Review System API**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reviews/:unitId` | GET | Get unit reviews |
| `/api/reviews/:unitId/upvote` | POST | Toggle review upvote |
| `/api/reviews/stats` | GET | Get review statistics |

### **Management API** (Protected)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/management` | GET | Management dashboard |
| `/management/solar-dashboard` | GET | Solar monitoring interface |
| `/management/scheduler/start` | POST | Start calendar scheduler |
| `/management/scheduler/stop` | POST | Stop calendar scheduler |
| `/management/scheduler/status` | GET | Get scheduler status |

## Recent Development History

### **Phase 1: Core Website (Initial Release)**
- ✅ Multi-language support (HR/DE/EN)
- ✅ Responsive design implementation
- ✅ Advanced gallery system
- ✅ Calendar integration with Airbnb
- ✅ Geolocation-based routing

### **Phase 2: Solar Monitoring Integration**
- ✅ ESP32 hardware integration
- ✅ Real-time data collection system
- ✅ Interactive dashboard development
- ✅ Socket.IO real-time updates
- ✅ Delta compression for efficiency

### **Phase 3: Enhanced User Experience**
- ✅ Review system with upvoting
- ✅ Cookie-based user tracking
- ✅ Multi-platform review aggregation
- ✅ Advanced form validation
- ✅ Email notification system

### **Phase 4: Management & Security**
- ✅ Administrative dashboard
- ✅ API authentication system
- ✅ Scheduler management interface
- ✅ Rate limiting and security
- ✅ Session management

### **Phase 5: Code Quality & Organization**
- ✅ Complete codebase cleanup
- ✅ Croatian → English comment translation
- ✅ CSS file reorganization (`index/` and `management/` folders)
- ✅ Code directory restructuring (feature-based organization)
- ✅ Removed test files and mock data
- ✅ Professional code standards
- ✅ Updated all import/require statements

### **Phase 6: Enhanced Solar Dashboard** ⚡
- ✅ Solar variable definitions database (30+ variables)
- ✅ Interactive variable descriptions with tooltips
- ✅ Full-screen responsive dashboard design
- ✅ Enhanced mobile experience with horizontal scrolling
- ✅ Modern glassy UI with backdrop blur effects
- ✅ Expanded chart visualization options (1h/6h/12h/24h)
- ✅ API endpoint for solar variable information
- ✅ Comprehensive data table with all sensor readings
- ✅ Professional modern card layout (5 per row desktop, 2 mobile)
- ✅ Complete solar monitoring system documentation

## Performance Optimizations

### **Data Handling**
- **Delta Compression**: Reduces storage by 60-80%
- **File Caching**: 5-minute cache for frequently accessed data
- **Background Processing**: Non-blocking calendar sync
- **Efficient Queries**: Optimized data filtering and processing

### **Frontend Performance**
- **Lazy Loading**: Images loaded on demand
- **CSS Minification**: Reduced stylesheet sizes
- **JavaScript Optimization**: Modular component loading
- **Responsive Images**: Device-appropriate image sizes

### **Server Optimization**
- **Memory Management**: Automatic cleanup of old data
- **Connection Pooling**: Efficient database connections
- **Compression**: Gzip compression for responses
- **Static Asset Caching**: Long-term browser caching

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |
| Mobile Safari | 14+ | Full |
| Chrome Mobile | 90+ | Full |

## Hardware Requirements

### **Server Requirements**
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 10GB for application + data
- **Network**: Stable internet connection for calendar sync

### **ESP32 Solar Monitoring Setup**
- **Microcontroller**: ESP32 DevKit V1 or compatible
- **Sensors**: Voltage/current sensors for solar panels
- **WiFi**: 2.4GHz network access
- **Power Supply**: 5V DC power adapter
- **Optional**: Temperature sensors, relay modules

### **Development Environment**
- **Node.js**: Version 20.x or higher
- **NPM**: Latest version
- **Git**: For version control
- **Code Editor**: VS Code recommended with EJS extension

## Contributing

This project welcomes contributions for:
- **Bug fixes and improvements**
- **Performance optimizations**
- **Solar monitoring enhancements**
- **Review system improvements**
- **Accessibility enhancements**
- **Documentation updates**
- **Translation improvements**

### **Development Guidelines**
1. **Code Quality**: Follow existing conventions and maintain English comments
2. **Testing**: Test on multiple devices and browsers before submitting
3. **Responsive Design**: Ensure compatibility across all screen sizes
4. **Multi-language Support**: Maintain all language variants
5. **Security**: Follow security best practices for all new features
6. **Performance**: Consider impact on load times and server resources

### **Areas for Contribution**
- **Frontend**: React/Vue.js migration potential
- **Backend**: Additional API endpoints and features
- **Solar System**: Enhanced monitoring and control features
- **Mobile App**: Native mobile application development
- **Analytics**: Advanced reporting and data visualization
- **Automation**: Smart home integration possibilities

## License

This project is available for **non-commercial use only**.

### Terms:
- **Allowed**: Personal use, learning, educational purposes
- **Allowed**: Contributing to the project
- **Allowed**: Forking for non-commercial projects
- **Not Allowed**: Commercial use without permission
- **Not Allowed**: Selling or monetizing the code

## Author

**Daniel Batinić**
- GitHub: [@thedanielbatinicproject](https://github.com/thedanielbatinicproject)
- Project: [apartments-sibenik.com](https://github.com/thedanielbatinicproject/apartments-sibenik.com)
- Contact: [daniel.batinic@fer.hr](mailto:daniel.batinic@fer.hr)

## Acknowledgments

- **Modern Web Technologies**: Built with cutting-edge tools for optimal performance
- **IoT Integration**: Pioneering ESP32 solar monitoring integration
- **Hospitality Design**: Inspired by contemporary luxury accommodation websites
- **Croatian Tourism**: Optimized for promoting beautiful Šibenik, Croatia
- **Open Source Community**: Utilizing and contributing to open source ecosystem
- **Sustainable Technology**: Promoting renewable energy monitoring and efficiency

### **Special Thanks**
- **Chart.js**: For beautiful data visualization
- **Socket.IO**: For real-time communication capabilities
- **Express.js Community**: For robust server framework
- **EJS Template Engine**: For flexible templating
- **Node.js Ecosystem**: For comprehensive package availability

---

<div align="center">

**🏛️ Made with care for promoting beautiful accommodations in Šibenik 🌞**

**⚡ Featuring Advanced Solar Monitoring & Smart Management Systems ⚡**

[Live Demo](https://test.apartments-sibenik.com) • [Contact](mailto:daniel.batinic@fer.hr) • [Star this repo](https://github.com/thedanielbatinicproject/apartments-sibenik.com)

</div>
