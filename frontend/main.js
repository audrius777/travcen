
const BACKEND_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://travcen.vercel.app";

function loadUser() {
  fetch(`${BACKEND_URL}/api/user`, { credentials: "include" })
    .then(res => res.json())
    .then(data => {
      if (data.loggedIn) {
        document.getElementById("login-google")?.style?.setProperty("display", "none");
        document.getElementById("login-facebook")?.style?.setProperty("display", "none");
        document.getElementById("user-status")?.style?.setProperty("display", "inline-block");
        document.getElementById("logged-user").innerText = "👤 Prisijungta kaip: " + data.email;

        if (data.email === "info@travcen.com") {
          document.getElementById("partner-modal")?.style?.setProperty("display", "block");
        }

        document.getElementById("logout-btn")?.addEventListener("click", () => {
          fetch(`${BACKEND_URL}/api/logout`, { method: "POST" })
            .then(() => location.reload());
        });
      }
    });
}

async function loadPartnerOffers() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/offers`);
    const offers = await res.json();

    const container = document.getElementById("card-list");
    container.innerHTML = "";

    offers.forEach(offer => {
      const card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-from", offer.from.toLowerCase());
      card.setAttribute("data-to", offer.to.toLowerCase());
      card.setAttribute("data-type", offer.type.toLowerCase());
      card.setAttribute("data-price", offer.price);

      card.innerHTML = `
        <img src="${offer.image}" />
        <h3>${offer.title}</h3>
        <p>Price: €${offer.price}</p>
        <a href="${offer.url}" target="_blank">View</a>
      `;

      container.appendChild(card);
    });

    filterCards();
  } catch (err) {
    alert("Klaida kraunant pasiūlymus: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("search-btn")?.addEventListener("click", filterCards);
  document.getElementById("login-google")?.addEventListener("click", () => {
    window.location.href = `${BACKEND_URL}/auth/google`;
  });
  document.getElementById("login-facebook")?.addEventListener("click", () => {
    window.location.href = `${BACKEND_URL}/auth/facebook`;
  });

  document.getElementById("close-partners-modal")?.addEventListener("click", () => {
    document.getElementById("partners-modal")?.style?.setProperty("display", "none");
  });

  document.getElementById("close-partner-modal")?.addEventListener("click", () => {
    document.getElementById("partner-modal")?.style?.setProperty("display", "none");
  });

  document.getElementById("footer-partners")?.addEventListener("click", () => {
    fetch(`${BACKEND_URL}/api/partners`)
      .then(res => res.json())
      .then(data => {
        const list = document.getElementById("partner-list");
        list.innerHTML = "";
        data.forEach(p => {
          const li = document.createElement("li");
          li.innerHTML = `<a href="${p.url}" target="_blank">${p.url}</a>`;
          list.appendChild(li);
        });
        document.getElementById("partners-modal").style.display = "block";
      })
      .catch(err => alert("Nepavyko įkelti partnerių: " + err.message));
  });

  document.getElementById("partner-form")?.addEventListener("submit", function(e) {
    e.preventDefault();

    const company = document.getElementById("company").value.trim();
    const url = document.getElementById("url").value.trim();
    const email = document.getElementById("email").value.trim();
    const description = document.getElementById("description").value.trim();

    if (!company || !url || !email || !description) {
      alert("Užpildykite visus laukus.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Neteisingas el. pašto adresas.");
      return;
    }

    const data = { company, url, email, description };

    fetch(`${BACKEND_URL}/api/partner`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data)
    })
      .then(res => {
        if (res.ok) {
          alert("Partneris sėkmingai užregistruotas!");
          document.getElementById("partner-form").reset();
          document.getElementById("partner-modal").style.display = "none";
        } else {
          throw new Error("Serverio klaida");
        }
      })
      .catch(err => alert("Klaida siunčiant duomenis: " + err.message));
  });

  loadUser();
  loadPartnerOffers();
});
