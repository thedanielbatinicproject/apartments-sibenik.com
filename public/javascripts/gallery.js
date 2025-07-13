document.addEventListener('DOMContentLoaded', function() {
  console.log('Gallery loading...');
  
  // Basic elements
  const mainImage = document.getElementById('mainImage');
  const mainImageWrapper = document.getElementById('mainImageWrapper');
  const prevBtn = document.getElementById('prevImage');
  const nextBtn = document.getElementById('nextImage');
  const thumbnailContainer = document.getElementById('thumbnailContainer');
  const thumbnailItems = document.querySelectorAll('.thumbnail-item');
  
  // Fullscreen elements - will be set after modal is created
  let fullscreenModal = null;
  let fullscreenImage = null;
  let fullscreenClose = null;
  let fullscreenPrev = null;
  let fullscreenNext = null;
  
  let currentIndex = 0;
  let images = [];
  let isFullscreen = false;
  let isAnimating = false; // Add animation lock
  
  // Wait for fullscreen modal to be created
  function waitForModal() {
    return new Promise((resolve) => {
      const checkModal = () => {
        fullscreenModal = document.getElementById('fullscreenModal');
        if (fullscreenModal) {
          fullscreenImage = document.getElementById('fullscreenImage');
          fullscreenClose = document.getElementById('fullscreenClose');
          fullscreenPrev = document.getElementById('fullscreenPrev');
          fullscreenNext = document.getElementById('fullscreenNext');
          resolve();
        } else {
          setTimeout(checkModal, 100);
        }
      };
      checkModal();
    });
  }
  
  // Check if basic elements exist
  if (!mainImage) {
    console.error('Required elements not found');
    return;
  }
  
  function initGallery() {
    if (typeof window.galleryImages !== 'undefined') {
      images = window.galleryImages;
      console.log('Images loaded:', images.length);
    } else {
      console.error('No gallery images found');
    }
  }
  
  function updateMainImage(index, direction = 'next') {
    if (!images[index] || isAnimating) return;
    
    const oldIndex = currentIndex;
    currentIndex = index;
    isAnimating = true;
    
    // Create new image element to preload
    const newImage = new Image();
    newImage.onload = function() {
      // Only fade out after new image is loaded
      mainImage.style.opacity = '0';
      
      setTimeout(() => {
        // Update main image source
        mainImage.src = newImage.src;
        mainImage.alt = images[index].alt || '';
        
        // Fade in
        mainImage.style.opacity = '1';
        
        // Release animation lock
        setTimeout(() => {
          isAnimating = false;
        }, 150);
      }, 150);
    };
    
    // Start loading new image
    newImage.src = images[index].fullsize || images[index].thumbnail;
    
    // Update fullscreen image with animation if open
    if (isFullscreen && fullscreenImage) {
      updateFullscreenImage(index, direction);
    }
    
    updateThumbnails();
  }
  
  function updateFullscreenImage(index, direction) {
    if (!fullscreenImage) return;
    
    // Create new image element to preload
    const newImage = new Image();
    newImage.onload = function() {
      // Simple fade animation
      fullscreenImage.style.opacity = '0';
      
      setTimeout(() => {
        // Update the image source
        fullscreenImage.src = newImage.src;
        fullscreenImage.alt = images[index].alt || '';
        
        // Fade in
        fullscreenImage.style.opacity = '1';
      }, 150);
    };
    
    // Start loading new image
    newImage.src = images[index].fullsize || images[index].thumbnail;
  }
  
  function updateThumbnails() {
    thumbnailItems.forEach((item, index) => {
      item.classList.remove('active');
      if (index === currentIndex) {
        item.classList.add('active');
      }
    });
    centerActiveThumbnail();
  }
  
  function centerActiveThumbnail() {
    const container = thumbnailContainer;
    if (!container) return;
    
    const containerWidth = container.offsetWidth;
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    // Base sizes
    const normalWidth = isSmallMobile ? 40 : (isMobile ? 45 : 60);
    const normalHeight = isSmallMobile ? 30 : (isMobile ? 34 : 45);
    const activeWidth = isSmallMobile ? 50 : (isMobile ? 60 : 80);
    const activeHeight = isSmallMobile ? 38 : (isMobile ? 45 : 60);
    const spacing = isSmallMobile ? 6 : (isMobile ? 8 : 12);
    
    // Fixed number of items for mobile
    let itemsPerSide;
    if (isSmallMobile) {
      itemsPerSide = 2; // Show 5 total (2 left + 1 center + 2 right)
    } else if (isMobile) {
      itemsPerSide = 2; // Show 5 total (2 left + 1 center + 2 right)
    } else {
      // Desktop - calculate based on available space
      const totalSpace = containerWidth - activeWidth;
      const spacePerSide = totalSpace / 2;
      itemsPerSide = Math.floor(spacePerSide / (normalWidth + spacing));
    }
    
    // Calculate center position
    const centerX = containerWidth / 2;
    
    thumbnailItems.forEach((item, index) => {
      // Calculate relative position based on circular array
      let relativePos = index - currentIndex;
      
      // Normalize position for circular array (wrap around)
      const totalItems = images.length;
      const halfItems = Math.floor(totalItems / 2);
      
      // Adjust for circular positioning
      if (relativePos > halfItems) {
        relativePos = relativePos - totalItems;
      } else if (relativePos < -halfItems) {
        relativePos = relativePos + totalItems;
      }
      
      // Ensure even distribution for any active image
      if (Math.abs(relativePos) > itemsPerSide) {
        if (relativePos > 0) {
          relativePos = relativePos - totalItems;
        } else {
          relativePos = relativePos + totalItems;
        }
      }
      
      const isActive = relativePos === 0;
      const isVisible = Math.abs(relativePos) <= itemsPerSide;
      
      if (isVisible) {
        // Calculate position with proper centering
        let x;
        if (isActive) {
          x = centerX - (activeWidth / 2);
        } else {
          // Calculate base position relative to center
          const baseX = centerX - (normalWidth / 2);
          
          // Apply relative positioning with consistent spacing
          if (relativePos > 0) {
            // Right side thumbnails
            x = baseX + (activeWidth - normalWidth) / 2 + (relativePos * (normalWidth + spacing));
          } else {
            // Left side thumbnails
            x = baseX - (activeWidth - normalWidth) / 2 + (relativePos * (normalWidth + spacing));
          }
        }
        
        // Set styles with smoother transitions for mobile
        item.style.position = 'absolute';
        item.style.left = x + 'px';
        item.style.top = '50%';
        item.style.transform = isActive ? 'translateY(-50%) scale(1.05)' : 'translateY(-50%)';
        item.style.width = (isActive ? activeWidth : normalWidth) + 'px';
        item.style.height = (isActive ? activeHeight : normalHeight) + 'px';
        item.style.opacity = isActive ? '1' : '0.6';
        item.style.zIndex = isActive ? '10' : '1';
        item.style.transition = isMobile ? 'all 0.3s ease' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        item.style.display = 'block';
      } else {
        // Hide items that are too far
        item.style.display = 'none';
      }
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
  
  function openFullscreen() {
    console.log('Opening fullscreen...');
    if (!fullscreenModal || !fullscreenImage) {
      console.error('Fullscreen modal not available');
      return;
    }
    
    isFullscreen = true;
    document.body.classList.add('fullscreen-active');
    fullscreenModal.classList.add('active');
    
    // Set initial image
    fullscreenImage.src = images[currentIndex].fullsize || images[currentIndex].thumbnail;
    fullscreenImage.alt = images[currentIndex].alt || '';
    
    // Start with slide-in-center animation
    fullscreenImage.classList.remove('slide-out-left', 'slide-out-right', 'slide-in-left', 'slide-in-right');
    fullscreenImage.classList.add('slide-in-center');
  }
  
  function closeFullscreen() {
    console.log('Closing fullscreen...');
    if (!fullscreenModal) return;
    
    isFullscreen = false;
    document.body.classList.remove('fullscreen-active');
    fullscreenModal.classList.remove('active');
  }
  
  function setupEventListeners() {
    // Basic navigation
    if (prevBtn) prevBtn.addEventListener('click', prevImage);
    if (nextBtn) nextBtn.addEventListener('click', nextImage);
    
    // Main image click to open fullscreen
    if (mainImageWrapper) {
      mainImageWrapper.addEventListener('click', openFullscreen);
    }
    
    // Fullscreen controls
    if (fullscreenClose) {
      fullscreenClose.addEventListener('click', closeFullscreen);
    }
    
    if (fullscreenPrev) {
      fullscreenPrev.addEventListener('click', prevImage);
    }
    
    if (fullscreenNext) {
      fullscreenNext.addEventListener('click', nextImage);
    }
    
    // Close fullscreen when clicking outside image
    if (fullscreenModal) {
      fullscreenModal.addEventListener('click', function(e) {
        // Close if clicked on modal background or anywhere except the image and navigation
        if (e.target === fullscreenModal || 
            (!e.target.closest('.fullscreen-image') && 
             !e.target.closest('.fullscreen-nav') && 
             !e.target.closest('.fullscreen-close'))) {
          closeFullscreen();
        }
      });
    }
    
    // Thumbnail clicks
    thumbnailItems.forEach((item, index) => {
      item.addEventListener('click', () => {
        // Simplified click animation for mobile
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          item.style.transform = 'translateY(-50%) scale(1.1)';
          setTimeout(() => {
            item.style.transform = 'translateY(-50%)';
          }, 100);
        } else {
          item.style.transform = 'translateY(-50%) scale(1.15)';
          setTimeout(() => {
            item.style.transform = 'translateY(-50%)';
          }, 150);
        }
        
        const direction = index > currentIndex ? 'next' : 'prev';
        updateMainImage(index, direction);
      });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'Escape' && isFullscreen) {
        closeFullscreen();
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (!isFullscreen) {
          e.preventDefault();
          openFullscreen();
        }
      }
    });
    
    // Touch/swipe support
    function addSwipeSupport(element, blockInFullscreen = false) {
      if (!element) return;
      
      let touchStartX = 0;
      let touchEndX = 0;
      
      element.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      });
      
      element.addEventListener('touchend', (e) => {
        // Block swipe navigation in fullscreen mode for main image
        if (blockInFullscreen && isFullscreen) {
          return;
        }
        
        touchEndX = e.changedTouches[0].screenX;
        const swipeDistance = touchStartX - touchEndX;
        
        if (Math.abs(swipeDistance) > 50) {
          if (swipeDistance > 0) {
            nextImage();
          } else {
            prevImage();
          }
        }
      });
    }
    
    // Add swipe support - block for main image in fullscreen, allow for fullscreen image
    addSwipeSupport(mainImage, true);
    addSwipeSupport(fullscreenImage, false);
    
    // Window resize handler
    window.addEventListener('resize', () => {
      updateThumbnails();
    });
  }
  
  // Initialize gallery
  async function init() {
    initGallery();
    await waitForModal();
    setupEventListeners();
    updateThumbnails();
    console.log('Gallery initialized successfully');
  }
  
  init();
});

