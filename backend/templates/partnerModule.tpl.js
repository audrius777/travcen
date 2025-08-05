// Autogeneruotas modulis {{COMPANY}}
import { PartnerOffer } from '../../models/offerModel.js';
import { currencyConverter } from '../../config/currencyConverter.js';

export default async function() {
  try {
    // 1. Gauti pasiūlymus iš partnerio API
    const response = await fetch('{{URL}}', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer {{API_KEY}}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15s timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    // 2. Transformuoti ir validuoti pasiūlymus
    const processedOffers = await Promise.all(
      data.offers.map(async offer => {
        try {
          // Standartinis objektas pagal offerModel.js schemą
          const standardizedOffer = {
            offerId: offer.id || String(Math.random()).slice(2, 12), // Fallback ID
            partner: '{{COMPANY}}',
            title: offer.title?.trim() || 'Nenurodytas pavadinimas',
            price: parseFloat(offer.price) || 0,
            currency: (offer.currency || 'EUR').toUpperCase(),
            destination: offer.to?.trim() || 'Nenurodyta',
            departure: offer.from?.trim() || 'Nenurodyta',
            type: ['leisure', 'adventure', 'cultural'].includes(offer.type?.toLowerCase()) 
              ? offer.type.toLowerCase() 
              : 'leisure',
            imageUrl: offer.image || null,
            url: offer.bookingUrl || offer.url || 'https://{{URL}}',
            validUntil: offer.validUntil ? new Date(offer.validUntil) : null,
            lastUpdated: new Date()
          };

          // Automatinis konvertavimas (naudojant offerModel.js hook'us)
          const doc = new PartnerOffer(standardizedOffer);
          await doc.validate(); // Validacija prieš grąžinant

          return doc.toObject();
        } catch (validationError) {
          console.warn(`Netinkamas pasiūlymas iš {{COMPANY}}:`, validationError.message);
          return null;
        }
      })
    );

    // 3. Grąžinti tik validžius pasiūlymus
    return processedOffers.filter(offer => offer !== null);

  } catch (err) {
    console.error(`❌ Kritinė klaida {{COMPANY}} modulyje:`, err.message);
    return [];
  }
}
