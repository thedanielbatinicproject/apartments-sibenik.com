const axios = require('axios');

/**
 * Internal API client for making authenticated requests to review endpoints
 */
class InternalReviewsAPI {
  constructor(baseURL = 'http://localhost:3000', secretKey = process.env.INTERNAL_API_SECRET || 'your-secret-key-here') {
    this.baseURL = baseURL;
    this.secretKey = secretKey;
    this.headers = {
      'Content-Type': 'application/json',
      'x-api-secret': this.secretKey
    };
  }

  /**
   * Get all reviews data from internal API
   * @returns {Promise<Object>} Reviews data
   */
  async getAllReviews() {
    try {
      const response = await axios.get(`${this.baseURL}/api/internal/reviews`, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching internal reviews:', error.message);
      throw error;
    }
  }

  /**
   * Add new review via internal API
   * @param {string} unitId - Unit ID (1 or 2)
   * @param {string} platform - Platform (airbnb or booking)
   * @param {Object} reviewData - Review data object
   * @returns {Promise<Object>} Response data
   */
  async addReview(unitId, platform, reviewData) {
    try {
      const response = await axios.post(`${this.baseURL}/api/internal/reviews`, {
        unitId,
        platform,
        reviewData
      }, {
        headers: this.headers
      });
      return response.data;
    } catch (error) {
      console.error('Error adding internal review:', error.message);
      throw error;
    }
  }

  /**
   * Get reviews for specific unit (public endpoint, no auth needed)
   * @param {string} unitId - Unit ID (1 or 2)
   * @returns {Promise<Object>} Unit reviews data
   */
  async getUnitReviews(unitId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/reviews/${unitId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching unit reviews:', error.message);
      throw error;
    }
  }
}

module.exports = InternalReviewsAPI;
