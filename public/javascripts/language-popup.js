// Language Detection Popup
class LanguagePopup {
  constructor() {
    this.cookieName = 'language_popup_shown';
    this.cookieExpireDays = 365; // 1 year
    this.init();
  }

  init() {
    // Check if popup was already shown
    if (!this.hasPopupBeenShown()) {
      this.showPopup();
    }
  }

  hasPopupBeenShown() {
    return this.getCookie(this.cookieName) === 'true';
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
    if (overlay) {
      // Small delay to ensure page is fully loaded
      setTimeout(() => {
        overlay.classList.add('active');
      }, 500);
    }
  }

  hidePopup() {
    const overlay = document.getElementById('languagePopupOverlay');
    if (overlay) {
      overlay.classList.remove('active');
      // Set cookie to remember that popup was shown
      this.setCookie(this.cookieName, 'true', this.cookieExpireDays);
    }
  }

  selectLanguage(langCode) {
    // Hide popup first
    this.hidePopup();
    
    // Redirect to selected language
    const currentPath = window.location.pathname;
    let newPath;
    
    // Remove current language prefix if exists
    const pathWithoutLang = currentPath.replace(/^\/(hr|en|de)/, '') || '/';
    
    // Add new language prefix
    if (langCode === 'hr') {
      newPath = '/hr' + pathWithoutLang;
    } else if (langCode === 'en') {
      newPath = '/en' + pathWithoutLang;
    } else if (langCode === 'de') {
      newPath = '/de' + pathWithoutLang;
    }
    
    // Ensure path doesn't end with double slash
    newPath = newPath.replace(/\/+/g, '/');
    
    // Redirect to new language
    window.location.href = newPath;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on a home page
  const isHomePage = window.location.pathname.match(/^\/(hr|en|de)\/?$/) || 
                     window.location.pathname === '/' ||
                     window.location.pathname.match(/^\/(hr|en|de)\/desktop\/?$/);
  
  if (isHomePage) {
    new LanguagePopup();
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

// Store instance globally for access from HTML
document.addEventListener('DOMContentLoaded', function() {
  const isHomePage = window.location.pathname.match(/^\/(hr|en|de)\/?$/) || 
                     window.location.pathname === '/' ||
                     window.location.pathname.match(/^\/(hr|en|de)\/desktop\/?$/);
  
  if (isHomePage) {
    window.languagePopupInstance = new LanguagePopup();
  }
});
