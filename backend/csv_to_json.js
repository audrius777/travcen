import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { Transform } from 'stream';
import logger from '../utils/logger.js';

// ES modulių __dirname alternatyva
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Keliai
const inputCsvPath = path.join(__dirname, 'data', 'partneriai.csv');
const outputJsonPath = path.join(__dirname, 'data', 'partners.json');

/**
 * CSV failo konvertavimas į JSON su validacija
 * @param {string} inputPath - Įvesties CSV failo kelias
 * @param {string} outputPath - Išvesties JSON failo kelias
 * @returns {Promise<void>}
 */
export async function convertCsvToJson(inputPath, outputPath) {
  try {
    // Patikriname ar egzistuoja įvesties failas
    await fs.access(inputPath);
    
    const results = [];
    const requiredFields = ['company', 'url', 'email'];
    const stream = fs.createReadStream(inputPath)
      .pipe(csv({
        mapHeaders: ({ header }) => header.trim(),
        mapValues: ({ value }) => value.trim()
      }))
      .pipe(new Transform({
        objectMode: true,
        transform(row, encoding, callback) {
          // Validacija
          const missingFields = requiredFields.filter(f => !row[f]);
          if (missingFields.length > 0) {
            logger.warn(`Praleistas įrašas - trūksta laukų: ${missingFields.join(', ')}`);
            return callback();
          }

          // Standartizuojamas objektas
          const partner = {
            company: row.company,
            url: row.url,
            email: row.email,
            apiKey: row.apiKey || '',
            status: row.status || 'active',
            createdAt: new Date().toISOString()
          };

          results.push(partner);
          callback();
        }
      }));

    // Laukiamas stream pabaigos
    await new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('error', reject);
    });

    if (results.length === 0) {
      throw new Error('Nėra validių įrašų po konvertavimo');
    }

    // Išsaugome rezultatus
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    logger.info(`✅ Sėkmingai konvertuota ${results.length} įrašų į: ${outputPath}`);
    
    return results;
  } catch (err) {
    logger.error('❌ Konvertavimo klaida:', err.message);
    throw err;
  }
}

// Paleidimas jei vykdomas tiesiogiai
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  convertCsvToJson(inputCsvPath, outputJsonPath)
    .catch(() => process.exit(1));
}
