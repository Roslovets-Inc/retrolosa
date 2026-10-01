// Historical city estimates and commune census counts; see docs/population.md.
const POPULATION = [
  [450, 20000],
  [1200, 20000],
  [1330, 35000],
  [1400, 24000],
  [1550, 50000],
  [1650, 40000],
  [1695, 43000],
  [1790, 64000],
  [1793, 52612],
  [1800, 50171],
  [1821, 52328],
  [1831, 59639],
  [1856, 103144],
  [1861, 113714],
  [1872, 124852],
  [1876, 131642],
  [1901, 149841],
  [1906, 149438],
  [1921, 175434],
  [1936, 213220],
  [1946, 264411],
  [1954, 268863],
  [1962, 323724],
  [1968, 370796],
  [1975, 373796],
  [1982, 347995],
  [1990, 358688],
  [1999, 390350],
  [2007, 439453],
  [2012, 453317],
  [2017, 479553],
  [2023, 514819],
] as const;

export const LAST_POPULATION_YEAR = POPULATION.at(-1)![0];

/** Interpolate by calendar year, independently of enabled map layers. */
export function populationAt(year: number): number {
  const bounded = Math.max(POPULATION[0][0], Math.min(LAST_POPULATION_YEAR, year));
  for (let i = 1; i < POPULATION.length; i++) {
    const [end, next] = POPULATION[i];
    if (bounded <= end) {
      const [start, previous] = POPULATION[i - 1];
      return (
        Math.round((previous + ((bounded - start) / (end - start)) * (next - previous)) / 1000) *
        1000
      );
    }
  }
  return Math.round(POPULATION.at(-1)![1] / 1000) * 1000;
}
