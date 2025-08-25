// login.js
const BACKEND_URL = "https://travcen.onrender.com";

// Nustatome išsaugotą kalbą
document.addEventListener('DOMContentLoaded', function() {
  const savedLang = localStorage.getItem('selectedLanguage') || 'lt';
  document.getElementById('language-selector').value = savedLang;

  // Kalbos keitimas
  document.getElementById('language-selector').addEventListener('change', function(e) {
    const lang = e.target.value;
    localStorage.setItem('selectedLanguage', lang);
    
    if (typeof setLanguage === 'function') {
      setLanguage(lang);
    } else {
      applyTranslations(lang);
    }
  });

  // Google prisijungimo mygtukas
  document.getElementById("google-login-btn").addEventListener("click", redirectToGoogle);

  // Prisijungimo forma
  document.getElementById("login-form").addEventListener("submit", handleLogin);

  // Pradinis vertimas
  if (typeof setLanguage === 'function') {
    setLanguage(savedLang);
  } else {
    applyTranslations(savedLang);
  }
});

function redirectToGoogle() {
  window.location.href = `${BACKEND_URL}/auth/google`;
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password }),
      credentials: "include"
    });

    if (response.ok) {
      window.location.href = "index.html";
    } else {
      const error = await response.json();
      alert(error.message || "Prisijungti nepavyko");
    }
  } catch (err) {
    console.error("Klaida:", err);
    alert("Įvyko klaida bandant prisijungti");
  }
}

// Atsarginė vertimų funkcija (tik jei nenaudojate translate.js)
function applyTranslations(lang) {
  const translations = {
    en: {
      "login-title": "Login",
      "email-placeholder": "Email",
      "password-placeholder": "Password",
      "login-button": "Login",
      "or-text": "or",
      "google-login": "Sign in with Google"
    },
    lt: {
      "login-title": "Prisijungimas",
      "email-placeholder": "El. paštas",
      "password-placeholder": "Slaptažodis",
      "login-button": "Prisijungti",
      "or-text": "arba",
      "google-login": "Prisijungti per Google"
    }
  };

  if (!translations[lang]) return;

  document.getElementById('login-title').textContent = translations[lang]['login-title'];
  document.getElementById('email').placeholder = translations[lang]['email-placeholder'];
  document.getElementById('password').placeholder = translations[lang]['password-placeholder'];
  document.getElementById('login-button').textContent = translations[lang]['login-button'];
  document.querySelector('.divider').textContent = translations[lang]['or-text'];
  document.querySelector('.google-login span').textContent = translations[lang]['google-login'];
}
