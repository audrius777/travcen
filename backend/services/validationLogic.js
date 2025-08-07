export const validatePartner = async (company, website, email, ipAddress) => {
  // Jūsų validacijos logika čia
  // Pavyzdys:
  if (!company || !website || !email) {
    return { isValid: false, error: 'Visi laukai privalomi' };
  }
  return { isValid: true };
};

export const validatePartnerWebsite = async (url) => {
  // Svetainės validacijos logika čia
  // Pavyzdys:
  try {
    const response = await axios.get(url);
    return { isValid: response.status === 200 };
  } catch (error) {
    return { isValid: false, error: 'Svetainė nepasiekiama' };
  }
};
