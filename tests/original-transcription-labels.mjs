import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
const definition = (
  await import(
    process.env.BIOSCAPE_TRANSCRIPTION_REVIEW_MODULE
      ? pathToFileURL(process.env.BIOSCAPE_TRANSCRIPTION_REVIEW_MODULE).href
      : "../src/processes/transcriptionProcess.js"
  )
).default;
const model = definition.create();
const matrix = new THREE.Matrix4(),
  target = new THREE.Vector3();
const close = (index, point, message) =>
  assert(
    new THREE.Vector3(...model.labels[index].position).distanceTo(point) < 5e-7,
    message,
  );
const get = (name) => model.group.getObjectByName(name);
function instanceEnd(name, index, y) {
  get(name).getMatrixAt(index, matrix);
  return new THREE.Vector3(0, y, 0)
    .applyMatrix4(matrix)
    .applyMatrix4(get(name).matrixWorld);
}
const inventory = () => {
  let objects = 0;
  const geometries = new Set(),
    materials = new Set();
  model.group.traverse((o) => {
    objects++;
    if (o.geometry) geometries.add(o.geometry);
    if (o.material) materials.add(o.material);
  });
  return [objects, geometries.size, materials.size];
};
const original = inventory();
let checks = 0;
for (const progress of [
  0,
  0.5,
  0.9,
  1,
  0.27,
  0.86,
  0.42,
  0.995,
  0.001,
  ...Array.from({ length: 101 }, (_, i) => i / 100),
]) {
  model.update(progress);
  model.group.updateMatrixWorld(true);
  for (const [name, left, right] of [
    ["template-backbone", 1, 2],
    ["coding-backbone", 3, 4],
  ]) {
    close(left, instanceEnd(name, 0, -0.5), `${name} 3D left terminal anchor`);
    close(
      right,
      instanceEnd(name, get(name).count - 1, 0.5),
      `${name} 3D right terminal anchor`,
    );
    checks += 2;
  }
  const pol = get("RNA-polymerase-II-schematic").children[2];
  pol.getWorldPosition(target);
  close(
    6,
    target,
    "RNA polymerase label must follow the actual enzyme lobe, including recruitment and departure",
  );
  checks++;
  const bead = get("rna-nucleotides");
  bead.getMatrixAt(bead.count - 1, matrix);
  target.setFromMatrixPosition(matrix).applyMatrix4(bead.matrixWorld);
  if (model.labels[7].active) {
    close(7, target, "RNA 5-prime label must end on its retained nucleotide");
    checks++;
  }
  if (model.labels[8].active) {
    bead.getMatrixAt(0, matrix);
    target.setFromMatrixPosition(matrix).applyMatrix4(bead.matrixWorld);
    close(8, target, "Growing RNA 3-prime label must end at actual nucleotide");
    checks++;
  }
  assert.deepEqual(
    inventory(),
    original,
    "Annotation updates cannot add scene resources",
  );
}
console.log(
  `Original transcription labels: ${checks} actual endpoint/domain checks, deterministic irregular and dense states PASS`,
);
