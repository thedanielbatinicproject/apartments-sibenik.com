const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { fetchCalendars } = require('../calendar/calendarAPI');
const emailSenderManager = require('./emailSenderManager');

// Helper function to get apartment name
function getApartmentName(apartmentId) {
  const apartmentNames = {
    '1': 'Studio Apartment',
    '2': 'Apartment with Garden',
    '3': 'Room Apartment'
  };
  return apartmentNames[apartmentId] || 'Unknown';
}

// Process reservation form submission
async function processReservation(req, res) {
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

    const { fullName, email, countryCode, phone, apartment, checkIn, checkOut, message, forceSubmit } = req.body;

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

    let collisionData = null;

    // Check for calendar conflicts (for apartments 1 and 2)
    if (apartment === '1' || apartment === '2') {
      const calendars = await fetchCalendars();
      // Map apartment to calendar
      let calendarKey;
      if (apartment === '1') {
        calendarKey = 'calendar2'; // Apartman s vrtom
      } else if (apartment === '2') {
        calendarKey = 'calendar1'; // Studio apartman
      } else if (apartment === '3') {
        calendarKey = 'calendar3'; // Room
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid apartment selection'
        });
      }
      const calendarEvents = calendars[calendarKey] || [];
      
      console.log(`Checking conflicts for apartment ${apartment}:`, {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        eventsCount: calendarEvents.length
      });
      
      const conflictingEvent = calendarEvents.find(event => {
        const eventStart = new Date(event.pocetak);
        const eventEnd = new Date(event.kraj);
        
        // Overlap logic: allow check-in on same day as previous checkout and vice versa
        // Compare only dates, not times - guest can check in any time on checkout day
        const checkInDateOnly = new Date(checkInDate.getFullYear(), checkInDate.getMonth(), checkInDate.getDate());
        const checkOutDateOnly = new Date(checkOutDate.getFullYear(), checkOutDate.getMonth(), checkOutDate.getDate());
        const eventStartDateOnly = new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate());
        const eventEndDateOnly = new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate());
        
        // Conflict only if there's actual overlap, not just touching dates
        // Allow check-in on same date as event end, and check-out on same date as event start
        const overlap = (checkInDateOnly < eventEndDateOnly && checkOutDateOnly > eventStartDateOnly);
        
        if (overlap) {
          console.log('Conflict found with event:', {
            event: event.naziv,
            eventStart: eventStart.toISOString(),
            eventEnd: eventEnd.toISOString(),
            requestedCheckIn: checkInDate.toISOString(),
            requestedCheckOut: checkOutDate.toISOString()
          });
        }
        
        return overlap;
      });

      if (conflictingEvent && !forceSubmit) {
        return res.status(200).json({
          success: false,
          warning: true,
          message: 'There is already a reservation that conflicts with your selected dates. Press SUBMIT button again to send request.'
        });
      }
      
      // If there's a conflict but forceSubmit is true, prepare collision data for email
      if (conflictingEvent && forceSubmit) {
        collisionData = {
          requestedStart: checkInDate.toISOString(),
          requestedEnd: checkOutDate.toISOString(),
          existingStart: conflictingEvent.pocetak,
          existingEnd: conflictingEvent.kraj,
          existingEventId: conflictingEvent.event_uuid || 'N/A'
        };
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
    const filePath = path.join(__dirname, '..', 'data', 'form_requests', 'reservation_requests.json');
    
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
    await emailSenderManager.sendReservationEmail(reservationData, collisionData);

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
}

// Standalone function for testing availability
async function testAvailabilityCheck(checkIn, checkOut, apartment) {
  try {
    if (!apartment || !checkIn || !checkOut) {
      return { available: true, message: 'Missing required parameters' };
    }
    
    // Only check for apartments 1, 2, and 3
    if (apartment !== '1' && apartment !== '2' && apartment !== '3') {
      return { available: true, message: 'Invalid apartment number' };
    }
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // Fetch calendar data
    const calendars = await fetchCalendars();
    // Map apartment to calendar in testAvailabilityCheck
    let calendarKey;
    if (apartment === '1') {
      calendarKey = 'calendar2'; // Apartman s vrtom
    } else if (apartment === '2') {
      calendarKey = 'calendar1'; // Studio apartman
    } else if (apartment === '3') {
      calendarKey = 'calendar3'; // Room
    }
    const calendarEvents = calendars[calendarKey] || [];
    
    // Check for conflicts in testAvailabilityCheck
    const hasConflict = calendarEvents.some(event => {
      const eventStart = new Date(event.pocetak);
      const eventEnd = new Date(event.kraj);
      
      // Updated overlap logic: allow check-in on same day as previous checkout and vice versa
      // Compare only dates, not times - guest can check in any time on checkout day
      const checkInDateOnly = new Date(checkInDate.getUTCFullYear(), checkInDate.getUTCMonth(), checkInDate.getUTCDate());
      const checkOutDateOnly = new Date(checkOutDate.getUTCFullYear(), checkOutDate.getUTCMonth(), checkOutDate.getUTCDate());
      const eventStartDateOnly = new Date(eventStart.getUTCFullYear(), eventStart.getUTCMonth(), eventStart.getUTCDate());
      const eventEndDateOnly = new Date(eventEnd.getUTCFullYear(), eventEnd.getUTCMonth(), eventEnd.getUTCDate());
      
      // Conflict only if there's actual overlap, not just touching dates
      // Allow check-in on same date as event end, and check-out on same date as event start
      const overlap = (checkInDateOnly < eventEndDateOnly && checkOutDateOnly > eventStartDateOnly);
      
      return overlap;
    });
    
    return { 
      available: !hasConflict, 
      message: hasConflict ? 'Dates conflict with existing reservation' : 'Dates are available'
    };
  } catch (error) {
    console.error('Error checking availability:', error);
    return { available: false, message: 'Error checking availability' };
  }
}

// Check availability for dates
async function checkAvailability(req, res) {
  try {
    const { apartment, checkIn, checkOut } = req.body;
    
    if (!apartment || !checkIn || !checkOut) {
      return res.json({ hasConflict: false });
    }
    
    // Only check for apartments 1, 2, and 3
    if (apartment !== '1' && apartment !== '2' && apartment !== '3') {
      return res.json({ hasConflict: false });
    }
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // Fetch calendar data
    const calendars = await fetchCalendars();
    // Map apartment to calendar in checkAvailability
    let calendarKey;
    if (apartment === '1') {
      calendarKey = 'calendar2'; // Apartman s vrtom
    } else if (apartment === '2') {
      calendarKey = 'calendar1'; // Studio apartman
    } else if (apartment === '3') {
      calendarKey = 'calendar3'; // Room
    }
    const calendarEvents = calendars[calendarKey] || [];
    
    // Check for conflicts in API checkAvailability
    const hasConflict = calendarEvents.some(event => {
      const eventStart = new Date(event.pocetak);
      const eventEnd = new Date(event.kraj);
      
      // Compare only dates, not times - guest can check in any time on checkout day
      const checkInDateOnly = new Date(checkInDate.getUTCFullYear(), checkInDate.getUTCMonth(), checkInDate.getUTCDate());
      const checkOutDateOnly = new Date(checkOutDate.getUTCFullYear(), checkOutDate.getUTCMonth(), checkOutDate.getUTCDate());
      const eventStartDateOnly = new Date(eventStart.getUTCFullYear(), eventStart.getUTCMonth(), eventStart.getUTCDate());
      const eventEndDateOnly = new Date(eventEnd.getUTCFullYear(), eventEnd.getUTCMonth(), eventEnd.getUTCDate());
      
      // Conflict only if there's actual overlap, not just touching dates
      // Allow check-in on same date as event end, and check-out on same date as event start
      const overlap = (checkInDateOnly < eventEndDateOnly && checkOutDateOnly > eventStartDateOnly);
      
      return overlap;
    });
    
    res.json({ hasConflict });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.json({ hasConflict: false });
  }
}

module.exports = {
  processReservation,
  checkAvailability,
  getApartmentName,
  testAvailabilityCheck
};
