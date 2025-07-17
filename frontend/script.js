
document.addEventListener("DOMContentLoaded", () => {
  const languageSelector = document.getElementById("language-select");
  if (languageSelector) {
    languageSelector.addEventListener("change", (event) => {
      const selectedLang = event.target.value;
      localStorage.setItem("selectedLanguage", selectedLang);
      applyTranslations(selectedLang);
    });

    const savedLang = localStorage.getItem("selectedLanguage") || "lt";
    languageSelector.value = savedLang;
    applyTranslations(savedLang);
  }
});

function applyTranslations(lang) {
  if (!window.translations || !window.translations[lang]) return;

  const elements = document.querySelectorAll("[data-i18n]");
  elements.forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (window.translations[lang][key]) {
      el.textContent = window.translations[lang][key];
    }
  });
}

