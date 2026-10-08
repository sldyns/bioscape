import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
import {
  geometrySnapshot,
  resourceInventory,
  disposeSnapshot,
} from "./geometrySnapshot.test-support.mjs";

const definition = process.env.RPP_BASELINE_MODELS
  ? (await import(pathToFileURL(process.env.RPP_BASELINE_MODELS).href)).division
  : (await import("./parameciumDivisionProcess.js")).default;
const effective = (object) => {
  for (let p = object; p; p = p.parent) if (!p.visible) return false;
  return true;
};
const find = (scene, name) => {
  const object = scene.group.getObjectByName(name);
  assert(object, `missing ${name}`);
  return object;
};
const nuclearNames = {
  micro: [
    "dividing-micronucleus",
    "daughter-micronucleus-0",
    "daughter-micronucleus-1",
  ],
  macro: [
    "division-mother-macronucleus",
    "continuous-macronuclear-envelope",
    "daughter-macronucleus-0",
    "daughter-macronucleus-1",
  ],
};
function envelopes(scene, type) {
  scene.group.updateMatrixWorld(true);
  return nuclearNames[type].map((name) => find(scene, name)).filter(effective);
}
function vertices(meshes) {
  return meshes.flatMap((mesh) =>
    Array.from({ length: mesh.geometry.attributes.position.count }, (_, i) =>
      new THREE.Vector3()
        .fromBufferAttribute(mesh.geometry.attributes.position, i)
        .applyMatrix4(mesh.matrixWorld),
    ),
  );
}
function distance(a, b) {
  let maximum = 0;
  for (const point of a) {
    let nearest = Infinity;
    for (const candidate of b)
      nearest = Math.min(nearest, point.distanceToSquared(candidate));
    maximum = Math.max(maximum, nearest);
  }
  return Math.sqrt(maximum);
}
function components(meshes) {
  const parent = [],
    ids = new Map();
  const root = (i) => (parent[i] === i ? i : (parent[i] = root(parent[i])));
  for (const mesh of meshes) {
    const points = vertices([mesh]),
      welded = points.map((point) => {
        const key = point
          .toArray()
          .map((v) => Math.round(v * 1e6))
          .join(",");
        if (!ids.has(key)) {
          const id = parent.length;
          ids.set(key, id);
          parent.push(id);
        }
        return ids.get(key);
      }),
      index = mesh.geometry.index;
    for (let i = 0; i < index.count; i += 3) {
      const a = welded[index.getX(i)],
        b = welded[index.getX(i + 1)],
        c = welded[index.getX(i + 2)];
      parent[root(a)] = root(b);
      parent[root(a)] = root(c);
    }
  }
  return new Set(parent.map((_, i) => root(i))).size;
}

test("RPP-01: visible nuclear envelopes have continuous handoffs", () => {
  const scene = definition.create();
  for (const [at, type] of [
    [0.54, "micro"],
    [0.59, "macro"],
    [0.76, "macro"],
  ]) {
    scene.update(at - 1e-7);
    const before = vertices(envelopes(scene, type));
    scene.update(at + 1e-7);
    const after = vertices(envelopes(scene, type));
    const change = Math.max(distance(before, after), distance(after, before));
    assert(
      change < 1e-4,
      `${type} envelope jumps ${change} world units across ${at}`,
    );
  }
  disposeSnapshot(scene);
});

test("RPP-01: both outer membranes remain connected until scission", () => {
  const scene = definition.create();
  for (const [p, type, expected] of [
    [0.3, "micro", 1],
    [0.5, "micro", 1],
    [0.538, "micro", 1],
    [0.541, "micro", 2],
    [0.8, "micro", 2],
    [0.58, "macro", 1],
    [0.63, "macro", 1],
    [0.755, "macro", 1],
    [0.761, "macro", 2],
    [1, "macro", 2],
  ]) {
    scene.update(p);
    assert.equal(
      components(envelopes(scene, type)),
      expected,
      `${type} physical envelope components at ${p}`,
    );
  }
  disposeSnapshot(scene);
});

// A connected envelope can still contain cracks. Weld actual triangle edges
// and permit only the intentionally open z=0 cutaway boundary; also check
// outward triangle winding and the inner leaflet's depth against real faces.
function membraneEdges(meshes) {
  const edges = new Map();
  let triangles = 0;
  for (const mesh of meshes) {
    const points = vertices([mesh]),
      index = mesh.geometry.index,
      key = points.map((v) =>
        v
          .toArray()
          .map((x) => Math.round(x * 1e7))
          .join(","),
      ),
      local = mesh.geometry.attributes.position,
      normals = mesh.geometry.attributes.normal,
      a = new THREE.Vector3(),
      b = new THREE.Vector3(),
      c = new THREE.Vector3(),
      ab = new THREE.Vector3(),
      ac = new THREE.Vector3(),
      face = new THREE.Vector3(),
      center = new THREE.Vector3(),
      normal = new THREE.Vector3();
    for (let i = 0; i < index.count; i += 3) {
      const ids = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
      a.fromBufferAttribute(local, ids[0]);
      b.fromBufferAttribute(local, ids[1]);
      c.fromBufferAttribute(local, ids[2]);
      face.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
      if (face.lengthSq() < 1e-18 || new Set(ids.map((j) => key[j])).size < 3)
        continue;
      triangles++;
      center
        .copy(a)
        .add(b)
        .add(c)
        .multiplyScalar(1 / 3);
      assert(
        face.x * center.x + face.z * center.z >= -1e-10,
        "envelope triangle folds inward",
      );
      for (const j of ids) {
        normal.fromBufferAttribute(normals, j);
        assert(
          normal.toArray().every(Number.isFinite),
          "finite envelope normals",
        );
        assert(
          normal.lengthSq() > 0.1,
          "used membrane vertex needs a nonzero normal",
        );
        assert(
          normal.dot(face) >= -1e-12,
          "membrane vertex normal turns against its triangle",
        );
      }
      for (let e = 0; e < 3; e++) {
        const first = ids[e],
          second = ids[(e + 1) % 3],
          edgeKey = [key[first], key[second]].sort().join("|"),
          edge = edges.get(edgeKey) ?? {
            count: 0,
            a: points[first],
            b: points[second],
          };
        edge.count++;
        edges.set(edgeKey, edge);
      }
    }
  }
  const cutZ = new THREE.Vector3().setFromMatrixPosition(
      meshes[0].matrixWorld,
    ).z,
    boundaries = [...edges.values()].filter((edge) => edge.count === 1),
    cracks = boundaries.filter(
      (edge) =>
        Math.abs(edge.a.z - cutZ) > 1e-5 || Math.abs(edge.b.z - cutZ) > 1e-5,
    );
  return { cracks, triangles };
}

test("RPP-01: both leaflets have no equatorial cracks or inverted faces through constriction", () => {
  const scene = definition.create(),
    samples = [
      ...new Set([
        ...Array.from({ length: 101 }, (_, i) => i / 100),
        0.4799,
        0.4801,
        0.515,
        0.525,
        0.535,
        0.538,
        0.5399,
        0.54,
        0.5401,
        0.5499,
        0.5501,
        0.5899,
        0.59,
        0.5901,
        0.735,
        0.745,
        0.755,
        0.7599,
        0.76,
        0.7601,
      ]),
    ].sort((a, b) => a - b),
    ray = new THREE.Raycaster(),
    direction = new THREE.Vector3(0, 0, -1);
  let testedTriangles = 0,
    minimumThickness = Infinity,
    depthChecks = 0;
  for (const p of samples) {
    scene.update(p);
    scene.group.updateMatrixWorld(true);
    for (const type of ["micro", "macro"]) {
      const outer = envelopes(scene, type),
        inner = outer.map((mesh) => mesh.children[0]);
      for (const layer of [outer, inner]) {
        const result = membraneEdges(layer);
        assert.equal(
          result.cracks.length,
          0,
          `${type} unexpected membrane boundary at ${p}`,
        );
        testedTriangles += result.triangles;
      }
      for (const mesh of inner) {
        const points = vertices([mesh]);
        // Each nonpolar latitude is sampled at the back meridian, where the
        // z ray is transverse to the actual triangles and avoids cut edges.
        for (let i = 16; i < points.length; i += 33) {
          const from = points[i];
          if (
            Math.abs(
              from.z -
                new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld).z,
            ) < 1e-5
          )
            continue;
          ray.set(from, direction);
          let hits = ray
            .intersectObjects(outer, false)
            .filter((hit) => hit.distance > 1e-8);
          // Longitude/neck seams are shared triangle edges. Three's strict
          // barycentric ray test can miss an edge by roundoff; a 1e-7-world-unit
          // tangent offset resolves that ambiguity without bridging a gap.
          for (const offset of [1e-7, -1e-7]) {
            if (hits.length) break;
            ray.set(
              from.clone().add(new THREE.Vector3(1e-7, offset, 0)),
              direction,
            );
            hits = ray
              .intersectObjects(outer, false)
              .filter((hit) => hit.distance > 1e-8);
          }
          assert(
            hits.length,
            `${type} inner leaflet exits outer envelope at ${p}`,
          );
          minimumThickness = Math.min(minimumThickness, hits[0].distance);
          depthChecks++;
        }
      }
    }
  }
  assert(
    minimumThickness > 1e-5,
    `membrane thickness collapses: ${minimumThickness}`,
  );
  assert(depthChecks > 9000);
  scene.update(0.59);
  const expected = geometrySnapshot(scene, scene.group).sha256;
  scene.update(1);
  scene.update(0);
  scene.update(0.59);
  assert.equal(
    geometrySnapshot(scene, scene.group).sha256,
    expected,
    "seam topology/normals also seek deterministically",
  );
  console.log(
    `RPP-01 membrane mesh: ${samples.length} times, ${testedTriangles} actual faces, ${depthChecks} inner/outer depth rays; minimum positive thickness ${minimumThickness}`,
  );
  disposeSnapshot(scene);
});

test("RPP-01: tracked chromosomes persist into the same daughters without a jump", () => {
  const scene = definition.create(),
    chromatids = [];
  scene.group.traverse((o) => {
    if (o.name.startsWith("segregating-chromatid-")) chromatids.push(o);
  });
  assert.equal(chromatids.length, 8);
  scene.update(0.54 - 1e-7);
  scene.group.updateMatrixWorld(true);
  const before = vertices(chromatids);
  scene.update(0.54 + 1e-7);
  scene.group.updateMatrixWorld(true);
  assert(
    chromatids.every(effective),
    "parent chromosomes must not disappear at nuclear scission",
  );
  const after = vertices(chromatids);
  assert(Math.max(...before.map((v, i) => v.distanceTo(after[i]))) < 1e-4);
  for (const p of [0.54, 0.55, 0.6, 0.66, 0.8, 1]) {
    scene.update(p);
    scene.group.updateMatrixWorld(true);
    for (const object of chromatids) {
      assert(effective(object));
      const side = Number(object.name.match(/chromatid-(-?1)-/)[1]),
        daughter = find(scene, `daughter-micronucleus-${side < 0 ? 0 : 1}`),
        inverse = daughter.matrixWorld.clone().invert();
      for (const vertex of vertices([object]))
        assert(
          vertex.applyMatrix4(inverse).lengthSq() <= 1.00001,
          `tracked chromosome exits its daughter at ${p}`,
        );
    }
  }
  disposeSnapshot(scene);
});

test("RPP-01: inherited chromatin, pores and nucleoli are continuous scene objects", () => {
  const scene = definition.create();
  const sample = () => {
    scene.group.updateMatrixWorld(true);
    const rows = [];
    scene.group.traverse((o) => {
      if (
        !o.isMesh ||
        !o.name.includes("-lineage-") ||
        !o.name.includes("-content-")
      )
        return;
      assert(effective(o));
      if (o.isInstancedMesh) {
        for (let i = 0; i < o.count; i++) {
          const matrix = new THREE.Matrix4();
          o.getMatrixAt(i, matrix);
          rows.push(
            new THREE.Vector3()
              .setFromMatrixPosition(matrix)
              .applyMatrix4(o.matrixWorld),
          );
        }
      } else rows.push(...vertices([o]));
    });
    assert(
      rows.length > 10000,
      "track full inherited chromatin geometry, not only synthetic state flags",
    );
    return rows;
  };
  for (const p of [0.48, 0.54, 0.55, 0.59, 0.76]) {
    scene.update(p - 1e-7);
    const before = sample();
    scene.update(p + 1e-7);
    const after = sample();
    assert.equal(before.length, after.length);
    assert(
      Math.max(...before.map((v, i) => v.distanceTo(after[i]))) < 1e-4,
      `nuclear contents jump at ${p}`,
    );
  }
  const parent = new THREE.Group();
  parent.add(scene.group);
  const inventory = resourceInventory(scene);
  for (const p of [
    NaN,
    -1,
    0,
    0.31,
    0.479,
    0.5,
    0.539999,
    0.54,
    0.59,
    0.7,
    0.755,
    0.76,
    0.83,
    1,
    Infinity,
  ]) {
    scene.update(p);
    const expected = geometrySnapshot(scene, parent);
    scene.update(0.983);
    scene.update(0.032);
    scene.update(p);
    assert.deepEqual(
      geometrySnapshot(scene, parent),
      expected,
      `full-state seek at ${p}`,
    );
    assert.deepEqual(resourceInventory(scene), inventory);
    scene.group.traverse((o) => {
      for (const attr of Object.values(o.geometry?.attributes ?? {}))
        assert(attr.array.every(Number.isFinite));
    });
  }
  disposeSnapshot(scene);
});
