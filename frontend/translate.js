const translations = {'en': {'siteTitle': 'TravCen', 'welcomeText': 'All travel offers in one place', 'searchBtn': 'Search', 'departure': 'Departure location', 'destination': 'Destination', 'tripType': 'Trip type', 'lastMinute': 'Last Minute', 'loginGoogle': 'Sign in with Google', 'loginFacebook': 'Sign in with Facebook', 'faq': 'FAQ', 'privacy': 'Privacy Policy', 'contact': 'Contact', 'disclaimer': 'TravCen is an intermediary platform. We do not take responsibility for the services purchased through partner sites.'}, 'fr': {'siteTitle': 'TravCen', 'welcomeText': 'Toutes les offres de voyage en un seul endroit', 'searchBtn': 'Rechercher', 'departure': 'Lieu de départ', 'destination': 'Destination', 'tripType': 'Type de voyage', 'lastMinute': 'Dernière minute', 'loginGoogle': 'Se connecter avec Google', 'loginFacebook': 'Se connecter avec Facebook', 'faq': 'FAQ', 'privacy': 'Politique de confidentialité', 'contact': 'Contact', 'disclaimer': 'TravCen est une plateforme intermédiaire. Nous ne sommes pas responsables des services achetés via les sites partenaires.'}, 'es': {'siteTitle': 'TravCen', 'welcomeText': 'Todas las ofertas de viajes en un solo lugar', 'searchBtn': 'Buscar', 'departure': 'Lugar de salida', 'destination': 'Destino', 'tripType': 'Tipo de viaje', 'lastMinute': 'Último minuto', 'loginGoogle': 'Iniciar sesión con Google', 'loginFacebook': 'Iniciar sesión con Facebook', 'faq': 'Preguntas frecuentes', 'privacy': 'Política de privacidad', 'contact': 'Contacto', 'disclaimer': 'TravCen es una plataforma intermediaria. No nos responsabilizamos de los servicios adquiridos a través de sitios asociados.'}, 'de': {'siteTitle': 'TravCen', 'welcomeText': 'Alle Reiseangebote an einem Ort', 'searchBtn': 'Suchen', 'departure': 'Abfahrtsort', 'destination': 'Zielort', 'tripType': 'Reiseart', 'lastMinute': 'Last Minute', 'loginGoogle': 'Mit Google anmelden', 'loginFacebook': 'Mit Facebook anmelden', 'faq': 'FAQ', 'privacy': 'Datenschutzrichtlinie', 'contact': 'Kontakt', 'disclaimer': 'TravCen ist eine Vermittlungsplattform. Wir übernehmen keine Verantwortung für über Partnerseiten gekaufte Dienstleistungen.'}, 'zh': {'siteTitle': 'TravCen', 'welcomeText': '所有旅行优惠尽在一处', 'searchBtn': '搜索', 'departure': '出发地', 'destination': '目的地', 'tripType': '旅行类型', 'lastMinute': '最后时刻', 'loginGoogle': '使用 Google 登录', 'loginFacebook': '使用 Facebook 登录', 'faq': '常见问题', 'privacy': '隐私政策', 'contact': '联系', 'disclaimer': 'TravCen 是一个中介平台。我们不对通过合作网站购买的服务负责。'}, 'ko': {'siteTitle': 'TravCen', 'welcomeText': '모든 여행 상품을 한 곳에', 'searchBtn': '검색', 'departure': '출발 위치', 'destination': '목적지', 'tripType': '여행 유형', 'lastMinute': '마지막 순간', 'loginGoogle': 'Google로 로그인', 'loginFacebook': 'Facebook으로 로그인', 'faq': '자주 묻는 질문', 'privacy': '개인정보 처리방침', 'contact': '문의하기', 'disclaimer': 'TravCen은 중개 플랫폼입니다. 파트너 사이트를 통해 구매한 서비스에 대한 책임은 지지 않습니다.'}, 'da': {'siteTitle': 'TravCen', 'welcomeText': 'Alle rejsetilbud på ét sted', 'searchBtn': 'Søg', 'departure': 'Afrejsested', 'destination': 'Destination', 'tripType': 'Rejsetype', 'lastMinute': 'Sidste øjeblik', 'loginGoogle': 'Log ind med Google', 'loginFacebook': 'Log ind med Facebook', 'faq': 'FAQ', 'privacy': 'Privatlivspolitik', 'contact': 'Kontakt', 'disclaimer': 'TravCen er en mellemmand. Vi påtager os intet ansvar for tjenester købt via partnersider.'}, 'no': {'siteTitle': 'TravCen', 'welcomeText': 'Alle reisetilbud på ett sted', 'searchBtn': 'Søk', 'departure': 'Avreisested', 'destination': 'Destinasjon', 'tripType': 'Reisetype', 'lastMinute': 'Siste liten', 'loginGoogle': 'Logg inn med Google', 'loginFacebook': 'Logg inn med Facebook', 'faq': 'Ofte stilte spørsmål', 'privacy': 'Personvernpolicy', 'contact': 'Kontakt', 'disclaimer': 'TravCen er en mellomplattform. Vi tar ikke ansvar for tjenester kjøpt via partnernettsteder.'}, 'sv': {'siteTitle': 'TravCen', 'welcomeText': 'Alla resetilbud på ett ställe', 'searchBtn': 'Sök', 'departure': 'Avreseort', 'destination': 'Destination', 'tripType': 'Resetyper', 'lastMinute': 'Sista minuten', 'loginGoogle': 'Logga in med Google', 'loginFacebook': 'Logga in med Facebook', 'faq': 'Vanliga frågor', 'privacy': 'Integritetspolicy', 'contact': 'Kontakt', 'disclaimer': 'TravCen är en mellanhand. Vi ansvarar inte för tjänster köpta via partnersidor.'}, 'lt': {'siteTitle': 'TravCen', 'welcomeText': 'Visi kelionių pasiūlymai vienoje vietoje', 'searchBtn': 'Ieškoti', 'departure': 'Išvykimo vieta', 'destination': 'Kelionės tikslas', 'tripType': 'Kelionės tipas', 'lastMinute': 'Paskutinės minutės', 'loginGoogle': 'Prisijungti su Google', 'loginFacebook': 'Prisijungti su Facebook', 'faq': 'DUK', 'privacy': 'Privatumo politika', 'contact': 'Kontaktai', 'disclaimer': 'TravCen yra tarpininkavimo platforma. Mes neprisiimame atsakomybės už partnerių svetainėse įsigytų paslaugų kokybę.'}};

function setLanguage(lang) {
  const t = translations[lang];
  if (!t) return;

  const safeSet = (id, func) => {
    const el = document.getElementById(id);
    if (el) func(el);
  };

  safeSet("site-title", el => el.innerText = t.siteTitle);
  safeSet("welcome-text", el => el.innerText = t.welcomeText);
  safeSet("search-btn", el => el.innerText = t.searchBtn);
  safeSet("departure", el => el.placeholder = t.departure);
  safeSet("destination", el => el.placeholder = t.destination);

  const tripType = document.getElementById("trip-type");
  if (tripType && tripType.options.length >= 5) {
    tripType.options[0].text = t.tripType;
    tripType.options[4].text = t.lastMinute;
  }

  safeSet("login-google", el => el.innerText = t.loginGoogle);
  safeSet("login-facebook", el => el.innerText = t.loginFacebook);
  safeSet("footer-disclaimer", el => el.innerText = t.disclaimer);
  safeSet("footer-faq", el => el.innerText = t.faq);
  safeSet("footer-privacy", el => el.innerText = t.privacy);
  safeSet("footer-contact", el => el.innerText = t.contact);
}
