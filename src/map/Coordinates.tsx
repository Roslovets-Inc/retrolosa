import React, { useSyncExternalStore } from "react";

export function Coordinates({
  subscribe,
  getSnapshot,
}: {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => string;
}) {
  const value = useSyncExternalStore(subscribe, getSnapshot);
  return <span className="coordinates">{value}</span>;
}
