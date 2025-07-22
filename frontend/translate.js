// Globalus vertimų objektas
window.translations = {
  en: {
    // ... (jūsų esami vertimai)
  },
  lt: {
    // ... (jūsų esami vertimai)
  }
};

/**
 * Nustato puslapio kalbą ir atnaujina visus elementus
 * @param {string|object} lang - Kalbos kodas arba HTML elementas
 */
function setLanguage(lang) {
  // Gauname kalbos reikšmę
  const langValue = typeof lang === 'string' ? lang : lang.value;
  
  // Validuojame kalbą
  if (!window.translations[langValue]) {
    console.error(`Vertimų kalbai '${langValue}' nerasta`);
    return;
  }

  // Išsaugome pasirinktą kalbą
  localStorage.setItem('selectedLanguage', langValue);
  
  // Gauname vertimus pasirinktai kalbai
  const t = window.translations[langValue];

  /**
   * Saugus elemento atnaujinimas
   * @param {string} id - Elemento ID
   * @param {function} updater - Atnaujinimo funkcija
   */
  const safeUpdate = (id, updater) => {
    const element = document.getElementById(id);
    if (element) {
      updater(element);
    } else {
      console.debug(`Elementas su ID '${id}' nerastas`);
    }
  };

  // Atnaujiname visus elementus
  // ... (jūsų esami safeUpdate iškvietimai)

  // Atnaujiname html lang atributą
  document.documentElement.lang = langValue;

  // Google Analytics eventas
  if (typeof gtag === 'function') {
    gtag('event', 'language_change', {
      'event_category': 'Language',
      'event_label': langValue
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
      setLanguage(e.target);
    });
  }
  
  setLanguage(savedLang);
});

// Užtikriname, kad funkcija bus prieinama globaliai
window.setLanguage = (param) => {
  const lang = param?.value || param;
  return setLanguage(lang);
};
