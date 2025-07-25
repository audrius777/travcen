document.addEventListener("DOMContentLoaded", async () => {
  // 1. Modalų valdymas
  const partnerModal = new ModalManager("partner-modal");
  const partnerLink = document.getElementById("partner-link");
  
  if (partnerLink) {
    partnerLink.addEventListener("click", (e) => {
      e.preventDefault();
      partnerModal.open();
    });
  }

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

  // Pradinis duomenų įkėlimas
  await loadInitialOffers();
});

// 4. Pradinių pasiūlymų įkėlimas
async function loadInitialOffers() {
  try {
    const response = await fetch('/api/offers');
    if (!response.ok) throw new Error('Failed to load offers');
    
    const { offers } = await response.json();
    renderCards(offers);
  } catch (error) {
    console.error('Error loading offers:', error);
    // Rodyti klaidos pranešimą vartotojui
    document.getElementById('card-list').innerHTML = `
      <div class="error-message">
        Failed to load offers. Please try again later.
      </div>
    `;
  }
}

// 5. Atnaujinta paieškos funkcija
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

  // Rikiavimas pagal price_eur
  if (priceSort === "price-low") {
    filteredCards.sort((a, b) => parseFloat(a.dataset.priceEur) - parseFloat(b.dataset.priceEur));
  } else if (priceSort === "price-high") {
    filteredCards.sort((a, b) => parseFloat(b.dataset.priceEur) - parseFloat(a.dataset.priceEur));
  }

  renderFilteredCards(filteredCards);
}

// 6. Kortelių atvaizdavimo funkcijos
function renderCards(offers) {
  const cardList = document.getElementById("card-list");
  cardList.innerHTML = offers.map(offer => createCardHTML(offer)).join('');
}

function renderFilteredCards(cards) {
  const allCards = document.querySelectorAll(".card");
  allCards.forEach(card => card.style.display = "none");
  cards.forEach(card => card.style.display = "block");
}

function createCardHTML(offer) {
  const priceDisplay = offer.price_eur !== null ? 
    `€${offer.price_eur.toFixed(2)}` : 
    `${offer.original_price} ${offer.original_currency}`;
  
  const notice = offer.conversion_notice ? 
    `<div class="conversion-notice">${offer.conversion_notice}</div>` : '';

  return `
    <div class="card" 
         data-departure="${offer.from}" 
         data-destination="${offer.to}"
         data-type="${offer.type}"
         data-price-eur="${offer.price_eur || 0}">
      <img src="${offer.image || 'https://source.unsplash.com/280x180/?travel'}" />
      <h3>${offer.title}</h3>
      <p>Price: ${priceDisplay}</p>
      ${notice}
      <a href="${offer.url}" target="_blank" class="offer-link">View Offer</a>
    </div>
  `;
}
