document.addEventListener("DOMContentLoaded", () => {
  // Kalbos pasirinkimas - naudojamas bendras translations iš translate.js
  const languageSelector = document.getElementById("language-selector");
  if (languageSelector) {
    languageSelector.addEventListener("change", (event) => {
      const selectedLang = event.target.value;
      window.setLanguage(selectedLang); // Kreipiamės į globalią funkciją
    });

    // Nustatome išsaugotą kalbą
    const savedLang = localStorage.getItem("selectedLanguage") || "lt";
    languageSelector.value = savedLang;
    applyTranslations(savedLang); // Pritaikome vertimus
  }

  // Modal lango valdymas (likusi dalis nepakinta)
  const modal = document.getElementById("partner-modal");
  const partnerLink = document.getElementById("partner-link");
  const closeBtn = document.querySelector(".close");

  if (partnerLink) {
    partnerLink.addEventListener("click", (e) => {
      e.preventDefault();
      modal.style.display = "block";
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // Paieškos funkcija (nepakitusi)
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", filterCards);
  }

  // Prisijungimo mygtukai (nepakitusi)
  document.getElementById("login-google")?.addEventListener("click", () => {
    alert("Google login would be implemented here");
  });

  document.getElementById("login-facebook")?.addEventListener("click", () => {
    alert("Facebook login would be implemented here");
  });
});

// Atnaujinta: naudojamas window.translations iš translate.js
function applyTranslations(lang) {
  if (!window.translations || !window.translations[lang]) return;

  const t = window.translations[lang]; // Globalus vertimų objektas

  // Atnaujinami elementai (sutvarkyta, kad nebūtų dubliavimosi)
  const elements = {
    "site-title": document.getElementById("site-title"),
    "welcome-text": document.getElementById("welcome-text"),
    "departure-placeholder": document.getElementById("departure"),
    "destination-placeholder": document.getElementById("destination"),
    "trip-type-default": document.querySelector("#trip-type option[value='']"),
    "trip-type-leisure": document.querySelector("#trip-type option[value='leisure']"),
    "trip-type-adventure": document.querySelector("#trip-type option[value='adventure']"),
    "trip-type-cultural": document.querySelector("#trip-type option[value='cultural']"),
    "trip-type-last-minute": document.querySelector("#trip-type option[value='last-minute']"),
    "price-sort-default": document.querySelector("#price-sort option[value='']"),
    "price-sort-low": document.querySelector("#price-sort option[value='price-low']"),
    "price-sort-high": document.querySelector("#price-sort option[value='price-high']"),
    "search-btn": document.getElementById("search-btn"),
    "footer-faq": document.getElementById("footer-faq"),
    "footer-privacy": document.getElementById("footer-privacy"),
    "footer-contact": document.getElementById("footer-contact"),
    "footer-partner": document.getElementById("partner-link"),
    "footer-disclaimer": document.getElementById("footer-disclaimer"),
    "modal-title": document.querySelector("#partner-modal h2"),
    "modal-company": document.querySelector("#partner-form input[type='text']"),
    "modal-website": document.querySelector("#partner-form input[type='url']"),
    "modal-email": document.querySelector("#partner-form input[type='email']"),
    "modal-description": document.querySelector("#partner-form textarea"),
    "modal-submit": document.querySelector("#partner-form button[type='submit']")
  };

  for (const [key, element] of Object.entries(elements)) {
    if (element && t[key]) {
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        element.placeholder = t[key];
      } else {
        element.textContent = t[key];
      }
    }
  }
}

// Likusi filterCards() funkcija lieka nepakitusi
function filterCards() {
  // ... (tokia pati kaip ir anksčiau)
}
