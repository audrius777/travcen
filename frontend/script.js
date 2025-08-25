const API_BASE_URL = '/api'; // Pakeista iš 'https://api.travcen.com' į lokalų serverio kelią
const RECAPTCHA_SITE_KEY = '6Lcbl.SwrAAAACbOLaUS5-dnUMRfJsdeiF6Mhmml';

// Pakeiskite loadRecaptcha funkciją:
async function loadRecaptcha() {
  return new Promise((resolve, reject) => {
    // Jei jau įkelta
    if (window.grecaptcha && window.grecaptcha.execute) {
      console.log('reCAPTCHA jau įkelta');
      resolve();
      return;
    }

    // Patikrinti ar jau yra įkėlimo procesas
    if (window.recaptchaLoading) {
      const interval = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.execute) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      return;
    }

    window.recaptchaLoading = true;
    
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      console.log('reCAPTCHA sėkmingai įkelta');
      window.recaptchaLoading = false;
      
      // Papildoma patikra po įkėlimo
      if (window.grecaptcha && window.grecaptcha.execute) {
        resolve();
      } else {
        reject(new Error('reCAPTCHA įkelta, bet grecaptcha objektas nepasiekiamas'));
      }
    };

    script.onerror = () => {
      console.error('Nepavyko įkelti reCAPTCHA scripto');
      window.recaptchaLoading = false;
      reject(new Error('Nepavyko įkelti reCAPTCHA'));
    };

    document.head.appendChild(script);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // 1. Užkrauname ir atvaizduojame partnerius (liko nepakeista)
  await loadPartners();

  // 2. Modalų valdymas (liko nepakeista)
  const modal = document.getElementById("partner-modal");
  const partnerLink = document.getElementById("partner-link");
  const closeBtn = document.querySelector(".close");

  if (partnerLink) {
    partnerLink.addEventListener("click", (e) => {
      e.preventDefault();
      modal.style.display = "block";
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  });

  // 3. Paieškos funkcijos priskyrimas (liko nepakeista)
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", filterCards);
  }

  // Partnerio registracijos formos valdymas su reCAPTCHA v3
  const modalSubmit = document.getElementById('modal-submit');
  if (modalSubmit) {
    modalSubmit.addEventListener('click', async (e) => {
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
        
        // Papildoma patikra
        if (!window.grecaptcha || !window.grecaptcha.execute) {
          throw new Error('reCAPTCHA nepasiruošusi');
        }

        // Gauti tokeną
        const captchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { 
          action: 'submit' 
        });

        console.log('reCAPTCHA token gautas:', captchaToken);

        // Siųsti duomenis
        const response = await fetch(`${API_BASE_URL}/partners/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            captchaToken,
            ipAddress: await getClientIp()
          })
        });

        if (response.ok) {
          alert('Užklausa išsiųsta! Administratorius susisieks per 24 val.');
          document.getElementById('partner-modal').style.display = 'none';
          document.getElementById('partner-form').reset();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Serverio klaida');
        }

      } catch (error) {
        console.error('Klaida:', error);
        
        // Rodyti specifinius pranešimus
        if (error.message.includes('site key') || error.message.includes('reCAPTCHA')) {
          alert('reCAPTCHA klaida. Prašome perkrauti puslapį ir bandyti dar kartą.');
        } else {
          alert(`Registracija nepavyko: ${error.message || 'Bandykite vėliau.'}`);
        }
      }
    });
  }
});

// Partnerių užkrovimas (pakeistas API endpoint)
async function loadPartners() {
  try {
    const response = await fetch(`${API_BASE_URL}/partners`);
    if (!response.ok) {
      throw new Error(`HTTP klaida! status: ${response.status}`);
    }
    const partners = await response.json();
    renderCards(partners);
  } catch (error) {
    console.error("Klaida užkraunant partnerius:", error);
    // Atvaizduoti klaidos pranešimą vartotojui
    document.getElementById("card-list").innerHTML = `
      <div class="error-message">
        Nepavyko užkrauti pasiūlymų. Bandykite vėliau.
      </div>
    `;
  }
}

// Kortelių generavimas (liko nepakeista)
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
    `;
    
    card.addEventListener('click', () => {
      // GA4 sekimas
      if (typeof gtag === 'function') {
        gtag('event', 'partner_redirect', {
          event_category: 'Nukreipimas',
          event_label: partner.destination,
          partner_id: partner.id,
          value: partner.price
        });
      }

      // Nukreipimas
      window.location.href = partner.partnerUrl || `https://${partner.id}.travcen.com`;
    });

    container.appendChild(card);
  });
}

// Paieškos funkcija (liko nepakeista)
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

// Nauja funkcija - kliento IP adreso gavimas
async function getClientIp() {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Nepavyko gauti IP adreso:', error);
    return 'unknown';
  }
}
