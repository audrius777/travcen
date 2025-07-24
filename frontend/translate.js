// translate.js - Pilnai atnaujinta versija
document.addEventListener('DOMContentLoaded', () => {
  // Visi vertimai, atitinkantys index.html elementus
  window.translations = {
    en: {
      "site-title": "TravCen",
      "welcome-text": "All travel offers in one place",
      "departure-placeholder": "Departure location",
      "destination-placeholder": "Destination",
      "trip-type-default": "Trip type",
      "trip-type-leisure": "Leisure",
      "trip-type-adventure": "Adventure",
      "trip-type-cultural": "Cultural",
      "trip-type-last-minute": "Last Minute",
      "price-sort-default": "Sort by price",
      "price-sort-low": "Price: Low to High",
      "price-sort-high": "Price: High to Low",
      "search-btn": "Search",
      "footer-faq": "FAQ",
      "footer-privacy": "Privacy Policy",
      "footer-contact": "Contact",
      "footer-partner": "Become a Partner",
      "footer-disclaimer": "Note: TravCen is an intermediary platform. We do not take responsibility for the services purchased through partner sites.",
      "modal-title": "Partner Registration",
      "modal-company": "Company Name",
      "modal-website": "Website URL",
      "modal-email": "Contact Email",
      "modal-description": "Short Description",
      "modal-submit": "Submit",
      "login-google": "Sign in with Google",
      "login-facebook": "Sign in with Facebook"
    },
    lt: {
      "site-title": "TravCen",
      "welcome-text": "Visos kelionių pasiūlymos vienoje vietoje",
      "departure-placeholder": "Išvykimo vieta",
      "destination-placeholder": "Kelionės tikslas",
      "trip-type-default": "Kelionės tipas",
      "trip-type-leisure": "Poilsinė",
      "trip-type-adventure": "Prielinksninė",
      "trip-type-cultural": "Pažintinė",
      "trip-type-last-minute": "Last Minute",
      "price-sort-default": "Rikiuoti pagal kainą",
      "price-sort-low": "Kaina: nuo mažiausios",
      "price-sort-high": "Kaina: nuo didžiausios",
      "search-btn": "Ieškoti",
      "footer-faq": "DUK",
      "footer-privacy": "Privatumo politika",
      "footer-contact": "Kontaktai",
      "footer-partner": "Tapkite partneriu",
      "footer-disclaimer": "Pastaba: TravCen yra tarpininkavimo platforma. Mes neatsakome už paslaugas, įsigytas per partnerių svetaines.",
      "modal-title": "Partnerio registracija",
      "modal-company": "Įmonės pavadinimas",
      "modal-website": "Svetainės nuoroda",
      "modal-email": "Kontaktinis el. paštas",
      "modal-description": "Trumpas aprašymas",
      "modal-submit": "Pateikti",
      "login-google": "Prisijungti su Google",
      "login-facebook": "Prisijungti su Facebook"
    },
fr: {
  "site-title": "TravCen",
  "welcome-text": "Toutes les offres de voyage en un seul endroit",
  "departure-placeholder": "Lieu de départ",
  "destination-placeholder": "Destination",
  "trip-type-default": "Type de voyage",
  "trip-type-leisure": "Loisirs",
  "trip-type-adventure": "Aventure",
  "trip-type-cultural": "Culturel",
  "trip-type-last-minute": "Dernière minute",
  "price-sort-default": "Trier par prix",
  "price-sort-low": "Prix : du plus bas au plus élevé",
  "price-sort-high": "Prix : du plus élevé au plus bas",
  "search-btn": "Rechercher",
  "footer-faq": "FAQ",
  "footer-privacy": "Politique de confidentialité",
  "footer-contact": "Contact",
  "footer-partner": "Devenir partenaire",
  "footer-disclaimer": "Remarque : TravCen est une plateforme d’intermédiation. Nous ne sommes pas responsables des services achetés sur des sites partenaires.",
  "modal-title": "Inscription Partenaire",
  "modal-company": "Nom de l'entreprise",
  "modal-website": "URL du site",
  "modal-email": "Email de contact",
  "modal-description": "Brève description",
  "modal-submit": "Envoyer",
  "login-google": "Se connecter avec Google",
  "login-facebook": "Se connecter avec Facebook"
},
es: {
  "site-title": "TravCen",
  "welcome-text": "Todas las ofertas de viaje en un solo lugar",
  "departure-placeholder": "Lugar de salida",
  "destination-placeholder": "Destino",
  "trip-type-default": "Tipo de viaje",
  "trip-type-leisure": "Ocio",
  "trip-type-adventure": "Aventura",
  "trip-type-cultural": "Cultural",
  "trip-type-last-minute": "Último minuto",
  "price-sort-default": "Ordenar por precio",
  "price-sort-low": "Precio: de menor a mayor",
  "price-sort-high": "Precio: de mayor a menor",
  "search-btn": "Buscar",
  "footer-faq": "Preguntas frecuentes",
  "footer-privacy": "Política de privacidad",
  "footer-contact": "Contacto",
  "footer-partner": "Conviértete en socio",
  "footer-disclaimer": "Nota: TravCen es una plataforma intermediaria. No nos responsabilizamos por los servicios comprados en sitios asociados.",
  "modal-title": "Registro de Socio",
  "modal-company": "Nombre de la empresa",
  "modal-website": "URL del sitio web",
  "modal-email": "Correo electrónico de contacto",
  "modal-description": "Descripción breve",
  "modal-submit": "Enviar",
  "login-google": "Iniciar sesión con Google",
  "login-facebook": "Iniciar sesión con Facebook"
},
de: {
  "site-title": "TravCen",
  "welcome-text": "Alle Reiseangebote an einem Ort",
  "departure-placeholder": "Abfahrtsort",
  "destination-placeholder": "Reiseziel",
  "trip-type-default": "Reisetyp",
  "trip-type-leisure": "Erholung",
  "trip-type-adventure": "Abenteuer",
  "trip-type-cultural": "Kulturell",
  "trip-type-last-minute": "Last Minute",
  "price-sort-default": "Nach Preis sortieren",
  "price-sort-low": "Preis: aufsteigend",
  "price-sort-high": "Preis: absteigend",
  "search-btn": "Suchen",
  "footer-faq": "FAQ",
  "footer-privacy": "Datenschutzrichtlinie",
  "footer-contact": "Kontakt",
  "footer-partner": "Partner werden",
  "footer-disclaimer": "Hinweis: TravCen ist eine Vermittlungsplattform. Wir übernehmen keine Verantwortung für Dienstleistungen, die über Partnerseiten erworben wurden.",
  "modal-title": "Partnerregistrierung",
  "modal-company": "Firmenname",
  "modal-website": "Website-URL",
  "modal-email": "Kontakt-E-Mail",
  "modal-description": "Kurzbeschreibung",
  "modal-submit": "Absenden",
  "login-google": "Mit Google anmelden",
  "login-facebook": "Mit Facebook anmelden"
},
zh: {
  "site-title": "TravCen",
  "welcome-text": "所有旅行优惠一站式呈现",
  "departure-placeholder": "出发地",
  "destination-placeholder": "目的地",
  "trip-type-default": "旅行类型",
  "trip-type-leisure": "休闲",
  "trip-type-adventure": "探险",
  "trip-type-cultural": "文化",
  "trip-type-last-minute": "最后一刻",
  "price-sort-default": "按价格排序",
  "price-sort-low": "价格：从低到高",
  "price-sort-high": "价格：从高到低",
  "search-btn": "搜索",
  "footer-faq": "常见问题",
  "footer-privacy": "隐私政策",
  "footer-contact": "联系",
  "footer-partner": "成为合作伙伴",
  "footer-disclaimer": "注意：TravCen 是中介平台。我们对通过合作网站购买的服务不承担责任。",
  "modal-title": "合作伙伴注册",
  "modal-company": "公司名称",
  "modal-website": "网站网址",
  "modal-email": "联系邮箱",
  "modal-description": "简短描述",
  "modal-submit": "提交",
  "login-google": "使用 Google 登录",
  "login-facebook": "使用 Facebook 登录"
},
ko: {
  "site-title": "TravCen",
  "welcome-text": "모든 여행 상품을 한 곳에서",
  "departure-placeholder": "출발지",
  "destination-placeholder": "목적지",
  "trip-type-default": "여행 유형",
  "trip-type-leisure": "여가",
  "trip-type-adventure": "모험",
  "trip-type-cultural": "문화",
  "trip-type-last-minute": "라스트 미닛",
  "price-sort-default": "가격순 정렬",
  "price-sort-low": "가격: 낮은 순",
  "price-sort-high": "가격: 높은 순",
  "search-btn": "검색",
  "footer-faq": "자주 묻는 질문",
  "footer-privacy": "개인정보 처리방침",
  "footer-contact": "연락처",
  "footer-partner": "파트너 되기",
  "footer-disclaimer": "참고: TravCen은 중개 플랫폼입니다. 파트너 사이트에서 구매한 서비스에 대해 책임지지 않습니다.",
  "modal-title": "파트너 등록",
  "modal-company": "회사 이름",
  "modal-website": "웹사이트 URL",
  "modal-email": "연락 이메일",
  "modal-description": "간단한 설명",
  "modal-submit": "제출",
  "login-google": "Google로 로그인",
  "login-facebook": "Facebook으로 로그인"
},
da: {
  "site-title": "TravCen",
  "welcome-text": "Alle rejsetilbud samlet ét sted",
  "departure-placeholder": "Afrejsested",
  "destination-placeholder": "Destination",
  "trip-type-default": "Rejsetype",
  "trip-type-leisure": "Ferie",
  "trip-type-adventure": "Eventyr",
  "trip-type-cultural": "Kulturel",
  "trip-type-last-minute": "Last Minute",
  "price-sort-default": "Sorter efter pris",
  "price-sort-low": "Pris: Lav til høj",
  "price-sort-high": "Pris: Høj til lav",
  "search-btn": "Søg",
  "footer-faq": "FAQ",
  "footer-privacy": "Privatlivspolitik",
  "footer-contact": "Kontakt",
  "footer-partner": "Bliv partner",
  "footer-disclaimer": "Bemærk: TravCen er en formidlingsplatform. Vi er ikke ansvarlige for tjenester købt via partnersider.",
  "modal-title": "Partnerregistrering",
  "modal-company": "Firmanavn",
  "modal-website": "Webadresse",
  "modal-email": "Kontakt e-mail",
  "modal-description": "Kort beskrivelse",
  "modal-submit": "Indsend",
  "login-google": "Log ind med Google",
  "login-facebook": "Log ind med Facebook"
},
sv: {
  "site-title": "TravCen",
  "welcome-text": "Alla resetjänster på ett ställe",
  "departure-placeholder": "Avreseort",
  "destination-placeholder": "Destination",
  "trip-type-default": "Resetyp",
  "trip-type-leisure": "Fritid",
  "trip-type-adventure": "Äventyr",
  "trip-type-cultural": "Kulturell",
  "trip-type-last-minute": "Sista minuten",
  "price-sort-default": "Sortera efter pris",
  "price-sort-low": "Pris: Lägst först",
  "price-sort-high": "Pris: Högst först",
  "search-btn": "Sök",
  "footer-faq": "Vanliga frågor",
  "footer-privacy": "Integritetspolicy",
  "footer-contact": "Kontakt",
  "footer-partner": "Bli partner",
  "footer-disclaimer": "Obs: TravCen är en mellanhand. Vi ansvarar inte för tjänster köpta via partnersidor.",
  "modal-title": "Partnerregistrering",
  "modal-company": "Företagsnamn",
  "modal-website": "Webbplats-URL",
  "modal-email": "Kontaktmejl",
  "modal-description": "Kort beskrivning",
  "modal-submit": "Skicka",
  "login-google": "Logga in med Google",
  "login-facebook": "Logga in med Facebook"
},
no: {
  "site-title": "TravCen",
  "welcome-text": "Alle reisetilbud på ett sted",
  "departure-placeholder": "Avreisested",
  "destination-placeholder": "Destinasjon",
  "trip-type-default": "Reisetype",
  "trip-type-leisure": "Fritid",
  "trip-type-adventure": "Eventyr",
  "trip-type-cultural": "Kulturell",
  "trip-type-last-minute": "Siste liten",
  "price-sort-default": "Sorter etter pris",
  "price-sort-low": "Pris: Lav til høy",
  "price-sort-high": "Pris: Høy til lav",
  "search-btn": "Søk",
  "footer-faq": "FAQ",
  "footer-privacy": "Personvern",
  "footer-contact": "Kontakt",
  "footer-partner": "Bli partner",
  "footer-disclaimer": "Merk: TravCen er en formidlerplattform. Vi tar ikke ansvar for tjenester kjøpt via partnersider.",
  "modal-title": "Partnerregistrering",
  "modal-company": "Firmanavn",
  "modal-website": "Nettside-URL",
  "modal-email": "Kontakt-e-post",
  "modal-description": "Kort beskrivelse",
  "modal-submit": "Send inn",
  "login-google": "Logg inn med Google",
  "login-facebook": "Logg inn med Facebook"
},

  };

  // Pagrindinė kalbos nustatymo funkcija
  function setLanguage(lang) {
    const langValue = typeof lang === 'string' ? lang : lang.value;
    
    if (!window.translations[langValue]) {
      console.error(`Vertimų kalbai '${langValue}' nerasta`);
      return;
    }

    localStorage.setItem('selectedLanguage', langValue);
    const t = window.translations[langValue];

    // Visų elementų atnaujinimas
    const updateElement = (id, value) => {
      const element = document.getElementById(id);
      if (!element) return;
      
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = value;
      } else if (element.tagName === 'OPTION') {
        element.textContent = value;
      } else {
        element.textContent = value;
      }
    };

    // Tekstiniai elementai
    Object.keys(t).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          element.placeholder = t[key];
        } else if (element.tagName === 'BUTTON') {
          const img = element.querySelector('img');
          element.innerHTML = img ? `${img.outerHTML} ${t[key]}` : t[key];
        } else {
          element.textContent = t[key];
        }
      }
    });

    // Specialūs atvejai (select optionai)
    const updateSelectOption = (selectId, value, translationKey) => {
      const option = document.querySelector(`#${selectId} option[value="${value}"]`);
      if (option && t[translationKey]) {
        option.textContent = t[translationKey];
      }
    };

    // Atnaujiname select optionus
    updateSelectOption('trip-type', '', 'trip-type-default');
    updateSelectOption('trip-type', 'leisure', 'trip-type-leisure');
    updateSelectOption('trip-type', 'adventure', 'trip-type-adventure');
    updateSelectOption('trip-type', 'cultural', 'trip-type-cultural');
    updateSelectOption('trip-type', 'last-minute', 'trip-type-last-minute');
    updateSelectOption('price-sort', '', 'price-sort-default');
    updateSelectOption('price-sort', 'price-low', 'price-sort-low');
    updateSelectOption('price-sort', 'price-high', 'price-sort-high');

    // HTML lang atributas
    document.documentElement.lang = langValue;

    // Google Analytics
    if (typeof gtag === 'function') {
      gtag('event', 'language_change', {
        'event_category': 'Language',
        'event_label': langValue
      });
    }
  }

  // Inicijavimas
  const supportedLangs = ['en', 'lt', 'fr', 'es', 'de', 'zh', 'ko', 'da', 'sv', 'no'];
  const browserLang = navigator.language.slice(0, 2);
  const savedLang = localStorage.getItem('selectedLanguage') || 
                   (supportedLangs.includes(browserLang) ? browserLang : 'en');

  const languageSelector = document.querySelector('.language-selector select');
  if (languageSelector) {
    languageSelector.value = savedLang;
    languageSelector.addEventListener('change', (e) => {
      setLanguage(e.target);
    });
  }

  window.setLanguage = setLanguage;
  setLanguage(savedLang);
});
