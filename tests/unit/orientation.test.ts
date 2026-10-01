import { expect, test } from "vitest";

import { mapBearing, nextBearing, readBearing, visibleEpoch } from "../../src/orientation";

test("compass offers only north and the current sheet orientation", () => {
  expect(nextBearing(0, 1777)).toBe(53);
  expect(nextBearing(53, 1777)).toBe(0);
  expect(nextBearing(0, 1631)).toBe(84);
  for (const year of [450, 1250, 1550, 1680, 1830, 1860, 1875, 1904, 1954, 2026]) {
    expect(mapBearing(year)).toBe(0);
    expect(nextBearing(0, year)).toBe(0);
  }
});

test("crossfade uses enabled sheets and selects the emerging sheet at midpoint", () => {
  const dates = [1631, 1680, 1777, 1830, 2026];
  expect(visibleEpoch(1631, dates)).toBe(1631);
  expect(visibleEpoch(1655, dates)).toBe(1631);
  expect(visibleEpoch(1656, dates)).toBe(1680);
  expect(visibleEpoch(1777, dates)).toBe(1777);
  expect(visibleEpoch(2026, dates)).toBe(2026);
  expect(visibleEpoch(1728.5, dates)).toBe(1777);
  expect(visibleEpoch(1704, [1631, 1777, 2026])).toBe(1777);
  expect(visibleEpoch(2000, [2026])).toBe(2026);
});

test("shared orientations accept reading presets and normalize the old 7 degree preset", () => {
  for (const value of ["0", "53", "84"]) expect(readBearing(value)).toBe(Number(value));
  for (const value of [null, "7", "NaN", "Infinity", "-90", "360", "27"])
    expect(readBearing(value)).toBe(0);
});
