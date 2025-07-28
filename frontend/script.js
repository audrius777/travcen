document.addEventListener("DOMContentLoaded", () => {
  // 1. Modalų valdymas
  const modal = document.getElementById("partner-modal");
  const partnerLink = document.getElementById("partner-link");
  const closeBtns = document.querySelectorAll(".close");

  if (partnerLink) {
    partnerLink.addEventListener("click", (e) => {
      e.preventDefault();
      modal.style.display = "block";
    });
  }

  // Close buttons for all modals
  closeBtns.forEach(btn => {
    btn.addEventListener("click", function() {
      this.closest('.modal').style.display = "none";
    });
  });

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = "none";
    }
  });

  // 2. Paieškos funkcija
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", filterCards);
  }

  // 3. Prisijungimo mygtukai
  document.getElementById("login-google")?.addEventListener("click", () => {
    alert("Google login would be implemented here");
  });

  document.getElementById("login-facebook")?.addEventListener("click", () => {
    alert("Facebook login would be implemented here");
  });

  // 4. Partnerių puslapio specifinė logika
  if (document.body.classList.contains('partner-page')) {
    initPartnerPage();
  }

  // 5. About Us modal functionality
  const aboutLink = document.getElementById("footer-about");
  const aboutModal = document.getElementById("about-modal");

  if (aboutLink) {
    aboutLink.addEventListener("click", (e) => {
      e.preventDefault();
      aboutModal.style.display = "block";
    });
  }

  // 6. Privacy Policy modal functionality
  const privacyLink = document.getElementById("footer-privacy");
  const privacyModal = document.getElementById("privacy-modal");

  if (privacyLink) {
    privacyLink.addEventListener("click", (e) => {
      e.preventDefault();
      privacyModal.style.display = "block";
    });
  }
});

// Paieškos funkcija
function filterCards() {
  const departure = document.getElementById("departure").value.toLowerCase();
  const destination = document.getElementById("destination").value.toLowerCase();
  const tripType = document.getElementById("trip-type").value;
  const priceSort = document.getElementById("price-sort").value;

  const cards = Array.from(document.querySelectorAll(".card"));
  
  // Filtravimas
  const filteredCards = cards.filter(card => {
    const cardDeparture = card.dataset.from.toLowerCase();
    const cardDestination = card.dataset.to.toLowerCase();
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

/*  PAPILDOMOS FUNKCIJOS PARTNERIŲ PUSLAPIUI  */
function initPartnerPage() {
  // A) Užkraunam partnerių sąrašą
  loadPartnerList();
  
  // B) Pridedam papildomą filtravimą
  const partnerFilter = document.getElementById('partner-filter');
  if (partnerFilter) {
    partnerFilter.addEventListener('change', applyPartnerFilter);
  }
}

async function loadPartnerList() {
  try {
    const response = await fetch('/api/partners');
    const partners = await response.json();
    const filter = document.getElementById('partner-filter');
    
    if (!filter) return;
    
    // Išvalome ir užpildome filtrą
    filter.innerHTML = '<option value="all">Visi partneriai</option>';
    partners.forEach(partner => {
      const option = document.createElement('option');
      option.value = partner.id;
      option.textContent = partner.name;
      filter.appendChild(option);
    });
  } catch (error) {
    console.error('Nepavyko įkelti partnerių:', error);
  }
}

function applyPartnerFilter() {
  const partnerId = this.value;
  const cards = document.querySelectorAll('.card');
  
  cards.forEach(card => {
    if (partnerId === 'all' || card.dataset.partner === partnerId) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}
