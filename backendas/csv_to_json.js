
const fs = require('fs');
const path = require('path');

// KELIAI
const inputCsvPath = path.join(__dirname, 'partneriai.csv'); // <- tavo CSV failas
const outputJsonPath = path.join(__dirname, 'partners.json'); // <- bus atnaujintas

// CSV konvertavimas
function parseCSV(content) {
  const lines = content.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = values[i]?.trim() || '';
    });
    return obj;
  });
}

// Paleidimas
try {
  const csvContent = fs.readFileSync(inputCsvPath, 'utf8');
  const result = parseCSV(csvContent);

  fs.writeFileSync(outputJsonPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`✅ Sėkmingai įrašyta į: ${outputJsonPath}`);
} catch (err) {
  console.error('❌ Klaida konvertuojant CSV:', err.message);
}
