// index.js

// Dinamiškai įkeliame reCAPTCHA, kad išvengtume CSP klaidų
function loadRecaptcha() {
  // Tikriname, ar reCAPTCHA jau nebuvo užkrauta
  if (window.grecaptcha) {
    console.log('reCAPTCHA jau užkrauta');
    return;
  }
  
  const script = document.createElement('script');
  script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
  script.async = true;
  script.defer = true;
  script.onload = () => {
    console.log('reCAPTCHA užkrauta sėkmingai');
    initializeRecaptcha();
  };
  script.onerror = (error) => {
    console.error('Nepavyko užkrauti reCAPTCHA:', error);
  };
  document.head.appendChild(script);
}

function initializeRecaptcha() {
  // Inicializuojame reCAPTCHA, kai užsikraus
  if (typeof grecaptcha !== 'undefined') {
    console.log('reCAPTCHA inicializuota');
    
    // Galime pridėti reCAPTCHA widget'us, jei reikia
    const recaptchaContainers = document.querySelectorAll('.g-recaptcha');
    recaptchaContainers.forEach((container, index) => {
      if (!container.dataset.initialized) {
        const widgetId = grecaptcha.render(container, {
          sitekey: '6LcbL5wrAAAAACbOLaU5S-dnUMRfJsdeiF6MhmmI',
          callback: function(token) {
            console.log('reCAPTCHA patvirtinta, token:', token);
          },
          'error-callback': function() {
            console.error('reCAPTCHA klaida');
          }
        });
        container.dataset.initialized = true;
        container.dataset.widgetId = widgetId;
      }
    });
  }
}

// Modal functionality
function setupModal(triggerId, modalId) {
  const trigger = document.getElementById(triggerId);
  const modal = document.getElementById(modalId);
  const closeBtn = modal.querySelector('.close');

  if (trigger) {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      modal.style.display = 'block';
      
      // Jei modale yra reCAPTCHA, ją inicializuojame
      setTimeout(() => {
        if (typeof grecaptcha !== 'undefined' && modal.querySelector('.g-recaptcha')) {
          initializeRecaptcha();
        }
      }, 100);
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Užkrauname reCAPTCHA tik jei puslapyje yra reCAPTCHA formų
  const hasRecaptchaForms = document.querySelector('.g-recaptcha') !== null;
  if (hasRecaptchaForms) {
    loadRecaptcha();
  }
  
  const languageSelector = document.getElementById('language-selector');
  if (languageSelector) {
    const savedLang = localStorage.getItem('selectedLanguage') || 'en';
    languageSelector.value = savedLang;
    languageSelector.addEventListener('change', (e) => {
      if (typeof setLanguage === 'function') {
        setLanguage(e.target.value);
      }
    });
  }

  // Set up all modals
  setupModal('footer-about', 'about-modal');
  setupModal('footer-privacy', 'privacy-modal');
  setupModal('footer-partner', 'partner-modal');
  setupModal('footer-faq', 'faq-modal');
});
