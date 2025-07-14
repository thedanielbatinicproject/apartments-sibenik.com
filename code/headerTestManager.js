const { fetchCalendars } = require('./calendarAPI');
const { getCombinedReviews } = require('./reviewsAPI');
const reviewUpvoteManager = require('./reviewUpvoteManager');

// Handle header test page with all data
async function handleHeaderTest(req, res) {
  try {
    // Fetch real calendar data
    const calendar1 = await fetchCalendars("1");
    const calendar2 = await fetchCalendars("2");

    // Fetch reviews data
    const reviews1 = await getCombinedReviews("1");
    const reviews2 = await getCombinedReviews("2");

    // Add upvote data
    const userId = reviewUpvoteManager.getUserId(req, res);
    const upvoteData1 = reviewUpvoteManager.getUserUpvoteData(
      userId,
      reviews1.reviews,
      "1"
    );
    const upvoteData2 = reviewUpvoteManager.getUserUpvoteData(
      userId,
      reviews2.reviews,
      "2"
    );

    res.render("header-test", {
      calendar1: calendar1 || [],
      calendar2: calendar2 || [],
      reviews1: { ...reviews1, upvoteData: upvoteData1 },
      reviews2: { ...reviews2, upvoteData: upvoteData2 },
    });
  } catch (error) {
    console.error("Error loading calendars for header test:", error);
    res.render("header-test", {
      calendar1: [],
      calendar2: [],
      reviews1: {
        averageRating: 0,
        totalReviews: 0,
        reviews: [],
        platforms: {},
        upvoteData: {},
      },
      reviews2: {
        averageRating: 0,
        totalReviews: 0,
        reviews: [],
        platforms: {},
        upvoteData: {},
      },
    });
  }
}

module.exports = {
  handleHeaderTest
};
