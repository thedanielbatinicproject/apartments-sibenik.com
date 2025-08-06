const { getCombinedReviews, readReviewsFromDB, addReview } = require('./reviewsAPI');
const reviewUpvoteManager = require('./reviewUpvoteManager');

// Internal API secret key - should match the one in your environment
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET || 'your-secret-key-here';

/**
 * Middleware to verify internal API requests
 */
function verifyInternalAPI(req, res, next) {
  const secretKey = req.headers['x-api-secret'] || req.query.secret;
  
  if (!secretKey || secretKey !== INTERNAL_API_SECRET) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or missing API secret key'
    });
  }
  
  next();
}

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
    const { reviewId } = req.params;

    const userId = reviewUpvoteManager.getUserId(req, res);
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

/**
 * Internal API endpoint to get all reviews data
 * Requires secret key for authentication
 */
async function getInternalReviews(req, res) {
  try {
    const reviewsData = readReviewsFromDB();
    
    res.json({
      success: true,
      data: reviewsData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching internal reviews:', error);
    res.status(500).json({
      error: 'Error fetching reviews data'
    });
  }
}

/**
 * Internal API endpoint to add new review
 * Requires secret key for authentication
 */
async function addInternalReview(req, res) {
  try {
    const { unitId, platform, reviewData } = req.body;
    
    // Validate required fields
    if (!unitId || !platform || !reviewData) {
      return res.status(400).json({
        error: 'Missing required fields: unitId, platform, reviewData'
      });
    }
    
    // Validate platform
    if (platform !== 'airbnb' && platform !== 'booking') {
      return res.status(400).json({
        error: 'Invalid platform. Must be "airbnb" or "booking"'
      });
    }
    
    // Validate unit ID
    if (unitId !== '1' && unitId !== '2') {
      return res.status(400).json({
        error: 'Invalid unitId. Must be "1" or "2"'
      });
    }
    
    const success = await addReview(unitId, platform, reviewData);
    
    if (success) {
      res.json({
        success: true,
        message: 'Review added successfully',
        reviewData
      });
    } else {
      res.status(500).json({
        error: 'Failed to add review'
      });
    }
  } catch (error) {
    console.error('Error adding internal review:', error);
    res.status(500).json({
      error: 'Error adding review'
    });
  }
}

module.exports = {
  getReviews,
  handleUpvote,
  getInternalReviews,
  addInternalReview,
  verifyInternalAPI
};
