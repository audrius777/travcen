const API_BASE_URL = '/api';
const RECAPTCHA_SITE_KEY = '6LcbL5wrAAAAACbOLaU5S-dnUMRfJsdeiF6MhmmI';

// Paprastesnė reCAPTCHA įkėlimo funkcija
function loadRecaptcha() {
  return new Promise((resolve, reject) => {
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
      console.error('Nepavyko įkelti reCAPTCHA scripto');
      reject(new Error('Nepavyko įkelti reCAPTCHA'));
    };

    document.head.appendChild(script);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadPartners();

  // Modalų valdymas
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
        let captchaToken = 'test-token'; // Default reikšmė testavimui
        
        if (window.grecaptcha && window.grecaptcha.execute) {
          captchaToken = await grecaptcha.execute(RECAPTCHA_SITE_KEY, { 
            action: 'partner_submit' 
          });
          console.log('reCAPTCHA token gautas:', captchaToken);
        } else {
          console.warn('reCAPTCHA nepasiruošusi, naudojamas test token');
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
          modal.style.display = 'none';
          partnerForm.reset();
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Serverio klaida');
        }

      } catch (error) {
        console.error('Klaida:', error);
        alert(`Registracija nepavyko: ${error.message || 'Bandykite vėliau.'}`);
      }
    });
  }
});

// Partnerių užkrovimas
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
    document.getElementById("card-list").innerHTML = `
      <div class="error-message">
        Nepavyko užkrauti pasiūlymų. Bandykite vėliau.
      </div>
    `;
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

      window.location.href = partner.partnerUrl || `https://${partner.id}.travcen.com`;
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
