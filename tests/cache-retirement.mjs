import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createInstanceBoundsCache } from "../src/processes/instanceBoundsCache.js";
import { visibleProcessBounds } from "../src/processes/sceneBounds.js";

function fixture(instanced = false) {
  const position = new THREE.Float32BufferAttribute(
    [-1, -2, -3, 1, 2, 3, 0.5, -1, 2, 0, 0, 0],
    3,
  );
  const geometry = new THREE.BufferGeometry().setAttribute(
    "position",
    position,
  );
  const material = new THREE.MeshBasicMaterial();
  const mesh = instanced
    ? new THREE.InstancedMesh(geometry, material, 1)
    : new THREE.Mesh(geometry, material);
  if (instanced)
    mesh.setMatrixAt(0, new THREE.Matrix4().makeTranslation(2, 3, 4));
  else mesh.rotation.set(0.2, 0.3, 0.4);
  const root = new THREE.Group();
  root.add(mesh);
  return {
    position,
    geometry,
    material,
    mesh,
    root,
    dispose() {
      mesh.dispose?.();
      geometry.dispose();
      material.dispose();
    },
  };
}
const makeCache = (options) =>
  createInstanceBoundsCache({
    cacheMeshBounds: true,
    retireOnChange: true,
    ...options,
  });
const bits = (box) =>
  Buffer.from(
    new Float64Array([...box.min.toArray(), ...box.max.toArray()]).buffer,
  ).toString("hex");
// Compare with the complete uncached path. Independent geometric-oracle tests
// cover the numeric kernel; these controls exercise retirement and bypass.
function same(root, cache) {
  const original = visibleProcessBounds(root, new THREE.Box3());
  const actual = visibleProcessBounds(root, new THREE.Box3(), cache);
  assert.equal(bits(actual), bits(original));
}

test("changed instance input retires once and subsequent poses use exact original bounds", () => {
  const f = fixture(true),
    cache = makeCache();
  try {
    same(f.root, cache);
    same(f.root, cache);
    assert.equal(cache.statistics().hits, 1);
    const version = f.mesh.instanceMatrix.version;
    f.mesh.instanceMatrix.array[12] += 0.7;
    same(f.root, cache);
    assert.equal(f.mesh.instanceMatrix.version, version);
    assert(cache.isRetired(f.mesh));
    assert.equal(cache.statistics().retiredEntries, 1);
    assert.equal(cache.statistics().totalRetirements, 1);
    assert.equal(cache.statistics().retainedBytes, 0);
    for (let i = 0; i < 12; i++) {
      f.mesh.instanceMatrix.array[13] += 0.13;
      same(f.root, cache);
    }
    assert.equal(cache.statistics().hits, 1);
    assert.equal(cache.statistics().totalRetirements, 1);
    cache.clear();
    assert(!cache.isRetired(f.mesh));
    assert.equal(cache.statistics().entries, 0);
    assert.equal(cache.statistics().retainedBytes, 0);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("changed ordinary positions retire and never recopy keys during later dynamic poses", () => {
  const f = fixture(),
    cache = makeCache();
  try {
    same(f.root, cache);
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, 1);
    f.position.array[0] -= 0.21;
    same(f.root, cache);
    assert(cache.isRetired(f.mesh));
    const s = cache.statistics();
    assert.equal(s.meshEntries, 0);
    assert.equal(s.retiredEntries, 1);
    assert.equal(s.retainedBytes, 0);
    for (let i = 0; i < 12; i++) {
      f.position.array[1] += 0.17;
      f.mesh.position.y += 0.1;
      same(f.root, cache);
    }
    assert.equal(cache.statistics().meshHits, 1);
    assert.equal(cache.statistics().totalRetirements, 1);
    cache.clear();
    assert.equal(cache.statistics().retiredEntries, 0);
    same(f.root, cache);
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, 2);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("unsupported custom reads retire while retaining original getter call counts", () => {
  const f = fixture(),
    cache = makeCache();
  let reads = 0;
  Object.defineProperty(f.position, "getX", {
    get() {
      reads++;
      return (i) => this.array[i * 3];
    },
  });
  try {
    for (let i = 0; i < 3; i++) {
      const original = visibleProcessBounds(f.root, new THREE.Box3());
      reads = 0;
      const actual = visibleProcessBounds(f.root, new THREE.Box3(), cache);
      assert.equal(bits(actual), bits(original));
      assert.equal(reads, f.position.count);
      assert(cache.isRetired(f.mesh));
      assert.equal(cache.statistics().retainedBytes, 0);
    }
    assert.equal(cache.statistics().totalRetirements, 1);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("weak retirement markers share the entry budget with active ordinary and instance snapshots", () => {
  const f = fixture(),
    cache = makeCache({ entryLimit: 2 });
  const instance = new THREE.InstancedMesh(f.geometry, f.material, 1);
  instance.setMatrixAt(0, new THREE.Matrix4().makeTranslation(2, 3, 4));
  f.root.add(instance);
  const third = new THREE.Mesh(f.geometry, f.material);
  third.position.set(5, 4, 3);
  try {
    same(f.root, cache);
    assert.equal(cache.statistics().entries, 2);
    f.mesh.position.x += 0.3;
    same(f.root, cache);
    assert(cache.isRetired(f.mesh));
    f.root.add(third);
    same(f.root, cache);
    const s = cache.statistics();
    assert.equal(s.entries, 2);
    assert.equal(s.retiredEntries, 1);
    assert.equal(s.instanceEntries, 1);
    assert.equal(s.meshEntries, 0);
    assert(s.retainedBytes <= s.byteLimit);
    cache.clear();
    assert.equal(cache.statistics().entries, 0);
    assert.equal(cache.statistics().retiredEntries, 0);
    assert.equal(cache.statistics().retainedBytes, 0);
    assert(!cache.isRetired(f.mesh));
  } finally {
    instance.dispose();
    cache.clear();
    f.dispose();
  }
});

test("retirement is optional and the original cache update behavior remains available", () => {
  const f = fixture(),
    cache = createInstanceBoundsCache({ cacheMeshBounds: true });
  try {
    same(f.root, cache);
    same(f.root, cache);
    f.position.array[0] -= 0.25;
    same(f.root, cache);
    same(f.root, cache);
    assert(!cache.isRetired(f.mesh));
    assert.equal(cache.statistics().retiredEntries, 0);
    assert.equal(cache.statistics().meshHits, 2);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("two complete changing poses retire unproductive admission and never retain later snapshots", () => {
  const f = fixture(true);
  const cache = makeCache({ retireUnproductiveAfterSamples: 2 });
  try {
    for (let sample = 0; sample < 6; sample++) {
      f.mesh.instanceMatrix.array[12] = sample * 0.7;
      same(f.root, cache);
      cache.finishSample();
      if (sample >= 1) {
        assert.equal(cache.enabled, false);
        assert.equal(cache.statistics().entries, 0);
        assert.equal(cache.statistics().retiredEntries, 0);
        assert.equal(cache.statistics().retainedBytes, 0);
      }
    }
    assert.deepEqual(cache.admissionStatistics(), {
      warmupSamples: 2,
      completedSamples: 6,
      disabled: true,
    });
    cache.clear();
    assert.equal(cache.enabled, false);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("static instance reuse keeps admission active after the two complete poses", () => {
  const f = fixture(true);
  const cache = makeCache({ retireUnproductiveAfterSamples: 2 });
  try {
    for (let sample = 0; sample < 4; sample++) {
      same(f.root, cache);
      cache.finishSample();
    }
    assert.equal(cache.enabled, true);
    assert.equal(cache.statistics().hits, 3);
    assert(cache.statistics().retainedBytes > 0);
    assert.equal(cache.admissionStatistics().disabled, false);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("static ordinary mesh reuse remains active without any instanced mesh", () => {
  const f = fixture();
  const cache = makeCache({ retireUnproductiveAfterSamples: 2 });
  try {
    for (let sample = 0; sample < 4; sample++) {
      same(f.root, cache);
      cache.finishSample();
    }
    assert.equal(cache.enabled, true);
    assert.equal(cache.statistics().meshHits, 3);
    assert(cache.statistics().retainedBytes > 0);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("admission is opt-in and rejects incomplete or invalid warmup limits", () => {
  for (const retireUnproductiveAfterSamples of [-1, 1, 1.5, NaN, Infinity, "2"])
    assert.throws(() => makeCache({ retireUnproductiveAfterSamples }));
  const f = fixture(true),
    cache = makeCache();
  try {
    for (let sample = 0; sample < 3; sample++) {
      f.mesh.instanceMatrix.array[12] = sample * 0.7;
      same(f.root, cache);
      cache.finishSample();
    }
    assert.equal(cache.enabled, true);
    assert.equal(cache.admissionStatistics().warmupSamples, 0);
  } finally {
    cache.clear();
    f.dispose();
  }
});
