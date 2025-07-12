# Apartments Šibenik

[![License](https://img.shields.io/badge/License-Non--Commercial-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-lightgrey.svg)](https://expressjs.com/)
[![Demo](https://img.shields.io/badge/Demo-Live-brightgreen.svg)](https://test.apartments-sibenik.com)

**Elegant apartment rental website for promoting beautiful accommodations in Šibenik, Croatia**

![Apartments Šibenik Screenshot](https://via.placeholder.com/800x400/0D47A1/FFFFFF?text=Apartments+%C5%A0ibenik)

## Features

### **Modern Design**
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
| **Axios** | HTTP Client | 1.x |
| **node-ical** | Calendar Processing | Latest |
| **express-useragent** | Device Detection | Latest |

## Project Structure

```
apartments-sibenik.com/
├── code/
│   └── calendarAPI.js          # Calendar synchronization logic
├── data/
│   ├── calendar1.json          # Property 1 availability data
│   └── calendar2.json          # Property 2 availability data
├── https-auth/                 # SSL certificates
├── public/
│   ├── images/
│   │   └── gallery/            # Property images
│   ├── javascripts/
│   │   ├── calendar.js         # Calendar interactions
│   │   └── gallery.js          # Advanced gallery functionality
│   └── stylesheets/
│       ├── gallery.css         # Gallery styling
│       ├── desktop.css         # Desktop layout
│       └── mobile.css          # Mobile optimizations
├── routes/
│   ├── hr.js                   # Croatian routes
│   ├── de.js                   # German routes
│   └── en.js                   # English routes
├── views/
│   ├── hr/                     # Croatian templates
│   ├── de/                     # German templates
│   ├── en/                     # English templates
│   └── modules/
│       ├── calendar.ejs        # Calendar component
│       └── gallery.ejs         # Gallery component
├── app.js                      # Main application server
├── package.json                # Dependencies and scripts
└── README.md                   # This file
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

### **Rotational Gallery System**
The gallery features a unique rotational thumbnail system where:
- Active thumbnail is always centered and highlighted
- Thumbnails rotate smoothly when navigating
- Supports touch/swipe gestures on mobile
- Auto-slide pauses for 20 seconds after user interaction
- Adapts to both embedded and standalone modes

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

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Root redirect with geolocation |
| `/gallery` | GET | Standalone gallery view |
| `/calendar/:id` | GET | Calendar display (1 or 2) |
| `/kalendar/:id` | GET | Calendar sync from Airbnb |
| `/:lang/:device` | GET | Localized views |

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | Full |
| Firefox | 88+ | Full |
| Safari | 14+ | Full |
| Edge | 90+ | Full |
| Mobile Safari | 14+ | Full |
| Chrome Mobile | 90+ | Full |

## Contributing

While this project is primarily for promotional purposes, contributions are welcome for:
- Bug fixes
- Performance improvements
- Accessibility enhancements
- Documentation updates

### Development Guidelines
1. Follow existing code style and conventions
2. Test on multiple devices and browsers
3. Ensure responsive design compatibility
4. Maintain multi-language support

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

## Acknowledgments

- Built with modern web technologies for optimal performance
- Inspired by contemporary hospitality website designs
- Optimized for the beautiful city of Šibenik, Croatia

---

<div align="center">

**Made with care for promoting beautiful accommodations in Šibenik**

[Live Demo](https://test.apartments-sibenik.com) • [Contact](mailto:contact@apartments-sibenik.com) • [Star this repo](https://github.com/thedanielbatinicproject/apartments-sibenik.com)

</div>
