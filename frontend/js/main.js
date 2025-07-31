// frontend/js/main.js

/**
 * Pagrindinis aplikacijos JavaScript failas
 * Atitinka modernius standartus ir saugumo reikalavimus
 */

// Globalūs kintamieji
const APP_CONFIG = {
  apiBaseUrl: 'https://travcen-backendas.onrender.com/api',
  authUrls: {
    guest: '/auth/guest',
    facebook: '/auth/facebook',
    google: '/auth/google'
  },
  cookieConsentKey: 'travcen_cookie_consent',
  languageKey: 'travcen_selected_language'
};

// Dokumento užkrovimo event listener
document.addEventListener('DOMContentLoaded', () => {
  initializeCookieConsent();
  initializeLanguageSelector();
  setupAllModals();
  setupPartnerForm();
  setupAuthButtons();
});

/**
 * Inicializuoja slapukų sutikimo mechanizmą
 */
function initializeCookieConsent() {
  const cookieBanner = document.getElementById('cookie-banner');
  const acceptButton = document.getElementById('accept-cookies');

  if (!cookieBanner || !acceptButton) return;

  // Rodyti bannerį jei nėra sutikimo
  if (!localStorage.getItem(APP_CONFIG.cookieConsentKey)) {
    cookieBanner.style.display = 'flex';
  }

  // Sutikimo mygtuko event listener
  acceptButton.addEventListener('click', () => {
    localStorage.setItem(APP_CONFIG.cookieConsentKey, 'true');
    cookieBanner.style.display = 'none';
    
    // Siųsti įvykį Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'cookie_consent_accepted');
    }
  });
}

/**
 * Inicializuoja kalbos pasirinkimo funkcionalumą
 */
function initializeLanguageSelector() {
  const languageSelector = document.getElementById('language-selector');
  if (!languageSelector) return;

  // Nustatyti išsaugotą kalbą
  const savedLang = localStorage.getItem(APP_CONFIG.languageKey) || 'en';
  languageSelector.value = savedLang;

  // Kalbos pasikeitimo event listener
  languageSelector.addEventListener('change', (e) => {
    const selectedLanguage = e.target.value;
    localStorage.setItem(APP_CONFIG.languageKey, selectedLanguage);
    
    if (typeof setLanguage === 'function') {
      setLanguage(selectedLanguage);
    }
    
    // Google Analytics įrašas
    if (typeof gtag === 'function') {
      gtag('event', 'language_changed', {
        language: selectedLanguage
      });
    }
  });
}

/**
 * Inicializuoja visus modalinius langus
 */
function setupAllModals() {
  setupModal('footer-about', 'about-modal');
  setupModal('footer-privacy', 'privacy-modal');
  setupModal('footer-partner', 'partner-modal');
  setupModal('footer-faq', 'faq-modal');
}

/**
 * Sukuria modalinio lango funkcionalumą
 * @param {string} triggerId - Elemento, kuris atidaro modalą, ID
 * @param {string} modalId - Modalinio lango ID
 */
function setupModal(triggerId, modalId) {
  const trigger = document.getElementById(triggerId);
  const modal = document.getElementById(modalId);

  if (!trigger || !modal) return;

  const closeBtn = modal.querySelector('.close');

  // Atidarymo event listener
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // Google Analytics įrašas
    if (typeof gtag === 'function') {
      gtag('event', 'modal_opened', {
        modal_name: modalId
      });
    }
  });

  // Uždarymo event listener
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeModal(modal);
    });
  }

  // Uždarymas paspaudus už modalinio lango
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
}

/**
 * Uždarą modalinį langą
 * @param {HTMLElement} modal - Modalinis langas
 */
function closeModal(modal) {
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/**
 * Inicializuoja partnerio formos funkcionalumą
 */
function setupPartnerForm() {
  const partnerForm = document.getElementById('partner-form');
  if (!partnerForm) return;

  partnerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = document.getElementById('modal-submit');
    const originalText = submitBtn.textContent;
    const feedback = document.getElementById('form-feedback');
    
    // Formos pateikimo būsena
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Processing...';
    feedback.style.display = 'none';
    
    try {
      const formData = new FormData(partnerForm);
      const formValues = Object.fromEntries(formData.entries());

      // Tikrinti formos duomenis
      if (!validatePartnerForm(formValues)) {
        throw new Error('Please fill all required fields');
      }

      // Siųsti duomenis į API
      const response = await fetch(`${APP_CONFIG.apiBaseUrl}/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Submission failed');
      }

      // Sėkmingas pateikimas
      feedback.textContent = 'Thank you for your submission! We will contact you soon.';
      feedback.style.color = 'green';
      feedback.style.display = 'block';
      partnerForm.reset();
      
      // Google Analytics įrašas
      if (typeof gtag === 'function') {
        gtag('event', 'partner_form_submitted');
      }

      // Automatiškai uždaryti modalą po 3 sekundžių
      setTimeout(() => {
        const modal = partnerForm.closest('.modal');
        if (modal) closeModal(modal);
      }, 3000);

    } catch (error) {
      console.error('Form submission error:', error);
      feedback.textContent = error.message || 'An error occurred. Please try again later.';
      feedback.style.color = 'red';
      feedback.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

/**
 * Validuoja partnerio formos duomenis
 * @param {object} formData - Formos duomenys
 * @returns {boolean} - Ar forma validi
 */
function validatePartnerForm(formData) {
  const requiredFields = ['company', 'email', 'website'];
  return requiredFields.every(field => formData[field] && formData[field].trim() !== '');
}

/**
 * Inicializuoja autentifikacijos mygtukus
 */
function setupAuthButtons() {
  // Svečio prisijungimas
  const guestButton = document.getElementById('login-google');
  if (guestButton) {
    guestButton.addEventListener('click', handleGuestLogin);
  }

  // Facebook prisijungimas
  const facebookButton = document.getElementById('login-facebook');
  if (facebookButton) {
    facebookButton.addEventListener('click', handleFacebookLogin);
  }
}

/**
 * Tvarko svečio prisijungimą
 */
async function handleGuestLogin() {
  const button = this;
  const originalText = button.innerHTML;
  
  button.disabled = true;
  button.innerHTML = '<span class="loading"></span> Loading...';
  
  try {
    const response = await fetch(`${APP_CONFIG.apiBaseUrl}${APP_CONFIG.authUrls.guest}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Login failed');
    }

    const data = await response.json();
    window.location.href = data.redirectUrl || '/';

    // Google Analytics įrašas
    if (typeof gtag === 'function') {
      gtag('event', 'guest_login_success');
    }

  } catch (error) {
    console.error('Guest login error:', error);
    showErrorToast(error.message || 'An error occurred. Please try again.');
  } finally {
    button.disabled = false;
    button.innerHTML = originalText;
  }
}

/**
 * Tvarko Facebook prisijungimą
 */
function handleFacebookLogin() {
  const button = this;
  const originalText = button.innerHTML;
  
  button.disabled = true;
  button.innerHTML = '<span class="loading"></span> Redirecting...';
  
  // Google Analytics įrašas
  if (typeof gtag === 'function') {
    gtag('event', 'facebook_login_initiated');
  }

  window.location.href = `${APP_CONFIG.apiBaseUrl}${APP_CONFIG.authUrls.facebook}`;
}

/**
 * Rodo klaidos pranešimą
 * @param {string} message - Klaidos žinutė
 */
function showErrorToast(message) {
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// Stiliai dinaminiams elementams
const style = document.createElement('style');
style.textContent = `
  .error-toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #ff4444;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slide-in 0.3s ease-out;
  }

  .fade-out {
    animation: fade-out 0.5s ease-out forwards;
  }

  @keyframes slide-in {
    from { bottom: -50px; opacity: 0; }
    to { bottom: 20px; opacity: 1; }
  }

  @keyframes fade-out {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 1s ease-in-out infinite;
    margin-right: 8px;
    vertical-align: middle;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

document.head.appendChild(style);
