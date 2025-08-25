// admin_status.js
const BACKEND_URL = "https://travcen.onrender.com";
const PARTNERS_TABLE = document.getElementById("partners-table").querySelector("tbody");
const LOGOUT_BTN = document.getElementById("logout-btn");
const REFRESH_BTN = document.getElementById("refresh-btn");

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

// Veiksmų apdorojimas
function handleAction(e) {
  const partnerId = e.target.dataset.id;
  const action = e.target.classList.contains('view-btn') ? 'view' : 'edit';
  
  if (action === 'view') {
    // Peržiūros logika
    console.log(`Peržiūrima partnerio ID: ${partnerId}`);
  } else {
    // Redagavimo logika
    console.log(`Redaguojama partnerio ID: ${partnerId}`);
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
          <button class="action-btn view-btn" data-id="${p.id}">Peržiūrėti</button>
          <button class="action-btn edit-btn" data-id="${p.id}">Redaguoti</button>
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
