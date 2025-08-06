const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Path to reviews JSON database
const REVIEWS_DB_PATH = path.join(__dirname, '../../data/private/reviews.json');

/**
 * Reads reviews from JSON database
 * @returns {Object} Reviews data from JSON file
 */
function readReviewsFromDB() {
  try {
    if (!fs.existsSync(REVIEWS_DB_PATH)) {
      console.error('Reviews database file not found:', REVIEWS_DB_PATH);
      return {};
    }
    
    const data = fs.readFileSync(REVIEWS_DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading reviews database:', error);
    return {};
  }
}

/**
 * Writes reviews to JSON database
 * @param {Object} reviewsData - Reviews data to write
 * @returns {boolean} Success status
 */
function writeReviewsToDB(reviewsData) {
  try {
    fs.writeFileSync(REVIEWS_DB_PATH, JSON.stringify(reviewsData, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing reviews database:', error);
    return false;
  }
}

/**
 * Fetch reviews for specific accommodation unit
 * @param {string} unitId - Accommodation unit ID (1 or 2)
 * @returns {Object} Object with reviews for Airbnb and Booking
 */
async function fetchReviews(unitId) {
  try {
    const reviewsData = readReviewsFromDB();
    
    const reviews = reviewsData[unitId] || {
      airbnb: { rating: 0, totalReviews: 0, reviews: [] },
      booking: { rating: 0, totalReviews: 0, reviews: [] }
    };
    
    return reviews;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return {
      airbnb: { rating: 0, totalReviews: 0, reviews: [] },
      booking: { rating: 0, totalReviews: 0, reviews: [] }
    };
  }
}

/**
 * Combines reviews from both platforms and sorts them by date
 * @param {string} unitId - Accommodation unit ID
 * @param {number} limit - Maximum number of reviews to return (optional, returns all if not specified)
 * @returns {Object} Combined reviews with total statistics
 */
async function getCombinedReviews(unitId, limit = null) {
  try {
    const reviews = await fetchReviews(unitId);
    
    // Combine reviews from both platforms
    const allReviews = [
      ...reviews.airbnb.reviews,
      ...reviews.booking.reviews
    ];
    
    // Sortiramo po datumu (najnovije prvo)
    allReviews.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Calculate total rating
    const totalReviews = reviews.airbnb.totalReviews + reviews.booking.totalReviews;
    const averageRating = totalReviews > 0 ? 
      ((reviews.airbnb.rating * reviews.airbnb.totalReviews) + 
       (reviews.booking.rating * reviews.booking.totalReviews)) / totalReviews : 0;
    
    // Apply limit if specified, otherwise return all reviews
    const reviewsToReturn = limit ? allReviews.slice(0, limit) : allReviews;
    
    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: totalReviews,
      reviews: reviewsToReturn,
      allReviews: allReviews, // Dodajemo sve recenzije za potrebe JavaScript-a
      platforms: {
        airbnb: reviews.airbnb,
        booking: reviews.booking
      }
    };
  } catch (error) {
    console.error('Error combining reviews:', error);
    return {
      averageRating: 0,
      totalReviews: 0,
      reviews: [],
      platforms: {
        airbnb: { rating: 0, totalReviews: 0, reviews: [] },
        booking: { rating: 0, totalReviews: 0, reviews: [] }
      }
    };
  }
}

/**
 * Truncates review text to specified length
 * @param {string} text - Review text
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateReviewText(text, maxLength = 150) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generates SVG icons for stars
 * @param {number} rating - Ocjena (1-5)
 * @returns {string} HTML s SVG zvjezdicama
 */
function generateStarsHTML(rating) {
  let starsHTML = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      starsHTML += '<svg class="star star-filled" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    } else {
      starsHTML += '<svg class="star star-empty" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
    }
  }
  return starsHTML;
}

/**
 * Adds a new review to the database
 * @param {string} unitId - Accommodation unit ID
 * @param {string} platform - Platform (airbnb or booking)
 * @param {Object} reviewData - Review data
 * @returns {boolean} Success status
 */
async function addReview(unitId, platform, reviewData) {
  try {
    const reviewsData = readReviewsFromDB();
    
    // Ensure unit exists
    if (!reviewsData[unitId]) {
      reviewsData[unitId] = {
        airbnb: { rating: 0, totalReviews: 0, reviews: [] },
        booking: { rating: 0, totalReviews: 0, reviews: [] }
      };
    }
    
    // Ensure platform exists
    if (!reviewsData[unitId][platform]) {
      reviewsData[unitId][platform] = { rating: 0, totalReviews: 0, reviews: [] };
    }
    
    // Generate new ID - globally unique across all units and platforms
    let maxId = 0;
    for (const unit of Object.values(reviewsData)) {
      for (const platformData of Object.values(unit)) {
        if (platformData.reviews) {
          for (const review of platformData.reviews) {
            if (review.id > maxId) {
              maxId = review.id;
            }
          }
        }
      }
    }
    
    reviewData.id = maxId + 1;
    reviewData.platform = platform;
    
    // Add review
    reviewsData[unitId][platform].reviews.push(reviewData);
    
    // Note: We don't update totalReviews and rating here since it's done in the API endpoint
    
    return writeReviewsToDB(reviewsData);
  } catch (error) {
    console.error('Error adding review:', error);
    return false;
  }
}

module.exports = {
  fetchReviews,
  getCombinedReviews,
  truncateReviewText,
  generateStarsHTML,
  addReview,
  readReviewsFromDB,
  writeReviewsToDB
};
