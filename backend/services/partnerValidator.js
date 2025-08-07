import axios from 'axios';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Riboti užklausas nuo to paties IP (5 bandymai per minutę)
const limiter = new RateLimiterMemory({
  points: 5,
  duration: 60
});

export async function validatePartner(company, website, email, ip) {
  try {
    // 1. RIBOJIMAS: IP/email dublikatai
    await limiter.consume(ip);

    // 2. SVETAINĖS TIKRINIMAS
    const websiteResponse = await axios.get(website, { 
      timeout: 5000,
      headers: { 'User-Agent': 'TravCen-Partner-Verification/1.0' }
    });

    // 3. ĮMONĖS TIKRINIMAS (ar svetainėje minima įmonė)
    const companyExists = websiteResponse.data.includes(company);
    if (!companyExists) {
      throw new Error('Įmonė nerasta nurodytoje svetainėje');
    }

    // 4. DUBLIKATŲ PATIKRA (MongoDB)
    const existingPartner = await PendingPartner.findOne({ 
      $or: [{ email }, { website }] 
    });
    if (existingPartner) {
      throw new Error('Užklausa jau išsiųsta su šiuo email/svetaine');
    }

    return { 
      isValid: true,
      isActive: websiteResponse.status === 200,
      isCompanyVerified: companyExists
    };
  } catch (error) {
    console.error('Validacijos klaida:', error);
    return { 
      isValid: false, 
      error: error.message,
      isActive: false,
      isCompanyVerified: false
    };
  }
}
