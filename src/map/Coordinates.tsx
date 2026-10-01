import React, { useSyncExternalStore } from "react";

import type { MapController } from "./controller";

export function Coordinates({ controller }: { controller: MapController }) {
  const value = useSyncExternalStore(controller.subscribeCoordinates, controller.getCoordinates);
  return <span className="coordinates">{value}</span>;
}
