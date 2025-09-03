// Language Detection Popup
class LanguagePopup {
  constructor() {
    this.cookieName = 'language_popup_shown';
    this.preferredLanguageCookie = 'preferred_language';
    this.cookieExpireDays = 365; // 1 year
    this.init();
  }

  init() {
    // Debug logging
    console.log('LanguagePopup: Initializing...');
    console.log('Current path:', window.location.pathname);
    
    // Special handling for root domain
    const isRootDomain = window.location.pathname === '/';
    
    if (isRootDomain) {
      // Check if user has preferred language and redirect
      const preferredLang = this.getPreferredLanguage();
      if (preferredLang) {
        console.log('LanguagePopup: Root domain with preferred language, redirecting to:', preferredLang);
        this.redirectToLanguage(preferredLang);
        return;
      } else {
        // No preferred language, show popup
        console.log('LanguagePopup: Root domain, no preferred language, showing popup...');
        this.showPopup();
        return;
      }
    }
    
    // Regular language page handling
    const preferredLang = this.getPreferredLanguage();
    const currentLang = this.getCurrentLanguage();
    
    console.log('Preferred language:', preferredLang);
    console.log('Current language:', currentLang);
    
    // If user has preferred language and it's different from current, redirect
    if (preferredLang && preferredLang !== currentLang) {
      console.log('LanguagePopup: Redirecting to preferred language:', preferredLang);
      this.redirectToLanguage(preferredLang);
      return;
    }
    
    // Check if popup was already shown
    const popupShown = this.hasPopupBeenShown();
    console.log('Popup shown before:', popupShown);
    
    if (!popupShown && !preferredLang) {
      console.log('LanguagePopup: Showing popup...');
      this.showPopup();
    } else {
      console.log('LanguagePopup: Popup already shown or language already selected, skipping...');
    }
  }

  hasPopupBeenShown() {
    return this.getCookie(this.cookieName) === 'true';
  }

  getPreferredLanguage() {
    return this.getCookie(this.preferredLanguageCookie);
  }

  setPreferredLanguage(langCode) {
    this.setCookie(this.preferredLanguageCookie, langCode, this.cookieExpireDays);
  }

  getCurrentLanguage() {
    const path = window.location.pathname;
    if (path.startsWith('/hr')) return 'hr';
    if (path.startsWith('/en')) return 'en';
    if (path.startsWith('/de')) return 'de';
    return null;
  }

  redirectToLanguage(langCode) {
    const currentPath = window.location.pathname;
    let newPath;
    
    // Remove current language prefix if exists
    const pathWithoutLang = currentPath.replace(/^\/(hr|en|de)/, '') || '/';
    
    // Add new language prefix
    newPath = `/${langCode}${pathWithoutLang}`;
    
    // Ensure path doesn't end with double slash
    newPath = newPath.replace(/\/+/g, '/');
    
    // Redirect to new language
    console.log('Redirecting to:', newPath);
    window.location.href = newPath;
  }

  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  setCookie(name, value, days) {
    let expires = "";
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  }

  showPopup() {
    const overlay = document.getElementById('languagePopupOverlay');
    console.log('LanguagePopup: showPopup called, overlay element:', overlay);
    
    if (overlay) {
      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        console.log('LanguagePopup: Adding active class...');
        overlay.classList.add('active');
        
        // Add touch event handling for mobile
        overlay.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        overlay.addEventListener('click', this.handleOverlayClick.bind(this));
        
        // Prevent body scroll when popup is open on mobile
        document.body.style.overflow = 'hidden';
        
        console.log('LanguagePopup: Popup should be visible now');
      }, 500);
    } else {
      console.error('LanguagePopup: Overlay element not found!');
    }
  }

  handleTouchStart(e) {
    // Prevent background scroll on mobile when touching popup
    e.stopPropagation();
  }

  handleOverlayClick(e) {
    // Close popup if clicking outside the popup content
    if (e.target === e.currentTarget) {
      this.hidePopup();
    }
  }

  hidePopup() {
    const overlay = document.getElementById('languagePopupOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      
      // Re-enable body scroll
      document.body.style.overflow = '';
      
      // Set cookie to remember that popup was shown
      this.setCookie(this.cookieName, 'true', this.cookieExpireDays);
    }
  }

  selectLanguage(langCode) {
    // Set preferred language cookie
    this.setPreferredLanguage(langCode);
    
    // Hide popup first
    this.hidePopup();
    
    console.log('LanguagePopup: Language selected:', langCode);
    
    // Redirect to selected language
    this.redirectToLanguage(langCode);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('LanguagePopup: DOM Content Loaded');
  console.log('Current pathname:', window.location.pathname);
  
  // Check if we're on a home page - expanded detection
  const pathname = window.location.pathname;
  const isHomePage = pathname.match(/^\/(hr|en|de)\/?$/) || 
                     pathname === '/' ||
                     pathname.match(/^\/(hr|en|de)\/desktop\/?$/) ||
                     pathname.match(/^\/(hr|en|de)\/home\/?$/);
  
  console.log('Is home page?', isHomePage);
  
  // Special case: if user comes to root domain without language prefix
  const isRootDomain = pathname === '/';
  
  if (isHomePage || isRootDomain) {
    console.log('LanguagePopup: Creating instance...');
    window.languagePopupInstance = new LanguagePopup();
  } else {
    console.log('LanguagePopup: Not a home page, skipping...');
  }
});

// Global functions for popup interaction
function closeLanguagePopup() {
  if (window.languagePopupInstance) {
    window.languagePopupInstance.hidePopup();
  } else {
    // Fallback if instance not available
    const popup = new LanguagePopup();
    popup.hidePopup();
  }
}

function selectLanguage(langCode) {
  if (window.languagePopupInstance) {
    window.languagePopupInstance.selectLanguage(langCode);
  } else {
    // Fallback if instance not available
    const popup = new LanguagePopup();
    popup.selectLanguage(langCode);
  }
}

// Debug function to reset popup cookie (for testing)
function resetLanguagePopup() {
  document.cookie = 'language_popup_shown=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'preferred_language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  console.log('LanguagePopup: All cookies reset, reload page to see popup again');
  location.reload();
}

// Store instance globally for access from HTML
document.addEventListener('DOMContentLoaded', function() {
  const isHomePage = window.location.pathname.match(/^\/(hr|en|de)\/?$/) || 
                     window.location.pathname === '/' ||
                     window.location.pathname.match(/^\/(hr|en|de)\/desktop\/?$/);
  
  if (isHomePage) {
    window.languagePopupInstance = new LanguagePopup();
  }
});

// Fallback initialization if DOMContentLoaded doesn't work
window.addEventListener('load', function() {
  console.log('LanguagePopup: Window load event');
  
  if (!window.languagePopupInstance) {
    console.log('LanguagePopup: No instance found, creating fallback...');
    
    const pathname = window.location.pathname;
    const isHomePage = pathname.match(/^\/(hr|en|de)\/?$/) || 
                       pathname === '/' ||
                       pathname.match(/^\/(hr|en|de)\/desktop\/?$/) ||
                       pathname.match(/^\/(hr|en|de)\/home\/?$/);
    
    if (isHomePage) {
      window.languagePopupInstance = new LanguagePopup();
    }
  }
});

// Mobile-specific initialization
if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
  console.log('LanguagePopup: Touch device detected');
  
  // Additional mobile-specific initialization if needed
  setTimeout(function() {
    if (window.languagePopupInstance && !window.languagePopupInstance.hasPopupBeenShown()) {
      console.log('LanguagePopup: Mobile fallback check...');
      const overlay = document.getElementById('languagePopupOverlay');
      if (overlay && !overlay.classList.contains('active')) {
        console.log('LanguagePopup: Force showing popup on mobile...');
        window.languagePopupInstance.showPopup();
      }
    }
  }, 1000);
}
