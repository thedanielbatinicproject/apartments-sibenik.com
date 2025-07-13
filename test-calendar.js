// Test script za calendar parsing

const testData = [
  {
    "naziv": "Reserved",
    "pocetak": "2025-07-07T22:00:00.000Z",
    "kraj": "2025-07-14T22:00:00.000Z"
  },
  {
    "naziv": "Reserved",
    "pocetak": "2025-07-25T22:00:00.000Z",
    "kraj": "2025-08-03T22:00:00.000Z"
  }
];

function getBlueShade(idx, total) {
  const hue = 210;
  const sat = 60 + Math.floor((idx / Math.max(total, 1)) * 30);
  const light = 65 - Math.floor((idx / Math.max(total, 1)) * 25);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

function parseEvents(events, year, month) {
  console.log('parseEvents called with:', events, 'for year:', year, 'month:', month);
  
  const map = {};
  events.forEach((ev, idx) => {
    console.log('Processing event:', ev);
    if (!ev.pocetak || !ev.kraj) {
      console.log('Event missing pocetak or kraj:', ev);
      return;
    }
    if (!ev._color) ev._color = getBlueShade(idx, events.length);
    const start = new Date(ev.pocetak);
    const end = new Date(ev.kraj);
    console.log('Original dates - start:', start, 'end:', end);
    
    // Ne oduzimamo dan jer je to problem!
    const localStart = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );
    const localEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    console.log('Local dates - start:', localStart, 'end:', localEnd);
    
    let firstDay = null, lastDay = null;
    for (
      let d = new Date(localStart);
      d <= localEnd;
      d.setDate(d.getDate() + 1)
    ) {
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        console.log('Adding event to day:', day);
        if (!map[day]) map[day] = [];
        map[day].push({
          ...ev,
          _eventId: idx,
          _start: localStart,
          _end: localEnd,
          _color: ev._color,
        });
        if (!firstDay || day < firstDay) firstDay = day;
        if (!lastDay || day > lastDay) lastDay = day;
      }
    }
    if (firstDay && lastDay) {
      for (let d = firstDay; d <= lastDay; d++) {
        if (!map[d]) map[d] = [];
        map[d].forEach((e) => {
          if (e._eventId === idx) {
            e._firstDay = firstDay;
            e._lastDay = lastDay;
          }
        });
      }
    }
  });
  console.log('parseEvents result map:', map);
  return map;
}

// Test sa srpnjom 2025
console.log('=== Testing July 2025 ===');
const julyEvents = parseEvents(testData, 2025, 6); // Mjesec je 0-indexed, tako da je 6 = srpanj
console.log('July events:', julyEvents);

// Test sa avgust 2025
console.log('=== Testing August 2025 ===');
const augustEvents = parseEvents(testData, 2025, 7); // Mjesec je 0-indexed, tako da je 7 = august
console.log('August events:', augustEvents);
