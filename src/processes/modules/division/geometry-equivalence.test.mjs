import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { divisionKit } from "./divisionShapes.js";
import { germCellMembrane } from "./germCellMembrane.js";
import meiosis from "./meiosisProcess.js";

const references = JSON.parse(
  readFileSync(
    new URL("./geometry-equivalence-baseline.json", import.meta.url),
    "utf8",
  ),
);
function updateNumbers(hash, numbers) {
  const values = new Float64Array(numbers);
  hash.update(Buffer.from(values.buffer));
}
function surfaceHash(geometry) {
  const hash = createHash("sha256");
  for (const name of ["position", "normal"]) {
    const array = geometry.attributes[name].array;
    assert(array.every(Number.isFinite));
    hash.update(Buffer.from(array.buffer, array.byteOffset, array.byteLength));
  }
  updateNumbers(hash, [
    geometry.drawRange.start,
    geometry.drawRange.count,
    ...geometry.boundingBox.min.toArray(),
    ...geometry.boundingBox.max.toArray(),
    ...geometry.boundingSphere.center.toArray(),
    geometry.boundingSphere.radius,
  ]);
  return hash.digest("hex");
}
const membrane = germCellMembrane(divisionKit());
const resources = membrane.group.children.map((mesh) => [
  mesh.uuid,
  mesh.geometry.uuid,
  mesh.material.uuid,
  mesh.geometry.attributes.position,
  mesh.geometry.attributes.normal,
]);
for (const reference of references.states) {
  const [first, second] = reference.parameters;
  membrane.update(first, second);
  assert.deepEqual(
    membrane.group.children.map(({ geometry }) => surfaceHash(geometry)),
    reference.layers,
    `complete membrane buffers, draw ranges and bounds match frozen unsymmetrized output at ${first}/${second}`,
  );
  membrane.update(1, 0.8743);
  membrane.update(0.1137, 0);
  membrane.update(first, second);
  assert.deepEqual(
    membrane.group.children.map(({ geometry }) => surfaceHash(geometry)),
    reference.layers,
  );
  membrane.group.children.forEach((mesh, i) => {
    assert.deepEqual(
      [mesh.uuid, mesh.geometry.uuid, mesh.material.uuid],
      resources[i].slice(0, 3),
    );
    assert.equal(mesh.geometry.attributes.position, resources[i][3]);
    assert.equal(mesh.geometry.attributes.normal, resources[i][4]);
  });
}

function chromatidState(group) {
  const hash = createHash("sha256"),
    versions = [];
  group.traverse((object) => {
    for (const attribute of [
      object.geometry?.attributes.position,
      object.geometry?.attributes.normal,
      object.instanceMatrix,
    ]) {
      if (!attribute) continue;
      const array = attribute.array;
      hash.update(
        Buffer.from(array.buffer, array.byteOffset, array.byteLength),
      );
      versions.push(attribute.version);
    }
  });
  return { hash: hash.digest("hex"), versions };
}
let restChecks = 0;
for (const side of [-1, 1])
  for (const telocentric of [false, true]) {
    const kit = divisionKit(),
      parent = new THREE.Group();
    parent.position.set(0.73, -0.41, 0.22);
    parent.rotation.set(0.21, -0.37, 0.16);
    parent.scale.set(1.12, 0.91, 1.07);
    parent.add(kit.group);
    kit.group.position.set(-0.13, 0.19, -0.08);
    kit.group.rotation.set(0.04, 0.12, -0.09);
    const c = kit.chromatid(side, 0.65, kit.green, kit.group, { telocentric });
    c.group.position.set(side * 1.12, 0.63, 0.24);
    c.group.rotation.z = 0.37;
    c.group.scale.setScalar(0.87);
    for (const deformation of [-0.47, 0, 0.31])
      for (const y of [0, c.exchangeY, 0.65]) {
        c.setDeflection(0);
        const expected = c.axisPoint(y).toArray();
        c.setDeflection(deformation);
        const before = chromatidState(c.group);
        assert.deepEqual(
          c.restAxisPoint(y).toArray(),
          expected,
          "rest-axis query keeps the exact old world/model roundtrip",
        );
        assert.deepEqual(
          chromatidState(c.group),
          before,
          "rest-axis query must not rewrite deformation buffers or dirty them",
        );
        restChecks++;
      }
  }

// No shape changes during the established crossover plateau. Rebuilding to
// zero and back produces the same picture but needlessly rewrites these buffers.
const plateau = meiosis.create();
const versions = () => {
  const state = [];
  plateau.group.traverse((object) => {
    if (object.name === "condensed-chromatin-chromatid")
      state.push(chromatidState(object));
  });
  return state;
};
plateau.update(0.3);
const steady = versions();
for (const progress of [0.3119, 0.3, 0.3371]) {
  plateau.update(progress);
  assert.deepEqual(
    versions(),
    steady,
    "unchanged crossover shapes are not rebuilt between equal-deformation poses",
  );
}
plateau.update(0.4731);
assert.notDeepEqual(
  versions().map((entry) => entry.hash),
  steady.map((entry) => entry.hash),
  "actual homolog relaxation still changes chromosome geometry",
);
console.log(
  `Division geometry equivalence PASS: ${references.states.length} frozen full-buffer membrane states and reverse seeks; ${restChecks} exact non-mutating rest-axis queries; unchanged crossover shapes retain buffer versions.`,
);
