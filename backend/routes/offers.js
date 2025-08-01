const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const Joi = require('joi');
const redis = require('redis');
const rateLimit = require('express-rate-limit');
const { logOfferEvent, monitorPerformance } = require('../utils/logger');

// Konfigūracija
const CONFIG = {
  PARTNERS_DIR: path.join(__dirname, '../partners'),
  MAX_CONCURRENT_REQUESTS: 3,
  REQUEST_TIMEOUT: 10000,
  CACHE_TTL: 300, // 5 minučių caching
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minučių
    max: 100 // 100 užklausų per langą
  }
};

// Redis kliento inicijavimas
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.connect().catch(console.error);

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

// Saugus partnerio modulio įkėlimas su metrikomis
const loadPartnerOffers = async (file) => {
  const startTime = Date.now();
  const partnerName = path.basename(file, '.js');
  
  try {
    // Cache check
    const cacheKey = `offers:${partnerName}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logOfferEvent('cache_hit', { partner: partnerName });
      return JSON.parse(cached);
    }

    const partnerModule = require(path.join(CONFIG.PARTNERS_DIR, file));
    
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

    // Cache set
    await redisClient.setEx(
      cacheKey, 
      CONFIG.CACHE_TTL, 
      JSON.stringify(validatedOffers)
    );

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
    const batchPromises = batch.map(file => loadPartnerOffers(file));
    
    try {
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
        error: 'Nerasta partnerių modulių' 
      });
    }

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
  const partners = (await fs.readdir(CONFIG.PARTNERS_DIR))
    .filter(file => file.endsWith('.js') && !file.startsWith('_'));
  
  res.json({
    status: 'OK',
    partnerCount: partners.length,
    cacheStatus: redisClient.isOpen ? 'connected' : 'disconnected'
  });
});

module.exports = router;
