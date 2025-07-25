// frontend/modal.js
class ModalManager {
  constructor(modalId) {
    this.modal = document.getElementById(modalId);
    this.initEvents();
  }

  initEvents() {
    // Uždarymo mygtukas
    const closeBtn = this.modal.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    // Uždarymas paspaudus už modal'o
    window.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });
  }

  open() {
    this.modal.style.display = 'block';
  }

  close() {
    this.modal.style.display = 'none';
  }
}

// Eksportas naudojant ES modules
export default ModalManager;

// Alternatyvus CommonJS eksportas, jei reikia:
// module.exports = ModalManager;
