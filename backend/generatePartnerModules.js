import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Partner } from '../models/partnerModel.js';
import logger from '../utils/logger.js';

// ES modulių __dirname alternatyva
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Partnerio modulio šablonas
const PARTNER_MODULE_TEMPLATE = `// Autogeneruotas modulis {{COMPANY}}
import { PartnerOffer } from '../../models/offerModel.js';
import { currencyConverter } from '../../config/currencyConverter.js';

export default async function() {
  try {
    // 1. Gauti pasiūlymus iš partnerio API
    const response = await fetch('{{URL}}', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer {{API_KEY}}',
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15s timeout
    });

    if (!response.ok) {
      throw new Error(\`HTTP \${response.status} - \${response.statusText}\`);
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
            url: offer.bookingUrl || offer.url || '{{URL}}',
            validUntil: offer.validUntil ? new Date(offer.validUntil) : null,
            lastUpdated: new Date()
          };

          // Automatinis konvertavimas (naudojant offerModel.js hook'us)
          const doc = new PartnerOffer(standardizedOffer);
          await doc.validate(); // Validacija prieš grąžinant

          return doc.toObject();
        } catch (validationError) {
          console.warn(\`Netinkamas pasiūlymas iš {{COMPANY}}:\`, validationError.message);
          return null;
        }
      })
    );

    // 3. Grąžinti tik validžius pasiūlymus
    return processedOffers.filter(offer => offer !== null);

  } catch (err) {
    console.error(\`❌ Kritinė klaida {{COMPANY}} modulyje:\`, err.message);
    return [];
  }
}
`;

/**
 * Sugeneruoja partnerių modulius iš duomenų bazės
 */
export async function generatePartnerModules() {
    const partnersFolder = path.join(__dirname, 'partners');
    
    try {
        // Sukuriamas partners aplankas jei neegzistuoja
        try {
            await fs.access(partnersFolder);
        } catch {
            await fs.mkdir(partnersFolder, { recursive: true });
            logger.info('📁 Sukurtas partners/ aplankas');
        }

        // Gaunami aktyvūs partneriai iš DB
        const partners = await Partner.find({ status: 'active' });
        
        if (partners.length === 0) {
            logger.warn('⚠️ Nerasta aktyvių partnerių duomenų bazėje');
            return { generated: 0, skipped: 0, total: 0 };
        }

        let generatedCount = 0;
        let skippedCount = 0;
        const generatedFiles = [];
        const skippedFiles = [];

        // Generuojami moduliai kiekvienam partneriui
        for (const partner of partners) {
            const filename = `${partner.slug}.js`;
            const filePath = path.join(partnersFolder, filename);

            try {
                // Tikriname ar failas jau egzistuoja ir ar reikia atnaujinti
                const existingContent = await fs.readFile(filePath, 'utf8').catch(() => null);
                
                // Jei partneris atnaujintas arba failas neegzistuoja - generuojame
                const partnerUpdated = partner.updatedAt > new Date(Date.now() - 60000); // Per paskutinę minutę
                
                if (!existingContent || partnerUpdated) {
                    const moduleCode = PARTNER_MODULE_TEMPLATE
                        .replace(/{{COMPANY}}/g, partner.companyName)
                        .replace(/{{URL}}/g, partner.website)
                        .replace(/{{API_KEY}}/g, partner.apiKey || 'YOUR_API_KEY_HERE');

                    await fs.writeFile(filePath, moduleCode);
                    generatedCount++;
                    generatedFiles.push(filename);
                    logger.info(`✅ Sugeneruotas: ${filename}`);
                } else {
                    skippedCount++;
                    skippedFiles.push(filename);
                }
            } catch (error) {
                logger.error(`❌ Klaida generuojant ${filename}:`, error.message);
                skippedCount++;
                skippedFiles.push(filename);
            }
        }

        // Ištrinami seni failai, kurių partnerių nebėra
        try {
            const existingFiles = (await fs.readdir(partnersFolder))
                .filter(f => f.endsWith('.js') && !f.startsWith('_'));
            
            const currentSlugs = partners.map(p => `${p.slug}.js`);
            const filesToDelete = existingFiles.filter(f => !currentSlugs.includes(f));
            
            for (const fileToDelete of filesToDelete) {
                await fs.unlink(path.join(partnersFolder, fileToDelete));
                logger.info(`🗑️ Ištrintas senas modulis: ${fileToDelete}`);
            }
        } catch (cleanupError) {
            logger.warn('Nepavyko išvalyti senų modulių:', cleanupError.message);
        }

        logger.info('📊 Partnerių modulių generavimo rezultatas:', {
            generated: generatedCount,
            skipped: skippedCount,
            total: partners.length,
            generatedFiles,
            skippedFiles
        });

        return {
            generated: generatedCount,
            skipped: skippedCount,
            total: partners.length,
            generatedFiles,
            skippedFiles
        };

    } catch (err) {
        logger.error('❌ Klaida generuojant partnerių modulius:', err);
        throw err;
    }
}

/**
 * Sugeneruoja modulį vienam partneriui
 * @param {string} partnerId - Partnerio ID
 */
export async function generateSinglePartnerModule(partnerId) {
    try {
        const partner = await Partner.findById(partnerId);
        if (!partner) {
            throw new Error(`Partneris su ID ${partnerId} nerastas`);
        }

        if (partner.status !== 'active') {
            throw new Error(`Partneris ${partner.companyName} nėra aktyvus`);
        }

        const partnersFolder = path.join(__dirname, 'partners');
        const filename = `${partner.slug}.js`;
        const filePath = path.join(partnersFolder, filename);

        // Sukuriamas aplankas jei reikia
        try {
            await fs.access(partnersFolder);
        } catch {
            await fs.mkdir(partnersFolder, { recursive: true });
        }

        const moduleCode = PARTNER_MODULE_TEMPLATE
            .replace(/{{COMPANY}}/g, partner.companyName)
            .replace(/{{URL}}/g, partner.website)
            .replace(/{{API_KEY}}/g, partner.apiKey || 'YOUR_API_KEY_HERE');

        await fs.writeFile(filePath, moduleCode);
        
        logger.info(`✅ Sugeneruotas modulis: ${filename}`);
        return { success: true, filename, partner: partner.companyName };
        
    } catch (err) {
        logger.error(`❌ Klaida generuojant modulį partneriui ${partnerId}:`, err.message);
        throw err;
    }
}

/**
 * Ištrina partnerio modulį
 * @param {string} partnerSlug - Partnerio slug
 */
export async function deletePartnerModule(partnerSlug) {
    try {
        const partnersFolder = path.join(__dirname, 'partners');
        const filePath = path.join(partnersFolder, `${partnerSlug}.js`);
        
        await fs.unlink(filePath);
        logger.info(`🗑️ Ištrintas partnerio modulis: ${partnerSlug}.js`);
        return { success: true, message: `Modulis ${partnerSlug}.js ištrintas` };
        
    } catch (err) {
        if (err.code === 'ENOENT') {
            logger.warn(`Modulis ${partnerSlug}.js jau neegzistuoja`);
            return { success: true, message: 'Modulis jau neegzistuoja' };
        }
        logger.error(`❌ Klaida trinant modulį ${partnerSlug}:`, err.message);
        throw err;
    }
}

// Paleidžiamas generavimas jei vykdomas tiesiogiai
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    generatePartnerModules().catch(err => {
        logger.error('Kritinė klaida:', err);
        process.exit(1);
    });
}
