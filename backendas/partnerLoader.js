const fs = require("fs");
const path = require("path");

module.exports = async function loadOffers() {
  const dir = path.join(__dirname, "partners");
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter(f => f.endsWith(".js"))
    : [];

  const allOffers = [];

  for (const file of files) {
    try {
      const loader = require(path.join(dir, file));
      const offers = await loader();
      if (Array.isArray(offers)) {
        allOffers.push(...offers);
      }
    } catch (err) {
      console.error(`❌ Klaida partnerio modulyje: ${file}`, err.message);
    }
  }

  return allOffers;
};

