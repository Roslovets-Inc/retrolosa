import { addProtocol, setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { Protocol } from "pmtiles";

import { disposeStateMajorTiles, loadStateMajorTile } from "../etat-major";

let initialized = false;
export const disposeMapRuntime = disposeStateMajorTiles;
export function initializeMapRuntime() {
  if (initialized) return;
  setWorkerUrl(workerUrl);
  addProtocol("etat-major", loadStateMajorTile);
  const protocol = new Protocol();
  addProtocol("pmtiles", protocol.tile);
  initialized = true;
}
