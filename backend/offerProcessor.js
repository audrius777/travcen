// offerProcessor.js
const currencyConverter = require('../config/currencyConverter');
const logger = require('../utils/logger');

async function processOffers(offers) {
  // 1. Validuojame įvesties duomenis
  if (!Array.isArray(offers)) {
    logger.error('Neteisingas pasiūlymų formatas - tikimasi masyvo');
    return [];
  }

  const processedOffers = [];
  
  // 2. Apdorojame kiekvieną pasiūlymą
  for (const offer of offers) {
    try {
      // 2.1. Tikriname pagrindinius laukus
      if (!offer || typeof offer !== 'object') {
        logger.warn('Praleidžiamas netinkamas pasiūlymas');
        continue;
      }

      // 2.2. Nustatome valiutą
      const currency = offer.original_currency || 
                      currencyConverter.getCurrencyByCountry(offer.country);
      
      if (!currency) {
        throw new Error('Nepavyko nustatyti valiutos');
      }

      // 2.3. Konvertuojame kainą į EUR
      const priceEur = await currencyConverter.convertToEur(offer.price, currency);
      
      // 2.4. Sukuriame apdorotą pasiūlymą
      processedOffers.push({
        ...offer,
        price_eur: parseFloat(priceEur.toFixed(2)), // Suapvaliname iki 2 skaitmenų po kablelio
        original_price: offer.price,
        original_currency: currency,
        conversion_notice: `Kaina konvertuota iš ${currency} į EUR pagal šios šalies valiutos kursą. Galutinė kaina gali keistis dėl valiutų svyravimų.`,
        last_updated: new Date().toISOString(),
        conversion_success: true
      });

    } catch (error) {
      // 3. Klaidų apdorojimas
      logger.error(`Klaida apdorojant pasiūlymą "${offer.title || 'be pavadinimo'}": ${error.message}`);
      
      processedOffers.push({
        ...offer,
        price_eur: null,
        conversion_error: error.message,
        conversion_notice: "Šios šalies valiutos konvertavimas nepavyko. Rodykite originalią kainą.",
        conversion_success: false,
        last_updated: new Date().toISOString()
      });
    }
  }
  
  logger.info(`Sėkmingai apdorota ${processedOffers.length} pasiūlymų`);
  return processedOffers;
}

module.exports = processOffers;
