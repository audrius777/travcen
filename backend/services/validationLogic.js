import { validateOffer } from '../validation.js';

/**
 * Serviso lygio validacijos logika
 */
export const validationLogic = {
  /**
   * Validuoja scrapinimo rezultatus
   * @param {Array} offers - Scrapinti pasiūlymai
   * @returns {Array} Validūs pasiūlymai
   */
  validateScrapedOffers(offers) {
    if (!Array.isArray(offers)) {
      console.warn('⚠️ Gautas ne masyvas scrapinimo rezultatų');
      return [];
    }

    const validOffers = [];
    const invalidOffers = [];

    offers.forEach((offer, index) => {
      try {
        // PAPRASTESNĖ VALIDACIJA - MAŽESNI REIKALAVIMAI
        if (!offer.title || offer.title.length < 3) {
          throw new Error('Pavadinimas per trumpas');
        }

        if (!offer.url || !offer.url.startsWith('http')) {
          throw new Error('Netinkamas URL');
        }

        // Jei nėra kainos, nustatome 0
        const price = offer.price || 0;

        // Sukuriame validų pasiūlymą
        const validOffer = {
          title: offer.title.substring(0, 100),
          price: price,
          url: offer.url,
          image: offer.image || offer.imageUrl || '',
          partner: offer.partner || offer.source || 'unknown',
          from: offer.from || 'Vilnius',
          to: offer.to || 'Kelionė',
          type: offer.type || 'cultural'
        };

        validOffers.push(validOffer);

      } catch (error) {
        invalidOffers.push({
          index,
          offer,
          error: error.message
        });
      }
    });

    if (invalidOffers.length > 0) {
      console.warn(`❌ ${invalidOffers.length} netinkami pasiūlymai:`, invalidOffers);
    }

    console.log(`✅ Validūs pasiūlymai: ${validOffers.length} iš ${offers.length}`);
    return validOffers;
  },

  /**
   * Paruošia pasiūlymus duomenų bazei
   * @param {Array} offers - Validūs pasiūlymai
   * @returns {Array} Paruošti pasiūlymai
   */
  prepareForDatabase(offers) {
    return offers.map(offer => {
      // GENERUOJAME offerId JEI JO NĖRA
      const offerId = offer.offerId || this.generateOfferId(offer);
      
      return {
        offerId: offerId,
        title: offer.title,
        price: offer.price,
        currency: offer.currency || 'EUR',
        destination: offer.to || offer.destination || 'Kelionė',
        departure: offer.from || offer.departure || 'Vilnius',
        type: offer.type || 'cultural',
        imageUrl: offer.image || offer.imageUrl || '',
        url: offer.url,
        partner: offer.partner || offer.source || 'unknown',
        lastUpdated: new Date()
      };
    });
  },

  /**
   * Sugeneruoja unikalų offerId
   * @param {Object} offer - Pasiūlymas
   * @returns {string} Unikalus ID
   */
  generateOfferId(offer) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    const titlePart = offer.title
      .substring(0, 3)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    return `${titlePart}_${timestamp}_${random}`;
  },

  /**
   * Filtruoja pasikartojančius pasiūlymus
   * @param {Array} offers - Pasiūlymai
   * @returns {Array} Unikalūs pasiūlymai
   */
  removeDuplicates(offers) {
    const seen = new Set();
    return offers.filter(offer => {
      const key = `${offer.title}_${offer.price}_${offer.url}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
};
