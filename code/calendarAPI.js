const fs = require('fs');
const path = require('path');
const ical = require("node-ical");

function readCalendar(fileName) {
  const filePath = path.join(__dirname, '../data', fileName);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeCalendar(fileName, data) {
  const filePath = path.join(__dirname, '../data', fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
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

// Dodaj evente iz Airbnb-a u lokalni kalendar, bez duplikata
async function updateCalendarFromIcal(url, fileName) {
  const noviEventi = await fetchIcalReservations(url);
  const postojećiEventi = readCalendar(fileName);

  function jeIdentican(e1, e2) {
    return (
      String(e1.pocetak) === String(e2.pocetak) &&
      String(e1.kraj) === String(e2.kraj)
    );
  }

  const zaDodati = noviEventi.filter(novi =>
    !postojećiEventi.some(postojeci => jeIdentican(novi, postojeci))
  );

  const sviEventi = [...postojećiEventi, ...zaDodati];
  writeCalendar(fileName, sviEventi);

  return zaDodati; // vraća samo dodane evente
}

async function fetchCalendars() {
  return {
    calendar1: readCalendar('calendar1.json'),
    calendar2: readCalendar('calendar2.json')
  };
}

module.exports = {
  fetchIcalReservations,
  fetchCalendars,
  updateCalendarFromIcal,
  readCalendar,
  writeCalendar
};