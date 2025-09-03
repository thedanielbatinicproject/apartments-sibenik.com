// Simple test script to force show popup
// Run this in browser console to test popup on mobile

function forceShowLanguagePopup() {
  // Reset cookie first
  document.cookie = 'language_popup_shown=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'preferred_language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Create and show popup
  const popup = new LanguagePopup();
  popup.showPopup();
  
  console.log('Forced popup to show');
}

function checkLanguageCookies() {
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {});
  
  console.log('All cookies:', cookies);
  console.log('Language popup shown:', cookies.language_popup_shown);
  console.log('Preferred language:', cookies.preferred_language);
  
  return cookies;
}

function setPreferredLanguage(lang) {
  document.cookie = `preferred_language=${lang}; path=/; max-age=${365*24*60*60}`;
  console.log(`Set preferred language to: ${lang}`);
}

// Auto-test on mobile
if ('ontouchstart' in window) {
  console.log('Mobile device detected - use forceShowLanguagePopup() to test');
  console.log('Use checkLanguageCookies() to see current cookies');
  console.log('Use setPreferredLanguage("hr") to set preferred language');
}

// Add global functions
window.forceShowLanguagePopup = forceShowLanguagePopup;
window.checkLanguageCookies = checkLanguageCookies;
window.setPreferredLanguage = setPreferredLanguage;
