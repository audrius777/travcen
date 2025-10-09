import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class HTMLGenerator {
    constructor() {
        this.formsDir = path.join(__dirname, '../../frontend/partner-forms');
    }

    // Sukuriamas HTML failas partneriui (siuntimui el. paštu)
    async generatePartnerForm() {
        try {
            // Sukuriame forms direktoriją jei neegzistuoja
            await fs.mkdir(this.formsDir, { recursive: true });

            // Sugeneruojame unikalų failo pavadinimą
            const formId = 'partner-form-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
            const fileName = `${formId}.html`;
            const filePath = path.join(this.formsDir, fileName);
            const formUrl = `/partner-forms/${fileName}`;

            const htmlContent = this.buildHTMLTemplate(formId);

            // Išsaugome HTML failą
            await fs.writeFile(filePath, htmlContent, 'utf-8');

            return {
                success: true,
                formUrl: formUrl,
                fileName: fileName,
                message: 'HTML forma sėkmingai sugeneruota'
            };

        } catch (error) {
            console.error('HTML formos generavimo klaida:', error);
            throw new Error('Nepavyko sugeneruoti HTML formos');
        }
    }

    // HTML šablonas, kuris veiks offline ir siųs duomenis į API
    buildHTMLTemplate(formId) {
        return `
<!DOCTYPE html>
<html lang="lt">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TravCen - Kelionių pasiūlymo forma</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .form-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            padding: 40px;
            width: 100%;
            max-width: 500px;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
        }

        .header p {
            color: #666;
            font-size: 14px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-size: 14px;
        }

        input, select {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s ease;
        }

        input:focus, select:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .submit-btn {
            width: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }

        .submit-btn:hover {
            transform: translateY(-2px);
        }

        .submit-btn:active {
            transform: translateY(0);
        }

        .message {
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: center;
            display: none;
        }

        .success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .required::after {
            content: " *";
            color: #e74c3c;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <div class="header">
            <h1>Kelionių pasiūlymas</h1>
            <p>Įveskite savo kelionių pasiūlymo informaciją</p>
        </div>

        <form id="offerForm">
            <div class="form-group">
                <label for="companyName" class="required">Įmonės pavadinimas</label>
                <input type="text" id="companyName" required 
                       placeholder="Jūsų įmonės pavadinimas">
            </div>

            <div class="form-group">
                <label for="offerUrl" class="required">Kelionių pasiūlymo nuoroda</label>
                <input type="url" id="offerUrl" required 
                       placeholder="https://jūsų-svetainė.lt/kelionė"
                       pattern="https?://.+">
            </div>

            <div class="form-group">
                <label for="price" class="required">Kaina (€)</label>
                <input type="number" id="price" required 
                       min="1" max="10000" step="0.01"
                       placeholder="299.99">
            </div>

            <div class="form-group">
                <label for="tripType" class="required">Kelionių tipas</label>
                <select id="tripType" required>
                    <option value="">Pasirinkite tipą</option>
                    <option value="Pajūrio poilsis">Pajūrio poilsis</option>
                    <option value="Kalnų turizmas">Kalnų turizmas</option>
                    <option value="Miesto turizmas">Miesto turizmas</option>
                    <option value="Kultūrinė kelionė">Kultūrinė kelionė</option>
                    <option value="Ekstremalus turizmas">Ekstremalus turizmas</option>
                    <option value="Šeimos kelionė">Šeimos kelionė</option>
                    <option value="Romantinė kelionė">Romantinė kelionė</option>
                    <option value="Last Minute">Last Minute</option>
                </select>
            </div>

            <div class="form-group">
                <label for="tripDate" class="required">Kelionės data</label>
                <input type="date" id="tripDate" required 
                       min="${new Date().toISOString().split('T')[0]}">
            </div>

            <div class="form-group">
                <label for="validUntil" class="required">Pasiūlymas galioja iki</label>
                <input type="date" id="validUntil" required 
                       min="${new Date().toISOString().split('T')[0]}">
            </div>

            <button type="submit" class="submit-btn">Pateikti pasiūlymą</button>
        </form>

        <div id="message" class="message"></div>
    </div>

    <script>
        document.getElementById('offerForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = {
                companyName: document.getElementById('companyName').value.trim(),
                offerUrl: document.getElementById('offerUrl').value.trim(),
                price: parseFloat(document.getElementById('price').value),
                tripType: document.getElementById('tripType').value,
                tripDate: document.getElementById('tripDate').value,
                validUntil: document.getElementById('validUntil').value
            };

            // Validacija
            if (!formData.companyName || !formData.offerUrl || !formData.price || 
                !formData.tripType || !formData.tripDate || !formData.validUntil) {
                showMessage('Visi laukai yra privalomi', 'error');
                return;
            }

            if (formData.price <= 0) {
                showMessage('Kaina turi būti teigiamas skaičius', 'error');
                return;
            }

            if (new Date(formData.validUntil) <= new Date(formData.tripDate)) {
                showMessage('Galiojimo data turi būti vėlesnė už kelionės datą', 'error');
                return;
            }

            if (new Date(formData.tripDate) < new Date()) {
                showMessage('Kelionės data negali būti praeityje', 'error');
                return;
            }

            try {
                const response = await fetch('https://travcen-backendas.onrender.com/api/offers/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    showMessage('Pasiūlymas sėkmingai pateiktas! Jis atsiras svetainėje po patvirtinimo.', 'success');
                    document.getElementById('offerForm').reset();
                } else {
                    showMessage(result.error || 'Įvyko klaida pateikiant pasiūlymą', 'error');
                }
            } catch (error) {
                showMessage('Įvyko serverio klaida. Bandykite vėliau.', 'error');
                console.error('Klaida:', error);
            }
        });

        function showMessage(text, type) {
            const messageEl = document.getElementById('message');
            messageEl.textContent = text;
            messageEl.className = 'message ' + type;
            messageEl.style.display = 'block';

            setTimeout(() => {
                messageEl.style.display = 'none';
            }, type === 'success' ? 5000 : 10000);
        }

        // Datų validacija
        const tripDateInput = document.getElementById('tripDate');
        const validUntilInput = document.getElementById('validUntil');

        tripDateInput.addEventListener('change', function() {
            validUntilInput.min = this.value;
        });

        // Nustatyti minimalią datą šiandienai
        const today = new Date().toISOString().split('T')[0];
        tripDateInput.min = today;
        validUntilInput.min = today;
    </script>
</body>
</html>
        `;
    }

    // Formos ištrynimas (jei reikės)
    async deleteForm(fileName) {
        try {
            const filePath = path.join(this.formsDir, fileName);
            await fs.unlink(filePath);
            return { success: true, message: 'Forma sėkmingai ištrinta' };
        } catch (error) {
            console.error('Formos ištrynimo klaida:', error);
            throw new Error('Nepavyko ištrinti formos');
        }
    }

    // Gauti visų formų sąrašą
    async listForms() {
        try {
            await fs.mkdir(this.formsDir, { recursive: true });
            const files = await fs.readdir(this.formsDir);
            return files.filter(file => file.endsWith('.html'));
        } catch (error) {
            console.error('Formų sąrašo gavimo klaida:', error);
            return [];
        }
    }
}

export default new HTMLGenerator();
