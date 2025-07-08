document.getElementById("login-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include", // LABAI SVARBU!
    body: JSON.stringify({ email, password })
  })
  .then(res => {
    if (res.ok) {
      window.location.href = "/"; // grįžtam į pradžią
    } else {
      document.getElementById("error-message").innerText = "Neteisingi prisijungimo duomenys.";
    }
  })
  .catch(() => {
    document.getElementById("error-message").innerText = "Klaida jungiantis prie serverio.";
  });
});

