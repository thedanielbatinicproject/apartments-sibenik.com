const fs = require("fs");
const path = require("path");
const ical = require("node-ical");

function readCalendar(fileName) {
  const filePath = path.join(__dirname, "../data/calendars", fileName);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (e) {
    return [];
  }
}

function writeCalendar(fileName, data) {
  const filePath = path.join(__dirname, "../data/calendars", fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

async function fetchIcalReservations(url) {
  const data = await ical.async.fromURL(url);
  return Object.values(data)
    .filter((event) => event.type === "VEVENT")
    .map((event) => ({
      naziv: event.summary,
      pocetak: event.start,
      kraj: event.end,
    }));
}

function removeDuplicates(events) {
  const seenEvents = new Map();
  
  return events.filter(event => {
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
    console.log(`Comparing: ${JSON.stringify(e1)} with ${JSON.stringify(e2)}`);
    console.log(`Result: ${result}`);
    return result;
  }

  const zaDodati = noviEventi.filter(
    (novi) => !postojećiEventi.some((postojeci) => jeIdentican(novi, postojeci))
  );

  const sviEventi = [...postojećiEventi, ...zaDodati];
  
  // Ukloni duplikate iz svih evenata
  const eventiBeznaDuplikata = removeDuplicates(sviEventi);
  
  console.log(`Calendar ${fileName}: ${sviEventi.length} -> ${eventiBeznaDuplikata.length} events (removed ${sviEventi.length - eventiBeznaDuplikata.length} duplicates)`);
  
  writeCalendar(fileName, eventiBeznaDuplikata);

  return addedEvents; // returns only added events
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
    return readCalendar(`calendar${id}.json`);
  }
  // Return all calendars
  return {
    calendar1: readCalendar("calendar1.json"),
    calendar2: readCalendar("calendar2.json"),
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
