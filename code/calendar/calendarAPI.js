const fs = require("fs");
const path = require("path");
const ical = require("node-ical");
const { v4: uuidv4 } = require('uuid');

function readCalendar(fileName) {
  const filePath = path.join(__dirname, "../../data/calendars", fileName);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return [];
  }
}

function writeCalendar(fileName, data) {
  const filePath = path.join(__dirname, "../../data/calendars", fileName);
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    console.log(`[CALENDAR API] Successfully wrote ${data.length} events to ${fileName}`);
  } catch (error) {
    console.error(`[CALENDAR API] Error writing calendar ${fileName}:`, error);
    throw error;
  }
}

async function fetchIcalReservations(url) {
  try {
    console.log(`[CALENDAR API] Fetching iCal data from: ${url}`);
    
    // Options for node-ical with better error handling
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000 // 10 seconds timeout
    };
    
    const data = await ical.async.fromURL(url, options);
    
    if (!data) {
      throw new Error('No data received from iCal URL');
    }
    
    const events = Object.values(data)
      .filter((event) => event.type === "VEVENT")
      .map((event) => ({
        event_uuid: uuidv4(),
        naziv: event.summary || 'Unnamed Event',
        pocetak: event.start,
        kraj: event.end,
      }));
    
    console.log(`[CALENDAR API] Successfully parsed ${events.length} events from iCal`);
    return events;
  } catch (error) {
    console.error(`[CALENDAR API] Error fetching iCal from ${url}:`, error);
    console.error(`[CALENDAR API] Error details:`, error.message);
    
    // Provide more specific error messages
    if (error.code === 'ENOTFOUND') {
      throw new Error(`DNS lookup failed for ${url}`);
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error(`Connection refused to ${url}`);
    } else if (error.code === 'ETIMEDOUT') {
      throw new Error(`Timeout while fetching ${url}`);
    } else {
      throw new Error(`Failed to fetch iCal from ${url}: ${error.message}`);
    }
  }
}

function removeDuplicates(events) {
  const seenEvents = new Map();
  
  return events.filter(event => {
    // Add UUID if it doesn't exist
    if (!event.event_uuid) {
      event.event_uuid = uuidv4();
    }
    
    // Create unique key for event
    const key = `${event.naziv}_${event.pocetak}_${event.kraj}`;
    
    if (seenEvents.has(key)) {
      console.log('Removing duplicate event:', event.naziv, event.pocetak);
      return false; // Skip duplicate
    }
    
    seenEvents.set(key, true);
    return true; // Keep first occurrence
  });
}

// Dodaj evente iz iCal-a u lokalni kalendar, bez duplikata
async function updateCalendarFromIcal(url, fileName) {
  try {
    console.log(`[CALENDAR API] Fetching iCal from: ${url}`);
    const noviEventi = await fetchIcalReservations(url);
    console.log(`[CALENDAR API] Fetched ${noviEventi.length} events from iCal`);
    
    const postojećiEventi = readCalendar(fileName);
    console.log(`[CALENDAR API] Existing events in ${fileName}: ${postojećiEventi.length}`);

    // Add UUID to existing events that don't have it
    postojećiEventi.forEach(event => {
      if (!event.event_uuid) {
        event.event_uuid = uuidv4();
      }
    });

    function jeIdentican(e1, e2) {
      const e1Pocetak =
        e1.pocetak instanceof Date
          ? e1.pocetak.toISOString()
          : String(e1.pocetak);
      const e1Kraj =
        e1.kraj instanceof Date ? e1.kraj.toISOString() : String(e1.kraj);
      const e2Pocetak =
        e2.pocetak instanceof Date
          ? e2.pocetak.toISOString()
          : String(e2.pocetak);
      const e2Kraj =
        e2.kraj instanceof Date ? e2.kraj.toISOString() : String(e2.kraj);

      const result =
        String(e1.naziv) === String(e2.naziv) &&
        e1Pocetak === e2Pocetak &&
        e1Kraj === e2Kraj;
      return result;
    }

    const zaDodati = noviEventi.filter(
      (novi) => !postojećiEventi.some((postojeci) => jeIdentican(novi, postojeci))
    );

    console.log(`[CALENDAR API] New events to add: ${zaDodati.length}`);

    const sviEventi = [...postojećiEventi, ...zaDodati];
    
    // Ukloni duplikate iz svih evenata
    const eventiBeznaDuplikata = removeDuplicates(sviEventi);
    
    writeCalendar(fileName, eventiBeznaDuplikata);
    console.log(`[CALENDAR API] Calendar ${fileName} updated successfully`);

    return zaDodati; // returns only added events
  } catch (error) {
    console.error(`[CALENDAR API] Error updating calendar from iCal:`, error);
    throw error;
  }
}

async function cleanDuplicatesFromCalendar(calendarId) {
  const fileName = `calendar${calendarId}.json`;
  const events = readCalendar(fileName);
  const cleanedEvents = removeDuplicates(events);
  
  console.log(`Cleaning calendar ${calendarId}: ${events.length} -> ${cleanedEvents.length} events`);
  
  writeCalendar(fileName, cleanedEvents);
  return cleanedEvents;
}

async function fetchCalendars(id) {
  if (id) {
    // Return specific calendar
    const events = readCalendar(`calendar${id}.json`);
    // Add UUID to events that don't have it
    const eventsWithUUID = events.map(event => {
      if (!event.event_uuid) {
        event.event_uuid = uuidv4();
      }
      return event;
    });
    
    // Save back to file if UUIDs were added
    if (eventsWithUUID.some(event => !events.find(e => e.event_uuid === event.event_uuid))) {
      writeCalendar(`calendar${id}.json`, eventsWithUUID);
    }
    
    return eventsWithUUID;
  }
  // Return all calendars
  const calendar1 = readCalendar("calendar1.json");
  const calendar2 = readCalendar("calendar2.json");
  const calendar3 = readCalendar("calendar3.json");
  
  // Add UUID to calendar1 events
  const calendar1WithUUID = calendar1.map(event => {
    if (!event.event_uuid) {
      event.event_uuid = uuidv4();
      event.pocetak.setDate(event.pocetak.getDate() + 1);
      event.kraj.setDate(event.kraj.getDate() + 1);
    }
    return event;
  });
  
  // Add UUID to calendar2 events
  const calendar2WithUUID = calendar2.map(event => {
    if (!event.event_uuid) {
      event.event_uuid = uuidv4();
      event.pocetak.setDate(event.pocetak.getDate() + 1);
      event.kraj.setDate(event.kraj.getDate() + 1);
    }
    return event;
  });
  
  // Add UUID to calendar3 events
  const calendar3WithUUID = calendar3.map(event => {
    if (!event.event_uuid) {
      event.event_uuid = uuidv4();
      event.pocetak.setDate(event.pocetak.getDate() + 1);
      event.kraj.setDate(event.kraj.getDate() + 1);
    }
    return event;
  });
  
  // Save back to files if UUIDs were added
  if (calendar1WithUUID.some(event => !calendar1.find(e => e.event_uuid === event.event_uuid))) {
    writeCalendar("calendar1.json", calendar1WithUUID);
  }
  if (calendar2WithUUID.some(event => !calendar2.find(e => e.event_uuid === event.event_uuid))) {
    writeCalendar("calendar2.json", calendar2WithUUID);
  }
  if (calendar3WithUUID.some(event => !calendar3.find(e => e.event_uuid === event.event_uuid))) {
    writeCalendar("calendar3.json", calendar3WithUUID);
  }
  
  return {
    calendar1: calendar1WithUUID,
    calendar2: calendar2WithUUID,
    calendar3: calendar3WithUUID,
  };
}

module.exports = {
  fetchIcalReservations,
  fetchCalendars,
  updateCalendarFromIcal,
  readCalendar,
  writeCalendar,
  cleanDuplicatesFromCalendar,
  removeDuplicates,
};
