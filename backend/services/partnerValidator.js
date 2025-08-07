import express from 'express';
import axios from 'axios';
import { validatePartner, validatePartnerWebsite } from '../services/partnerValidator.js';
import { PendingPartner } from '../models/index.js';

const router = express.Router();

// GET /api/validate-website?url=...
router.get('/validate-website', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parametras privalomas' });
    }

    const result = await validatePartnerWebsite(url);
    res.json(result);
  } catch (error) {
    console.error('Svetainės validacijos klaida:', error);
    res.status(500).json({ error: 'Vidinė serverio klaida' });
  }
});

// POST /api/partners/register
router.post('/partners/register', async (req, res) => {
  try {
    const { company, website, email, description, captchaToken } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // 1. CAPTCHA patikra
    const captchaResponse = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
    );
    
    if (!captchaResponse.data.success) {
      return res.status(400).json({ error: 'Neteisinga CAPTCHA' });
    }

    // 2. Partnerio validacija
    const validation = await validatePartner(company, website, email, ipAddress);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // 3. Išsaugojimas
    const newPartner = new PendingPartner({
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
    
    if (error.message.includes('Viršytas bandymų limitas')) {
      return res.status(429).json({ error: error.message });
    }
    
    res.status(400).json({ error: error.message || 'Registracijos klaida' });
  }
});

export default router;
