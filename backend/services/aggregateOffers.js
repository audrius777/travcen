const getExamplePartnerOffers = require("../partners/example_partner");
const getDemoPartnerOffers = require("../partners/demo");

// Apsaugo partnerių kvietimus nuo programos strigimo
const safeFetch = async (fn, label) => {
  try {
    return await fn();
  } catch (err) {
    console.error(`❌ Klaida įkeliant partnerį "${label}":`, err);
    return [];
  }
};

module.exports = async function aggregateOffers() {
  const allOffers = await Promise.all([
    safeFetch(getExamplePartnerOffers, "example_partner"),
    safeFetch(getDemoPartnerOffers, "demo")
    // čia gali pridėti daugiau partnerių kvietimų
  ]);

  return allOffers.flat();
};
