import assert from "node:assert/strict";
import * as T from "three";
import {
  buildNeuron,
  neuronInternodes,
  neuronAxonSampling,
} from "../src/compare/models/neuron.js";
const ids = [
  "neuron",
  "neuronSoma",
  "neuronNucleus",
  "neuronDendrites",
  "neuronAxon",
  "neuronMyelin",
  "neuronNodes",
  "neuronTerminals",
];
const results = [];
for (const id of ids) {
  const g = buildNeuron(id);
  let vertices = 0,
    triangles = 0;
  g.traverse((o) => {
    if (!o.isMesh) return;
    assert(!o.isInstancedMesh);
    assert(ids.includes(o.userData.hitId));
    assert(!o.userData.cap || !o.userData.cutOnly);
    assert(o.geometry.attributes.position.count > 0);
    for (const name of ["position", "normal", "uv"])
      for (const n of o.geometry.attributes[name].array)
        assert(Number.isFinite(n));
    vertices += o.geometry.attributes.position.count;
    triangles +=
      (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3;
  });
  const bounds = new T.Box3().setFromObject(g),
    size = bounds.getSize(new T.Vector3());
  assert(Math.max(...size.toArray()) >= 2);
  assert(Math.max(...size.toArray()) < 20);
  assert(vertices < 350000);
  if (id !== "neuron" && id !== "neuronDendrites") {
    assert(g.children.some((o) => o.userData.cap));
    assert(g.children.some((o) => o.userData.cutOnly));
  }
  // Same route should produce stable allocations and geometry, with no random placement.
  const repeat = buildNeuron(id);
  assert.equal(repeat.children.length, g.children.length);
  for (let i = 0; i < g.children.length; i++)
    assert.deepEqual(
      g.children[i].geometry.attributes.position.array,
      repeat.children[i].geometry.attributes.position.array,
    );
  for (const a of g.userData.landmarks) {
    assert.equal(typeof a.zh, "string");
    assert.equal(typeof a.en, "string");
    assert(a.position.every(Number.isFinite));
  }
  results.push({
    id,
    meshes: g.children.length,
    vertices,
    triangles,
    extent: size.toArray().map((n) => +n.toFixed(2)),
  });
  for (const group of [g, repeat])
    group.traverse((o) => {
      if (o.isMesh) {
        o.geometry.dispose();
        o.material.dispose();
      }
    });
}
assert(
  neuronInternodes.every(
    (s, i) => s.start < s.end && (!i || neuronInternodes[i - 1].end < s.start),
  ),
);
assert(neuronInternodes.at(-1).end < 1);
const g = buildNeuron();
assert.equal(g.userData.biology.axons, 1);
assert.equal(g.userData.biology.nodes, 4);
assert(g.userData.biology.primaryDendrites >= 5);
// One mesh includes the uninterrupted full axonal centerline from soma to arbor.
const axon = g.children.find(
  (o) =>
    o.userData.hitId === "neuronAxon" &&
    o.material.color.getHexString() === new T.Color("#d9b67c").getHexString(),
);
assert(axon);
axon.geometry.computeBoundingBox();
assert(axon.geometry.boundingBox.min.x < -1.5);
assert(axon.geometry.boundingBox.max.x > 3.4);
const { longitudinalSegments: steps, radialSegments: radial } =
  neuronAxonSampling;
const points = axon.geometry.attributes.position;
assert.equal(points.count, (steps + 1) * (radial + 1));
const centerline = new T.CatmullRomCurve3(
  g.userData.biology.continuousAxon.map((p) => new T.Vector3(...p)),
);
for (let i = 0; i <= steps; i++) {
  const mean = new T.Vector3();
  for (let j = 0; j < radial; j++)
    mean.add(new T.Vector3().fromBufferAttribute(points, i * (radial + 1) + j));
  mean.divideScalar(radial);
  assert(
    mean.distanceTo(centerline.getPointAt(i / steps)) < 1e-6,
    `axon ring ${i} follows continuous centerline`,
  );
  for (let j = 0; j < radial; j++) {
    const radius = new T.Vector3()
      .fromBufferAttribute(points, i * (radial + 1) + j)
      .distanceTo(mean);
    assert(radius > 0.06 && radius < 0.22);
  }
}
// Every adjacent ring is connected by indexed triangles, including all four nodal gaps.
const index = axon.geometry.index.array;
const bridges = new Set();
for (let i = 0; i < index.length; i += 3) {
  const rings = [index[i], index[i + 1], index[i + 2]].map((n) =>
      Math.floor(n / (radial + 1)),
    ),
    lo = Math.min(...rings),
    hi = Math.max(...rings);
  if (hi === lo + 1) bridges.add(lo);
}
assert.equal(bridges.size, steps);
for (let k = 0; k < neuronInternodes.length - 1; k++) {
  const a = Math.floor(neuronInternodes[k].end * steps),
    b = Math.ceil(neuronInternodes[k + 1].start * steps);
  for (let ring = a; ring < b; ring++)
    assert(bridges.has(ring), "axon spans nodal gap");
}
// All nuclear mesh vertices lie strictly inside the minimum soma envelope.
g.traverse((o) => {
  if (!o.isMesh || o.userData.hitId !== "neuronNucleus") return;
  const a = o.geometry.attributes.position;
  for (let i = 0; i < a.count; i++) {
    const x = (a.getX(i) + 1.83) / 0.73,
      y = (a.getY(i) - 0.13) / 0.67,
      z = a.getZ(i) / 0.49;
    assert(
      x * x + y * y + z * z < 0.84,
      "nucleus contained inside soma despite envelope irregularity",
    );
  }
});
console.table(results);
console.log(
  "Neuron finite buffers, morphology invariants and deterministic allocations passed. Rendered acceptance remains separate.",
);
