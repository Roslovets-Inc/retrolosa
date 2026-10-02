/** Snap pointer input within 20% of either end of an enabled time interval. */
export function snapTimelineYear(value: number, dates: readonly number[]): number {
  if (dates.length === 0) return value;
  const before = dates.filter((date) => date <= value).at(-1) ?? dates[0];
  const after = dates.find((date) => date >= value) ?? dates.at(-1)!;
  const fraction = after === before ? 0 : (value - before) / (after - before);
  return fraction <= 0.2 ? before : fraction >= 0.8 ? after : value;
}

/** Evenly space historical dates; reserve extra room for the present label. */
export function timelineStops(dates: readonly number[]): number[] {
  const stops = [0];
  for (let i = 1; i < dates.length; i++)
    stops.push(stops[i - 1] + (i === dates.length - 1 ? 90 : 60));
  const total = stops.at(-1) || 1;
  return stops.map((stop) => stop / total);
}

export function timelinePosition(year: number, dates: readonly number[]): number {
  const stops = timelineStops(dates);
  for (let i = 1; i < dates.length; i++) {
    if (year <= dates[i]) {
      const fraction = Math.max(0, (year - dates[i - 1]) / (dates[i] - dates[i - 1]));
      return stops[i - 1] + fraction * (stops[i] - stops[i - 1]);
    }
  }
  return dates.length > 1 ? 1 : 0;
}

export function timelineYear(position: number, dates: readonly number[]): number {
  const stops = timelineStops(dates);
  const value = Math.max(0, Math.min(1, position));
  for (let i = 1; i < dates.length; i++) {
    if (value <= stops[i]) {
      const fraction = (value - stops[i - 1]) / (stops[i] - stops[i - 1]);
      return dates[i - 1] + fraction * (dates[i] - dates[i - 1]);
    }
  }
  return dates.at(-1) ?? 0;
}
