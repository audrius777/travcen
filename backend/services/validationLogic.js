import validator from 'validator';

export function validateOffer(offer) {
  // PAPRASTESNĖ VALIDACIJA - MAŽESNI REIKALAVIMAI
  if (!offer.title || offer.title.length < 3) {
    throw new Error('Pavadinimas per trumpas (minimum 3 simboliai)');
  }

  if (!offer.price || !validator.isNumeric(String(offer.price))) {
    throw new Error('Netinkama kaina');
  }

  if (!offer.url || !validator.isURL(offer.url)) {
    throw new Error('Netinkamas URL');
  }

  // GENERUOJAME offerId JEI JO NĖRA
  const offerId = offer.offerId || generateOfferId(offer);

  return {
    offerId: offerId,
    title: validator.escape(offer.title),
    price: parseFloat(offer.price),
    currency: offer.currency || 'EUR',
    destination: offer.destination ? validator.escape(offer.destination) : 'Kelionė',
    departure: offer.departure ? validator.escape(offer.departure) : 'Vilnius',
    type: offer.type || 'cultural',
    imageUrl: validator.isURL(offer.imageUrl) ? offer.imageUrl : undefined,
    url: validator.isURL(offer.url) ? offer.url : undefined,
    validUntil: offer.validUntil ? new Date(offer.validUntil) : undefined
  };
}

// PAGALBINĖ FUNKCIJA offerId GENERAVIMUI
function generateOfferId(offer) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 5);
  const titlePart = offer.title.substring(0, 3).toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${titlePart}_${timestamp}_${random}`;
}

/**
 * Validuoja partnerio duomenis
 * @param {Object} partnerData - Partnerio duomenys
 * @returns {Object} Validūs partnerio duomenys
 */
export function validatePartner(partnerData) {
  const errors = [];

  if (!partnerData.companyName || partnerData.companyName.trim().length < 2) {
    errors.push('Įmonės pavadinimas per trumpas (minimum 2 simboliai)');
  }

  if (!partnerData.email || !validator.isEmail(partnerData.email)) {
    errors.push('Netinkamas el. pašto adresas');
  }

  if (!partnerData.website || !validator.isURL(partnerData.website)) {
    errors.push('Netinkamas svetainės URL');
  }

  if (!partnerData.contactPerson || partnerData.contactPerson.trim().length < 2) {
    errors.push('Kontaktinio asmens vardas per trumpas');
  }

  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }

  return {
    company: validator.escape(partnerData.companyName.trim()),
    email: validator.normalizeEmail(partnerData.email),
    website: partnerData.website,
    contactPerson: validator.escape(partnerData.contactPerson.trim()),
    description: partnerData.description ? validator.escape(partnerData.description.trim()) : '',
    status: 'pending'
  };
}

/**
 * Validuoja partnerio svetainę
 * @param {string} website - Svetainės URL
 * @returns {boolean} Ar svetainė validi
 */
export function validatePartnerWebsite(website) {
  if (!website || !validator.isURL(website)) {
    return false;
  }

  // Papildomi svetainės patikrinimai
  try {
    const url = new URL(website);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

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
   * Filtruoja pasikartojančius pasiūlymai
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
