const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generuojame raktą
const secret = crypto.randomBytes(32).toString('hex');

// Parodome vartotojui
console.log('Sugeneruotas JWT_SECRET:');
console.log(secret);

// Papildomai: galima automatiškai įrašyti į .env
const envPath = path.join(__dirname, '..', '.env');
const envLine = `JWT_SECRET=${secret}\n`;

fs.appendFile(envPath, envLine, (err) => {
  if (err) {
    console.log('Nepavyko automatiškai įrašyti į .env, įrašykite rankiniu būdu:');
    console.log(envLine);
  } else {
    console.log('Sėkmingai įrašyta į .env failą');
  }
});
