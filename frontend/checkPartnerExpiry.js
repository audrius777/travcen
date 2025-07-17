
const fs = require("fs");
const path = require("path");

// === Nustatymai ===
const partnersPath = path.join(__dirname, "partners.json");
const today = new Date();
const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_INTERVAL_DAYS = 7;
const EXPIRY_GRACE_DAYS = 30;

if (!fs.existsSync(partnersPath)) {
  console.error("❌ Nerastas partners.json");
  process.exit(1);
}

const partners = JSON.parse(fs.readFileSync(partnersPath, "utf8"));
let updated = false;

for (const partner of partners) {
  if (!partner.expiresAt) continue;

  const expires = new Date(partner.expiresAt);
  const daysOverdue = Math.floor((today - expires) / DAY_MS);

  if (daysOverdue >= EXPIRY_GRACE_DAYS) {
    if (partner.status !== "removed") {
      console.log(`❌ Pašalinamas: ${partner.company} (${daysOverdue} d. po termino)`);
      partner.status = "removed";
      updated = true;
    }
    continue;
  }

  if (expires < today) {
    if (partner.status !== "inactive") {
      console.log(`⚠️ Prenumerata pasibaigusi: ${partner.company}`);
      partner.status = "inactive";
      updated = true;
    }

    // Priminimo logika
    const last = partner.lastReminder ? new Date(partner.lastReminder) : null;
    const needsReminder = !last || (today - last) >= REMINDER_INTERVAL_DAYS * DAY_MS;
    if (needsReminder) {
      console.log(`📧 Siunčiamas priminimas: ${partner.email} – ${partner.company}`);
      partner.lastReminder = today.toISOString().split("T")[0];
      updated = true;
    }
  } else {
    if (partner.status !== "active") {
      console.log(`✅ Aktyvuojamas: ${partner.company}`);
      partner.status = "active";
      updated = true;
    }
  }
}

if (updated) {
  fs.writeFileSync(partnersPath, JSON.stringify(partners, null, 2), "utf8");
  console.log("✅ Atnaujintas partners.json");
} else {
  console.log("ℹ️ Viskas atnaujinta – jokių pakeitimų.");
}
