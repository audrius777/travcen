
const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();

router.get("/partner-status", async (req, res) => {
  const partnersPath = path.join(__dirname, "../partners.json");
  const partnerDir = path.join(__dirname, "../partners");

  if (!fs.existsSync(partnersPath)) {
    return res.json([]);
  }

  const raw = fs.readFileSync(partnersPath, "utf8");
  let partners = [];

  try {
    partners = JSON.parse(raw);
  } catch {
    return res.status(500).send("Klaida skaitant partners.json");
  }

  const results = [];

  for (const p of partners) {
    const slug = p.company.toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const modulePath = path.join(partnerDir, `${slug}.js`);
    let status = "❌ Nėra failo";

    if (fs.existsSync(modulePath)) {
      try {
        const mod = require(modulePath);
        const offers = await mod();
        if (Array.isArray(offers)) {
          status = `✅ ${offers.length} pasiūlymų`;
        } else {
          status = "⚠️ Negrąžino sąrašo";
        }
      } catch (err) {
        status = `❌ Klaida: ${err.message}`;
      }
    }

    results.push({
      company: p.company,
      slug,
      status
    });
  }

  res.json(results);
});

module.exports = router;
