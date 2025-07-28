document.addEventListener("DOMContentLoaded", () => {
  // ... ESAMAS KODAS LIEKA TOKS PATS ...

  // 4. Partnerių puslapio specifinė logika
  if (document.body.classList.contains('partner-page')) {
    initPartnerPage();
  }
});

// ... ESAMA filterCards() FUNKCIJA LIEKA TOKS PATI ...

/*  PAPILDOMOS FUNKCIJOS PARTNERIŲ PUSLAPIUI  */
function initPartnerPage() {
  // A) Užkraunam partnerių sąrašą
  loadPartnerList();
  
  // B) Pridedam papildomą filtravimą
  const partnerFilter = document.getElementById('partner-filter');
  if (partnerFilter) {
    partnerFilter.addEventListener('change', applyPartnerFilter);
  }
}

async function loadPartnerList() {
  try {
    const response = await fetch('/api/partners');
    const partners = await response.json();
    const filter = document.getElementById('partner-filter');
    
    if (!filter) return;
    
    // Išvalome ir užpildome filtrą
    filter.innerHTML = '<option value="all">Visi partneriai</option>';
    partners.forEach(partner => {
      const option = document.createElement('option');
      option.value = partner.id;
      option.textContent = partner.name;
      filter.appendChild(option);
    });
  } catch (error) {
    console.error('Nepavyko įkelti partnerių:', error);
  }
}

function applyPartnerFilter() {
  const partnerId = this.value;
  const cards = document.querySelectorAll('.card');
  
  cards.forEach(card => {
    if (partnerId === 'all' || card.dataset.partner === partnerId) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}
