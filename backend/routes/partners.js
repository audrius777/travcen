import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// ES modulių __dirname emuliacija
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer konfigūracija logo įkėlimui
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Leidžiami tik paveikslėlių failai'));
    }
  }
});

// reCAPTCHA v3 patikros funkcija
async function validateRecaptchaV3(token) {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    
    if (!secretKey) {
      throw new Error('RECAPTCHA_SECRET_KEY not configured');
    }

    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({
        secret: secretKey,
        response: token
      })
    );

    return {
      success: response.data.success,
      score: response.data.score || 0,
      action: response.data.action || '',
      hostname: response.data.hostname || '',
      reasons: response.data['error-codes'] || []
    };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { 
      success: false, 
      score: 0, 
      reasons: ['verification_failed'],
      error: error.message 
    };
  }
}

// Vietinės validacijos funkcijos
const validatePartnerWebsite = async (url) => {
  try {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    const response = await axios.get(formattedUrl, { 
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return { exists: response.status === 200 };
  } catch (error) {
    return { exists: false, error: 'Svetainė nepasiekiama' };
  }
};

const validatePartner = async (companyName, website, email, ipAddress) => {
  if (!companyName || !website || !email) {
    return { isValid: false, error: 'Visi laukai privalomi' };
  }
  
  // Papildoma validacijos logika
  if (companyName.length < 2 || companyName.length > 100) {
    return { isValid: false, error: 'Įmonės pavadinimas turi būti tarp 2 ir 100 simbolių' };
  }
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { isValid: false, error: 'Netinkamas el. pašto formatas' };
  }
  
  return { isValid: true };
};

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

// 2. Partnerio registracija (POST /api/partners/register) - SU V3
router.post('/partners/register', upload.single('logo'), async (req, res) => {
  try {
    const { 
      companyName, 
      website, 
      email, 
      description, 
      contactPerson,
      phone,
      address,
      city,
      country,
      services,
      specialization,
      targetAudience,
      captchaToken 
    } = req.body;
    
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    if (!captchaToken) {
      return res.status(400).json({ error: 'CAPTCHA token reikalingas' });
    }

    // CAPTCHA patikra su reCAPTCHA v3
    const captchaResult = await validateRecaptchaV3(captchaToken);
    
    if (!captchaResult.success) {
      return res.status(400).json({ 
        error: 'Neteisinga CAPTCHA',
        details: captchaResult.reasons 
      });
    }

    if (captchaResult.score < 0.5) {
      return res.status(400).json({ 
        error: 'Aptiktas didelis rizikos lygis',
        score: captchaResult.score 
      });
    }

    // Logo failo apdorojimas
    let logoPath = '';
    if (req.file) {
      logoPath = `/uploads/${req.file.filename}`;
    }

    // Partnerio duomenų validacija
    const validation = await validatePartner(companyName, website, email, ipAddress);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // Išsaugojimas MongoDB
    const newPartner = new mongoose.models.PendingPartner({
      companyName,
      website,
      email,
      description,
      contactPerson,
      phone,
      address,
      city,
      country,
      services: Array.isArray(services) ? services : JSON.parse(services || '[]'),
      specialization,
      targetAudience: Array.isArray(targetAudience) ? targetAudience : JSON.parse(targetAudience || '[]'),
      logo: logoPath,
      ipAddress,
      captchaToken,
      status: 'pending'
    });
    
    await newPartner.save();

    res.json({ success: true, message: 'Registracija sėkminga' });
  } catch (error) {
    console.error('Registracijos klaida:', error);
    
    if (error.message.includes('limit')) {
      return res.status(429).json({ error: error.message });
    }
    res.status(500).json({ error: 'Vidinė serverio klaida' });
  }
});

// 3. Aktyvių partnerių sąrašas (GET /api/partners)
router.get('/partners', async (req, res) => {
  try {
    const partners = await mongoose.models.Partner.find({ status: 'active' });
    res.json(partners);
  } catch (error) {
    console.error('Partnerių gavimo klaida:', error);
    res.status(500).json({ error: 'Serverio klaida' });
  }
});

export default router;
