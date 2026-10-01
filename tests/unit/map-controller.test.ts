import type { LayerSpecification, SourceSpecification } from "maplibre-gl";
import { beforeEach, expect, test, vi } from "vitest";

import { parseViewState } from "../../src/view/state";
const fake = vi.hoisted(() => {
  const maps: FakeMap[] = [];
  let failAt = 0;
  class FakeMap {
    handlers = new Map<string, Set<(event: never) => void>>();
    sources: Record<string, SourceSpecification> = {};
    layers: LayerSpecification[] = [];
    removed = false;
    zoom = 14;
    bearing = 0;
    styleChanges = 0;
    additions = 0;
    touchZoomRotate = { disableRotation: () => {} };
    keyboard = { disableRotation: () => {} };
    constructor() {
      if (failAt === maps.length + 1) throw new Error("WebGL");
      maps.push(this);
    }
    on(name: string, fn: (event: never) => void) {
      if (!this.handlers.has(name)) this.handlers.set(name, new Set());
      this.handlers.get(name)!.add(fn);
    }
    off(name: string, fn: (event: never) => void) {
      this.handlers.get(name)?.delete(fn);
    }
    emit(name: string, event: unknown = {}) {
      this.handlers.get(name)?.forEach((fn) => fn(event as never));
    }
    getCenter() {
      return { lng: 1.442, lat: 43.602 };
    }
    getZoom() {
      return this.zoom;
    }
    getBearing() {
      return this.bearing;
    }
    jumpTo(options: { zoom: number; bearing: number }) {
      this.zoom = options.zoom;
      this.bearing = options.bearing;
    }
    easeTo(options: { bearing: number }) {
      this.bearing = options.bearing;
      this.emit("move");
    }
    getStyle() {
      return { sources: this.sources, layers: this.layers };
    }
    getSource(id: string) {
      return this.sources[id];
    }
    isSourceLoaded() {
      return true;
    }
    getLayer(id: string) {
      return this.layers.find((layer) => layer.id === id);
    }
    addSource(id: string, source: SourceSpecification) {
      this.sources[id] = source;
      this.additions++;
    }
    removeSource(id: string) {
      delete this.sources[id];
    }
    removeLayer(id: string) {
      this.layers = this.layers.filter((layer) => layer.id !== id);
    }
    addLayer(layer: LayerSpecification, before?: string) {
      const index = this.layers.findIndex((item) => item.id === before);
      this.layers.splice(index < 0 ? this.layers.length : index, 0, layer);
    }
    getPaintProperty(id: string) {
      const layer = this.getLayer(id);
      return layer?.type === "raster" ? layer.paint?.["raster-opacity"] : undefined;
    }
    setPaintProperty(id: string, _name: string, value: number) {
      const layer = this.getLayer(id);
      if (layer?.type === "raster") layer.paint = { ...layer.paint, "raster-opacity": value };
    }
    setStyle() {
      this.styleChanges++;
      this.sources = {};
      this.layers = [];
    }
    fitBounds() {}
    addControl() {}
    resize() {}
    remove() {
      this.removed = true;
    }
  }
  return {
    maps,
    FakeMap,
    setFailure: (index: number) => {
      failAt = index;
    },
  };
});
vi.mock("maplibre-gl", () => ({ Map: fake.FakeMap, ScaleControl: vi.fn() }));
import { MapController } from "../../src/map/controller";
beforeEach(() => {
  fake.maps.length = 0;
  fake.setFailure(0);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
function mounted() {
  const controller = new MapController({
    initial: parseViewState("#year=1250", 2026),
    theme: "light",
    assets: { baseUrl: "/", origin: "https://example.test" },
    opacities: { "1250": 1 },
  });
  controller.mount({} as HTMLDivElement, {} as HTMLDivElement);
  return controller;
}
function loaded() {
  const controller = mounted();
  fake.maps.forEach((map) => map.emit("style.load"));
  fake.maps[1].emit("idle");
  return controller;
}
test("partial initialization is cleaned up and retry can mount both maps", () => {
  fake.setFailure(2);
  const controller = mounted();
  expect(fake.maps[0].removed).toBe(true);
  expect(controller.locationMaps.current).toEqual([]);
  expect(controller.loading.getSnapshot().phase).toBe("error");
  fake.setFailure(0);
  controller.retry();
  expect(controller.locationMaps.current).toHaveLength(2);
  controller.unmount();
  expect(fake.maps.every((map) => map.removed)).toBe(true);
});
test("source reconciliation preserves renderers and painter order, opacity and movements do not refetch images", () => {
  const controller = loaded();
  const historic = fake.maps[1];
  expect(Object.keys(historic.sources)).toEqual(["history-1250"]);
  controller.setHistorical({ "1250": 1, "1550": 0.4 }, true);
  expect(historic.layers.map((layer) => layer.id)).toEqual(["history-1250", "history-1550"]);
  const count = historic.additions;
  controller.setHistorical({ "1250": 1, "1550": 0.8 }, true);
  controller.setBearing(53);
  expect(historic.additions).toBe(count);
  expect(historic.bearing).toBe(53);
  controller.setHistorical({ "1680": 1 }, true);
  expect(Object.keys(historic.sources)).toEqual(["overview-1680"]);
  fake.maps[0].zoom = 16;
  fake.maps[0].emit("move");
  expect(Object.keys(historic.sources)).toEqual(["history-1680"]);
  controller.unmount();
  expect(fake.maps.every((map) => map.removed)).toBe(true);
  expect([...historic.handlers.values()].every((set) => set.size === 0)).toBe(true);
});
test("retry replaces only the failed historical source and idle cannot conceal its error", () => {
  const controller = loaded();
  const historic = fake.maps[1];
  historic.emit("error", { sourceId: "history-1250", error: { status: 503 } });
  historic.emit("idle");
  expect(controller.loading.getSnapshot().phase).toBe("error");
  const count = historic.additions;
  controller.retry();
  expect(historic.additions).toBe(count + 1);
  expect(fake.maps).toHaveLength(2);
  expect(controller.getCamera().center).toEqual([1.442, 43.602]);
  historic.emit("sourcedata", {
    sourceId: "history-1250",
    isSourceLoaded: true,
    sourceDataType: "content",
  });
  expect(controller.loading.getSnapshot().phase).toBe("ready");
  controller.setTheme("dark");
  expect(controller.loading.getSnapshot().phase).toBe("loading");
  expect(fake.maps[0].styleChanges).toBe(1);
  fake.maps[0].emit("style.load");
  expect(controller.loading.getSnapshot().phase).toBe("ready");
  controller.unmount();
});

test("lost contexts block ready status and defer theme changes until restoration", () => {
  const controller = loaded();
  const modern = fake.maps[0];
  modern.emit("webglcontextlost");
  modern.emit("idle");
  controller.setTheme("dark");
  expect(modern.styleChanges).toBe(0);
  expect(controller.loading.getSnapshot().phase).toBe("unavailable");
  modern.emit("webglcontextrestored");
  expect(modern.styleChanges).toBe(1);
  expect(controller.loading.getSnapshot().phase).toBe("loading");
  modern.emit("style.load");
  expect(controller.loading.getSnapshot().phase).toBe("ready");
  const historic = fake.maps[1];
  historic.emit("webglcontextlost");
  controller.setHistorical({ "1550": 1 }, true);
  expect(Object.keys(historic.sources)).toEqual(["history-1250"]);
  historic.emit("webglcontextrestored");
  expect(controller.loading.getSnapshot().phase).toBe("loading");
  historic.emit("style.load");
  expect(Object.keys(historic.sources)).toEqual(["history-1550"]);
  historic.emit("idle");
  expect(controller.loading.getSnapshot().phase).toBe("ready");
  controller.unmount();
  expect(
    [...modern.handlers.values(), ...historic.handlers.values()].every((set) => set.size === 0),
  ).toBe(true);
});

test("prepared transparent neighbours survive snapped dates and do not block readiness", () => {
  const controller = loaded();
  const historic = fake.maps[1];
  const prepared = ["450", "1250", "1550"] as const;
  controller.setHistorical({ "1250": 1 }, true, prepared);
  expect(Object.keys(historic.sources)).toEqual(["history-1250", "history-450", "history-1550"]);
  expect(historic.getPaintProperty("history-1550")).toBe(0);
  historic.emit("error", { sourceId: "history-1550", error: { status: 503 } });
  expect(controller.loading.getSnapshot().phase).toBe("ready");
  expect(controller.loading.getSnapshot().failures).toEqual([]);
  const source = historic.getSource("history-1550");
  const additions = historic.additions;
  controller.setHistorical({ "1250": 1, "1550": 0.3 }, true, prepared);
  expect(controller.loading.getSnapshot().phase).toBe("error");
  controller.setHistorical({ "1250": 1 }, true, prepared);
  expect(controller.loading.getSnapshot().phase).toBe("ready");
  controller.setHistorical({ "1250": 1, "1550": 0.4 }, true, prepared);
  expect(historic.getSource("history-1550")).toBe(source);
  expect(historic.additions).toBe(additions);
  expect(historic.layers.map((layer) => layer.id)).toEqual([
    "history-450",
    "history-1250",
    "history-1550",
  ]);
  controller.unmount();
});
