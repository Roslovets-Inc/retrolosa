/** Snap pointer input within 20% of either end of an enabled time interval. */
export function snapTimelineYear(value: number, dates: readonly number[]): number {
  if (dates.length === 0) return value;
  const before = dates.filter((date) => date <= value).at(-1) ?? dates[0];
  const after = dates.find((date) => date >= value) ?? dates.at(-1)!;
  const fraction = after === before ? 0 : (value - before) / (after - before);
  return fraction <= 0.2 ? before : fraction >= 0.8 ? after : value;
}
