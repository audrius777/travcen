// offers.js
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
            departureLocation,
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
            // Konvertuoti iš anglų į lietuvių kalbą
            const tripTypeMapping = {
                'Coastal Vacation': 'Pajūrio poilsis',
                'Mountain Tourism': 'Kalnų turizmas',
                'City Tourism': 'Miesto turizmas',
                'Cultural Trip': 'Kultūrinė kelionė',
                'Extreme Tourism': 'Ekstremalus turizmas',
                'Family Trip': 'Šeimos kelionė',
                'Romantic Trip': 'Romantinė kelionė',
                'Last Minute': 'Last Minute',
                'Relaxation / Beach Vacations': 'Relaxation / Beach Vacations',
                'Adventure Travel': 'Adventure Travel',
                'Last-Minute Deals': 'Last-Minute Deals',
                'Romantic Getaways': 'Romantic Getaways',
                'Family Vacations': 'Family Vacations',
                'Active / Outdoor Trips': 'Active / Outdoor Trips',
                'Wellness & Spa Retreats': 'Wellness & Spa Retreats',
                'Luxury Travel': 'Luxury Travel',
                'Eco-Friendly / Sustainable Travel': 'Eco-Friendly / Sustainable Travel',
                'Cultural Trips': 'Cultural Trips',
                'Historical Tours': 'Historical Tours',
                'Themed Trips': 'Themed Trips',
                'Solo Travel': 'Solo Travel',
                'Group Tours': 'Group Tours',
                'Business Travel': 'Business Travel',
                'Cruise Vacations': 'Cruise Vacations',
                'Mountain / Ski Trips': 'Mountain / Ski Trips',
                'Beach Holidays': 'Beach Holidays',
                'Exotic Destinations': 'Exotic Destinations'
            };
            
            const lithuanianTripType = tripTypeMapping[tripType] || tripType;
            filter.tripType = { $regex: lithuanianTripType, $options: 'i' };
        }

        // Filtravimas pagal maksimalią kainą
        if (maxPrice) {
            filter.price = { $lte: parseFloat(maxPrice) };
        }

        // Filtravimas pagal paskirties vietą
        if (destination) {
            filter.destination = { $regex: destination, $options: 'i' };
        }

        // Filtravimas pagal išvykimo vietą
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
                departureLocation
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
                error: 'All fields are required' 
            });
        }

        if (price <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Price must be a positive number' 
            });
        }

        if (new Date(validUntil) <= new Date(tripDate)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid until date must be later than trip date' 
            });
        }

        if (new Date(tripDate) < new Date()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Trip date cannot be in the past' 
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
            message: 'Offer submitted successfully!',
            offerId: newOffer._id 
        });

    } catch (error) {
        console.error('Pasiūlymo pateikimo klaida:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error submitting offer' 
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
            message: `Deleted ${result.deletedCount} expired offers` 
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
            return res.status(404).json({ success: false, error: 'Offer not found' });
        }

        if (new Date(offer.validUntil) < new Date()) {
            return res.status(404).json({ success: false, error: 'Offer has expired' });
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
                error: 'Offer not found' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Offer successfully deleted' 
        });

    } catch (error) {
        console.error('Pasiūlymo šalinimo klaida:', error);
        res.status(500).json({ 
            success: false,
            error: 'Server error deleting offer' 
        });
    }
});

export default router;t default router;
