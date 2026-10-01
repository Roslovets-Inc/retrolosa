import {
  ArrowLeftRight,
  Layers,
  Blend,
  MapPin,
  Plus,
  Minus,
  RotateCcw,
  Compass,
  Info,
  X,
  ExternalLink,
  Share2,
  Check,
  Navigation,
  Eye,
  Search,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapInstance } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { Protocol } from "pmtiles";
import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

import { CityWidget } from "./CityWidget";
import { loadStateMajorTile } from "./etat-major";
import flood1875 from "./flood-1875.json";
import overview1830 from "./history-overview-1830.json";
import overviewCoordinates from "./history-overview.json";

import "maplibre-gl/dist/maplibre-gl.css";
import "./style.css";
import "./compact.css";
import "./ui.css";
import jourdan1860 from "./jourdan-1860.json";
import laffont1904 from "./laffont-1904.json";
import medieval13c from "./openedition-13c.json";
import parcels1550 from "./openedition-1550.json";
import antiquity from "./openedition-antiquite.json";
import { mapBearing, nextBearing, readBearing, visibleEpoch } from "./orientation";
import saget1777 from "./saget-1777.json";
import tavernier1631 from "./tavernier-1631.json";
import { appliedTheme, modernMapStyle, setThemePreference, useTheme } from "./theme";
import type { Theme, ThemePreference } from "./theme";
import { snapTimelineYear, timelinePosition, timelineYear } from "./timeline";
import {
  Button,
  Checkbox,
  Dialog,
  Popover,
  Slider,
  Tooltip,
  TooltipProvider,
  ToggleGroup,
  ToggleItem,
} from "./ui";
import { useLocation } from "./useLocation";

const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const themeLabels = { system: "système", light: "clair", dark: "sombre" };
const nextTheme: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const YEARS = [
  "450",
  "1250",
  "1550",
  "1631",
  "1680",
  "1777",
  "1830",
  "1848",
  "1860",
  "1875",
  "1904",
  "1954",
] as const;
type Year = (typeof YEARS)[number];
const epochLabel = (value: Year) => (value === "450" ? "Ve" : value === "1250" ? "XIIIe" : value);
const initialYear = (): Year => {
  const value = new URLSearchParams(location.hash.slice(1)).get("year");
  return YEARS.includes(value as Year) ? (value as Year) : "1250";
};
const IGN_SOURCE = "https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetCapabilities";
const FLOOD_SOURCE =
  "https://mapasmilhaud.com/mapas-urbanos/plano-de-las-inundaciones-de-toulouse-1875/";
const TAVERNIER_SOURCE = "https://www.flickr.com/photos/archives-toulouse/24484342123/";
const MEDIEVAL_SOURCE = "https://books.openedition.org/psorbonne/3296";
const SAGET_SOURCE = "https://www.flickr.com/photos/archives-toulouse/25111159875/";
const JOURDAN_SOURCE = jourdan1860.sourcePage;
const LAFFONT_SOURCE = laffont1904.sourcePage;
const sourceUrl = (year: Year) =>
  year === "1848"
    ? "https://remonterletemps.ign.fr/telecharger/?lon=1.444&lat=43.604&z=13&layer=cartes_anciennes&collection=ETATMAJOR&year=1848"
    : year === "1860"
      ? JOURDAN_SOURCE
      : year === "1904"
        ? LAFFONT_SOURCE
        : year === "1777"
          ? SAGET_SOURCE
          : year === "450" || year === "1250" || year === "1550"
            ? MEDIEVAL_SOURCE
            : year === "1631"
              ? TAVERNIER_SOURCE
              : year === "1875"
                ? FLOOD_SOURCE
                : year === "1954"
                  ? IGN_SOURCE
                  : year === "1680"
                    ? "https://tolosa1680.makina-corpus.com/"
                    : "https://tolosa.makina-corpus.com/";
const TODAY = new Date().getFullYear();
const mapCredit = (period: Year) =>
  period === "450" || period === "1250" || period === "1550"
    ? "F. Callède / Inrap"
    : period === "1631"
      ? "Tavernier"
      : period === "1777"
        ? "Saget"
        : period === "1860"
          ? "Jourdan"
          : period === "1904"
            ? "Laffont"
            : period === "1848"
              ? "© IGN · État-major 1848"
              : period === "1954"
                ? "© IGN / Edugéo"
                : period === "1875"
                  ? "Sirven / Archives Toulouse"
                  : "Toulouse Métropole / Makina Corpus";
const initialTime = () => {
  const value = Number(new URLSearchParams(location.hash.slice(1)).get("time"));
  return Number.isFinite(value) && value >= Number(YEARS[0]) && value <= TODAY
    ? value
    : Number(initialYear());
};
function historicalStyle(year: Year): maplibregl.StyleSpecification {
  const style: maplibregl.StyleSpecification = { version: 8, sources: {}, layers: [] };
  style.sources["history-450"] = {
    type: "image",
    url: assetUrl("openedition-antiquite/map.webp"),
    coordinates: antiquity.coordinates as [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ],
  };
  style.layers.push({
    id: "history-450",
    type: "raster",
    source: "history-450",
    paint: {
      "raster-opacity": year === "450" ? 1 : 0,
      "raster-opacity-transition": { duration: 0 },
      "raster-fade-duration": 0,
    },
  });
  style.sources["history-1250"] = {
    type: "image",
    url: assetUrl("openedition-13c/map.webp"),
    coordinates: medieval13c.coordinates as [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ],
  };
  style.layers.push({
    id: "history-1250",
    type: "raster",
    source: "history-1250",
    paint: {
      "raster-opacity": year === "1250" ? 1 : 0,
      "raster-opacity-transition": { duration: 0 },
      "raster-fade-duration": 0,
    },
  });
  style.sources["history-1550"] = {
    type: "image",
    url: assetUrl("openedition-1550/map.webp"),
    coordinates: parcels1550.coordinates as [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ],
  };
  style.layers.push({
    id: "history-1550",
    type: "raster",
    source: "history-1550",
    paint: {
      "raster-opacity": year === "1550" ? 1 : 0,
      "raster-opacity-transition": { duration: 0 },
      "raster-fade-duration": 0,
    },
  });
  style.sources["overview-1631"] = {
    type: "image",
    url: assetUrl(`tavernier-1631/overview.webp?v=${tavernier1631.revision}`),
    coordinates: tavernier1631.coordinates as [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ],
  };
  style.sources["history-1631"] = {
    type: "raster",
    tiles: [
      location.origin + assetUrl(`tavernier-1631/{z}/{x}/{y}.webp?v=${tavernier1631.revision}`),
    ],
    tileSize: 256,
    minzoom: 14,
    maxzoom: 17,
    bounds: tavernier1631.bounds as [number, number, number, number],
    attribution: "Melchior Tavernier · Archives municipales de Toulouse, II 671 · Domaine public",
  };
  for (const kind of ["overview", "history"]) {
    style.layers.push({
      id: kind + "-1631",
      type: "raster",
      source: kind + "-1631",
      ...(kind === "overview" ? { maxzoom: 14 } : { minzoom: 14 }),
      paint: {
        "raster-opacity": year === "1631" ? 1 : 0,
        "raster-opacity-transition": { duration: 0 },
        "raster-fade-duration": 0,
      },
    });
  }
  for (const period of ["1680", "1830"] as const) {
    if (period === "1830") {
      style.sources["history-1777"] = {
        type: "image",
        url: assetUrl("saget-1777/map.webp"),
        coordinates: saget1777.coordinates as [
          [number, number],
          [number, number],
          [number, number],
          [number, number],
        ],
      };
      style.layers.push({
        id: "history-1777",
        type: "raster",
        source: "history-1777",
        paint: {
          "raster-opacity": year === "1777" ? 1 : 0,
          "raster-opacity-transition": { duration: 0 },
          "raster-fade-duration": 0,
        },
      });
    }
    style.sources["overview-" + period] = {
      type: "image",
      url: assetUrl(period === "1680" ? "history-overview.png" : "history-overview-1830.png"),
      coordinates: (period === "1680" ? overviewCoordinates : overview1830) as [
        [number, number],
        [number, number],
        [number, number],
        [number, number],
      ],
    };
    style.sources["history-" + period] = {
      type: "raster",
      url: "pmtiles://https://makina-pmtiles.s3.fr-par.scw.cloud/tolosa-" + period + ".pmtiles",
      tileSize: 256,
      attribution: "Toulouse Métropole · Makina Corpus",
    };
    style.layers.push(
      {
        id: "overview-" + period,
        type: "raster",
        source: "overview-" + period,
        maxzoom: 15,
        paint: {
          "raster-opacity": period === year ? 1 : 0,
          "raster-opacity-transition": { duration: 0 },
          "raster-fade-duration": 0,
        },
      },
      {
        id: "history-" + period,
        type: "raster",
        source: "history-" + period,
        minzoom: 15,
        paint: {
          "raster-opacity": period === year ? 1 : 0,
          "raster-opacity-transition": { duration: 0 },
          "raster-fade-duration": 0,
        },
      },
    );
  }
  style.sources["history-1848"] = {
    type: "raster",
    tileSize: 256,
    minzoom: 6,
    maxzoom: 15,
    bounds: [1.3, 43.49, 1.57, 43.75],
    tiles: ["etat-major://{z}/{x}/{y}"],
    attribution: "IGN · État-major · Minutes de 1848 · Licence Ouverte 2.0",
  };
  style.layers.push({
    id: "history-1848",
    type: "raster",
    source: "history-1848",
    paint: {
      "raster-opacity": year === "1848" ? 1 : 0,
      "raster-opacity-transition": { duration: 0 },
      "raster-fade-duration": 0,
    },
  });
  style.sources["overview-1875"] = {
    type: "image",
    url: assetUrl("flood-1875/overview.webp"),
    coordinates: flood1875.coordinates as [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ],
  };
  style.sources["history-1875"] = {
    type: "raster",
    tileSize: 256,
    minzoom: 14,
    maxzoom: 17,
    bounds: flood1875.bounds as [number, number, number, number],
    tiles: [location.origin + assetUrl("flood-1875/{z}/{x}/{y}.webp")],
    attribution: "Archives municipales de Toulouse · 20 Fi 45 · Sirven / La Dépêche",
  };
  for (const kind of ["overview", "history"] as const)
    style.layers.push({
      id: kind + "-1875",
      type: "raster",
      source: kind + "-1875",
      ...(kind === "overview" ? { maxzoom: 14 } : { minzoom: 14 }),
      paint: {
        "raster-opacity": year === "1875" ? 1 : 0,
        "raster-opacity-transition": { duration: 0 },
        "raster-fade-duration": 0,
      },
    });
  style.sources["history-1954"] = {
    type: "raster",
    tileSize: 256,
    minzoom: 6,
    maxzoom: 16,
    bounds: [1.23852, 43.5618, 1.55128, 43.7247],
    tiles: [
      "https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ORTHOIMAGERY.EDUGEO.TOULOUSE1954&STYLE=normal&FORMAT=image/png&TILEMATRIXSET=PM_6_16&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}",
    ],
    attribution: "IGN · Edugéo · Toulouse 1954",
  };
  style.layers.push({
    id: "history-1954",
    type: "raster",
    source: "history-1954",
    paint: {
      "raster-opacity": year === "1954" ? 1 : 0,
      "raster-opacity-transition": { duration: 0 },
      "raster-fade-duration": 0,
    },
  });
  for (const [period, name, metadata, before] of [
    ["1860", "jourdan-1860", jourdan1860, "overview-1875"],
    ["1904", "laffont-1904", laffont1904, "history-1954"],
  ] as const) {
    const id = "history-" + period;
    style.sources[id] = {
      type: "image",
      url: assetUrl(name + "/map.webp"),
      coordinates: metadata.coordinates as [
        [number, number],
        [number, number],
        [number, number],
        [number, number],
      ],
    };
    style.layers.splice(
      style.layers.findIndex((layer) => layer.id === before),
      0,
      {
        id,
        type: "raster",
        source: id,
        paint: {
          "raster-opacity": year === period ? 1 : 0,
          "raster-opacity-transition": { duration: 0 },
          "raster-fade-duration": 0,
        },
      },
    );
  }
  return style;
}
maplibregl.setWorkerUrl(workerUrl);
maplibregl.addProtocol("etat-major", loadStateMajorTile);
const protocol = new Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);
type Mode = "split" | "overlay" | "loupe";
function initialMode(): Mode {
  const value = new URLSearchParams(location.hash.slice(1)).get("mode");
  return value === "split" || value === "loupe" ? value : "overlay";
}
function initialPercent(key: string, fallback: number) {
  if (key === "opacity" && new URLSearchParams(location.hash.slice(1)).get("mode") === "modern")
    return 0;
  // Legacy historical-only links retain their fully opaque appearance.
  if (key === "opacity" && new URLSearchParams(location.hash.slice(1)).get("mode") === "historic")
    return 100;
  const raw = new URLSearchParams(location.hash.slice(1)).get(key);
  const value = Number(raw);
  return raw !== null && Number.isFinite(value) && value >= 0 && value <= 100 ? value : fallback;
}
const places = [
  { name: "Rue Ninau", center: [1.44954, 43.597678] as [number, number], zoom: 17.3 },
  { name: "Saint-Étienne", center: [1.448962, 43.599782] as [number, number], zoom: 17 },
  { name: "Saintes-Scarbes", center: [1.448734, 43.598128] as [number, number], zoom: 18 },
  { name: "Montoulieu", center: [1.450186, 43.596732] as [number, number], zoom: 17.5 },
  { name: "Saint-Cyprien", center: [1.4315, 43.599] as [number, number], zoom: 15.6 },
  { name: "Tout le centre", center: [1.442, 43.602] as [number, number], zoom: 15 },
];
// Toulouse and its immediate surroundings, including the 1954 imagery coverage.
const CITY_LIMITS: [[number, number], [number, number]] = [
  [1.3, 43.49],
  [1.57, 43.75],
];
const CITY_OVERVIEW: [[number, number], [number, number]] = [
  [1.412, 43.579],
  [1.472, 43.625],
];
const MIN_ZOOM = 11.5;
const MAX_ZOOM = 19;
function initialView() {
  const p = new URLSearchParams(location.hash.slice(1));
  const bearing = readBearing(p.get("bearing"));
  const lon = Number(p.get("lon")),
    lat = Number(p.get("lat")),
    z = Number(p.get("z"));
  const shared =
    p.has("lon") &&
    p.has("lat") &&
    p.has("z") &&
    Number.isFinite(lon) &&
    Number.isFinite(lat) &&
    Number.isFinite(z) &&
    lon >= CITY_LIMITS[0][0] &&
    lon <= CITY_LIMITS[1][0] &&
    lat >= CITY_LIMITS[0][1] &&
    lat <= CITY_LIMITS[1][1];
  return shared
    ? {
        center: [lon, lat] as [number, number],
        zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z)),
        shared,
        bearing,
      }
    : { center: [1.442, 43.602] as [number, number], zoom: 14, shared: false, bearing };
}
function initialEnabled(): Year[] {
  const value = new URLSearchParams(location.hash.slice(1)).get("layers");
  return value === null ? [...YEARS] : YEARS.filter((year) => value.split(",").includes(year));
}
function App() {
  const { selection: themePreference, theme } = useTheme();
  const mapTheme = useRef<Theme | null>(null);
  const [alignedToMap, setAlignedToMap] = useState(() => initialView().bearing !== 0);
  const modernEl = useRef<HTMLDivElement>(null),
    oldEl = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const historicMap = useRef<MapInstance | null>(null);
  const [enabled, setEnabled] = useState<Year[]>(initialEnabled);
  const [epochsOpen, setEpochsOpen] = useState(false);
  const locationMaps = useRef<MapInstance[]>([]);
  const geo = useLocation(locationMaps);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [time, setTime] = useState(() => Math.max(Number(enabled[0] ?? TODAY), initialTime()));
  const dates = [...enabled.map(Number), TODAY];
  const epoch = visibleEpoch(time, dates);
  const year = ((epoch === TODAY ? enabled.at(-1) : String(epoch)) as Year) ?? YEARS[0];
  const yearRef = useRef(year);
  const timelinePointer = useRef(false);
  const [opacity, setOpacity] = useState(() =>
      initialPercent(
        "opacity",
        new URLSearchParams(location.hash.slice(1)).get("mode") === "time" ||
          initialMode() !== "overlay"
          ? 100
          : 75,
      ),
    ),
    [split, setSplit] = useState(() => initialPercent("split", 50));
  const [compareHeld, setCompareHeld] = useState(false);
  const [loupe, setLoupe] = useState({ x: 50, y: 42 });
  const loupeDrag = useRef<{ id: number; x: number; y: number } | null>(null);
  const [peek, setPeek] = useState(false),
    [sources, setSources] = useState(false);
  const [ready, setReady] = useState({ modern: false, historic: false });
  const [errors, setErrors] = useState<string[]>([]);
  const [coords, setCoords] = useState("43.59768° N · 1.44954° E");
  const [copied, setCopied] = useState(false);
  const [shareFallback, setShareFallback] = useState("");
  const [placesOpen, setPlacesOpen] = useState(false);
  useEffect(() => {
    if (!modernEl.current || !oldEl.current) return;
    let modern: MapInstance, historic: MapInstance;
    try {
      const { shared: _shared, ...view } = initialView();
      const options = {
        ...view,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        maxBounds: CITY_LIMITS,
        pitchWithRotate: false,
        dragRotate: false,
        touchPitch: false,
        attributionControl: false as const,
      };
      modern = new maplibregl.Map({
        ...options,
        container: modernEl.current,
        style: modernMapStyle(appliedTheme()),
      });
      historic = new maplibregl.Map({
        ...options,
        container: oldEl.current,
        interactive: false,
        style: historicalStyle(yearRef.current),
      });
    } catch {
      // eslint-disable-next-line react/set-state-in-effect, react-hooks-js/set-state-in-effect -- Report failure of the external WebGL renderer.
      setErrors(["Impossible de démarrer la carte. Vérifiez WebGL et l’accélération matérielle."]);
      return;
    }
    map.current = modern;
    mapTheme.current = appliedTheme();
    historicMap.current = historic;
    locationMaps.current = [modern, historic];
    modern.touchZoomRotate.disableRotation();
    modern.keyboard.disableRotation();
    const sync = () =>
      historic.jumpTo({
        center: modern.getCenter(),
        zoom: modern.getZoom(),
        bearing: modern.getBearing(),
        pitch: 0,
      });
    modern.on("move", sync);
    if (!initialView().shared) {
      modern.fitBounds(CITY_OVERVIEW, { padding: 30, duration: 0, bearing: initialView().bearing });
      sync();
    }
    modern.on("mousemove", (e) =>
      setCoords(`${e.lngLat.lat.toFixed(5)}° N · ${e.lngLat.lng.toFixed(5)}° E`),
    );
    modern.addControl(
      new maplibregl.ScaleControl({ maxWidth: 120, unit: "metric" }),
      "bottom-left",
    );
    for (const [kind, instance] of [
      ["modern", modern],
      ["historic", historic],
    ] as const) {
      instance.on("idle", () => setReady((s) => ({ ...s, [kind]: true })));
      instance.on("error", (e) => {
        console.error(kind, e.error);
        setErrors((s) => [
          ...new Set([
            ...s,
            kind === "modern"
              ? "Chargement incomplet de la carte actuelle. Vérifiez la connexion et rechargez la page."
              : "Chargement incomplet de la carte historique. Vérifiez la connexion et rechargez la page.",
          ]),
        ]);
      });
    }
    const resize = new ResizeObserver(() => {
      modern.resize();
      historic.resize();
      sync();
    });
    resize.observe(modernEl.current);
    return () => {
      resize.disconnect();
      modern.remove();
      historic.remove();
      map.current = null;
      historicMap.current = null;
      locationMaps.current = [];
    };
  }, []);
  useEffect(() => {
    if (!map.current || mapTheme.current === theme) return;
    mapTheme.current = theme;
    map.current.setStyle(modernMapStyle(theme));
  }, [theme]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !e.defaultPrevented &&
        !(
          e.target instanceof HTMLElement &&
          e.target.closest(
            'input, button, select, textarea, [role="slider"], [role="dialog"], [role="radio"], [contenteditable="true"]',
          )
        )
      ) {
        e.preventDefault();
        setPeek(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "Space") setPeek(false);
    };
    const blur = () => {
      setPeek(false);
      setCompareHeld(false);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  useEffect(() => {
    const historical = historicMap.current;
    if (!historical) return;
    const apply = () => {
      if (!historical.getLayer("history-1680")) return;
      const blendDates = [...enabled.map(Number), TODAY];
      const index = Math.min(
        blendDates.length - 2,
        Math.max(
          0,
          blendDates.findIndex((date, i) => i < blendDates.length - 1 && time < blendDates[i + 1]),
        ),
      );
      const start =
        time === TODAY ? (blendDates[blendDates.length - 2] ?? TODAY) : blendDates[index];
      const end = time === TODAY ? TODAY : blendDates[index + 1];
      const fraction = end === start ? 1 : (time - start) / (end - start);
      for (const period of YEARS) {
        const value = !enabled.includes(period)
          ? 0
          : Number(period) === start
            ? end === TODAY
              ? 1 - fraction
              : 1
            : Number(period) === end
              ? fraction
              : 0;
        for (const kind of ["overview", "history"]) {
          const id = kind + "-" + period;
          if (historical.getLayer(id)) historical.setPaintProperty(id, "raster-opacity", value);
        }
      }
    };
    apply();
    historical.on("style.load", apply);
    return () => {
      historical.off("style.load", apply);
    };
  }, [time, enabled]);
  const lower = dates.filter((date) => date <= time).at(-1)!;
  const upper = dates.find((date) => date > time) ?? TODAY;
  const dateLabel = (date: number) =>
    date === TODAY ? "Actuel" : date === 450 ? "Ve" : date === 1250 ? "XIIIe" : String(date);
  const timePosition = timelinePosition(time, dates);
  const moveTimeline = (element: HTMLInputElement, clientX: number) => {
    const box = element.getBoundingClientRect();
    const position = (clientX - box.left - 8) / Math.max(1, box.width - 16);
    setTime(snapTimelineYear(Math.round(timelineYear(position, dates)), dates));
  };
  const timeLabel = dates.includes(time)
    ? time === 1875
      ? "1875 · Inondation"
      : time === 1848
        ? "1848 · État-major"
        : time === 1550
          ? "1550 · Héritages du parcellaire"
          : dateLabel(time)
    : `${dateLabel(lower)} → ${dateLabel(upper)}`;
  const toggleEpoch = (value: Year) => {
    const next = YEARS.filter((y) => (y === value ? !enabled.includes(y) : enabled.includes(y)));
    setEnabled(next);
    setTime((t) => Math.max(Number(next[0] ?? TODAY), t));
  };
  const visibleMode =
    enabled.length === 0 ? "modern" : compareHeld ? "overlay" : peek ? "modern" : mode;
  const populationYear = visibleMode === "modern" ? TODAY : time;
  const creditedPeriods =
    visibleMode === "modern" || (!compareHeld && opacity === 0)
      ? []
      : enabled.filter(
          (period) => Number(period) === lower || (time !== lower && Number(period) === upper),
        );
  const orientationEpoch = !enabled.length || opacity === 0 ? TODAY : epoch;
  const readingBearing = mapBearing(orientationEpoch);
  const bearing = alignedToMap ? readingBearing : 0;
  useEffect(() => {
    map.current?.easeTo({ bearing, duration: 450 });
  }, [bearing]);
  const loupeLeft = `clamp(var(--loupe-radius), ${loupe.x}%, calc(100% - var(--loupe-radius)))`;
  const loupeTop = `clamp(var(--loupe-radius), ${loupe.y}%, calc(100% - var(--loupe-radius)))`;
  const go = (index: number) =>
    map.current?.flyTo({ ...places[index], duration: 1000, essential: true });
  const share = async () => {
    const center = map.current?.getCenter();
    const view = initialView();
    const params = new URLSearchParams({
      lon: (center?.lng ?? view.center[0]).toFixed(6),
      lat: (center?.lat ?? view.center[1]).toFixed(6),
      z: (map.current?.getZoom() ?? view.zoom).toFixed(2),
      year,
      layers: enabled.join(","),
      mode,
      time: String(time),
      opacity: String(opacity),
      split: String(split),
      bearing: String(bearing),
    });
    const url = new URL(location.href);
    url.hash = params.toString();
    setShareFallback("");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Rétrolosa", url: url.href });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setShareFallback(url.href);
    }
  };
  return (
    <main tabIndex={-1}>
      <div className="map" ref={modernEl} aria-label="Carte actuelle de Toulouse" />
      <div
        className="map historic-map"
        ref={oldEl}
        aria-label="Cartes historiques sur la frise"
        style={{
          opacity:
            enabled.length === 0
              ? 0
              : compareHeld
                ? 0.2
                : visibleMode === "modern"
                  ? 0
                  : opacity / 100,
          clipPath:
            visibleMode === "split"
              ? `inset(0 ${100 - split}% 0 0)`
              : visibleMode === "loupe"
                ? `circle(var(--loupe-radius) at ${loupeLeft} ${loupeTop})`
                : "none",
        }}
      />
      {visibleMode === "loupe" && opacity > 0 && (
        <div className="map loupe-overlay">
          <Button
            className="loupe-glass"
            aria-label="Déplacer la loupe historique"
            aria-describedby="loupe-help"
            style={{ left: loupeLeft, top: loupeTop }}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              loupeDrag.current = {
                id: e.pointerId,
                x: e.clientX - rect.left - rect.width / 2,
                y: e.clientY - rect.top - rect.height / 2,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
              e.currentTarget.focus({ preventScroll: true });
              e.preventDefault();
            }}
            onPointerMove={(e) => {
              const drag = loupeDrag.current;
              if (!drag || drag.id !== e.pointerId) return;
              const rect = e.currentTarget.parentElement!.getBoundingClientRect();
              const radius = e.currentTarget.offsetWidth / 2;
              setLoupe({
                x:
                  (Math.max(radius, Math.min(rect.width - radius, e.clientX - rect.left - drag.x)) /
                    rect.width) *
                  100,
                y:
                  (Math.max(radius, Math.min(rect.height - radius, e.clientY - rect.top - drag.y)) /
                    rect.height) *
                  100,
              });
            }}
            onPointerUp={() => {
              loupeDrag.current = null;
            }}
            onPointerCancel={() => {
              loupeDrag.current = null;
            }}
            onLostPointerCapture={() => {
              loupeDrag.current = null;
            }}
            onKeyDown={(e) => {
              const direction = {
                ArrowLeft: [-1, 0],
                ArrowRight: [1, 0],
                ArrowUp: [0, -1],
                ArrowDown: [0, 1],
              }[e.key];
              if (!direction) return;
              e.preventDefault();
              const rect = e.currentTarget.parentElement!.getBoundingClientRect();
              const radius = e.currentTarget.offsetWidth / 2;
              const step = e.shiftKey ? 40 : 10;
              setLoupe((position) => ({
                x:
                  (Math.max(
                    radius,
                    Math.min(
                      rect.width - radius,
                      (position.x / 100) * rect.width + direction[0] * step,
                    ),
                  ) /
                    rect.width) *
                  100,
                y:
                  (Math.max(
                    radius,
                    Math.min(
                      rect.height - radius,
                      (position.y / 100) * rect.height + direction[1] * step,
                    ),
                  ) /
                    rect.height) *
                  100,
              }));
            }}
          />
        </div>
      )}
      <header className="masthead">
        <a className="brand" href={import.meta.env.BASE_URL} aria-label="Rétrolosa">
          <Layers size={20} />
          <span>Rétrolosa</span>
        </a>
        <div className="header-right">
          <Button
            type="button"
            className="header-icon theme-toggle"
            aria-label={`Thème : ${themeLabels[themePreference]}. Passer au thème ${themeLabels[nextTheme[themePreference]]}`}
            data-tooltip={`Thème : ${themeLabels[themePreference]}. Passer au thème ${themeLabels[nextTheme[themePreference]]}`}
            onClick={() => setThemePreference(nextTheme[themePreference])}
          >
            {themePreference === "system" ? (
              <Monitor size={18} aria-hidden="true" />
            ) : themePreference === "light" ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </Button>
          <span className="sr-only" role="status">
            Thème : {themeLabels[themePreference]}
            {themePreference === "system" ? ` (${themeLabels[theme]})` : ""}
          </span>
          <Popover
            open={placesOpen}
            onOpenChange={(open) => {
              setPlacesOpen(open);
              if (open) setEpochsOpen(false);
            }}
            label="Choisir un lieu"
            closeLabel="Fermer le choix du lieu"
            className="places-popover"
            align="end"
            trigger={
              <Button className="places-button" data-tooltip="Aller à un lieu">
                <MapPin size={17} />
                Lieux
              </Button>
            }
          >
            <select
              aria-label="Aller à un lieu"
              defaultValue=""
              onChange={(event) => {
                go(Number(event.target.value));
                setPlacesOpen(false);
              }}
            >
              <option value="" disabled>
                Choisir un lieu
              </option>
              {places.map((place, index) => (
                <option key={place.name} value={index}>
                  {place.name}
                </option>
              ))}
            </select>
          </Popover>
          <Button
            className="header-icon"
            onClick={share}
            aria-label="Partager la vue"
            data-tooltip={copied ? "Lien copié" : "Partager la vue"}
          >
            {copied ? <Check size={17} /> : <Share2 size={17} />}
          </Button>
          {copied && (
            <span className="sr-only" aria-live="polite">
              Lien copié
            </span>
          )}
          <Button
            className="source-button header-icon"
            onClick={() => setSources(true)}
            aria-label="À propos des cartes"
            data-tooltip="À propos des cartes"
          >
            <Info size={18} />
          </Button>
        </div>
      </header>
      <CityWidget
        year={populationYear}
        label={dateLabel(populationYear)}
        onSources={() => setSources(true)}
      />
      {visibleMode === "split" && opacity > 0 && (
        <>
          <div className="epoch-label old-label">
            {year === "1875" ? "1875 · Inondation" : epochLabel(year)}{" "}
            <span>
              {year === "450" || year === "1250"
                ? "RECONSTRUCTION"
                : year === "1550"
                  ? "HÉRITAGES DU PARCELLAIRE"
                  : year === "1954"
                    ? "VUE AÉRIENNE"
                    : "CADASTRE HISTORIQUE"}
            </span>
          </div>
          <div className="epoch-label new-label">
            <span>CARTE ACTUELLE</span> Actuel
          </div>
          <div className="divider" style={{ left: `${split}%` }}>
            <div
              className="divider-handle"
              role="slider"
              tabIndex={0}
              aria-label="Limite de comparaison"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(split)}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  setSplit(Math.max(0, Math.min(100, (e.clientX / window.innerWidth) * 100)));
              }}
              onKeyDown={(e) => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                  e.preventDefault();
                  setSplit((s) =>
                    e.key === "Home"
                      ? 0
                      : e.key === "End"
                        ? 100
                        : Math.max(0, Math.min(100, s + (e.key === "ArrowLeft" ? -2 : 2))),
                  );
                }
              }}
            >
              <ArrowLeftRight size={21} />
            </div>
          </div>
        </>
      )}
      <div className="opacity-controls" role="group" aria-label="Transparence et comparaison">
        <Button
          className="compare-hold"
          tooltipSide="left"
          aria-label="Maintenir pour comparer avec la carte actuelle"
          aria-pressed={compareHeld}
          data-tooltip="Maintenez pour lire les rues actuelles"
          onPointerDown={(e) => {
            if (e.button !== 0 || !e.isPrimary) return;
            e.preventDefault();
            e.currentTarget.focus();
            e.currentTarget.setPointerCapture(e.pointerId);
            setCompareHeld(true);
          }}
          onPointerUp={() => setCompareHeld(false)}
          onPointerCancel={() => setCompareHeld(false)}
          onLostPointerCapture={() => setCompareHeld(false)}
          onBlur={() => setCompareHeld(false)}
          onContextMenu={(e) => e.preventDefault()}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setCompareHeld(true);
            }
            if (e.key === "Escape") setCompareHeld(false);
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              setCompareHeld(false);
            }
          }}
        >
          <Eye size={20} />
        </Button>
        <section className="opacity-panel" aria-label="Opacité">
          <Slider
            value={opacity}
            onValueChange={setOpacity}
            label="Opacité de la carte historique"
            valueText={opacity === 0 ? "Carte actuelle" : `${opacity} %`}
            disabled={!enabled.length}
          />
          <output>{opacity}%</output>
        </section>
      </div>
      <div className="zoom-controls">
        <Button
          className={geo.status !== "off" ? "location-active" : ""}
          aria-label={geo.status === "off" ? "Me localiser" : "Désactiver la localisation"}
          tooltipSide="left"
          data-tooltip={geo.status === "off" ? "Me localiser" : "Désactiver la localisation"}
          aria-pressed={geo.status !== "off"}
          onClick={geo.toggle}
        >
          <Navigation size={19} fill={geo.status === "following" ? "currentColor" : "none"} />
        </Button>
        <div />
        <Button
          tooltipSide="left"
          data-tooltip="Zoom avant"
          aria-label="Zoom avant"
          onClick={() => map.current?.zoomIn()}
        >
          <Plus size={20} />
        </Button>
        <Button
          tooltipSide="left"
          data-tooltip="Zoom arrière"
          aria-label="Zoom arrière"
          onClick={() => map.current?.zoomOut()}
        >
          <Minus size={20} />
        </Button>
        <Button
          className="orientation-button"
          tooltipSide="left"
          aria-label={
            readingBearing === 0
              ? "Orientation : nord"
              : `Orientation : ${bearing === 0 ? "nord" : `${bearing}°`}. Tourner vers ${nextBearing(bearing, orientationEpoch) === 0 ? "le nord" : `${nextBearing(bearing, orientationEpoch)}°`}`
          }
          data-tooltip={
            readingBearing === 0
              ? "Ce plan est orienté au nord"
              : `Orientation : ${bearing === 0 ? "nord" : `${bearing}°`} · Cliquer pour tourner`
          }
          data-bearing={bearing}
          disabled={readingBearing === 0}
          onClick={() => {
            if (!map.current) return;
            setAlignedToMap(!alignedToMap);
          }}
        >
          <Compass size={18} style={{ transform: `rotate(${-bearing}deg)` }} />
          <span>{bearing === 0 ? "N" : `${bearing}°`}</span>
        </Button>
        <div />
        <Button
          aria-label="Vue d’ensemble de Toulouse"
          tooltipSide="left"
          data-tooltip="Vue d’ensemble de Toulouse"
          onClick={() =>
            map.current?.fitBounds(CITY_OVERVIEW, {
              padding: 30,
              duration: 1000,
              essential: true,
              bearing,
            })
          }
        >
          <RotateCcw size={18} />
        </Button>
      </div>
      <div className="control-dock">
        <section className="control-panel" aria-label="Comparaison des cartes">
          <span className="sr-only">
            {ready.modern && ready.historic ? "Cartes chargées" : "Chargement des cartes…"}
          </span>
          {!(ready.modern && ready.historic) && (
            <Tooltip text="Chargement des cartes…">
              <span className="loading-dot" />
            </Tooltip>
          )}
          <div className="timeline-tools">
            <Popover
              open={epochsOpen}
              onOpenChange={(open) => {
                setEpochsOpen(open);
                if (open) setPlacesOpen(false);
              }}
              label="Époques visibles"
              closeLabel="Fermer le choix des époques"
              className="epochs-popover"
              side="top"
              trigger={
                <Button className="epochs-button" data-tooltip="Choisir les époques visibles">
                  <Layers size={17} />
                  <span>Époques</span>
                </Button>
              }
            >
              <div role="group" aria-label="Époques visibles">
                {YEARS.map((value) => (
                  <label key={value}>
                    <Checkbox
                      checked={enabled.includes(value)}
                      onCheckedChange={() => toggleEpoch(value)}
                    />
                    <span>{epochLabel(value)}</span>
                    <small>
                      {value === "450" || value === "1250"
                        ? "Reconstruction"
                        : value === "1550"
                          ? "Héritages du parcellaire"
                          : value === "1848"
                            ? "État-major · IGN"
                            : value === "1860"
                              ? "Plan de Jourdan"
                              : value === "1904"
                                ? "Plan de Laffont"
                                : value === "1777"
                                  ? "Plan de Saget"
                                  : value === "1631"
                                    ? "Plan · calage approximatif"
                                    : value === "1875"
                                      ? "Inondation"
                                      : value === "1954"
                                        ? "Vue aérienne"
                                        : "Cadastre"}
                    </small>
                  </label>
                ))}
              </div>
            </Popover>
            <ToggleGroup
              className="comparison-switch"
              aria-label="Forme de comparaison"
              value={mode}
              onValueChange={(value) => setMode(value as Mode)}
            >
              {(["overlay", "split", "loupe"] as const).map((shape) => (
                <ToggleItem key={shape} value={shape} asChild disabled={!enabled.length}>
                  <Button
                    aria-label={
                      shape === "split" ? "Rideau" : shape === "loupe" ? "Loupe" : "Superposition"
                    }
                    data-tooltip={
                      shape === "split" ? "Rideau" : shape === "loupe" ? "Loupe" : "Superposition"
                    }
                    disabled={!enabled.length}
                  >
                    {shape === "split" ? (
                      <ArrowLeftRight size={16} />
                    ) : shape === "loupe" ? (
                      <Search size={16} />
                    ) : (
                      <Blend size={16} />
                    )}
                    <span>
                      {shape === "split" ? "Rideau" : shape === "loupe" ? "Loupe" : "Superposition"}
                    </span>
                  </Button>
                </ToggleItem>
              ))}
            </ToggleGroup>
          </div>
          {mode === "loupe" && (
            <p className="sr-only" id="loupe-help">
              Déplacez la loupe pour explorer le passé
              <span className="sr-only">. Utilisez les flèches du clavier pour la déplacer.</span>
            </p>
          )}
          <div className="timeline">
            <div className="timeline-value sr-only" aria-live="polite">
              {timeLabel}
            </div>
            <div className="timeline-range">
              <div
                className="timeline-track"
                style={{
                  background: `linear-gradient(to right, var(--slider) ${timePosition * 100}%, var(--track) ${timePosition * 100}%)`,
                }}
              />
              <div
                className="timeline-thumb"
                style={{ left: `calc(${timePosition * 100}% + ${8 - 16 * timePosition}px)` }}
              />
              <Tooltip
                text="Voyage dans le temps · Utilisez les flèches pour ajuster l’année"
                sideOffset={56}
              >
                <input
                  key={dates.join(",")}
                  aria-label="Voyage dans le temps"
                  aria-valuetext={timeLabel}
                  type="range"
                  min={dates[0]}
                  max={TODAY}
                  disabled={!enabled.length}
                  step="1"
                  value={time}
                  onPointerDown={(e) => {
                    if (e.button !== 0 || !e.isPrimary || !enabled.length) return;
                    e.preventDefault();
                    e.currentTarget.focus();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    timelinePointer.current = true;
                    moveTimeline(e.currentTarget, e.clientX);
                  }}
                  onPointerMove={(e) => {
                    if (e.currentTarget.hasPointerCapture(e.pointerId))
                      moveTimeline(e.currentTarget, e.clientX);
                  }}
                  onPointerUp={() => {
                    timelinePointer.current = false;
                  }}
                  onPointerCancel={() => {
                    timelinePointer.current = false;
                  }}
                  onBlur={() => {
                    timelinePointer.current = false;
                  }}
                  onKeyDown={() => {
                    timelinePointer.current = false;
                  }}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    // Keyboard input retains one-year steps.
                    setTime(timelinePointer.current ? snapTimelineYear(value, dates) : value);
                  }}
                />
              </Tooltip>
            </div>
            <div className="timeline-ticks">
              {dates.map((date, index) => (
                <Button
                  key={date}
                  data-period={date}
                  aria-pressed={time === date}
                  style={{
                    // Match the native range's 16px thumb travel, including both end insets.
                    left: `calc(${timelinePosition(date, dates) * 100}% + ${8 - 16 * timelinePosition(date, dates)}px)`,
                    transform: index === 0 ? "none" : "translateX(-50%)",
                  }}
                  onClick={() => setTime(date)}
                >
                  {dateLabel(date)}
                </Button>
              ))}
            </div>
          </div>
        </section>
      </div>
      {(geo.message || geo.status === "locating") && (
        <div className="location-notice" role="status">
          <span>{geo.message || "Localisation en cours…"}</span>
          <Button aria-label="Masquer le message de localisation" onClick={geo.dismiss}>
            <X size={14} />
          </Button>
        </div>
      )}
      {errors.length > 0 && (
        <div className="error-toast" role="alert">
          {errors.map((e) => (
            <p key={e}>{e}</p>
          ))}
          <Button onClick={() => location.reload()}>Recharger</Button>
          <Button aria-label="Fermer le message" onClick={() => setErrors([])}>
            <X size={16} />
          </Button>
        </div>
      )}
      <footer>
        <span className="coordinates">{coords}</span>
        <span className="map-credits">
          {creditedPeriods.map((period) => (
            <React.Fragment key={period}>
              <a href={sourceUrl(period)} target="_blank" rel="noreferrer">
                {mapCredit(period)}
              </a>
              {" · "}
            </React.Fragment>
          ))}
          ©{" "}
          <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">
            OpenMapTiles
          </a>
          {" · "}©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>
        </span>
      </footer>
      <Dialog
        open={Boolean(shareFallback)}
        onOpenChange={(open) => {
          if (!open) setShareFallback("");
        }}
        label="Partager la vue"
        closeLabel="Fermer le partage"
        className="share-modal"
      >
        <h2>Partager la vue</h2>
        <p>Copiez ce lien pour retrouver cette vue de la carte.</p>
        <input
          readOnly
          aria-label="Lien de partage"
          value={shareFallback}
          onFocus={(e) => e.currentTarget.select()}
        />
      </Dialog>
      <Dialog
        open={sources}
        onOpenChange={setSources}
        label="Cartes et précision"
        closeLabel="Fermer les sources"
      >
        <div className="eyebrow">SOURCES ET PRÉCISION</div>
        <h2>Cartes de Toulouse</h2>
        {year === "450" ? (
          <>
            <h3>Toulouse à la fin de l’Antiquité · reconstruction</h3>
            <p>
              Figure 1 de l’étude de Quitterie Cazes, dessin de F. Callède. Le plan distingue les
              vestiges du Haut et du Bas Empire et les propositions de restitution des axes de la
              voirie antique. Le fond parcellaire et les églises servent de repères ; tous les
              éléments dessinés ne sont pas contemporains.
            </p>
            <p>
              La source indique la fin de l’Antiquité, sans année précise. Le repère 450 dans les
              liens et la frise sert uniquement au classement. La légende originale est conservée.
              Le calage affine utilise trois églises de référence ; le contrôle indépendant à
              Saint-Pierre-des-Cuisines donne un écart d’environ{" "}
              {antiquity.checkPoints[0].errorMetres} m, sans garantir la précision ailleurs.
            </p>
            <a
              href={assetUrl("openedition-antiquite/figure-01.jpg")}
              target="_blank"
              rel="noreferrer"
            >
              Voir le dessin complet et sa légende <ExternalLink size={14} />
            </a>
          </>
        ) : year === "1250" ? (
          <>
            <h3>Toulouse au XIIIe siècle · reconstruction</h3>
            <p>
              Dessin de F. Callède, Inrap, PCR « Toulouse au Moyen Âge », illustration 6 de l’étude
              de Quitterie Cazes publiée dans Marquer la ville (2013), sur OpenEdition. Les
              positions connues et proposées sont distinguées dans la légende originale. Le fond
              parcellaire est un repère de lecture, pas un relevé exact du XIIIe siècle.
            </p>
            <p>
              Calage affine sur Saint-Sernin, Saint-Étienne et la Dalbade. Un contrôle indépendant à
              Saint-Pierre-des-Cuisines donne un écart d’environ{" "}
              {medieval13c.checkPoints[0].errorMetres} m, sans garantir la précision ailleurs. La
              légende originale est conservée sur la carte. Le repère 1250 dans les liens et la
              frise sert au classement ; la source date le plan du XIIIe siècle, sans année précise.
            </p>
            <a href={assetUrl("openedition-13c/figure-06.jpg")} target="_blank" rel="noreferrer">
              Voir le dessin complet et sa légende <ExternalLink size={14} />
            </a>
          </>
        ) : year === "1550" ? (
          <>
            <h3>1550 · Héritages du parcellaire</h3>
            <p>
              Assemblage des figures 7 et 8 de l’étude de Quitterie Cazes, dessins de F. Callède /
              Inrap. Les limites rouges de la figure 7, d’orientation antique, complètent les
              limites bleues de la figure 8. Le fond et la légende de la figure 8 sont conservés ;
              le fond archéologique propre à la figure 7 reste dans l’original.
            </p>
            <p>
              1550 date le cadastre restitué qui sert à l’analyse. Les rues et édifices du fond
              représentent notamment les XIIe et XIIIe siècles : ce n’est pas un état complet de
              Toulouse en 1550. Le calage utilise trois églises ; le contrôle indépendant à
              Saint-Pierre-des-Cuisines donne un écart d’environ{" "}
              {parcels1550.checkPoints[0].errorMetres} m, sans garantir la précision ailleurs.
            </p>
            <a href={assetUrl("openedition-1550/figure-07.jpg")} target="_blank" rel="noreferrer">
              Figure 7 · Héritages antiques <ExternalLink size={14} />
            </a>{" "}
            <a href={assetUrl("openedition-1550/figure-08.jpg")} target="_blank" rel="noreferrer">
              Figure 8 · Héritages médiévaux <ExternalLink size={14} />
            </a>
          </>
        ) : year === "1631" ? (
          <>
            <h3>Plan de Melchior Tavernier · 1631</h3>
            <p>
              Plan de la ville de Tholose, Archives municipales de Toulouse, II 671. Numérisation
              originale de 7874 × 5884 pixels, domaine public.
            </p>
            <p>
              Calage révisé sur 22 repères au sol, avec une correction locale de la rue Nazareth.
              Quatre contrôles distincts autour de Nazareth et du Salin donnent des écarts de 8 à 39
              m, sans établir la précision de toute la ville. Les monuments sont dessinés en
              perspective ; les toits et les bords restent moins fiables. Ce plan ne garantit pas
              une correspondance exacte rue par rue.
            </p>
            <p>Le feuillet complet conserve ses marges, son cartouche et sa légende.</p>
            <a href={assetUrl("tavernier-1631/original.jpg")} target="_blank" rel="noreferrer">
              Voir le plan complet et sa légende <ExternalLink size={14} />
            </a>
          </>
        ) : year === "1777" ? (
          <>
            <h3>Plan de Joseph Marie de Saget · 1777</h3>
            <p>
              Plan de la ville de Toulouse dédié et présenté à Monsieur le frère du Roi. Dessin de
              Joseph Marie de Saget, gravure de Pierre Gabriel Berthault. Archives municipales de
              Toulouse, II 686 · domaine public. Numérisation originale de 5906 × 4047 pixels.
            </p>
            <p>
              Le plan complet conserve ses tables et sa légende. Calage affine manuel sur
              Saint-Sernin, Saint-Étienne et la rive droite du Pont Neuf. Deux contrôles distincts
              donnent des écarts de{" "}
              {saget1777.checkPoints.map((point) => point.errorMetres).join(" et ")} m. Ces repères
              ne garantissent pas la précision ailleurs ; la correspondance des rues reste
              approximative, surtout aux bords.
            </p>
            <a href={assetUrl("saget-1777/original.jpg")} target="_blank" rel="noreferrer">
              Voir le plan complet et sa légende <ExternalLink size={14} />
            </a>
          </>
        ) : year === "1848" ? (
          <>
            <h3>Carte de l’état-major · 1848</h3>
            <p>
              Minutes en couleurs au 1 : 40 000, diffusées par IGN. Le catalogue officiel date de
              1848 le feuillet 230 NO qui couvre le centre de Toulouse, ainsi que les cinq feuillets
              voisins intersectant notre zone de navigation. La période « 1820–1866 » désigne la
              série nationale, pas la date de Toulouse.
            </p>
            <p>
              Le millésime 1848 est celui des minutes dans le catalogue. Des compléments ultérieurs,
              notamment ferroviaires, peuvent figurer dans cette série : chaque objet dessiné n’est
              donc pas nécessairement un état de 1848. La carte montre surtout le territoire, les
              routes, les cultures et les villages autour de la ville ; elle ne donne pas la
              précision d’un cadastre parcellaire.
            </p>
            <p>
              Géoréférencement IGN affiné sur 30 repères conservés : carrefours, ponts, monuments et
              axes autour du Grand Rond. Quinze contrôles indépendants vérifient ce recalage
              progressif dans le centre. Les tuiles couvrent les niveaux de zoom 6 à 15 ; au-delà,
              elles sont agrandies. Source IGN, Licence Ouverte 2.0 ; métadonnées vérifiées le 1er
              octobre 2026.
            </p>
            <a
              href="https://www.data.gouv.fr/datasets/scan-etat-major-r-40k-1"
              target="_blank"
              rel="noreferrer"
            >
              Catalogue IGN et licence <ExternalLink size={14} />
            </a>
          </>
        ) : year === "1860" || year === "1904" ? (
          <>
            <h3>
              {year === "1860"
                ? "Plan de Jourdan et Rivière · vers 1860"
                : "Plan de Léon Laffont · 1904"}
            </h3>
            <p>
              {year === "1860"
                ? "Ville de Toulouse. Faubourgs. Banlieue. Dessin de Justin Jourdan, lithographie de Prosper Rivière. Archives municipales de Toulouse, 20 Fi 66 · domaine public."
                : "Plan de la ville de Toulouse. Dessin de Léon Laffont, lithographie de Pierre Rouy, édition Pagès et Carrère. Archives municipales de Toulouse, 20Fi57. Tirage de 1904."}
            </p>
            <p>
              {year === "1860"
                ? "Le plan montre le chemin de fer, les places et les faubourgs. Il comprend des changements réalisés et des alignements officiellement projetés, à distinguer avec la légende. Les cartes annexes et les vues de monuments sont conservées."
                : "Le plan couvre le centre et les faubourgs, notamment les Minimes, Bonnefoy, Saint-Cyprien et Saint-Michel. Le pont des Amidonniers y figure comme projet. Les numéros de grille, le titre et les marges sont conservés."}
            </p>
            <p>
              Calage sur {(year === "1860" ? jourdan1860 : laffont1904).fitPointCount} repères
              répartis entre le centre, les ponts du canal, Saint-Cyprien et le Grand Rond, dont le
              bassin central et trois axes de rues autour du parc, avec une correction progressive
              des déformations du plan. Quinze contrôles indépendants sur des carrefours, églises et
              places donnent des écarts de{" "}
              {(year === "1860" ? jourdan1860 : laffont1904).checkPoints
                .map((point) => point.errorMetres)
                .join(", ")}{" "}
              m. Ces contrôles concernent le centre ; ils ne garantissent pas la précision aux
              faubourgs ni aux bords du document. Le feuillet complet est conservé.
            </p>
            <a
              href={assetUrl((year === "1860" ? "jourdan-1860" : "laffont-1904") + "/original.jpg")}
              target="_blank"
              rel="noreferrer"
            >
              Voir le plan complet <ExternalLink size={14} />
            </a>
          </>
        ) : year === "1875" ? (
          <>
            <h3>Inondation des 23–24 juin 1875</h3>
            <p>
              Plan original Sirven / La Dépêche, Archives municipales de Toulouse, 20 Fi 45.
              Numérisation disponible sur Mapas Milhaud. Le bleu indique les zones inondées ; le
              rouge, les maisons écroulées.
            </p>
            <p>
              Le plan a été calé manuellement sur 15 repères. Sur trois points de contrôle
              indépendants, les écarts sont de 14 à 27 m. La précision diminue aux bords. Ce
              document historique ne décrit pas le risque actuel d’inondation.
            </p>
          </>
        ) : year === "1954" ? (
          <>
            <h3>Vue aérienne de 1954</h3>
            <p>
              Photographie aérienne en noir et blanc fournie par IGN / Edugéo, déjà géoréférencée. À
              fort zoom, les pixels du cliché deviennent visibles. Hors couverture, la carte
              actuelle reste affichée.
            </p>
          </>
        ) : (
          <>
            <h3>{year === "1680" ? "Vers 1680" : "Cadastre de 1830"}</h3>
            <p>
              Carte réalisée par Makina Corpus à partir du cadastre historique de Toulouse
              Métropole. Il s’agit d’un dessin actuel de données historiques, et non d’un scan
              d’archive. Les tuiles géoréférencées sont utilisées sans déformation supplémentaire.
            </p>
          </>
        )}
        <a href={sourceUrl(year)} target="_blank" rel="noreferrer">
          Ouvrir la carte source <ExternalLink size={14} />
        </a>
        <h3>Population de Toulouse</h3>
        <p>
          Ordres de grandeur de la ville historique, puis de la commune, pas de la métropole. Entre
          les repères documentés, le compteur interpole les valeurs et les arrondit au millier. Les
          estimations anciennes sont incertaines et les périmètres varient. Pour l’Antiquité, le
          repère est d’environ 20 000 habitants ; les variations du haut Moyen Âge ne sont pas
          reconstituées. Après 2023, le dernier recensement est conservé.
        </p>
        <p>
          Sources :{" "}
          <a
            href="https://archives.toulouse.fr/place-saint-etienne/"
            target="_blank"
            rel="noreferrer"
          >
            Archives de Toulouse
          </a>
          ,{" "}
          <a
            href="https://www.persee.fr/doc/hes_0752-5702_1998_num_17_3_1997"
            target="_blank"
            rel="noreferrer"
          >
            Laffont · Ancien Régime
          </a>
          ,{" "}
          <a
            href="https://fr.wikipedia.org/wiki/Toulouse#Démographie"
            target="_blank"
            rel="noreferrer"
          >
            Recensements historiques
          </a>
          ,{" "}
          <a
            href="https://www.insee.fr/fr/statistiques/2011101?geo=COM-31555"
            target="_blank"
            rel="noreferrer"
          >
            INSEE · 1968–2023
          </a>
          .
        </p>
        <h3>Utilisation</h3>
        <p>
          Le bouton boussole alterne entre le nord et l’orientation du plan visible : 53° pour 1777
          ou 84° pour 1631. Sur la frise, le plan qui apparaît devient la référence à mi-transition.
          Les autres plans restent orientés au nord. Ces angles approchés facilitent la lecture des
          légendes ; les déformations des anciens plans peuvent subsister.
        </p>
        <p>
          Sur ordinateur, maintenez la barre d’espace pour afficher la carte actuelle. Maintenez le
          bouton avec l’icône œil pour lire les rues actuelles avec une légère superposition
          historique. Relâchez pour revenir à la vue précédente. « Lieux » permet de rejoindre un
          quartier. « Partager » crée un lien vers la vue actuelle, avec les époques et les réglages
          choisis.
        </p>
        <h3>Frise et comparaison</h3>
        <p>
          La frise mélange les cartes sélectionnées dans « Époques » et la carte actuelle. Les
          outils au-dessus permettent de choisir la superposition, le rideau ou la loupe sans
          changer la date. Les sources disponibles sont les reconstructions de la fin de l’Antiquité
          et du XIIIe siècle, les héritages du parcellaire de 1550, les plans de 1631 et 1777, les
          cadastres de 1680 et 1830, l’état-major de 1848, les plans de 1860 et 1904, le plan
          d’inondation de 1875 et la vue aérienne de 1954. Les positions intermédiaires sont des
          transitions visuelles, pas des reconstitutions de ces années.
        </p>
        <h3>Crédits de toutes les cartes</h3>
        <ul className="source-credits">
          {YEARS.map((period) => (
            <li key={period}>
              <a href={sourceUrl(period)} target="_blank" rel="noreferrer">
                {epochLabel(period)} · {mapCredit(period)}
                {["1631", "1777", "1860", "1904"].includes(period) &&
                  " / Archives municipales de Toulouse"}
              </a>
            </li>
          ))}
        </ul>
        <h3>La ville actuelle</h3>
        <p>
          Carte vectorielle OpenFreeMap issue d’OpenStreetMap. La date de mise à jour varie selon
          les objets ; ce n’est pas une photographie de la ville à une date précise.
        </p>
        <p>
          <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">
            OpenFreeMap
          </a>{" "}
          · ©{" "}
          <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">
            OpenMapTiles
          </a>{" "}
          · ©{" "}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
            OpenStreetMap
          </a>
        </p>
        <h3>Comprendre les écarts</h3>
        <p>
          Les écarts peuvent refléter les transformations de la ville ou les imprécisions des
          documents historiques. Pour les cadastres de 1680 et 1830, la précision et les points de
          calage ne sont pas publiés avec les tuiles. La concordance de chaque bâtiment n’est pas
          garantie. Les données anciennes sont absentes hors de leur couverture.
        </p>
        <h3>Réutilisation des données</h3>
        <p>
          Le catalogue officiel indique la Licence Ouverte v2.0 pour les données cadastrales. Les
          conditions propres au rendu et à l’hébergement des tuiles Makina Corpus restent à
          confirmer. Cette version sert à une exploration personnelle du concept ; une diffusion
          publique nécessiterait de clarifier ces conditions ou de produire une couche à partir des
          données ouvertes.
        </p>
        <a
          href={`https://data.toulouse-metropole.fr/explore/dataset/parcellaire-de-${year === "1680" ? "1680" : "1830"}/information/`}
          target="_blank"
          rel="noreferrer"
        >
          Catalogue officiel <ExternalLink size={14} />
        </a>
      </Dialog>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <TooltipProvider delayDuration={320} skipDelayDuration={120}>
      <App />
    </TooltipProvider>
  </React.StrictMode>,
);
