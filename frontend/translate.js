// Jei jau buvo apibrėžtas, nedeklaruojame iš naujo
if (typeof translations === "undefined") {
  const translations = {
    // ... (visa esama translations reikšmė čia)
  };

  window.translations = translations;
}

// Pagrindinė funkcija lieka
function setLanguage(lang) {
  const t = window.translations[lang];
  if (!t) return;

  const safeSet = (id, func) => {
    const el = document.getElementById(id);
    if (el) func(el);
  };

  safeSet("site-title", el => el.innerText = t.siteTitle);
  safeSet("welcome-text", el => el.innerText = t.welcomeText);
  safeSet("search-btn", el => el.innerText = t.searchBtn);
  safeSet("departure", el => el.placeholder = t.departure);
  safeSet("destination", el => el.placeholder = t.destination);

  const tripType = document.getElementById("trip-type");
  if (tripType && tripType.options.length >= 5) {
    tripType.options[0].text = t.tripType;
    tripType.options[4].text = t.lastMinute;
  }

  safeSet("login-google", el => el.innerText = t.loginGoogle);
  safeSet("login-facebook", el => el.innerText = t.loginFacebook);
  safeSet("footer-disclaimer", el => el.innerText = t.disclaimer);
  safeSet("footer-faq", el => el.innerText = t.faq);
  safeSet("footer-privacy", el => el.innerText = t.privacy);
  safeSet("footer-contact", el => el.innerText = t.contact);
}
