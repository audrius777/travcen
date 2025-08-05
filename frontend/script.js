document.addEventListener("DOMContentLoaded", async () => {
  // 1. Užkrauname ir atvaizduojame partnerius
  await loadPartners();

  // 2. Modalų valdymas (išlaikomas originalus kodas)
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

  // 3. Paieškos funkcijos priskyrimas (išlaikoma originali logika)
  const searchBtn = document.getElementById("search-btn");
  if (searchBtn) {
    searchBtn.addEventListener("click", filterCards);
  }

  // Partnerio registracijos formos valdymas
  const modalSubmit = document.getElementById('modal-submit');
  if (modalSubmit) {
    modalSubmit.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const formData = {
        company: document.getElementById('modal-company').value,
        website: document.getElementById('modal-website').value,
        email: document.getElementById('modal-email').value,
        description: document.getElementById('modal-description').value
      };

      try {
        // 1. Siunčiame duomenis į naują API endpoint'ą
        const response = await fetch('/api/partners/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          alert('Užklausa išsiųsta! Administratorius susisieks per 24 val.');
          document.getElementById('partner-modal').style.display = 'none';
        } else {
          throw new Error('Serverio klaida');
        }
      } catch (error) {
        console.error('Klaida:', error);
        alert('Registracija nepavyko. Bandykite vėliau.');
      }
    });
  }
});

// 4. Partnerių užkrovimas
async function loadPartners() {
  try {
    const response = await fetch('https://api.travcen.lt/partners');
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

// 5. Kortelių generavimas
function renderCards(partners) {
  const container = document.getElementById('card-list');
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
      <img src="${partner.imageUrl || `https://source.unsplash.com/280x180/?${partner.destination}`}" />
      <h3>${partner.destination} from ${partner.departure}</h3>
      <p>Price: €${partner.price}</p>
    `;
    
    card.addEventListener('click', () => {
      // GA4 sekimas
      gtag('event', 'partner_redirect', {
        event_category: 'Nukreipimas',
        event_label: partner.destination,
        partner_id: partner.id,
        value: partner.price
      });

      // Nukreipimas
      window.location.href = partner.partnerUrl || `https://${partner.id}.travcen.lt`;
    });

    container.appendChild(card);
  });
}

// 6. Originali paieškos funkcija (be pakeitimų)
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
