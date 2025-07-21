document.addEventListener("DOMContentLoaded", () => {
  // Kalbų vertimai
  window.translations = {
    "en": {
      "site-title": "TravCen",
      "welcome-text": "All travel offers in one place",
      "departure-placeholder": "Departure location",
      "destination-placeholder": "Destination",
      "trip-type-default": "Trip type",
      "trip-type-leisure": "Leisure",
      "trip-type-adventure": "Adventure",
      "trip-type-cultural": "Cultural",
      "trip-type-last-minute": "Last Minute",
      "price-sort-default": "Sort by price",
      "price-sort-low": "Price: Low to High",
      "price-sort-high": "Price: High to Low",
      "search-btn": "Search",
      "footer-faq": "FAQ",
      "footer-privacy": "Privacy Policy",
      "footer-contact": "Contact",
      "footer-partner": "Become a Partner",
      "footer-disclaimer": "Note: TravCen is an intermediary platform. We do not take responsibility for the services purchased through partner sites.",
      "modal-title": "Partner Registration",
      "modal-company": "Company Name",
      "modal-website": "Website URL",
      "modal-email": "Contact Email",
      "modal-description": "Short Description",
      "modal-submit": "Submit"
    },
    "lt": {
      "site-title": "TravCen",
      "welcome-text": "Visos kelionių pasiūlymos vienoje vietoje",
      "departure-placeholder": "Išvykimo vieta",
      "destination-placeholder": "Kelionės tikslas",
      "trip-type-default": "Kelionės tipas",
      "trip-type-leisure": "Poilsinė",
      "trip-type-adventure": "Prielinksninė",
      "trip-type-cultural": "Pažintinė",
      "trip-type-last-minute": "Last Minute",
      "price-sort-default": "Rikiuoti pagal kainą",
      "price-sort-low": "Kaina: nuo mažiausios",
      "price-sort-high": "Kaina: nuo didžiausios",
      "search-btn": "Ieškoti",
      "footer-faq": "DUK",
      "footer-privacy": "Privatumo politika",
      "footer-contact": "Kontaktai",
      "footer-partner": "Tapkite partneriu",
      "footer-disclaimer": "Pastaba: TravCen yra tarpininkavimo platforma. Mes neatsakome už paslaugas, įsigytas per partnerių svetaines.",
      "modal-title": "Partnerio registracija",
      "modal-company": "Įmonės pavadinimas",
      "modal-website": "Svetainės nuoroda",
      "modal-email": "Kontaktinis el. paštas",
      "modal-description": "Trumpas aprašymas",
      "modal-submit": "Pateikti"
    }
  };

  // Kalbos pasirinkimas
  const languageSelector = document.getElementById("language-selector");
  if (languageSelector) {
    languageSelector.addEventListener("change", (event) => {
      const selectedLang = event.target.value;
      localStorage.setItem("selectedLanguage", selectedLang);
      applyTranslations(selectedLang);
    });

    const savedLang = localStorage.getItem("selectedLanguage") || "lt";
    languageSelector.value = savedLang;
    applyTranslations(savedLang);
  }

  // Modal lango valdymas
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

  // Paieškos funkcija
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", filterCards);
  }

  // Prisijungimo mygtukai
  document.getElementById("login-google")?.addEventListener("click", () => {
    alert("Google login would be implemented here");
    // Čia būtų tikras Google prisijungimo kodas
  });

  document.getElementById("login-facebook")?.addEventListener("click", () => {
    alert("Facebook login would be implemented here");
    // Čia būtų tikras Facebook prisijungimo kodas
  });
});

function applyTranslations(lang) {
  if (!window.translations || !window.translations[lang]) return;

  // Tekstiniai elementai
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
    if (element && window.translations[lang][key]) {
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        element.placeholder = window.translations[lang][key];
      } else {
        element.textContent = window.translations[lang][key];
      }
    }
  }
}

function filterCards() {
  const departure = document.getElementById("departure").value.toLowerCase();
  const destination = document.getElementById("destination").value.toLowerCase();
  const tripType = document.getElementById("trip-type").value;
  const priceSort = document.getElementById("price-sort").value;

  const cards = Array.from(document.querySelectorAll(".card"));
  
  // Filtravimas
  const filteredCards = cards.filter(card => {
    const cardDeparture = card.dataset.departure.toLowerCase();
    const cardDestination = card.dataset.destination.toLowerCase();
    const cardType = card.dataset.type;
    
    const matchesDeparture = !departure || cardDeparture.includes(departure);
    const matchesDestination = !destination || cardDestination.includes(destination);
    const matchesType = !tripType || cardType === tripType;
    
    return matchesDeparture && matchesDestination && matchesType;
  });

  // Rikiavimas
  if (priceSort === "price-low") {
    filteredCards.sort((a, b) => parseInt(a.dataset.price) - parseInt(b.dataset.price));
  } else if (priceSort === "price-high") {
    filteredCards.sort((a, b) => parseInt(b.dataset.price) - parseInt(a.dataset.price));
  }

  // Atvaizdavimas
  cards.forEach(card => {
    card.style.display = "none";
  });

  filteredCards.forEach(card => {
    card.style.display = "block";
  });
}
