import { expect, test, vi } from "vitest";

import { SourceTiles } from "../../src/etat-major/source-tiles";

function fixture(concurrency = 2, maxEntries = 2, maxBytes = 8) {
  const jobs: {
    key: string;
    signal: AbortSignal;
    resolve: (value: Blob) => void;
    reject: (error: unknown) => void;
  }[] = [];
  const loader = vi.fn(
    (key: string, signal: AbortSignal) =>
      new Promise<Blob>((resolve, reject) => {
        jobs.push({ key, signal, resolve, reject });
        signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      }),
  );
  return { jobs, loader, cache: new SourceTiles(loader, { concurrency, maxEntries, maxBytes }) };
}
const signal = () => new AbortController().signal;

test("concurrent consumers share one fetch and cancellation preserves the surviving consumer", async () => {
  const { cache, jobs, loader } = fixture();
  const controller = new AbortController();
  const a = cache.load("a", controller.signal);
  const b = cache.load("a", signal());
  const rejected = expect(a).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  await rejected;
  expect(loader).toHaveBeenCalledTimes(1);
  expect(jobs[0].signal.aborted).toBe(false);
  const blob = new Blob(["tile"]);
  jobs[0].resolve(blob);
  expect(await b).toBe(blob);
  expect(await cache.load("a", signal())).toBe(blob);
  expect(loader).toHaveBeenCalledTimes(1);
});

test("parallelism is bounded and cancelled queued jobs never reach the network", async () => {
  const { cache, jobs, loader } = fixture(1);
  const a = cache.load("a", signal());
  const controller = new AbortController();
  const b = cache.load("b", controller.signal);
  const c = cache.load("c", signal());
  expect(jobs.map((job) => job.key)).toEqual(["a"]);
  const rejected = expect(b).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  await rejected;
  jobs[0].resolve(new Blob(["a"]));
  await a;
  expect(jobs.map((job) => job.key)).toEqual(["a", "c"]);
  jobs[1].resolve(new Blob(["c"]));
  await c;
  expect(loader).toHaveBeenCalledTimes(2);
});

test("the last consumer aborts the fetch and a fresh request can retry the same key", async () => {
  const { cache, jobs } = fixture();
  const controller = new AbortController();
  const a = cache.load("a", controller.signal);
  const rejected = expect(a).rejects.toMatchObject({ name: "AbortError" });
  controller.abort();
  await rejected;
  expect(jobs[0].signal.aborted).toBe(true);
  const b = cache.load("a", signal());
  expect(jobs).toHaveLength(2);
  jobs[1].resolve(new Blob(["new"]));
  expect(await (await b).text()).toBe("new");
});

test("failed responses are not cached and retain their HTTP status", async () => {
  const { cache, jobs } = fixture();
  const a = cache.load("a", signal());
  const rejected = expect(a).rejects.toMatchObject({ status: 503 });
  jobs[0].reject(Object.assign(new Error("Unavailable"), { status: 503 }));
  await rejected;
  const b = cache.load("a", signal());
  jobs[1].resolve(new Blob(["ok"]));
  await b;
  expect(jobs).toHaveLength(2);
});

test("LRU eviction respects entry and byte budgets; oversized images are not cached", async () => {
  const { cache, jobs } = fixture(2, 2, 5);
  const load = async (key: string, body: string) => {
    const result = cache.load(key, signal());
    jobs.at(-1)!.resolve(new Blob([body]));
    await result;
  };
  await load("a", "aa");
  await load("b", "bb");
  await cache.load("a", signal());
  await load("c", "cc"); // b is the least recently used entry.
  await cache.load("a", signal());
  await load("b", "bbb"); // Byte budget evicts c.
  await load("c", "cccccc"); // Too large to retain.
  await load("c", "cccccc");
  expect(jobs.map((job) => job.key)).toEqual(["a", "b", "c", "b", "c", "c"]);
});

test("already aborted consumers never start requests", async () => {
  const { cache, loader } = fixture();
  const controller = new AbortController();
  controller.abort();
  await expect(cache.load("a", controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  expect(loader).not.toHaveBeenCalled();
});

test("invalid image data can be evicted without removing a newer cached response", async () => {
  const { cache, jobs } = fixture();
  const first = cache.load("a", signal());
  const corrupt = new Blob(["bad"]);
  jobs[0].resolve(corrupt);
  await first;
  cache.invalidate("a", corrupt);
  const retry = cache.load("a", signal());
  const valid = new Blob(["ok"]);
  jobs[1].resolve(valid);
  await retry;
  cache.invalidate("a", corrupt);
  expect(await cache.load("a", signal())).toBe(valid);
  expect(jobs).toHaveLength(2);
});
