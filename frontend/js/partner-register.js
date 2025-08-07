document.getElementById('partnerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    company: e.target.company.value.trim(),
    website: e.target.website.value.trim(),
    email: e.target.email.value.trim()
  };

  // 1. Tikriname svetainę (dabar naudojant lokalų API)
  const { exists } = await fetch(`/validate-website?url=${encodeURIComponent(formData.website)}`)
    .then(res => res.json())
    .catch(() => ({ exists: false }));

  if (!exists) {
    alert('Svetainė neegzistuoja arba nepasiekiama!');
    return;
  }

  // 2. Siunčiame duomenis (su IP sekimu ir apsauga nuo dublikatų)
  try {
    const ip = await fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => data.ip)
      .catch(() => 'unknown');

    const response = await fetch('/partners/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        ipAddress: ip
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Serverio klaida');
    }

    alert('Užklausa išsiųsta! Administratorius susisieks per 24 val.');
    e.target.reset();
  } catch (error) {
    console.error('Registracijos klaida:', error);
    alert(`Klaida: ${error.message}`);
  }
});
