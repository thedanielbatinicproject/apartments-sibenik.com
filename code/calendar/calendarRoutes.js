const { fetchCalendars, updateCalendarFromIcal, cleanDuplicatesFromCalendar } = require('./calendarAPI');

// Display calendar for specific apartment (1, 2, 3)
async function displayCalendar(req, res) {
  try {
    const calendarId = req.params.id;
    if (!["1", "2", "3"].includes(calendarId)) {
      return res.status(404).render("error", {
        error: {
          "error-code": 404,
          "error-title": "Calendar not found",
          "error-message": `Calendar ${calendarId} does not exist. Only calendars 1, 2 i 3 su dostupni.`,
        },
        lastVisitedPage: req.session.lastVisitedPage,
      });
    }
    const calendars = await fetchCalendars();
    let calendarKey = "calendar1";
    if (calendarId === "2") calendarKey = "calendar2";
    if (calendarId === "3") calendarKey = "calendar3";
    const calendar = calendars[calendarKey] || [];
    res.render("modules/calendar", { calendar });
  } catch (err) {
    res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Error fetching calendar",
        "error-message": err.message || "Failed to fetch calendar.",
      },
      lastVisitedPage: req.session.lastVisitedPage,
    });
  }
}

// Update calendar from iCal (Calendar 1, 2, 3)
async function updateCalendar(req, res) {
  try {
    const calendarId = req.params.id;
    if (!["1", "2", "3"].includes(calendarId)) {
      return res.status(404).render("error", {
        error: {
          "error-code": 404,
          "error-title": "Calendar not found",
          "error-message": `Calendar ${calendarId} does not exist. Only calendars 1, 2 i 3 su dostupni.`,
        },
        lastVisitedPage: req.session.lastVisitedPage,
      });
    }
    let url;
    if (calendarId === "1") url = process.env.ICAL_URL_1;
    else if (calendarId === "2") url = process.env.ICAL_URL_2;
    else if (calendarId === "3") url = process.env.ICAL_URL_3;
    
    console.log(`[CALENDAR] Updating calendar ${calendarId} from URL: ${url}`);
    
    if (!url) {
      throw new Error(`ICAL_URL_${calendarId} environment variable not set`);
    }
    
    const fileName = "calendar" + calendarId + ".json";
    const addedEvents = await updateCalendarFromIcal(url, fileName);
    res.json(addedEvents);
  } catch (err) {
    console.error(`[CALENDAR] Error updating calendar ${req.params.id}:`, err);
    console.error(`[CALENDAR] Error stack:`, err.stack);
    res.status(500).json({
      error: err.message || `Failed to fetch iCal calendar ${req.params.id}.`,
      success: false,
      details: err.stack
    });
  }
}

// Clean calendar duplicates (1, 2, 3)
async function cleanCalendar(req, res) {
  try {
    const calendarId = req.params.id;
    if (!["1", "2", "3"].includes(calendarId)) {
      return res.status(404).json({
        error: `Calendar ${calendarId} does not exist. Only calendars 1, 2 i 3 su dostupni.`,
      });
    }
    const cleanedEvents = await cleanDuplicatesFromCalendar(calendarId);
    res.json({
      message: `Calendar ${calendarId} cleaned successfully`,
      eventsCount: cleanedEvents.length,
    });
  } catch (err) {
    res.status(500).json({
      error: err.message || "Failed to clean calendar duplicates",
    });
  }
}

module.exports = {
  displayCalendar,
  updateCalendar,
  cleanCalendar
};
