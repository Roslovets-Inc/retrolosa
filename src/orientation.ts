import { EPOCHS, epochAtDate } from "./epochs/catalog";

// Rounded reading orientations from the raster audit in docs/orientation.md.
const MAP_BEARINGS = new Set<number>([0, ...EPOCHS.map((epoch) => epoch.bearing)]);

export function readBearing(value: string | null): number {
  const bearing = Number(value);
  return MAP_BEARINGS.has(bearing) ? bearing : 0;
}

export function mapBearing(year: number): number {
  return epochAtDate(year)?.bearing ?? 0;
}

/** Use the dominant sheet in a crossfade, switching to the emerging one halfway. */
export function visibleEpoch(time: number, dates: readonly number[]): number {
  for (let i = 1; i < dates.length; i++) {
    if (time < dates[i]) return time < (dates[i - 1] + dates[i]) / 2 ? dates[i - 1] : dates[i];
  }
  return dates.at(-1) ?? 0;
}

export function nextBearing(bearing: number, year: number): number {
  return bearing === 0 ? mapBearing(year) : 0;
}
