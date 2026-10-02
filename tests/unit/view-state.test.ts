import { expect, test } from "vitest";

import { EPOCH_IDS } from "../../src/epochs/catalog";
import { derivePresentation, resolveTimeline } from "../../src/view/presentation";
import {
  dateLabel,
  normalizeViewState,
  parseViewState,
  reduceViewState,
  serializeViewState,
} from "../../src/view/state";
import type { Mode, ViewState } from "../../src/view/state";

const TODAY = 2026;
const idle = { compareHeld: false, peek: false };
const initial = (hash = "") => parseViewState(hash, TODAY);
const state = (patch: Partial<ViewState> = {}): ViewState => ({ ...initial().state, ...patch });

test("default state and camera are deterministic without browser globals", () => {
  expect(initial()).toEqual({
    shared: false,
    camera: { center: [1.442, 43.602], zoom: 14, bearing: 0 },
    state: {
      enabled: EPOCH_IDS,
      time: 1250,
      mode: "overlay",
      opacity: 75,
      split: 50,
      bearing: 0,
    },
  });
  expect(initial("year=1875").state.time).toBe(1875);
  expect(initial("#year=invalid&time=NaN").state.time).toBe(1250);
});

test.each([
  ["modern", "overlay", 0],
  ["historic", "overlay", 100],
  ["time", "overlay", 100],
  ["split", "split", 100],
  ["loupe", "loupe", 100],
  ["overlay", "overlay", 75],
  ["invalid", "overlay", 75],
])("old and current %s links preserve their initial appearance", (raw, mode, opacity) => {
  expect(initial(`#mode=${raw}`).state).toMatchObject({ mode, opacity });
});

test.each(["", "-1", "101", "NaN", "Infinity"])("invalid percentages %s use defaults", (value) => {
  expect(initial(`#opacity=${value}&split=${value}`).state).toMatchObject({
    opacity: 75,
    split: 50,
  });
});
test.each([0, 38.5, 100])("valid percentages %s are retained", (value) => {
  expect(initial(`#opacity=${value}&split=${value}`).state).toMatchObject({
    opacity: value,
    split: value,
  });
});
test("legacy mode takes precedence over its opacity parameter", () => {
  expect(initial("#mode=modern&opacity=99").state.opacity).toBe(0);
  expect(initial("#mode=historic&opacity=1").state.opacity).toBe(100);
});

test("layers are deduplicated, filtered and ordered; empty selection means modernity", () => {
  expect(initial("#layers=1954,invalid,1631,1631&time=450").state).toMatchObject({
    enabled: ["1631", "1954"],
    time: 1631,
  });
  expect(initial("#layers=").state).toMatchObject({ enabled: [], time: TODAY });
  expect(initial("#layers=invalid").state.enabled).toEqual([]);
});

test.each(["0", "-1", "2027", "Infinity", "NaN"])(
  "invalid time %s falls back to the shared year",
  (value) => {
    expect(initial(`#year=1875&time=${value}`).state.time).toBe(1875);
  },
);
test("time is bounded by enabled epochs and supports continuous interpolation", () => {
  expect(initial("#time=1728.5").state.time).toBe(1728.5);
  expect(initial(`#time=${TODAY}`).state.time).toBe(TODAY);
  expect(initial("#time=450").state.time).toBe(450);
});

test("shared camera validates coverage and clamps zoom independently of orientation", () => {
  expect(initial("#lon=1.44954&lat=43.597678&z=30&bearing=53")).toMatchObject({
    shared: true,
    camera: { center: [1.44954, 43.597678], zoom: 19, bearing: 53 },
    state: { bearing: 53 },
  });
  expect(initial("#lon=1.18&lat=43.38&z=-10").camera.zoom).toBe(10.5);
  expect(initial("#lon=1.65&lat=43.8&z=11")).toMatchObject({
    shared: true,
    camera: { center: [1.65, 43.8], zoom: 11 },
  });
  for (const hash of [
    "lon=1.442&lat=43.602",
    "lon=1.442&lat=43.602&z=",
    "lon=1.442&lat=43.602&z=NaN",
    "lon=Infinity&lat=43.602&z=14",
    "lon=2&lat=43.602&z=14",
    "lon=1.442&lat=44&z=14",
    "lon=1.442&lat=&z=14",
  ])
    expect(initial(hash).shared).toBe(false);
  expect(initial("#bearing=84").camera.bearing).toBe(84);
});

test("normalization clamps nonfinite values without mutating the caller", () => {
  const input = state({
    enabled: ["1954", "1631", "1631"],
    time: NaN,
    opacity: Infinity,
    split: NaN,
  });
  expect(normalizeViewState(input, TODAY)).toMatchObject({
    enabled: ["1631", "1954"],
    time: 1631,
    opacity: 75,
    split: 50,
  });
  expect(input.enabled).toEqual(["1954", "1631", "1631"]);
  expect(normalizeViewState(state({ time: 9999, opacity: -1, split: 101 }), TODAY)).toMatchObject({
    time: TODAY,
    opacity: 0,
    split: 100,
  });
});

test("epoch transitions atomically update selection and time", () => {
  const original = state({ enabled: ["1631", "1777"], time: 1631 });
  const next = reduceViewState(original, { type: "toggleEpoch", id: "1631" }, TODAY);
  expect(next).toMatchObject({ enabled: ["1777"], time: 1777 });
  const empty = reduceViewState(next, { type: "toggleEpoch", id: "1777" }, TODAY);
  expect(empty).toMatchObject({ enabled: [], time: TODAY });
  expect(reduceViewState(empty, { type: "toggleEpoch", id: "450" }, TODAY)).toMatchObject({
    enabled: ["450"],
    time: TODAY,
  });
  expect(original).toMatchObject({ enabled: ["1631", "1777"], time: 1631 });
});

test("view actions preserve independent controls and enforce numeric bounds", () => {
  let current = state();
  current = reduceViewState(current, { type: "time", value: 1777 }, TODAY);
  current = reduceViewState(current, { type: "mode", value: "loupe" }, TODAY);
  current = reduceViewState(current, { type: "opacity", value: 42 }, TODAY);
  current = reduceViewState(current, { type: "split", value: 98 }, TODAY);
  current = reduceViewState(current, { type: "moveSplit", delta: 10 }, TODAY);
  current = reduceViewState(current, { type: "toggleAlignment", epoch: 1777 }, TODAY);
  expect(current).toMatchObject({
    time: 1777,
    mode: "loupe",
    opacity: 42,
    split: 100,
    bearing: 53,
  });
  expect(reduceViewState(current, { type: "toggleAlignment", epoch: 1777 }, TODAY).bearing).toBe(0);
});

test.each(["overlay", "split", "loupe"] as Mode[])(
  "%s shared state round-trips through the existing hash format",
  (mode) => {
    const view = state({
      enabled: ["1631", "1777", "1954"],
      time: 1704,
      mode,
      opacity: 42,
      split: 72,
      bearing: 53,
    });
    const camera = { center: [1.4315, 43.599] as [number, number], zoom: 15.6, bearing: 53 };
    const year = resolveTimeline(view, TODAY).year;
    const hash = serializeViewState(view, camera, year);
    expect(hash).toContain("lon=1.431500&lat=43.599000&z=15.60&year=1777");
    expect(initial(hash)).toEqual({ state: view, camera, shared: true });
  },
);

test("empty epoch selection round-trips with modern time", () => {
  const view = state({ enabled: [], time: TODAY });
  const hash = serializeViewState(view, initial().camera, resolveTimeline(view, TODAY).year);
  expect(initial(hash).state).toEqual(view);
});

test.each(EPOCH_IDS)("exact epoch %s renders and credits only its sheet", (id) => {
  const presentation = derivePresentation(state({ time: Number(id) }), idle, TODAY);
  expect(presentation.active).toEqual([id]);
  expect(presentation.creditedPeriods).toEqual([id]);
  expect(presentation.opacities[id]).toBe(1);
  expect(presentation.year).toBe(id);
});

test("prepared neighbours follow enabled epochs and remain bounded around a crossfade", () => {
  expect(resolveTimeline(state({ time: 1550 }), TODAY).prepared).toEqual([
    "1195",
    "1250",
    "1550",
    "1631",
    "1680",
  ]);
  expect(resolveTimeline(state({ time: 1590 }), TODAY).prepared).toEqual([
    "1195",
    "1250",
    "1550",
    "1631",
    "1680",
    "1777",
  ]);
  expect(
    resolveTimeline(state({ enabled: ["1250", "1777", "1954"], time: 1777 }), TODAY).prepared,
  ).toEqual(["1250", "1777", "1954"]);
  expect(resolveTimeline(state({ time: TODAY }), TODAY).prepared).toEqual(["1904", "1954"]);
  expect(resolveTimeline(state({ enabled: [], time: TODAY }), TODAY).prepared).toEqual([]);
});

test("crossfade preserves painter order and switches dominant sheet at midpoint", () => {
  const view = state({ enabled: ["1631", "1777"], time: 1704 });
  const presentation = derivePresentation(view, idle, TODAY);
  expect(presentation).toMatchObject({
    lower: 1631,
    upper: 1777,
    fraction: 0.5,
    year: "1777",
    creditedPeriods: ["1631", "1777"],
    readingBearing: 53,
    timeLabel: "1631 → 1777",
  });
  expect(presentation.opacities).toMatchObject({ "1631": 1, "1777": 0.5, "1680": 0 });
  expect(resolveTimeline({ ...view, time: 1703 }, TODAY).year).toBe("1631");
});

test("historical sheets fade to modernity and disappear from credits at its endpoint", () => {
  const view = state({ enabled: ["1954"], time: 1990 });
  expect(resolveTimeline(view, TODAY).opacities["1954"]).toBe(0.5);
  expect(derivePresentation({ ...view, time: TODAY }, idle, TODAY)).toMatchObject({
    active: [],
    creditedPeriods: [],
    timeLabel: "Actuel",
    year: "1954",
    readingBearing: 0,
  });
});

test("empty selection has a finite timeline and no historical contribution", () => {
  const presentation = derivePresentation(state({ enabled: [], time: TODAY }), idle, TODAY);
  expect(presentation).toMatchObject({
    lower: TODAY,
    upper: TODAY,
    fraction: 0,
    year: "450",
    visibleMode: "modern",
    historicOpacity: 0,
    active: [],
    creditedPeriods: [],
    populationYear: TODAY,
  });
  expect(Object.values(presentation.opacities)).toEqual(EPOCH_IDS.map(() => 0));
});

test("temporary comparison restores persisted controls and does not rotate the camera", () => {
  const view = state({ time: 1777, mode: "split", opacity: 72, bearing: 53 });
  expect(derivePresentation(view, { compareHeld: true, peek: true }, TODAY)).toMatchObject({
    visibleMode: "overlay",
    historicOpacity: 0.2,
    bearing: 53,
    creditedPeriods: ["1777"],
  });
  expect(derivePresentation(view, { compareHeld: false, peek: true }, TODAY)).toMatchObject({
    visibleMode: "modern",
    historicOpacity: 0,
    bearing: 53,
    creditedPeriods: [],
    populationYear: TODAY,
  });
  expect(derivePresentation(view, idle, TODAY)).toMatchObject({
    visibleMode: "split",
    historicOpacity: 0.72,
    bearing: 53,
  });
  expect(derivePresentation({ ...view, opacity: 0 }, idle, TODAY)).toMatchObject({
    historicOpacity: 0,
    readingBearing: 0,
    creditedPeriods: [],
  });
});

test("camera bearing persists across timeline, opacity and epoch-selection changes", () => {
  let view = state({ time: 1631, bearing: 84 });
  for (const time of [1656, 1777, 1904, TODAY]) {
    view = reduceViewState(view, { type: "time", value: time }, TODAY);
    expect(derivePresentation(view, idle, TODAY).bearing).toBe(84);
  }
  view = reduceViewState(view, { type: "opacity", value: 0 }, TODAY);
  view = reduceViewState(view, { type: "toggleEpoch", id: "1631" }, TODAY);
  expect(derivePresentation(view, idle, TODAY)).toMatchObject({ bearing: 84, readingBearing: 0 });
  view = reduceViewState(view, { type: "toggleAlignment", epoch: TODAY }, TODAY);
  expect(view.bearing).toBe(0);
  expect(reduceViewState(view, { type: "toggleAlignment", epoch: TODAY }, TODAY).bearing).toBe(0);
});

test("timeline labels distinguish dated maps and symbolic historical anchors", () => {
  expect(dateLabel(450, TODAY)).toBe("Ve");
  expect(dateLabel(1250, TODAY)).toBe("XIIIe");
  expect(dateLabel(1704, TODAY)).toBe("1704");
  for (const [time, label] of [
    [1550, "1550 · Héritages du parcellaire"],
    [1848, "1848 · État-major"],
    [1875, "1875 · Inondation"],
  ] as const)
    expect(resolveTimeline(state({ time }), TODAY).timeLabel).toBe(label);
});
