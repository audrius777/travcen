import axios from 'axios';

export async function validatePartnerWebsite(url) {
  try {
    const response = await axios.get(url, { timeout: 5000 });
    return {
      exists: true,
      isActive: response.status === 200,
      isValid: /<title>|<\/head>/i.test(response.data) // Patikrina ar tai HTML
    };
  } catch {
    return { exists: false, isActive: false };
  }
}
