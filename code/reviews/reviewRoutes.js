const { getCombinedReviews } = require('./reviewsAPI');
const reviewUpvoteManager = require('./reviewUpvoteManager');

// Get reviews for specific apartment
async function getReviews(req, res) {
  try {
    const unitId = req.params.id;

    // Limit to apartments 1 and 2
    if (unitId !== "1" && unitId !== "2") {
      return res.status(404).json({
        error: `Apartment ${unitId} does not exist. Only apartments 1 and 2 are available.`,
      });
    }

    const reviews = await getCombinedReviews(unitId);

    // Add upvote data
    const userId = reviewUpvoteManager.getUserId(req, res);
    const upvoteData = reviewUpvoteManager.getUserUpvoteData(
      userId,
      reviews.reviews,
      unitId
    );

    res.json({
      ...reviews,
      upvoteData,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({
      error: "Error fetching reviews",
    });
  }
}

// Handle upvote/downvote for reviews
function handleUpvote(req, res) {
  try {
    const { unitId, reviewIndex } = req.params;

    // Limit to apartments 1 and 2
    if (unitId !== "1" && unitId !== "2") {
      return res.status(404).json({
        error: `Apartment ${unitId} does not exist. Only apartments 1 and 2 are available.`,
      });
    }

    const userId = reviewUpvoteManager.getUserId(req, res);
    const reviewId = reviewUpvoteManager.getReviewId(unitId, reviewIndex);
    const result = reviewUpvoteManager.toggleUpvote(userId, reviewId);

    res.json({
      success: true,
      reviewId,
      upvoted: result.upvoted,
      count: result.count,
    });
  } catch (error) {
    console.error("Error toggling upvote:", error);
    res.status(500).json({
      error: "Error managing upvote",
    });
  }
}

module.exports = {
  getReviews,
  handleUpvote
};
