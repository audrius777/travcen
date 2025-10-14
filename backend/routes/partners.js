import express from 'express';
import mongoose from 'mongoose';
import Partner from '../models/Partner.js';
import Offer from '../models/Offer.js';

const router = express.Router();

// 1. Svetainės validacija (GET /api/partners/validate-website?url=...)
router.get('/validate-website', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ error: 'Nenurodytas svetainės URL' });
        }

        // Paprasta validacija - tikriname ar URL atitinka formatą
        const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
        
        if (!urlRegex.test(url)) {
            return res.json({ 
                isValid: false, 
                error: 'Netinkamas URL formatas' 
            });
        }

        res.json({ 
            isValid: true, 
            message: 'Svetainė atitinka reikalavimus' 
        });

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

        // Validacija
        if (!companyName || !website || !email || !contactPerson) {
            return res.status(400).json({ error: 'Visi privalomi laukai turi būti užpildyti' });
        }

        // Patikrinti, ar partneris jau egzistuoja
        const existingPartner = await Partner.findOne({ 
            $or: [{ email }, { website }] 
        });

        if (existingPartner) {
            return res.status(400).json({ error: 'Partneris su tokiu el. paštu ar svetaine jau egzistuoja' });
        }

        // Sugeneruoti unikalų partnerio ID
        const partnerId = 'PART' + Date.now().toString().slice(-8);

        // Sukurti naują partnerį
        const newPartner = new Partner({
            partnerId,
            companyName,
            website,
            email,
            contactPerson,
            description: description || '',
            status: 'pending',
            ipAddress: req.ip || 'unknown'
        });

        await newPartner.save();

        res.json({ 
            success: true, 
            message: 'Registracija sėkmingai gauta. Susisieksime su jumis el. paštu.',
            partnerId 
        });

    } catch (error) {
        console.error('Partnerio registracijos klaida:', error);
        
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Partneris su tokiu el. paštu ar svetaine jau egzistuoja' });
        }
        
        res.status(500).json({ error: 'Vidinė serverio klaida' });
    }
});

// 3. Visų partnerių gavimas (GET /api/partners)
router.get('/', async (req, res) => {
    try {
        const partners = await Partner.find().sort({ createdAt: -1 });
        res.json({ success: true, partners });
    } catch (error) {
        console.error('Partnerių gavimo klaida:', error);
        res.status(500).json({ success: false, error: 'Serverio klaida' });
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
        
        const partners = await Partner.find(query).sort({ createdAt: -1 });
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
        
        const partner = await Partner.findById(id);
        if (!partner) {
            return res.status(404).json({ error: 'Partneris nerastas' });
        }

        partner.status = 'active';
        await partner.save();

        res.json({ 
            success: true, 
            message: 'Partneris sėkmingai patvirtintas',
            partner 
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

        const partner = await Partner.findByIdAndDelete(id);
        
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

// 7. Partnerio šalinimas (DELETE /api/partners/:id)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await Partner.findByIdAndDelete(id);
        
        if (!result) {
            return res.status(404).json({ success: false, error: 'Partneris nerastas' });
        }

        res.json({ success: true, message: 'Partneris sėkmingai pašalintas' });
    } catch (error) {
        console.error('Partnerio šalinimo klaida:', error);
        res.status(500).json({ success: false, error: 'Serverio klaida' });
    }
});

// 8. Partnerio informacijos gavimas (GET /api/partners/:id)
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const partner = await Partner.findById(id);
        
        if (!partner) {
            return res.status(404).json({ success: false, error: 'Partneris nerastas' });
        }

        res.json({ success: true, partner });
    } catch (error) {
        console.error('Partnerio gavimo klaida:', error);
        res.status(500).json({ success: false, error: 'Serverio klaida' });
    }
});

// 9. HTML formos generavimas partneriui (GET /api/partners/:id/generate-form)
router.get('/:id/generate-form', async (req, res) => {
    try {
        const { id } = req.params;
        
        const partner = await Partner.findById(id);
        if (!partner) {
            return res.status(404).json({ error: 'Partneris nerastas' });
        }

        // Generuojame unikalų formos URL
        const formSlug = `partner-form-${partner.partnerId}-${Date.now()}`;
        const offerFormUrl = `/partner-form.html?partnerId=${partner.partnerId}`;

        res.json({ 
            success: true, 
            offerFormUrl,
            message: 'Formos nuoroda sėkmingai sugeneruota'
        });

    } catch (error) {
        console.error('Formos generavimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 10. Pasiūlymų gavimas pagal partnerį (GET /api/partners/:id/offers)
router.get('/:id/offers', async (req, res) => {
    try {
        const { id } = req.params;
        
        const partner = await Partner.findById(id);
        if (!partner) {
            return res.status(404).json({ error: 'Partneris nerastas' });
        }

        // Gauname pasiūlymus iš Offer kolekcijos
        const offers = await Offer.find({ partnerId: partner.partnerId });

        res.json({ 
            success: true,
            offers: offers,
            companyName: partner.companyName
        });

    } catch (error) {
        console.error('Pasiūlymų gavimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

export default router;
