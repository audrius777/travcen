const API_BASE_URL = 'https://travcen.onrender.com/api'; // Pakeista į teisingą URL
const RECAPTCHA_SITE_KEY = '6LcbL5wrAAAAACbOLaU5S-dnUMRfJsdeiF6MhmmI';

// Mock partnerių duomenys atsarginiam variantui
const MOCK_PARTNERS = [
  {
    id: 1,
    company: "Travel Agency LT",
    departure: "Vilnius",
    destination: "Greece",
    price: 299,
    type: "leisure",
    imageUrl: "https://source.unsplash.com/280x180/?greece",
    partnerUrl: "https://travel-lt.com"
  },
  {
    id: 2,
    company: "Baltic Tours",
    departure: "Kaunas",
    destination: "Alps",
    price: 499,
    type: "adventure",
    imageUrl: "https://source.unsplash.com/280x180/?alps",
    partnerUrl: "https://baltictours.com"
  },
  {
    id: 3,
    company: "Euro Adventures",
    departure: "Riga",
    destination: "Spain",
    price: 399,
    type: "cultural",
    imageUrl: "https://source.unsplash.com/280x180/?spain",
    partnerUrl: "https://euroadventures.com"
  }
];

// Paprastesnė reCAPTCHA įkėlimo funkcija
function loadRecaptcha() {
  return new Promise((resolve) => {
    if (window.grecaptcha && window.grecaptcha.execute) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('reCAPTCHA sėkmingai įkelta');
      resolve();
    };

    script.onerror = () => {
      console.warn('Nepavyko įkelti reCAPTCHA, naudojamas testavimo režimas');
      resolve(); // Išsprendžiama net ir su klaida
    };

    document.head.appendChild(script);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadPartners();

  // Modalų valdymas - SPECIFINIS PARTNERIO MODALO VALDYMAS
  const partnerModal = document.getElementById("partner-modal");
  const partnerLink = document.getElementById("footer-partner");
  const partnerCloseBtn = partnerModal ? partnerModal.querySelector(".close") : null;

  if (partnerLink) {
    partnerLink.addEventListener("click", (e) => {
      e.preventDefault();
      partnerModal.style.display = "block";
    });
  }

  if (partnerCloseBtn) {
    partnerCloseBtn.addEventListener("click", () => {
      partnerModal.style.display = "none";
    });
  }

  if (partnerModal) {
    window.addEventListener("click", (e) => {
      if (e.target === partnerModal) {
        partnerModal.style.display = "none";
      }
    });
  }

  // Paieškos funkcijos priskyrimas
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", filterCards);
  }

  // Partnerio registracijos formos valdymas
  const partnerForm = document.getElementById('partner-form');
  if (partnerForm) {
    partnerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = {
        company: document.getElementById('modal-company').value.trim(),
        website: document.getElementById('modal-website').value.trim(),
        email: document.getElementById('modal-email').value.trim(),
        description: document.getElementById('modal-description').value.trim()
      };

      // Validacija
      if (!formData.company || !formData.website || !formData.email) {
        alert('Užpildykite privalomus laukus: įmonė, svetainė ir el. paštas');
        return;
      }

      try {
        // Įkelti reCAPTCHA
        await loadRecaptcha();
        
        // Gauti reCAPTCHA token
        let captchaToken = 'test-token-demo-mode';
        
        if (window.grecaptcha && window.grecaptcha.execute) {
          try {
            captchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { 
              action: 'partner_submit' 
            });
            console.log('reCAPTCHA token gautas:', captchaToken);
          } catch (error) {
            console.warn('reCAPTCHA klaida, naudojamas test token:', error);
          }
        }

        // Siųsti duomenis
        const response = await fetch(`${API_BASE_URL}/partners/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            captchaToken
          })
        });

        if (response.ok) {
          alert('Užklausa išsiųsta! Administratorius susisieks per 24 val.');
          partnerModal.style.display = 'none';
          partnerForm.reset();
        } else {
          // Jei serveris neveikia, parodyti pranešimą
          if (response.status === 502) {
            alert('Registracija laikinai neveikia. Prašome bandyti vėliau arba susisiekti tiesiogiai.');
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Serverio klaida');
          }
        }

      } catch (error) {
        console.error('Klaida:', error);
        alert(`Registracija nepavyko: ${error.message || 'Bandykite vėliau.'}`);
      }
    });
  }
});

// Partnerių užkrovimas su atsarginiu variantu
async function loadPartners() {
  try {
    console.log('Bandome užkrauti partnerius iš:', API_BASE_URL + '/partners');
    
    const response = await fetch(`${API_BASE_URL}/partners`, {
      // Pridedame timeout
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP klaida! status: ${response.status}`);
    }
    
    const partners = await response.json();
    renderCards(partners);
    
  } catch (error) {
    console.warn("Klaida užkraunant partnerius, naudojami mock duomenys:", error);
    
    // Atvaizduoti mock duomenis
    renderCards(MOCK_PARTNERS);
    
    // Rodyti informatyvų pranešimą
    const container = document.getElementById("card-list");
    if (container) {
      const warning = document.createElement('div');
      warning.className = 'info-message';
      warning.innerHTML = `
        <p>⚠ Demo data shown. Real offers temporarily unavailable..</p>
        <p><small>Klaida: ${error.message}</small></p>
      `;
      container.parentNode.insertBefore(warning, container);
    }
  }
}

// Kortelių generavimas
function renderCards(partners) {
  const container = document.getElementById('card-list');
  if (!container) return;

  container.innerHTML = '';

  partners.forEach(partner => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = partner.id;
    card.dataset.from = partner.departure;
    card.dataset.to = partner.destination;
    card.dataset.price = partner.price;
    card.dataset.type = partner.type;
    
    card.innerHTML = `
      <img src="${partner.imageUrl || `https://source.unsplash.com/280x180/?${partner.destination}`}" alt="${partner.destination}" />
      <h3>${partner.destination} from ${partner.departure}</h3>
      <p>Price: €${partner.price}</p>
      ${partner.company ? `<p class="company">${partner.company}</p>` : ''}
    `;
    
    card.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'partner_redirect', {
          event_category: 'Nukreipimas',
          event_label: partner.destination,
          partner_id: partner.id,
          value: partner.price
        });
      }

      window.open(partner.partnerUrl || `https://${partner.id}.travcen.com`, '_blank');
    });

    container.appendChild(card);
  });
}

// Paieškos funkcija
function filterCards() {
  const departure = document.getElementById("departure").value.toLowerCase();
  const destination = document.getElementById("destination").value.toLowerCase();
  const tripType = document.getElementById("trip-type").value;
  const priceSort = document.getElementById("price-sort").value;

  const cards = Array.from(document.querySelectorAll(".card"));
  
  // Filtravimas
  const filteredCards = cards.filter(card => {
    const cardDeparture = card.dataset.from.toLowerCase();
    const cardDestination = card.dataset.to.toLowerCase();
    const cardType = card.dataset.type;
    
    const matchesDeparture = !departure || cardDeparture.includes(departure);
    const matchesDestination = !destination || cardDestination.includes(destination);
    const matchesType = !tripType || cardType === tripType;
    
    return matchesDeparture && matchesDestination && matchesType;
  });

  // Rikiavimas
  if (priceSort === "price-low") {
    filteredCards.sort((a, b) => parseInt(a.dataset.price) - parseInt(b.dataset.price));
  } else if (priceSort === "price-high") {
    filteredCards.sort((a, b) => parseInt(b.dataset.price) - parseInt(a.dataset.price));
  }

  // Atvaizdavimas
  cards.forEach(card => {
    card.style.display = "none";
  });

  filteredCards.forEach(card => {
    card.style.display = "block";
  });
}

// Pridėkite šį CSS stilių į savo CSS failą:
// .info-message { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 10px 0; border-radius: 5px; }
// .company { font-size: 12px; color: #666; margin-top: 5px; }
