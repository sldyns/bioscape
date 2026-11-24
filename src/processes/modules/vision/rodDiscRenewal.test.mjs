import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "node:test";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import process from "./rodDiscRenewalProcess.js";

const make = () => process.create({ rootId: "rodPhotoreceptor" });
const named = (model, name) => {
  const n = model.group.getObjectByName(name);
  assert(n, name);
  return n;
};
const tipName = "coherent distal tip packet";
const carrierName = "pre-existing sealed disc stack";
const contentsName = "old sealed discs in distal packet";
const stemName = "ciliary membrane continuous with basal folds";
const sideRay = new THREE.Vector3(-1, 0, 0);
const up = new THREE.Vector3(0, 1, 0);
const v = new THREE.Vector3();
function drawn(model, p) {
  model.update(p);
  model.group.updateMatrixWorld(true);
}
function soup(mesh) {
  return new MeshBVH(mesh.geometry.clone().applyMatrix4(mesh.matrixWorld), {
    indirect: true,
  });
}
function position(mesh, i) {
  return new THREE.Vector3()
    .fromBufferAttribute(mesh.geometry.attributes.position, i)
    .applyMatrix4(mesh.matrixWorld);
}
function allClosed(meshes) {
  const edges = new Map();
  const key = (p) => [p.x, p.y, p.z].map((x) => Math.round(x * 1e5)).join(",");
  for (const mesh of meshes) {
    const ix = mesh.geometry.index;
    for (let i = 0; i < ix.count; i += 3) {
      const [a, b, c] = [0, 1, 2].map((k) =>
        key(position(mesh, ix.getX(i + k))),
      );
      if (a === b || a === c || b === c) continue;
      for (const [u, v] of [
        [a, b],
        [b, c],
        [c, a],
      ]) {
        const edge = [u, v].sort().join("|");
        edges.set(edge, (edges.get(edge) ?? 0) + 1);
      }
    }
  }
  return edges.size > 0 && [...edges.values()].every((n) => n === 2);
}

test("open basal membranes grow continuously from the ciliary surface and seal an extracellular lumen", () => {
  const model = make(),
    base = named(model, "basal disc cohort 1");
  const top = base.getObjectByName("upper facing membrane"),
    bottom = base.getObjectByName("lower facing membrane"),
    rim = base.getObjectByName("growing disc rim");
  const section = named(model, "basal fold detail inset").getObjectByName(
    "upper facing membrane (enlarged section)",
  );
  assert.equal(section.geometry, top.geometry);
  const stem = named(model, stemName);
  let previous = -Infinity;
  for (const p of [0, 0.04, 0.085, 0.13, 0.175]) {
    drawn(model, p);
    const edge = position(top, 2),
      center = position(top, 0);
    assert(edge.x > previous);
    previous = edge.x;
    for (const contact of [
      "upper membrane connection to cilium",
      "lower membrane connection to cilium",
    ]) {
      const bridge = base.getObjectByName(contact);
      const bvh = soup(stem);
      for (let i = 1; i < 18; i += 2) {
        const hit = bvh.closestPointToPoint(position(bridge, i));
        assert(hit.distance < 0.001, `Ciliary continuity ${hit.distance}`);
      }
    }
    const ray = new THREE.Ray(
      new THREE.Vector3(1.3, base.position.y, 0),
      sideRay,
    );
    const distance = 1.3 - center.x;
    for (const surface of [
      rim,
      top,
      bottom,
      base.getObjectByName("basal outer membrane around the closed rim"),
      named(model, "outer-segment plasma membrane cutaway"),
    ]) {
      const hit = soup(surface).raycastFirst(ray, THREE.DoubleSide);
      assert(
        !hit || hit.distance >= distance,
        "An extracellular route to the basal cleft was sealed prematurely",
      );
    }
    assert(!allClosed([top, bottom, rim]));
  }
  drawn(model, 0.36);
  assert(
    allClosed([top, bottom, rim]),
    "Every welded edge of the new disc shell must have two incident triangles",
  );
  const closed = soup(rim).raycastFirst(
    new THREE.Ray(new THREE.Vector3(1.28, base.position.y, 0), sideRay),
    THREE.DoubleSide,
  );
  assert(closed && closed.point.x > 0.99);
  const inLumen = new THREE.Vector3(0, base.position.y, 0);
  assert(soup(top).raycastFirst(new THREE.Ray(inLumen, up), THREE.DoubleSide));
  assert(
    soup(bottom).raycastFirst(
      new THREE.Ray(inLumen, up.clone().negate()),
      THREE.DoubleSide,
    ),
  );
  assert(allClosed([named(model, carrierName)]));
});

test("three stable distal discs move with the old stack and the RPE packet enters a closed phagosome", () => {
  const m = make(),
    stack = named(m, carrierName),
    pack = named(m, tipName),
    discs = named(m, contentsName);
  const inner = named(m, "RPE phagocytic cup inner membrane"),
    outer = named(m, "RPE apical cuff outer membrane");
  const neck = named(m, "resealing rod tip");
  const frozen = Buffer.from(discs.instanceMatrix.array.buffer).toString("hex");
  let baseline,
    prev = -Infinity,
    finalShift,
    minimum = Infinity;
  for (let i = 0; i <= 160; i++) {
    const p = i / 160;
    drawn(m, p);
    if (!i) baseline = [pack.position.y, stack.position.y];
    assert(stack.position.y >= prev);
    prev = stack.position.y;
    const differential =
      pack.position.y - baseline[0] - (stack.position.y - baseline[1]);
    if (p <= 0.79) assert(Math.abs(differential) < 1e-10);
    if (p > 0.79) {
      assert(differential > 0);
      assert(Math.abs(position(neck, 0).x) < 1e-7);
    }
    const lumenEdge = position(inner, 5),
      cuffEdge = position(outer, 3);
    // The biological membranes share the leading lip until the cup closes.
    if (p <= 0.86) assert(lumenEdge.distanceTo(cuffEdge) < 2e-6);
    if (p > 0.86) assert(lumenEdge.y >= cuffEdge.y - 2e-6);
    if (p >= 0.5 && p <= 0.9 && i % 4 === 0) {
      const bvh = soup(inner),
        m4 = new THREE.Matrix4();
      for (const layer of [stack, discs]) {
        const first = layer === stack ? layer.count - 1 : 0;
        for (let j = first; j < layer.count; j++) {
          layer.getMatrixAt(j, m4);
          m4.premultiply(layer.matrixWorld);
          assert(
            !bvh.intersectsGeometry(layer.geometry, m4),
            `The RPE cup intersects an actual disc while wrapping the tip at ${p}`,
          );
        }
      }
    }
    if (p >= 0.9 && i % 5 === 0) {
      assert(
        allClosed([inner]),
        "The phagosome must be a closed rendered membrane",
      );
      const bvh = soup(inner),
        m4 = new THREE.Matrix4();
      for (let j = 0; j < discs.count; j++) {
        discs.getMatrixAt(j, m4);
        m4.premultiply(discs.matrixWorld);
        assert(!bvh.intersectsGeometry(discs.geometry, m4));
        const hit = bvh.closestPointToGeometry(discs.geometry, m4, {}, {});
        minimum = Math.min(minimum, hit.distance);
        const center = new THREE.Vector3().setFromMatrixPosition(m4);
        const cast = bvh.raycast(
          new THREE.Ray(
            center,
            new THREE.Vector3(0.37, 0.45, 0.81).normalize(),
          ),
          THREE.DoubleSide,
        );
        assert.equal(
          cast.length,
          1,
          "A distal disc is outside the RPE phagosome",
        );
      }
    }
    finalShift = stack.position.y - baseline[1];
  }
  assert(minimum > 0.045);
  assert.equal(discs.count, 3);
  assert.equal(stack.count, 11);
  assert(Math.abs(finalShift - 3 * 0.215) < 1e-8);
  assert.equal(
    Buffer.from(discs.instanceMatrix.array.buffer).toString("hex"),
    frozen,
  );
  assert(
    position(inner, 5).y > position(outer, 3).y + 0.1,
    "The closed phagosome must lie inside the resealed apical surface",
  );
  console.log(
    `Distal packet triangle-to-phagosome clearance ${minimum.toFixed(5)} model units.`,
  );
});

function snapshot(model) {
  model.group.updateMatrixWorld(true);
  const hash = createHash("sha256");
  const bytes = (arr) =>
    Buffer.from(arr.buffer, arr.byteOffset, arr.byteLength);
  model.group.traverse((n) => {
    hash.update(
      JSON.stringify([
        n.name,
        n.visible,
        n.matrix.elements,
        n.matrixWorld.elements,
        n.userData,
      ]),
    );
    for (const a of Object.values(n.geometry?.attributes ?? {}))
      hash.update(bytes(a.array));
    if (n.instanceMatrix) hash.update(bytes(n.instanceMatrix.array));
  });
  hash.update(JSON.stringify(model.labels));
  return hash.digest("hex");
}
test("all stages and arbitrary reverse seeks retain the full rendered state and resource identities", () => {
  assert.equal(process.id, "rodDiscRenewal");
  assert.equal(process.duration, 40);
  assert.equal(process.controls.length, 0);
  assert(process.stages.length >= 5);
  assert(
    process.stages.every((s) =>
      [s.title.zh, s.title.en, s.description.zh, s.description.en].every(
        Boolean,
      ),
    ),
  );
  const model = make(),
    nodes = [];
  model.group.traverse((n) => nodes.push([n, n.geometry, n.material]));
  const reference = new Map();
  const q = [
    0, 0.081, 0.24, 0.42, 0.64, 0.71, 0.785, 0.797, 0.83, 0.86, 0.93, 1,
  ];
  for (const p of q) {
    drawn(model, p);
    reference.set(p, snapshot(model));
  }
  assert.equal(new Set(reference.values()).size, q.length);
  for (const p of [NaN, -1, 3, ...q.toReversed(), ...q]) {
    model.update(p);
    const actual = snapshot(model);
    const clamped = Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0));
    assert.equal(actual, reference.get(clamped), `Repeat seek p=${p}`);
    const box = new THREE.Box3().setFromObject(model.group);
    const size = box.getSize(v);
    assert(size.toArray().every((n) => Number.isFinite(n) && n > 0 && n < 20));
    const current = [];
    model.group.traverse((n) => current.push(n));
    assert.deepEqual(
      current,
      nodes.map((row) => row[0]),
    );
    for (const [n, g, m] of nodes) {
      assert.equal(n.geometry, g);
      assert.equal(n.material, m);
      for (const a of Object.values(g?.attributes ?? {}))
        assert(a.array.every(Number.isFinite));
    }
    for (const l of model.labels)
      assert(l.position.every(Number.isFinite) && l.text.zh && l.text.en);
  }
});
