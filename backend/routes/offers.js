import express from 'express';
import mongoose from 'mongoose';
import Partner from '../models/Partner.js';

const router = express.Router();

// 1. Visų pasiūlymų gavimas su filtravimu (GET /api/offers)
router.get('/', async (req, res) => {
    try {
        const { 
            tripType, 
            maxPrice, 
            startDate, 
            endDate,
            sortBy = 'validUntil',
            sortOrder = 'asc'
        } = req.query;

        // Pagrindinis užklausos filtras
        let filter = { 
            status: 'active',
            'offers.validUntil': { $gte: new Date() } // Tik galiojantys pasiūlymai
        };

        // Filtravimas pagal kelionių tipą
        if (tripType) {
            filter['offers.tripType'] = { $regex: tripType, $options: 'i' };
        }

        // Filtravimas pagal maksimalią kainą
        if (maxPrice) {
            filter['offers.price'] = { $lte: parseFloat(maxPrice) };
        }

        // Filtravimas pagal datų intervalą
        if (startDate || endDate) {
            filter['offers.tripDate'] = {};
            if (startDate) filter['offers.tripDate'].$gte = new Date(startDate);
            if (endDate) filter['offers.tripDate'].$lte = new Date(endDate);
        }

        // Rikiavimas
        const sortOptions = {};
        sortOptions[`offers.${sortBy}`] = sortOrder === 'desc' ? -1 : 1;

        // Gauname partnerius su pasiūlymais
        const partners = await Partner.find(filter)
            .select('companyName website offers')
            .sort(sortOptions);

        // Suformatuojame pasiūlymus į vieną masyvą
        const allOffers = [];
        partners.forEach(partner => {
            partner.offers.forEach(offer => {
                // Tikriname ar pasiūlymas atitinka papildomus filtrus
                if (tripType && !offer.tripType.toLowerCase().includes(tripType.toLowerCase())) {
                    return;
                }
                if (maxPrice && offer.price > parseFloat(maxPrice)) {
                    return;
                }
                if (startDate && new Date(offer.tripDate) < new Date(startDate)) {
                    return;
                }
                if (endDate && new Date(offer.tripDate) > new Date(endDate)) {
                    return;
                }
                if (new Date(offer.validUntil) < new Date()) {
                    return; // Praleidžiame pasenusius pasiūlymus
                }

                allOffers.push({
                    _id: offer._id,
                    companyName: partner.companyName,
                    website: partner.website,
                    offerUrl: offer.offerUrl,
                    price: offer.price,
                    tripType: offer.tripType,
                    tripDate: offer.tripDate,
                    validUntil: offer.validUntil,
                    createdAt: offer.createdAt
                });
            });
        });

        // Galutinis rikiavimas
        allOffers.sort((a, b) => {
            if (sortOrder === 'desc') {
                return new Date(b[sortBy]) - new Date(a[sortBy]);
            }
            return new Date(a[sortBy]) - new Date(b[sortBy]);
        });

        res.json({
            offers: allOffers,
            total: allOffers.length,
            filters: {
                tripType,
                maxPrice,
                startDate,
                endDate
            }
        });

    } catch (error) {
        console.error('Pasiūlymų gavimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 2. Pasiūlymo pateikimas iš HTML formos (POST /api/offers/submit)
router.post('/submit', async (req, res) => {
    try {
        const { 
            companyName,
            offerUrl, 
            price, 
            tripType, 
            tripDate, 
            validUntil 
        } = req.body;

        // Validacija
        if (!companyName || !offerUrl || !price || !tripType || !tripDate || !validUntil) {
            return res.status(400).json({ 
                success: false, 
                error: 'Visi laukai yra privalomi' 
            });
        }

        if (price <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Kaina turi būti teigiamas skaičius' 
            });
        }

        if (new Date(validUntil) <= new Date(tripDate)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Galiojimo data turi būti vėlesnė už kelionės datą' 
            });
        }

        if (new Date(tripDate) < new Date()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Kelionės data negali būti praeityje' 
            });
        }

        // Randame arba sukuriame partnerį
        let partner = await Partner.findOne({ 
            companyName: { $regex: companyName, $options: 'i' } 
        });

        if (!partner) {
            // Sukuriame naują partnerį jei neegzistuoja
            partner = new Partner({
                companyName: companyName,
                website: offerUrl, // Naudojame offerUrl kaip laikiną website
                email: `temp-${Date.now()}@${companyName.toLowerCase().replace(/\s+/g, '-')}.com`,
                contactPerson: 'Formos pateikėjas',
                description: 'Automatiškai sukurtas iš HTML formos',
                ipAddress: req.ip || 'unknown',
                status: 'active'
            });
        }

        // Pridedame pasiūlymą
        partner.offers.push({
            offerUrl,
            price: parseFloat(price),
            tripType,
            tripDate: new Date(tripDate),
            validUntil: new Date(validUntil)
        });

        await partner.save();

        res.json({ 
            success: true, 
            message: 'Pasiūlymas sėkmingai pateiktas ir atsiras svetainėje',
            offerId: partner.offers[partner.offers.length - 1]._id
        });

    } catch (error) {
        console.error('Pasiūlymo pateikimo klaida:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Serverio klaida pateikiant pasiūlymą' 
        });
    }
});

// 3. Automatinis pasenusių pasiūlymų šalinimas (POST /api/offers/cleanup)
router.post('/cleanup', async (req, res) => {
    try {
        const currentDate = new Date();
        
        // Atliekame šalinimą visuose partneriuose
        const result = await Partner.updateMany(
            { 'offers.validUntil': { $lt: currentDate } },
            { $pull: { offers: { validUntil: { $lt: currentDate } } } }
        );

        res.json({
            success: true,
            message: `Pašalinti pasenę pasiūlymai`,
            deletedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Pasiūlymų valymo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 4. Pasiūlymo informacijos gavimas (GET /api/offers/:offerId)
router.get('/:offerId', async (req, res) => {
    try {
        const { offerId } = req.params;

        // Randame partnerį, kuris turi šį pasiūlymą
        const partner = await Partner.findOne({ 
            'offers._id': new mongoose.Types.ObjectId(offerId) 
        }).select('companyName website offers');

        if (!partner) {
            return res.status(404).json({ error: 'Pasiūlymas nerastas' });
        }

        // Randame konkretų pasiūlymą
        const offer = partner.offers.id(offerId);
        
        if (!offer || new Date(offer.validUntil) < new Date()) {
            return res.status(404).json({ error: 'Pasiūlymas nerastas arba nebegalioja' });
        }

        res.json({
            _id: offer._id,
            companyName: partner.companyName,
            website: partner.website,
            offerUrl: offer.offerUrl,
            price: offer.price,
            tripType: offer.tripType,
            tripDate: offer.tripDate,
            validUntil: offer.validUntil,
            createdAt: offer.createdAt
        });

    } catch (error) {
        console.error('Pasiūlymo gavimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

export default router;
[file content end]
