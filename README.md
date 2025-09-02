# Apartments Šibenik

[![License](https://img.shields.io/badge/License-Non--Commercial-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://test.apartments-sibenik.com)

Professional apartment rental website for premium accommodations in Šibenik, Croatia. Features advanced solar monitoring system with ESP32 integration, comprehensive booking management, and real-time data visualization.

## Recent Updates

**Code Quality & Organization**
- Complete codebase cleanup and restructuring
- All comments translated to English for better maintainability  
- CSS organized into logical folders (index/ and management/)
- Feature-based code organization in /code directory
- Removed test files and development artifacts

**Solar Monitoring System**
- Real-time solar data collection with ESP32 integration
- Interactive dashboard with 30+ monitored variables
- Delta compression for efficient data storage
- Socket.IO real-time updates
- Multi-timeframe analysis (1h, 6h, 12h, 24h views)
- API security with authentication and rate limiting
- Relay control system for remote device management

**Enhanced Review System**
- Comprehensive review management with JSON database
- Upvote system with persistent user tracking
- Internal API with secret key authentication
- Admin management portal with full CRUD operations
- Unified Review ID system for consistent data handling

**Management Dashboard**
- Dedicated management interface with authentication
- Solar data visualization with interactive charts  
- Calendar scheduler controls for automated sync
- Review management with CRUD operations
- System health monitoring and controls

## Core Features

**Multi-Language Rental Platform**
- Responsive design optimized for all devices
- Croatian, German, and English localization
- Geolocation-based automatic language detection
- Device-specific view optimization (mobile/desktop)

**Advanced Image Gallery**
- Rotational thumbnail system with circular navigation
- Touch and swipe support for mobile devices
- Auto-slide with intelligent pause on user interaction
- Smooth animations and adaptive layout

**Smart Calendar Integration**
- Real-time iCal synchronization from booking platforms (Airbnb, Booking.com)
- Multi-property calendar management
- Automated booking status updates
- RESTful API endpoints for calendar data
- Background scheduler with configurable intervals

**Solar Monitoring System**
- ESP32 hardware integration for real-time data collection
- 30+ monitored variables including voltage, current, temperature
- Interactive dashboard with multiple timeframe views
- Delta compression reduces storage overhead by 60-80%
- Socket.IO real-time data streaming
- Relay control system for remote device management
- API authentication and rate limiting

**Review & Rating System**
- Multi-platform review aggregation
- Anonymous upvote system with persistent tracking
- Review management interface for administrators
- Cookie-based user identification
- Internal API for secure review operations

**Management Dashboard**
- Real-time solar monitoring with comprehensive metrics
- Calendar sync scheduler management
- Review system administration
- API key protected endpoints
- Session-based authentication

## Live Demo

Experience the website at: **[test.apartments-sibenik.com](https://test.apartments-sibenik.com)**

## Technology Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Server Runtime | 20.x |
| **Express.js** | Web Framework | 4.x |
| **EJS** | Template Engine | 3.x |
| **Socket.IO** | Real-time Communication | 4.x |
| **Chart.js** | Data Visualization | 4.x |
| **ESP32** | IoT Data Collection | Hardware |

**Key Dependencies:**
- **axios** - HTTP client for API requests
- **bcrypt** - Password hashing and authentication
- **express-session** - Session management
- **express-validator** - Input validation
- **nodemailer** - Email notifications
- **node-ical** - Calendar processing
- **multer** - File upload handling
- **uuid** - Unique identifier generation

## Project Structure

```
apartments-sibenik.com/
├── code/                      # Feature-based application logic
│   ├── auth/                  # Authentication & security
│   ├── booking/               # Reservation management
│   ├── calendar/              # Calendar sync & scheduling  
│   ├── gallery/               # Image gallery system
│   ├── reviews/               # Review & rating system
│   ├── solar/                 # Solar monitoring & controls
│   └── utils/                 # Shared utilities
├── data/                      # Data storage
│   ├── calendars/             # Calendar cache files
│   ├── public_data/           # Solar & public datasets
│   ├── private/               # Configuration & private data
│   └── user_data/             # User interaction data
├── public/                    # Static assets
│   ├── images/                # Property photos & icons
│   ├── javascripts/           # Client-side functionality
│   └── stylesheets/           # Organized CSS (index/ & management/)
├── routes/                    # Express route handlers
│   ├── hr.js, de.js, en.js    # Language-specific routes
│   ├── api.js                 # API endpoints
│   └── management.js          # Admin interface
├── views/                     # EJS templates
│   ├── hr/, de/, en/          # Localized views
│   ├── management/            # Admin templates
│   └── modules/               # Reusable components
└── https-auth/                # SSL certificates
```
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
# Calendar iCal URLs for calendar synchronization
ICAL_URL_1=your_ical_url_1
ICAL_URL_2=your_ical_url_2
ICAL_URL_3=your_ical_url_3

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

## API Endpoints

### Public API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Root redirect with geolocation |
| `/gallery` | GET | Standalone gallery view |
| `/calendar/:id` | GET | Calendar display (1, 2, or 3) |
| `/:lang/:device` | GET | Localized views (hr/de/en) |

### Calendar API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/calendar/:id` | GET | Get calendar data |
| `/api/update-calendar/:id` | GET | Force calendar sync |
| `/kalendar/:id` | GET | Update from iCal sources |

### Solar Monitoring API (Protected)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/backyard-management` | POST | Submit solar data (ESP32) |
| `/api/solar/chart-data?range=` | GET | Chart data (1h/6h/12h/24h) |
| `/api/solar/variables` | GET | Solar variable definitions |
| `/api/relay/:id/toggle` | POST | Toggle relay control |

### Review System API  
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reviews/:id` | GET | Get unit reviews |
| `/api/reviews/:reviewId/upvote` | POST | Toggle review upvote |
| `/api/internal/reviews` | GET/POST | Internal review management |

### Management API (Protected)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/management` | GET | Management dashboard |
| `/management/solar-dashboard` | GET | Solar monitoring interface |
| `/management/scheduler/start` | POST | Start calendar scheduler |
| `/management/scheduler/stop` | POST | Stop calendar scheduler |

## Development

### Key Technical Features

**Delta Compression System**
- Solar data uses intelligent delta compression to reduce storage by 60-80%
- Only changed values are stored in delta records (marked with `_type: 'delta'`)
- Missing variables use last known values for reconstruction
- Automatically switches to full records when errors/warnings occur

**Review ID System**
- All reviews use unique, sequential integer IDs for consistency
- IDs remain immutable across all operations and files
- Frontend uses `data-review-id` attributes for reliable identification
- Upvote system tracks by review ID, never by array indices

**Real-time Communication**
- Socket.IO integration for live solar data updates
- Automatic client updates when new data arrives
- Efficient data streaming for dashboard visualizations

### Performance Optimizations

- **File Caching**: 5-minute cache for frequently accessed data
- **Background Processing**: Non-blocking calendar sync operations
- **Memory Management**: Automatic cleanup of old data records
- **Compression**: Gzip compression for all responses
- **Static Asset Caching**: Long-term browser caching for images and styles

### Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |
| Mobile Safari | 14+ | Full |
| Chrome Mobile | 90+ | Full |

## Contributing

This project welcomes contributions for:
- Bug fixes and improvements
- Performance optimizations
- Solar monitoring enhancements
- Review system improvements
- Accessibility enhancements
- Documentation updates

### Development Guidelines
1. **Code Quality**: Follow existing conventions and maintain English comments
2. **Testing**: Test on multiple devices and browsers before submitting
3. **Responsive Design**: Ensure compatibility across all screen sizes
4. **Multi-language Support**: Maintain all language variants
5. **Security**: Follow security best practices for all new features

## License

This project is available for **non-commercial use only**.

**Allowed**: Personal use, learning, educational purposes, contributing to the project
**Not Allowed**: Commercial use without permission, selling or monetizing the code

## Author

**Daniel Batinić**
- GitHub: [@thedanielbatinicproject](https://github.com/thedanielbatinicproject)
- Project: [apartments-sibenik.com](https://github.com/thedanielbatinicproject/apartments-sibenik.com)
- Contact: [daniel.batinic@fer.hr](mailto:daniel.batinic@fer.hr)

---

**Made with care for promoting beautiful accommodations in Šibenik, Croatia**

**Featuring Advanced Solar Monitoring & Smart Management Systems**

[Live Demo](https://test.apartments-sibenik.com) • [Contact](mailto:daniel.batinic@fer.hr) • [GitHub](https://github.com/thedanielbatinicproject/apartments-sibenik.com)
