import type { AddProtocolAction } from "maplibre-gl";

import { TileWorkerClient } from "./etat-major/client";
import { parseTileUrl } from "./etat-major/messages";
export { stateMajorSourcePixel, stateMajorTileOffsets } from "./etat-major/geometry";
const client = new TileWorkerClient(
  () =>
    new Worker(new URL("./etat-major/worker.ts", import.meta.url), {
      type: "module",
      name: "etat-major",
    }),
);
export const loadStateMajorTile: AddProtocolAction = async (params, controller) => ({
  data: await client.render(parseTileUrl(params.url), controller.signal),
});
export function disposeStateMajorTiles() {
  client.dispose();
}
