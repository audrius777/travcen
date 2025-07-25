// kauno_kelions.js
module.exports = async function gautiKaunoKelionesPasiulymus() {
  return [
    {
      title: "Kelionė į Barseloną",
      from: "Kaunas",
      to: "Barselona",
      type: "poilsis",
      price: 349,
      price_eur: 349, // EUR kaina (jei skiriasi nuo originalios)
      currency: "EUR",
      url: "https://kaunokeliones.lt/pasiulymai/barselona",
      image: "https://source.unsplash.com/280x180/?barcelona",
      partner: "Kauno Kelionės",
      isTest: false, // Nurodome, kad tai realus pasiūlymas
      description: "5 dienų poilsinė kelionė į Barseloną",
      date: "2023-12-15", // Išvykimo data
      duration: "5 naktys",
      included: ["Skrydis", "Viesbutis", "Pusryčiai"]
    },
    // Papildomi realūs pasiūlymai
    {
      title: "Kelionė į Romą",
      from: "Kaunas",
      to: "Roma",
      type: "kultūra",
      price: 399,
      price_eur: 399,
      currency: "EUR",
      url: "https://kaunokeliones.lt/pasiulymai/roma",
      image: "https://source.unsplash.com/280x180/?rome",
      partner: "Kauno Kelionės",
      isTest: false,
      description: "7 dienų kultūrinė kelionė į Romą",
      date: "2024-01-10",
      duration: "7 naktys",
      included: ["Skrydis", "Viesbutis", "Gidai"]
    }
  ];
};
