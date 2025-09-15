// admin_status.js
const BACKEND_URL = "https://travcen.onrender.com";
const PARTNERS_TABLE = document.getElementById("partners-table").querySelector("tbody");
const LOGOUT_BTN = document.getElementById("logout-btn");
const REFRESH_BTN = document.getElementById("refresh-btn");

// Scrapinimo elementai
const SCRAPING_MODAL = document.getElementById("scraping-modal");
const SCRAPING_RESULTS = document.getElementById("scraping-results");
const CLOSE_SCRAPING_MODAL = document.getElementById("close-scraping-modal");
const EXPORT_SCRAPING_DATA = document.getElementById("export-scraping-data");

// Formatavimo funkcijos
function formatDate(dateString) {
  if (!dateString) return 'Nėra duomenų';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('lt-LT', options);
}

function getStatusClass(status) {
  switch(status.toLowerCase()) {
    case 'aktyvus': return 'status-active';
    case 'neaktyvus': return 'status-inactive';
    case 'laukiama': return 'status-pending';
    default: return '';
  }
}

// Scrapinimo funkcija
async function scrapePartnerData(partnerId, partnerUrl, companyName) {
  try {
    SCRAPING_RESULTS.innerHTML = '<div class="loading-indicator">Vykdomas duomenų rinkimas...</div>';
    SCRAPING_MODAL.style.display = 'block';

    const response = await fetch(`${BACKEND_URL}/api/scrape`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: partnerUrl,
        criteria: "visos kelionės",
        rules: {}
      })
    });

    if (!response.ok) throw new Error('Serverio klaida atliekant scrapinimą');

    const data = await response.json();
    
    // Rodyti rezultatus modaliame lange
    if (data.error) {
      SCRAPING_RESULTS.innerHTML = `<div class="error-message">Klaida: ${data.error}</div>`;
    } else {
      SCRAPING_RESULTS.innerHTML = `
        <h4>Rasti pasiūlymai iš ${companyName}:</h4>
        <p>Surasta ${data.length} pasiūlymų</p>
        <div style="max-height: 200px; overflow-y: auto;">
          ${data.map(offer => `
            <div style="border-bottom: 1px solid #eee; padding: 8px 0;">
              <strong>${offer.title}</strong><br>
              Kaina: ${offer.price} €, Trukmė: ${offer.duration}
            </div>
          `).join('')}
        </div>
      `;
    }
  } catch (error) {
    console.error('Scrapinimo klaida:', error);
    SCRAPING_RESULTS.innerHTML = `<div class="error-message">Klaida: ${error.message}</div>`;
  }
}

// Veiksmų apdorojimas
function handleAction(e) {
  const partnerId = e.target.dataset.id;
  const action = e.target.dataset.action;
  const partnerUrl = e.target.dataset.url;
  const companyName = e.target.dataset.company;
  
  if (action === 'view') {
    // Peržiūros logika
    console.log(`Peržiūrima partnerio ID: ${partnerId}`);
  } else if (action === 'edit') {
    // Redagavimo logika
    console.log(`Redaguojama partnerio ID: ${partnerId}`);
  } else if (action === 'scrape') {
    scrapePartnerData(partnerId, partnerUrl, companyName);
  }
}

// Duomenų įkėlimas
async function loadPartnerStatus() {
  PARTNERS_TABLE.innerHTML = `
    <tr>
      <td colspan="4" class="loading-indicator">
        <div class="spinner"></div>
        Kraunama partnerių informacija...
      </td>
    </tr>
  `;

  try {
    // Patikrinam ar vartotojas prisijungęs
    const userRes = await fetch(`${BACKEND_URL}/api/user`, {
      credentials: "include"
    });
    
    if (!userRes.ok) throw new Error('Nepavyko patikrinti vartotojo');
    
    const userData = await userRes.json();

    if (!userData.loggedIn || !userData.isAdmin) {
      PARTNERS_TABLE.innerHTML = `
        <tr>
          <td colspan="4" class="error-message">
            🔒 Prieiga uždrausta. Tik administratoriams.
          </td>
        </tr>
      `;
      return;
    }

    // Gaunam partnerių duomenis
    const res = await fetch(`${BACKEND_URL}/api/partner-status`, {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Serverio klaida: " + res.status);

    const statuses = await res.json();

    if (!Array.isArray(statuses) || statuses.length === 0) {
      PARTNERS_TABLE.innerHTML = `
        <tr>
          <td colspan="4">Nerasta jokių partnerių</td>
        </tr>
      `;
      return;
    }

    // Atvaizduojam duomenis
    PARTNERS_TABLE.innerHTML = statuses.map(p => `
      <tr>
        <td>${p.company || 'Nenurodyta'}</td>
        <td class="${getStatusClass(p.status)}">
          ${p.status || 'Nežinoma būsena'}
        </td>
        <td>${formatDate(p.lastUpdated)}</td>
        <td>
          <button class="action-btn view-btn" data-id="${p.id}" data-action="view">Peržiūrėti</button>
          <button class="action-btn edit-btn" data-id="${p.id}" data-action="edit">Redaguoti</button>
          <button class="action-btn scrape-btn" data-id="${p.id}" data-action="scrape" data-url="${p.url}" data-company="${p.company}">Rinkti duomenis</button>
        </td>
      </tr>
    `).join('');

    // Pridedam event listenerius veiksmų mygtukams
    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', handleAction);
    });

  } catch (err) {
    console.error("Klaida:", err);
    PARTNERS_TABLE.innerHTML = `
      <tr>
        <td colspan="4" class="error-message">
          ❌ Klaida kraunant duomenis: ${err.message}
        </td>
      </tr>
    `;
  }
}

// Modalų valdymas
if (CLOSE_SCRAPING_MODAL) {
  CLOSE_SCRAPING_MODAL.addEventListener('click', () => {
    if (SCRAPING_MODAL) SCRAPING_MODAL.style.display = 'none';
  });
}

if (EXPORT_SCRAPING_DATA) {
  EXPORT_SCRAPING_DATA.addEventListener('click', () => {
    alert('Eksportavimo funkcija bus įgyvendinta vėliau');
  });
}

// Atsijungimo logika
LOGOUT_BTN.addEventListener('click', async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/logout`, {
      method: 'POST',
      credentials: "include"
    });
    
    if (res.ok) {
      window.location.href = 'login.html';
    } else {
      alert('Atsijungti nepavyko');
    }
  } catch (err) {
    console.error('Atsijungimo klaida:', err);
    alert('Įvyko klaida bandant atsijungti');
  }
});

// Atnaujinimo mygtuko logika
REFRESH_BTN.addEventListener('click', loadPartnerStatus);

// Pradinis duomenų įkėlimas
document.addEventListener('DOMContentLoaded', loadPartnerStatus);
