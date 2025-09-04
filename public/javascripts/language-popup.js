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
      console.log('LanguagePopup: Root domain detected, preferred language:', preferredLang);
      
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

    // Check if user is on any language-specific page (not just home pages)
    const pathname = window.location.pathname;
    const languageMatch = pathname.match(/^\/(hr|en|de)/);
    
    if (languageMatch) {
      const currentPageLang = languageMatch[1];
      const preferredLang = this.getPreferredLanguage();
      const popupShown = this.hasPopupBeenShown();
      
      console.log('LanguagePopup: On language page:', currentPageLang);
      console.log('LanguagePopup: Preferred language:', preferredLang);
      console.log('LanguagePopup: Popup shown before:', popupShown);
      
      // If user has existing language preference (returning visitor)
      if (preferredLang) {
        console.log('LanguagePopup: Returning visitor with language preference');
        
        // If they're on a different language page than their preference, update preference
        if (currentPageLang !== preferredLang) {
          console.log('LanguagePopup: User switched language from', preferredLang, 'to', currentPageLang);
          this.setCookie(this.preferredLanguageCookie, currentPageLang, this.cookieExpireDays);
        }
        
        // Don't show popup for returning visitors
        return;
      }
      
      // First-time visitor on language page - show popup only on home pages
      const isHomePage = pathname.match(/^\/(hr|en|de)\/?$/) || 
                         pathname.match(/^\/(hr|en|de)\/desktop\/?$/) ||
                         pathname.match(/^\/(hr|en|de)\/home\/?$/);
      
      if (isHomePage && !popupShown) {
        console.log('LanguagePopup: First-time visitor on home page - showing popup...');
        this.showPopup();
      } else if (!isHomePage) {
        console.log('LanguagePopup: First-time visitor on non-home page, no popup needed...');
      }
      
      return;
    }
    
    // Not on a language page and not root domain
    console.log('LanguagePopup: Not on language page or root domain, no action needed...');
  }  hasPopupBeenShown() {
    const cookieValue = this.getCookie(this.cookieName);
    console.log('Debug hasPopupBeenShown - cookie name:', this.cookieName);
    console.log('Debug hasPopupBeenShown - cookie value:', cookieValue);
    return cookieValue === 'true';
  }

  getPreferredLanguage() {
    const cookieValue = this.getCookie(this.preferredLanguageCookie);
    console.log('Debug getPreferredLanguage - cookie name:', this.preferredLanguageCookie);
    console.log('Debug getPreferredLanguage - cookie value:', cookieValue);
    console.log('Debug getPreferredLanguage - all cookies:', document.cookie);
    return cookieValue;
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
    
    console.log('LanguagePopup: Redirecting from', currentPath, 'to language', langCode);
    
    // Handle root domain special case
    if (currentPath === '/') {
      newPath = `/${langCode}/`;
    } else {
      // Remove current language prefix if exists
      const pathWithoutLang = currentPath.replace(/^\/(hr|en|de)/, '') || '/';
      
      // Add new language prefix
      newPath = `/${langCode}${pathWithoutLang}`;
    }
    
    // Ensure path doesn't end with double slash
    newPath = newPath.replace(/\/+/g, '/');
    
    // Redirect to new language
    console.log('LanguagePopup: Redirecting to:', newPath);
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
      // Dodaj klasu na body za sprečavanje scroll-a na mobilnim
      document.body.classList.add('popup-active');
      
      // Update popup texts based on detected language
      this.updatePopupTexts();
      
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
      
      // Ukloni klasu s body-ja i omogući scroll
      document.body.classList.remove('popup-active');
      document.body.style.overflow = '';
      
      console.log('LanguagePopup: Popup hidden');
      
      // Note: We don't set the popup shown cookie here anymore
      // It's only set when user actually selects a language
    }
  }

  selectLanguage(langCode) {
    // Set preferred language cookie
    this.setPreferredLanguage(langCode);
    
    // Mark popup as shown so it doesn't appear again
    this.setCookie(this.cookieName, 'true', this.cookieExpireDays);
    
    // Hide popup first
    this.hidePopup();
    
    console.log('LanguagePopup: Language selected:', langCode);
    console.log('LanguagePopup: Popup marked as shown, preferred language saved');
    
    // Redirect to selected language
    this.redirectToLanguage(langCode);
  }

  // Function to manually open language selection popup
  openLanguageSelector() {
    console.log('LanguagePopup: Manually opening language selector...');
    
    // Update popup text based on current language
    this.updatePopupTexts();
    
    // Temporarily allow popup to show again
    const overlay = document.getElementById('languagePopupOverlay');
    if (overlay) {
      overlay.classList.add('active');
      
      // Add event handlers
      overlay.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
      overlay.addEventListener('click', this.handleOverlayClick.bind(this));
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      console.log('LanguagePopup: Language selector opened manually');
    } else {
      console.error('LanguagePopup: Overlay element not found for manual opening');
    }
  }

  // Update popup texts based on current language
  updatePopupTexts() {
    const currentLang = this.getCurrentLanguage() || 'en';
    const texts = {
      hr: {
        title: 'Odaberite željeni jezik',
        subtitle: 'Molimo odaberite jedan od dostupnih jezika:',
        close: 'Zatvori ovaj dijalog',
        invoiceText: 'Tražite provjeru računa?',
        invoiceBtn: 'Idi na provjeru računa'
      },
      en: {
        title: 'Select your preferred language',
        subtitle: 'Please choose one of the available languages:',
        close: 'Close this prompt',
        invoiceText: 'Looking for invoice checker?',
        invoiceBtn: 'Go to invoice checker'
      },
      de: {
        title: 'Wählen Sie Ihre bevorzugte Sprache',
        subtitle: 'Bitte wählen Sie eine der verfügbaren Sprachen:',
        close: 'Dialog schließen',
        invoiceText: 'Suchen Sie nach dem Rechnungsprüfer?',
        invoiceBtn: 'Zur Rechnungsprüfung'
      }
    };

    const langTexts = texts[currentLang] || texts.en;
    
    // Safely update elements if they exist
    const titleEl = document.getElementById('popupTitle');
    const subtitleEl = document.getElementById('popupSubtitle');
    const closeBtnEl = document.getElementById('closeBtn');
    const invoiceTextEl = document.getElementById('invoiceText');
    const invoiceBtnEl = document.getElementById('invoiceBtn');
    
    if (titleEl) titleEl.textContent = langTexts.title;
    if (subtitleEl) subtitleEl.textContent = langTexts.subtitle;
    if (closeBtnEl) closeBtnEl.textContent = langTexts.close;
    if (invoiceTextEl) invoiceTextEl.textContent = langTexts.invoiceText;
    if (invoiceBtnEl) invoiceBtnEl.textContent = langTexts.invoiceBtn;
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
    console.log('LanguagePopup: Not a home page, creating instance for language detection only...');
    // Create instance on all pages for language detection and footer button support
    window.languagePopupInstance = new LanguagePopup();
    // But skip the popup logic on non-home pages
  }
});

// Global functions for popup interaction
function closeLanguagePopup() {
  if (window.languagePopupInstance) {
    // Mark popup as shown so it doesn't appear again
    window.languagePopupInstance.setCookie('language_popup_shown', 'true', 365);
    window.languagePopupInstance.hidePopup();
    console.log('LanguagePopup: Popup closed by user, marked as shown');
  } else {
    // Fallback if instance not available
    const popup = new LanguagePopup();
    popup.setCookie('language_popup_shown', 'true', 365);
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

// Function to open language selector manually (for footer button)
function openLanguageSelector() {
  if (window.languagePopupInstance) {
    window.languagePopupInstance.openLanguageSelector();
  } else {
    // Create instance if not available and open selector
    window.languagePopupInstance = new LanguagePopup();
    window.languagePopupInstance.openLanguageSelector();
  }
}

// Debug function to reset popup cookie (for testing)
function resetLanguagePopup() {
  document.cookie = 'language_popup_shown=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'preferred_language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  console.log('LanguagePopup: All cookies reset, reload page to see popup again');
  
  // Also try to clear with different domain variations
  document.cookie = 'language_popup_shown=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
  document.cookie = 'preferred_language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
  
  location.reload();
}

// Debug function to check current cookies
function checkLanguageCookies() {
  const popupShown = document.cookie.split(';').find(row => row.trim().startsWith('language_popup_shown='));
  const preferredLang = document.cookie.split(';').find(row => row.trim().startsWith('preferred_language='));
  
  console.log('Current cookies:');
  console.log('- Popup shown:', popupShown ? popupShown.split('=')[1] : 'not set');
  console.log('- Preferred language:', preferredLang ? preferredLang.split('=')[1] : 'not set');
}

// Force show popup for testing
function forceShowPopup() {
  const overlay = document.getElementById('languagePopupOverlay');
  if (overlay) {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('LanguagePopup: Popup forced to show');
  } else {
    console.error('LanguagePopup: Overlay element not found');
  }
}

// Nuclear option - clear ALL cookies for this domain
function clearAllCookies() {
  const cookies = document.cookie.split(";");
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    
    // Clear with different path/domain combinations
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + window.location.hostname;
  }
  
  console.log('All cookies cleared');
  location.reload();
}

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
