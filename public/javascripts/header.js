document.addEventListener('DOMContentLoaded', function() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
  const mobileMenuClose = document.getElementById('mobileMenuClose');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  // Toggle mobile menu with enhanced animations
  function toggleMobileMenu() {
    const isActive = mobileMenuToggle.classList.contains('active');
    
    if (!isActive) {
      // Opening menu
      mobileMenuToggle.classList.add('active');
      mobileMenuOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      
      // Add ripple effect to hamburger
      createRippleEffect(mobileMenuToggle);
      
      // Reset menu items animation
      resetMenuItemsAnimation();
      
      // Enhanced backdrop blur with mobile fallback
      setTimeout(() => {
        if (CSS.supports('backdrop-filter', 'blur(1px)')) {
          mobileMenuOverlay.style.backdropFilter = 'blur(150px) saturate(220%) brightness(1.2)';
          mobileMenuOverlay.style.webkitBackdropFilter = 'blur(150px) saturate(220%) brightness(1.2)';
          mobileMenuOverlay.style.mozBackdropFilter = 'blur(150px) saturate(220%) brightness(1.2)';
        } else {
          // Mobile fallback
          mobileMenuOverlay.style.background = 'linear-gradient(135deg, rgba(13, 71, 161, 0.98) 0%, rgba(25, 118, 210, 0.95) 50%, rgba(13, 71, 161, 0.98) 100%)';
        }
      }, 50);
      
    } else {
      // Closing menu
      closeMobileMenu();
    }
  }

  // Close mobile menu with animation
  function closeMobileMenu() {
    mobileMenuToggle.classList.remove('active');
    
    // Add closing animation to menu items
    const menuItems = document.querySelectorAll('.mobile-nav-menu li');
    menuItems.forEach((item, index) => {
      setTimeout(() => {
        item.style.animation = 'staggerFadeOut 0.3s ease-in forwards';
      }, index * 50);
    });
    
    // Close overlay after items animation
    setTimeout(() => {
      mobileMenuOverlay.classList.remove('active');
      document.body.style.overflow = '';
      mobileMenuOverlay.style.backdropFilter = 'blur(60px) saturate(180%)';
      mobileMenuOverlay.style.webkitBackdropFilter = 'blur(60px) saturate(180%)';
    }, 200);
  }

  // Create ripple effect
  function createRippleEffect(element) {
    const ripple = document.createElement('span');
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.3)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.left = '50%';
    ripple.style.top = '50%';
    ripple.style.width = '10px';
    ripple.style.height = '10px';
    ripple.style.marginLeft = '-5px';
    ripple.style.marginTop = '-5px';
    
    element.appendChild(ripple);
    
    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // Reset menu items animation
  function resetMenuItemsAnimation() {
    const menuItems = document.querySelectorAll('.mobile-nav-menu li');
    menuItems.forEach((item) => {
      item.style.animation = '';
    });
  }

  // Event listeners
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
  }
  
  if (mobileMenuClose) {
    mobileMenuClose.addEventListener('click', closeMobileMenu);
  }

  // Close menu when clicking on overlay background (not the content)
  if (mobileMenuOverlay) {
    mobileMenuOverlay.addEventListener('click', function(e) {
      if (e.target === mobileMenuOverlay) {
        closeMobileMenu();
      }
    });
  }

  // Close menu when clicking on mobile nav links
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', closeMobileMenu);
  });

  // Close menu on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileMenuOverlay && mobileMenuOverlay.classList.contains('active')) {
      closeMobileMenu();
    }
  });

  // Header scroll effect
  let lastScrollY = window.scrollY;
  const header = document.querySelector('.main-header');

  if (header) {
    window.addEventListener('scroll', function() {
      const currentScrollY = window.scrollY;
      
      // Add scroll effect - adjust header opacity based on scroll
      if (currentScrollY > 50) {
        header.style.background = 'rgba(13, 71, 161, 0.25)';
        header.style.backdropFilter = 'blur(25px)';
      } else {
        header.style.background = 'rgba(13, 71, 161, 0.15)';
        header.style.backdropFilter = 'blur(20px)';
      }
      
      lastScrollY = currentScrollY;
    });
  }
});
