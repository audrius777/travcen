// frontend/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // Check cookie consent
  if (!localStorage.getItem('cookieConsent')) {
    document.getElementById('cookie-banner').style.display = 'flex';
  }

  // Cookie consent handler
  document.getElementById('accept-cookies').addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'true');
    document.getElementById('cookie-banner').style.display = 'none';
  });

  // Language selector
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

  // Modal functionality
  const setupModal = (triggerId, modalId) => {
    const trigger = document.getElementById(triggerId);
    const modal = document.getElementById(modalId);
    const closeBtn = modal.querySelector('.close');

    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      });
    }

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.hidden = true;
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }
    });
  };

  // Set up all modals
  setupModal('footer-about', 'about-modal');
  setupModal('footer-privacy', 'privacy-modal');
  setupModal('footer-partner', 'partner-modal');
  setupModal('footer-faq', 'faq-modal');

  // Partner form validation
  const partnerForm = document.getElementById('partner-form');
  if (partnerForm) {
    partnerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('modal-submit');
      const originalText = submitBtn.textContent;
      const feedback = document.getElementById('form-feedback');
      
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="loading"></span> Processing...';
      feedback.style.display = 'none';
      
      try {
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        feedback.textContent = 'Thank you for your submission! We will contact you soon.';
        feedback.style.color = 'green';
        feedback.style.display = 'block';
        partnerForm.reset();
      } catch (error) {
        feedback.textContent = 'An error occurred. Please try again later.';
        feedback.style.color = 'red';
        feedback.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Guest login functionality
  document.getElementById('login-google').addEventListener('click', async function() {
    const button = this;
    const originalText = button.innerHTML;
    
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span> Loading...';
    
    try {
      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (response.ok) {
        window.location.href = '/';
      } else {
        console.error('Guest login failed');
        alert('Guest login failed. Please try again.');
      }
    } catch (error) {
      console.error('Guest login error:', error);
      alert('An error occurred. Please check your connection and try again.');
    } finally {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  });

  // Facebook Login
  document.getElementById('login-facebook').addEventListener('click', function() {
    const button = this;
    const originalText = button.innerHTML;
    
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span> Redirecting...';
    window.location.href = 'https://travcen-backendas.onrender.com/auth/facebook';
  });
});
