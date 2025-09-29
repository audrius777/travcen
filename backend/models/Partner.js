import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

const router = express.Router();

// Website validation function
const validatePartnerWebsite = async (url) => {
    try {
        if (!url.startsWith('http')) url = 'https://' + url;
        const response = await axios.get(url, { 
            timeout: 5000,
            headers: {
                'User-Agent': 'Travcen-Partner-Validator/1.0'
            }
        });
        return { 
            exists: response.status === 200,
            status: response.status,
            isValid: true
        };
    } catch (error) {
        return { 
            exists: false,
            status: error.response?.status || 0,
            isValid: false,
            error: error.message
        };
    }
};

// Partner validation function
const validatePartner = async (companyName, website, email, ipAddress) => {
    const errors = [];
    
    if (!companyName || companyName.trim().length < 2) {
        errors.push('Įmonės pavadinimas privalomas ir turi būti bent 2 simboliai');
    }
    
    if (!website || !website.startsWith('http')) {
        errors.push('Svetainės adresas privalomas ir turi prasidėti http:// arba https://');
    }
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Neteisingas el. pašto adresas');
    }
    
    if (!ipAddress) {
        errors.push('IP adresas nerastas');
    }
    
    // Tikriname ar jau egzistuoja toks partneris
    try {
        const existingPartner = await mongoose.models.Partner.findOne({
            $or: [
                { email: email.toLowerCase() },
                { website: website }
            ]
        });
        
        if (existingPartner) {
            errors.push('Partneris su tokiu el. paštu ar svetaine jau egzistuoja');
        }
    } catch (dbError) {
        console.error('Duomenų bazės klaida:', dbError);
        errors.push('Sistemos klaida. Bandykite vėliau.');
    }
    
    return {
        isValid: errors.length === 0,
        error: errors.length > 0 ? errors.join(', ') : null
    };
};

// 1. Svetainės validacija (GET /api/validate-website?url=...)
router.get('/validate-website', async (req, res) => {
    try {
        const { url } = req.query;
        if (!url) {
            return res.status(400).json({ 
                success: false,
                error: 'Nenurodytas svetainės URL' 
            });
        }

        const result = await validatePartnerWebsite(url);
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Svetainės tikrinimo klaida:', error);
        res.status(500).json({ 
            success: false,
            error: 'Svetainės tikrinimo klaida' 
        });
    }
});

// 2. Partnerio registracija (POST /api/partners/register)
router.post('/partners/register', async (req, res) => {
    try {
        const { companyName, website, email, description, captchaToken } = req.body;
        const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        // CAPTCHA patikra
        if (!captchaToken) {
            return res.status(400).json({ 
                success: false,
                error: 'CAPTCHA token reikalingas' 
            });
        }

        const captchaResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            new URLSearchParams({
                secret: process.env.RECAPTCHA_SECRET_KEY,
                response: captchaToken
            })
        );

        if (!captchaResponse.data.success) {
            return res.status(400).json({ 
                success: false,
                error: 'Neteisinga CAPTCHA' 
            });
        }

        // Partnerio duomenų validacija
        const validation = await validatePartner(companyName, website, email, ipAddress);
        if (!validation.isValid) {
            return res.status(400).json({ 
                success: false,
                error: validation.error 
            });
        }

        // Išsaugojimas MongoDB kaip PendingPartner
        const newPartner = new mongoose.models.PendingPartner({
            companyName: companyName.trim(),
            website: website.trim(),
            email: email.toLowerCase().trim(),
            description: description?.trim() || '',
            contactPerson: 'Nenurodyta', // Default reikšmė
            ipAddress,
            captchaToken,
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
            return res.status(429).json({ 
                success: false,
                error: error.message 
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false,
                error: 'Partneris su tokiu el. paštu ar svetaine jau egzistuoja' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Vidinė serverio klaida' 
        });
    }
});

// 3. Aktyvių partnerių sąrašas (GET /api/partners)
router.get('/partners', async (req, res) => {
    try {
        const partners = await mongoose.models.Partner.find({ status: 'active' })
            .select('companyName website email description createdAt')
            .sort({ createdAt: -1 });
            
        res.json({
            success: true,
            data: partners,
            count: partners.length
        });
    } catch (error) {
        console.error('Partnerių gavimo klaida:', error);
        res.status(500).json({ 
            success: false,
            error: 'Serverio klaida' 
        });
    }
});

// 4. Laukiančių partnerių sąrašas su paieška (GET /api/partners/pending)
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
        
        const partners = await mongoose.models.PendingPartner.find(query)
            .select('companyName website email description requestDate')
            .sort({ requestDate: -1 });
            
        res.json({
            success: true,
            data: partners,
            count: partners.length
        });
    } catch (error) {
        console.error('Laukiančių partnerių gavimo klaida:', error);
        res.status(500).json({ 
            success: false,
            error: 'Serverio klaida' 
        });
    }
});

export default router;
