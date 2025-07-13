const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ReviewUpvoteManager {
  constructor() {
    this.upvotesFilePath = path.join(__dirname, '../data/public_data/upvotes.json');
    this.userUpvotesFilePath = path.join(__dirname, '../data/user_data/user_upvotes.json');
  }

  // Učitaj upvote podatke
  loadUpvotes() {
    try {
      const data = fs.readFileSync(this.upvotesFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  // Učitaj korisničke upvote podatke
  loadUserUpvotes() {
    try {
      const data = fs.readFileSync(this.userUpvotesFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  // Spremi upvote podatke
  saveUpvotes(upvotes) {
    fs.writeFileSync(this.upvotesFilePath, JSON.stringify(upvotes, null, 2));
  }

  // Spremi korisničke upvote podatke
  saveUserUpvotes(userUpvotes) {
    fs.writeFileSync(this.userUpvotesFilePath, JSON.stringify(userUpvotes, null, 2));
  }

  // Generiraj ili dohvati korisnikov UUID iz trajnog cookie-ja
  getUserId(req, res) {
    // Provjeri postoji li UUID u cookie-ju
    let userId = req.cookies.userId;
    
    if (!userId) {
      // Stvori novi UUID i spremi ga u trajni cookie
      userId = uuidv4();
      
      // Postavi cookie koji vrijedi 1 godinu
      res.cookie('userId', userId, {
        maxAge: 365 * 24 * 60 * 60 * 1000, // 1 godina u milisekundama
        httpOnly: true, // Sprječava pristup putem JavaScript-a (sigurnost)
        secure: false, // Postavi na true u produkciji s HTTPS
        sameSite: 'lax' // CSRF zaštita
      });
    }
    
    return userId;
  }

  // Generiraj jedinstveni ID za review
  getReviewId(unitId, reviewIndex) {
    return `${unitId}_${reviewIndex}`;
  }

  // Dohvati broj upvoteova za review
  getUpvoteCount(reviewId) {
    const upvotes = this.loadUpvotes();
    return upvotes[reviewId] || 0;
  }

  // Provjeri je li korisnik upvoteao review
  hasUserUpvoted(userId, reviewId) {
    const userUpvotes = this.loadUserUpvotes();
    return userUpvotes[userId] && userUpvotes[userId].includes(reviewId);
  }

  // Toggle upvote za review
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
      // Ukloni upvote
      upvotes[reviewId] = Math.max(0, upvotes[reviewId] - 1);
      userUpvotes[userId] = userUpvotes[userId].filter(id => id !== reviewId);
    } else {
      // Dodaj upvote
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

  // Dohvati sve upvote podatke za korisnika
  getUserUpvoteData(userId, reviews, unitId) {
    const result = {};
    
    reviews.forEach((review, index) => {
      const reviewId = this.getReviewId(unitId, index);
      result[reviewId] = {
        count: this.getUpvoteCount(reviewId),
        upvoted: this.hasUserUpvoted(userId, reviewId)
      };
    });

    return result;
  }
}

module.exports = new ReviewUpvoteManager();
