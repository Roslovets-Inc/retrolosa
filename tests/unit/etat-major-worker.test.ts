import { expect, test, vi } from "vitest";

import { TileWorkerClient } from "../../src/etat-major/client";
import type { TileWorker } from "../../src/etat-major/client";
import { parseTileUrl } from "../../src/etat-major/messages";
import type { TileRequest, TileResponse } from "../../src/etat-major/messages";
class FakeWorker implements TileWorker {
  onmessage: TileWorker["onmessage"] = null;
  onerror: TileWorker["onerror"] = null;
  onmessageerror: TileWorker["onmessageerror"] = null;
  messages: TileRequest[] = [];
  terminated = false;
  postMessage(message: TileRequest) {
    this.messages.push(message);
  }
  terminate() {
    this.terminated = true;
  }
  reply(data: TileResponse) {
    this.onmessage?.({ data } as MessageEvent<TileResponse>);
  }
}
const tile = { z: 15, x: 16516, y: 11966 };
function setup() {
  const workers: FakeWorker[] = [];
  const factory = vi.fn(() => {
    const worker = new FakeWorker();
    workers.push(worker);
    return worker;
  });
  return { client: new TileWorkerClient(factory), workers, factory };
}
test("worker creation is lazy and overlapping replies reach the right caller", async () => {
  const { client, workers, factory } = setup();
  expect(factory).not.toHaveBeenCalled();
  const a = client.render(tile, new AbortController().signal);
  const b = client.render({ ...tile, x: tile.x + 1 }, new AbortController().signal);
  expect(factory).toHaveBeenCalledTimes(1);
  const first = new ArrayBuffer(4),
    second = new ArrayBuffer(8);
  workers[0].reply({ type: "result", id: 2, data: second });
  workers[0].reply({ type: "result", id: 1, data: first });
  expect(await a).toBe(first);
  expect(await b).toBe(second);
  client.dispose();
  expect(workers[0].terminated).toBe(true);
});
test("aborted requests reject immediately and late results are ignored", async () => {
  const { client, workers, factory } = setup();
  const pre = new AbortController();
  pre.abort();
  await expect(client.render(tile, pre.signal)).rejects.toMatchObject({ name: "AbortError" });
  expect(factory).not.toHaveBeenCalled();
  const signal = new AbortController();
  const result = client.render(tile, signal.signal);
  const rejected = expect(result).rejects.toMatchObject({ name: "AbortError" });
  signal.abort();
  await rejected;
  expect(workers[0].messages.at(-1)).toEqual({ type: "abort", id: 1 });
  workers[0].reply({ type: "result", id: 1, data: new ArrayBuffer(4) });
  client.dispose();
});
test("a failed tile preserves status and does not invalidate another job", async () => {
  const { client, workers } = setup();
  const a = client.render(tile, new AbortController().signal);
  const rejected = expect(a).rejects.toMatchObject({ message: "Unavailable", status: 503 });
  const b = client.render(tile, new AbortController().signal);
  workers[0].reply({
    type: "error",
    id: 1,
    error: { name: "Error", message: "Unavailable", status: 503 },
  });
  await rejected;
  const data = new ArrayBuffer(4);
  workers[0].reply({ type: "result", id: 2, data });
  expect(await b).toBe(data);
  client.dispose();
});
test("dispose removes listeners, rejects jobs and allows a fresh worker", async () => {
  const { client, workers } = setup();
  const controller = new AbortController();
  const remove = vi.spyOn(controller.signal, "removeEventListener");
  const result = client.render(tile, controller.signal);
  const rejected = expect(result).rejects.toMatchObject({ name: "AbortError" });
  client.dispose();
  await rejected;
  expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  expect(workers[0].onmessage).toBeNull();
  controller.abort();
  expect(workers[0].messages).toHaveLength(1);
  const next = client.render(tile, new AbortController().signal);
  expect(workers).toHaveLength(2);
  const data = new ArrayBuffer(4);
  workers[1].reply({ type: "result", id: 2, data });
  expect(await next).toBe(data);
  client.dispose();
});
test("worker failures reject every request and retry starts a new worker", async () => {
  const { client, workers } = setup();
  const result = client.render(tile, new AbortController().signal);
  const rejected = expect(result).rejects.toThrow("Crashed");
  const preventDefault = vi.fn();
  workers[0].onerror?.({ message: "Crashed", preventDefault } as unknown as ErrorEvent);
  await rejected;
  expect(preventDefault).toHaveBeenCalled();
  expect(workers[0].terminated).toBe(true);
  const next = client.render(tile, new AbortController().signal);
  const nextRejected = expect(next).rejects.toThrow("Invalid state-major worker message");
  workers[1].onmessageerror?.({} as MessageEvent);
  await nextRejected;
});
test("tile URLs are validated before dispatch", () => {
  expect(parseTileUrl("etat-major://15/16516/11966")).toEqual(tile);
  for (const url of [
    "invalid",
    "etat-major://5/1/1",
    "etat-major://16/1/1",
    "etat-major://6/64/23",
    "etat-major://6/32/64",
  ])
    expect(() => parseTileUrl(url)).toThrow();
});
