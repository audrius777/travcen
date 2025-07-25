// vilniaus_kelions.js
module.exports = async function () {
  return [
    {
      title: "Testinis pasiūlymas - Vilniaus Kelionės",
      from: "Vilnius",
      to: "Testinė kelionė",
      type: "test",
      price: 0,
      price_eur: 0,
      url: "https://vilniauskeliones.lt",
      image: "https://source.unsplash.com/280x180/?travel",
      partner: "Vilniaus Kelionės",
      isTest: true, // Aiškus žymėjimas, kad tai testiniai duomenys
      description: "Tai yra testinis pasiūlymas, skirtas sistemos testavimui",
      date: new Date().toISOString()
    }
  ];
};
