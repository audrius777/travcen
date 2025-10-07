const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');

// Konfigūracija (PAŠALINTAS REDIS - sukeldavo klaidų)
const CONFIG = {
  PARTNERS_DIR: path.join(__dirname, '../partners'),
  MAX_CONCURRENT_REQUESTS: 3,
  REQUEST_TIMEOUT: 10000,
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minučių
    max: 100 // 100 užklausų per langą
  }
};

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: CONFIG.RATE_LIMIT.windowMs,
  max: CONFIG.RATE_LIMIT.max,
  message: 'Per daug užklausų, bandykite vėliau'
});

// Pasiūlymo schema validavimui
const offerSchema = Joi.object({
  title: Joi.string().required(),
  from: Joi.string().required(),
  to: Joi.string().required(),
  type: Joi.string().valid('cultural', 'adventure', 'beach', 'city').required(),
  price: Joi.number().min(0).required(),
  url: Joi.string().uri().required(),
  image: Joi.string().uri().required(),
  partner: Joi.string().required(),
  date: Joi.date().iso().greater('now').optional()
});

// Papildoma funkcija loggeriui (kad nekiltų klaidų)
const logOfferEvent = (event, data = {}) => {
  console.log(`📊 Offer Event: ${event}`, data);
};

const monitorPerformance = (partnerName, duration, offersCount) => {
  console.log(`⏱️ ${partnerName}: ${duration}ms, ${offersCount} offers`);
};

// Saugus partnerio modulio įkėlimas su metrikomis
const loadPartnerOffers = async (file) => {
  const startTime = Date.now();
  const partnerName = path.basename(file, '.js');
  
  try {
    // Tikriname ar failas egzistuoja
    const filePath = path.join(CONFIG.PARTNERS_DIR, file);
    await fs.access(filePath);

    // Įkeliame modulį
    const partnerModule = require(filePath);
    
    if (typeof partnerModule !== 'function') {
      throw new Error(`Netinkamas partnerio modulio formatas: ${file}`);
    }

    // Timeout apsauga
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Partnerio užklausa per ilgai užtruko`)), CONFIG.REQUEST_TIMEOUT)
    );

    const offers = await Promise.race([partnerModule(), timeoutPromise]);
    
    // Validacija
    const validatedOffers = [];
    for (const offer of offers) {
      const { error, value } = offerSchema.validate(offer, { stripUnknown: true });
      if (!error) {
        validatedOffers.push(value);
      } else {
        logOfferEvent('invalid_offer', { 
          partner: partnerName, 
          error: error.details[0].message 
        });
      }
    }

    const duration = Date.now() - startTime;
    monitorPerformance(partnerName, duration, validatedOffers.length);
    
    logOfferEvent('partner_load_success', { 
      partner: partnerName, 
      offersCount: validatedOffers.length,
      duration 
    });
    
    return validatedOffers;
  } catch (err) {
    logOfferEvent('partner_load_failed', { 
      partner: partnerName, 
      error: err.message,
      duration: Date.now() - startTime
    });
    return [];
  }
};

// Batch apdorojimas su retry mechanizmu
const processInBatches = async (files, batchSize, retries = 2) => {
  let allOffers = [];
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    
    try {
      const batchPromises = batch.map(file => loadPartnerOffers(file));
      const batchResults = await Promise.all(batchPromises);
      allOffers = allOffers.concat(...batchResults);
    } catch (err) {
      if (retries > 0) {
        logOfferEvent('batch_retry', { batch, retriesLeft: retries });
        return processInBatches(files, batchSize, retries - 1);
      }
      throw err;
    }
  }

  return allOffers;
};

// Filtravimo funkcijos
const applyFilters = (offers, filters) => {
  return offers.filter(offer => {
    if (filters.type && offer.type !== filters.type) return false;
    if (filters.maxPrice && offer.price > filters.maxPrice) return false;
    if (filters.minPrice && offer.price < filters.minPrice) return false;
    if (filters.destination && !offer.to.includes(filters.destination)) return false;
    return true;
  });
};

// Puslapiavimo funkcija
const paginate = (array, page = 1, pageSize = 10) => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return array.slice(start, end);
};

// Pagrindinis endpoint'as
router.get('/offers', apiLimiter, async (req, res) => {
  try {
    // Nuskaitome partnerių failus
    const files = (await fs.readdir(CONFIG.PARTNERS_DIR))
      .filter(file => file.endsWith('.js') && !file.startsWith('_'));
    
    if (files.length === 0) {
      logOfferEvent('no_partners_found');
      return res.status(404).json({ 
        success: false,
        error: 'Nerasta partnerių modulių',
        note: 'Sugeneruokite partnerių modulius naudodami generatePartnerModules.js'
      });
    }

    console.log(`🔍 Aptikta ${files.length} partnerių modulių:`, files);

    // Gauname pasiūlymus
    const allOffers = await processInBatches(files, CONFIG.MAX_CONCURRENT_REQUESTS);
    
    // Filtravimas
    const filteredOffers = applyFilters(allOffers, req.query);
    
    // Puslapiavimas
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const paginatedOffers = paginate(filteredOffers, page, limit);
    
    logOfferEvent('offers_delivered', { 
      totalOffers: filteredOffers.length,
      displayed: paginatedOffers.length,
      partnerCount: files.length,
      page,
      limit
    });

    res.json({
      success: true,
      count: filteredOffers.length,
      page,
      totalPages: Math.ceil(filteredOffers.length / limit),
      partnersLoaded: files.length,
      data: paginatedOffers
    });
  } catch (err) {
    logOfferEvent('system_error', { error: err.message });
    console.error('Sistemos klaida:', err);
    res.status(500).json({ 
      success: false,
      error: 'Vidinė serverio klaida',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Health check endpoint'as
router.get('/offers/health', async (req, res) => {
  try {
    const partners = (await fs.readdir(CONFIG.PARTNERS_DIR))
      .filter(file => file.endsWith('.js') && !file.startsWith('_'));
    
    res.json({
      status: 'OK',
      partnerCount: partners.length,
      partnersDirectory: CONFIG.PARTNERS_DIR,
      partners: partners
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      error: err.message
    });
  }
});

// Testinis endpoint'as - grąžina demo duomenis jei nėra partnerių
router.get('/offers/demo', async (req, res) => {
  const demoOffers = [
    {
      title: "Demo Kelionė į Romą",
      from: "Vilnius",
      to: "Roma",
      type: "cultural",
      price: 299,
      url: "https://www.example.com/roma",
      image: "https://source.unsplash.com/featured/300x200/?rome",
      partner: "DemoPartner"
    },
    {
      title: "Demo Paplūdimio atostogos",
      from: "Vilnius", 
      to: "Maldyvai",
      type: "beach",
      price: 899,
      url: "https://www.example.com/maldives",
      image: "https://source.unsplash.com/featured/300x200/?beach",
      partner: "DemoPartner"
    }
  ];

  res.json({
    success: true,
    count: demoOffers.length,
    data: demoOffers,
    note: "Tai yra demo duomenys. Sukurkite partnerių modulius norėdami realių pasiūlymų."
  });
});

module.exports = router;
