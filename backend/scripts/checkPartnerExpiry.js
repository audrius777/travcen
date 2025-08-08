import { sendEmail } from './mailer.js';
import { connectToDatabase } from './db.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const REMINDER_INTERVAL_DAYS = 7;
const EXPIRY_GRACE_DAYS = 30;

async function checkPartnerExpiry() {
  let db;
  try {
    // Prisijungiame prie duomenų bazės
    db = await connectToDatabase();
    const partnersCollection = db.collection('partners');
    
    const today = new Date();
    let updatedCount = 0;
    let reminderCount = 0;

    // Gauname visus partnerius, kuriems yra nustatytas galiojimo laikas
    const partners = await partnersCollection.find({
      expiresAt: { $exists: true, $ne: null }
    }).toArray();

    for (const partner of partners) {
      const expires = new Date(partner.expiresAt);
      const daysOverdue = Math.floor((today - expires) / DAY_MS);
      let updateData = {};
      let needsUpdate = false;

      // Tikriname ar partneris turėtų būti pašalintas
      if (daysOverdue >= EXPIRY_GRACE_DAYS) {
        if (partner.status !== 'removed') {
          console.log(`❌ Pašalinamas: ${partner.company} (${daysOverdue} d. po termino)`);
          updateData.status = 'removed';
          updateData.removalDate = today;
          needsUpdate = true;
        }
        continue;
      }

      // Tikriname ar partnerio prenumerata pasibaigusi
      if (expires < today) {
        if (partner.status !== 'inactive') {
          console.log(`⚠️ Prenumerata pasibaigusi: ${partner.company}`);
          updateData.status = 'inactive';
          needsUpdate = true;
        }

        // Priminimo logika
        const lastReminder = partner.lastReminder ? new Date(partner.lastReminder) : null;
        const needsReminder = !lastReminder || 
          (today - lastReminder) >= REMINDER_INTERVAL_DAYS * DAY_MS;

        if (needsReminder && partner.email) {
          console.log(`📧 Siunčiamas priminimas: ${partner.email} – ${partner.company}`);
          
          try {
            await sendEmail({
              to: partner.email,
              subject: 'Partnerystės priminimas',
              text: `Gerb. ${partner.company},\n\nJūsų partnerystė su TravCen pasibaigė. Prašome atnaujinti sutartį.\n\nPagarbiai,\nTravCen komanda`
            });
            
            updateData.lastReminder = today;
            needsUpdate = true;
            reminderCount++;
          } catch (emailError) {
            console.error(`❌ Nepavyko išsiųsti laiško ${partner.email}:`, emailError);
          }
        }
      } else {
        // Aktyvavimo logika
        if (partner.status !== 'active') {
          console.log(`✅ Aktyvuojamas: ${partner.company}`);
          updateData.status = 'active';
          needsUpdate = true;
        }
      }

      // Atnaujiname partnerio duomenis, jei reikia
      if (needsUpdate) {
        await partnersCollection.updateOne(
          { _id: partner._id },
          { $set: updateData }
        );
        updatedCount++;
      }
    }

    console.log(`\n📊 Rezultatai:`);
    console.log(`- Iš viso patikrinta partnerių: ${partners.length}`);
    console.log(`- Atnaujinta įrašų: ${updatedCount}`);
    console.log(`- Išsiųsta priminimų: ${reminderCount}`);

  } catch (error) {
    console.error('❌ Kritinė klaida vykdant skriptą:', error);
    process.exit(1);
  } finally {
    if (db) {
      await db.close();
    }
  }
}

// Paleidžiame tikrinimą
checkPartnerExpiry()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
