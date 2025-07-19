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
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function fetchIcalReservations(url) {
  const data = await ical.async.fromURL(url);
  return Object.values(data)
    .filter((event) => event.type === "VEVENT")
    .map((event) => ({
      event_uuid: uuidv4(),
      naziv: event.summary,
      pocetak: event.start,
      kraj: event.end,
    }));
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

// Dodaj evente iz Airbnb-a u lokalni kalendar, bez duplikata
async function updateCalendarFromIcal(url, fileName) {
  const noviEventi = await fetchIcalReservations(url);
  const postojećiEventi = readCalendar(fileName);

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

  const sviEventi = [...postojećiEventi, ...zaDodati];
  
  // Ukloni duplikate iz svih evenata
  const eventiBeznaDuplikata = removeDuplicates(sviEventi);
  
  writeCalendar(fileName, eventiBeznaDuplikata);

  return zaDodati; // returns only added events
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
    }
    return event;
  });
  
  // Add UUID to calendar2 events
  const calendar2WithUUID = calendar2.map(event => {
    if (!event.event_uuid) {
      event.event_uuid = uuidv4();
    }
    return event;
  });
  
  // Add UUID to calendar3 events
  const calendar3WithUUID = calendar3.map(event => {
    if (!event.event_uuid) {
      event.event_uuid = uuidv4();
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
