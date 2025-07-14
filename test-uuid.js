// Test script za provjeru UUID funkcionalnosti
const { fetchCalendars } = require('./code/calendarAPI');

async function testUUIDFunctionality() {
  console.log('=== Testing UUID functionality ===');
  
  try {
    // Test fetching all calendars
    const allCalendars = await fetchCalendars();
    console.log('All calendars fetched successfully');
    
    // Check calendar1
    console.log(`\nCalendar 1 has ${allCalendars.calendar1.length} events`);
    allCalendars.calendar1.forEach((event, idx) => {
      console.log(`Event ${idx + 1}: ${event.naziv} (UUID: ${event.event_uuid})`);
    });
    
    // Check calendar2  
    console.log(`\nCalendar 2 has ${allCalendars.calendar2.length} events`);
    allCalendars.calendar2.forEach((event, idx) => {
      console.log(`Event ${idx + 1}: ${event.naziv} (UUID: ${event.event_uuid})`);
    });
    
    // Test fetching specific calendar
    const calendar1 = await fetchCalendars('1');
    console.log(`\nFetched calendar 1 specifically: ${calendar1.length} events`);
    
    // Test reservation manager compatibility
    const { processReservation } = require('./code/reservationManager');
    console.log('\nReservation manager loaded successfully');
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testUUIDFunctionality();
