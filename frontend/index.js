// index.js

// Dinamiškai įkeliame reCAPTCHA, kad išvengtume CSP klaidų
function loadRecaptcha() {
  const script = document.createElement('script');
  script.src = 'https://www.google.com/recaptcha/api.js?render=6Ld2L5wrAAAAACbOLaU5S-dnUMRfJsdeiF6MhmmI';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
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
  loadRecaptcha();
  
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
