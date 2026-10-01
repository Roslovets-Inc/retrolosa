import type { TileRequest, TileResponse } from "./messages";
import { renderStateMajorTile } from "./render";
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<TileRequest>) => void) | null;
  postMessage(message: TileResponse, transfer?: Transferable[]): void;
};
const jobs = new Map<number, AbortController>();
scope.onmessage = (event: MessageEvent<TileRequest>) => {
  const request = event.data;
  if (request.type === "abort") {
    jobs.get(request.id)?.abort();
    return;
  }
  const controller = new AbortController();
  jobs.set(request.id, controller);
  void renderStateMajorTile(request.tile, controller.signal)
    .then((data) => {
      if (!controller.signal.aborted)
        scope.postMessage({ type: "result", id: request.id, data } satisfies TileResponse, [data]);
    })
    .catch((error: unknown) => {
      if (controller.signal.aborted) return;
      const failure = error instanceof Error ? error : new Error(String(error));
      scope.postMessage({
        type: "error",
        id: request.id,
        error: {
          name: failure.name,
          message: failure.message,
          ...("status" in failure ? { status: Number(failure.status) } : {}),
        },
      } satisfies TileResponse);
    })
    .finally(() => jobs.delete(request.id));
};
