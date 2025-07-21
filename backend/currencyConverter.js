// currencyConverter.js
const axios = require('axios');

// Šalių ir valiutų atitikmenys
const COUNTRY_CURRENCIES = {
  'Lithuania': 'EUR',
  'United Kingdom': 'GBP',
  'United States': 'USD',
  'Japan': 'JPY',
  // pridėkite kitas šalis
};

// Valiutų API endpointas (galite naudoti bet kurį)
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/EUR';

let exchangeRates = {};
let lastUpdated = null;

async function updateExchangeRates() {
  try {
    const response = await axios.get(EXCHANGE_RATE_API);
    exchangeRates = response.data.rates;
    lastUpdated = new Date();
    console.log('Valiutų kursai atnaujinti:', lastUpdated);
  } catch (error) {
    console.error('Nepavyko atnaujinti valiutų kursų:', error);
    throw error;
  }
}

async function convertToEur(amount, currency) {
  // Jei kursai senesni nei 24 valandos, atnaujinti
  if (!lastUpdated || (new Date() - lastUpdated) > 24 * 60 * 60 * 1000) {
    await updateExchangeRates();
  }

  if (currency === 'EUR') return amount;
  if (!exchangeRates[currency]) {
    throw new Error(`Valiuta ${currency} nepalaikoma`);
  }

  return amount / exchangeRates[currency];
}

function getCurrencyByCountry(country) {
  const currency = COUNTRY_CURRENCIES[country];
  if (!currency) {
    throw new Error(`Šalis ${country} nerasta`);
  }
  return currency;
}

module.exports = {
  convertToEur,
  getCurrencyByCountry,
  updateExchangeRates
};