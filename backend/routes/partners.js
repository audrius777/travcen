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
router.post('/partners/register', async (req, res) => {
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

// 3. Aktyvių partnerių sąrašas (GET /api/partners)
router.get('/partners', async (req, res) => {
    try {
        const partners = await Partner.find({ status: 'active' })
            .select('companyName website email contactPerson description')
            .sort({ createdAt: -1 });
        
        // Jei nėra aktyvių partnerių, grąžiname tuščią masyvą
        // NEgrąžiname mock duomenų
        res.json(partners);
        
    } catch (error) {
        console.error('Partnerių gavimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 4. Laukiančių partnerių sąrašas (GET /api/partners/pending)
router.get('/partners/pending', async (req, res) => {
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
            .select('companyName website email contactPerson description requestDate')
            .sort({ requestDate: -1 });
            
        res.json(partners);
    } catch (error) {
        console.error('Laukiančių partnerių gavimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 5. Partnerio patvirtinimas (PUT /api/partners/:id/approve)
router.put('/partners/:id/approve', async (req, res) => {
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
router.delete('/partners/:id/reject', async (req, res) => {
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

// 7. Admin - visų laukiančių partnerių sąrašas (GET /api/admin/pending-partners)
router.get('/admin/pending-partners', async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const query = { status: 'pending' };
        
        if (search) {
            query.$or = [
                { companyName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { website: { $regex: search, $options: 'i' } }
            ];
        }
        
        const partners = await PendingPartner.find(query)
            .select('companyName website email contactPerson description requestDate ipAddress attempts')
            .sort({ requestDate: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await PendingPartner.countDocuments(query);
            
        res.json({ 
            partners,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Admin laukiančių partnerių gavimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 8. Admin - partnerio patvirtinimas (PUT /api/admin/partners/:id/approve)
router.put('/admin/partners/:id/approve', async (req, res) => {
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
        console.error('Admin partnerio patvirtinimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 9. Admin - partnerio atmetimas (DELETE /api/admin/partners/:id/reject)
router.delete('/admin/partners/:id/reject', async (req, res) => {
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
        console.error('Admin partnerio atmetimo klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

// 10. Partnerių statistika (GET /api/partners/stats)
router.get('/partners/stats', async (req, res) => {
    try {
        const totalActive = await Partner.countDocuments({ status: 'active' });
        const totalPending = await PendingPartner.countDocuments({ status: 'pending' });
        const totalRejected = await PendingPartner.countDocuments({ status: 'rejected' });
        
        // Paskutinių 7 dienų registracijos
        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);
        
        const recentRegistrations = await PendingPartner.countDocuments({
            requestDate: { $gte: lastWeek }
        });

        res.json({
            totalActive,
            totalPending,
            totalRejected,
            recentRegistrations,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Partnerių statistikos klaida:', error);
        res.status(500).json({ error: 'Serverio klaida' });
    }
});

export default router;
