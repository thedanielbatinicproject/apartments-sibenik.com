function getMonthDays(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getDayNames(firstDay) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return days.slice(firstDay).concat(days.slice(0, firstDay));
}
function getFirstDayOfMonth(year, month) {
  let jsDay = new Date(year, month, 1).getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}
function getBlueShade(idx, total) {
  const hue = 210;
  const sat = 60 + Math.floor((idx / Math.max(total, 1)) * 30);
  const light = 65 - Math.floor((idx / Math.max(total, 1)) * 25);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}
function parseEvents(events, year, month) {
  const map = {};
  events.forEach((ev, idx) => {
    if (!ev.pocetak || !ev.kraj) return;
    if (!ev._color) ev._color = getBlueShade(idx, events.length);
    const start = new Date(ev.pocetak);
    const end = new Date(ev.kraj);
    
    // Ne oduzimamo dan jer je to bio bug!
    const localStart = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate()
    );
    const localEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    
    let firstDay = null, lastDay = null;
    for (
      let d = new Date(localStart);
      d <= localEnd;
      d.setDate(d.getDate() + 1)
    ) {
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
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
  return map;
}

function getEventClass(events, day, year, month) {
  if (!events || !events[day]) return { left: [], middle: [], right: [] };
  let left = [], middle = [], right = [];
  const daysInMonth = getMonthDays(year, month);

  events[day].forEach((ev) => {
    const eventStartDay = ev._start.getDate();
    const eventStartMonth = ev._start.getMonth();
    const eventEndDay = ev._end.getDate();
    const eventEndMonth = ev._end.getMonth();

    // --- ZADNJI DAN U MJESECU ---
    if (day === daysInMonth) {
      const starts = (eventStartDay === day && eventStartMonth === month);
      const ends = (eventEndDay === day && eventEndMonth === month);

      if (starts && ends) {
        left.push({ className: "event-end", eventId: ev._eventId, color: ev._color });
        right.push({ className: "event-start", eventId: ev._eventId, color: ev._color });
      } else if (starts) {
        right.push({ className: "event-start", eventId: ev._eventId, color: ev._color });
      } else if (ends) {
        left.push({ className: "event-end", eventId: ev._eventId, color: ev._color });
      } else {
        left.push({ className: "event-full", eventId: ev._eventId, color: ev._color });
        middle.push({ className: "event-full", eventId: ev._eventId, color: ev._color });
        right.push({ className: "event-full", eventId: ev._eventId, color: ev._color });
      }
      return;
    }

    // --- PRVI DAN U MJESECU ---
    if (day === 1) {
      const starts = (eventStartDay === day && eventStartMonth === month);
      const ends = (eventEndDay === day && eventEndMonth === month);

      if (starts && ends) {
        left.push({ className: "event-end", eventId: ev._eventId, color: ev._color });
        right.push({ className: "event-start", eventId: ev._eventId, color: ev._color });
      } else if (starts) {
        right.push({ className: "event-start", eventId: ev._eventId, color: ev._color });
      } else if (ends) {
        left.push({ className: "event-end", eventId: ev._eventId, color: ev._color });
      } else {
        left.push({ className: "event-full", eventId: ev._eventId, color: ev._color });
        middle.push({ className: "event-full", eventId: ev._eventId, color: ev._color });
        right.push({ className: "event-full", eventId: ev._eventId, color: ev._color });
      }
      return;
    }

    // --- SREDINA MJESECA ---
    if (ev._firstDay === ev._lastDay) {
      // ADD SPECIAL CLASS FOR ORANGE ON MIDDLE
      middle.push({ className: "event-single-day-orange", eventId: ev._eventId, color: ev._color });
      
    }
    else if (day === ev._firstDay) {
      right.push({ className: "event-start", eventId: ev._eventId, color: ev._color });
    }
    else if (day === ev._lastDay) {
      left.push({ className: "event-end", eventId: ev._eventId, color: ev._color });
    }
    else {
      left.push({ className: "event-full", eventId: ev._eventId, color: ev._color });
      middle.push({ className: "event-full", eventId: ev._eventId, color: ev._color });
      right.push({ className: "event-full", eventId: ev._eventId, color: ev._color });
    }
  });
  return { left, middle, right };
}

function renderCalendar(year, month, events) {
  const grid = document.getElementById("calendarGrid");
  grid.innerHTML = "";
  const firstDay = getFirstDayOfMonth(year, month);
  const dayNames = getDayNames(0);
  dayNames.forEach((dn) => {
    const el = document.createElement("div");
    el.className = "calendar-dayname";
    el.textContent = dn;
    grid.appendChild(el);
  });
  const daysInMonth = getMonthDays(year, month);
  let startOffset = firstDay;
  for (let i = 0; i < startOffset; i++) {
    const el = document.createElement("div");
    el.className = "calendar-cell empty-cell";
    el.style.visibility = "hidden";
    grid.appendChild(el);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const el = document.createElement("div");
    el.className = "calendar-cell";
    const { left, middle, right } = getEventClass(events, day, year, month);

    // Add classes for connection lines - only show line if current cell has event
    const hasAnyEvent = left.length > 0 || middle.length > 0 || right.length > 0;
    
    if (hasAnyEvent) {
      // Check if next day also has an event (for connection line)
      const nextDay = day + 1;
      if (nextDay <= daysInMonth) {
        const nextDayEvents = getEventClass(events, nextDay, year, month);
        const nextHasEvent = nextDayEvents.left.length > 0 || nextDayEvents.middle.length > 0 || nextDayEvents.right.length > 0;
        
        if (nextHasEvent) {
          el.classList.add("has-event-connection");
        }
      }
    }
    
    // Add column position classes for edge cases
    const dayOfWeek = (firstDay + day - 1) % 7;
    if (dayOfWeek === 0) el.classList.add("first-column");
    if (dayOfWeek === 6) el.classList.add("last-column");

    left.forEach((evClassObj) => {
      const part = document.createElement("div");
      part.className = "cell-part left " + evClassObj.className;
      part.setAttribute("data-event-id", evClassObj.eventId);
      part.style.background = evClassObj.color;
      el.appendChild(part);
    });
    middle.forEach((evClassObj) => {
      const part = document.createElement("div");
      part.className = "cell-part middle " + evClassObj.className;
      part.setAttribute("data-event-id", evClassObj.eventId);
      part.style.background = evClassObj.color;
      el.appendChild(part);
    });
    right.forEach((evClassObj) => {
      const part = document.createElement("div");
      part.className = "cell-part right " + evClassObj.className;
      part.setAttribute("data-event-id", evClassObj.eventId);
      part.style.background = evClassObj.color;
      el.appendChild(part);
    });

    const span = document.createElement("span");
    span.textContent = day;
    el.appendChild(span);
    grid.appendChild(el);
  }
  addEventHoverHandlers();
}
function addEventHoverHandlers() {
  document.querySelectorAll(".cell-part[data-event-id]").forEach((part) => {
    part.addEventListener("mouseenter", function () {
      const eventId = part.getAttribute("data-event-id");
      document
        .querySelectorAll(`.cell-part[data-event-id="${eventId}"]`)
        .forEach((el) => {
          if (el.classList.contains("event-full"))
            el.classList.add("event-hover");
          if (el.classList.contains("event-start"))
            el.classList.add("event-hover-start");
          if (el.classList.contains("event-end"))
            el.classList.add("event-hover-end");
        });
    });
    part.addEventListener("mouseleave", function () {
      const eventId = part.getAttribute("data-event-id");
      document
        .querySelectorAll(`.cell-part[data-event-id="${eventId}"]`)
        .forEach((el) => {
          el.classList.remove("event-hover");
          el.classList.remove("event-hover-start");
          el.classList.remove("event-hover-end");
        });
    });
  });
}

(function () {
  const now = new Date();
  let year = now.getFullYear();
  let month = now.getMonth();
  let events = parseEvents(calendarData, year, month);
  
  function update() {
    document.getElementById(
      "calendarMonthYear"
    ).textContent = `${now.toLocaleString("default", {
      month: "long",
    })} - ${year}`;
    events = parseEvents(calendarData, year, month);
    renderCalendar(year, month, events);
  }
  document.getElementById("prevMonth").onclick = function () {
    month--;
    if (month < 0) {
      month = 11;
      year--;
    }
    now.setFullYear(year);
    now.setMonth(month);
    update();
  };
  document.getElementById("nextMonth").onclick = function () {
    month++;
    if (month > 11) {
      month = 0;
      year++;
    }
    now.setFullYear(year);
    now.setMonth(month);
    update();
  };
  update();
})();