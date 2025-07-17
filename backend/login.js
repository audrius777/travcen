const BACKEND_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://travcen-backend.onrender.com"; // ← pakeisk, jei naudoji kitą backend adresą

document.getElementById("login-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  fetch(`${BACKEND_URL}/api/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({ email, password })
  })
  .then(res => {
    if (res.ok) {
      window.location.href = "/";
    } else {
      document.getElementById("error-message").innerText = "Neteisingi prisijungimo duomenys.";
    }
  })
  .catch(() => {
    document.getElementById("error-message").innerText = "Klaida jungiantis prie serverio.";
  });
});