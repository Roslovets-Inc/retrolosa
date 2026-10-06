import { Map as MapRenderer, ScaleControl } from "maplibre-gl";
import type {
  Map as MapInstance,
  MapOptions,
  MapSourceDataEvent,
  MapMouseEvent,
  ErrorEvent,
  FlyToOptions,
} from "maplibre-gl";

import { EPOCHS, getEpoch, isEpochId } from "../epochs/catalog";
import type { EpochId } from "../epochs/catalog";
import { activeHistoricalStyle } from "../epochs/sources";
import type { AssetContext } from "../epochs/sources";
import type { Theme } from "../theme";
import { CITY_LIMITS, CITY_OVERVIEW, MIN_ZOOM, MAX_ZOOM } from "../view/state";
import type { InitialView, CameraView } from "../view/state";
import { MapLoading } from "./loading";
import type { MapKind, MapResource } from "./loading";
import { streetStyle, type StreetColors } from "./streets";
import { modernMapStyle } from "./styles";

type Opacities = Readonly<Partial<Record<EpochId, number>>>;
type ResourceEvent = { sourceId?: string; tile?: { tileID: { key: string }; state: string } };
const root = (map: MapKind): MapResource => ({
  map,
  id: "$style",
  label:
    map === "streets" ? "Rues actuelles" : map === "modern" ? "Carte actuelle" : "Carte historique",
});
function resource(map: MapKind, id: string): MapResource {
  const epoch = id.split("-").at(-1)!;
  return {
    map,
    id,
    label:
      map === "historic" && isEpochId(epoch)
        ? `${getEpoch(epoch).label} · ${getEpoch(epoch).optionLabel}`
        : map === "streets"
          ? "Rues actuelles"
          : "Carte actuelle",
  };
}

export interface ControllerOptions {
  initial: InitialView;
  assets: AssetContext;
  theme: Theme;
  opacities: Opacities;
  prepared?: readonly EpochId[];
}

/** Owns the renderers and their resources; construction itself has no browser effects. */
export class MapController {
  readonly loading = new MapLoading();
  readonly locationMaps: { current: MapInstance[] } = { current: [] };
  private modern?: MapInstance;
  private historic?: MapInstance;
  private streets?: MapInstance;
  private streetContainer?: HTMLDivElement;
  private streetUnsubscribe?: () => void;
  private streetSources = new Set<string>();
  private streetsEnabled = false;
  private streetColors?: StreetColors;
  private streetRendererFailed = false;
  private containers?: { modern: HTMLDivElement; historic: HTMLDivElement };
  private resize?: ResizeObserver;
  private subscriptions: (() => void)[] = [];
  private styleReady = { modern: false, historic: false, streets: false };
  private historicSources = new Set<string>();
  private modernSources = new Set<string>();
  private historicalSignature = "";
  private deferredModernReload = false;
  private opacities: Opacities;
  private prepared: readonly EpochId[];
  private historicVisible = true;
  private theme: Theme;
  private coordinates = "43.59768° N · 1.44954° E";
  private coordinateListeners = new Set<() => void>();

  constructor(private options: ControllerOptions) {
    this.theme = options.theme;
    this.opacities = options.opacities;
    this.prepared = options.prepared ?? [];
  }
  subscribeCoordinates = (listener: () => void) => {
    this.coordinateListeners.add(listener);
    return () => {
      this.coordinateListeners.delete(listener);
    };
  };
  getCoordinates = () => this.coordinates;

  mount(
    modernContainer: HTMLDivElement,
    historicContainer: HTMLDivElement,
    streetContainer?: HTMLDivElement,
  ) {
    this.releaseMaps();
    this.containers = { modern: modernContainer, historic: historicContainer };
    this.streetContainer = streetContainer;
    this.loading.clear();
    this.loading.require([root("modern")]);
    try {
      const options: Omit<MapOptions, "container"> = {
        ...this.options.initial.camera,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        maxBounds: CITY_LIMITS,
        pitchWithRotate: false,
        dragRotate: false,
        touchPitch: false,
        attributionControl: false,
      };
      this.modern = new MapRenderer({
        ...options,
        container: modernContainer,
        style: modernMapStyle(this.theme),
      });
      this.historic = new MapRenderer({
        ...options,
        container: historicContainer,
        interactive: false,
        style: { version: 8, sources: {}, layers: [] },
      });
      this.locationMaps.current = [this.modern, this.historic];
      this.modern.touchZoomRotate.disableRotation();
      this.modern.keyboard.disableRotation();
      this.subscriptions.push(
        this.bind("modern", this.modern),
        this.bind("historic", this.historic),
      );
      const modern = this.modern;
      const sync = () => {
        this.historic?.jumpTo({
          center: modern.getCenter(),
          zoom: modern.getZoom(),
          bearing: modern.getBearing(),
          pitch: 0,
        });
        this.syncStreets();
        this.reconcileHistory();
        this.refreshRequired();
      };
      modern.on("move", sync);
      this.subscriptions.push(() => modern.off("move", sync));
      const mouse = (event: MapMouseEvent) => {
        const text = `${event.lngLat.lat.toFixed(5)}° N · ${event.lngLat.lng.toFixed(5)}° E`;
        if (text === this.coordinates) return;
        this.coordinates = text;
        this.coordinateListeners.forEach((listener) => listener());
      };
      modern.on("mousemove", mouse);
      this.subscriptions.push(() => modern.off("mousemove", mouse));
      modern.addControl(new ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");
      if (!this.options.initial.shared)
        modern.fitBounds(CITY_OVERVIEW, {
          padding: 30,
          duration: 0,
          bearing: this.options.initial.camera.bearing,
        });
      sync();
      this.resize = new ResizeObserver(() => {
        this.modern?.resize();
        this.historic?.resize();
        this.streets?.resize();
        sync();
      });
      this.resize.observe(modernContainer);
      if (this.streetsEnabled) this.createStreets();
    } catch (error) {
      this.releaseMaps();
      this.loading.clear();
      const failed: MapResource = { map: "modern", id: "$renderer", label: "Cartes de Toulouse" };
      this.loading.require([failed]);
      this.loading.fail(failed, error);
    }
  }

  private bind(kind: MapKind, instance: MapInstance) {
    const styleLoaded = () => {
      this.styleReady[kind] = true;
      if (kind === "historic") this.historicalSignature = "";
      this.loading.success(root(kind), true);
      if (kind === "historic") this.reconcileHistory();
      if (kind === "streets") {
        this.syncStreets();
        this.applyStreetColors();
      }
      this.refreshRequired();
      this.refreshSettled(kind, instance);
    };
    const sourceLoading = (event: MapSourceDataEvent) => {
      if (this.isTracked(kind, event.sourceId))
        this.loading.loading(resource(kind, event.sourceId));
    };
    const sourceData = (event: MapSourceDataEvent) => {
      if (!this.isTracked(kind, event.sourceId)) return;
      const target = resource(kind, event.sourceId);
      const tile = event.tile as ResourceEvent["tile"];
      if (tile?.state === "loaded")
        this.loading.success(target, event.isSourceLoaded, tile.tileID.key);
      else if (!tile && event.isSourceLoaded && event.sourceDataType !== "idle")
        this.loading.success(target, true);
      else this.loading.settled(target, event.isSourceLoaded);
    };
    const error = (event: ErrorEvent) => {
      const failure = event.error as { name?: string };
      if (failure.name === "AbortError") return;
      const { sourceId, tile } = event as ErrorEvent & ResourceEvent;
      if (sourceId && !this.isTracked(kind, sourceId)) return;
      this.loading.fail(
        sourceId ? resource(kind, sourceId) : root(kind),
        event.error,
        tile?.tileID.key,
      );
    };
    const idle = () => this.refreshSettled(kind, instance);
    const contextLost = () => {
      this.styleReady[kind] = false;
      this.loading.contextLost(kind, true);
    };
    const contextRestored = () => {
      this.loading.loading(root(kind));
      this.loading.contextLost(kind, false);
      if (kind === "modern" && this.deferredModernReload) {
        this.deferredModernReload = false;
        this.reloadModern();
      }
    };
    instance.on("style.load", styleLoaded);
    instance.on("sourcedataloading", sourceLoading);
    instance.on("sourcedata", sourceData);
    instance.on("error", error);
    instance.on("idle", idle);
    instance.on("webglcontextlost", contextLost);
    instance.on("webglcontextrestored", contextRestored);
    return () => {
      instance.off("style.load", styleLoaded);
      instance.off("sourcedataloading", sourceLoading);
      instance.off("sourcedata", sourceData);
      instance.off("error", error);
      instance.off("idle", idle);
      instance.off("webglcontextlost", contextLost);
      instance.off("webglcontextrestored", contextRestored);
    };
  }
  private sourcesFor(kind: MapKind) {
    return kind === "streets"
      ? this.streetSources
      : kind === "historic"
        ? this.historicSources
        : this.modernSources;
  }
  private isTracked(kind: MapKind, id: string) {
    return this.sourcesFor(kind).has(id);
  }
  private refreshSettled(kind: MapKind, instance: MapInstance) {
    if (!this.styleReady[kind] || this.loading.isContextLost(kind)) return;
    const ids = this.sourcesFor(kind);
    for (const id of ids) {
      if (instance.getSource(id))
        this.loading.settled(resource(kind, id), instance.isSourceLoaded(id));
    }
  }
  private refreshRequired() {
    const required = [root("modern")];
    const modern = this.modern;
    if (modern && this.styleReady.modern) {
      const zoom = modern.getZoom();
      const ids = new Set(
        (modern.getStyle().layers ?? []).flatMap((layer) =>
          "source" in layer &&
          layer.layout?.visibility !== "none" &&
          (layer.minzoom === undefined || zoom >= layer.minzoom) &&
          (layer.maxzoom === undefined || zoom < layer.maxzoom)
            ? [layer.source]
            : [],
        ),
      );
      for (const id of this.modernSources)
        if (!ids.has(id)) this.loading.forget(resource("modern", id));
      this.modernSources = ids;
      required.push(...[...ids].map((id) => resource("modern", id)));
    }
    if (this.historicVisible && Object.values(this.opacities).some((opacity) => opacity! > 0)) {
      required.push(
        root("historic"),
        ...[...this.historicSources]
          .filter((id) => {
            const epoch = id.split("-").at(-1)!;
            return isEpochId(epoch) && (this.opacities[epoch] ?? 0) > 0;
          })
          .map((id) => resource("historic", id)),
      );
    }
    if (this.streetsEnabled) {
      required.push(root("streets"));
      if (this.streetRendererFailed) required.push(resource("streets", "$renderer"));
      required.push(...[...this.streetSources].map((id) => resource("streets", id)));
    }
    this.loading.require(required);
  }

  private syncStreets() {
    if (!this.modern || !this.streets || this.loading.isContextLost("streets")) return;
    this.streets.jumpTo({
      center: this.modern.getCenter(),
      zoom: this.modern.getZoom(),
      bearing: this.modern.getBearing(),
      pitch: 0,
    });
  }
  private createStreets() {
    if (!this.streetContainer || !this.modern || this.streets || !this.streetColors) return;
    this.streetRendererFailed = false;
    this.streetSources = new Set(["streets"]);
    this.loading.reset(root("streets"));
    this.loading.reset(resource("streets", "streets"));
    this.refreshRequired();
    try {
      this.streets = new MapRenderer({
        container: this.streetContainer,
        center: this.modern.getCenter(),
        zoom: this.modern.getZoom(),
        bearing: this.modern.getBearing(),
        interactive: false,
        attributionControl: false,
        style: streetStyle(this.streetColors),
      });
      this.streetUnsubscribe = this.bind("streets", this.streets);
    } catch (error) {
      this.streetRendererFailed = true;
      this.loading.fail(resource("streets", "$renderer"), error);
      this.refreshRequired();
    }
  }
  private releaseStreets() {
    this.streetUnsubscribe?.();
    this.streetUnsubscribe = undefined;
    this.streets?.remove();
    this.streets = undefined;
    this.styleReady.streets = false;
    this.streetSources.forEach((id) => this.loading.forget(resource("streets", id)));
    this.streetSources.clear();
    this.streetRendererFailed = false;
    this.loading.forget(resource("streets", "$renderer"));
    this.loading.forget(root("streets"));
    this.loading.contextLost("streets", false);
  }
  private applyStreetColors() {
    if (!this.streets || !this.styleReady.streets || !this.streetColors) return;
    const { line, text, halo } = this.streetColors;
    this.streets.setPaintProperty("street-line", "line-color", line);
    this.streets.setPaintProperty("street-halo", "line-color", halo);
    this.streets.setPaintProperty("street-name", "text-color", text);
    this.streets.setPaintProperty("street-name", "text-halo-color", halo);
  }
  setStreetColors(colors: StreetColors) {
    this.streetColors = colors;
    if (this.streetsEnabled) this.createStreets();
    this.applyStreetColors();
  }
  setStreets(enabled: boolean) {
    this.streetsEnabled = enabled;
    if (enabled) this.createStreets();
    else this.releaseStreets();
    this.refreshRequired();
  }

  private reconcileHistory(retry = new Set<string>()) {
    const historic = this.historic;
    if (!historic || !this.styleReady.historic) return;
    const zoom = historic.getZoom();
    const variants = EPOCHS.flatMap(({ render }) =>
      render.kind === "tiles" && render.overview ? [zoom >= render.overview.switchZoom] : [],
    );
    const signature = JSON.stringify([this.opacities, this.prepared, variants]);
    if (!retry.size && signature === this.historicalSignature) return;
    this.historicalSignature = signature;
    const desired = activeHistoricalStyle(
      this.opacities,
      this.options.assets,
      historic.getZoom(),
      this.prepared,
    );
    const ids = new Set(Object.keys(desired.sources));
    const removed = new Set(
      [...this.historicSources].filter((id) => !ids.has(id) || retry.has(id)),
    );
    this.historicSources = ids;
    for (const layer of historic.getStyle().layers ?? []) {
      if ("source" in layer && removed.has(layer.source)) historic.removeLayer(layer.id);
    }
    for (const id of removed) {
      if (historic.getSource(id)) historic.removeSource(id);
      this.loading.forget(resource("historic", id));
    }
    for (const [id, spec] of Object.entries(desired.sources)) {
      if (!historic.getSource(id)) {
        this.loading.reset(resource("historic", id));
        historic.addSource(id, spec);
      }
    }
    for (let index = desired.layers.length - 1; index >= 0; index--) {
      const layer = desired.layers[index];
      if (!historic.getLayer(layer.id)) historic.addLayer(layer, desired.layers[index + 1]?.id);
      else if (layer.type === "raster") {
        const value = layer.paint!["raster-opacity"];
        if (historic.getPaintProperty(layer.id, "raster-opacity") !== value)
          historic.setPaintProperty(layer.id, "raster-opacity", value);
      }
    }
    this.refreshRequired();
  }
  setHistorical(opacities: Opacities, visible: boolean, prepared: readonly EpochId[] = []) {
    this.opacities = opacities;
    this.prepared = prepared;
    this.historicVisible = visible;
    this.reconcileHistory();
    this.refreshRequired();
  }
  setTheme(theme: Theme) {
    if (theme === this.theme) return;
    this.theme = theme;
    this.reloadModern();
  }
  private reloadModern() {
    if (!this.modern) return;
    if (this.loading.isContextLost("modern")) {
      this.deferredModernReload = true;
      return;
    }
    this.styleReady.modern = false;
    for (const id of this.modernSources) this.loading.forget(resource("modern", id));
    this.modernSources.clear();
    this.loading.reset(root("modern"));
    this.refreshRequired();
    this.modern.setStyle(modernMapStyle(this.theme), { diff: false });
  }
  retry = () => {
    if (!this.modern || !this.historic) {
      if (this.containers)
        this.mount(this.containers.modern, this.containers.historic, this.streetContainer);
      return;
    }
    const failures = this.loading
      .failedResources()
      .filter((failure) => !this.loading.isContextLost(failure.map));
    if (failures.some((failure) => failure.map === "streets")) {
      this.releaseStreets();
      this.createStreets();
    }
    if (failures.some((failure) => failure.map === "modern")) this.reloadModern();
    if (failures.some((failure) => failure.map === "historic" && failure.id === "$style")) {
      this.styleReady.historic = false;
      this.historicSources.forEach((id) => this.loading.forget(resource("historic", id)));
      this.historicSources.clear();
      this.loading.reset(root("historic"));
      this.historic.setStyle({ version: 8, sources: {}, layers: [] }, { diff: false });
    } else
      this.reconcileHistory(
        new Set(
          failures.filter((failure) => failure.map === "historic").map((failure) => failure.id),
        ),
      );
  };

  getCamera(): CameraView {
    const center = this.modern?.getCenter();
    return this.modern
      ? {
          center: [center!.lng, center!.lat],
          zoom: this.modern.getZoom(),
          bearing: this.modern.getBearing(),
        }
      : this.options.initial.camera;
  }
  setBearing(bearing: number) {
    this.modern?.easeTo({ bearing, duration: 450 });
  }
  flyTo(options: FlyToOptions) {
    this.modern?.flyTo(options);
  }
  zoomIn = () => {
    this.modern?.zoomIn();
  };
  zoomOut = () => {
    this.modern?.zoomOut();
  };
  overview(bearing: number) {
    this.modern?.fitBounds(CITY_OVERVIEW, {
      padding: 30,
      duration: 1000,
      essential: true,
      bearing,
    });
  }

  private releaseMaps() {
    this.releaseStreets();
    this.resize?.disconnect();
    this.resize = undefined;
    this.subscriptions.splice(0).forEach((unsubscribe) => unsubscribe());
    const modern = this.modern;
    const historic = this.historic;
    this.modern = undefined;
    this.historic = undefined;
    this.locationMaps.current = [];
    this.styleReady = { modern: false, historic: false, streets: false };
    this.historicSources.clear();
    this.modernSources.clear();
    this.historicalSignature = "";
    this.deferredModernReload = false;
    try {
      historic?.remove();
    } finally {
      modern?.remove();
    }
  }
  unmount = () => {
    this.containers = undefined;
    this.streetContainer = undefined;
    this.releaseMaps();
    this.loading.clear();
  };
}
