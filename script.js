function filterCards() {
  const departure = document.getElementById('departure').value.toLowerCase();
  const destination = document.getElementById('destination').value.toLowerCase();
  const tripType = document.getElementById('trip-type').value.toLowerCase();
  const sort = document.getElementById('price-sort').value;

  let cards = Array.from(document.querySelectorAll('.card'));

  cards.forEach(card => {
    const from = card.getAttribute('data-from').toLowerCase();
    const to = card.getAttribute('data-to').toLowerCase();
    const type = card.getAttribute('data-type').toLowerCase();
    const matches = from.includes(departure) && to.includes(destination) && (tripType === "" || type === tripType);
    card.style.display = matches ? 'block' : 'none';
  });

  let visibleCards = cards.filter(card => card.style.display === 'block');
  if (sort === 'price-low') {
    visibleCards.sort((a, b) => a.getAttribute('data-price') - b.getAttribute('data-price'));
  } else if (sort === 'price-high') {
    visibleCards.sort((a, b) => b.getAttribute('data-price') - a.getAttribute('data-price'));
  }

  const container = document.getElementById('card-list');
  visibleCards.forEach(card => container.appendChild(card));
}

const translations = {
  en: {
    siteTitle: "TravCen",
    welcomeText: "All travel offers in one place",
    searchBtn: "Search",
    departure: "Departure location",
    destination: "Destination",
    tripType: "Trip type",
    lastMinute: "Last Minute",
    loginGoogle: "Sign in with Google",
    loginFacebook: "Sign in with Facebook",
    faq: "FAQ",
    privacy: "Privacy Policy",
    contact: "Contact",
    disclaimer: "TravCen is an intermediary platform. We do not take responsibility for the services purchased through partner sites."
  },
  fr: {
    siteTitle: "TravCen",
    welcomeText: "Toutes les offres de voyage en un seul endroit",
    searchBtn: "Rechercher",
    departure: "Lieu de départ",
    destination: "Destination",
    tripType: "Type de voyage",
    lastMinute: "Dernière minute",
    loginGoogle: "Se connecter avec Google",
    loginFacebook: "Se connecter avec Facebook",
    faq: "FAQ",
    privacy: "Politique de confidentialité",
    contact: "Contact",
    disclaimer: "TravCen est une plateforme intermédiaire. Nous ne sommes pas responsables des services achetés via les sites partenaires."
  },
  es: {
    siteTitle: "TravCen",
    welcomeText: "Todas las ofertas de viajes en un solo lugar",
    searchBtn: "Buscar",
    departure: "Lugar de salida",
    destination: "Destino",
    tripType: "Tipo de viaje",
    lastMinute: "Último minuto",
    loginGoogle: "Iniciar sesión con Google",
    loginFacebook: "Iniciar sesión con Facebook",
    faq: "Preguntas frecuentes",
    privacy: "Política de privacidad",
    contact: "Contacto",
    disclaimer: "TravCen es una plataforma intermediaria. No nos responsabilizamos de los servicios adquiridos a través de sitios asociados."
  },
  de: {
    siteTitle: "TravCen",
    welcomeText: "Alle Reiseangebote an einem Ort",
    searchBtn: "Suchen",
    departure: "Abfahrtsort",
    destination: "Zielort",
    tripType: "Reiseart",
    lastMinute: "Last Minute",
    loginGoogle: "Mit Google anmelden",
    loginFacebook: "Mit Facebook anmelden",
    faq: "FAQ",
    privacy: "Datenschutzrichtlinie",
    contact: "Kontakt",
    disclaimer: "TravCen ist eine Vermittlungsplattform. Wir übernehmen keine Verantwortung für über Partnerseiten gekaufte Dienstleistungen."
  },
  zh: {
    siteTitle: "TravCen",
    welcomeText: "所有旅行优惠尽在一处",
    searchBtn: "搜索",
    departure: "出发地",
    destination: "目的地",
    tripType: "旅行类型",
    lastMinute: "最后时刻",
    loginGoogle: "使用 Google 登录",
    loginFacebook: "使用 Facebook 登录",
    faq: "常见问题",
    privacy: "隐私政策",
    contact: "联系",
    disclaimer: "TravCen 是一个中介平台。我们不对通过合作网站购买的服务负责。"
  },
  ko: {
    siteTitle: "TravCen",
    welcomeText: "모든 여행 상품을 한 곳에",
    searchBtn: "검색",
    departure: "출발 위치",
    destination: "목적지",
    tripType: "여행 유형",
    lastMinute: "마지막 순간",
    loginGoogle: "Google로 로그인",
    loginFacebook: "Facebook으로 로그인",
    faq: "자주 묻는 질문",
    privacy: "개인정보 처리방침",
    contact: "문의하기",
    disclaimer: "TravCen은 중개 플랫폼입니다. 파트너 사이트를 통해 구매한 서비스에 대한 책임은 지지 않습니다."
  },
  da: {
    siteTitle: "TravCen",
    welcomeText: "Alle rejsetilbud på ét sted",
    searchBtn: "Søg",
    departure: "Afrejsested",
    destination: "Destination",
    tripType: "Rejsetype",
    lastMinute: "Sidste øjeblik",
    loginGoogle: "Log ind med Google",
    loginFacebook: "Log ind med Facebook",
    faq: "FAQ",
    privacy: "Privatlivspolitik",
    contact: "Kontakt",
    disclaimer: "TravCen er en mellemmand. Vi påtager os intet ansvar for tjenester købt via partnersider."
  },
  sv: {
    siteTitle: "TravCen",
    welcomeText: "Alla resetilbud på ett ställe",
    searchBtn: "Sök",
    departure: "Avreseort",
    destination: "Destination",
    tripType: "Resetyper",
    lastMinute: "Sista minuten",
    loginGoogle: "Logga in med Google",
    loginFacebook: "Logga in med Facebook",
    faq: "Vanliga frågor",
    privacy: "Integritetspolicy",
    contact: "Kontakt",
    disclaimer: "TravCen är en mellanhand. Vi ansvarar inte för tjänster köpta via partnersidor."
  },
  no: {
    siteTitle: "TravCen",
    welcomeText: "Alle reisetilbud på ett sted",
    searchBtn: "Søk",
    departure: "Avreisested",
    destination: "Destinasjon",
    tripType: "Reisetype",
    lastMinute: "Siste liten",
    loginGoogle: "Logg inn med Google",
    loginFacebook: "Logg inn med Facebook",
    faq: "Ofte stilte spørsmål",
    privacy: "Personvernpolicy",
    contact: "Kontakt",
    disclaimer: "TravCen er en mellomplattform. Vi tar ikke ansvar for tjenester kjøpt via partnernettsteder."
  },
  lt: {
    siteTitle: "TravCen",
    welcomeText: "Visi kelionių pasiūlymai vienoje vietoje",
    searchBtn: "Ieškoti",
    departure: "Išvykimo vieta",
    destination: "Kelionės tikslas",
    tripType: "Kelionės tipas",
    lastMinute: "Paskutinės minutės",
    loginGoogle: "Prisijungti su Google",
    loginFacebook: "Prisijungti su Facebook",
    faq: "DUK",
    privacy: "Privatumo politika",
    contact: "Kontaktai",
    disclaimer: "TravCen yra tarpininkavimo platforma. Mes neprisiimame atsakomybės už partnerių svetainėse įsigytų paslaugų kokybę."

      }
    };

    function setLanguage(lang) {
      const t = translations[lang];
      if (!t) return;
      document.getElementById("site-title").innerText = t.siteTitle;
      document.getElementById("welcome-text").innerText = t.welcomeText;
      document.getElementById("search-btn").innerText = t.searchBtn;
      document.getElementById("departure").placeholder = t.departure;
      document.getElementById("destination").placeholder = t.destination;
      document.getElementById("trip-type").options[0].text = t.tripType;
      document.getElementById("trip-type").options[4].text = t.lastMinute;
      document.getElementById("login-google").innerText = t.loginGoogle;
      document.getElementById("login-facebook").innerText = t.loginFacebook;
      document.getElementById("footer-disclaimer").innerText = t.disclaimer;
      document.getElementById("footer-faq").innerText = t.faq;
      document.getElementById("footer-privacy").innerText = t.privacy;
      document.getElementById("footer-contact").innerText = t.contact;
    }

function filterCards() {
  const departure = document.getElementById('departure').value.toLowerCase();
  const destination = document.getElementById('destination').value.toLowerCase();
  const tripType = document.getElementById('trip-type').value.toLowerCase();
  const sort = document.getElementById('price-sort').value;

  const container = document.getElementById('card-list');
  let cards = Array.from(container.querySelectorAll('.card'));

  cards.forEach(card => {
    const from = card.getAttribute('data-from')?.toLowerCase() || '';
    const to = card.getAttribute('data-to')?.toLowerCase() || '';
    const type = card.getAttribute('data-type')?.toLowerCase() || '';

    const matches =
      from.includes(departure) &&
      to.includes(destination) &&
      (tripType === "" || type === tripType);

    card.style.display = matches ? 'block' : 'none';
  });

  let visibleCards = cards.filter(card => card.style.display === 'block');
  if (sort === 'price-low') {
    visibleCards.sort((a, b) => a.getAttribute('data-price') - b.getAttribute('data-price'));
  } else if (sort === 'price-high') {
    visibleCards.sort((a, b) => b.getAttribute('data-price') - a.getAttribute('data-price'));
  }

  // Perkeliame surūšiuotas korteles atgal į konteinerį
  visibleCards.forEach(card => container.appendChild(card));
}

    
  


  const BACKEND_URL = window.location.hostname.includes("localhost")
    ? "http://localhost:3000"
    : "https://travcen.vercel.app";

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
      filterCards(); // automatinis filtravimas po įkėlimo

    } catch (err) {
      alert("Klaida kraunant pasiūlymus: " + err.message);
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    document.getElementById("search-btn")?.addEventListener("click", function () {
      filterCards();
    });

    
    loadPartnerOffers(); // Įkeliame partnerių keliones

    document.getElementById("login-google")?.addEventListener("click", () => {
      window.location.href = `${BACKEND_URL}/auth/google`;
    });

    document.getElementById("login-facebook")?.addEventListener("click", () => {
      window.location.href = `${BACKEND_URL}/auth/facebook`;
    });

    fetch(`${BACKEND_URL}/api/user`, { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) {
          document.getElementById("login-google").style.display = "none";
          document.getElementById("login-facebook").style.display = "none";
          document.getElementById("user-status").style.display = "inline-block";
          document.getElementById("logged-user").innerText = "👤 Prisijungta kaip: " + data.email;

          document.getElementById("logout-btn").onclick = () => {
            fetch(`${BACKEND_URL}/api/logout`, { method: "POST" })
              .then(() => location.reload());
          };
        }
      });

    document.querySelector("#partner-form")?.addEventListener("submit", function(e) {
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
        .catch(err => {
          alert("Klaida siunčiant duomenis: " + err.message);
        });
    });

    document.getElementById("footer-partners")?.addEventListener("click", function () {
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
        .catch(err => {
          alert("Nepavyko įkelti partnerių: " + err.message);
        });
     });

    // Modalų uždarymo mygtukai – turi būti čia, viduje DOMContentLoaded
    document.getElementById("close-partners-modal")?.addEventListener("click", function () {
      document.getElementById("partners-modal").style.display = "none";
    });

    document.getElementById("close-partner-modal")?.addEventListener("click", function () {
      document.getElementById("partner-modal").style.display = "none";
    });
});
