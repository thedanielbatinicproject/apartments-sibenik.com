const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { fetchCalendars } = require('./calendarAPI');
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
      const calendarKey = apartment === '2' ? 'calendar2' : 'calendar1';
      const calendarEvents = calendars[calendarKey] || [];
      
      console.log(`Checking conflicts for apartment ${apartment}:`, {
        checkIn: checkInDate.toISOString(),
        checkOut: checkOutDate.toISOString(),
        eventsCount: calendarEvents.length
      });
      
      const conflictingEvent = calendarEvents.find(event => {
        const eventStart = new Date(event.pocetak);
        const eventEnd = new Date(event.kraj);
        const overlap = (checkInDate < eventEnd && checkOutDate > eventStart);
        
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
    
    // Only check for apartments 1 and 2
    if (apartment !== '1' && apartment !== '2') {
      return { available: true, message: 'Invalid apartment number' };
    }
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // Fetch calendar data
    const calendars = await fetchCalendars();
    const calendarKey = apartment === '2' ? 'calendar2' : 'calendar1';
    const calendarEvents = calendars[calendarKey] || [];
    
    // Check for conflicts
    const hasConflict = calendarEvents.some(event => {
      const eventStart = new Date(event.pocetak);
      const eventEnd = new Date(event.kraj);
      
      // Convert to Croatian timezone properly
      const eventStartCroatian = new Date(eventStart.toLocaleString('en-US', {timeZone: 'Europe/Zagreb'}));
      const eventEndCroatian = new Date(eventEnd.toLocaleString('en-US', {timeZone: 'Europe/Zagreb'}));
      
      // Extract just date parts for comparison  
      const eventStartDate = new Date(Date.UTC(eventStartCroatian.getFullYear(), eventStartCroatian.getMonth(), eventStartCroatian.getDate()));
      const eventEndDate = new Date(Date.UTC(eventEndCroatian.getFullYear(), eventEndCroatian.getMonth(), eventEndCroatian.getDate()));
      
      return (checkInDate < eventEndDate && checkOutDate > eventStartDate);
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
    
    // Only check for apartments 1 and 2
    if (apartment !== '1' && apartment !== '2') {
      return res.json({ hasConflict: false });
    }
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    // Fetch calendar data
    const calendars = await fetchCalendars();
    const calendarKey = apartment === '2' ? 'calendar2' : 'calendar1';
    const calendarEvents = calendars[calendarKey] || [];
    
    // Check for conflicts
    const hasConflict = calendarEvents.some(event => {
      const eventStart = new Date(event.pocetak);
      const eventEnd = new Date(event.kraj);
      
      // Convert to Croatian timezone properly
      const eventStartCroatian = new Date(eventStart.toLocaleString('en-US', {timeZone: 'Europe/Zagreb'}));
      const eventEndCroatian = new Date(eventEnd.toLocaleString('en-US', {timeZone: 'Europe/Zagreb'}));
      
      // Extract just date parts for comparison  
      const eventStartDate = new Date(Date.UTC(eventStartCroatian.getFullYear(), eventStartCroatian.getMonth(), eventStartCroatian.getDate()));
      const eventEndDate = new Date(Date.UTC(eventEndCroatian.getFullYear(), eventEndCroatian.getMonth(), eventEndCroatian.getDate()));
      
      return (checkInDate < eventEndDate && checkOutDate > eventStartDate);
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
