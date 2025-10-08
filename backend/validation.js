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
