// Globalus vertimų objektas
window.translations = {
  en: {
    // ... (esami vertimai išliks tokie patys)
  },
  lt: {
    // ... (esami vertimai išliks tokie patys)
  }
};

/**
 * Nustato puslapio kalbą ir atnaujina visus elementus
 * @param {string} lang - Kalbos kodas (pvz., 'en', 'lt')
 */
function setLanguage(lang) {
  // Validuojame kalbą
  if (!window.translations[lang]) {
    console.error(`Vertimų kalbai '${lang}' nerasta`);
    lang = 'lt'; // Default kalba
  }

  // Išsaugome pasirinktą kalbą
  localStorage.setItem('selectedLanguage', lang);
  
  // Gauname vertimus pasirinktai kalbai
  const t = window.translations[lang];

  /**
   * Saugus elemento atnaujinimas su papildoma informacija
   * @param {string} id - Elemento ID
   * @param {function} updater - Atnaujinimo funkcija
   */
  const safeUpdate = (id, updater) => {
    const element = document.getElementById(id);
    if (element) {
      updater(element);
    } else {
      console.debug(`Elementas su ID '${id}' nerastas (kalba: ${lang})`);
    }
  };

  // ... (visi esami safeUpdate iškvietimai išliks tokie patys)

  // Atnaujiname html lang atributą
  document.documentElement.lang = lang;

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
  const browserLang = navigator.language.slice(0, 2);
  const savedLang = localStorage.getItem('selectedLanguage') || 
                   (['en', 'lt'].includes(browserLang) ? browserLang : 'lt');
  
  const languageSelector = document.getElementById('language-selector');
  
  if (languageSelector) {
    languageSelector.value = savedLang;
    languageSelector.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }
  
  setLanguage(savedLang);
});

// Užtikriname, kad funkcija bus prieinama globaliai
window.setLanguage = setLanguage;
