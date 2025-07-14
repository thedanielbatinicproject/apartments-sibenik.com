const { fetchCalendars, updateCalendarFromIcal, cleanDuplicatesFromCalendar } = require('./calendarAPI');

// Display calendar for specific apartment
async function displayCalendar(req, res) {
  try {
    const calendarId = req.params.id;

    // Limit to calendars 1 and 2
    if (calendarId !== "1" && calendarId !== "2") {
      return res.status(404).render("error", {
        error: {
          "error-code": 404,
          "error-title": "Calendar not found",
          "error-message": `Calendar ${calendarId} does not exist. Only calendars 1 and 2 are available.`,
        },
        lastVisitedPage: req.session.lastVisitedPage,
      });
    }

    const calendars = await fetchCalendars();
    const calendarKey = calendarId === "2" ? "calendar2" : "calendar1";
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

// Update calendar from Airbnb iCal
async function updateCalendar(req, res) {
  try {
    const calendarId = req.params.id;

    // Limit to calendars 1 and 2
    if (calendarId !== "1" && calendarId !== "2") {
      return res.status(404).render("error", {
        error: {
          "error-code": 404,
          "error-title": "Calendar not found",
          "error-message": `Calendar ${calendarId} does not exist. Only calendars 1 and 2 are available.`,
        },
        lastVisitedPage: req.session.lastVisitedPage,
      });
    }

    const airbnbIcalUrl1 = process.env.AIRBNB_ICAL_URL_1;
    const airbnbIcalUrl2 = process.env.AIRBNB_ICAL_URL_2;
    
    const url = calendarId === "1" ? airbnbIcalUrl1 : airbnbIcalUrl2;
    const fileName = "calendar" + calendarId + ".json";
    const addedEvents = await updateCalendarFromIcal(url, fileName);
    res.json(addedEvents);
  } catch (err) {
    res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Error fetching iCal",
        "error-message": err.message || "Failed to fetch iCal calendar " + req.params.id + ".",
      },
      lastVisitedPage: req.session.lastVisitedPage,
    });
  }
}

// Clean calendar duplicates
async function cleanCalendar(req, res) {
  try {
    const calendarId = req.params.id;

    // Limit to calendars 1 and 2
    if (calendarId !== "1" && calendarId !== "2") {
      return res.status(404).json({
        error: `Calendar ${calendarId} does not exist. Only calendars 1 and 2 are available.`,
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
