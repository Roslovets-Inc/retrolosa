import { describe, expect, it } from "vitest";

import { populationAt } from "../../src/population";

describe("population estimates", () => {
  it("rounds census figures and clamps outside documented years", () => {
    expect(populationAt(450)).toBe(20000);
    expect(populationAt(0)).toBe(20000);
    expect(populationAt(1954)).toBe(269000);
    expect(populationAt(2023)).toBe(515000);
    expect(populationAt(2100)).toBe(515000);
  });
  it("interpolates calendar years and preserves population declines", () => {
    expect(populationAt(1600)).toBe(45000);
    expect(populationAt(1601)).toBe(45000);
    expect(populationAt(1610)).toBe(44000);
    expect(populationAt(1982)).toBeLessThan(populationAt(1975));
    expect(populationAt(1904)).toBe(150000);
  });
});
