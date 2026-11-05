import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { visibleProcessBounds } from "../src/processes/sceneBounds.js";
import { createInstanceBoundsCache } from "../src/processes/instanceBoundsCache.js";

function fixture(count = 8) {
  const geometry = new THREE.BoxGeometry(2, 3, 4);
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const matrix = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    matrix.makeTranslation(i * 3, i % 3, -i);
    mesh.setMatrixAt(i, matrix);
  }
  return {
    mesh,
    geometry,
    material,
    dispose() {
      mesh.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}

// Three's public corner-transform algorithm is independent of the cache and
// the existing optimized instance-box transform. Include every active instance.
function reference(root) {
  root.updateWorldMatrix(true, true);
  const result = new THREE.Box3();
  const local = new THREE.Matrix4();
  const world = new THREE.Matrix4();
  root.traverseVisible((object) => {
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    if (
      !object.isInstancedMesh ||
      !materials.some(
        (material) =>
          material &&
          material.visible &&
          !(material.transparent && material.opacity === 0),
      )
    )
      return;
    object.geometry.computeBoundingBox();
    for (let i = 0; i < object.count; i++) {
      object.getMatrixAt(i, local);
      world.multiplyMatrices(object.matrixWorld, local);
      result.union(object.geometry.boundingBox.clone().applyMatrix4(world));
    }
  });
  return result;
}

function same(root, cache) {
  const actual = visibleProcessBounds(root, new THREE.Box3(), cache);
  const expected = reference(root);
  assert.deepEqual(actual.min.toArray(), expected.min.toArray());
  assert.deepEqual(actual.max.toArray(), expected.max.toArray());
  return actual;
}

test("unchanged complete instances reuse an exact box and preserve geometry bounds", () => {
  const f = fixture();
  const cache = createInstanceBoundsCache();
  try {
    const expected = same(f.mesh, cache);
    const originalBox = f.geometry.boundingBox.clone();
    f.geometry.boundingBox.min.set(-1000, -1000, -1000);
    const actual = visibleProcessBounds(f.mesh, new THREE.Box3(), cache);
    assert.deepEqual(actual, expected);
    assert.deepEqual(f.geometry.boundingBox, originalBox);
    assert.equal(cache.statistics().hits, 1);
    assert.equal(cache.statistics().entries, 1);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("unmarked raw matrix edits and signed-zero bit changes invalidate a hit", () => {
  const f = fixture();
  const cache = createInstanceBoundsCache();
  try {
    same(f.mesh, cache);
    const version = f.mesh.instanceMatrix.version;
    f.mesh.instanceMatrix.array[12] = 100;
    assert.equal(same(f.mesh, cache).max.x, 101);
    assert.equal(f.mesh.instanceMatrix.version, version);
    assert.equal(cache.statistics().hits, 0);
    f.mesh.instanceMatrix.array[1] = -0;
    same(f.mesh, cache);
    assert.equal(cache.statistics().hits, 0);
    same(f.mesh, cache);
    assert.equal(cache.statistics().hits, 1);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("world transforms and active counts remain exact across repeated and reverse states", () => {
  const f = fixture(24);
  const cache = createInstanceBoundsCache();
  const matrix = new THREE.Matrix4();
  try {
    for (const state of [0, 0, 1, 1, 2, 2, 5, 5, 2, 2, 0, 0]) {
      f.mesh.position.set(state * 3, -state, state / 4);
      f.mesh.rotation.set(state / 13, -state / 17, state / 19);
      f.mesh.scale.set(state === 2 ? -1 : 1, 0.7, 1.3);
      f.mesh.count = 24 - state;
      matrix.makeScale(state === 5 ? 0 : -2, 0.8, 1.2);
      matrix.elements[4] = state * 0.07;
      matrix.elements[9] = -state * 0.03;
      matrix.setPosition(3 + state, -2, 4);
      f.mesh.setMatrixAt(0, matrix);
      same(f.mesh, cache);
    }
    assert(cache.statistics().hits >= 6);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("actual geometry and morph edits recompute their box before cache lookup", () => {
  const f = fixture();
  const cache = createInstanceBoundsCache();
  try {
    same(f.mesh, cache);
    const position = f.geometry.attributes.position;
    const version = position.version;
    position.array[0] = 14;
    same(f.mesh, cache);
    assert.equal(position.version, version);
    assert.equal(cache.statistics().hits, 0);
    f.geometry.morphAttributes.position = [
      new THREE.Float32BufferAttribute(
        new Float32Array(position.array.length).fill(19),
        3,
      ),
    ];
    same(f.mesh, cache);
    f.geometry.morphAttributes.position[0].array[0] = 40;
    same(f.mesh, cache);
    assert.equal(cache.statistics().hits, 0);
    same(f.mesh, cache);
    assert.equal(cache.statistics().hits, 1);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("96 deterministic affine/projective states equal the independent corner oracle", () => {
  const f = fixture(32);
  const root = new THREE.Group();
  root.add(f.mesh);
  const cache = createInstanceBoundsCache();
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const euler = new THREE.Euler();
  let seed = 9481;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  try {
    for (let state = 0; state < 96; state++) {
      const phase = Math.floor(state / 2);
      root.position.set(phase / 7, -phase / 9, phase / 11);
      root.rotation.set(phase / 13, -phase / 17, phase / 19);
      f.mesh.count = 32 - (phase % 5);
      if (state % 2 === 0) {
        for (let i = 0; i < 32; i++) {
          position.set(random() * 12 - 6, random() * 10 - 5, random() * 8 - 4);
          scale.set(i % 9 === 0 ? 0 : -1.2, 0.3 + random(), 0.5 + random());
          rotation.setFromEuler(euler.set(random(), -random(), random()));
          matrix.compose(position, rotation, scale);
          matrix.elements[4] += random() * 0.2;
          if (phase % 11 === 0) matrix.elements[3] = 0.01;
          f.mesh.setMatrixAt(i, matrix);
        }
        if (phase % 4 === 0)
          f.geometry.attributes.position.array[0] = 1 + random() * 3;
      }
      same(root, cache);
    }
    assert.equal(cache.statistics().hits, 48);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("unused capacity bytes are compared and replacement buffers do not retain stale views", () => {
  const f = fixture();
  const cache = createInstanceBoundsCache();
  try {
    f.mesh.count = 2;
    same(f.mesh, cache);
    f.mesh.instanceMatrix.array[7 * 16 + 12] = 900;
    same(f.mesh, cache);
    assert.equal(cache.statistics().hits, 0);
    const bytes = cache.statistics().retainedBytes;
    f.mesh.instanceMatrix.array = new Float32Array(f.mesh.instanceMatrix.array);
    same(f.mesh, cache);
    assert.equal(cache.statistics().hits, 0);
    assert.equal(cache.statistics().retainedBytes, bytes);
    assert.equal(cache.statistics().entries, 1);
    same(f.mesh, cache);
    assert.equal(cache.statistics().hits, 1);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("visibility and transparent materials do not resurrect cached geometry", () => {
  const f = fixture();
  const root = new THREE.Group();
  root.add(f.mesh);
  const cache = createInstanceBoundsCache();
  try {
    same(root, cache);
    f.mesh.visible = false;
    assert(same(root, cache).isEmpty());
    f.mesh.visible = true;
    f.material.transparent = true;
    f.material.opacity = 0;
    assert(same(root, cache).isEmpty());
    f.material.opacity = 0.5;
    same(root, cache);
    root.visible = false;
    assert(same(root, cache).isEmpty());
    root.visible = true;
    same(root, cache);
    assert.equal(cache.statistics().hits, 2);
    f.mesh.count = 0;
    assert(same(root, cache).isEmpty());
    assert.equal(cache.statistics().entries, 0);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("custom matrix accessors retain the original per-instance calls", () => {
  const f = fixture();
  const cache = createInstanceBoundsCache();
  try {
    same(f.mesh, cache);
    const original = f.mesh.getMatrixAt;
    let reads = 0;
    Object.defineProperty(f.mesh, "getMatrixAt", {
      configurable: true,
      get() {
        reads++;
        return original;
      },
    });
    const expected = visibleProcessBounds(f.mesh);
    assert.equal(reads, f.mesh.count);
    reads = 0;
    const actual = visibleProcessBounds(f.mesh, new THREE.Box3(), cache);
    assert.equal(reads, f.mesh.count);
    assert.deepEqual(actual, expected);
    assert.equal(cache.statistics().entries, 0);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("shared matrix storage always takes the uncached path", () => {
  const f = fixture();
  const cache = createInstanceBoundsCache();
  try {
    const original = f.mesh.instanceMatrix.array;
    const shared = new Float32Array(new SharedArrayBuffer(original.byteLength));
    shared.set(original);
    f.mesh.instanceMatrix.array = shared;
    same(f.mesh, cache);
    same(f.mesh, cache);
    assert.equal(cache.statistics().entries, 0);
    assert.equal(cache.statistics().hits, 0);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("projective transforms and nonfinite data preserve the uncached result", () => {
  const f = fixture();
  const cache = createInstanceBoundsCache();
  try {
    f.mesh.instanceMatrix.array[3] = 0.04;
    same(f.mesh, cache);
    same(f.mesh, cache);
    assert.equal(cache.statistics().hits, 1);
    f.mesh.instanceMatrix.array[0] = NaN;
    same(f.mesh, cache);
    assert.equal(cache.statistics().entries, 0);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("snapshot bytes and entry counts stay bounded and clear releases every reference", () => {
  const a = fixture();
  const b = fixture();
  const bytes = a.mesh.instanceMatrix.array.byteLength + 16 * 8;
  const cache = createInstanceBoundsCache({ byteLimit: bytes, entryLimit: 1 });
  try {
    same(a.mesh, cache);
    same(b.mesh, cache);
    assert.equal(cache.statistics().retainedBytes, bytes);
    assert.equal(cache.statistics().entries, 1);
    same(a.mesh, cache);
    assert.equal(cache.statistics().hits, 1);
    cache.clear();
    cache.clear();
    assert.equal(cache.statistics().retainedBytes, 0);
    assert.equal(cache.statistics().entries, 0);
    const disabled = createInstanceBoundsCache({ byteLimit: 0, entryLimit: 0 });
    same(a.mesh, disabled);
    assert.equal(disabled.statistics().entries, 0);
    for (const value of [-1, 1.5, NaN, Infinity])
      assert.throws(() => createInstanceBoundsCache({ byteLimit: value }));
  } finally {
    cache.clear();
    a.dispose();
    b.dispose();
  }
});

test("unchanged inherited math data methods remain cacheable", () => {
  const f = fixture();
  const cache = createInstanceBoundsCache();
  const prototype = THREE.Vector3.prototype;
  const original = Object.getOwnPropertyDescriptor(prototype, "applyMatrix4");
  const parent = Object.getPrototypeOf(prototype);
  const inherited = Object.create(parent);
  Object.defineProperty(inherited, "applyMatrix4", original);
  try {
    delete prototype.applyMatrix4;
    Object.setPrototypeOf(prototype, inherited);
    same(f.mesh, cache);
    same(f.mesh, cache);
    assert.equal(cache.statistics().hits, 1);
  } finally {
    Object.setPrototypeOf(prototype, parent);
    Object.defineProperty(prototype, "applyMatrix4", original);
    cache.clear();
    f.dispose();
  }
});
