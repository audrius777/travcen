// Autogeneruotas modulis {{COMPANY}}
import { fetchPartnerOffers } from '../../lib/partnerApi.js';

export default async function() {
  try {
    const response = await fetchPartnerOffers({
      url: '{{URL}}',
      apiKey: {{API_KEY}}
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return data.offers.map(offer => ({
      id: offer.offerId,
      title: offer.title,
      from: offer.departureCity,
      to: offer.destination,
      type: offer.tripType || 'leisure',
      price: offer.price,
      currency: offer.currency || 'EUR',
      url: offer.bookingUrl,
      image: offer.imageUrl || `https://source.unsplash.com/280x180/?${offer.destination}`,
      partner: '{{COMPANY}}',
      validUntil: offer.validUntil
    }));
  } catch (err) {
    console.error(`❌ Klaida gaunant pasiūlymus iš {{COMPANY}}:`, err.message);
    return [];
  }
}
