import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import endocytosis from "./endocytosisProcess.js";
import autophagy from "./autophagyProcess.js";
import secretion from "../../secretionProcess.js";

const matrix = new THREE.Matrix4(),
  point = new THREE.Vector3();
const center = (surface, row) => {
  const a = new THREE.Vector3().fromBufferAttribute(
    surface.children[0].geometry.attributes.position,
    row * 65 + 32,
  );
  const b = new THREE.Vector3().fromBufferAttribute(
    surface.children[1].geometry.attributes.position,
    row * 65 + 32,
  );
  return a.add(b).multiplyScalar(0.5);
};
const auto = autophagy.create();
for (const p of [0, 0.1, 0.25, 0.4]) {
  auto.update(p);
  const [outer, inner, rim] = auto.group.children;
  const a = center(rim, 0),
    b = center(rim, 8),
    m = center(rim, 4);
  assert(
    a.distanceTo(center(inner, 64)) < 1e-6,
    "rim must join inner cup exactly",
  );
  assert(
    b.distanceTo(center(outer, 64)) < 1e-6,
    "rim must join outer cup exactly",
  );
  assert(
    Math.abs(
      m.distanceTo(a.clone().add(b).multiplyScalar(0.5)) -
        (0.09 * Math.hypot(a.x, a.z)) / 1.24,
    ) < 1e-6,
    "rim must turn around a continuous rounded cross-section",
  );
}
const endo = endocytosis.create();
endo.update(0.47);
const legs = endo.group.getObjectByName("clathrin pentagon–hexagon struts");
const contacts = endo.group.getObjectByName(
  "clathrin terminal-domain contacts toward membrane adaptors",
);
assert.equal(
  legs.count,
  270,
  "90 cage edges retain three bent leg segments each",
);
assert.equal(contacts.count, 60);
let visibleContacts = 0;
for (let i = 0; i < contacts.count; i++) {
  contacts.getMatrixAt(i, matrix);
  point.setFromMatrixScale(matrix);
  if (point.x > 0.001) {
    visibleContacts++;
    assert(point.y > 0 && point.y <= 0.11 + 1e-6);
  }
}
assert(visibleContacts > 10);
const secretory = secretion.create();
let cuts = 0,
  rails = 0;
secretory.group.traverse((o) => {
  if (o.name === "cisterna-hydrophobic-cut-edge") {
    cuts++;
    const a = o.geometry.attributes.position;
    assert.equal(a.count, 98);
    for (let i = 0; i < a.count; i += 2)
      assert(Math.abs(a.getX(i + 1) - a.getX(i) - 0.036) < 1e-6);
  }
  if (o.name === "cisterna-polar-cut-leaflet") rails++;
});
assert.equal(cuts, 16);
assert.equal(rails, 32);
function snapshot(s) {
  const hash = createHash("sha256");
  s.group.traverse((o) => {
    hash.update(
      JSON.stringify([o.visible, ...o.position, ...o.scale, ...o.quaternion]),
    );
    if (o.instanceMatrix)
      hash.update(Buffer.from(o.instanceMatrix.array.buffer));
    if (o.geometry)
      hash.update(Buffer.from(o.geometry.attributes.position.array.buffer));
  });
  return hash.digest("hex");
}
const resources = [];
for (const s of [endo, auto, secretory]) {
  s.update(0.25);
  const first = snapshot(s);
  s.update(0.91);
  s.update(0);
  s.update(0.25);
  assert.equal(snapshot(s), first);
  const geometry = new Set(),
    materials = new Set();
  let nodes = 0,
    bytes = 0,
    instances = 0;
  s.group.traverse((o) => {
    nodes++;
    if (o.instanceMatrix) {
      bytes += o.instanceMatrix.array.byteLength;
      instances += o.count;
    }
    if (o.geometry && !geometry.has(o.geometry)) {
      geometry.add(o.geometry);
      for (const a of Object.values(o.geometry.attributes))
        bytes += a.array.byteLength;
      bytes += o.geometry.index?.array.byteLength || 0;
    }
    for (const m of [o.material].flat()) if (m) materials.add(m);
  });
  resources.push({
    nodes,
    geometries: geometry.size,
    materials: materials.size,
    bytes,
    instances,
  });
}
console.log(
  JSON.stringify({
    result:
      "rounded rim, bent lattice, paired cisternal cut edges, deterministic seeks PASS",
    order: ["endocytosis", "autophagy", "secretion"],
    resources,
  }),
);
