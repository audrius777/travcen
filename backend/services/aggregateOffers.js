const path = require('path');
const fs = require('fs');

// Configuration constants
const PARTNERS_DIR = path.join(__dirname, '../partners');
const MAX_CONCURRENT_REQUESTS = 5; // Limit concurrent partner API calls

// Improved safeFetch with timeout and logging
const safeFetch = async (fn, label) => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 15000)
    );

    const offers = await Promise.race([fn(), timeoutPromise]);
    
    console.log(`✅ Successfully loaded ${offers.length} offers from ${label}`);
    return offers;
  } catch (err) {
    console.error(`❌ Error loading partner "${label}":`, err.message);
    return []; // Return empty array to prevent breaking aggregation
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

// Improved aggregation with concurrency control
module.exports = async function aggregateOffers() {
  const partners = await loadPartnerModules();
  
  // Process in batches to avoid overloading
  const batches = [];
  for (let i = 0; i < partners.length; i += MAX_CONCURRENT_REQUESTS) {
    const batch = partners.slice(i, i + MAX_CONCURRENT_REQUESTS);
    batches.push(batch);
  }

  let allOffers = [];
  for (const batch of batches) {
    const batchOffers = await Promise.all(
      batch.map(partner => 
        safeFetch(partner.module, partner.name)
      )
    );
    allOffers = allOffers.concat(batchOffers.flat());
  }

  console.log(`ℹ️ Total ${allOffers.length} offers aggregated from ${partners.length} partners`);
  return allOffers;
};
