const axios = require('axios');

async function fetchCalendars(req) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const [calendar1, calendar2] = await Promise.all([
    axios.get(`${baseUrl}/kalendar1`),
    axios.get(`${baseUrl}/kalendar2`)
  ]);
  return { calendar1: calendar1.data, calendar2: calendar2.data };
}

module.exports = { fetchCalendars };