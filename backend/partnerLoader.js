import { promises as fs } from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { PartnerOffer } from '../models/offerModel.js';
import { validationLogic } from '../services/validationLogic.js';
import logger from '../utils/logger.js';

/**
 * Įkelių partnerių pasiūlymus iš modulių
 * @returns {Promise<Array>} Įkelti pasiūlymai
 */
export async function loadOffers() {
  const dir = path.join(process.cwd(), 'partners');
  
  try {
    // Patikriname ar egzistuoja partnerių direktorija
    await fs.access(dir);
  } catch (err) {
    logger.warn(`Partnerių direktorija nerasta: ${dir}`);
    return [];
  }

  let files;
  try {
    files = (await fs.readdir(dir))
      .filter(f => f.endsWith('.js') && !f.startsWith('_'));
  } catch (err) {
    logger.error(`Nepavyko skaityti partnerių direktorijos: ${err.message}`);
    return [];
  }

  const allOffers = [];
  const loadTimes = {};

  for (const file of files) {
    const startTime = Date.now();
    try {
      const modulePath = path.join(dir, file);
      const { default: loader } = await import(modulePath);
      
      if (typeof loader !== 'function') {
        throw new Error('Modulis neeksportuoja funkcijos pagal nutylėjimą');
      }

      const offers = await loader();
      
      if (!Array.isArray(offers)) {
        throw new Error('Gautas ne masyvas');
      }

      // NAUDOJAME SERVISO VALIDACIJĄ
      const validOffers = validationLogic.validateScrapedOffers(offers);
      
      // PARUOŠIAME DUOMENŲ BAZEI
      const preparedOffers = validationLogic.prepareForDatabase(validOffers);

      if (preparedOffers.length > 0) {
        allOffers.push(...preparedOffers);
        
        // Išsaugome duomenų bazėje
        await PartnerOffer.bulkWrite(
          preparedOffers.map(offer => ({
            updateOne: {
              filter: { offerId: offer.offerId },
              update: { $set: offer },
              upsert: true
            }
          }))
        );
      }

      const loadTime = Date.now() - startTime;
      loadTimes[file] = `${loadTime}ms`;
      logger.info(`✅ Sėkmingai įkeltas ${file} (${preparedOffers.length} pasiūlymų)`);

    } catch (err) {
      logger.error(`❌ Klaida partnerio modulyje ${file}: ${err.message}`);
      loadTimes[file] = 'failed';
    }
  }

  logger.debug('Įkėlimo statistika:', {
    totalOffers: allOffers.length,
    loadedModules: files.length,
    loadTimes
  });

  return allOffers;
}

/**
 * Įkelių pasiūlymus iš konkretaus partnerio modulio
 * @param {string} partnerName - Partnerio modulio vardas (be .js)
 * @returns {Promise<Array>} Įkelti pasiūlymai
 */
export async function loadSinglePartner(partnerName) {
  const filePath = path.join(process.cwd(), 'partners', `${partnerName}.js`);
  
  try {
    await fs.access(filePath);
    const { default: loader } = await import(filePath);
    const offers = await loader();
    
    if (!Array.isArray(offers)) {
      throw new Error('Gautas ne masyvas');
    }

    // NAUDOJAME SERVISO VALIDACIJĄ
    const validOffers = validationLogic.validateScrapedOffers(offers);
    
    // PARUOŠIAME DUOMENŲ BAZEI
    const preparedOffers = validationLogic.prepareForDatabase(validOffers);

    await PartnerOffer.bulkWrite(
      preparedOffers.map(offer => ({
        updateOne: {
          filter: { offerId: offer.offerId },
          update: { $set: offer },
          upsert: true
        }
      }))
    );

    logger.info(`✅ Sėkmingai atnaujintas ${partnerName} (${preparedOffers.length} pasiūlymų)`);
    return preparedOffers;
  } catch (err) {
    logger.error(`❌ Klaida įkeliant ${partnerName}: ${err.message}`);
    throw err;
  }
}
