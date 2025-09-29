const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const router = express.Router();
const { performance } = require('perf_hooks');
const { logPartnerStatusCheck } = require('../utils/logger');

// Konfigūracija
const CONFIG = {
    PARTNERS_DIR: path.join(__dirname, '../partners'),
    REQUEST_TIMEOUT: 5000, // 5 sekundžių timeout'as
    CACHE_TTL: 60000 // 1 minutė statuso cache
};

// Helper funkcijos
const generateSlug = (company) => {
    return company
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
};

const checkPartnerModule = async (partner, partnerDir) => {
    const startTime = performance.now();
    const slug = generateSlug(partner.companyName || partner.company);
    const modulePath = path.join(partnerDir, `${slug}.js`);
    
    const result = {
        company: partner.companyName || partner.company,
        slug,
        moduleExists: false,
        status: '❌ Nėra failo',
        offersCount: 0,
        responseTime: 0,
        lastUpdated: new Date().toISOString(),
        error: null
    };

    try {
        await fs.access(modulePath);
        result.moduleExists = true;

        // Timeout apsauga
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Modulio vykdymas užtruko per ilgai')), CONFIG.REQUEST_TIMEOUT)
        );

        // Dinaminis modulio įkėlimas
        const mod = require(modulePath);
        
        if (typeof mod !== 'function' && typeof mod.default !== 'function') {
            throw new Error('Modulis neeksportuoja funkcijos');
        }

        const loader = mod.default || mod;
        const offers = await Promise.race([loader(), timeoutPromise]);
        
        if (Array.isArray(offers)) {
            result.status = `✅ ${offers.length} pasiūlymų`;
            result.offersCount = offers.length;
        } else {
            result.status = '⚠️ Negrąžino sąrašo';
            result.error = 'Modulis grąžino ne masyvą';
        }
    } catch (err) {
        result.status = `❌ Klaida`;
        result.error = err.message.replace(modulePath, '').trim();
    } finally {
        result.responseTime = performance.now() - startTime;
        // Išvalome require cache, kad galėtume tiksliai testuoti
        delete require.cache[require.resolve(modulePath)];
    }

    return result;
};

// Gaunami partneriai iš MongoDB
const getPartnersFromDB = async () => {
    try {
        // Jei naudojame mongoose, importuojame modelį
        const { Partner } = require('../models/partnerModel');
        const partners = await Partner.find({ status: 'active' })
            .select('companyName website email slug')
            .lean();
        
        return partners.map(partner => ({
            companyName: partner.companyName,
            website: partner.website,
            email: partner.email,
            slug: partner.slug
        }));
    } catch (dbError) {
        console.warn('Nepavyko gauti partnerių iš DB:', dbError.message);
        return [];
    }
};

// Gaunami partneriai iš JSON failo (fallback)
const getPartnersFromJSON = async () => {
    try {
        const partnersPath = path.join(__dirname, '../partners.json');
        const rawData = await fs.readFile(partnersPath, 'utf8');
        const partners = JSON.parse(rawData);
        return partners;
    } catch (err) {
        throw new Error('partners.json failas nerastas arba neteisingas formatas');
    }
};

// Pagrindinis statuso endpoint'as
router.get('/partner-status', async (req, res) => {
    try {
        let partners;
        
        // Bandome gauti partnerius iš DB
        partners = await getPartnersFromDB();
        
        // Jei DB tuščia, bandome iš JSON failo
        if (partners.length === 0) {
            partners = await getPartnersFromJSON();
        }

        if (partners.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Nerasta aktyvių partnerių' 
            });
        }

        // Tikriname kiekvieną partnerį
        const statusChecks = partners.map(partner => 
            checkPartnerModule(partner, CONFIG.PARTNERS_DIR)
        );

        const results = await Promise.all(statusChecks);
        
        // Apskaičiuojame statistiką
        const stats = {
            totalPartners: partners.length,
            activeModules: results.filter(r => r.moduleExists).length,
            modulesWithOffers: results.filter(r => r.offersCount > 0).length,
            partnersWithErrors: results.filter(r => r.error).length,
            totalOffers: results.reduce((sum, r) => sum + r.offersCount, 0),
            avgResponseTime: results.reduce((sum, r) => sum + r.responseTime, 0) / results.length,
            successRate: ((results.filter(r => r.moduleExists && r.offersCount > 0).length / partners.length) * 100).toFixed(1)
        };

        // Grupuojame rezultatus pagal statusą
        const groupedResults = {
            success: results.filter(r => r.moduleExists && r.offersCount > 0),
            warning: results.filter(r => r.moduleExists && r.offersCount === 0),
            error: results.filter(r => !r.moduleExists || r.error),
            noModule: results.filter(r => !r.moduleExists)
        };

        // Registruojame įvykį
        logPartnerStatusCheck(stats);

        res.json({
            success: true,
            data: results,
            stats,
            groupedResults,
            timestamp: new Date().toISOString(),
            summary: {
                message: `Patikrinta ${stats.totalPartners} partnerių. ${stats.modulesWithOffers} sėkmingai grąžino pasiūlymus.`,
                health: stats.successRate >= 80 ? 'healthy' : stats.successRate >= 50 ? 'degraded' : 'critical'
            }
        });

    } catch (err) {
        console.error('Partnerių būsenos tikrinimo klaida:', err);
        
        logPartnerStatusCheck({ error: err.message });
        
        res.status(500).json({ 
            success: false,
            error: 'Vidinė serverio klaida',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Konkretaus partnerio statusas
router.get('/partner-status/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const modulePath = path.join(CONFIG.PARTNERS_DIR, `${slug}.js`);

        try {
            await fs.access(modulePath);
        } catch {
            return res.status(404).json({
                success: false,
                error: `Partnerio modulis ${slug}.js nerastas`
            });
        }

        const partner = { slug, companyName: slug };
        const result = await checkPartnerModule(partner, CONFIG.PARTNERS_DIR);

        res.json({
            success: true,
            data: result
        });

    } catch (err) {
        console.error(`Partnerio ${req.params.slug} tikrinimo klaida:`, err);
        res.status(500).json({
            success: false,
            error: 'Vidinė serverio klaida'
        });
    }
});

// Health check endpoint'as
router.get('/partner-status/health', async (req, res) => {
    try {
        let partners = await getPartnersFromDB();
        if (partners.length === 0) {
            partners = await getPartnersFromJSON().catch(() => []);
        }

        const moduleFiles = (await fs.readdir(CONFIG.PARTNERS_DIR))
            .filter(file => file.endsWith('.js') && !file.startsWith('_'));

        res.json({
            status: 'OK',
            partnerCount: partners.length,
            moduleCount: moduleFiles.length,
            lastCheck: new Date().toISOString(),
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                uptime: process.uptime()
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'ERROR',
            error: err.message,
            lastCheck: new Date().toISOString()
        });
    }
});

module.exports = router;
