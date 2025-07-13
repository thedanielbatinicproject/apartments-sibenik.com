// Test script za fetchCalendars
const { fetchCalendars } = require('./code/calendarAPI');

async function testCalendars() {
  console.log('Testing fetchCalendars...');
  
  try {
    const calendar1 = await fetchCalendars('1');
    console.log('Calendar 1:', calendar1);
    console.log('Calendar 1 length:', calendar1 ? calendar1.length : 'undefined');
    
    const calendar2 = await fetchCalendars('2');
    console.log('Calendar 2:', calendar2);
    console.log('Calendar 2 length:', calendar2 ? calendar2.length : 'undefined');
    
    // Test if calendar1 has events for July 2025
    if (calendar1 && calendar1.length > 0) {
      console.log('Calendar 1 events:');
      calendar1.forEach((event, idx) => {
        console.log(`Event ${idx}:`, event);
        const startDate = new Date(event.pocetak);
        const endDate = new Date(event.kraj);
        console.log(`  Start: ${startDate.toISOString()}`);
        console.log(`  End: ${endDate.toISOString()}`);
        console.log(`  Is July 2025: ${startDate.getFullYear() === 2025 && startDate.getMonth() === 6}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testCalendars();
