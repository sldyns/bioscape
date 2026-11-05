import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { createInstanceBoundsCache } from "../src/processes/instanceBoundsCache.js";
import { visibleProcessBounds } from "../src/processes/sceneBounds.js";

const makeCache = (options) =>
  createInstanceBoundsCache({ cacheMeshBounds: true, ...options });
function fixture(attribute) {
  const values = Array.from(
    { length: 47 * 3 },
    (_, i) => Math.sin(i * 0.731) * 3 + (i % 3) * 0.17,
  );
  const position = attribute ?? new THREE.Float32BufferAttribute(values, 3);
  const geometry = new THREE.BufferGeometry().setAttribute(
    "position",
    position,
  );
  const material = new THREE.MeshBasicMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.set(0.27, -0.41, 0.19);
  const root = new THREE.Group();
  root.add(mesh);
  return {
    root,
    mesh,
    geometry,
    position,
    material,
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

// Independent complete per-vertex oracle. It has no cache, diagonal shortcut,
// buffer fingerprint, or reuse of previously computed ordinary-mesh bounds.
function oracle(root) {
  root.updateWorldMatrix(true, true);
  const result = new THREE.Box3(),
    vertex = new THREE.Vector3();
  const visit = (object) => {
    if (!object.visible) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    const drawable = materials.some(
      (m) => m && m.visible && !(m.transparent && m.opacity === 0),
    );
    const position = object.geometry?.attributes.position;
    if (position && drawable) {
      if (object.isInstancedMesh) {
        object.geometry.computeBoundingBox();
        const instance = new THREE.Matrix4(),
          world = new THREE.Matrix4();
        for (let i = 0; i < object.count; i++) {
          object.getMatrixAt(i, instance);
          world.multiplyMatrices(object.matrixWorld, instance);
          result.union(object.geometry.boundingBox.clone().applyMatrix4(world));
        }
      } else
        for (let i = 0; i < position.count; i++)
          result.expandByPoint(
            vertex
              .fromBufferAttribute(position, i)
              .applyMatrix4(object.matrixWorld),
          );
    }
    object.children.forEach(visit);
  };
  visit(root);
  return result;
}
function bytes(box) {
  return Buffer.from(
    new Float64Array([...box.min.toArray(), ...box.max.toArray()]).buffer,
  );
}
function same(root, cache) {
  const expected = oracle(root);
  const actual = visibleProcessBounds(root, new THREE.Box3(), cache);
  assert.equal(bytes(actual).toString("hex"), bytes(expected).toString("hex"));
  return actual;
}

test("unchanged native ordinary-mesh world bounds are reused and all scratch is released", () => {
  const f = fixture(),
    cache = makeCache();
  try {
    same(f.root, cache);
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, 1);
    assert.equal(cache.statistics().meshEntries, 1);
    assert.equal(cache.statistics().instanceEntries, 0);
    assert.equal(
      cache.statistics().retainedBytes,
      f.position.array.byteLength + 128,
    );
    cache.clear();
    assert.equal(cache.statistics().entries, 0);
    assert.equal(cache.statistics().retainedBytes, 0);
  } finally {
    f.dispose();
  }
});

test("96 deterministic affine and projective states retain exact original vertex extrema", () => {
  const f = fixture(),
    cache = makeCache();
  f.mesh.matrixAutoUpdate = false;
  try {
    for (let i = 0; i < 96; i++) {
      f.mesh.matrix.compose(
        new THREE.Vector3(Math.sin(i), 0.2 * i, Math.cos(i)),
        new THREE.Quaternion().setFromEuler(
          new THREE.Euler(0.17 * i, -0.11 * i, 0.07 * i),
        ),
        new THREE.Vector3(i % 3 ? 1.2 : -0.7, 0.8, 1.4),
      );
      if (i % 4 === 0) {
        f.mesh.matrix.elements[3] = 0.0007;
        f.mesh.matrix.elements[7] = -0.0003;
      }
      if (i % 5 === 0) f.position.array[i % f.position.array.length] += 0.023;
      same(f.root, cache);
      same(f.root, cache);
    }
    assert.equal(cache.statistics().meshHits, 96);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("unmarked position edits invalidate reuse without version or needsUpdate", () => {
  const f = fixture(),
    cache = makeCache();
  try {
    same(f.root, cache);
    same(f.root, cache);
    const hits = cache.statistics().meshHits,
      version = f.position.version;
    f.position.array[0] += 17;
    same(f.root, cache);
    assert.equal(f.position.version, version);
    assert.equal(cache.statistics().meshHits, hits);
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, hits + 1);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("all16 world values, parent transforms and replacement attributes are checked", () => {
  const f = fixture(),
    cache = makeCache();
  try {
    same(f.root, cache);
    const hits = cache.statistics().meshHits;
    f.root.position.set(3, -2, 1);
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, hits);
    f.mesh.matrixAutoUpdate = false;
    f.mesh.updateMatrix();
    f.mesh.matrix.elements[3] = 0.001;
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, hits);
    f.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [...f.position.array].map((x) => x + 0.1),
        3,
      ),
    );
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, hits);
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, hits + 1);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("unused capacity, signed-zero raw bits and unmarked count edits invalidate", () => {
  const f = fixture(new THREE.BufferAttribute(new Float32Array(27), 3)),
    cache = makeCache();
  f.position.array.set([0, 1, 2, 3, 2, 1, -1, -2, -3]);
  f.position.count = 3;
  try {
    same(f.root, cache);
    const hits = cache.statistics().meshHits;
    new Uint32Array(f.position.array.buffer)[0] = 0x80000000;
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, hits);
    f.position.array[26] = 19;
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, hits);
    f.position.count = 4;
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, hits);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("visibility and material changes never reveal a hidden cached branch", () => {
  const f = fixture(),
    cache = makeCache();
  try {
    same(f.root, cache);
    f.root.visible = false;
    same(f.root, cache);
    f.position.array[0] += 12;
    f.root.visible = true;
    same(f.root, cache);
    f.material.transparent = true;
    f.material.opacity = 0;
    same(f.root, cache);
    f.material.opacity = 0.5;
    same(f.root, cache);
    assert(cache.statistics().meshHits > 0);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("ordinary bounds preserve the original sampled-position treatment of stale boxes and morph metadata", () => {
  const f = fixture(),
    cache = makeCache();
  try {
    same(f.root, cache);
    f.geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3(-1e9, -1e9, -1e9),
      new THREE.Vector3(1e9, 1e9, 1e9),
    );
    f.geometry.morphAttributes.position = [
      new THREE.Float32BufferAttribute(
        [...f.position.array].map((x) => x + 500),
        3,
      ),
    ];
    f.geometry.morphTargetsRelative = true;
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, 1);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("custom position accessors retain the complete original read count", () => {
  const f = fixture(),
    cache = makeCache();
  let calls = 0;
  try {
    same(f.root, cache);
    Object.defineProperty(f.position, "getX", {
      configurable: true,
      get() {
        calls++;
        return (i) => this.array[i * 3];
      },
    });
    const expected = oracle(f.root);
    calls = 0;
    const actual = visibleProcessBounds(f.root, new THREE.Box3(), cache);
    assert.equal(
      bytes(actual).toString("hex"),
      bytes(expected).toString("hex"),
    );
    assert.equal(calls, f.position.count);
    assert.equal(cache.statistics().meshEntries, 0);
    assert.equal(cache.statistics().retainedBytes, 0);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("changed native vector methods fall back and restore without stale reuse", () => {
  const f = fixture(),
    cache = makeCache(),
    original = THREE.Vector3.prototype.fromBufferAttribute;
  let calls = 0;
  try {
    same(f.root, cache);
    THREE.Vector3.prototype.fromBufferAttribute = function (...args) {
      calls++;
      return original.apply(this, args);
    };
    same(f.root, cache);
    assert.equal(calls, f.position.count * 2);
    assert.equal(cache.statistics().meshEntries, 0);
  } finally {
    THREE.Vector3.prototype.fromBufferAttribute = original;
    cache.clear();
    f.dispose();
  }
});

test("inherited unchanged native BufferAttribute methods remain eligible", () => {
  class Position extends THREE.BufferAttribute {}
  const f = fixture(
      new Position(new Float32Array([0, 0, 0, 1, 2, 3, -1, -2, -3]), 3),
    ),
    cache = makeCache();
  try {
    same(f.root, cache);
    same(f.root, cache);
    assert.equal(cache.statistics().meshHits, 1);
  } finally {
    cache.clear();
    f.dispose();
  }
});

test("normalized attributes and shared or resizable buffers use the original path", () => {
  const attributes = [
    new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 2, 3]), 3, true),
    new THREE.BufferAttribute(new Float32Array(new SharedArrayBuffer(24)), 3),
  ];
  const resizable = new ArrayBuffer(24, { maxByteLength: 48 });
  if (resizable.resizable === true)
    attributes.push(new THREE.BufferAttribute(new Float32Array(resizable), 3));
  for (const attribute of attributes) {
    const f = fixture(attribute),
      cache = makeCache();
    try {
      same(f.root, cache);
      same(f.root, cache);
      assert.equal(cache.statistics().entries, 0);
      assert.equal(cache.statistics().retainedBytes, 0);
    } finally {
      cache.clear();
      f.dispose();
    }
  }
});

test("instance and ordinary entries share the same byte and entry limits", () => {
  const f = fixture(),
    instances = new THREE.InstancedMesh(f.geometry, f.material, 1);
  instances.setMatrixAt(0, new THREE.Matrix4().makeTranslation(2, 3, 4));
  f.root.add(instances);
  try {
    for (const options of [
      { entryLimit: 1 },
      { byteLimit: f.position.array.byteLength + 128 },
    ]) {
      const cache = makeCache(options);
      try {
        same(f.root, cache);
        same(f.root, cache);
        const s = cache.statistics();
        assert.equal(s.meshEntries, 1);
        assert.equal(s.instanceEntries, 0);
        assert(s.entries <= s.entryLimit);
        assert(s.retainedBytes <= s.byteLimit);
      } finally {
        cache.clear();
        assert.equal(cache.statistics().retainedBytes, 0);
      }
    }
  } finally {
    instances.dispose();
    f.dispose();
  }
});

test("zero limits and default instance-only configuration preserve original ordinary results", () => {
  const f = fixture();
  try {
    for (const cache of [
      makeCache({ byteLimit: 0 }),
      makeCache({ entryLimit: 0 }),
      createInstanceBoundsCache(),
    ]) {
      same(f.root, cache);
      same(f.root, cache);
      assert.equal(cache.statistics().entries, 0);
      assert.equal(cache.statistics().meshHits, 0);
      cache.clear();
    }
  } finally {
    f.dispose();
  }
});
