const getExamplePartnerOffers = require("../partners/example_partner");

module.exports = async function aggregateOffers() {
  const allOffers = await Promise.all([
    getExamplePartnerOffers()
  ]);

  return allOffers.flat();
};
