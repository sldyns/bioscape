import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import { createFramingDistanceCache } from "../src/scene/framingDistanceCache.js";
import { explodedFitDistance } from "../src/scene/viewFraming.js";

function fixture() {
  const parts = [
    {
      userData: {
        frameBounds: new THREE.Box3(
          new THREE.Vector3(-3, -1, -0.5),
          new THREE.Vector3(1, 2, 0.75),
        ),
        offset: new THREE.Vector3(-1, 0.2, 0.1),
      },
    },
    {
      userData: {
        frameBounds: new THREE.Box3(
          new THREE.Vector3(1, -2, -1),
          new THREE.Vector3(4, 1, 1),
        ),
        offset: new THREE.Vector3(1, -0.2, 0.3),
      },
    },
  ];
  const state = {
    presentation: { parts },
    nodeId: "neuron",
    mode: "explode",
    explode: 35,
    camera: new THREE.PerspectiveCamera(36, 1.5, 0.1, 100),
    minDistance: 4,
  };
  const calls = [];
  const exact = (oriented, camera, separation) => {
    camera.updateMatrixWorld();
    const axes = oriented
      ? [0, 1, 2].map((i) =>
          new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, i),
        )
      : null;
    return Math.max(
      state.minDistance,
      explodedFitDistance(
        state.presentation?.parts ?? [],
        separation ?? state.explode / 100,
        camera.aspect,
        camera.fov,
        axes,
      ),
    );
  };
  const cache = createFramingDistanceCache((...args) => {
    calls.push(args);
    return exact(...args);
  });
  return { state, calls, cache, exact };
}

test("ordinary fit reuses an exact value during camera-only movement", () => {
  const { state, calls, cache, exact } = fixture();
  const expected = exact(false, state.camera, null);
  assert.equal(cache.get(state), expected);
  for (const angle of [0.2, 0.5, -0.4]) {
    state.camera.position.set(Math.sin(angle) * 12, 2, Math.cos(angle) * 12);
    state.camera.lookAt(0, 0, 0);
    assert.equal(exact(false, state.camera, null), expected);
    assert.equal(cache.get(state), expected);
  }
  assert.equal(calls.length, 1, "Unchanged framing data must not scan parts");
});

test("each ordinary framing dependency invalidates the single cached value", () => {
  const { state, calls, cache, exact } = fixture();
  cache.get(state);
  const changes = [
    () => (state.camera.aspect = 0.6),
    () => (state.camera.fov = 42),
    () => (state.minDistance = 20),
    () => (state.mode = "section"),
    () => (state.explode = 85),
    () => (state.nodeId = "ribosome"),
    () => (state.presentation = { parts: state.presentation.parts }),
    () => (state.presentation.parts = [...state.presentation.parts]),
    () => state.presentation.parts.pop(),
    () => (state.camera = state.camera.clone()),
    () => (state.presentation = null),
  ];
  for (const change of changes) {
    const before = calls.length;
    change();
    assert.equal(cache.get(state), exact(false, state.camera, null));
    assert.equal(calls.length, before + 1);
    cache.get(state);
    assert.equal(calls.length, before + 1, "The new state is cached");
  }
});

test("oriented, custom-camera and explicit-separation fits bypass the cache", () => {
  const { state, calls, cache, exact } = fixture();
  const ordinary = cache.get(state);
  const exported = state.camera.clone();
  exported.aspect = 9 / 16;
  exported.rotation.set(0.2, 0.3, -0.1);
  for (const args of [
    [true, state.camera, null],
    [false, exported, null],
    [false, state.camera, 0],
    [false, state.camera, 0.8],
    [true, exported, 0.4],
  ]) {
    for (let repeat = 0; repeat < 2; repeat++) {
      const before = calls.length;
      assert.equal(cache.get(state, ...args), exact(...args));
      assert.equal(calls.length, before + 1);
      assert.deepEqual(
        calls.at(-1),
        args,
        "Original fit arguments are retained",
      );
    }
  }
  const before = calls.length;
  assert.equal(cache.get(state), ordinary);
  assert.equal(calls.length, before, "Exports must not replace the live fit");
});

test("presentation invalidation admits changed stored bounds and offsets", () => {
  const { state, calls, cache, exact } = fixture();
  const before = cache.get(state);
  const part = state.presentation.parts[0];
  part.userData.frameBounds.min.x -= 4;
  part.userData.offset.x -= 3;
  cache.invalidate();
  const after = cache.get(state);
  assert.equal(after, exact(false, state.camera, null));
  assert.notEqual(after, before);
  assert.equal(calls.length, 2);
});

test("a failed fit is retried and does not poison the previous state", () => {
  const { state } = fixture();
  let calls = 0;
  let fail = false;
  const cache = createFramingDistanceCache(() => {
    calls++;
    if (fail) throw new Error("fit unavailable");
    return state.explode + 0.123456789;
  });
  const first = cache.get(state);
  state.explode = 90;
  fail = true;
  assert.throws(() => cache.get(state), /fit unavailable/);
  assert.throws(() => cache.get(state), /fit unavailable/);
  state.explode = 35;
  assert.equal(cache.get(state), first);
  assert.equal(calls, 3);
  state.explode = 90;
  fail = false;
  assert.equal(cache.get(state), 90.123456789);
  assert.equal(calls, 4);
});
