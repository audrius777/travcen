import { promises as fs } from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { PartnerOffer } from '../models/offerModel.js';
import { validateOffer } from '../utils/validation.js';
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

    if (files.length === 0) {
        logger.info('Nerasta partnerių modulių');
        return [];
    }

    const allOffers = [];
    const loadStats = {
        total: files.length,
        success: 0,
        failed: 0,
        totalOffers: 0
    };

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

            // Validacija ir transformacija
            const validOffers = [];
            for (const offer of offers) {
                try {
                    const validated = validateOffer(offer);
                    validOffers.push({
                        ...validated,
                        partner: path.basename(file, '.js'),
                        lastUpdated: new Date(),
                        source: 'partner_api'
                    });
                } catch (validationError) {
                    logger.warn(`Netinkamas pasiūlymas iš ${file}: ${validationError.message}`);
                }
            }

            if (validOffers.length > 0) {
                allOffers.push(...validOffers);
                
                // Išsaugome duomenų bazėje
                try {
                    await PartnerOffer.bulkWrite(
                        validOffers.map(offer => ({
                            updateOne: {
                                filter: { 
                                    offerId: offer.offerId,
                                    partner: offer.partner 
                                },
                                update: { $set: offer },
                                upsert: true
                            }
                        }))
                    );
                    
                    // Atnaujiname partnerio lastSync
                    const partnerName = path.basename(file, '.js');
                    await mongoose.models.Partner.findOneAndUpdate(
                        { slug: partnerName },
                        { 
                            lastSync: new Date(),
                            syncStatus: 'success',
                            offersCount: validOffers.length,
                            lastSyncError: ''
                        }
                    );
                    
                } catch (dbError) {
                    logger.error(`Duomenų bazės klaida ${file}:`, dbError.message);
                }
            }

            const loadTime = Date.now() - startTime;
            loadStats.success++;
            loadStats.totalOffers += validOffers.length;
            
            logger.info(`✅ Sėkmingai įkeltas ${file} (${validOffers.length} pasiūlymų, ${loadTime}ms)`);

        } catch (err) {
            const loadTime = Date.now() - startTime;
            loadStats.failed++;
            
            // Atnaujiname partnerio sync status su klaida
            try {
                const partnerName = path.basename(file, '.js');
                await mongoose.models.Partner.findOneAndUpdate(
                    { slug: partnerName },
                    { 
                        lastSync: new Date(),
                        syncStatus: 'failed',
                        lastSyncError: err.message
                    }
                );
            } catch (dbError) {
                // Ignore database errors during error handling
            }
            
            logger.error(`❌ Klaida partnerio modulyje ${file}: ${err.message} (${loadTime}ms)`);
        }
    }

    logger.info('📊 Įkėlimo statistika:', loadStats);
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

        const validOffers = offers.map(offer => ({
            ...validateOffer(offer),
            partner: partnerName,
            lastUpdated: new Date(),
            source: 'partner_api'
        }));

        // Išsaugome duomenų bazėje
        await PartnerOffer.bulkWrite(
            validOffers.map(offer => ({
                updateOne: {
                    filter: { 
                        offerId: offer.offerId,
                        partner: offer.partner 
                    },
                    update: { $set: offer },
                    upsert: true
                }
            }))
        );

        // Atnaujiname partnerio lastSync
        await mongoose.models.Partner.findOneAndUpdate(
            { slug: partnerName },
            { 
                lastSync: new Date(),
                syncStatus: 'success',
                offersCount: validOffers.length,
                lastSyncError: ''
            }
        );

        logger.info(`✅ Sėkmingai atnaujintas ${partnerName} (${validOffers.length} pasiūlymų)`);
        return validOffers;
    } catch (err) {
        logger.error(`❌ Klaida įkeliant ${partnerName}: ${err.message}`);
        
        // Atnaujiname partnerio sync status su klaida
        try {
            await mongoose.models.Partner.findOneAndUpdate(
                { slug: partnerName },
                { 
                    lastSync: new Date(),
                    syncStatus: 'failed',
                    lastSyncError: err.message
                }
            );
        } catch (dbError) {
            // Ignore database errors during error handling
        }
        
        throw err;
    }
}

/**
 * Gauna partnerius, kuriems reikia sinchronizacijos
 * @returns {Promise<Array>} Partnerių sąrašas
 */
export async function getPartnersNeedingSync() {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const partners = await mongoose.models.Partner.find({ 
            status: 'active',
            $or: [
                { lastSync: { $lt: twentyFourHoursAgo } },
                { lastSync: null }
            ]
        }).select('slug companyName lastSync syncStatus');
        
        return partners;
    } catch (err) {
        logger.error('Klaida gaunant partnerius sinchronizacijai:', err.message);
        return [];
    }
}

/**
 * Gauna visų partnerių sinchronizacijos statistiką
 * @returns {Promise<Object>} Statistika
 */
export async function getSyncStats() {
    try {
        const stats = await mongoose.models.Partner.aggregate([
            {
                $group: {
                    _id: '$syncStatus',
                    count: { $sum: 1 },
                    totalOffers: { $sum: '$offersCount' }
                }
            }
        ]);
        
        const totalPartners = await mongoose.models.Partner.countDocuments({ status: 'active' });
        const partnersNeedingSync = await getPartnersNeedingSync();
        
        return {
            totalPartners,
            partnersNeedingSync: partnersNeedingSync.length,
            stats: stats.reduce((acc, stat) => {
                acc[stat._id] = stat;
                return acc;
            }, {}),
            lastSync: new Date()
        };
    } catch (err) {
        logger.error('Klaida gaunant sinchronizacijos statistiką:', err.message);
        return {
            totalPartners: 0,
            partnersNeedingSync: 0,
            stats: {},
            lastSync: new Date()
        };
    }
}
