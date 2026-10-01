type Loader = (key: string, signal: AbortSignal) => Promise<Blob>;
interface Pending {
  key: string;
  controller: AbortController;
  consumers: number;
  promise: Promise<Blob>;
  resolve: (blob: Blob) => void;
  reject: (error: unknown) => void;
}
interface Limits {
  concurrency: number;
  maxEntries: number;
  maxBytes: number;
}

/** Shares compressed source images; decoded bitmaps remain owned by each renderer. */
export class SourceTiles {
  private cached = new Map<string, Blob>();
  private bytes = 0;
  private pending = new Map<string, Pending>();
  private queue: Pending[] = [];
  private active = 0;

  constructor(
    private loader: Loader,
    private limits: Limits = { concurrency: 6, maxEntries: 64, maxBytes: 8 * 1024 * 1024 },
  ) {
    if (Object.values(limits).some((value) => !Number.isSafeInteger(value) || value < 1))
      throw new Error("Source tile limits must be positive integers");
  }

  load(key: string, signal: AbortSignal): Promise<Blob> {
    if (signal.aborted) return Promise.reject(signal.reason);
    const cached = this.cached.get(key);
    if (cached) {
      this.cached.delete(key);
      this.cached.set(key, cached);
      return Promise.resolve(cached);
    }
    let entry = this.pending.get(key);
    if (!entry) {
      let resolve!: Pending["resolve"];
      let reject!: Pending["reject"];
      const promise = new Promise<Blob>((yes, no) => {
        resolve = yes;
        reject = no;
      });
      entry = { key, controller: new AbortController(), consumers: 0, promise, resolve, reject };
      this.pending.set(key, entry);
      this.queue.push(entry);
    }
    const request = entry;
    request.consumers++;
    const result = new Promise<Blob>((resolve, reject) => {
      let settled = false;
      const finish = (error?: unknown, blob?: Blob) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", abort);
        request.consumers--;
        if (blob) resolve(blob);
        else reject(error);
        if (!request.consumers && this.pending.get(key) === request) {
          this.pending.delete(key);
          this.queue = this.queue.filter((item) => item !== request);
          request.controller.abort();
          request.reject(signal.reason);
        }
      };
      const abort = () => finish(signal.reason);
      signal.addEventListener("abort", abort, { once: true });
      request.promise.then(
        (blob) => finish(undefined, blob),
        (error) => finish(error),
      );
    });
    this.pump();
    return result;
  }

  private pump() {
    while (this.active < this.limits.concurrency && this.queue.length) {
      const entry = this.queue.shift()!;
      if (entry.controller.signal.aborted) continue;
      this.active++;
      void this.run(entry);
    }
  }

  private async run(entry: Pending) {
    try {
      const blob = await this.loader(entry.key, entry.controller.signal);
      entry.controller.signal.throwIfAborted();
      this.remember(entry.key, blob);
      entry.resolve(blob);
    } catch (error) {
      entry.reject(error);
    } finally {
      if (this.pending.get(entry.key) === entry) this.pending.delete(entry.key);
      this.active--;
      this.pump();
    }
  }

  private remember(key: string, blob: Blob) {
    if (blob.size > this.limits.maxBytes) return;
    const old = this.cached.get(key);
    if (old) this.bytes -= old.size;
    this.cached.delete(key);
    this.cached.set(key, blob);
    this.bytes += blob.size;
    while (this.cached.size > this.limits.maxEntries || this.bytes > this.limits.maxBytes) {
      const first = this.cached.keys().next().value!;
      this.bytes -= this.cached.get(first)!.size;
      this.cached.delete(first);
    }
  }

  invalidate(key: string, blob: Blob) {
    if (this.cached.get(key) !== blob) return;
    this.cached.delete(key);
    this.bytes -= blob.size;
  }
}

export const sourceTiles = new SourceTiles(async (url, signal) => {
  const response = await fetch(url, { signal });
  if (!response.ok)
    throw Object.assign(new Error(`IGN state-major tile: ${response.status}`), {
      status: response.status,
    });
  return response.blob();
});
