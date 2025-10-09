export const currencyConverter = {
  // Valiutų kursai (galima atnaujinti arba gauti iš API)
  exchangeRates: {
    USD: 0.85,  // 1 USD = 0.85 EUR
    GBP: 1.18,  // 1 GBP = 1.18 EUR
    EUR: 1.00   // 1 EUR = 1.00 EUR
  },

  /**
   * Konvertuoja kainą į EUR
   * @param {number} amount - Kaina
   * @param {string} fromCurrency - Iš kurios valiutos
   * @returns {Object} Konvertavimo rezultatas
   */
  async convertToEur(amount, fromCurrency) {
    try {
      const currency = fromCurrency?.toUpperCase() || 'EUR';
      
      // Jei jau EUR, grąžiname originalią kainą
      if (currency === 'EUR') {
        return {
          value: parseFloat(amount),
          rate: 1.0,
          originalAmount: amount,
          originalCurrency: 'EUR'
        };
      }

      // Gauname kursą
      const rate = this.exchangeRates[currency];
      
      if (!rate) {
        throw new Error(`Nepalaikoma valiuta: ${currency}`);
      }

      // Konvertuojame
      const converted = parseFloat(amount) * rate;
      
      return {
        value: parseFloat(converted.toFixed(2)),
        rate: rate,
        originalAmount: parseFloat(amount),
        originalCurrency: currency
      };

    } catch (error) {
      console.error('Valiutos konvertavimo klaida:', error);
      
      // Grąžiname klaidos atveju originalią kainą
      return {
        value: parseFloat(amount),
        rate: 0,
        originalAmount: parseFloat(amount),
        originalCurrency: fromCurrency || 'EUR',
        error: error.message
      };
    }
  },

  /**
   * Atnaujina valiutų kursus
   * @param {Object} newRates - Nauji valiutų kursai
   */
  updateRates(newRates) {
    this.exchangeRates = { ...this.exchangeRates, ...newRates };
    console.log('Valiutų kursai atnaujinti:', this.exchangeRates);
  },

  /**
   * Gauna dabartinius valiutų kursus
   * @returns {Object} Valiutų kursai
   */
  getCurrentRates() {
    return { ...this.exchangeRates };
  }
};

// Numatytieji kursai
console.log('💱 Valiutų konverteris inicijuotas');
