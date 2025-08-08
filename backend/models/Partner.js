import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';

const validatePartnerWebsite = async (url) => {
  try {
    if (!url.startsWith('http')) url = 'http://' + url;
    const response = await axios.get(url, { timeout: 5000 });
    return { exists: response.status === 200 };
  } catch {
    return { exists: false };
  }
};

const validatePartner = async (company, website, email, ipAddress) => {
  // Implement your partner validation logic here
  // For now returning a default valid response
  return { isValid: true };
};

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
    const { company, website, email, description, captchaToken } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // CAPTCHA patikra
    const captchaResponse = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: captchaToken
      })
    );

    if (!captchaResponse.data.success) {
      return res.status(400).json({ error: 'Neteisinga CAPTCHA' });
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

    res.json({ success: true });
  } catch (error) {
    console.error('Registracijos klaida:', error);
    
    if (error.message.includes('limit')) {
      return res.status(429).json({ error: error.message });
    }
    res.status(400).json({ error: error.message || 'Registracijos klaida' });
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

// 4. Laukiančių partnerių sąrašas (GET /api/partners/pending)
router.get('/pending', async (req, res) => {
  try {
    const partners = await mongoose.models.PendingPartner.find({ status: 'pending' });
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: 'Serverio klaida' });
  }
});

// 5. Partnerio patvirtinimas/atmetimas (POST /api/partners/verify/:id)
router.post('/verify/:id', async (req, res) => {
  try {
    const partner = await mongoose.models.PendingPartner.findById(req.params.id);
    if (!partner) return res.status(404).json({ error: 'Partneris nerastas' });
    
    partner.status = req.body.action === 'approve' ? 'approved' : 'rejected';
    await partner.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Serverio klaida' });
  }
});

export default router;
