import type { TileCoordinates, TileRequest, TileResponse } from "./messages";

export interface TileWorker {
  onmessage: ((event: MessageEvent<TileResponse>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent) => void) | null;
  postMessage(message: TileRequest): void;
  terminate(): void;
}
interface PendingTile {
  resolve: (data: ArrayBuffer) => void;
  reject: (error: unknown) => void;
  unsubscribe: () => void;
}

/** Lazily starts one worker and owns every outstanding request and abort listener. */
export class TileWorkerClient {
  private worker?: TileWorker;
  private sequence = 0;
  private pending = new Map<number, PendingTile>();

  constructor(private createWorker: () => TileWorker) {}

  private start() {
    if (this.worker) return this.worker;
    const worker = this.createWorker();
    worker.onmessage = ({ data }) => {
      const pending = this.take(data.id);
      if (!pending) return;
      if (data.type === "result") pending.resolve(data.data);
      else {
        const error = Object.assign(new Error(data.error.message), {
          name: data.error.name,
          ...(data.error.status !== undefined ? { status: data.error.status } : {}),
        });
        pending.reject(error);
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      this.dispose(new Error(event.message || "State-major worker failed"));
    };
    worker.onmessageerror = () => this.dispose(new Error("Invalid state-major worker message"));
    this.worker = worker;
    return worker;
  }

  private take(id: number) {
    const pending = this.pending.get(id);
    if (pending) {
      this.pending.delete(id);
      pending.unsubscribe();
    }
    return pending;
  }

  render(tile: TileCoordinates, signal: AbortSignal): Promise<ArrayBuffer> {
    if (signal.aborted) return Promise.reject(signal.reason);
    return new Promise((resolve, reject) => {
      const worker = this.start();
      const id = ++this.sequence;
      const abort = () => {
        this.take(id)?.reject(signal.reason);
        worker.postMessage({ type: "abort", id });
      };
      signal.addEventListener("abort", abort, { once: true });
      this.pending.set(id, {
        resolve,
        reject,
        unsubscribe: () => signal.removeEventListener("abort", abort),
      });
      try {
        worker.postMessage({ type: "render", id, tile });
      } catch (error) {
        this.dispose(error);
      }
    });
  }

  dispose(error: unknown = new DOMException("State-major renderer closed", "AbortError")) {
    const worker = this.worker;
    this.worker = undefined;
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
    }
    for (const id of [...this.pending.keys()]) this.take(id)?.reject(error);
  }
}
