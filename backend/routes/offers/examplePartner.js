const Joi = require('joi');
const { logPartnerRequest } = require('../utils/logger');

// Pasiūlymo schema validavimui
const offerSchema = Joi.object({
  title: Joi.string().min(10).max(100).required(),
  description: Joi.string().min(20).max(500).optional(),
  from: Joi.string().min(3).max(50).required(),
  to: Joi.string().min(3).max(50).required(),
  type: Joi.string().valid(
    'cultural', 
    'adventure', 
    'beach', 
    'city', 
    'cruise',
    'ski'
  ).required(),
  price: Joi.number().min(0).max(10000).required(),
  currency: Joi.string().valid('EUR', 'USD', 'GBP').default('EUR'),
  url: Joi.string().uri().required(),
  image: Joi.string().uri().required(),
  partner: Joi.string().required(),
  departureDate: Joi.date().iso().greater('now').required(),
  returnDate: Joi.date().iso().greater(Joi.ref('departureDate')).required(),
  rating: Joi.number().min(0).max(5).optional(),
  isPopular: Joi.boolean().default(false)
});

module.exports = async function fetchExampleOffers() {
  const startTime = Date.now();
  const partnerName = 'ExamplePartner';
  
  try {
    // Simuliuojame API užklausos delsimą
    await new Promise(resolve => setTimeout(resolve, 300));

    const mockOffers = [
      {
        title: "Premium Trip to Bali with Luxury Resort",
        description: "14-day luxury vacation in Bali with 5-star accommodation and private tours",
        from: "Vilnius",
        to: "Bali",
        type: "beach",
        price: 1599,
        currency: "EUR",
        url: "https://example.com/trip/bali-premium",
        image: "https://source.unsplash.com/800x600/?bali,luxury",
        partner: partnerName,
        departureDate: "2024-06-15",
        returnDate: "2024-06-29",
        rating: 4.8,
        isPopular: true
      },
      {
        title: "Cultural City Break in Rome",
        description: "5-day guided tour through Rome's most famous historical sites",
        from: "Kaunas",
        to: "Rome",
        type: "cultural",
        price: 399,
        currency: "EUR",
        url: "https://example.com/trip/rome-cultural",
        image: "https://source.unsplash.com/800x600/?rome,history",
        partner: partnerName,
        departureDate: "2024-05-10",
        returnDate: "2024-05-15",
        rating: 4.5
      },
      {
        title: "Adventure Trekking in Norwegian Fjords",
        description: "7-day hiking adventure through breathtaking Norwegian landscapes",
        from: "Riga",
        to: "Bergen",
        type: "adventure",
        price: 899,
        currency: "EUR",
        url: "https://example.com/trip/norway-trekking",
        image: "https://source.unsplash.com/800x600/?norway,fjords",
        partner: partnerName,
        departureDate: "2024-07-20",
        returnDate: "2024-07-27",
        rating: 4.9,
        isPopular: true
      }
    ];

    // Validacija
    const validatedOffers = [];
    for (const offer of mockOffers) {
      const { error, value } = offerSchema.validate(offer, { stripUnknown: true });
      if (error) {
        logPartnerRequest(partnerName, {
          error: `Invalid offer format: ${error.details[0].message}`,
          offer
        });
        continue;
      }
      validatedOffers.push(value);
    }

    logPartnerRequest(partnerName, {
      status: 'success',
      offerCount: validatedOffers.length,
      duration: Date.now() - startTime
    });

    return validatedOffers;
  } catch (err) {
    logPartnerRequest(partnerName, {
      status: 'error',
      error: err.message,
      duration: Date.now() - startTime
    });
    throw err;
  }
};
