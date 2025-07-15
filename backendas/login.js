document.getElementById("login-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  fetch("http://localhost:3000/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include", // ← ŠITA EILUTĖ LABAI SVARBI
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
