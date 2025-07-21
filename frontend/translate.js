// Globalus vertimų objektas
window.translations = {
  en: {
    siteTitle: "TravCen",
    welcomeText: "All travel offers in one place",
    searchBtn: "Search",
    departure: "Departure location",
    destination: "Destination",
    tripType: "Trip type",
    lastMinute: "Last Minute",
    loginGoogle: "Sign in with Google",
    loginFacebook: "Sign in with Facebook",
    disclaimer: "Note: TravCen is an intermediary platform. We do not take responsibility for the services purchased through partner sites.",
    faq: "FAQ",
    privacy: "Privacy Policy",
    contact: "Contact",
    loginTitle: "Login",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    loginButton: "Login",
    orText: "or"
  },
  lt: {
    siteTitle: "TravCen",
    welcomeText: "Visos kelionių pasiūlymos vienoje vietoje",
    searchBtn: "Ieškoti",
    departure: "Išvykimo vieta",
    destination: "Kelionės tikslas",
    tripType: "Kelionės tipas",
    lastMinute: "Last Minute",
    loginGoogle: "Prisijungti per Google",
    loginFacebook: "Prisijungti per Facebook",
    disclaimer: "Pastaba: TravCen yra tarpininkavimo platforma. Mes neatsakome už paslaugas, įsigytas per partnerių svetaines.",
    faq: "DUK",
    privacy: "Privatumo politika",
    contact: "Kontaktai",
    loginTitle: "Prisijungimas",
    emailPlaceholder: "El. paštas",
    passwordPlaceholder: "Slaptažodis",
    loginButton: "Prisijungti",
    orText: "arba"
  }
};

/**
 * Nustato puslapio kalbą ir atnaujina visus elementus
 * @param {string} lang - Kalbos kodas (pvz., 'en', 'lt')
 */
function setLanguage(lang) {
  // Išsaugome pasirinktą kalbą
  localStorage.setItem('selectedLanguage', lang);
  
  // Gauname vertimus pasirinktai kalbai
  const t = window.translations[lang];
  if (!t) {
    console.error(`Vertimų kalbai '${lang}' nerasta`);
    return;
  }

  /**
   * Saugus elemento atnaujinimas
   * @param {string} id - Elemento ID
   * @param {function} updater - Atnaujinimo funkcija
   */
  const safeUpdate = (id, updater) => {
    const element = document.getElementById(id);
    if (element) updater(element);
  };

  // Bendri elementai
  safeUpdate('site-title', el => el.textContent = t.siteTitle);
  safeUpdate('welcome-text', el => el.textContent = t.welcomeText);
  safeUpdate('search-btn', el => el.textContent = t.searchBtn);
  safeUpdate('departure', el => el.placeholder = t.departure);
  safeUpdate('destination', el => el.placeholder = t.destination);
  safeUpdate('footer-disclaimer', el => el.textContent = t.disclaimer);
  safeUpdate('footer-faq', el => el.textContent = t.faq);
  safeUpdate('footer-privacy', el => el.textContent = t.privacy);
  safeUpdate('footer-contact', el => el.textContent = t.contact);
  safeUpdate('login-google', el => el.textContent = t.loginGoogle);
  safeUpdate('login-facebook', el => el.textContent = t.loginFacebook);
  
  // Prisijungimo puslapio elementai
  safeUpdate('login-title', el => el.textContent = t.loginTitle);
  safeUpdate('email', el => el.placeholder = t.emailPlaceholder);
  safeUpdate('password', el => el.placeholder = t.passwordPlaceholder);
  safeUpdate('login-button', el => el.textContent = t.loginButton);
  safeUpdate('or-text', el => el.textContent = t.orText);

  // Specialūs elementai (select)
  const tripTypeSelect = document.getElementById('trip-type');
  if (tripTypeSelect && tripTypeSelect.options.length >= 5) {
    tripTypeSelect.options[0].text = t.tripType;
    tripTypeSelect.options[4].text = t.lastMinute;
  }

  // Google Analytics eventas
  if (typeof gtag === 'function') {
    gtag('event', 'language_change', {
      'event_category': 'Language',
      'event_label': lang
    });
  }
}

// Puslapio užkrovimo metu nustatome kalbą
document.addEventListener('DOMContentLoaded', () => {
  const savedLang = localStorage.getItem('selectedLanguage') || 'lt';
  const languageSelector = document.getElementById('language-selector');
  
  if (languageSelector) {
    languageSelector.value = savedLang;
    languageSelector.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }
  
  setLanguage(savedLang);
});
