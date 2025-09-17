import axios from 'axios';

export async function validateRecaptchaV3(token) {
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
