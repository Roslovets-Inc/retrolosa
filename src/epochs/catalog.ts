import { RASTER_ITEMS } from "./raster-items";
import { readStacRaster } from "./stac";
import type { EpochDefinition, TileRender } from "./types";

const medievalSource = "https://books.openedition.org/psorbonne/3296";
const archives = "Archives municipales de Toulouse";
const raster = (id: keyof typeof RASTER_ITEMS) => {
  const item = RASTER_ITEMS[id];
  return readStacRaster(item, `${item.id}/item.json`);
};
const tiles = (
  source: TileRender["source"],
  options: Omit<TileRender, "kind" | "source"> = {},
): TileRender => ({ kind: "tiles", source, ...options });

// Chronological order is also painter order: the emerging sheet covers the preceding one.
export const EPOCHS = [
  {
    id: "450",
    label: "Ve",
    optionLabel: "Reconstruction",
    category: "RECONSTRUCTION",
    credit: "F. Callède / Inrap",
    sourceUrl: medievalSource,
    attribution: "F. Callède / Inrap",
    bearing: 0,
    render: raster("450"),
  },
  {
    id: "1195",
    label: "XIIe",
    optionLabel: "Reconstruction partielle · trois secteurs",
    category: "RECONSTRUCTION PARTIELLE",
    timelineLabel: "XIIe · Reconstruction partielle",
    credit: "F. Callède / Inrap",
    sourceUrl: medievalSource,
    attribution: "F. Callède / Inrap · PCR Toulouse au Moyen Âge",
    bearing: 0,
    render: raster("1195"),
  },
  {
    id: "1250",
    label: "XIIIe",
    optionLabel: "Reconstruction",
    category: "RECONSTRUCTION",
    credit: "F. Callède / Inrap",
    sourceUrl: medievalSource,
    attribution: "F. Callède / Inrap",
    bearing: 0,
    render: raster("1250"),
  },
  {
    id: "1550",
    label: "1550",
    optionLabel: "Héritages du parcellaire",
    category: "HÉRITAGES DU PARCELLAIRE",
    timelineLabel: "1550 · Héritages du parcellaire",
    credit: "F. Callède / Inrap",
    sourceUrl: medievalSource,
    attribution: "F. Callède / Inrap",
    bearing: 0,
    render: raster("1550"),
  },
  {
    id: "1631",
    label: "1631",
    optionLabel: "Plan · calage approximatif",
    category: "CADASTRE HISTORIQUE",
    credit: "Tavernier",
    archiveCredit: archives,
    sourceUrl: "https://www.flickr.com/photos/archives-toulouse/24484342123/",
    attribution: "Melchior Tavernier · Archives municipales de Toulouse, II 671 · Domaine public",
    bearing: 84,
    render: tiles(
      { type: "template", tiles: ["tavernier-1631/{z}/{x}/{y}.webp?v=4"], local: true },
      {
        minzoom: 14,
        maxzoom: 17,
        bounds: [1.38427734375, 43.56447158721811, 1.494140625, 43.64402584769949],
        overview: { image: raster("1631"), switchZoom: 14 },
      },
    ),
  },
  {
    id: "1680",
    label: "1680",
    optionLabel: "Cadastre",
    category: "CADASTRE HISTORIQUE",
    credit: "Toulouse Métropole / Makina Corpus",
    sourceUrl: "https://tolosa1680.makina-corpus.com/",
    attribution: "Toulouse Métropole · Makina Corpus",
    bearing: 0,
    render: tiles(
      {
        type: "pmtiles",
        url: "pmtiles://https://makina-pmtiles.s3.fr-par.scw.cloud/tolosa-1680.pmtiles",
      },
      { overview: { image: raster("1680"), switchZoom: 15 } },
    ),
  },
  {
    id: "1777",
    label: "1777",
    optionLabel: "Plan de Saget",
    category: "CADASTRE HISTORIQUE",
    credit: "Saget",
    archiveCredit: archives,
    sourceUrl: RASTER_ITEMS["1777"].links[0].href,
    attribution: "Joseph Marie de Saget · Archives municipales de Toulouse · Domaine public",
    bearing: 53,
    render: raster("1777"),
  },
  {
    id: "1830",
    label: "1830",
    optionLabel: "Cadastre",
    category: "CADASTRE HISTORIQUE",
    credit: "Toulouse Métropole / Makina Corpus",
    sourceUrl: "https://tolosa.makina-corpus.com/",
    attribution: "Toulouse Métropole · Makina Corpus",
    bearing: 0,
    render: tiles(
      {
        type: "pmtiles",
        url: "pmtiles://https://makina-pmtiles.s3.fr-par.scw.cloud/tolosa-1830.pmtiles",
      },
      { overview: { image: raster("1830"), switchZoom: 15 } },
    ),
  },
  {
    id: "1848",
    label: "1848",
    optionLabel: "État-major · IGN",
    category: "CADASTRE HISTORIQUE",
    timelineLabel: "1848 · État-major",
    credit: "© IGN · État-major 1848",
    sourceUrl:
      "https://remonterletemps.ign.fr/telecharger/?lon=1.444&lat=43.604&z=13&layer=cartes_anciennes&collection=ETATMAJOR&year=1848",
    attribution: "IGN · État-major · Minutes de 1848 · Licence Ouverte 2.0",
    bearing: 0,
    render: tiles(
      { type: "template", tiles: ["etat-major://{z}/{x}/{y}"] },
      { minzoom: 6, maxzoom: 15, bounds: [1.3, 43.49, 1.57, 43.75] },
    ),
  },
  {
    id: "1860",
    label: "1860",
    optionLabel: "Plan de Jourdan",
    category: "CADASTRE HISTORIQUE",
    credit: "Jourdan",
    archiveCredit: archives,
    sourceUrl: RASTER_ITEMS["1860"].links[0].href,
    attribution: "Jourdan · Archives municipales de Toulouse · Domaine public",
    bearing: 0,
    render: raster("1860"),
  },
  {
    id: "1875",
    label: "1875",
    optionLabel: "Inondation",
    category: "CADASTRE HISTORIQUE",
    timelineLabel: "1875 · Inondation",
    credit: "Sirven / Archives Toulouse",
    sourceUrl: "https://mapasmilhaud.com/mapas-urbanos/plano-de-las-inundaciones-de-toulouse-1875/",
    attribution: "Archives municipales de Toulouse · 20 Fi 45 · Sirven / La Dépêche",
    bearing: 0,
    render: tiles(
      { type: "template", tiles: ["flood-1875/{z}/{x}/{y}.webp"], local: true },
      {
        minzoom: 14,
        maxzoom: 17,
        bounds: [1.40625, 43.56447158721811, 1.4721679687499998, 43.628123412124594],
        overview: { image: raster("1875"), switchZoom: 14 },
      },
    ),
  },
  {
    id: "1904",
    label: "1904",
    optionLabel: "Plan de Laffont",
    category: "CADASTRE HISTORIQUE",
    credit: "Laffont",
    archiveCredit: archives,
    sourceUrl: RASTER_ITEMS["1904"].links[0].href,
    attribution: "Laffont · Archives municipales de Toulouse · Domaine public",
    bearing: 0,
    render: raster("1904"),
  },
  {
    id: "1954",
    label: "1954",
    optionLabel: "Vue aérienne",
    category: "VUE AÉRIENNE",
    credit: "© IGN / Edugéo",
    sourceUrl: "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities",
    attribution: "IGN · Edugéo · Toulouse 1954",
    bearing: 0,
    render: tiles(
      {
        type: "template",
        tiles: [
          "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.EDUGEO.TOULOUSE1954&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM_6_16&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
        ],
      },
      { minzoom: 6, maxzoom: 16, bounds: [1.23852, 43.5618, 1.55128, 43.7247] },
    ),
  },
] as const satisfies readonly EpochDefinition[];

export type EpochId = (typeof EPOCHS)[number]["id"];
export const EPOCH_IDS = EPOCHS.map((epoch) => epoch.id);
const byId = new Map<string, EpochDefinition>(EPOCHS.map((epoch) => [epoch.id, epoch]));
export function isEpochId(value: string): value is EpochId {
  return byId.has(value);
}
export function getEpoch(id: EpochId): EpochDefinition {
  return byId.get(id)!;
}
export function epochAtDate(date: number): EpochDefinition | undefined {
  return byId.get(String(date));
}
