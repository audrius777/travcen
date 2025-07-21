// offerProcessor.js
const currencyConverter = require('./currencyConverter');

async function processOffers(offers) {
  const processedOffers = [];
  
  for (const offer of offers) {
    try {
      const currency = offer.original_currency || 
                      currencyConverter.getCurrencyByCountry(offer.country);
      
      const priceEur = await currencyConverter.convertToEur(offer.price, currency);
      
      processedOffers.push({
        ...offer,
        price_eur: parseFloat(priceEur.toFixed(2)),
        original_price: offer.price,
        original_currency: currency
      });
    } catch (error) {
      console.error(`Klaida apdorojant pasiūlymą "${offer.title}":`, error);
      // Galima pridėti originalų pasiūlymą be konversijos
      processedOffers.push({
        ...offer,
        price_eur: null,
        conversion_error: error.message
      });
    }
  }
  
  return processedOffers;
}

module.exports = processOffers;