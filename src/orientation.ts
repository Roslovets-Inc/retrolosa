// Rounded reading orientations from the raster audit in docs/orientation.md.
const MAP_BEARINGS = [0, 53, 84] as const;

export function readBearing(value: string | null): number {
  const bearing = Number(value);
  return MAP_BEARINGS.some((preset) => preset === bearing) ? bearing : 0;
}

export function mapBearing(year: number): number {
  return year === 1631 ? 84 : year === 1777 ? 53 : 0;
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
