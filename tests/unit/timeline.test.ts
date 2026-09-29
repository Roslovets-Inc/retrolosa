import { describe, expect, it } from "vitest";

import {
  snapTimelineYear,
  timelinePosition,
  timelineStops,
  timelineYear,
} from "../../src/timeline";

describe("timeline snapping", () => {
  it.each([
    [1680, 1680],
    [1710, 1680],
    [1711, 1711],
    [1755, 1755],
    [1799, 1799],
    [1800, 1830],
    [1830, 1830],
  ])("snaps %i to %i at the 20 percent boundaries", (value, expected) =>
    expect(snapTimelineYear(value, [1680, 1830])).toBe(expected),
  );
  it("uses the local interval for closely spaced epochs", () => {
    expect(snapTimelineYear(1839, [1680, 1830, 1875, 1954])).toBe(1830);
    expect(snapTimelineYear(1840, [1680, 1830, 1875, 1954])).toBe(1840);
    expect(snapTimelineYear(1866, [1680, 1830, 1875, 1954])).toBe(1875);
  });
  it("skips a disabled epoch", () => {
    expect(snapTimelineYear(1875, [1680, 1830, 1954, 2026])).toBe(1875);
  });
  it("handles the current year, an empty selection and values outside the range", () => {
    expect(snapTimelineYear(2025, [1954, 2026])).toBe(2026);
    expect(snapTimelineYear(2026, [2026])).toBe(2026);
    expect(snapTimelineYear(1850, [])).toBe(1850);
    expect(snapTimelineYear(1000, [1680, 1830])).toBe(1680);
    expect(snapTimelineYear(2100, [1680, 1830])).toBe(1830);
  });
});

describe("bounded visual timeline", () => {
  const dates = [1250, 1631, 1680, 1830, 1875, 1954, 2026];
  it("keeps the widest visual gap at most twice the narrowest", () => {
    const stops = timelineStops(dates);
    const gaps = stops.slice(1).map((stop, i) => stop - stops[i]);
    expect(stops[0]).toBe(0);
    expect(stops.at(-1)).toBe(1);
    expect(Math.max(...gaps) / Math.min(...gaps)).toBeCloseTo(2);
  });
  it("maps dates and intermediate years back without changing chronological order", () => {
    for (const year of [...dates, 1400, 1700, 1850, 1900, 2000])
      expect(timelineYear(timelinePosition(year, dates), dates)).toBeCloseTo(year);
    expect(timelinePosition(1000, dates)).toBe(0);
    expect(timelinePosition(2200, dates)).toBe(1);
    expect(timelineYear(-1, dates)).toBe(1250);
    expect(timelineYear(2, dates)).toBe(2026);
  });
  it("handles disabled epochs, a single date and an empty selection", () => {
    expect(
      timelineYear(timelinePosition(1800, [1680, 1954, 2026]), [1680, 1954, 2026]),
    ).toBeCloseTo(1800);
    expect(timelineStops([2026])).toEqual([0]);
    expect(timelinePosition(2026, [2026])).toBe(0);
    expect(timelinePosition(2026, [])).toBe(0);
    expect(timelineYear(0, [2026])).toBe(2026);
    expect(timelineYear(0, [])).toBe(0);
  });
});
