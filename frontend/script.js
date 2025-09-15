const API_BASE_URL = 'https://travcen-backend.onrender.com/api';
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
    departureDate: "2023-06-15",
    imageUrl: "https://source.unsplash.com/featured/280x180/?greece",
    partnerUrl: "https://travel-lt.com"
  },
  {
    id: 2,
    company: "Baltic Tours",
    departure: "Kaunas",
    destination: "Alps",
    price: 499,
    type: "adventure",
    departureDate: "2023-07-20",
    imageUrl: "https://source.unsplash.com/featured/280x180/?alps",
    partnerUrl: "https://baltictours.com"
  },
  {
    id: 3,
    company: "Euro Adventures",
    departure: "Riga",
    destination: "Spain",
    price: 399,
    type: "cultural",
    departureDate: "2023-08-10",
    imageUrl: "https://source.unsplash.com/featured/280x180/?spain",
    partnerUrl: "https://euroadventures.com"
  }
];

// Kalbų kodų atitikmenys
const LANGUAGE_CODES = {
  en: 'en-US',
  lt: 'lt-LT',
  fr: 'fr-FR',
  es: 'es-ES',
  de: 'de-DE',
  zh: 'zh-CN',
  ko: 'ko-KR',
  da: 'da-DK',
  sv: 'sv-SE',
  no: 'no-NO'
};

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

// Funkcija datos formatavimui pagal pasirinktą kalbą
function formatDateByLanguage(dateString, languageCode) {
  const date = new Date(dateString);
  const locale = LANGUAGE_CODES[languageCode] || 'en-US';
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
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

// Partnerių užkrovimas su atsarginiu variantu ir pagerintu timeout valdymu
async function loadPartners() {
  try {
    console.log('Bandome užkrauti partnerius iš:', API_BASE_URL + '/partners');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 sekundžių timeout
    
    // Naudojame CORS proxy, kad apeitume CSP problemas
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`${API_BASE_URL}/partners`)}`;
    
    const response = await fetch(proxyUrl, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP klaida! status: ${response.status}`);
    }
    
    const partners = await response.json();
    renderCards(partners);
    
  } catch (error) {
    console.warn("Klaida užkraunant partnerius, naudojami mock duomenys:", error);
    
    // Atvaizduoti mock duomenis
    renderCards(MOCK_PARTNERS);
  }
}

// Kortelių generavimas
function renderCards(partners) {
  const container = document.getElementById('card-list');
  if (!container) return;

  container.innerHTML = '';

  // Gauti pasirinktą kalbą
  const currentLang = localStorage.getItem('selectedLanguage') || 'en';

  partners.forEach(partner => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = partner.id;
    card.dataset.from = partner.departure;
    card.dataset.to = partner.destination;
    card.dataset.price = partner.price;
    card.dataset.type = partner.type;
    card.dataset.date = partner.departureDate || '';
    
    // Formatavame datą pagal pasirinktą kalbą
    const formattedDate = partner.departureDate ? 
      formatDateByLanguage(partner.departureDate, currentLang) : 'Date not specified';
    
    // Sukuriame tinkamą paveikslėlio URL
    let imageUrl = partner.imageUrl;
    if (!imageUrl && partner.destination) {
      // Jei nėra paveikslėlio URL, sukuriame naudodami Unsplash
      const searchQuery = partner.destination.toLowerCase().replace(/\s+/g, '-');
      imageUrl = `https://source.unsplash.com/featured/280x180/?${searchQuery}`;
    }
    
    card.innerHTML = `
      <img src="${imageUrl}" alt="${partner.destination}" onerror="this.src='https://source.unsplash.com/featured/280x180/?travel'" />
      <div class="card-content">
        <h3>${partner.destination} from ${partner.departure}</h3>
        <p class="departure-date">Departure: ${formattedDate}</p>
        <p class="price">Price: €${partner.price}</p>
        ${partner.company ? `<p class="company">${partner.company}</p>` : ''}
      </div>
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

// Paieškos funkcija su datos filtru
function filterCards() {
  const departure = document.getElementById("departure").value.toLowerCase();
  const destination = document.getElementById("destination").value.toLowerCase();
  const tripType = document.getElementById("trip-type").value;
  const priceSort = document.getElementById("price-sort").value;
  const departureDate = document.getElementById("departure-date").value;

  const cards = Array.from(document.querySelectorAll(".card"));
  
  // Filtravimas
  const filteredCards = cards.filter(card => {
    const cardDeparture = card.dataset.from.toLowerCase();
    const cardDestination = card.dataset.to.toLowerCase();
    const cardType = card.dataset.type;
    const cardDate = card.dataset.date;
    
    const matchesDeparture = !departure || cardDeparture.includes(departure);
    const matchesDestination = !destination || cardDestination.includes(destination);
    const matchesType = !tripType || cardType === tripType;
    const matchesDate = !departureDate || cardDate === departureDate;
    
    return matchesDeparture && matchesDestination && matchesType && matchesDate;
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

// Perkrauti korteles, kai pasikeičia kalba
if (window.setLanguage) {
  const originalSetLanguage = window.setLanguage;
  window.setLanguage = function(lang) {
    originalSetLanguage(lang);
    
    // Perkrauname korteles su nauja kalba
    const container = document.getElementById('card-list');
    if (container && container.children.length > 0) {
      const currentPartners = Array.from(container.children).map(card => {
        return {
          id: card.dataset.id,
          departure: card.dataset.from,
          destination: card.dataset.to,
          price: card.dataset.price,
          type: card.dataset.type,
          departureDate: card.dataset.date,
          company: card.querySelector('.company')?.textContent || ''
        };
      });
      
      renderCards(currentPartners);
    }
  };
}
