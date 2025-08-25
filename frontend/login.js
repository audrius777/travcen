const BACKEND_URL = window.location.hostname.includes("localhost")
  ? "http://localhost:3000"
  : "https://travcen-backend.onrender.com";

// Statinių mygtukų sekimas
document.getElementById("login-google")?.addEventListener("click", () => {
  console.log("Google login mygtukas paspaustas");
});

document.getElementById("login-facebook")?.addEventListener("click", () => {
  console.log("Facebook login mygtukas paspaustas");
});

document.getElementById("login-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  
  const form = e.target;
  const email = form.email.value.trim();
  const password = form.password.value;
  const errorElement = document.getElementById("error-message");
  const submitBtn = form.querySelector('button[type="submit"]');

  // Validacija
  if (!email || !password) {
    errorElement.innerText = "Prašome užpildyti visus laukus";
    return;
  }

  if (password.length < 8) {
    errorElement.innerText = "Slaptažodis turi būti bent 8 simbolių ilgio";
    return;
  }

  // UI būsenos keitimas
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Prisijungiama...';

  try {
    const response = await fetch(`${BACKEND_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      window.location.href = "/";
    } else {
      errorElement.innerText = data.message || "Neteisingi prisijungimo duomenys";
    }
  } catch (error) {
    errorElement.innerText = "Klaida jungiantis prie serverio. Bandykite vėliau.";
    console.error("Prisijungimo klaida:", error);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Prisijungti";
  }
});
