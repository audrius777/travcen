
document.addEventListener("DOMContentLoaded", function () {
  const userLang = localStorage.getItem("lang") || "en";
  setLanguage(userLang);

  const selector = document.getElementById("language-select");
  if (selector) {
    selector.value = userLang;
    selector.addEventListener("change", function () {
      const selected = this.value;
      localStorage.setItem("lang", selected);
      setLanguage(selected);
    });
  }
});

function setLanguage(lang) {
  fetch(`lang/${lang}.json`)
    .then(res => res.json())
    .then(translations => {
      document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[key]) {
          if (el.placeholder !== undefined && el.tagName === "INPUT") {
            el.placeholder = translations[key];
          } else {
            el.textContent = translations[key];
          }
        }
      });
    });
}
