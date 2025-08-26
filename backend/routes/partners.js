import express from 'express';
import mongoose from 'mongoose';
import axios from 'axios';
import { RecaptchaEnterpriseServiceClient } from '@google-cloud/recaptcha-enterprise';

const router = express.Router();

// Recaptcha Enterprise kliento inicializavimas
const recaptchaClient = new RecaptchaEnterpriseServiceClient();

// Recaptcha vertinimo funkcija
async function createAssessment(token, recaptchaAction = 'partner_registration') {
  try {
    const projectNumber = process.env.RECAPTCHA_PROJECT_NUMBER || "334159315485"; // Pakeiskite į tikrą projekto numerį
    const recaptchaKey = process.env.RECAPTCHA_SITE_KEY || "6LcbL5wrAAAAACbOLaU5S-dnUMRfJsdeiF6MhmmI";
    
    const projectPath = recaptchaClient.projectPath(projectNumber);

    // Build the assessment request.
    const request = {
      assessment: {
        event: {
          token: token,
          siteKey: recaptchaKey,
        },
      },
      parent: projectPath,
    };

    const [response] = await recaptchaClient.createAssessment(request);

    // Check if the token is valid.
    if (!response.tokenProperties.valid) {
      console.log(`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`);
      return { valid: false, reason: response.tokenProperties.invalidReason };
    }

    // Check if the expected action was executed.
    if (response.tokenProperties.action === recaptchaAction) {
      // Get the risk score and the reason(s)
      console.log(`The reCAPTCHA score is: ${response.riskAnalysis.score}`);
      if (response.riskAnalysis.reasons) {
        response.riskAnalysis.reasons.forEach((reason) => {
          console.log(reason);
        });
      }

      return { 
        valid: true, 
        score: response.riskAnalysis.score,
        reasons: response.riskAnalysis.reasons || []
      };
    } else {
      console.log("The action attribute does not match the expected action");
      return { valid: false, reason: "Action mismatch" };
    }
  } catch (error) {
    console.error('Recaptcha assessment error:', error);
    return { valid: false, reason: "Assessment error" };
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

// 2. Partnerio registracija (POST /api/partners/register)
router.post('/partners/register', async (req, res) => {
  try {
    const { company, website, email, description, captchaToken } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // CAPTCHA patikra su Recaptcha Enterprise
    const captchaAssessment = await createAssessment(captchaToken, 'partner_registration');
    
    if (!captchaAssessment.valid || captchaAssessment.score < 0.5) {
      return res.status(400).json({ error: 'Neteisinga CAPTCHA arba aukštas rizikos lygis' });
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

export default router;
