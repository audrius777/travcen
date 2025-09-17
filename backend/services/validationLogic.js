import axios from 'axios';

export const validatePartner = async (companyName, website, email, ipAddress) => {
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

export const validatePartnerWebsite = async (url) => {
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
