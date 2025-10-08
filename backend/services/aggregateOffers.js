import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PartnerOffer } from '../models/offerModel.js';
import { validationLogic } from './validationLogic.js';
import logger from '../utils/logger.js';

// ES modulių __dirname alternatyva
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfigūracija
const CONFIG = {
  PARTNERS_DIR: path.join(__dirname, '../partners'),
  MAX_CONCURRENT_REQUESTS: 3, // SUMAŽINTA: iš 5 į 3
  REQUEST_TIMEOUT: 20000, // Padidintas timeout
  RETRY_ATTEMPTS: 2
};

// Saugus modulio įkėlimas su timeout'u
const loadPartnerOffers = async (partnerModule, partnerName) => {
  try {
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), CONFIG.REQUEST_TIMEOUT)
    );

    const offers = await Promise.race([partnerModule(), timeoutPromise]);
    
    if (!Array.isArray(offers)) {
      throw new Error('Module did not return an array');
    }

    logger.info(`✅ ${offers.length} offers from ${partnerName}`);
    return offers;
  } catch (err) {
    logger.error(`❌ ${partnerName} load failed: ${err.message}`);
    return [];
  }
};

// Partnerių modulių įkėlimas
const getPartnerModules = async () => {
  try {
    const files = await fs.readdir(CONFIG.PARTNERS_DIR);
    return files
      .filter(file => file.endsWith('.js') && !file.startsWith('_'))
      .map(file => ({
        name: path.basename(file, '.js'),
        module: (await import(path.join(CONFIG.PARTNERS_DIR, file))).default
      }));
  } catch (err) {
    logger.error('Partner module loading failed:', err);
    return [];
  }
};

// Pasiūlymų agregavimas su bandymais
const aggregateWithRetry = async (partnerModules, attempt = 1) => {
  const batchSize = CONFIG.MAX_CONCURRENT_REQUESTS;
  let allOffers = [];

  for (let i = 0; i < partnerModules.length; i += batchSize) {
    const batch = partnerModules.slice(i, i + batchSize);
    
    try {
      const batchResults = await Promise.all(
        batch.map(p => loadPartnerOffers(p.module, p.name))
      );
      allOffers = allOffers.concat(...batchResults);
    } catch (err) {
      if (attempt <= CONFIG.RETRY_ATTEMPTS) {
        logger.warn(`Retry attempt ${attempt} for batch ${i}-${i+batchSize}`);
        return aggregateWithRetry(partnerModules, attempt + 1);
      }
      throw err;
    }
  }

  return allOffers;
};

// Pagrindinė eksportuojama funkcija
export default async function aggregateOffers() {
  try {
    const partnerModules = await getPartnerModules();
    
    if (partnerModules.length === 0) {
      logger.warn('No partner modules found');
      return [];
    }

    const rawOffers = await aggregateWithRetry(partnerModules);
    
    // NAUDOJAME SERVISO VALIDACIJĄ VIETOJ TIESIOGINĖS
    const validatedOffers = validationLogic.validateScrapedOffers(rawOffers);
    
    // PARUOŠIAME DUOMENŲ BAZEI
    const preparedOffers = validationLogic.prepareForDatabase(validatedOffers);
    
    // FILTRUOJAME PASIKARTOJIMUS
    const uniqueOffers = validationLogic.removeDuplicates(preparedOffers);

    // Išsaugojimas duomenų bazėje
    if (uniqueOffers.length > 0) {
      await PartnerOffer.bulkWrite(
        uniqueOffers.map(offer => ({
          updateOne: {
            filter: { offerId: offer.offerId },
            update: { $set: offer },
            upsert: true
          }
        }))
      );
    }

    logger.info(`Aggregated ${uniqueOffers.length} valid offers`);
    return uniqueOffers;
  } catch (err) {
    logger.error('Aggregation failed:', err);
    throw err;
  }
}
