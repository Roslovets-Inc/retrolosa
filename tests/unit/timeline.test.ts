import { describe, expect, it } from "vitest";

import { snapTimelineYear } from "../../src/timeline";

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
