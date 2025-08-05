const { getCombinedReviews } = require('./code/reviews/reviewsAPI');

async function getReviewsData() {
  try {
    console.log('Fetching reviews data...');
    
    const reviews1 = await getCombinedReviews('1');
    console.log('\n=== UNIT 1 REVIEWS ===');
    console.log('Average Rating:', reviews1.averageRating);
    console.log('Total Reviews:', reviews1.totalReviews);
    console.log('Stars:', '★'.repeat(Math.round(reviews1.averageRating)) + '☆'.repeat(5 - Math.round(reviews1.averageRating)));
    
    const reviews2 = await getCombinedReviews('2');
    console.log('\n=== UNIT 2 REVIEWS ===');
    console.log('Average Rating:', reviews2.averageRating);
    console.log('Total Reviews:', reviews2.totalReviews);
    console.log('Stars:', '★'.repeat(Math.round(reviews2.averageRating)) + '☆'.repeat(5 - Math.round(reviews2.averageRating)));
    
    // Kombinirani podatci za sve apartmane
    const totalReviews = reviews1.totalReviews + reviews2.totalReviews;
    const combinedRating = totalReviews > 0 ? 
      ((reviews1.averageRating * reviews1.totalReviews) + (reviews2.averageRating * reviews2.totalReviews)) / totalReviews : 0;
    
    console.log('\n=== COMBINED DATA FOR HOMEPAGE ===');
    console.log('Combined Average Rating:', Math.round(combinedRating * 10) / 10);
    console.log('Combined Total Reviews:', totalReviews);
    console.log('Combined Stars:', '★'.repeat(Math.round(combinedRating)) + '☆'.repeat(5 - Math.round(combinedRating)));
    
  } catch (error) {
    console.error('Error:', error);
  }
}

getReviewsData();
