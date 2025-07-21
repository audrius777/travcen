document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login-button");
  const errorMessage = document.getElementById("error-message");
  const BACKEND_URL = "https://travcen.onrender.com";

  if (!loginForm) return;

  loginForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    // Validacija
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
      errorMessage.textContent = "Prašome užpildyti visus laukus";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorMessage.textContent = "Įveskite tinkamą el. pašto adresą";
      return;
    }

    // Užklausos paruošimas
    try {
      // UI pakeitimai užklausos metu
      loginButton.disabled = true;
      loginButton.textContent = "Prisijungiama...";
      errorMessage.textContent = "";

      const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Prisijungimas nepavyko");
      }

      // Sėkmingas prisijungimas
      const data = await response.json();
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userEmail", email);
      
      window.location.href = data.redirectUrl || "/";
      
    } catch (error) {
      console.error("Prisijungimo klaida:", error);
      errorMessage.textContent = error.message || 
        "Įvyko klaida bandant prisijungti. Bandykite vėliau.";
      
      // Slaptažodžio lauko išvalymas saugumo sumetimais
      passwordInput.value = "";
    } finally {
      // Atstatome UI nepriklausomai nuo rezultato
      loginButton.disabled = false;
      loginButton.textContent = "Prisijungti";
    }
  });

  // Papildoma: Enter mygtuko palaikymas
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      loginForm.dispatchEvent(new Event("submit"));
    }
  });
});
