// statistics.js
import express from 'express';
import mongoose from 'mongoose';
import Statistics from '../models/Statistics.js';
import Offer from '../models/Offer.js';
import Partner from '../models/Partner.js';

const router = express.Router();

// 1. Visų partnerių mėnesio statistika (GET /api/statistics/monthly/:period)
router.get('/monthly/:period', async (req, res) => {
    try {
        const { period } = req.params;
        
        // Validuoti periodo formatą (YYYY-MM)
        if (!/^\d{4}-\d{2}$/.test(period)) {
            return res.status(400).json({
                success: false,
                error: 'Netinkamas periodo formatas. Naudokite YYYY-MM'
            });
        }

        const stats = await Statistics.find({ period })
            .sort({ totalClicks: -1, totalViews: -1 });

        res.json({
            success: true,
            period: period,
            statistics: stats,
            totalPartners: stats.length,
            summary: {
                totalOffers: stats.reduce((sum, stat) => sum + stat.totalOffers, 0),
                totalViews: stats.reduce((sum, stat) => sum + stat.totalViews, 0),
                totalClicks: stats.reduce((sum, stat) => sum + stat.totalClicks, 0),
                averageCTR: stats.length > 0 ? 
                    Number((stats.reduce((sum, stat) => sum + stat.totalClicks, 0) / 
                           stats.reduce((sum, stat) => sum + stat.totalViews, 0) * 100).toFixed(2)) : 0
            }
        });

    } catch (error) {
        console.error('Mėnesio statistikos klaida:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Serverio klaida įkeliant mėnesio statistiką' 
        });
    }
});

// 2. Partnerio visų periodų statistika (GET /api/statistics/partner/:partnerId/history)
router.get('/partner/:partnerId/history', async (req, res) => {
    try {
        const { partnerId } = req.params;
        const { limit = 12 } = req.query;

        const history = await Statistics.getPartnerHistory(partnerId, parseInt(limit));

        if (history.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Nerasta statistikos šiam partneriui'
            });
        }

        // Gauti partnerio informaciją
        const partner = await Partner.findOne({ partnerId: partnerId });

        res.json({
            success: true,
            partner: {
                partnerId: partnerId,
                companyName: partner ? partner.companyName : 'Nežinoma įmonė',
                email: partner ? partner.email : 'Nežinomas'
            },
            history: history,
            summary: {
                totalPeriods: history.length,
                averageViews: Number((history.reduce((sum, stat) => sum + stat.totalViews, 0) / history.length).toFixed(0)),
                averageClicks: Number((history.reduce((sum, stat) => sum + stat.totalClicks, 0) / history.length).toFixed(0)),
                bestPeriod: history.reduce((best, current) => 
                    current.totalClicks > best.totalClicks ? current : best, history[0]
                )
            }
        });

    } catch (error) {
        console.error('Partnerio istorijos klaida:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Serverio klaida įkeliant partnerio istoriją' 
        });
    }
});

// 3. Statistikos atnaujinimas/sukūrimas (POST /api/statistics/update/:period)
router.post('/update/:period', async (req, res) => {
    try {
        const { period } = req.params;
        
        if (!/^\d{4}-\d{2}$/.test(period)) {
            return res.status(400).json({
                success: false,
                error: 'Netinkamas periodo formatas. Naudokite YYYY-MM'
            });
        }

        const [year, month] = period.split('-').map(Number);
        
        // Gauti visus aktyvius partnerius
        const partners = await Partner.find({ status: 'active' });
        
        let updatedCount = 0;
        const results = [];

        // Atnaujinti kiekvieno partnerio statistiką
        for (const partner of partners) {
            try {
                // Gauti visus partnerio pasiūlymus
                const offers = await Offer.find({ 
                    partnerId: partner.partnerId,
                    $or: [
                        { 
                            tripDate: { 
                                $gte: new Date(year, month - 1, 1),
                                $lte: new Date(year, month, 0, 23, 59, 59)
                            }
                        },
                        {
                            createdAt: {
                                $gte: new Date(year, month - 1, 1),
                                $lte: new Date(year, month, 0, 23, 59, 59)
                            }
                        }
                    ]
                });

                if (offers.length > 0) {
                    // Gauti arba sukurti statistikos įrašą
                    const stats = await Statistics.getOrCreateMonthlyStats(
                        partner.partnerId, 
                        partner.companyName, 
                        year, 
                        month
                    );

                    // Atnaujinti statistiką
                    await stats.updateStatistics(offers);
                    updatedCount++;
                    results.push({
                        partnerId: partner.partnerId,
                        companyName: partner.companyName,
                        offers: offers.length,
                        status: 'success'
                    });
                }
            } catch (partnerError) {
                console.error(`Klaida atnaujinant statistiką partneriui ${partner.partnerId}:`, partnerError);
                results.push({
                    partnerId: partner.partnerId,
                    companyName: partner.companyName,
                    status: 'error',
                    error: partnerError.message
                });
            }
        }

        res.json({
            success: true,
            message: `Atnaujinta ${updatedCount} partnerių statistika`,
            period: period,
            updatedCount: updatedCount,
            results: results
        });

    } catch (error) {
        console.error('Statistikos atnaujinimo klaida:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Serverio klaida atnaujinant statistiką' 
        });
    }
});

// 4. Automatinis statistikos suvestinės generavimas (POST /api/statistics/generate-summary)
router.post('/generate-summary', async (req, res) => {
    try {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
        const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

        const periods = [
            `${currentYear}-${currentMonth.toString().padStart(2, '0')}`,
            `${previousYear}-${previousMonth.toString().padStart(2, '0')}`
        ];

        const summary = {};

        for (const period of periods) {
            const [year, month] = period.split('-').map(Number);
            
            // Gauti arba sukurti statistiką šiam periodui
            const partners = await Partner.find({ status: 'active' });
            
            for (const partner of partners) {
                const offers = await Offer.find({ 
                    partnerId: partner.partnerId,
                    $or: [
                        { 
                            tripDate: { 
                                $gte: new Date(year, month - 1, 1),
                                $lte: new Date(year, month, 0, 23, 59, 59)
                            }
                        },
                        {
                            createdAt: {
                                $gte: new Date(year, month - 1, 1),
                                $lte: new Date(year, month, 0, 23, 59, 59)
                            }
                        }
                    ]
                });

                if (offers.length > 0) {
                    const stats = await Statistics.getOrCreateMonthlyStats(
                        partner.partnerId, 
                        partner.companyName, 
                        year, 
                        month
                    );
                    await stats.updateStatistics(offers);
                }
            }

            // Gauti suvestinę šiam periodui
            const periodStats = await Statistics.find({ period });
            summary[period] = {
                totalPartners: periodStats.length,
                totalOffers: periodStats.reduce((sum, stat) => sum + stat.totalOffers, 0),
                totalViews: periodStats.reduce((sum, stat) => sum + stat.totalViews, 0),
                totalClicks: periodStats.reduce((sum, stat) => sum + stat.totalClicks, 0),
                averageCTR: periodStats.length > 0 ? 
                    Number((periodStats.reduce((sum, stat) => sum + stat.totalClicks, 0) / 
                           periodStats.reduce((sum, stat) => sum + stat.totalViews, 0) * 100).toFixed(2)) : 0
            };
        }

        res.json({
            success: true,
            message: 'Statistikos suvestinė sėkmingai sugeneruota',
            summary: summary,
            generatedAt: new Date()
        });

    } catch (error) {
        console.error('Statistikos suvestinės generavimo klaida:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Serverio klaida generuojant statistikos suvestinę' 
        });
    }
});

// 5. Top partnerių gavimas (GET /api/statistics/top-partners)
router.get('/top-partners', async (req, res) => {
    try {
        const { limit = 10, period, sortBy = 'totalClicks' } = req.query;

        let query = {};
        if (period) {
            query.period = period;
        }

        const validSortFields = ['totalClicks', 'totalViews', 'clickThroughRate', 'totalOffers'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'totalClicks';

        const topPartners = await Statistics.find(query)
            .sort({ [sortField]: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            topPartners: topPartners,
            sortBy: sortField,
            period: period || 'visi periodai',
            total: topPartners.length
        });

    } catch (error) {
        console.error('Top partnerių klaida:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Serverio klaida įkeliant top partnerius' 
        });
    }
});

// 6. Statistikos eksportas CSV formatu (GET /api/statistics/export)
router.get('/export', async (req, res) => {
    try {
        const { period, partnerId } = req.query;

        let query = {};
        if (period) query.period = period;
        if (partnerId) query.partnerId = partnerId;

        const stats = await Statistics.find(query).sort({ period: -1, totalClicks: -1 });

        if (stats.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Nerasta statistikos eksportui'
            });
        }

        // Sukurti CSV turinį
        let csvContent = 'Periodas,Partnerio ID,Įmonė,Pasiūlymų,Peržiūrų,Paspaudimų,CTR %,Aktyvūs,Pasenę,Vid. Kaina,Populiariausia Destinacija\n';
        
        stats.forEach(stat => {
            const row = [
                stat.period,
                stat.partnerId,
                `"${stat.companyName}"`,
                stat.totalOffers,
                stat.totalViews,
                stat.totalClicks,
                stat.clickThroughRate,
                stat.activeOffers,
                stat.expiredOffers,
                stat.averagePrice,
                `"${stat.mostPopularDestination}"`
            ].join(',');
            
            csvContent += row + '\n';
        });

        // Nustatyti atsakymo head'erus
        const filename = partnerId ? 
            `statistika_${partnerId}_${period || 'visi'}.csv` : 
            `statistika_${period || 'visi'}.csv`;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csvContent);

    } catch (error) {
        console.error('Statistikos eksporto klaida:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Serverio klaida eksportuojant statistiką' 
        });
    }
});

export default router;
