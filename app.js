const express = require("express");
const axios = require("axios");
const path = require("path");
const useragent = require("express-useragent");
const ical = require("node-ical");

const app = express();
app.use(useragent.express());

app.use(express.static(path.join(__dirname, "public")));

app.set("trust proxy", true);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Učitavanje ruta
app.use("/hr", require("./routes/hr"));
app.use("/de", require("./routes/de"));
app.use("/en", require("./routes/en"));

// Glavna ruta -> detekcija IP + uređaja + redirect
app.get("/", async (req, res) => {
  const clientIp = req.ip;
  console.log("IP klijenta:", clientIp);

  let countryCode = "EN"; // Default
  try {
    const response = await axios.get(`http://ip-api.com/json/${clientIp}`);
    if (response.data && response.data.countryCode) {
      countryCode = response.data.countryCode;
    }
  } catch (error) {
    console.warn("Greška pri geolokaciji:", error.message);
  }

  let lang = "en";
  if (countryCode === "HR") lang = "hr";
  else if (countryCode === "DE") lang = "de";

  const isMobile = req.useragent.isMobile;
  const device = isMobile ? "mobile" : "desktop";

  console.log(`Redirect na /${lang}/${device}`);
  res.redirect(`/${lang}/${device}`);
});

const airbnbIcalUrl1 =
  "https://www.airbnb.com/calendar/ical/7392911.ics?s=f0bf8c918d88234909f64e590128eb18";
const airbnbIcalUrl2 =
  "https://www.airbnb.com/calendar/ical/7397131.ics?s=1e0c01e4be1ebff3b8ae10aab2060318";

app.get("/kalendar1", async (req, res) => {
  try {
    // Dohvati svježe podatke s Airbnb-a
    const data = await ical.async.fromURL(airbnbIcalUrl1);

    // Filtriraj samo događaje (rezervacije)
    const rezervacije = Object.values(data)
      .filter((event) => event.type === "VEVENT")
      .map((event) => ({
        naziv: event.summary,
        pocetak: event.start,
        kraj: event.end,
      }));

    res.json(rezervacije);
  } catch (err) {
    console.error("Greška pri dohvaćanju iCal:", err);
    res.status(500).send("Greška pri dohvaćanju kalendara");
  }
});

app.get("/kalendar2", async (req, res) => {
  try {
    // Dohvati svježe podatke s Airbnb-a
    const data = await ical.async.fromURL(airbnbIcalUrl2);

    // Filtriraj samo događaje (rezervacije)
    const rezervacije = Object.values(data)
      .filter((event) => event.type === "VEVENT")
      .map((event) => ({
        naziv: event.summary,
        pocetak: event.start,
        kraj: event.end,
      }));

    res.json(rezervacije);
  } catch (err) {
    console.error("Greška pri dohvaćanju iCal:", err);
    res.status(500).send("Greška pri dohvaćanju kalendara");
  }
});

// Desktop i mobile rute
app.get("/desktop", async (req, res) => {
  let countryCode = "EN";
  try {
    const response = await axios.get(`http://ip-api.com/json/${req.ip}`);
    if (response.data && response.data.countryCode) {
      countryCode = response.data.countryCode;
    }
  } catch (error) {
    console.warn("Greška pri geolokaciji:", error.message);
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
    console.warn("Greška pri geolokaciji:", error.message);
  }

  let lang = "en";
  if (countryCode === "HR") lang = "hr";
  else if (countryCode === "DE") lang = "de";

  res.redirect(`/${lang}/mobile`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App pokrenuta na portu ${PORT}`);
});
