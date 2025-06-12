
const translations = {
  en: {
    siteTitle: "TravCen", welcomeText: "All travel offers in one place", searchBtn: "Search",
    departure: "Departure location", destination: "Destination", tripType: "Trip type", lastMinute: "Last Minute",
    loginGoogle: "Sign in with Google", loginFacebook: "Sign in with Facebook", faq: "FAQ",
    privacy: "Privacy Policy", contact: "Contact", disclaimer: "TravCen is an intermediary platform. We do not take responsibility for services purchased through partner sites."
  },
  fr: {
    siteTitle: "TravCen", welcomeText: "Toutes les offres de voyage en un seul endroit", searchBtn: "Rechercher",
    departure: "Lieu de départ", destination: "Destination", tripType: "Type de voyage", lastMinute: "Dernière minute",
    loginGoogle: "Se connecter avec Google", loginFacebook: "Se connecter avec Facebook", faq: "FAQ",
    privacy: "Politique de confidentialité", contact: "Contact", disclaimer: "TravCen est une plateforme intermédiaire. Nous ne sommes pas responsables des services achetés via des sites partenaires."
  },
  lt: {
    siteTitle: "TravCen", welcomeText: "Visi kelionių pasiūlymai vienoje vietoje", searchBtn: "Ieškoti",
    departure: "Išvykimo vieta", destination: "Kelionės tikslas", tripType: "Kelionės tipas", lastMinute: "Paskutinės minutės",
    loginGoogle: "Prisijungti su Google", loginFacebook: "Prisijungti su Facebook", faq: "DUK",
    privacy: "Privatumo politika", contact: "Kontaktai", disclaimer: "TravCen yra tarpininkavimo platforma. Neatsakome už paslaugų kokybę."
  }
};

function setLanguage(lang) {
  const t = translations[lang];
  if (!t) return;
  document.getElementById('site-title').innerText = t.siteTitle;
  document.getElementById('welcome-text').innerText = t.welcomeText;
  document.getElementById('search-btn').innerText = t.searchBtn;
  document.getElementById('departure').placeholder = t.departure;
  document.getElementById('destination').placeholder = t.destination;
  document.getElementById('trip-type').options[0].text = t.tripType;
  document.getElementById('trip-type').options[4].text = t.lastMinute;
  document.getElementById('login-google').children[1].innerText = t.loginGoogle;
  document.getElementById('login-facebook').children[1].innerText = t.loginFacebook;
  document.getElementById('footer-faq').innerText = t.faq;
  document.getElementById('footer-privacy').innerText = t.privacy;
  document.getElementById('footer-contact').innerText = t.contact;
  document.getElementById('footer-disclaimer').innerText = t.disclaimer;
}
