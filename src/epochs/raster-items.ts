import item1680 from "../../data/stac/cadastre-1680.item.json" with { type: "json" };
import item1830 from "../../data/stac/cadastre-1830.item.json" with { type: "json" };
import item1875 from "../../data/stac/flood-1875.item.json" with { type: "json" };
import item1860 from "../../data/stac/jourdan-1860.item.json" with { type: "json" };
import item1904 from "../../data/stac/laffont-1904.item.json" with { type: "json" };
import item1195 from "../../data/stac/openedition-12c.item.json" with { type: "json" };
import item1250 from "../../data/stac/openedition-13c.item.json" with { type: "json" };
import item1550 from "../../data/stac/openedition-1550.item.json" with { type: "json" };
import item450 from "../../data/stac/openedition-antiquite.item.json" with { type: "json" };
import item1777 from "../../data/stac/saget-1777.item.json" with { type: "json" };
import item1631 from "../../data/stac/tavernier-1631.item.json" with { type: "json" };

export const RASTER_ITEMS = {
  "450": item450,
  "1195": item1195,
  "1250": item1250,
  "1550": item1550,
  "1631": item1631,
  "1680": item1680,
  "1777": item1777,
  "1830": item1830,
  "1860": item1860,
  "1875": item1875,
  "1904": item1904,
} as const;
