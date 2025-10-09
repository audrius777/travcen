import express from 'express';
import mongoose from 'mongoose';
import { validatePartner, validatePartnerWebsite } from '../services/validationLogic.js';
import PendingPartner from '../models/PendingPartner.js';
import Partner from '../models/Partner.js';

const router = express.Router();

// 1. Svetainės validacija (GET /api/validate-website?url=...)
router.get('/validate-website', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'Nenurodytas svetainės URL' });
        }

        const result = await validatePartnerWebsite(url);
        res.json(result);
    } catch (error) {
        console.error('Svetainės tikrinimo klaida:', error);
        res.status(500).json({ error: 'Svetainės tikrinimo klaida' });
    }
});

// 2. Partnerio registracija (POST /api/partners/register)
router.post('/register', async (req, res) => {
    try {
        const { 
            companyName, 
            website, 
            email, 
            contactPerson,
            description
        } = req.body;
        
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // Partnerio duomenų validacija
        const validation = await validatePartner(companyName, website, email, ipAddress);
        if (!validation.isValid) {
            return res.status(400).json({ error: validation.error });
        }

        // Išsaugojimas MongoDB
        const newPartner = new PendingPartner({
            companyName,
            website,
            email,
            contactPerson,
            description: description || '',
            ipAddress,
            status: 'pending'
        });
        
        await newPartner.save();

        res.json({ 
            success: true, 
            message: 'Registracija sėkmingai gauta. Susisieksime su jumis el. paštu.' 
        });

    } catch (error) {
        console.error('Registracijos klaida:', error);
        
        if (error.message.includes('limit')) {
            return res.status(429).json({ error: error.message });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Partneris su tokiu el. paštu ar svetaine jau egzistuoja' });
        }
        
        res.status(500).json({ error: 'Vidinė serverio klaida' });
    }
});

// 3. Aktyvių partnerių sąrašas (GET /api/partners) - PATAISYTA KLAIDA
router.get('/', async (req, res) => {
    try {
        const partners = await Partner.find({ status: 'active' })
            .select('companyName website email contactPerson description slug offerFormUrl')
            .sort({ createdAt: -1 });
        
        // Jei nėra aktyvių partnerių, grąžiname tuščią masyvą
        res.json(partners);
        
    } catch (error) {
        console.error('Partnerių gavimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 4. Laukiančių partnerių sąrašas (GET /api/partners/pending)
router.get('/pending', async (req, res) => {
    try {
        const { search } = req.query;
        const query = { status: 'pending' };
        
        if (search) {
            query.$or = [
                { companyName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { website: { $regex: search, $options: 'i' } }
            ];
        }
        
        const partners = await PendingPartner.find(query)
            .select('companyName website email contactPerson description requestDate slug')
            .sort({ requestDate: -1 });
            
        res.json(partners);
    } catch (error) {
        console.error('Laukiančių partnerių gavimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 5. Partnerio patvirtinimas (PUT /api/partners/:id/approve)
router.put('/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        
        const pendingPartner = await PendingPartner.findById(id);
        if (!pendingPartner) {
            return res.status(404).json({ error: 'Partneris nerastas' });
        }

        // Sukuriamas naujas aktyvus partneris
        const newPartner = new Partner({
            companyName: pendingPartner.companyName,
            website: pendingPartner.website,
            email: pendingPartner.email,
            contactPerson: pendingPartner.contactPerson,
            description: pendingPartner.description,
            ipAddress: pendingPartner.ipAddress,
            slug: pendingPartner.slug,
            status: 'active'
        });

        await newPartner.save();
        
        // Pašalinamas iš laukiančių
        await PendingPartner.findByIdAndDelete(id);

        res.json({ 
            success: true, 
            message: 'Partneris sėkmingai patvirtintas',
            partner: newPartner 
        });

    } catch (error) {
        console.error('Partnerio patvirtinimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 6. Partnerio atmetimas (DELETE /api/partners/:id/reject)
router.delete('/:id/reject', async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const partner = await PendingPartner.findByIdAndDelete(id);
        
        if (!partner) {
            return res.status(404).json({ error: 'Partneris nerastas' });
        }

        res.json({ 
            success: true, 
            message: 'Partnerio užklausa atmesta',
            reason: reason || 'Nenurodyta priežastis'
        });

    } catch (error) {
        console.error('Partnerio atmetimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 7. HTML formos generavimas partneriui (GET /api/partners/:id/generate-form)
router.get('/:id/generate-form', async (req, res) => {
    try {
        const { id } = req.params;
        
        const partner = await Partner.findById(id);
        if (!partner) {
            return res.status(404).json({ error: 'Partneris nerastas' });
        }

        // Generuojame unikalų formos URL
        const formSlug = `partner-form-${partner.slug}-${Date.now()}`;
        const offerFormUrl = `/partner-forms/${formSlug}.html`;

        // Atnaujiname partnerio duomenis
        partner.offerFormUrl = offerFormUrl;
        await partner.save();

        res.json({ 
            success: true, 
            offerFormUrl,
            message: 'HTML forma sėkmingai sugeneruota'
        });

    } catch (error) {
        console.error('Formos generavimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 8. Pasiūlymų gavimas pagal partnerį (GET /api/partners/:id/offers)
router.get('/:id/offers', async (req, res) => {
    try {
        const { id } = req.params;
        
        const partner = await Partner.findById(id).select('offers companyName');
        if (!partner) {
            return res.status(404).json({ error: 'Partneris nerastas' });
        }

        res.json({ 
            offers: partner.offers,
            companyName: partner.companyName
        });

    } catch (error) {
        console.error('Pasiūlymų gavimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 9. Pasiūlymo pridėjimas partneriui (POST /api/partners/:id/offers)
router.post('/:id/offers', async (req, res) => {
    try {
        const { id } = req.params;
        const { offerUrl, price, tripType, tripDate, validUntil } = req.body;
        
        const partner = await Partner.findById(id);
        if (!partner) {
            return res.status(404).json({ error: 'Partneris nerastas' });
        }

        // Pridedame naują pasiūlymą
        partner.offers.push({
            offerUrl,
            price,
            tripType,
            tripDate: new Date(tripDate),
            validUntil: new Date(validUntil)
        });

        await partner.save();

        res.json({ 
            success: true, 
            message: 'Pasiūlymas sėkmingai pridėtas'
        });

    } catch (error) {
        console.error('Pasiūlymo pridėjimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 10. Pasiūlymo šalinimas (DELETE /api/partners/:partnerId/offers/:offerId)
router.delete('/:partnerId/offers/:offerId', async (req, res) => {
    try {
        const { partnerId, offerId } = req.params;
        
        const partner = await Partner.findById(partnerId);
        if (!partner) {
            return res.status(404).json({ error: 'Partneris nerastas' });
        }

        // Pašaliname pasiūlymą iš masyvo
        partner.offers = partner.offers.filter(offer => offer._id.toString() !== offerId);
        await partner.save();

        res.json({ 
            success: true, 
            message: 'Pasiūlymas sėkmingai pašalintas'
        });

    } catch (error) {
        console.error('Pasiūlymo šalinimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

export default router;
