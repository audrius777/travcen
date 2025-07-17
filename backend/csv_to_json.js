const fs = require('fs');
const path = require('path');

// KELIAI
const inputCsvPath = path.join(__dirname, 'partneriai.csv');
const outputJsonPath = path.join(__dirname, 'partners.json');

// CSV konvertavimas
function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] || '';
    });
    return obj;
  });
}

// Paleidimas
try {
  if (!fs.existsSync(inputCsvPath)) {
    throw new Error('Failas partneriai.csv nerastas');
  }

  const csvContent = fs.readFileSync(inputCsvPath, 'utf8');
  const result = parseCSV(csvContent);

  fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`✅ Sėkmingai įrašyta į: ${outputJsonPath}`);
} catch (err) {
  console.error('❌ Klaida konvertuojant CSV:', err.message);
}

