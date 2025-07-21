import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Partner } from '../models/partnerModel.js';
import logger from '../utils/logger.js';

// ES modulių __dirname alternatyva
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Sugeneruoja partnerių modulius iš duomenų bazės
 */
export async function generatePartnerModules() {
  const partnersFolder = path.join(__dirname, 'partners');
  const templatePath = path.join(__dirname, 'templates', 'partnerModule.tpl.js');

  try {
    // Sukuriamas partners aplankas jei neegzistuoja
    await fs.access(partnersFolder);
  } catch {
    await fs.mkdir(partnersFolder);
    logger.info('📁 Sukurtas partners/ aplankas');
  }

  // Šablonas iš failo
  let template;
  try {
    template = await fs.readFile(templatePath, 'utf8');
  } catch (err) {
    logger.error('❌ Nepavyko nuskaityti šablono failo');
    throw err;
  }

  try {
    // Gaunami partneriai iš DB
    const partners = await Partner.find({ status: 'active' });
    
    if (partners.length === 0) {
      logger.warn('⚠️ Nerasta aktyvių partnerių duomenų bazėje');
      return;
    }

    let generatedCount = 0;
    const skipped = [];

    // Generuojami moduliai kiekvienam partneriui
    for (const partner of partners) {
      const slug = generateSlug(partner.company);
      const filename = path.join(partnersFolder, `${slug}.js`);

      try {
        await fs.access(filename);
        skipped.push(slug);
        continue;
      } catch {
        // Failas neegzistuoja - tęsiame
      }

      const moduleCode = template
        .replace(/{{COMPANY}}/g, partner.company)
        .replace(/{{URL}}/g, partner.url)
        .replace(/{{EMAIL}}/g, partner.email || '')
        .replace(/{{API_KEY}}/g, partner.apiKey || 'null');

      await fs.writeFile(filename, moduleCode);
      generatedCount++;
      logger.info(`✅ Sugeneruotas: ${slug}.js`);
    }

    logger.info('📊 Rezultatas:', {
      generated: generatedCount,
      skipped: skipped.length,
      total: partners.length
    });

  } catch (err) {
    logger.error('❌ Klaida generuojant modulius:', err);
    throw err;
  }
}

/**
 * Sugeneruoja URL draugišką pavadinimą
 * @param {string} str - Įvesties tekstas
 * @returns {string} Normalizuotas slug
 */
function generateSlug(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Paleidžiamas generavimas jei vykdomas tiesiogiai
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generatePartnerModules().catch(err => {
    logger.error('Kritinė klaida:', err);
    process.exit(1);
  });
}
