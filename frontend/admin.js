// admin.js
document.addEventListener('DOMContentLoaded', () => {
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

  // Partner modal functionality
  const partnerModal = document.getElementById('partner-modal');
  const partnerModalClose = document.getElementById('partner-modal-close');
  const footerPartner = document.getElementById('footer-partner');

  if (footerPartner && partnerModal) {
    footerPartner.addEventListener('click', (e) => {
      e.preventDefault();
      partnerModal.style.display = 'block';
    });
  }

  if (partnerModalClose) {
    partnerModalClose.addEventListener('click', () => {
      partnerModal.style.display = 'none';
    });
  }

  window.addEventListener('click', (e) => {
    if (e.target === partnerModal) {
      partnerModal.style.display = 'none';
    }
  });
});
