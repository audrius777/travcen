const path = require('path');
const fs = require('fs');

// Configuration constants
const PARTNERS_DIR = path.join(__dirname, '../partners');
const MAX_CONCURRENT_REQUESTS = 5;

// Sorting configuration
const SORT_OPTIONS = {
  PRICE_ASC: 'price-asc',
  PRICE_DESC: 'price-desc',
  DATE_ASC: 'date-asc',
  DATE_DESC: 'date-desc'
};

// Improved safeFetch with timeout and logging
const safeFetch = async (fn, label) => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 15000)
    );

    const offers = await Promise.race([fn(), timeoutPromise]);
    
    console.log(`✅ Successfully loaded ${offers.length} offers from ${label}`);
    
    // Pridedame pradinį rūšiavimą pagal kainą (nuo didžiausios) jau gavus pasiūlymus
    return offers.sort((a, b) => (b.price_eur || 0) - (a.price_eur || 0));
  } catch (err) {
    console.error(`❌ Error loading partner "${label}":`, err.message);
    return [];
  }
};

// Dynamic partner module loading
const loadPartnerModules = async () => {
  try {
    const files = fs.readdirSync(PARTNERS_DIR);
    return files
      .filter(file => file.endsWith('.js') && !file.startsWith('_'))
      .map(file => ({
        name: path.basename(file, '.js'),
        module: require(path.join(PARTNERS_DIR, file))
      }));
  } catch (err) {
    console.error('❌ Error loading partner modules:', err);
    return [];
  }
};

// Sorting function
const sortOffers = (offers, sortBy) => {
  if (!sortBy) {
    // Default sorting: by price descending if no sort specified
    return offers.sort((a, b) => (b.price_eur || 0) - (a.price_eur || 0));
  }

  switch(sortBy) {
    case SORT_OPTIONS.PRICE_ASC:
      return offers.sort((a, b) => (a.price_eur || 0) - (b.price_eur || 0));
    case SORT_OPTIONS.PRICE_DESC:
      return offers.sort((a, b) => (b.price_eur || 0) - (a.price_eur || 0));
    case SORT_OPTIONS.DATE_ASC:
      return offers.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
    case SORT_OPTIONS.DATE_DESC:
      return offers.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    default:
      // Fallback to default sorting
      return offers.sort((a, b) => (b.price_eur || 0) - (a.price_eur || 0));
  }
};

// Filtering function
const filterOffers = (offers, filters) => {
  if (!filters) return offers;

  return offers.filter(offer => {
    // Filter by departure
    if (filters.departure && 
        !offer.from?.toLowerCase().includes(filters.departure.toLowerCase())) {
      return false;
    }

    // Filter by destination
    if (filters.destination && 
        !offer.to?.toLowerCase().includes(filters.destination.toLowerCase())) {
      return false;
    }

    // Filter by trip type
    if (filters.tripType && offer.type !== filters.tripType) {
      return false;
    }

    return true;
  });
};

// Improved aggregation with concurrency control
module.exports = async function aggregateOffers(options = {}) {
  const { sortBy, filters } = options;
  const partners = await loadPartnerModules();
  
  // Process in batches
  const batches = [];
  for (let i = 0; i < partners.length; i += MAX_CONCURRENT_REQUESTS) {
    batches.push(partners.slice(i, i + MAX_CONCURRENT_REQUESTS));
  }

  let allOffers = [];
  for (const batch of batches) {
    const batchOffers = await Promise.all(
      batch.map(partner => safeFetch(partner.module, partner.name))
    );
    allOffers = [...allOffers, ...batchOffers.flat()];
  }

  // Apply filters
  const filteredOffers = filterOffers(allOffers, filters);

  // Apply sorting - now includes default sorting if no sort specified
  const sortedOffers = sortOffers(filteredOffers, sortBy);

  console.log(`ℹ️ Total ${filteredOffers.length} offers (from ${allOffers.length} raw) after filtering from ${partners.length} partners`);
  
  return {
    offers: sortedOffers,
    meta: {
      total: allOffers.length,
      filtered: filteredOffers.length,
      partners: partners.length,
      sort: sortBy || 'price-desc', // Nurodome numatytąjį rūšiavimą
      filters
    }
  };
};
