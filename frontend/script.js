import config from './config.js';
import ModalManager from './modal.js';

// Global state
let currentOffers = [];

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize UI components
    initModals();
    initSearch();
    initAuth();

    // Check authentication and load data
    const authStatus = await checkAuthStatus();
    if (!authStatus.loggedIn) {
      redirectToLogin();
      return;
    }

    // Load initial data
    currentOffers = await loadOffers();
    // Automatiškai surūšiuojam korteles pagal numatytąjį rūšiavimo būdą (kainą didėjimo tvarka)
    currentOffers = sortOffers(currentOffers, 'price-low');
    renderCards(currentOffers);

  } catch (error) {
    console.error('Initialization error:', error);
    showError('Application initialization failed');
  }
});

// Initialization functions
function initModals() {
  const partnerModal = new ModalManager("partner-modal");
  document.getElementById("partner-link")?.addEventListener("click", (e) => {
    e.preventDefault();
    partnerModal.open();
  });
}

function initSearch() {
  document.getElementById("search-btn")?.addEventListener("click", () => {
    filterAndSortCards(currentOffers);
  });
}

function initAuth() {
  document.getElementById("logout-btn")?.addEventListener("click", logout);
}

// API functions
async function checkAuthStatus() {
  try {
    const response = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.USER}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Auth check failed');
    return await response.json();
  } catch (error) {
    console.error('Auth check error:', error);
    throw error;
  }
}

async function loadOffers() {
  try {
    showLoading(true);
    const response = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.OFFERS}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const { offers } = await response.json();
    return offers;
  } catch (error) {
    console.error('Load offers error:', error);
    showError('Failed to load offers');
    return [];
  } finally {
    showLoading(false);
  }
}

async function logout() {
  try {
    const response = await fetch(`${config.API_BASE_URL}${config.API_ENDPOINTS.LOGOUT}`, {
      method: 'POST',
      credentials: 'include'
    });
    if (response.ok) {
      redirectToLogin();
    } else {
      throw new Error('Logout failed');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showError('Logout failed. Please try again.');
  }
}

// Data processing functions
function filterAndSortCards(offers) {
  try {
    const filters = getCurrentFilters();
    const sortedBy = document.getElementById("price-sort").value;
    
    const filtered = filterOffers(offers, filters);
    const sorted = sortOffers(filtered, sortedBy);
    
    renderCards(sorted);
  } catch (error) {
    console.error('Filter/sort error:', error);
    showError('Failed to process offers');
  }
}

function getCurrentFilters() {
  return {
    departure: document.getElementById("departure").value.toLowerCase(),
    destination: document.getElementById("destination").value.toLowerCase(),
    tripType: document.getElementById("trip-type").value
  };
}

function filterOffers(offers, filters) {
  return offers.filter(offer => {
    const matchesDeparture = !filters.departure || 
      offer.from.toLowerCase().includes(filters.departure);
    const matchesDestination = !filters.destination || 
      offer.to.toLowerCase().includes(filters.destination);
    const matchesType = !filters.tripType || 
      offer.type === filters.tripType;
    
    return matchesDeparture && matchesDestination && matchesType;
  });
}

function sortOffers(offers, sortBy) {
  const sorted = [...offers];
  switch(sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => (a.price_eur || 0) - (b.price_eur || 0));
    case 'price-high':
      return sorted.sort((a, b) => (b.price_eur || 0) - (a.price_eur || 0));
    default:
      return sorted;
  }
}

// UI rendering functions
function renderCards(offers) {
  const cardList = document.getElementById("card-list");
  if (!cardList) return;

  if (offers.length === 0) {
    cardList.innerHTML = '<div class="no-results">No offers found</div>';
    return;
  }

  cardList.innerHTML = offers.map(offer => `
    <div class="card" 
         data-departure="${offer.from}" 
         data-destination="${offer.to}"
         data-type="${offer.type}"
         data-price-eur="${offer.price_eur || 0}">
      <img src="${offer.image || config.DEFAULT_IMAGE}" alt="${offer.title}" />
      <h3>${offer.title}</h3>
      <div class="price">
        ${offer.price_eur !== null ? 
          `€${offer.price_eur.toFixed(2)}` : 
          `${offer.original_price} ${offer.original_currency}`}
      </div>
      ${offer.conversion_notice ? 
        `<div class="conversion-notice">${offer.conversion_notice}</div>` : ''}
      <a href="${offer.url}" target="_blank" class="offer-link">View Details</a>
    </div>
  `).join('');
}

// Utility functions
function showLoading(show) {
  const loader = document.getElementById('loading-indicator');
  if (loader) loader.style.display = show ? 'block' : 'none';
}

function showError(message) {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
  }
}

function redirectToLogin() {
  window.location.href = 'login.html';
}
