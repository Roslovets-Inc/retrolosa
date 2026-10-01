// Rounded reading orientations from the raster audit in docs/orientation.md.
export const MAP_BEARINGS = [0, 7, 53, 84] as const;

export function readBearing(value: string | null): number {
  const bearing = Number(value);
  return MAP_BEARINGS.some((preset) => preset === bearing) ? bearing : 0;
}

export function nextBearing(bearing: number): number {
  const index = MAP_BEARINGS.findIndex((preset) => preset === bearing);
  return MAP_BEARINGS[(index + 1) % MAP_BEARINGS.length];
}
