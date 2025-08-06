const fs = require('fs');
const path = require('path');

const reviewsPath = path.join(__dirname, 'data/private/reviews.json');
const data = JSON.parse(fs.readFileSync(reviewsPath, 'utf8'));

for (const unit of Object.values(data)) {
  for (const platform of Object.values(unit)) {
    if (platform.reviews) {
      platform.reviews.forEach(review => {
        if (!review.hasOwnProperty('upvotes')) {
          review.upvotes = Math.floor(Math.random() * 15);
        }
      });
    }
  }
}

fs.writeFileSync(reviewsPath, JSON.stringify(data, null, 2));
console.log('Added upvotes to all reviews');
