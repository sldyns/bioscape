import assert from "node:assert/strict";
import test from "node:test";
import { createPreparedModelCache } from "../src/scene/preparedModelCache.js";
import { createDetailLoader } from "../src/scene/detailLoader.js";

function harness(t, onPost) {
  const originalWorker = Object.getOwnPropertyDescriptor(globalThis, "Worker");
  const workers = [];
  globalThis.Worker = class {
    requests = [];
    terminated = 0;
    constructor() {
      workers.push(this);
    }
    postMessage(request) {
      onPost?.(request);
      this.requests.push(request);
    }
    terminate() {
      this.terminated++;
    }
    send(data) {
      this.onmessage?.({ data });
    }
    reply(index) {
      const request = this.requests[index];
      assert(request, `Request ${index} must have been dispatched`);
      this.send({
        request: request.request,
        payload: { meshes: [], userData: { id: request.id } },
      });
    }
  };
  const cache = createPreparedModelCache();
  const loader = createDetailLoader({ cache });
  t.after(() => {
    loader.dispose();
    if (originalWorker)
      Object.defineProperty(globalThis, "Worker", originalWorker);
    else delete globalThis.Worker;
  });
  return { loader, cache, workers };
}

test("navigation retires obsolete work without waiting for its worker reply", async (t) => {
  const { loader, workers, cache } = harness(t);
  let current = "first";
  const first = loader.load("first", () => current === "first");
  current = "middle";
  const middle = loader.load("middle", () => current === "middle");
  assert.equal(await first, null);
  assert.equal(workers[0].terminated, 1);
  current = "last";
  const last = loader.load("last", () => current === "last");
  assert.equal(await middle, null);
  assert.equal(workers[1].terminated, 1);
  assert.equal(workers[2].terminated, 0);
  workers[2].reply(0);
  assert.equal((await last).userData.id, "last");
  assert.equal(cache.get("detail:first"), undefined);
  assert.equal(cache.get("detail:middle"), undefined);
  assert.equal(cache.get("detail:last").userData.id, "last");
});

test("concurrent valid requests preserve the original concurrent dispatch", async (t) => {
  const { loader, workers } = harness(t);
  const promises = ["first", "middle", "last"].map((id) => loader.load(id));
  assert.equal(workers.length, 1);
  const worker = workers[0];
  assert.deepEqual(
    worker.requests.map((r) => r.id),
    ["first", "middle", "last"],
  );
  worker.reply(2);
  worker.reply(0);
  worker.reply(1);
  const results = await Promise.all(promises);
  assert.deepEqual(
    results.map((r) => r.userData.id),
    ["first", "middle", "last"],
  );
  assert.equal(new Set(results).size, 3);
  assert.equal(worker.terminated, 0);
});

test("returning to a base view stops stale work without creating a worker", async (t) => {
  const { loader, workers } = harness(t);
  let current = true;
  const active = loader.load("active", () => current);
  const queued = loader.load("queued", () => current);
  current = false;
  assert.equal(await loader.load("cell"), null);
  assert.equal(await loader.load("cytoplasm"), null);
  assert.deepEqual(await Promise.all([active, queued]), [null, null]);
  assert.equal(workers.length, 1);
  assert.equal(workers[0].terminated, 1);
});

test("prepared cache navigation stops stale work without reconstructing it", async (t) => {
  const { loader, workers, cache } = harness(t);
  let current = true;
  const active = loader.load("active", () => current);
  current = false;
  cache.set("detail:cached", { meshes: [], userData: { cached: true } });
  assert.equal((await loader.load("cached")).userData.cached, true);
  assert.equal(loader.sourceFor("cached"), "prepared-cache");
  assert.equal(await active, null);
  assert.equal(workers.length, 1);
  assert.equal(workers[0].terminated, 1);
});

test("retiring one obsolete request preserves other current requests", async (t) => {
  const { loader, workers } = harness(t);
  let firstCurrent = true;
  const first = loader.load("first", () => firstCurrent);
  const second = loader.load("second");
  const worker = workers[0];
  firstCurrent = false;
  const third = loader.load("third");
  assert.equal(await first, null);
  assert.equal(worker.terminated, 0);
  assert.equal(workers.length, 1);
  worker.send({
    request: worker.requests[0].request,
    get payload() {
      assert.fail("Obsolete payload read");
    },
  });
  worker.reply(2);
  worker.reply(1);
  const results = await Promise.all([second, third]);
  assert.deepEqual(
    results.map((r) => r.userData.id),
    ["second", "third"],
  );
});

test("late callbacks from a retired worker cannot settle or stop its replacement", async (t) => {
  const { loader, workers } = harness(t);
  let firstCurrent = true;
  const first = loader.load("first", () => firstCurrent);
  const retired = workers[0];
  const oldMessage = retired.onmessage;
  const oldError = retired.onerror;
  firstCurrent = false;
  const next = loader.load("next");
  assert.equal(await first, null);
  const replacement = workers[1];
  oldMessage({
    data: {
      request: replacement.requests[0].request,
      get payload() {
        assert.fail("Retired payload read");
      },
    },
  });
  oldError(new Error("retired transport failure"));
  assert.equal(replacement.terminated, 0);
  replacement.reply(0);
  assert.equal((await next).userData.id, "next");
});

test("completed warm workers and prepared models retain ordinary reuse", async (t) => {
  const { loader, workers } = harness(t);
  const first = loader.load("first");
  workers[0].reply(0);
  assert.equal((await first).userData.id, "first");
  const second = loader.load("second");
  assert.equal(workers.length, 1);
  assert.equal(workers[0].terminated, 0);
  workers[0].reply(1);
  assert.equal((await second).userData.id, "second");
  assert.equal((await loader.load("first")).userData.id, "first");
  assert.equal(loader.sourceFor("first"), "prepared-cache");
  assert.equal(workers[0].requests.length, 2);
});

test("dispose settles all requests and retires the worker exactly once", async (t) => {
  const { loader, workers } = harness(t);
  const first = loader.load("first");
  const second = loader.load("second");
  const worker = workers[0];
  const oldMessage = worker.onmessage;
  loader.dispose();
  loader.dispose();
  assert.deepEqual(await Promise.all([first, second]), [null, null]);
  oldMessage({
    data: {
      request: 1,
      get payload() {
        assert.fail("Disposed payload read");
      },
    },
  });
  assert.equal(worker.terminated, 1);
  assert.equal(await loader.load("after"), null);
});

test("active transport failure settles obsolete requests without fallback construction", async (t) => {
  const { loader, workers, cache } = harness(t);
  let current = true;
  const first = loader.load("first", () => current);
  const second = loader.load("second", () => current);
  current = false;
  workers[0].onerror(new Error("controlled transport failure"));
  assert.deepEqual(await Promise.all([first, second]), [null, null]);
  assert.equal(workers[0].terminated, 1);
  cache.set("detail:cached", { meshes: [], userData: {} });
  assert((await loader.load("cached")).isGroup);
  assert.equal(workers.length, 1);
});

test("a failed post does not prevent a subsequent current request", async (t) => {
  let failedCurrent = true;
  const { loader, workers } = harness(t, (request) => {
    if (request.id === "failed") {
      failedCurrent = false;
      throw new Error("controlled post failure");
    }
  });
  const failed = loader.load("failed", () => failedCurrent);
  const next = loader.load("next");
  assert.equal(await failed, null);
  assert.equal(workers.length, 1);
  workers[0].reply(0);
  assert.equal((await next).userData.id, "next");
});

test("navigation can retire stale work before a caller-owned cache branch", async (t) => {
  const { loader, workers } = harness(t);
  let current = true;
  const pending = loader.load("pending", () => current);
  const worker = workers[0];
  loader.cancelObsolete();
  assert.equal(
    worker.terminated,
    0,
    "A still-current request must be retained",
  );
  current = false;
  loader.cancelObsolete();
  loader.cancelObsolete();
  assert.equal(await pending, null);
  assert.equal(worker.terminated, 1);
  assert.equal(
    workers.length,
    1,
    "Caller cache branch must not need a new load",
  );
});
