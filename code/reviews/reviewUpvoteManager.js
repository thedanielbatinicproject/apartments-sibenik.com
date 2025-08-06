const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ReviewUpvoteManager {
  constructor() {
    this.upvotesFilePath = path.join(__dirname, '../../data/public_data/upvotes.json');
    this.userUpvotesFilePath = path.join(__dirname, '../../data/user_data/user_upvotes.json');
  }

  // Load upvote data
  loadUpvotes() {
    try {
      const data = fs.readFileSync(this.upvotesFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  // Load user upvote data
  loadUserUpvotes() {
    try {
      const data = fs.readFileSync(this.userUpvotesFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  // Save upvote data
  saveUpvotes(upvotes) {
    fs.writeFileSync(this.upvotesFilePath, JSON.stringify(upvotes, null, 2));
  }

  // Save user upvote data
  saveUserUpvotes(userUpvotes) {
    fs.writeFileSync(this.userUpvotesFilePath, JSON.stringify(userUpvotes, null, 2));
  }

  // Generate or retrieve user UUID from persistent cookie
  getUserId(req, res) {
    // Check if UUID exists in cookie
    let userId = req.cookies.userId;
    
    if (!userId) {
      // Create new UUID and save in persistent cookie
      userId = uuidv4();
      
      // Set cookie that expires in 1 year
      res.cookie('userId', userId, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds
        httpOnly: true, // Prevents access via JavaScript (security)
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax' // CSRF protection
      });
    }
    
    return userId;
  }

  // Generate unique ID for review
  getReviewId(unitId, reviewIndex) {
    return `${unitId}_${reviewIndex}`;
  }

  // Get upvote count for review
  getUpvoteCount(reviewId) {
    const upvotes = this.loadUpvotes();
    return upvotes[reviewId] || 0;
  }

  // Check if user has upvoted review
  hasUserUpvoted(userId, reviewId) {
    const userUpvotes = this.loadUserUpvotes();
    return userUpvotes[userId] && userUpvotes[userId].includes(reviewId);
  }

  // Toggle upvote for review
  toggleUpvote(userId, reviewId) {
    const upvotes = this.loadUpvotes();
    const userUpvotes = this.loadUserUpvotes();

    // Inicijaliziraj podatke ako ne postoje
    if (!upvotes[reviewId]) {
      upvotes[reviewId] = 0;
    }
    if (!userUpvotes[userId]) {
      userUpvotes[userId] = [];
    }

    const hasUpvoted = userUpvotes[userId].includes(reviewId);

    if (hasUpvoted) {
      // Remove upvote
      upvotes[reviewId] = Math.max(0, upvotes[reviewId] - 1);
      userUpvotes[userId] = userUpvotes[userId].filter(id => id !== reviewId);
    } else {
      // Add upvote
      upvotes[reviewId] += 1;
      userUpvotes[userId].push(reviewId);
    }

    this.saveUpvotes(upvotes);
    this.saveUserUpvotes(userUpvotes);

    return {
      upvoted: !hasUpvoted,
      count: upvotes[reviewId]
    };
  }

  // Get all upvote data for user
  getUserUpvoteData(userId, reviews, unitId) {
    const result = {};
    
    reviews.forEach((review) => {
      const reviewId = review.id.toString(); // Use review.id instead of generating from index
      result[reviewId] = {
        count: this.getUpvoteCount(reviewId),
        upvoted: this.hasUserUpvoted(userId, reviewId)
      };
    });

    return result;
  }
}

module.exports = new ReviewUpvoteManager();
