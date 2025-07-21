const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/offers', async (req, res) => {
  const partnersDir = path.join(__dirname, '../partners');
  let allOffers = [];

  try {
    const files = fs.readdirSync(partnersDir).filter(f => f.endsWith('.js'));

    for (const file of files) {
      const partnerModule = require(path.join(partnersDir, file));
      if (typeof partnerModule === 'function') {
        const offers = await partnerModule(); // async funkcija grąžina keliones
        if (Array.isArray(offers)) {
          allOffers = allOffers.concat(offers);
        }
      }
    }

    res.json(allOffers);
  } catch (err) {
    console.error('Klaida kraunant keliones:', err);
    res.status(500).send('Klaida kraunant pasiūlymus');
  }
});

module.exports = router;

