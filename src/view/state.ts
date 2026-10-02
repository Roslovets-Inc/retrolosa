import { EPOCH_IDS, getEpoch, isEpochId } from "../epochs/catalog";
import type { EpochId } from "../epochs/catalog";
import { nextBearing, readBearing } from "../orientation";

export type Mode = "split" | "overlay" | "loupe";
export interface ViewState {
  enabled: EpochId[];
  time: number;
  mode: Mode;
  opacity: number;
  split: number;
  bearing: number;
}
export interface CameraView {
  center: [number, number];
  zoom: number;
  bearing: number;
}
export interface InitialView {
  state: ViewState;
  camera: CameraView;
  shared: boolean;
}

// Navigation and shared views use the same bounds and zoom limits.
export const CITY_LIMITS: [[number, number], [number, number]] = [
  [1.18, 43.38],
  [1.7, 43.86],
];
export const CITY_OVERVIEW: [[number, number], [number, number]] = [
  [1.412, 43.579],
  [1.472, 43.625],
];
export const MIN_ZOOM = 10.5;
export const MAX_ZOOM = 19;
const DEFAULT_CAMERA: CameraView = { center: [1.442, 43.602], zoom: 14, bearing: 0 };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const bounded = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? clamp(value, min, max) : fallback;

export function normalizeTimeSelection(state: Pick<ViewState, "enabled" | "time">, today: number) {
  const enabled = EPOCH_IDS.filter((id) => state.enabled.includes(id));
  const first = Number(enabled[0] ?? today);
  return { enabled, time: bounded(state.time, first, today, first) };
}

export function normalizeViewState(state: ViewState, today: number): ViewState {
  return {
    ...state,
    ...normalizeTimeSelection(state, today),
    opacity: bounded(state.opacity, 0, 100, 75),
    split: bounded(state.split, 0, 100, 50),
  };
}

function percent(params: URLSearchParams, key: string, fallback: number) {
  const raw = params.get(key);
  const value = Number(raw);
  return raw !== null && raw.trim() !== "" && Number.isFinite(value) && value >= 0 && value <= 100
    ? value
    : fallback;
}

/** Parse once at startup; navigation never writes the current address. */
export function parseViewState(hash: string, today: number): InitialView {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const rawYear = params.get("year") ?? "";
  const year = isEpochId(rawYear) ? rawYear : "1250";
  const rawTime = Number(params.get("time"));
  const time =
    Number.isFinite(rawTime) && rawTime >= Number(EPOCH_IDS[0]) && rawTime <= today
      ? rawTime
      : Number(year);
  const layers = params.get("layers");
  const enabled =
    layers === null ? [...EPOCH_IDS] : EPOCH_IDS.filter((id) => layers.split(",").includes(id));
  const legacyMode = params.get("mode");
  const mode: Mode = legacyMode === "split" || legacyMode === "loupe" ? legacyMode : "overlay";
  const opacity =
    legacyMode === "modern"
      ? 0
      : legacyMode === "historic"
        ? 100
        : percent(params, "opacity", legacyMode === "time" || mode !== "overlay" ? 100 : 75);
  const bearing = readBearing(params.get("bearing"));
  const lon = Number(params.get("lon"));
  const lat = Number(params.get("lat"));
  const zoom = Number(params.get("z"));
  const shared =
    ["lon", "lat", "z"].every((key) => {
      const raw = params.get(key);
      return raw !== null && raw.trim() !== "" && Number.isFinite(Number(raw));
    }) &&
    lon >= CITY_LIMITS[0][0] &&
    lon <= CITY_LIMITS[1][0] &&
    lat >= CITY_LIMITS[0][1] &&
    lat <= CITY_LIMITS[1][1];
  return {
    shared,
    camera: shared
      ? { center: [lon, lat], zoom: clamp(zoom, MIN_ZOOM, MAX_ZOOM), bearing }
      : { ...DEFAULT_CAMERA, center: [...DEFAULT_CAMERA.center], bearing },
    state: normalizeViewState(
      {
        enabled,
        time,
        mode,
        opacity,
        split: percent(params, "split", 50),
        bearing,
      },
      today,
    ),
  };
}

export type ViewAction =
  | { type: "time"; value: number }
  | { type: "toggleEpoch"; id: EpochId }
  | { type: "mode"; value: Mode }
  | { type: "opacity"; value: number }
  | { type: "split"; value: number }
  | { type: "moveSplit"; delta: number }
  | { type: "toggleAlignment"; epoch: number };

export function reduceViewState(state: ViewState, action: ViewAction, today: number): ViewState {
  switch (action.type) {
    case "time":
      return normalizeViewState({ ...state, time: action.value }, today);
    case "toggleEpoch":
      return normalizeViewState(
        {
          ...state,
          enabled: state.enabled.includes(action.id)
            ? state.enabled.filter((id) => id !== action.id)
            : [...state.enabled, action.id],
        },
        today,
      );
    case "mode":
      return { ...state, mode: action.value };
    case "opacity":
      return { ...state, opacity: bounded(action.value, 0, 100, 75) };
    case "split":
      return { ...state, split: bounded(action.value, 0, 100, 50) };
    case "moveSplit":
      return { ...state, split: bounded(state.split + action.delta, 0, 100, 50) };
    case "toggleAlignment":
      return { ...state, bearing: nextBearing(state.bearing, action.epoch) };
  }
}

export function serializeViewState(state: ViewState, camera: CameraView, year: EpochId): string {
  return new URLSearchParams({
    lon: camera.center[0].toFixed(6),
    lat: camera.center[1].toFixed(6),
    z: camera.zoom.toFixed(2),
    year,
    layers: state.enabled.join(","),
    mode: state.mode,
    time: String(state.time),
    opacity: String(state.opacity),
    split: String(state.split),
    bearing: String(camera.bearing),
  }).toString();
}

export function dateLabel(date: number, today: number): string {
  return date === today ? "Actuel" : getDateLabel(date);
}
function getDateLabel(date: number): string {
  const id = String(date);
  return isEpochId(id) ? getEpoch(id).label : id;
}
