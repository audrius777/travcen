// offerProcessor.js (supaprastinta versija, jei vis dar reikalinga)
import { PartnerOffer } from '../models/offerModel.js';

export async function processSingleOffer(offer) {
  return new PartnerOffer(offer); // DB schema automatiškai apdoros konvertavimą
}
