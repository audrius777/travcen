import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

const router = express.Router();

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
    const response = await axios.get(
      url.startsWith('http') ? url : `http://${url}`,
      { timeout: 5000 }
    );
    return { exists: response.status === 200 };
  } catch {
    return { exists: false };
  }
};

const validatePartner = async (company, website, email, ipAddress) => {
  if (!company || !website || !email) {
    return { isValid: false, error: 'Privalomi laukai neužpildyti' };
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
router.post('/partners/register', async (req, res) => {
  try {
    const { company, website, email, description, captchaToken } = req.body;
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

    // Partnerio duomenų validacija
    const validation = await validatePartner(company, website, email, ipAddress);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // Išsaugojimas MongoDB
    const newPartner = new mongoose.models.PendingPartner({
      company,
      website,
      email,
      description,
      ipAddress,
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
