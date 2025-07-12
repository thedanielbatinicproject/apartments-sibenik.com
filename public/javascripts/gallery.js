document.addEventListener('DOMContentLoaded', function() {
  const mainImage = document.getElementById('mainImage');
  const prevBtn = document.getElementById('prevImage');
  const nextBtn = document.getElementById('nextImage');
  const thumbnailContainer = document.getElementById('thumbnailContainer');
  const thumbnailItems = document.querySelectorAll('.thumbnail-item');
  
  let currentIndex = 0;
  let images = [];
  let isTransitioning = false;
  
  function initGallery() {
    if (typeof window.galleryImages !== 'undefined') {
      images = window.galleryImages;
    }
  }
  
  function updateMainImage(index, direction = 'next') {
    if (isTransitioning || !images[index]) return;
    
    isTransitioning = true;
    currentIndex = index;
    
    mainImage.style.opacity = '0';
    mainImage.style.transform = `translateX(${direction === 'next' ? '20px' : '-20px'})`;
    
    setTimeout(() => {
      mainImage.src = images[index].fullsize || images[index].thumbnail;
      mainImage.alt = images[index].alt || '';
      
      mainImage.style.transform = `translateX(${direction === 'next' ? '-20px' : '20px'})`;
      
      setTimeout(() => {
        mainImage.style.opacity = '1';
        mainImage.style.transform = 'translateX(0)';
        isTransitioning = false;
      }, 50);
    }, 250);
    
    updateThumbnails();
  }
  
  function updateThumbnails() {
    thumbnailItems.forEach((item, index) => {
      item.classList.remove('active');
      
      if (index === currentIndex) {
        item.classList.add('active');
      }
    });
    
    // Center the active thumbnail
    centerActiveThumbnail();
  }
  
  function centerActiveThumbnail() {
    const container = thumbnailContainer;
    const containerWidth = container.offsetWidth;
    const totalItems = thumbnailItems.length;
    
    // Check if it's standalone gallery
    const isStandalone = document.querySelector('.gallery-standalone') !== null;
    
    // Responsive sizing based on screen width and standalone mode
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    let itemWidth, activeItemWidth;
    
    if (isSmallMobile) {
      if (isStandalone) {
        itemWidth = 48; // 40px + 8px gap
        activeItemWidth = 63; // 55px + 8px gap
      } else {
        itemWidth = 48; // 40px + 8px gap
        activeItemWidth = 63; // 55px + 8px gap
      }
    } else if (isMobile) {
      if (isStandalone) {
        itemWidth = 53; // 45px + 8px gap
        activeItemWidth = 73; // 65px + 8px gap
      } else {
        itemWidth = 53; // 45px + 8px gap
        activeItemWidth = 73; // 65px + 8px gap
      }
    } else {
      itemWidth = 68; // 60px + 8px gap
      activeItemWidth = 98; // 90px + 8px gap
    }
    
    // Calculate positions for rotational layout
    const centerPos = Math.floor(totalItems / 2);
    
    thumbnailItems.forEach((item, originalIndex) => {
      let relativePosition = originalIndex - currentIndex;
      
      // Wrap around for rotational effect
      if (relativePosition > centerPos) {
        relativePosition -= totalItems;
      } else if (relativePosition < -centerPos) {
        relativePosition += totalItems;
      }
      
      // Calculate translateX based on position
      let translateX;
      
      if (relativePosition === 0) {
        // Center item (active)
        translateX = (containerWidth / 2) - (activeItemWidth / 2);
      } else if (relativePosition < 0) {
        // Left side items
        translateX = (containerWidth / 2) - (activeItemWidth / 2) + (relativePosition * itemWidth);
      } else {
        // Right side items
        translateX = (containerWidth / 2) + (activeItemWidth / 2) + ((relativePosition - 1) * itemWidth);
      }
      
      item.style.transform = `translateX(${translateX}px) translateY(-50%)`;
    });
  }
  
  function nextImage() {
    const newIndex = (currentIndex + 1) % images.length;
    updateMainImage(newIndex, 'next');
  }
  
  function prevImage() {
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    updateMainImage(newIndex, 'prev');
  }
  
  prevBtn.addEventListener('click', prevImage);
  nextBtn.addEventListener('click', nextImage);
  
  thumbnailItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      const direction = index > currentIndex ? 'next' : 'prev';
      updateMainImage(index, direction);
    });
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      prevImage();
    } else if (e.key === 'ArrowRight') {
      nextImage();
    }
  });
  
  let touchStartX = 0;
  let touchEndX = 0;
  const minSwipeDistance = window.innerWidth <= 768 ? 30 : 50; // Shorter swipe distance on mobile
  
  mainImage.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  });
  
  mainImage.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  });
  
  // Add touch support for thumbnails on mobile
  if (window.innerWidth <= 768) {
    thumbnailContainer.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });
    
    thumbnailContainer.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const swipeDistance = touchStartX - touchEndX;
      
      if (Math.abs(swipeDistance) > 20) {
        if (swipeDistance > 0) {
          nextImage();
        } else {
          prevImage();
        }
      }
    });
  }
  
  let autoSlideInterval;
  let autoSlideTimeout;
  
  function startAutoSlide() {
    autoSlideInterval = setInterval(nextImage, 5000);
  }
  
  function stopAutoSlide() {
    clearInterval(autoSlideInterval);
  }
  
  function handleSwipe() {
    const swipeDistance = touchStartX - touchEndX;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      stopAutoSlide();

      clearTimeout(autoSlideTimeout);
      autoSlideTimeout = setTimeout(() => {
        startAutoSlide();
      }, 20000);

      if (swipeDistance > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
  }
  
  const gallerySlider = document.querySelector('.gallery-slider');
  gallerySlider.addEventListener('mouseenter', stopAutoSlide);
  gallerySlider.addEventListener('mouseleave', startAutoSlide);
  
  // Handle window resize for responsive behavior
  window.addEventListener('resize', () => {
    updateThumbnails();
  });
  
  initGallery();
  updateThumbnails(); // Initialize thumbnail positions
  startAutoSlide();
});
