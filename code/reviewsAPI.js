const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Mock data for now - later you can integrate real APIs
const mockReviewsData = {
  1: {
    airbnb: {
      rating: 4.8,
      totalReviews: 137,
      reviews: [
        {
          id: 1,
          guestName: "Klaus",
          guestAvatar: "/images/avatars/klaus.jpg",
          date: "5. October, 2024",
          rating: 5,
          comment: "Sehr empfehlenswert, in der Nähe des Busbahnhofes, des Fährhafens, der Altstadt. Voll ausgestattete Wohnung mit Garten!",
          isVerified: true,
          platform: "airbnb"
        },
        {
          id: 2,
          guestName: "Roman",
          guestAvatar: "/images/avatars/roman.jpg",
          date: "16. August, 2024",
          rating: 5,
          comment: "Brigita je super prijateljska i komunikativna. Dala nam je sjajne savjete za naš boravak u Šibeniku. Stan je centralni i ima dobar, besplatan parking...",
          isVerified: true,
          platform: "airbnb"
        },
        {
          id: 3,
          guestName: "Verena",
          guestAvatar: "/images/avatars/verena.jpg",
          date: "23. September, 2024",
          rating: 5,
          comment: "Thank you Brigita! We had a great time and followed some of your recommendations to get around town. We'd like to come back some day...",
          isVerified: true,
          platform: "airbnb"
        },
        {
          id: 4,
          guestName: "Klaus",
          guestAvatar: "/images/avatars/klaus2.jpg",
          date: "4. October, 2024",
          rating: 5,
          comment: "Einfach alles SUPER -empfehlenswert!",
          isVerified: true,
          platform: "airbnb"
        },
        {
          id: 5,
          guestName: "Karl-Heinz",
          guestAvatar: "/images/avatars/karl.jpg",
          date: "26. September, 2024",
          rating: 5,
          comment: "Brigita ist herzlich und hat sehr gute Informationen gegeben, was man alles unternehmen kann. Die Nähe zum Zentrum ist ideal für Ausflüge zu Fuss...",
          isVerified: true,
          platform: "airbnb"
        },
        {
          id: 6,
          guestName: "Rachelle",
          guestAvatar: "/images/avatars/rachelle.jpg",
          date: "30. September, 2024",
          rating: 5,
          comment: "Brigita was wonderful. We arrived late and she explained everything to us with tons of recommendations of sights to see. Because we were late she let us have a...",
          isVerified: true,
          platform: "airbnb"
        }
      ]
    },
    booking: {
      rating: 4.7,
      totalReviews: 89,
      reviews: [
        {
          id: 7,
          guestName: "Miaoxue",
          guestAvatar: "/images/avatars/miaoxue.jpg",
          date: "22. August, 2024",
          rating: 5,
          comment: "Brigita一家人非常友好，她的公寓非常温馨，床非常舒适，有阳台子和马路，给我们介绍了很多好玩的地方，距离市中心很近距离海滨也很近距离海滨步行可达距离...",
          isVerified: true,
          platform: "booking"
        },
        {
          id: 8,
          guestName: "Miriam",
          guestAvatar: "/images/avatars/miriam.jpg",
          date: "20. August, 2024",
          rating: 5,
          comment: "Thank you Brigita! We loved your house and my baby enjoyed the time with the turtles 🐢 We hope to return next year. Thank you for all the recommendations...",
          isVerified: true,
          platform: "booking"
        },
        {
          id: 9,
          guestName: "Hamza",
          guestAvatar: "/images/avatars/hamza.jpg",
          date: "21. September, 2024",
          rating: 5,
          comment: "Nice garden and spacious room, great for our one night stay!",
          isVerified: true,
          platform: "booking"
        },
        {
          id: 10,
          guestName: "Marion",
          guestAvatar: "/images/avatars/marion.jpg",
          date: "23. August, 2024",
          rating: 5,
          comment: "Brigita a été notre coup de cœur de Croatie ! Son accueil, sa gentillesse, sa bienveillance, ses recommandations et l'amour pour sa ville de Šibenik nous ont...",
          isVerified: true,
          platform: "booking"
        }
      ]
    }
  },
  2: {
    airbnb: {
      rating: 4.9,
      totalReviews: 92,
      reviews: [
        {
          id: 11,
          guestName: "Stefan",
          guestAvatar: "/images/avatars/stefan.jpg",
          date: "15. September, 2024",
          rating: 5,
          comment: "Excellent location, very clean and comfortable. Brigita is a wonderful host!",
          isVerified: true,
          platform: "airbnb"
        },
        {
          id: 12,
          guestName: "Maria",
          guestAvatar: "/images/avatars/maria.jpg",
          date: "8. October, 2024",
          rating: 5,
          comment: "Perfect apartment for exploring Šibenik. Everything was just as described.",
          isVerified: true,
          platform: "airbnb"
        }
      ]
    },
    booking: {
      rating: 4.8,
      totalReviews: 56,
      reviews: [
        {
          id: 13,
          guestName: "Thomas",
          guestAvatar: "/images/avatars/thomas.jpg",
          date: "12. September, 2024",
          rating: 5,
          comment: "Great accommodation with excellent service. Highly recommended!",
          isVerified: true,
          platform: "booking"
        }
      ]
    }
  }
};

/**
 * Dohvaća recenzije za određenu smještajnu jedinicu
 * @param {string} unitId - ID smještajne jedinice (1 ili 2)
 * @returns {Object} Objekt s recenzijama za Airbnb i Booking
 */
async function fetchReviews(unitId) {
  try {
    // For now we return mock data
    // Ovdje biste implementirali pozive na prave API-jeve
    const reviews = mockReviewsData[unitId] || {
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
 * Kombinira recenzije s obaju platformi i sortira ih po datumu
 * @param {string} unitId - ID smještajne jedinice
 * @returns {Object} Kombinirane recenzije s ukupnim statistikama
 */
async function getCombinedReviews(unitId) {
  try {
    const reviews = await fetchReviews(unitId);
    
    // Kombiniramo recenzije s obaju platformi
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
    
    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: totalReviews,
      reviews: allReviews.slice(0, 6), // Prikazujemo samo prvih 6 recenzija
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
 * Skraćuje tekst recenzije na određenu duljinu
 * @param {string} text - Tekst recenzije
 * @param {number} maxLength - Maksimalna duljina
 * @returns {string} Skraćeni tekst
 */
function truncateReviewText(text, maxLength = 150) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generira SVG ikone za zvjezdice
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

module.exports = {
  fetchReviews,
  getCombinedReviews,
  truncateReviewText,
  generateStarsHTML
};
