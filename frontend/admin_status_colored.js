// admin_status_colored.js
const BACKEND_URL = "https://travcen.onrender.com";
const STATUS_TABLE = document.querySelector("#status-table tbody");
const LOGOUT_BTN = document.getElementById("logout-btn");
const REFRESH_BTN = document.getElementById("refresh-btn");

// Statuso klasės nustatymas
function getStatusClass(status) {
  if (status === "OK" || status === "Aktyvus") return "status-ok";
  if (status === "Error" || status === "Klaida") return "status-error";
  if (status === "Warning" || status === "Įspėjimas") return "status-warning";
  return "";
}

// Datos formatavimas
function formatDate(dateString) {
  if (!dateString) return 'Nėra duomenų';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('lt-LT', options);
}

// Duomenų įkėlimas
async function loadStatus() {
  STATUS_TABLE.innerHTML = `
    <tr>
      <td colspan="4" class="loading-indicator">
        <div class="spinner"></div>
        Kraunama partnerių būsenos informacija...
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
      STATUS_TABLE.innerHTML = `
        <tr>
          <td colspan="4" class="status-error">
            🔒 Prieiga uždrausta. Tik administratoriams.
          </td>
        </tr>
      `;
      return;
    }

    // Gaunam partnerių statusus
    const res = await fetch(`${BACKEND_URL}/api/partner-status`, {
      credentials: "include"
    });

    if (!res.ok) throw new Error("Serverio klaida: " + res.status);

    const statuses = await res.json();

    if (!Array.isArray(statuses) || statuses.length === 0) {
      STATUS_TABLE.innerHTML = `
        <tr>
          <td colspan="4">Nerasta jokių partnerių su būsenos informacija</td>
        </tr>
      `;
      return;
    }

    // Atvaizduojam duomenis
    STATUS_TABLE.innerHTML = statuses.map(partner => `
      <tr>
        <td>${partner.company || partner.file || 'Nenurodyta'}</td>
        <td class="${getStatusClass(partner.status)}">
          ${partner.status || 'Nežinoma būsena'}
        </td>
        <td>${formatDate(partner.lastUpdated)}</td>
        <td>${partner.message || '-'}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.error("Klaida:", err);
    STATUS_TABLE.innerHTML = `
      <tr>
        <td colspan="4" class="status-error">
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
REFRESH_BTN.addEventListener('click', loadStatus);

// Pradinis duomenų įkėlimas
document.addEventListener('DOMContentLoaded', loadStatus);
