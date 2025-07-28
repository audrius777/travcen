// offerProcessor.js
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
        original_currency: currency,
        conversion_notice: `Kaina konvertuota iš ${currency} į EUR pagal šios šalies valiutos kursą. Galutinė kaina gali keistis dėl valiutų svyravimų.`, // Paaiškinimas
        last_updated: new Date().toISOString() // Paskutinio atnaujinimo data
      });
    } catch (error) {
      console.error(`Klaida apdorojant pasiūlymą "${offer.title}":`, error);
      processedOffers.push({
        ...offer,
        price_eur: null,
        conversion_error: error.message,
        conversion_notice: "Šios šalies valiutos konvertavimas nepavyko. Rodykite originalią kainą." // Klaidos pranešimas
      });
    }
  }
  
  return processedOffers;
}
