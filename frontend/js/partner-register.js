document.getElementById('partnerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    company: e.target.company.value,
    website: e.target.website.value,
    email: e.target.email.value
  };

  // 1. Tikriname svetainę
  const { exists } = await fetch(`/api/validate-website?url=${formData.website}`)
    .then(res => res.json());

  if (!exists) {
    alert('Svetainė neegzistuoja arba nepasiekiama!');
    return;
  }

  // 2. Siunčiame duomenis
  const response = await fetch('/api/partners/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });

  if (response.ok) {
    alert('Užklausa išsiųsta! Administratorius susisieks per 24 val.');
    e.target.reset();
  }
});
