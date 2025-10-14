[file name]: offers.js
[file content begin]
import express from 'express';
import mongoose from 'mongoose';
import Offer from '../models/Offer.js';
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
            destination,
            departureLocation, // 👈 PRIDĖTA - išvykimo vieta
            sortBy = 'validUntil',
            sortOrder = 'asc'
        } = req.query;

        // Pagrindinis užklausos filtras
        let filter = { 
            status: 'active',
            validUntil: { $gte: new Date() } // Tik galiojantys pasiūlymai
        };

        // Filtravimas pagal kelionių tipą
        if (tripType) {
            filter.tripType = { $regex: tripType, $options: 'i' };
        }

        // Filtravimas pagal maksimalią kainą
        if (maxPrice) {
            filter.price = { $lte: parseFloat(maxPrice) };
        }

        // Filtravimas pagal paskirties vietą
        if (destination) {
            filter.destination = { $regex: destination, $options: 'i' };
        }

        // 👇 PRIDĖTA - Filtravimas pagal išvykimo vietą
        if (departureLocation) {
            filter.departureLocation = { $regex: departureLocation, $options: 'i' };
        }

        // Filtravimas pagal datų intervalą
        if (startDate || endDate) {
            filter.tripDate = {};
            if (startDate) filter.tripDate.$gte = new Date(startDate);
            if (endDate) filter.tripDate.$lte = new Date(endDate);
        }

        // Rikiavimas
        const sortOptions = {};
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Gauname pasiūlymus
        const offers = await Offer.find(filter)
            .sort(sortOptions);

        res.json({
            success: true,
            offers: offers,
            total: offers.length,
            filters: {
                tripType,
                maxPrice,
                startDate,
                endDate,
                destination,
                departureLocation // 👈 PRIDĖTA
            }
        });

    } catch (error) {
        console.error('Pasiūlymų gavimo klaida:', error);
        res.status(500).json({ success: false, error: 'Serverio klaida' });
    }
});

// 2. Pasiūlymo pateikimas iš HTML formos (POST /api/offers/submit)
router.post('/submit', async (req, res) => {
    try {
        const { 
            partnerId,
            companyName,
            offerUrl, 
            departureLocation,
            destination,
            tripType, 
            price, 
            hotelRating,
            tripDate, 
            validUntil
        } = req.body;

        // Validacija
        if (!partnerId || !companyName || !offerUrl || !departureLocation || 
            !destination || !tripType || !price || !hotelRating || !tripDate || !validUntil) {
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

        // Sukurti naują pasiūlymą
        const newOffer = new Offer({
            partnerId,
            companyName,
            offerUrl,
            departureLocation,
            destination,
            tripType,
            price: parseFloat(price),
            hotelRating: parseInt(hotelRating),
            tripDate: new Date(tripDate),
            validUntil: new Date(validUntil),
            status: 'active'
        });

        await newOffer.save();

        res.json({ 
            success: true, 
            message: 'Pasiūlymas sėkmingai pateiktas!',
            offerId: newOffer._id 
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
        const result = await Offer.deleteMany({ 
            validUntil: { $lt: new Date() } 
        });

        res.json({ 
            success: true, 
            message: `Pašalinta ${result.deletedCount} pasenusių pasiūlymų` 
        });
    } catch (error) {
        console.error('Pasiūlymų valymo klaida:', error);
        res.status(500).json({ success: false, error: 'Serverio klaida' });
    }
});

// 4. Pasiūlymo informacijos gavimas (GET /api/offers/:offerId)
router.get('/:offerId', async (req, res) => {
    try {
        const { offerId } = req.params;

        const offer = await Offer.findById(offerId);
        
        if (!offer) {
            return res.status(404).json({ success: false, error: 'Pasiūlymas nerastas' });
        }

        if (new Date(offer.validUntil) < new Date()) {
            return res.status(404).json({ success: false, error: 'Pasiūlymas nebegalioja' });
        }

        res.json({
            success: true,
            offer: offer
        });

    } catch (error) {
        console.error('Pasiūlymo gavimo klaida:', error);
        res.status(500).json({ success: false, error: 'Serverio klaida' });
    }
});

// 5. Pasiūlymo šalinimas (DELETE /api/offers/:offerId)
router.delete('/:offerId', async (req, res) => {
    try {
        const { offerId } = req.params;

        const result = await Offer.findByIdAndDelete(offerId);
        
        if (!result) {
            return res.status(404).json({ 
                success: false,
                error: 'Pasiūlymas nerastas' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Pasiūlymas sėkmingai pašalintas' 
        });

    } catch (error) {
        console.error('Pasiūlymo šalinimo klaida:', error);
        res.status(500).json({ 
            success: false,
            error: 'Serverio klaida šalinant pasiūlymą' 
        });
    }
});

export default router;
[file content end]
