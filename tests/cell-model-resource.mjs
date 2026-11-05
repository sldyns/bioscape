import assert from "node:assert/strict";
import test from "node:test";
import { createCellModelResource } from "../src/scene/cellModelResource.js";

function harness({ settleOnDispose = true, source = "build" } = {}) {
  const loaders = [],
    released = [];
  const resource = createCellModelResource({
    createLoader() {
      let resolve, reject;
      const promise = new Promise((yes, no) => {
        resolve = yes;
        reject = no;
      });
      const loader = {
        source,
        promise,
        resolve,
        reject,
        disposed: 0,
        dispose() {
          this.disposed++;
          if (settleOnDispose) resolve(null);
        },
      };
      loaders.push(loader);
      return loader;
    },
    disposeModel(model) {
      released.push(model);
    },
  });
  return { resource, loaders, released };
}
const started = async (resource) => {
  const promise = resource.load();
  await Promise.resolve();
  return { promise };
};

test("construction stays lazy and cancellation before startup creates no loader", async () => {
  const h = harness();
  assert.equal(h.loaders.length, 0);
  const first = h.resource.load();
  assert.equal(h.resource.cancelPending(), true);
  assert.equal(await first, null);
  assert.equal(h.loaders.length, 0);
  h.resource.dispose();
});

test("several base views share the same pending construction", async () => {
  const h = harness();
  const first = h.resource.load(),
    second = h.resource.load();
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(h.loaders.length, 1);
  const model = {};
  h.loaders[0].resolve(model);
  assert.equal(await first, model);
  assert.equal(h.resource.value, model);
  assert.equal(h.resource.load(), first);
  h.resource.dispose();
  assert.deepEqual(h.released, [model]);
});

test("standalone navigation cancels only unfinished base construction", async () => {
  const h = harness();
  const { promise } = await started(h.resource);
  assert.equal(h.resource.cancelPending(), true);
  assert.equal(h.loaders[0].disposed, 1);
  assert.equal(await promise, null);
  assert.equal(h.resource.value, null);
  assert.equal(h.resource.cancelPending(), false);
  h.resource.dispose();
  assert.equal(h.loaders[0].disposed, 1);
});

test("completed model and its prepared-cache source survive unrelated views", async () => {
  const h = harness({ source: "prepared-cache" });
  const { promise } = await started(h.resource);
  const model = {};
  h.loaders[0].resolve(model);
  assert.equal(await promise, model);
  assert.equal(h.resource.source, "prepared-cache");
  assert.equal(h.resource.cancelPending(), false);
  assert.equal(await h.resource.load(), model);
  assert.equal(h.loaders.length, 1);
  assert.equal(h.loaders[0].disposed, 0);
  assert.deepEqual(h.released, []);
  h.resource.dispose();
  h.resource.dispose();
  assert.deepEqual(h.released, [model]);
});

test("late old model cannot overwrite a newer completed model", async () => {
  const h = harness({ settleOnDispose: false });
  const old = await started(h.resource);
  h.resource.cancelPending();
  const current = await started(h.resource);
  const freshModel = { id: "current" },
    staleModel = { id: "old" };
  h.loaders[1].resolve(freshModel);
  assert.equal(await current.promise, freshModel);
  h.loaders[0].resolve(staleModel);
  assert.equal(await old.promise, null);
  assert.equal(h.resource.value, freshModel);
  assert.deepEqual(h.released, [staleModel]);
  h.resource.dispose();
  assert.deepEqual(h.released, [staleModel, freshModel]);
});

test("cancel after native resolution but before ownership continuation releases the old model", async () => {
  const h = harness({ settleOnDispose: false });
  const old = await started(h.resource);
  const model = {};
  h.loaders[0].resolve(model);
  h.resource.cancelPending();
  assert.equal(await old.promise, null);
  assert.equal(h.resource.value, null);
  assert.deepEqual(h.released, [model]);
  h.resource.dispose();
});

test("unmount during the same resolution gap cannot leak or republish a model", async () => {
  const h = harness({ settleOnDispose: false });
  const old = await started(h.resource);
  const model = {};
  h.loaders[0].resolve(model);
  h.resource.dispose();
  assert.equal(await old.promise, null);
  assert.equal(h.resource.value, null);
  assert.deepEqual(h.released, [model]);
  assert.equal(await h.resource.load(), null);
  assert.equal(h.loaders.length, 1);
});

test("stale failure settles quietly and cannot reject the current request", async () => {
  const h = harness({ settleOnDispose: false });
  const old = await started(h.resource);
  h.resource.cancelPending();
  const current = await started(h.resource);
  h.loaders[0].reject(new Error("old transport failure"));
  assert.equal(await old.promise, null);
  const model = {};
  h.loaders[1].resolve(model);
  assert.equal(await current.promise, model);
  h.resource.dispose();
});

test("current failure reaches the caller and does not publish a model", async () => {
  const h = harness();
  const current = await started(h.resource);
  const error = new Error("current transport failure");
  h.loaders[0].reject(error);
  await assert.rejects(current.promise, (seen) => seen === error);
  assert.equal(h.resource.value, null);
  h.resource.dispose();
});

test("unmount before deferred startup does not construct anything", async () => {
  const h = harness();
  const promise = h.resource.load();
  h.resource.dispose();
  assert.equal(await promise, null);
  assert.equal(h.loaders.length, 0);
});

test("synchronous cancellation from a factory still releases its returned loader", async () => {
  let resource,
    resolve,
    disposed = 0;
  const released = [];
  const promise = new Promise((yes) => {
    resolve = yes;
  });
  resource = createCellModelResource({
    createLoader() {
      resource.cancelPending();
      return {
        source: "build",
        promise,
        dispose() {
          disposed++;
        },
      };
    },
    disposeModel(model) {
      released.push(model);
    },
  });
  const request = resource.load();
  await Promise.resolve();
  const model = {};
  resolve(model);
  assert.equal(await request, null);
  assert.equal(disposed, 1);
  assert.deepEqual(released, [model]);
  resource.dispose();
});

test("factory failure reaches the caller without a phantom ready value", async () => {
  const error = new Error("constructor unavailable");
  const resource = createCellModelResource({
    createLoader() {
      throw error;
    },
    disposeModel() {
      assert.fail("No constructed model exists");
    },
  });
  await assert.rejects(resource.load(), (seen) => seen === error);
  assert.equal(resource.value, null);
  resource.dispose();
});
