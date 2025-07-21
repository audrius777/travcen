import validator from 'validator';

export function validateOffer(offer) {
  if (!offer.id || !validator.isAlphanumeric(offer.id)) {
    throw new Error('Netinkamas pasiūlymo ID');
  }

  if (!offer.price || !validator.isNumeric(String(offer.price))) {
    throw new Error('Netinkama kaina');
  }

  // Papildomi validacijos laukai...

  return {
    offerId: offer.id,
    title: validator.escape(offer.title),
    price: parseFloat(offer.price),
    currency: offer.currency || 'EUR',
    destination: validator.escape(offer.destination),
    departure: validator.escape(offer.departure),
    type: offer.type || 'leisure',
    imageUrl: validator.isURL(offer.imageUrl) ? offer.imageUrl : undefined,
    url: validator.isURL(offer.url) ? offer.url : undefined,
    validUntil: offer.validUntil ? new Date(offer.validUntil) : undefined
  };
}
