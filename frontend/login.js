document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const googleLoginButton = document.getElementById("google-login-button");
  const BACKEND_URL = "https://travcen.onrender.com";

  if (!loginForm) return;

  // Pašalinti seną prisijungimo formos submit event listenerį
  loginForm.removeEventListener("submit", async function() {});

  // Google prisijungimo funkcionalumas
  if (googleLoginButton) {
    googleLoginButton.addEventListener("click", () => {
      // Nukreipimas į Google autentifikacijos puslapį
      window.location.href = `${BACKEND_URL}/auth/google`;
    });
  }

  // Papildoma: Enter mygtuko palaikymas pašalintas, nes formos submit nebėra
});
