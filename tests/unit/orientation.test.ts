import { expect, test } from "vitest";

import { nextBearing, readBearing } from "../../src/orientation";

test("reading orientations cycle back to north", () => {
  expect([nextBearing(0), nextBearing(7), nextBearing(53), nextBearing(84)]).toEqual([
    7, 53, 84, 0,
  ]);
});

test("shared orientations accept only documented presets", () => {
  for (const value of ["0", "7", "53", "84"]) expect(readBearing(value)).toBe(Number(value));
  for (const value of [null, "NaN", "Infinity", "-90", "360", "27"])
    expect(readBearing(value)).toBe(0);
});
