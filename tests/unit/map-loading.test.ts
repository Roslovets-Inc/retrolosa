import { expect, test } from "vitest";

import { activeHistoricalStyle } from "../../src/epochs/sources";
import { MapLoading, describeFailure } from "../../src/map/loading";
const modern = { map: "modern", id: "$style", label: "Carte actuelle" } as const;
const historic = { map: "historic", id: "history-1250", label: "XIIIe siècle" } as const;

test("required sources govern readiness and loading can resume after idle", () => {
  const loading = new MapLoading();
  loading.require([modern, historic]);
  loading.success(modern, true);
  expect(loading.getSnapshot().phase).toBe("loading");
  loading.settled(historic, true);
  expect(loading.getSnapshot().phase).toBe("ready");
  loading.loading(historic);
  expect(loading.getSnapshot().phase).toBe("loading");
  loading.require([modern]);
  expect(loading.getSnapshot().phase).toBe("ready");
});
test("idle and another tile's success cannot hide a failed request", () => {
  const loading = new MapLoading();
  loading.require([historic]);
  loading.fail(historic, { status: 503 }, "tile-a");
  loading.settled(historic, true);
  loading.success(historic, true, "tile-b");
  expect(loading.getSnapshot().phase).toBe("error");
  loading.success(historic, true, "tile-a");
  expect(loading.getSnapshot().phase).toBe("ready");
});
test("hidden errors are excluded, dismiss keeps failure state, reset permits retry", () => {
  const loading = new MapLoading();
  loading.require([modern]);
  loading.success(modern, true);
  loading.fail(historic, { status: 404 });
  expect(loading.getSnapshot().failures).toEqual([]);
  loading.require([modern, historic]);
  expect(loading.getSnapshot().failures[0].kind).toBe("missing");
  loading.dismiss();
  expect(loading.getSnapshot().failures).toEqual([]);
  expect(loading.getSnapshot().phase).toBe("error");
  expect(loading.failedResources()).toEqual([historic]);
  loading.reset(historic);
  expect(loading.getSnapshot().phase).toBe("loading");
  loading.success(historic, true);
  expect(loading.getSnapshot().phase).toBe("ready");
  loading.forget(historic);
  expect(loading.getSnapshot().resources).toEqual([{ ...modern, state: "ready" }]);
});
test("snapshot identity is stable until visible state changes", () => {
  const loading = new MapLoading();
  loading.require([modern]);
  const snapshot = loading.getSnapshot();
  loading.require([modern]);
  expect(loading.getSnapshot()).toBe(snapshot);
  expect(describeFailure({ ...modern, id: "$renderer" }, new Error()).kind).toBe("renderer");
});

test("context availability follows required maps and does not erase source failures", () => {
  const loading = new MapLoading();
  loading.require([modern, historic]);
  loading.success(modern, true);
  loading.fail(historic, { status: 503 });
  loading.dismiss();
  loading.contextLost("historic", true);
  loading.settled(historic, true);
  expect(loading.getSnapshot().phase).toBe("unavailable");
  expect(loading.getSnapshot().unavailableMaps).toEqual(["historic"]);
  loading.require([modern]);
  expect(loading.getSnapshot().phase).toBe("ready");
  loading.require([modern, historic]);
  expect(loading.getSnapshot().phase).toBe("unavailable");
  loading.contextLost("historic", false);
  expect(loading.getSnapshot().phase).toBe("error");
  expect(loading.failedResources()).toEqual([historic]);
  loading.clear();
  expect(loading.isContextLost("historic")).toBe(false);
});
test("only contributing sources are installed, using the current zoom variant", () => {
  const assets = { baseUrl: "/", origin: "https://example.test" };
  expect(
    Object.keys(activeHistoricalStyle({ "1250": 1, "1550": 0.4, "1680": 0 }, assets, 14).sources),
  ).toEqual(["history-1250", "history-1550"]);
  expect(Object.keys(activeHistoricalStyle({ "1680": 1 }, assets, 14.99).sources)).toEqual([
    "overview-1680",
  ]);
  expect(Object.keys(activeHistoricalStyle({ "1680": 1 }, assets, 15).sources)).toEqual([
    "history-1680",
  ]);
  expect(activeHistoricalStyle({}, assets, 16).layers).toEqual([]);
});
