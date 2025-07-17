# Travcen – Kelionių Platforma

**Travcen** yra kelionių pasiūlymų paieškos ir administravimo sistema. Ji susideda iš dviejų pagrindinių dalių:

- **Frontend** – vartotojo sąsaja (HTML, CSS, JS)
- **Backend** – Node.js serveris su partnerių administravimu ir vartotojų autentifikacija

---

## 📁 Projekto Struktūra

```
travcen/
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── admin.html
│   ├── admin_status.html
│   ├── script.js
│   ├── login.js
│   ├── translate.js
│   ├── style.css
│   ├── og-image.jpg
│   └── favicon.ico
├── backend/
│   ├── server_secure.js
│   ├── .env                  # 🔐 PRIVATUS failas (nėra įtrauktas į Git)
│   ├── auth.js
│   ├── generatePartnerModules.js
│   ├── csv_to_json.js
│   ├── partnerLoader.js
│   ├── config/
│   │   └── passport.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── offers.js
│   │   └── partnerStatusRoute.js
│   ├── services/
│   │   └── aggregateOffers.js
│   ├── offers/
│   │   ├── examplePartner.js
│   │   └── testPartner.js
│   ├── partners/
│   │   ├── demo.js
│   │   ├── kauno_kelions.js
│   │   └── vilniaus_kelions.js
│   ├── partners.json
│   └── partners_backup.json
```

---

## 🧪 Kaip Paleisti Lokaliai

1. **Klonuok projektą:**

```bash
git clone https://github.com/tavo-vartotojas/travcen.git
cd travcen/backend
```

2. **Įdiek priklausomybes:**

```bash
npm install
```

3. **Sukurk `.env` failą:**

```ini
SESSION_SECRET=your_strong_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ADMIN_EMAIL=admin@travcen.com
```

4. **Paleisk serverį:**

```bash
node server_secure.js
```

Frontend dalį tiesiog atidaryk per naršyklę (index.html).

---

## 🔐 Prisijungimas

- Naudojama **Google OAuth2** autentifikacija.
- Tik **ADMIN_EMAIL** adresas turi administratoriaus teises.
- Partnerių registracija galima tik per admin panelę.

---

## 🚀 Deploy naudojant Render / Vercel

- Backend (Node.js) gali būti talpinamas naudojant [Render](https://render.com)
- Frontend – [Vercel](https://vercel.com) arba naudoti GitHub Pages (jei nereikia dinamiško turinio)

**Nepamiršk:**
- Įkelti `.env` kintamuosius į Render > Advanced > Environment variables
- Panaudoti dinaminį `BACKEND_URL` frontende

---

## 📫 Kontaktai

Daugiau informacijos: [admin@travcen.com](mailto:admin@travcen.com)