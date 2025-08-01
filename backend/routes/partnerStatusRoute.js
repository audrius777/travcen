const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const router = express.Router();
const { performance } = require('perf_hooks');
const { logPartnerStatusCheck } = require('../utils/logger');

// Konfigūracija
const CONFIG = {
  PARTNERS_JSON_PATH: path.join(__dirname, '../partners.json'),
  PARTNERS_DIR: path.join(__dirname, '../partners'),
  REQUEST_TIMEOUT: 5000, // 5 sekundžių timeout'as
  CACHE_TTL: 60000 // 1 minutė statuso cache
};

// Helper funkcijos
const generateSlug = (company) => {
  return company.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

const checkPartnerModule = async (partner, partnerDir) => {
  const startTime = performance.now();
  const slug = generateSlug(partner.company);
  const modulePath = path.join(partnerDir, `${slug}.js`);
  
  const result = {
    company: partner.company,
    slug,
    moduleExists: false,
    status: '❌ Nėra failo',
    offersCount: 0,
    responseTime: 0,
    lastUpdated: new Date().toISOString()
  };

  try {
    await fs.access(modulePath);
    result.moduleExists = true;

    // Timeout apsauga
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Modulio vykdymas užtruko per ilgai')), CONFIG.REQUEST_TIMEOUT)
    );

    const mod = require(modulePath);
    const offers = await Promise.race([mod(), timeoutPromise]);
    
    if (Array.isArray(offers)) {
      result.status = `✅ ${offers.length} pasiūlymų`;
      result.offersCount = offers.length;
    } else {
      result.status = '⚠️ Negrąžino sąrašo';
    }
  } catch (err) {
    result.status = `❌ Klaida: ${err.message.replace(modulePath, '')}`;
  } finally {
    result.responseTime = performance.now() - startTime;
    // Išvalome require cache, kad galėtume tiksliai testuoti
    delete require.cache[require.resolve(modulePath)];
  }

  return result;
};

router.get('/partner-status', async (req, res) => {
  try {
    // Nuskaitome partnerių sąrašą
    const rawData = await fs.readFile(CONFIG.PARTNERS_JSON_PATH, 'utf8');
    const partners = JSON.parse(rawData);

    // Tikriname kiekvieną partnerį
    const statusChecks = partners.map(partner => 
      checkPartnerModule(partner, CONFIG.PARTNERS_DIR)
    );

    const results = await Promise.all(statusChecks);
    
    // Registruojame įvykį
    logPartnerStatusCheck({
      totalPartners: partners.length,
      activeModules: results.filter(r => r.moduleExists).length,
      totalOffers: results.reduce((sum, r) => sum + r.offersCount, 0)
    });

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
      stats: {
        totalPartners: partners.length,
        activePartners: results.filter(r => r.moduleExists).length,
        partnersWithErrors: results.filter(r => r.status.includes('❌')).length,
        totalOffers: results.reduce((sum, r) => sum + r.offersCount, 0),
        avgResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
      }
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      logPartnerStatusCheck({ error: 'partners.json not found' });
      return res.status(404).json({ 
        success: false, 
        error: 'partners.json failas nerastas' 
      });
    }

    logPartnerStatusCheck({ error: err.message });
    console.error('Partnerių būsenos tikrinimo klaida:', err);
    res.status(500).json({ 
      success: false,
      error: 'Vidinė serverio klaida',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

module.exports = router;
