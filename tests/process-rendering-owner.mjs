import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createProcessRenderingOwner,
  createProcessRenderingResources,
} from "../src/processes/renderingOwner.js";

function adapters({ throwEnvironmentDispose = false } = {}) {
  const listeners = new Map();
  const context = {
    lost: false,
    isContextLost() {
      return this.lost;
    },
  };
  const renderer = {
    disposals: 0,
    domElement: {
      addEventListener(type, listener) {
        listeners.set(type, listener);
      },
      removeEventListener(type, listener) {
        assert.equal(listeners.get(type), listener);
        listeners.delete(type);
      },
    },
    getContext: () => context,
    dispose() {
      this.disposals++;
    },
  };
  const environment = {
    disposals: 0,
    dispose() {
      this.disposals++;
      if (throwEnvironmentDispose)
        throw new Error("planned environment cleanup failure");
    },
  };
  return { renderer, environment, listeners, context };
}

test("an idle environment stays invalid after its graphics context is restored", () => {
  const owner = createProcessRenderingOwner();
  const { renderer, environment, listeners, context } = adapters();
  const pair = createProcessRenderingResources(renderer, environment);
  owner.adopt(pair).release();
  assert.equal(pair.isUsable(), true);
  context.lost = true;
  listeners.get("webglcontextlost")();
  context.lost = false;
  assert.equal(
    pair.isUsable(),
    false,
    "A restored context has lost the PMREM pixels",
  );
  assert.equal(owner.acquire(), null);
  assert.equal(listeners.size, 0);
  assert.deepEqual([renderer.disposals, environment.disposals], [1, 1]);
  owner.retire();
});

test("owned resource disposal is idempotent and releases renderer after environment errors", () => {
  const { renderer, environment, listeners } = adapters({
    throwEnvironmentDispose: true,
  });
  const pair = createProcessRenderingResources(renderer, environment);
  assert.throws(() => pair.dispose(), /planned environment cleanup failure/);
  pair.dispose();
  assert.equal(pair.isUsable(), false);
  assert.equal(listeners.size, 0);
  assert.deepEqual([renderer.disposals, environment.disposals], [1, 1]);
});

function resource(name) {
  return {
    name,
    renderer: { name },
    environment: { name },
    usable: true,
    disposals: 0,
    isUsable() {
      return this.usable;
    },
    dispose() {
      this.disposals++;
    },
  };
}

test("consecutive scenes reuse the exact owned pair only after release", () => {
  const owner = createProcessRenderingOwner();
  const first = resource("first");
  assert.equal(owner.acquire(), null);
  const original = owner.adopt(first);
  assert.equal(
    owner.acquire(),
    null,
    "An active scene has exclusive ownership",
  );
  original.release();
  original.release();
  const next = owner.acquire();
  assert.equal(next.resources.renderer, first.renderer);
  assert.equal(next.resources.environment, first.environment);
  assert.equal(owner.acquire(), null);
  assert.equal(first.disposals, 0);
  owner.retire();
  assert.equal(first.disposals, 0, "The scene must finish model cleanup first");
  next.release();
  next.release();
  assert.equal(first.disposals, 1);
  assert.throws(() => owner.acquire(), /retired/);
});

test("overlapping scenes stay independent and at most one idle pair is kept", () => {
  const owner = createProcessRenderingOwner();
  const a = resource("a");
  const b = resource("b");
  const first = owner.adopt(a);
  const second = owner.adopt(b);
  assert.notEqual(first.resources.renderer, second.resources.renderer);
  assert.notEqual(first.resources.environment, second.resources.environment);
  second.release();
  first.release();
  assert.equal(a.disposals, 1, "Overflow is released immediately");
  assert.equal(b.disposals, 0);
  const retained = owner.acquire();
  assert.equal(retained.resources, b);
  retained.release();
  owner.retire();
  owner.retire();
  assert.deepEqual([a.disposals, b.disposals], [1, 1]);
});

test("draw failures and contexts lost while idle are discarded", () => {
  const owner = createProcessRenderingOwner();
  const broken = resource("broken");
  const active = owner.adopt(broken);
  active.invalidate();
  active.release();
  assert.equal(broken.disposals, 1);
  assert.equal(owner.acquire(), null);
  const lost = resource("lost");
  owner.adopt(lost).release();
  lost.usable = false;
  assert.equal(owner.acquire(), null);
  assert.equal(lost.disposals, 1);
  const failedCheck = resource("failed-check");
  failedCheck.isUsable = () => {
    throw new Error("lost context adapter");
  };
  owner.adopt(failedCheck).release();
  assert.equal(owner.acquire(), null);
  assert.equal(failedCheck.disposals, 1);
  owner.retire();
  assert.deepEqual(
    [broken.disposals, lost.disposals, failedCheck.disposals],
    [1, 1, 1],
  );
});

test("effect replay cannot cache a late lease from an earlier workspace epoch", () => {
  const owner = createProcessRenderingOwner();
  const old = resource("old");
  const current = resource("current");
  const stale = owner.adopt(old);
  owner.retire();
  owner.resume();
  const live = owner.adopt(current);
  stale.release();
  assert.equal(old.disposals, 1);
  assert.equal(owner.acquire(), null, "A late old release cannot become idle");
  live.release();
  const reused = owner.acquire();
  assert.equal(reused.resources, current);
  owner.retire();
  reused.release();
  assert.equal(current.disposals, 1);
});

test("retirement releases idle resources and resume starts empty", () => {
  const owner = createProcessRenderingOwner();
  const item = resource("idle");
  owner.adopt(item).release();
  owner.retire();
  assert.equal(item.disposals, 1);
  assert.throws(() => owner.adopt(resource("after-retirement")), /retired/);
  owner.resume();
  owner.resume();
  assert.equal(owner.acquire(), null);
  owner.retire();
  assert.equal(item.disposals, 1);
});

test("duplicate adoption cannot introduce aliased concurrent leases", () => {
  const owner = createProcessRenderingOwner();
  const item = resource("unique");
  const active = owner.adopt(item);
  assert.throws(() => owner.adopt(item), /independently owned/);
  assert.throws(() => owner.adopt({ dispose() {} }), /independently owned/);
  active.release();
  const reused = owner.acquire();
  reused.release();
  owner.retire();
  assert.equal(item.disposals, 1);
});

test("a throwing disposer cannot leave an idle or doubly released resource", () => {
  const owner = createProcessRenderingOwner();
  const item = resource("throws");
  item.dispose = function () {
    this.disposals++;
    throw new Error("planned cleanup failure");
  };
  const active = owner.adopt(item);
  active.invalidate();
  assert.throws(() => active.release(), /planned cleanup failure/);
  active.release();
  assert.equal(item.disposals, 1);
  assert.equal(owner.acquire(), null);
  owner.retire();
});
