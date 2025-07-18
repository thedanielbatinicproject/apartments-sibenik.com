// Reviews Module JavaScript

class ReviewsModule {
  constructor(containerId, unitId) {
    this.container = document.getElementById(containerId);
    this.unitId = unitId;
    this.expandedReviews = new Set();
    this.init();
  }

  async init() {
    this.showLoading();
    try {
      const reviews = await this.fetchReviews();
      this.renderReviews(reviews);
      // Use setTimeout to ensure DOM is fully updated
      setTimeout(() => {
        this.attachEventListeners();
      }, 100);
    } catch (error) {
      console.error('Error initializing reviews module:', error);
      this.showError();
    }
  }

  async fetchReviews() {
    try {
      const response = await fetch(`/api/reviews/${this.unitId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Return mock data for development
      return this.getMockReviews();
    }
  }

  getMockReviews() {
    // Mock data for development
    return {
      averageRating: 4.8,
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
          comment: "Brigita je super prijateljska i komunikativna. Dala nam je sjajne savjete za naš boravak u Šibeniku. Stan je centralni i ima dobar, besplatan parking što je vrlo važno u centru. Sve u svemu odličan boravak!",
          isVerified: true,
          platform: "airbnb"
        },
        {
          id: 3,
          guestName: "Verena",
          guestAvatar: "/images/avatars/verena.jpg",
          date: "23. September, 2024",
          rating: 5,
          comment: "Thank you Brigita! We had a great time and followed some of your recommendations to get around town. We'd like to come back some day. Perfect location and very clean apartment!",
          isVerified: true,
          platform: "airbnb"
        },
        {
          id: 4,
          guestName: "Miaoxue",
          guestAvatar: "/images/avatars/miaoxue.jpg",
          date: "22. August, 2024",
          rating: 5,
          comment: "Brigita一家人非常友好，她的公寓非常温馨，床非常舒适，有阳台子和马路，给我们介绍了很多好玩的地方，距离市中心很近距离海滨也很近距离海滨步行可达距离...",
          isVerified: true,
          platform: "booking"
        },
        {
          id: 5,
          guestName: "Miriam",
          guestAvatar: "/images/avatars/miriam.jpg",
          date: "20. August, 2024",
          rating: 5,
          comment: "Thank you Brigita! We loved your house and my baby enjoyed the time with the turtles 🐢 We hope to return next year. Thank you for all the recommendations and warm hospitality!",
          isVerified: true,
          platform: "booking"
        },
        {
          id: 6,
          guestName: "Hamza",
          guestAvatar: "/images/avatars/hamza.jpg",
          date: "21. September, 2024",
          rating: 5,
          comment: "Nice garden and spacious room, great for our one night stay!",
          isVerified: true,
          platform: "booking"
        }
      ],
      platforms: {
        airbnb: { rating: 4.8, totalReviews: 137 },
        booking: { rating: 4.7, totalReviews: 89 }
      }
    };
  }

  showLoading() {
    this.container.innerHTML = `
      <div class="reviews-loading">
        <div class="loading-spinner"></div>
        <span>Učitavanje recenzija...</span>
      </div>
    `;
  }

  renderReviews(data) {
    const reviewsHTML = `
      <div class="reviews-module">
        <div class="reviews-header">
          <h2 class="reviews-title">Recenzije naših gostiju</h2>
          <div class="reviews-summary">
            <div class="rating-badge">EXCELLENT</div>
            <div class="rating-stars">
              ${this.generateStars(data.averageRating)}
            </div>
            <span class="total-reviews">${data.totalReviews} reviews</span>
          </div>
          <div class="platform-stats">
            <div class="platform-stat">
              <img src="/images/icons/airbnb.png" alt="Airbnb" class="platform-icon">
              <div class="platform-info">
                <div class="platform-name">Airbnb</div>
                <div class="platform-rating">${data.platforms.airbnb.rating} • ${data.platforms.airbnb.totalReviews} reviews</div>
              </div>
            </div>
            <div class="platform-stat">
              <img src="/images/icons/booking.png" alt="Booking.com" class="platform-icon">
              <div class="platform-info">
                <div class="platform-name">Booking.com</div>
                <div class="platform-rating">${data.platforms.booking.rating} • ${data.platforms.booking.totalReviews} reviews</div>
              </div>
            </div>
          </div>
        </div>
        <div class="reviews-grid">
          ${data.reviews.map(review => this.renderReviewCard(review)).join('')}
        </div>
      </div>
    `;

    this.container.innerHTML = reviewsHTML;
  }

  renderReviewCard(review) {
    const shortText = this.truncateText(review.comment, 150);
    const isExpanded = this.expandedReviews.has(review.id);
    const displayText = isExpanded ? review.comment : shortText;
    const needsExpansion = review.comment.length > 150;

    return `
      <div class="review-card" data-review-id="${review.id}">
        <div class="review-header">
          <div class="reviewer-info">
            <img src="${review.guestAvatar || '/images/avatars/default.png'}" 
                 alt="${review.guestName}" 
                 class="reviewer-avatar"
                 onerror="this.src='/images/avatars/default.png'; this.onerror=null;">
            <div class="reviewer-details">
              <div class="reviewer-name">
                ${review.guestName}
                ${review.isVerified ? '<svg class="verified-badge" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' : ''}
              </div>
              <div class="review-date">${review.date}</div>
            </div>
          </div>
          <div class="review-platform">
            <img src="/images/icons/${review.platform}.png" 
                 alt="${review.platform}" 
                 class="platform-logo"
                 onerror="this.style.display='none'">
            <svg class="platform-logo" viewBox="0 0 24 24" style="display: none;">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </div>
        </div>
        <div class="review-rating">
          ${this.generateStars(review.rating)}
        </div>
        <div class="review-text" data-full-text="${encodeURIComponent(review.comment)}">
          ${displayText}
        </div>
        <div class="review-actions">
          ${needsExpansion ? `
            <button class="read-more-btn" data-review-id="${review.id}">
              ${isExpanded ? 'Prikaži manje' : 'Čitaj više'}
            </button>
          ` : '<span></span>'}
          <div class="review-helpful">
            <svg class="helpful-icon" viewBox="0 0 24 24">
              <path d="M7 10l5 5 5-5z"/>
            </svg>
            <span>Korisno</span>
          </div>
        </div>
      </div>
    `;
  }

  generateStars(rating) {
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

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  toggleReview(reviewId) {
    const reviewCard = this.container.querySelector(`[data-review-id="${reviewId}"]`);
    
    if (!reviewCard) {
      return;
    }
    
    const reviewText = reviewCard.querySelector('.review-text');
    const button = reviewCard.querySelector('.read-more-btn');
    const fullText = decodeURIComponent(reviewText.dataset.fullText);
    const shortText = this.truncateText(fullText, 150);
    
    if (this.expandedReviews.has(reviewId)) {
      this.expandedReviews.delete(reviewId);
      reviewText.innerHTML = shortText;
      button.textContent = 'Čitaj više';
      reviewCard.style.height = 'auto';
    } else {
      this.expandedReviews.add(reviewId);
      reviewText.innerHTML = fullText;
      button.textContent = 'Prikaži manje';
    }

    // Smooth scroll animation
    reviewCard.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'nearest' 
    });
  }

  attachEventListeners() {
    // Add event delegation for read more buttons
    this.container.addEventListener('click', (e) => {
      if (e.target.classList.contains('read-more-btn')) {
        const reviewId = parseInt(e.target.dataset.reviewId);
        this.toggleReview(reviewId);
      }
    });

    // Add smooth scroll for platform stats - use event delegation
    this.container.addEventListener('click', (e) => {
      const platformStat = e.target.closest('.platform-stat');
      if (platformStat) {
        const platform = platformStat.querySelector('.platform-name').textContent.toLowerCase();
        this.filterByPlatform(platform);
      }
    });

    // Add intersection observer for animation - wait for DOM to be ready
    setTimeout(() => {
      const reviewCards = this.container.querySelectorAll('.review-card');
      if (reviewCards.length > 0) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            }
          });
        }, {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        });

        reviewCards.forEach(card => {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';
          card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
          observer.observe(card);
        });
      }
    }, 50);
  }

  filterByPlatform(platform) {
    const reviewCards = document.querySelectorAll('.review-card');
    reviewCards.forEach(card => {
      const reviewPlatform = card.querySelector('.platform-logo').alt.toLowerCase();
      if (platform === 'all' || reviewPlatform.includes(platform)) {
        card.style.display = 'block';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      } else {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-20px)';
        setTimeout(() => {
          card.style.display = 'none';
        }, 300);
      }
    });
  }

  showLoading() {
    this.container.innerHTML = `
      <div class="reviews-loading">
        <div class="loading-spinner"></div>
        <span>Učitavanje recenzija...</span>
      </div>
    `;
  }

  showError() {
    this.container.innerHTML = `
      <div class="reviews-module">
        <div class="reviews-header">
          <h2 class="reviews-title">Greška pri učitavanju recenzija</h2>
          <p>Molimo pokušajte kasnije.</p>
        </div>
      </div>
    `;
  }
}

// Initialize reviews module when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Auto-initialize if container exists
  const reviewsContainer = document.getElementById('reviews-module');
  if (reviewsContainer) {
    const unitId = reviewsContainer.dataset.unitId || '1';
    window.reviewsModule = new ReviewsModule('reviews-module', unitId);
  }
});

// Export for manual initialization
window.ReviewsModule = ReviewsModule;
