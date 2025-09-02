// translate.js - Pilnai atnaujinta ir pataisyta versija
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
      "login-facebook": "Sign in with Facebook",
      "footer-about": "About Us",
      "about-title": "About TravCen",
      "about-text-1": "TravCen is a smart travel search platform that brings together offers from multiple travel agencies into one convenient place.",
      "about-text-2": "We help travelers quickly and easily find the best vacation, cultural, adventure, and last-minute trips — saving both time and money.",
      "about-text-3": "Unlike traditional agencies, TravCen is not a direct travel provider. Instead, we act as a transparent aggregator, giving users the freedom to compare and choose the most suitable travel options from trusted partners.",
      "about-text-4": "Our mission is simple: to make travel planning easier, smarter, and more accessible for everyone.",
      "about-text-5": "Have questions or want to collaborate?<br>📬 Contact us at info@travcen.com",
      "contact-title": "Contact Us",
      "contact-text": "Contact us at info@travcen.com"
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
      "login-facebook": "Prisijungti su Facebook",
      "footer-about": "Apie mus",
      "about-title": "Apie TravCen",
      "about-text-1": "TravCen yra išmani kelionių paieškos platforma, kuri sujungia kelionių pasiūlymus iš įvairių kelionių agentūrų į vieną patogią vietą.",
      "about-text-2": "Mes padedame keliautojams greitai ir lengvai rasti geriausias atostogų, kultūrinių, nuotykių ir last minute keliones — taupydami ir laiką, ir pinigus.",
      "about-text-3": "Skirtingai nuo tradicinių agentūrų, TravCen nėra tiesioginis kelionių tiekėjas. Vietoj to, mes veikiame kaip skaidrus agregatorius, suteikiantis vartotojams laisvę lyginti ir rinktis tinkamiausias kelionių parinktis iš patikimų partnerių.",
      "about-text-4": "Mūsų misija paprasta: padaryti kelionių planavimą lengvesnį, išmanesnį ir prieinamesnį visiems.",
      "about-text-5": "Turite klausimų ar norite bendradarbiauti?<br>📬 Susisiekite su mumis info@travcen.com",
      "contact-title": "Susisiekite su mumis",
      "contact-text": "Susisiekite su mumis info@travcen.com"
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
      "footer-disclaimer": "Remarque : TravCen est une plateforme d'intermédiation. Nous ne sommes pas responsables des services achetés sur des sites partenaires.",
      "modal-title": "Inscription Partenaire",
      "modal-company": "Nom de l'entreprise",
      "modal-website": "URL du site",
      "modal-email": "Email de contact",
      "modal-description": "Brève description",
      "modal-submit": "Envoyer",
      "login-google": "Se connecter avec Google",
      "login-facebook": "Se connecter avec Facebook",
      "footer-about": "À propos de nous",
      "about-title": "À propos de TravCen",
      "about-text-1": "TravCen est une plateforme de recherche de voyages intelligente qui regroupe les offres de plusieurs agences de voyages en un seul endroit pratique.",
      "about-text-2": "Nous aidons les voyageurs à trouver rapidement et facilement les meilleures vacances, séjours culturels, aventures et last minute — en économisant à la fois du temps et de l'argent.",
      "about-text-3": "Contrairement aux agences traditionnelles, TravCen n'est pas un prestataire de voyages direct. Au lieu de cela, nous agissons comme un agrégateur transparent, donnant aux utilisateurs la liberté de comparer et de choisir les options de voyage les plus adaptées auprès de partenaires de confiance.",
      "about-text-4": "Notre mission est simple : rendre la planification des voyages plus facile, plus intelligente et plus accessible pour tous.",
      "about-text-5": "Des questions ou envie de collaborer ?<br>📬 Contactez-nous à info@travcen.com",
      "contact-title": "Contactez-nous",
      "contact-text": "Contactez-nous à info@travcen.com"
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
      "login-facebook": "Iniciar sesión con Facebook",
      "footer-about": "Sobre nosotros",
      "about-title": "Sobre TravCen",
      "about-text-1": "TravCen es una plataforma inteligente de búsqueda de viajes que reúne ofertas de múltiples agencias de viajes en un lugar conveniente.",
      "about-text-2": "Ayudamos a los viajeros a encontrar rápida y fácilmente las mejores vacaciones, viajes culturales, de aventura y de último minuto, ahorrando tiempo y dinero.",
      "about-text-3": "A diferencia de las agencias tradicionales, TravCen no es un proveedor directo de viajes. En cambio, actuamos como un agregador transparente, dando a los usuarios la libertad de comparar y elegir las opciones de viaje más adecuadas de socios confiables.",
      "about-text-4": "Nuestra misión es simple: hacer que la planificación de viajes sea más fácil, inteligente y accesible para todos.",
      "about-text-5": "¿Tienes preguntas o quieres colaborar?<br>📬 Contáctanos en info@travcen.com",
      "contact-title": "Contáctanos",
      "contact-text": "Contáctanos en info@travcen.com"
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
      "login-facebook": "Mit Facebook anmelden",
      "footer-about": "Über uns",
      "about-title": "Über TravCen",
      "about-text-1": "TravCen ist eine intelligente Reisesuchplattform, die Angebote mehrerer Reisebüros an einem praktischen Ort zusammenführt.",
      "about-text-2": "Wir helfen Reisenden, schnell und einfach die besten Urlaubs-, Kultur-, Abenteuer- und Last-Minute-Reisen zu finden und sparen dabei Zeit und Geld.",
      "about-text-3": "Im Gegensatz zu traditionellen Agenturen ist TravCen kein direkter Reiseanbieter. Stattdessen agieren wir als transparenter Aggregator und geben den Nutzern die Freiheit, die am besten geeigneten Reiseoptionen von vertrauenswürdigen Partnern zu vergleichen und auszuwählen.",
      "about-text-4": "Unsere Mission ist einfach: Reiseplanung für alle einfacher, smarter und zugänglicher zu machen.",
      "about-text-5": "Haben Sie Fragen oder möchten Sie zusammenarbeiten?<br>📬 Kontaktieren Sie uns unter info@travcen.com",
      "contact-title": "Kontaktieren Sie uns",
      "contact-text": "Kontaktieren Sie uns unter info@travcen.com"
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
      "login-facebook": "使用 Facebook 登录",
      "footer-about": "关于我们",
      "about-title": "关于 TravCen",
      "about-text-1": "TravCen 是一个智能旅行搜索平台，将多家旅行社的优惠汇集到一个方便的地方。",
      "about-text-2": "我们帮助旅行者快速轻松地找到最好的假期、文化、冒险和最后一刻旅行——节省时间和金钱。",
      "about-text-3": "与传统的旅行社不同，TravCen 不是直接的旅行提供商。相反，我们作为一个透明的聚合器，让用户可以自由比较和选择来自可信合作伙伴的最合适的旅行选项。",
      "about-text-4": "我们的使命很简单：让旅行计划对每个人来说都更轻松、更智能、更易访问。",
      "about-text-5": "有问题或想合作？<br>📬 联系我们：info@travcen.com",
      "contact-title": "联系我们",
      "contact-text": "联系我们：info@travcen.com"
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
      "login-facebook": "Facebook으로 로그인",
      "footer-about": "회사 소개",
      "about-title": "TravCen 소개",
      "about-text-1": "TravCen은 여러 여행사들의 제안을 한 곳에 모아주는 스마트 여행 검색 플랫폼입니다.",
      "about-text-2": "우리는 여행자들이 최고의 휴가, 문화, 어드벤처, 라스트 미닛 여행을 빠르고 쉽게 찾을 수 있도록 도와 시간과 돈을 절약합니다.",
      "about-text-3": "기존 여행사와 달리 TravCen은 직접적인 여행 제공업체가 아닙니다. 대신 우리는 투명한 집계자로 활동하여 사용자가 신뢰할 수 있는 파트너로부터 가장 적합한 여행 옵션을 비교하고 선택할 수 있는 자유를 제공합니다.",
      "about-text-4": "우리의 미션은 간단합니다: 모두를 위해 여행 계획을 더 쉽고, 더 스마트하며, 더 접근하기 쉽게 만드는 것입니다.",
      "about-text-5": "질문이 있거나 협업을 원하시나요?<br>📬 info@travcen.com으로 문의하세요",
      "contact-title": "문의하기",
      "contact-text": "info@travcen.com으로 문의하세요"
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
      "login-facebook": "Log ind med Facebook",
      "footer-about": "Om os",
      "about-title": "Om TravCen",
      "about-text-1": "TravCen er en smart rejsesøgeplatform, der samler tilbud fra flere rejsebureauer på ét bekvemt sted.",
      "about-text-2": "Vi hjælper rejsende med at finde de bedste ferier, kulturelle, eventyr- og last minute-rejser hurtigt og nemt — og sparer både tid og penge.",
      "about-text-3": "I modsætning til traditionelle bureauer er TravCen ikke en direkte rejseudbyder. I stedet fungerer vi som en transparent aggregator, der giver brugerne frihed til at sammenligne og vælge de mest passende rejsemuligheder fra pålidelige partnere.",
      "about-text-4": "Vores mission er enkel: at gøre rejseplanlægning nemmere, smartere og mere tilgængelig for alle.",
      "about-text-5": "Har du spørgsmål eller ønsker at samarbejde?<br>📬 Kontakt os på info@travcen.com",
      "contact-title": "Kontakt os",
      "contact-text": "Kontakt os på info@travcen.com"
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
      "login-facebook": "Logga in med Facebook",
      "footer-about": "Om oss",
      "about-title": "Om TravCen",
      "about-text-1": "TravCen är en smart resesökningsplattform som samlar erbjudanden från flera resebyråer på ett bekvämt ställe.",
      "about-text-2": "Vi hjälper resenärer att snabbt och enkelt hitta de bästa semestern, kultur-, äventyr- och sista minuten-resorna — och sparar både tid och pengar.",
      "about-text-3": "Till skillnad från traditionella byråer är TravCen inte en direkt reseleverantör. Istället agerar vi som en transparent aggregator som ger användarna frihet att jämföra och välja de mest lämpliga resealternativen från pålitliga partners.",
      "about-text-4": "Vårt uppdrag är enkelt: att göra reseplanering enklare, smartare och mer tillgängligt för alla.",
      "about-text-5": "Har du frågor eller vill samarbeta?<br>📬 Kontakta oss på info@travcen.com",
      "contact-title": "Kontakta oss",
      "contact-text": "Kontakta oss på info@travcen.com"
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
      "login-facebook": "Logg inn med Facebook",
      "footer-about": "Om oss",
      "about-title": "Om TravCen",
      "about-text-1": "TravCen er en smart reisesøkeplattform som samler tilbud fra flere reisebyråer på ett sted.",
      "about-text-2": "Vi hjelper reisende med å raskt og enkelt finne de beste ferie-, kultur-, eventyr- og siste minutt-reisene — og sparer både tid og penger.",
      "about-text-3": "I motsetning til tradisjonelle byråer er TravCen ikke en direkte reiseleverandør. I stedet fungerer vi som en transparent aggregator som gir brukerne frihet til å sammenligne og velge de mest passende reisealternativene fra pålitelige partnere.",
      "about-text-4": "Vår misjon er enkel: å gjøre reiseplanlegging enklere, smartere og mer tilgjengelig for alle.",
      "about-text-5": "Har du spørsmål eller ønsker å samarbeide?<br>📬 Kontakt oss på info@travcen.com",
      "contact-title": "Kontakt oss",
      "contact-text": "Kontakt oss på info@travcen.com"
    }
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

    // Tekstiniai elementai (PATAISYTA: pridėta input laukų atnaujinimo logika)
    Object.keys(t).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          // Specialus atvejis - departure ir destination laukai
          if (key === 'departure-placeholder') {
            document.getElementById('departure').placeholder = t[key];
          } else if (key === 'destination-placeholder') {
            document.getElementById('destination').placeholder = t[key];
          } else {
            element.placeholder = t[key];
          }
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
