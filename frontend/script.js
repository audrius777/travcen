const API_BASE_URL = 'https://travcen-backendas.onrender.com/api';
const RECAPTCHA_SITE_KEY = '6LcbL5wrAAAAACbOLaU5S-dnUMRfJsdeiF6MhmmI';

// CSRF token valdymas
let csrfToken = null;

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

// PAPILDYTA: Funkcija partnerių svetainių gavimui
async function getPartnerWebsites() {
  try {
    console.log('Gaunamos partnerių svetainės...');
    const response = await fetch(`${API_BASE_URL}/partners`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP klaida! status: ${response.status}`);
    }
    
    const partners = await response.json();
    const websites = partners.map(partner => partner.website);
    console.log('Gautos partnerių svetainės:', websites);
    return websites;
    
  } catch (error) {
    console.warn('Nepavyko gauti partnerių svetainių, naudojami demo website:', error);
    return [
      'https://kelioniuplanetas.lt',
      'https://travelexpert.com', 
      'https://tourworld.eu'
    ];
  }
}

// PAPILDYTA: Funkcija vienos svetainės scrapinimui
async function scrapeWebsite(websiteUrl, searchCriteria) {
  try {
    console.log(`Scrapinama: ${websiteUrl} su kriterijais: ${searchCriteria}`);
    
    const response = await fetchWithCsrf(`${API_BASE_URL}/scrape`, {
      method: 'POST',
      body: JSON.stringify({
        url: websiteUrl,
        criteria: searchCriteria
      })
    });
    
    if (!response.ok) {
      throw new Error(`Scrapinimo klaida: ${response.status}`);
    }
    
    const results = await response.json();
    console.log(`Rasta ${results.length} rezultatų iš ${websiteUrl}`);
    return results;
    
  } catch (error) {
    console.error(`Klaida scrapinant ${websiteUrl}:`, error);
    return []; // Grąžiname tuščią masyvą, kad nepakirstų viso scrapinimo
  }
}

// PAPILDYTA: Pagrindinė scrapinimo funkcija visiems partneriams
async function scrapeAllPartners(searchCriteria) {
  try {
    const websites = await getPartnerWebsites();
    const allResults = [];
    let completed = 0;
    
    console.log(`Pradedamas scrapinimas ${websites.length} partnerių...`);
    
    // Scrapiname kiekvieną svetainę
    for (const website of websites) {
      try {
        // Atnaujinti progreso statusą
        const scrapingMessage = document.getElementById('scraping-message');
        if (scrapingMessage) {
          scrapingMessage.textContent = `Searching ${website}... (${completed + 1}/${websites.length})`;
        }
        
        const results = await scrapeWebsite(website, searchCriteria);
        
        // Pridėti šaltinio informaciją prie rezultatų
        const resultsWithSource = results.map(offer => ({
          ...offer,
          source: website,
          partnerName: website.replace('https://', '').replace('www.', '')
        }));
        
        allResults.push(...resultsWithSource);
        completed++;
        
        console.log(`✅ Apdorota ${completed}/${websites.length}: ${website} - ${results.length} rezultatų`);
        
      } catch (error) {
        console.error(`❌ Klaida scrapinant ${website}:`, error);
        completed++;
      }
    }
    
    console.log(`Scrapinimas baigtas. Iš viso rasta: ${allResults.length} rezultatų`);
    return allResults;
    
  } catch (error) {
    console.error('Bendra scrapinimo klaida:', error);
    throw error;
  }
}

// ATNAUJINTA: Scrapinimo funkcija (pervadinta iš scrapeTravelOffers)
async function scrapeTravelOffers(searchCriteria) {
  try {
    console.log('Pradedamas scrapinimas visuose partneriuose:', searchCriteria);
    
    // Gauti rezultatus iš visų partnerių
    const scrapedResults = await scrapeAllPartners(searchCriteria);
    
    // Konvertuoti scrapinimo rezultatus į mūsų kortelių formatą
    const convertedResults = scrapedResults.map((offer, index) => ({
      id: `scraped-${Date.now()}-${index}`,
      company: offer.partnerName || offer.source,
      departure: 'Various', // Scrapinimas dažniausiai nerodo išvykimo vietos
      destination: offer.title || 'Travel Offer',
      price: offer.price || 0,
      type: "leisure", // Numatytasis tipas
      departureDate: '', // Scrapinimas dažniausiai nerodo datos
      imageUrl: offer.image || `https://source.unsplash.com/featured/280x180/?travel`,
      partnerUrl: offer.link || offer.source
    }));
    
    console.log('Konvertuoti rezultatai:', convertedResults);
    return convertedResults;
    
  } catch (error) {
    console.error('Scrapinimo klaida:', error);
    throw error;
  }
}

// Funkcija CSRF tokeno gavimui
async function getCsrfToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/csrf-token`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP klaida! status: ${response.status}`);
    }
    
    const data = await response.json();
    csrfToken = data.csrfToken;
    console.log('CSRF token gautas:', csrfToken);
    return csrfToken;
  } catch (error) {
    console.error('Klaida gaunant CSRF token:', error);
    throw error;
  }
}

// Funkcija užklausoms su CSRF apsauga
async function fetchWithCsrf(url, options = {}) {
  // Įsitikinti, kad turime CSRF tokeną
  if (!csrfToken) {
    await getCsrfToken();
  }
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    }
  };
  
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  const response = await fetch(url, mergedOptions);
  
  // Jei CSRF tokenas nebegalioja, gaukite naują ir pakartokite
  if (response.status === 403 && response.headers.get('content-type')?.includes('application/json')) {
    const errorData = await response.json();
    if (errorData.error && errorData.error.includes('CSRF')) {
      console.log('CSRF tokenas nebegalioja, gaunamas naujas...');
      csrfToken = null;
      return fetchWithCsrf(url, options);
    }
  }
  
  return response;
}

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
  // Gauti CSRF tokeną iškart po puslapio užkrovimo
  try {
    await getCsrfToken();
  } catch (error) {
    console.warn('Nepavyko gauti CSRF tokeno, bandysime vėliau');
  }
  
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

  // ATNAUJINTA: Paieškos funkcijos priskyrimas
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", async () => {
      const destination = document.getElementById("destination").value;
      const departure = document.getElementById("departure").value;
      
      // Sudarome paieškos kriterijus iš visų laukų
      let searchCriteria = '';
      if (departure) searchCriteria += departure + ' ';
      if (destination) searchCriteria += destination + ' ';
      
      // Pridedame kelionės tipą, jei pasirinktas
      const tripType = document.getElementById("trip-type").value;
      if (tripType) {
        searchCriteria += tripType + ' ';
      }
      
      searchCriteria = searchCriteria.trim();
      
      if (searchCriteria) {
        try {
          // Rodyti scrapinimo statusą
          const scrapingStatus = document.getElementById('scraping-status');
          const scrapingMessage = document.getElementById('scraping-message');
          
          scrapingStatus.style.display = 'block';
          scrapingMessage.textContent = 'Searching across all partners...';
          
          // Atlikti scrapinimą VISUOSE partneriuose
          const scrapedResults = await scrapeTravelOffers(searchCriteria);
          
          // Atnaujinti rezultatus
          if (scrapedResults && scrapedResults.length > 0) {
            renderCards(scrapedResults);
            scrapingMessage.textContent = `Found ${scrapedResults.length} matching offers`;
          } else {
            scrapingMessage.textContent = 'No offers found';
            // Jei nerasta, rodyti standartinius rezultatus
            await loadPartners();
          }
          
          // Paslėpti statusą po 3 sekundžių
          setTimeout(() => {
            scrapingStatus.style.display = 'none';
          }, 3000);
          
        } catch (error) {
          console.error('Paieškos klaida:', error);
          const scrapingStatus = document.getElementById('scraping-status');
          const scrapingMessage = document.getElementById('scraping-message');
          
          scrapingStatus.style.display = 'block';
          scrapingMessage.textContent = 'Search error: ' + error.message;
          
          // Jei scrapinimas nepavyko, rodyti standartinius rezultatus
          await loadPartners();
          
          setTimeout(() => {
            scrapingStatus.style.display = 'none';
          }, 3000);
        }
      } else {
        // Jei nėra paieškos kriterijų, tiesiog filtruoti esamus duomenis
        filterCards();
      }
    });
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

        // Siųsti duomenis su CSRF apsauga
        const response = await fetchWithCsrf(`${API_BASE_URL}/partners/register`, {
          method: 'POST',
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
    
    const response = await fetch(`${API_BASE_URL}/partners`, {
      signal: controller.signal,
      credentials: 'include'
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
    let imageUrl = partner.imageUrl || partner.image;
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

      window.open(partner.partnerUrl || partner.link || `https://${partner.id}.travcen.com`, '_blank');
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
