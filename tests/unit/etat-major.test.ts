import { expect, test } from "vitest";

import report from "../../data/etat-major-validation.json";
import { stateMajorSourcePixel, stateMajorTileOffsets } from "../../src/etat-major";
import alignment from "../../src/etat-major-alignment.json";

const world = (pixel: number[]) =>
  pixel.map(
    (value, axis) => alignment.referenceOriginTiles[axis] * 256 + value * alignment.annotationScale,
  );

test("sampling includes every bilinear neighbour across warped tile edges", () => {
  for (const [z, x, y] of [
    [6, 32, 23],
    [10, 516, 374],
    [15, 16515, 11965],
    [15, 16517, 11967],
  ]) {
    const pieces = stateMajorTileOffsets(z, x, y);
    for (const px of [0, 128, 255])
      for (const py of [0, 128, 255]) {
        const [sx, sy] = stateMajorSourcePixel(z, x * 256 + px + 0.5, y * 256 + py + 0.5);
        for (const dx of [0, 1])
          for (const dy of [0, 1])
            expect(pieces).toContainEqual({
              x: Math.floor((Math.floor(sx - 0.5) + dx) / 256),
              y: Math.floor((Math.floor(sy - 0.5) + dy) / 256),
            });
      }
  }
});

test("dense street inverse follows anchors at every zoom and does not fold", () => {
  const fit = alignment.points.filter((p) => p.role === "fit");
  expect(fit).toHaveLength(30);
  for (const point of fit) {
    const expected = world(point.old),
      reference = world(point.ref);
    for (const z of [6, 10, 15]) {
      const scale = 2 ** (z - 15),
        actual = stateMajorSourcePixel(z, reference[0] * scale, reference[1] * scale);
      expect(
        Math.hypot(actual[0] / scale - expected[0], actual[1] / scale - expected[1]),
      ).toBeLessThan(2);
    }
  }
  for (let y = 4; y < alignment.warp.height; y += 24)
    for (let x = 4; x < alignment.warp.width; x += 24) {
      const [wx, wy] = world([x, y]);
      const p = stateMajorSourcePixel(15, wx, wy),
        dx = stateMajorSourcePixel(15, wx + 0.1, wy),
        dy = stateMajorSourcePixel(15, wx, wy + 0.1);
      expect(
        ((dx[0] - p[0]) * (dy[1] - p[1]) - (dx[1] - p[1]) * (dy[0] - p[0])) / 0.01,
      ).toBeGreaterThan(0.3);
    }
});

test("browser inverse reproduces withheld measurements and improves their mean", () => {
  const checks = alignment.points.filter((p) => p.role === "check");
  expect(checks).toHaveLength(15);
  const metresPerPixel = (40075016.6856 / (2 ** 15 * 256)) * Math.cos((43.6 * Math.PI) / 180);
  for (const point of checks) {
    const target = world(point.old);
    let [x, y] = world(point.ref);
    // Solve the actual browser inverse for each observed source landmark.
    for (let iteration = 0; iteration < 10; iteration++) {
      const p = stateMajorSourcePixel(15, x, y),
        dx = stateMajorSourcePixel(15, x + 0.1, y),
        dy = stateMajorSourcePixel(15, x, y + 0.1);
      const a = (dx[0] - p[0]) * 10,
        b = (dy[0] - p[0]) * 10,
        c = (dx[1] - p[1]) * 10,
        d = (dy[1] - p[1]) * 10;
      const ex = p[0] - target[0],
        ey = p[1] - target[1];
      x -= (d * ex - b * ey) / (a * d - b * c);
      y -= (-c * ex + a * ey) / (a * d - b * c);
    }
    const reference = world(point.ref),
      error = Math.hypot(x - reference[0], y - reference[1]) * metresPerPixel;
    const measured = report.independentChecks.find((p) => p.name === point.name)!;
    expect(Math.abs(error - measured.afterMetres)).toBeLessThan(0.15);
  }
  expect(report.independentChecks.reduce((sum, p) => sum + p.afterMetres, 0)).toBeLessThan(
    report.independentChecks.reduce((sum, p) => sum + p.beforeMetres, 0),
  );
});
