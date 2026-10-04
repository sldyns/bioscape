import assert from "node:assert/strict";
import * as THREE from "three";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const override = process.env.BIOSCAPE_SECRETION_LABEL_BASELINE;
const { default: definition } = await import(
  override
    ? pathToFileURL(resolve(override))
    : new URL("../src/processes/secretionProcess.js", import.meta.url)
);
const model = definition.create();
const golgi = model.group.children.filter(
  (o) => o.name === "secretory-cisterna",
);
const er = model.group.children.find((o) =>
  o.children.some((child) => child.name === "ER-ribosome-large-subunit"),
);
const erBody = er.children
  .find((o) => o.name === "secretory-cisterna")
  .getObjectByName("cisterna-body");
const membrane = model.group.children
  .filter((o) => o.geometry?.type === "ShapeGeometry")
  .at(-1);
const point = new THREE.Vector3();
let maximum = 0;
function check(index, surface, context) {
  const target = new THREE.Vector3().fromArray(model.labels[index].position);
  const positions = surface.geometry.attributes.position;
  let distance = Infinity;
  for (let i = 0; i < positions.count; i++)
    distance = Math.min(
      distance,
      point
        .fromBufferAttribute(positions, i)
        .applyMatrix4(surface.matrixWorld)
        .distanceTo(target),
    );
  maximum = Math.max(maximum, distance);
  assert(
    distance < 1e-6,
    `${context}: leader misses actual membrane surface by ${distance}`,
  );
}
const samples = [
  ...Array.from({ length: 101 }, (_, i) => i / 100),
  0.42,
  0.495,
  0.545,
  0.595,
  0.665,
  0.78,
  0.899999,
  0.9,
  0.925,
  0.992,
];
for (const p of samples) {
  model.update(p);
  model.group.updateMatrixWorld(true);
  const faces = golgi
    .filter(
      (o) =>
        o.visible &&
        o.getObjectByName("cisterna-body").material.opacity > 0.068,
    )
    .sort((a, b) => a.position.x - b.position.x);
  check(0, erBody, `p=${p} ER`);
  check(1, faces[0].getObjectByName("cisterna-body"), `p=${p} cis face`);
  check(2, faces.at(-1).getObjectByName("cisterna-body"), `p=${p} trans face`);
  check(3, membrane, `p=${p} plasma membrane`);
  const expected = JSON.stringify(model.labels);
  model.update(0.97);
  model.update(0.02);
  model.update(p);
  assert.equal(
    JSON.stringify(model.labels),
    expected,
    `p=${p}: face anchors must reconstruct after arbitrary seeks`,
  );
}
console.log(
  `Secretion labels: ${samples.length * 4} actual membrane surface checks PASS; max distance ${maximum}; maturation/recycling/fusion and arbitrary seeks`,
);
