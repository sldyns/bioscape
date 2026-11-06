import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import {
  createRenderingOwner,
  createRenderingResources,
} from "../src/scene/renderingOwner.js";
import { resetSharedRenderingState } from "../src/scene/resetSharedRenderingState.js";

// Exercise the actual CellScene resource constructor independently of React,
// biological factories or GL. This covers partial setup and resource transfer.
const sceneSource = readFileSync(
  new URL("../src/CellScene.jsx", import.meta.url),
  "utf8",
);
const anchor = "    const job = deferStagedSceneInitialization(\n";
const at = sceneSource.indexOf(anchor);
assert(at >= 0);
const start = at + anchor.length;
const end = sceneSource.indexOf("      (prepared) => {", start);
assert(start > 0 && end > start);
const resourceSource = sceneSource
  .slice(start, end)
  .replace(/,\s*$/, "")
  .trim();
const bind = new Function(
  "THREE",
  "renderingOwner",
  "resetSharedRenderingState",
  "setError",
  "setAttempt",
  "createRenderingResources",
  `return (${resourceSource});`,
);

function fixture(owner) {
  const state = { renderers: [], errors: [], attempts: 0, disposalOrder: [] };
  class Renderer {
    constructor(options) {
      this.options = options;
      this.disposals = 0;
      this.shadowMap = {};
      this.info = {};
      this.contextLost = false;
      const listeners = new Map();
      this.listeners = listeners;
      this.domElement = {
        removed: false,
        addEventListener(type, callback) {
          if (!listeners.has(type)) listeners.set(type, new Set());
          listeners.get(type).add(callback);
        },
        removeEventListener(type, callback) {
          listeners.get(type)?.delete(callback);
        },
        remove() {
          this.removed = true;
        },
      };
      state.renderers.push(this);
    }
    setRenderTarget(value) {
      this.target = value;
    }
    setScissorTest(value) {
      this.scissor = value;
    }
    getContext() {
      return { isContextLost: () => this.contextLost };
    }
    dispose() {
      this.disposals++;
      state.disposalOrder.push("renderer");
    }
    event(type) {
      for (const callback of [...(this.listeners.get(type) ?? [])])
        callback({ preventDefault() {} });
    }
  }
  const create = bind(
    { WebGLRenderer: Renderer, PCFShadowMap: 1 },
    owner,
    resetSharedRenderingState,
    (error) => state.errors.push(error),
    () => state.attempts++,
    createRenderingResources,
  );
  return { state, create };
}
function environment(onDispose = () => {}) {
  return {
    texture: {},
    disposals: 0,
    dispose() {
      this.disposals++;
      onDispose();
    },
  };
}
function stagedEnvironment(ticket, env) {
  ticket.ownSetup(() => {
    if (!ticket.environmentManaged) env.dispose();
  });
  ticket.adoptEnvironment(env);
}
function listenerCount(renderer) {
  return [...renderer.listeners.values()].reduce(
    (total, callbacks) => total + callbacks.size,
    0,
  );
}

test("a live structure can re-enter after retirement before its parent's layout effect", () => {
  const owner = createRenderingOwner();
  owner.retire();
  const { create, state } = fixture(owner);
  const ticket = create();
  assert.ok(ticket, "Scene entry must not become a silent WebGL error");
  assert.deepEqual(state.errors, []);
  const env = environment();
  ticket.detach();
  stagedEnvironment(ticket, env);
  ticket.finishSetup();
  ticket.releaseRendering();
  const next = create();
  assert.equal(next.renderer, ticket.renderer);
  assert.equal(state.renderers.length, 1);
  next.dispose();
  owner.retire();
  assert.equal(env.disposals, 1);
  assert.equal(ticket.renderer.disposals, 1);
});

test("a late scene release from a retired epoch cannot replace a newly entered scene", () => {
  const owner = createRenderingOwner();
  const { create, state } = fixture(owner);
  const old = create(),
    oldEnvironment = environment();
  old.detach();
  stagedEnvironment(old, oldEnvironment);
  old.finishSetup();
  owner.retire();
  const current = create(),
    currentEnvironment = environment();
  current.detach();
  stagedEnvironment(current, currentEnvironment);
  current.finishSetup();
  old.releaseRendering();
  assert.equal(oldEnvironment.disposals, 1);
  assert.equal(old.renderer.disposals, 1);
  assert.equal(current.renderer.disposals, 0);
  current.releaseRendering();
  const borrowed = create();
  assert.equal(borrowed.renderer, current.renderer);
  assert.equal(state.renderers.length, 2);
  borrowed.dispose();
  owner.retire();
  assert.equal(currentEnvironment.disposals, 1);
});

test("canceling the actual staged constructor releases renderer without creating an environment", () => {
  const owner = createRenderingOwner();
  const { create, state } = fixture(owner);
  const ticket = create();
  assert.equal(state.renderers.length, 1);
  assert.deepEqual(ticket.renderer.options, {
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  ticket.dispose();
  ticket.dispose();
  assert.equal(ticket.renderer.disposals, 1);
  assert.equal(ticket.renderer.domElement.removed, true);
  assert.equal(listenerCount(ticket.renderer), 0);
  assert.equal(owner.acquire(), null);
  owner.retire();
});

test("a completed structure returns the exact independent pair to the next scene", () => {
  const owner = createRenderingOwner();
  const { create, state } = fixture(owner);
  const first = create(),
    env = environment();
  first.detach();
  stagedEnvironment(first, env);
  first.finishSetup();
  first.releaseRendering();
  assert.equal(env.disposals, 0);
  assert.equal(first.renderer.disposals, 0);
  assert.equal(
    listenerCount(first.renderer),
    1,
    "Only the independent lost-context owner remains idle",
  );
  const next = create();
  assert.equal(state.renderers.length, 1);
  assert.equal(next.renderer, first.renderer);
  assert.equal(next.environment, env);
  next.detach();
  next.finishSetup();
  next.releaseRendering();
  owner.retire();
  assert.equal(env.disposals, 1);
  assert.equal(first.renderer.disposals, 1);
  assert.equal(listenerCount(first.renderer), 0);
});

test("a failed partial setup releases controls and invalidates an already borrowed environment", () => {
  const owner = createRenderingOwner();
  const { create, state } = fixture(owner);
  const first = create(),
    env = environment(() => state.disposalOrder.push("environment"));
  first.detach();
  stagedEnvironment(first, env);
  first.finishSetup();
  first.releaseRendering();
  const next = create();
  let controlsDisposed = 0;
  next.ownSetup(() => {
    controlsDisposed++;
    state.disposalOrder.push("controls");
  });
  next.dispose();
  next.dispose();
  assert.equal(controlsDisposed, 1);
  assert.deepEqual(state.disposalOrder, [
    "controls",
    "environment",
    "renderer",
  ]);
  assert.equal(env.disposals, 1);
  assert.equal(next.renderer.disposals, 1);
  assert.equal(owner.acquire(), null);
  owner.retire();
});

test("retirement during staged setup cannot leak or double-dispose a new environment", () => {
  const owner = createRenderingOwner();
  const { create } = fixture(owner);
  const ticket = create(),
    env = environment();
  ticket.ownSetup(() => {
    if (!ticket.environmentManaged) env.dispose();
  });
  owner.retire();
  assert.throws(() => ticket.adoptEnvironment(env), /retired/);
  ticket.dispose();
  ticket.dispose();
  assert.equal(env.disposals, 1);
  assert.equal(ticket.renderer.disposals, 1);
  assert.equal(listenerCount(ticket.renderer), 0);
  assert.equal(ticket.renderer.domElement.removed, true);
});

test("lost staged resources are discarded and detached restoration callbacks stay silent", () => {
  const owner = createRenderingOwner();
  const { create, state } = fixture(owner);
  const ticket = create(),
    env = environment();
  stagedEnvironment(ticket, env);
  ticket.renderer.contextLost = true;
  ticket.renderer.event("webglcontextlost");
  assert.equal(ticket.lost, true);
  assert.deepEqual(state.errors, ["context"]);
  ticket.dispose();
  ticket.renderer.event("webglcontextrestored");
  assert.equal(state.attempts, 0);
  assert.equal(owner.acquire(), null);
  assert.equal(env.disposals, 1);
  assert.equal(ticket.renderer.disposals, 1);
  owner.retire();
});
