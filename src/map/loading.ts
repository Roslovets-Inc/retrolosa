export type MapKind = "modern" | "historic";
export type LoadState = "loading" | "ready" | "error" | "unavailable";
export interface MapResource {
  map: MapKind;
  id: string;
  label: string;
}
export interface MapFailure {
  key: string;
  resource: MapResource;
  kind: "renderer" | "missing" | "service";
  message: string;
}
export interface ResourceState extends MapResource {
  state: LoadState;
}
export interface MapLoadSnapshot {
  phase: LoadState;
  unavailableMaps: readonly MapKind[];
  resources: readonly ResourceState[];
  failures: readonly MapFailure[];
}
interface TrackedResource {
  resource: MapResource;
  loaded: boolean;
  failures: Map<string, MapFailure>;
}
export const resourceKey = (resource: MapResource) => `${resource.map}:${resource.id}`;

export function describeFailure(resource: MapResource, error: unknown, tile?: string): MapFailure {
  const status =
    typeof error === "object" && error !== null && "status" in error ? error.status : undefined;
  const kind = resource.id === "$renderer" ? "renderer" : status === 404 ? "missing" : "service";
  const map = resource.map === "modern" ? "actuelle" : "historique";
  const message =
    kind === "renderer"
      ? "Impossible de démarrer la carte. Vérifiez WebGL et l’accélération matérielle, puis réessayez."
      : `Chargement incomplet de la carte ${map} · ${resource.label}. ${
          kind === "missing"
            ? "Cette image ou cette tuile est absente."
            : "La source est indisponible. Vérifiez la connexion, puis réessayez."
        }`;
  return { key: `${resourceKey(resource)}:${tile ?? "$source"}`, resource, kind, message };
}

/** Tracks required resources; idle alone never turns a failed request into success. */
export class MapLoading {
  private entries = new Map<string, TrackedResource>();
  private required = new Set<string>();
  private dismissed = new Set<string>();
  private lostContexts = new Set<MapKind>();
  private listeners = new Set<() => void>();
  private snapshot: MapLoadSnapshot = {
    phase: "loading",
    unavailableMaps: [],
    resources: [],
    failures: [],
  };
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  getSnapshot = () => this.snapshot;

  private entry(resource: MapResource) {
    const key = resourceKey(resource);
    let entry = this.entries.get(key);
    if (!entry) {
      entry = { resource, loaded: false, failures: new Map() };
      this.entries.set(key, entry);
    }
    return entry;
  }
  private publish() {
    const entries = [...this.required].flatMap((key) => {
      const entry = this.entries.get(key);
      return entry ? [entry] : [];
    });
    const resources: ResourceState[] = entries.map((entry) => ({
      ...entry.resource,
      state: entry.failures.size ? "error" : entry.loaded ? "ready" : "loading",
    }));
    const failures = entries
      .flatMap((entry) => [...entry.failures.values()])
      .filter((failure) => !this.dismissed.has(failure.key));
    const unavailableMaps = (["modern", "historic"] as const).filter(
      (map) => this.lostContexts.has(map) && resources.some((resource) => resource.map === map),
    );
    const phase = unavailableMaps.length
      ? "unavailable"
      : resources.some((resource) => resource.state === "error")
        ? "error"
        : resources.every((resource) => resource.state === "ready")
          ? "ready"
          : "loading";
    const next: MapLoadSnapshot = { phase, unavailableMaps, resources, failures };
    if (JSON.stringify(next) === JSON.stringify(this.snapshot)) return;
    this.snapshot = next;
    this.listeners.forEach((listener) => listener());
  }
  require(resources: readonly MapResource[]) {
    resources.forEach((resource) => this.entry(resource));
    this.required = new Set(resources.map(resourceKey));
    this.publish();
  }
  isContextLost(map: MapKind) {
    return this.lostContexts.has(map);
  }
  contextLost(map: MapKind, lost: boolean) {
    if (lost) this.lostContexts.add(map);
    else this.lostContexts.delete(map);
    this.publish();
  }
  loading(resource: MapResource) {
    this.entry(resource).loaded = false;
    this.publish();
  }
  success(resource: MapResource, loaded: boolean, tile?: string) {
    const entry = this.entry(resource);
    entry.loaded = loaded;
    const key = `${resourceKey(resource)}:${tile ?? "$source"}`;
    entry.failures.delete(key);
    this.dismissed.delete(key);
    this.publish();
  }
  settled(resource: MapResource, loaded: boolean) {
    this.entry(resource).loaded = loaded;
    this.publish();
  }
  fail(resource: MapResource, error: unknown, tile?: string) {
    const failure = describeFailure(resource, error, tile);
    this.entry(resource).failures.set(failure.key, failure);
    this.publish();
  }
  reset(resource: MapResource) {
    const entry = this.entry(resource);
    for (const key of entry.failures.keys()) this.dismissed.delete(key);
    entry.loaded = false;
    entry.failures.clear();
    this.publish();
  }
  forget(resource: MapResource) {
    const key = resourceKey(resource);
    const entry = this.entries.get(key);
    entry?.failures.forEach((failure) => this.dismissed.delete(failure.key));
    this.entries.delete(key);
    this.required.delete(key);
    this.publish();
  }
  dismiss = () => {
    this.snapshot.failures.forEach((failure) => this.dismissed.add(failure.key));
    this.publish();
  };
  failedResources() {
    return [...this.required].flatMap((key) => {
      const entry = this.entries.get(key);
      return entry?.failures.size ? [entry.resource] : [];
    });
  }
  clear() {
    this.lostContexts.clear();
    this.entries.clear();
    this.required.clear();
    this.dismissed.clear();
  }
}
