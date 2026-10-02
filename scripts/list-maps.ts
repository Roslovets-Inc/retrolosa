import { EPOCHS } from "../src/epochs/catalog";
import { integrationName, validateCatalog } from "../src/epochs/catalog-contract";
import { RASTER_ITEMS } from "../src/epochs/raster-items";

validateCatalog(EPOCHS, RASTER_ITEMS);
console.table(
  EPOCHS.map((epoch) => ({
    epoch: epoch.id,
    title: epoch.optionLabel,
    integration: integrationName(epoch.render),
    source: epoch.sourceUrl,
  })),
);
console.log(
  `${EPOCHS.length} historical maps; ${Object.keys(RASTER_ITEMS).length} STAC display assets. Catalogue valid.`,
);
