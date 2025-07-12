const express = require("express");
const axios = require("axios");
const path = require("path");
const useragent = require("express-useragent");
const ical = require("node-ical");
require('dotenv').config();

const {
  fetchCalendars,
  fetchIcalReservations,
  updateCalendarFromIcal
} = require("./code/calendarAPI");

const app = express();
app.use(useragent.express());

app.use(express.static(path.join(__dirname, "public")));

app.set("trust proxy", true);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/hr", require("./routes/hr"));
app.use("/de", require("./routes/de"));
app.use("/en", require("./routes/en"));

app.get("/", async (req, res) => {
  const clientIp = req.ip;
  let countryCode = "EN";
  try {
    const response = await axios.get(`http://ip-api.com/json/${clientIp}`);
    if (response.data && response.data.countryCode) {
      countryCode = response.data.countryCode;
    }
  } catch (error) {
    return res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Greška pri geolokaciji",
        "error-message": error.message || "Neuspješno dohvaćanje lokacije.",
      },
    });
  }

  let lang = "en";
  if (countryCode === "HR") lang = "hr";
  else if (countryCode === "DE") lang = "de";

  const isMobile = req.useragent.isMobile;
  const device = isMobile ? "mobile" : "desktop";
  res.redirect(`/${lang}/${device}`);
});

app.get("/desktop", async (req, res) => {
  let countryCode = "EN";
  try {
    const response = await axios.get(`http://ip-api.com/json/${req.ip}`);
    if (response.data && response.data.countryCode) {
      countryCode = response.data.countryCode;
    }
  } catch (error) {
    return res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Greška pri geolokaciji",
        "error-message": error.message || "Neuspješno dohvaćanje lokacije.",
      },
    });
  }

  let lang = "en";
  if (countryCode === "HR") lang = "hr";
  else if (countryCode === "DE") lang = "de";

  res.redirect(`/${lang}/desktop`);
});

app.get("/mobile", async (req, res) => {
  let countryCode = "EN";
  try {
    const response = await axios.get(`http://ip-api.com/json/${req.ip}`);
    if (response.data && response.data.countryCode) {
      countryCode = response.data.countryCode;
    }
  } catch (error) {
    return res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Greška pri geolokaciji",
        "error-message": error.message || "Neuspješno dohvaćanje lokacije.",
      },
    });
  }

  let lang = "en";
  if (countryCode === "HR") lang = "hr";
  else if (countryCode === "DE") lang = "de";

  res.redirect(`/${lang}/mobile`);
});

// Prikaz kalendara 1 ili 2
app.get("/calendar/:id", async (req, res) => {
  try {
    const calendars = await fetchCalendars();
    const calendarId = req.params.id === '2' ? 'calendar2' : 'calendar1';
    const calendar = calendars[calendarId] || [];
    res.render("modules/calendar", { calendar });
  } catch (err) {
    res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Greška pri dohvaćanju kalendara",
        "error-message": err.message || "Neuspješno dohvaćanje kalendara.",
      },
    });
  }
});

// Update kalendara iz Airbnb-a, dodaje samo nove evente
const airbnbIcalUrl1 = process.env.AIRBNB_ICAL_URL_1;
const airbnbIcalUrl2 = process.env.AIRBNB_ICAL_URL_2;

app.get("/kalendar/:id", async (req, res) => {
  try {
    const url = req.params.id === '1' ? airbnbIcalUrl1 : airbnbIcalUrl2;
    const fileName = 'calendar' + req.params.id + '.json';
    const dodaniEventi = await updateCalendarFromIcal(url, fileName);
    res.json(dodaniEventi);
  } catch (err) {
    res.status(500).render("error", {
      error: {
        "error-code": 500,
        "error-title": "Error fetching iCal",
        "error-message": err.message || "Failed to fetch iCal calendar " + req.params.id + ".",
      },
    });
  }
});

app.use((req, res) => {
  let errorTitle = "Page not found";
  let errorMessage = "The requested page does not exist.";

  if (req.url.startsWith("/hr")) {
    errorTitle = "Stranica nije pronađena";
    errorMessage = "Tražena stranica ne postoji.";
  } else if (req.url.startsWith("/de")) {
    errorTitle = "Seite nicht gefunden";
    errorMessage = "Die angeforderte Seite existiert nicht.";
  }

  res.status(404).render("error", {
    error: {
      "error-code": 404,
      "error-title": errorTitle,
      "error-message": errorMessage,
    },
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App pokrenuta na portu ${PORT}`);
});