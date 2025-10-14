[file name]: script.js
[file content begin]
const API_BASE_URL = 'https://travcen-backendas.onrender.com/api';

class OffersManager {
    constructor() {
        this.offers = [];
        this.filteredOffers = [];
        this.currentFilters = {};
    }

    // Įkelti pasiūlymus iš API
    async loadOffers(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            
            // 👇 PATAISYTA - Pridėti departureLocation ir destination parametrus
            if (filters.departure) queryParams.append('departureLocation', filters.departure);
            if (filters.destination) queryParams.append('destination', filters.destination);
            if (filters.tripType) queryParams.append('tripType', filters.tripType);
            if (filters.maxPrice) queryParams.append('maxPrice', filters.maxPrice);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);
            if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
            if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);

            const response = await fetch(`${API_BASE_URL}/offers?${queryParams}`);
            
            if (!response.ok) {
                throw new Error(`API klaida: ${response.status}`);
            }

            const data = await response.json();
            this.offers = data.offers || [];
            this.filteredOffers = [...this.offers];
            
            return this.offers;
            
        } catch (error) {
            console.error('Klaida įkeliant pasiūlymus:', error);
            this.showError('Nepavyko įkelti pasiūlymų. Bandykite vėliau.');
            return [];
        }
    }

    // Atvaizduoti pasiūlymus kortelėse
    displayOffers(offers = this.filteredOffers) {
        const cardList = document.getElementById('card-list');
        if (!cardList) return;

        if (offers.length === 0) {
            cardList.innerHTML = `
                <div class="no-results">
                    <h3>Nerasta pasiūlymų</h3>
                    <p>Pakeiskite paieškos kriterijus arba bandykite vėliau</p>
                </div>
            `;
            return;
        }

        cardList.innerHTML = offers.map(offer => this.createOfferCard(offer)).join('');
    }

    // Sukurti pasiūlymo kortelę
    createOfferCard(offer) {
    const currentLang = localStorage.getItem('selectedLanguage') || 'en';
    const formattedDate = this.formatDateByLanguage(offer.tripDate, currentLang);
    const validUntil = this.formatDateByLanguage(offer.validUntil, currentLang);

    return `
<div class="card" 
     data-id="${offer._id}"
     data-from="${offer.companyName}"
     data-to="${offer.tripType}"
     data-price="${offer.price}"
     data-type="${offer.tripType}"
     data-date="${offer.tripDate}">
    <a href="${offer.offerUrl}" target="_blank" class="card-link">
        <div class="card-content">
            <h3>${offer.tripType}</h3>
            <p class="company">${offer.companyName}</p>
            <p class="location-info">From: ${offer.departureLocation} → To: ${offer.destination}</p>
            <p class="departure-date">Trip Date: ${formattedDate}</p>
            <p class="valid-until">Valid Until: ${validUntil}</p>
            <p class="price">Price: €${offer.price}</p>
            <p class="hotel-stars">Hotel: ${'⭐'.repeat(offer.hotelRating)}</p>
        </div>
    </a>
</div>
`;
}

    // Filtruoti pasiūlymus pagal vartotojo kriterijus
    filterOffers(filters = {}) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        
        this.filteredOffers = this.offers.filter(offer => {
            // 👇 PATAISYTA - Teisingas filtravimas pagal departureLocation ir destination
            const matchesDeparture = !filters.departure || filters.departure === '' || 
                (offer.departureLocation && offer.departureLocation.toLowerCase().includes(filters.departure.toLowerCase()));
            
            const matchesDestination = !filters.destination || filters.destination === '' || 
                (offer.destination && offer.destination.toLowerCase().includes(filters.destination.toLowerCase()));
            
            const matchesTripType = !filters.tripType || filters.tripType === '' || 
                (offer.tripType && offer.tripType.toLowerCase().includes(filters.tripType.toLowerCase()));
            
            const matchesPrice = !filters.maxPrice || offer.price <= parseFloat(filters.maxPrice);
            
            const matchesStartDate = !filters.startDate || 
                new Date(offer.tripDate) >= new Date(filters.startDate);
            
            const matchesEndDate = !filters.endDate || 
                new Date(offer.tripDate) <= new Date(filters.endDate);

            return matchesDeparture && matchesDestination && matchesTripType && 
                   matchesPrice && matchesStartDate && matchesEndDate;
        });

        // Rikiavimas
        if (filters.priceSort === 'price-low') {
            this.filteredOffers.sort((a, b) => a.price - b.price);
        } else if (filters.priceSort === 'price-high') {
            this.filteredOffers.sort((a, b) => b.price - a.price);
        }

        this.displayOffers();
    }

    // Rodyti klaidos pranešimą
    showError(message) {
        const cardList = document.getElementById('card-list');
        if (cardList) {
            cardList.innerHTML = `
                <div class="error-message">
                    <h3>Klaida</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }

    // Datos formatavimas pagal kalbą
    formatDateByLanguage(dateString, languageCode) {
        if (!dateString) return 'Date not specified';
        
        const date = new Date(dateString);
        const locale = this.getLocaleByLanguage(languageCode);
        
        return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Kalbos kodų atitikmenys
    getLocaleByLanguage(languageCode) {
        const locales = {
            en: 'en-US',
            lt: 'lt-LT',
            fr: 'fr-FR',
            es: 'es-ES',
            de: 'de-DE',
            zh: 'zh-CN',
            ko: 'ko-KR',
            da: 'da-DK',
            sv: 'sv-SE',
            no: 'no-NO'
        };
        return locales[languageCode] || 'en-US';
    }
}

// Globalus offers manager
const offersManager = new OffersManager();

// Dokumento užkrovimas
document.addEventListener("DOMContentLoaded", async () => {
    // Įkelti pasiūlymus iš karto
    await offersManager.loadOffers();
    offersManager.displayOffers();

    // Paieškos mygtuko event listener
    const searchBtn = document.getElementById("search-btn");
    if (searchBtn) {
        searchBtn.addEventListener("click", handleSearch);
    }

    // Modalų valdymas (išlaikomas iš senos versijos)
    setupModals();
});

// Paieškos apdorojimas
function handleSearch() {
    const filters = {
        departure: document.getElementById("departure").value,
        destination: document.getElementById("destination").value,
        tripType: document.getElementById("trip-type").value,
        priceSort: document.getElementById("price-sort").value,
        startDate: document.getElementById("departure-date").value
    };

    offersManager.filterOffers(filters);
}

// Modalų valdymas (išlaikomas funkcionalumas)
function setupModals() {
    const partnerModal = document.getElementById("partner-modal");
    const partnerLink = document.getElementById("footer-partner");
    const partnerCloseBtn = partnerModal ? partnerModal.querySelector(".close") : null;

    if (partnerLink) {
        partnerLink.addEventListener("click", (e) => {
            e.preventDefault();
            partnerModal.style.display = "block";
        });
    }

    if (partnerCloseBtn) {
        partnerCloseBtn.addEventListener("click", () => {
            partnerModal.style.display = "none";
        });
    }

    if (partnerModal) {
        window.addEventListener("click", (e) => {
            if (e.target === partnerModal) {
                partnerModal.style.display = "none";
            }
        });
    }

    // Partnerio formos valdymas (išlaikomas)
    const partnerForm = document.getElementById('partner-form');
    if (partnerForm) {
        partnerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                company: document.getElementById('modal-company').value.trim(),
                website: document.getElementById('modal-website').value.trim(),
                email: document.getElementById('modal-email').value.trim(),
                description: document.getElementById('modal-description').value.trim()
            };

            // Validacija
            if (!formData.company || !formData.website || !formData.email) {
                alert('Užpildykite privalomus laukus: įmonė, svetainė ir el. paštas');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/partners/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    alert('Užklausa išsiųsta! Administratorius susisieks per 24 val.');
                    if (partnerModal) partnerModal.style.display = 'none';
                    partnerForm.reset();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Serverio klaida');
                }

            } catch (error) {
                console.error('Klaida:', error);
                alert(`Registracija nepavyko: ${error.message || 'Bandykite vėliau.'}`);
            }
        });
    }
}

// Kalbos pasikeitimo apdorojimas
if (window.setLanguage) {
    const originalSetLanguage = window.setLanguage;
    window.setLanguage = function(lang) {
        originalSetLanguage(lang);
        // Perkrauti pasiūlymus su nauja kalba
        offersManager.displayOffers();
    };
}
[file content end]
