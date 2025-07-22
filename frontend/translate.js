// Globalus vertimų objektas
window.translations = {
  en: {
    // ... (jūsų vertimai)
  },
  lt: {
    // ... (jūsų vertimai)
  }
};

function setLanguage(langParam) {
  try {
    // Parametro validacija
    const lang = typeof langParam === 'object' ? langParam.value : langParam;
    if (!lang) throw new Error('Nenurodytas kalbos parametras');

    // Kalbos validacija
    if (!window.translations[lang]) {
      throw new Error(`Vertimų kalbai '${lang}' nerasta`);
    }

    // Išsaugojimas
    localStorage.setItem('selectedLanguage', lang);
    const t = window.translations[lang];

    // Elementų atnaujinimas
    const elementsToUpdate = {
      '#login-title': el => el.textContent = t.loginTitle,
      '#email': el => el.placeholder = t.emailPlaceholder,
      '#password': el => el.placeholder = t.passwordPlaceholder,
      '#login-button': el => el.textContent = t.loginButton,
      '.divider': el => el.textContent = t.orText,
      '.google-login span': el => el.textContent = t.googleLogin
    };

    Object.entries(elementsToUpdate).forEach(([selector, updater]) => {
      document.querySelectorAll(selector).forEach(updater);
    });

    // HTML lang atributas
    document.documentElement.lang = lang;

    // Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'language_change', {
        'event_category': 'Language',
        'event_label': lang
      });
    }
  } catch (error) {
    console.error('Klaida keičiant kalbą:', error);
  }
}

// Inicializacija
document.addEventListener('DOMContentLoaded', () => {
  const browserLang = (navigator.language || 'en').slice(0, 2);
  const savedLang = localStorage.getItem('selectedLanguage') || 
                   (['en', 'lt'].includes(browserLang) ? browserLang : 'lt';

  const selector = document.getElementById('language-selector');
  if (selector) {
    selector.value = savedLang;
    selector.addEventListener('change', (e) => setLanguage(e.target));
  }

  setLanguage(savedLang);
});

// Globalus eksportas
window.setLanguage = function(param) {
  try {
    const lang = param && (param.value || param);
    if (!lang) throw new Error('Nenurodytas kalbos parametras');
    return setLanguage(lang);
  } catch (error) {
    console.error('Klaida vykdant setLanguage:', error);
  }
};
