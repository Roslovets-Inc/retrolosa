import { coordinates as floodCoordinates, bounds as floodBounds } from "../flood-1875.json";
import overview1830 from "../history-overview-1830.json";
import overview1680 from "../history-overview.json";
import {
  coordinates as jourdanCoordinates,
  sourcePage as jourdanSourcePage,
} from "../jourdan-1860.json";
import {
  coordinates as laffontCoordinates,
  sourcePage as laffontSourcePage,
} from "../laffont-1904.json";
import { coordinates as medievalCoordinates } from "../openedition-13c.json";
import { coordinates as parcelsCoordinates } from "../openedition-1550.json";
import { coordinates as antiquityCoordinates } from "../openedition-antiquite.json";
import { coordinates as sagetCoordinates, sourcePage as sagetSourcePage } from "../saget-1777.json";
import {
  coordinates as tavernierCoordinates,
  bounds as tavernierBounds,
  revision as tavernierRevision,
} from "../tavernier-1631.json";
import { readBounds, readCoordinates } from "./types";
import type { EpochDefinition, ImageRender, EpochRender } from "./types";

const medievalSource = "https://books.openedition.org/psorbonne/3296";
const archives = "Archives municipales de Toulouse";
const image = (path: string, coordinates: number[][]): ImageRender => ({
  kind: "image",
  path,
  coordinates: readCoordinates(coordinates),
});
const cadastralRender = (id: string, coordinates: number[][]): EpochRender => ({
  kind: "overview",
  image: image(id === "1680" ? "history-overview.png" : "history-overview-1830.png", coordinates),
  detail: {
    kind: "archive",
    url: `pmtiles://https://makina-pmtiles.s3.fr-par.scw.cloud/tolosa-${id}.pmtiles`,
  },
  switchZoom: 15,
});

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
    render: image("openedition-antiquite/map.webp", antiquityCoordinates),
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
    render: image("openedition-13c/map.webp", medievalCoordinates),
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
    render: image("openedition-1550/map.webp", parcelsCoordinates),
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
    render: {
      kind: "overview",
      switchZoom: 14,
      image: image(`tavernier-1631/overview.webp?v=${tavernierRevision}`, tavernierCoordinates),
      detail: {
        kind: "tiles",
        local: true,
        tiles: [`tavernier-1631/{z}/{x}/{y}.webp?v=${tavernierRevision}`],
        minzoom: 14,
        maxzoom: 17,
        bounds: readBounds(tavernierBounds),
      },
    },
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
    render: cadastralRender("1680", overview1680),
  },
  {
    id: "1777",
    label: "1777",
    optionLabel: "Plan de Saget",
    category: "CADASTRE HISTORIQUE",
    credit: "Saget",
    archiveCredit: archives,
    sourceUrl: sagetSourcePage,
    attribution: "Joseph Marie de Saget · Archives municipales de Toulouse · Domaine public",
    bearing: 53,
    render: image("saget-1777/map.webp", sagetCoordinates),
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
    render: cadastralRender("1830", overview1830),
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
    render: {
      kind: "tiles",
      tiles: ["etat-major://{z}/{x}/{y}"],
      minzoom: 6,
      maxzoom: 15,
      bounds: readBounds([1.3, 43.49, 1.57, 43.75]),
    },
  },
  {
    id: "1860",
    label: "1860",
    optionLabel: "Plan de Jourdan",
    category: "CADASTRE HISTORIQUE",
    credit: "Jourdan",
    archiveCredit: archives,
    sourceUrl: jourdanSourcePage,
    attribution: "Jourdan · Archives municipales de Toulouse · Domaine public",
    bearing: 0,
    render: image("jourdan-1860/map.webp", jourdanCoordinates),
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
    render: {
      kind: "overview",
      switchZoom: 14,
      image: image("flood-1875/overview.webp", floodCoordinates),
      detail: {
        kind: "tiles",
        local: true,
        tiles: ["flood-1875/{z}/{x}/{y}.webp"],
        minzoom: 14,
        maxzoom: 17,
        bounds: readBounds(floodBounds),
      },
    },
  },
  {
    id: "1904",
    label: "1904",
    optionLabel: "Plan de Laffont",
    category: "CADASTRE HISTORIQUE",
    credit: "Laffont",
    archiveCredit: archives,
    sourceUrl: laffontSourcePage,
    attribution: "Laffont · Archives municipales de Toulouse · Domaine public",
    bearing: 0,
    render: image("laffont-1904/map.webp", laffontCoordinates),
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
    render: {
      kind: "tiles",
      minzoom: 6,
      maxzoom: 16,
      bounds: readBounds([1.23852, 43.5618, 1.55128, 43.7247]),
      tiles: [
        "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.EDUGEO.TOULOUSE1954&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM_6_16&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
      ],
    },
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
