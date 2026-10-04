import assert from "node:assert/strict";
import * as THREE from "three";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const directory = process.env.BIOSCAPE_REGULATION_LABEL_BASELINE;
const definitions = await Promise.all(
  ["promoterRegulation", "enhancerRegulation"].map(async (id) => {
    const url = directory
      ? pathToFileURL(resolve(directory, `baseline-labels-${id}Process.mjs`))
      : new URL(
          `../src/processes/modules/regulation/${id}Process.js`,
          import.meta.url,
        );
    return (await import(url)).default;
  }),
);
const only = process.env.BIOSCAPE_REGULATION_LABEL_CASE;
const point = new THREE.Vector3();
let assertions = 0;
function onSurface(label, object, context) {
  assert(object?.geometry, context);
  const target = new THREE.Vector3().fromArray(label.position);
  const positions = object.geometry.attributes.position;
  let distance = Infinity;
  for (let i = 0; i < positions.count; i++)
    distance = Math.min(
      distance,
      point
        .fromBufferAttribute(positions, i)
        .applyMatrix4(object.matrixWorld)
        .distanceTo(target),
    );
  assert(
    distance < 1e-6,
    `${context}: leader misses the named mesh surface by ${distance}`,
  );
  assertions++;
}
function tubeRings(mesh) {
  const positions = mesh.geometry.attributes.position;
  const rings = [];
  for (let i = 0; i < positions.count; i += 8) {
    const center = new THREE.Vector3();
    for (let j = 0; j < 8; j++)
      center.add(point.fromBufferAttribute(positions, i + j));
    rings.push(center.divideScalar(8).applyMatrix4(mesh.matrixWorld));
  }
  return rings;
}
function rnaEnd(model, label, context) {
  const group = model.group.getObjectByName(
    "Nascent RNA — backbone and nucleotides",
  );
  assert.equal(
    label.active,
    group.visible,
    `${context}: RNA label visibility follows its molecule`,
  );
  if (group.visible) {
    const endpoint = tubeRings(group.children[0]).at(-1);
    const distance = endpoint.distanceTo(
      new THREE.Vector3().fromArray(label.position),
    );
    assert(
      distance < 1e-6,
      `${context}: 5′ label misses the actual free end by ${distance}`,
    );
    assertions++;
  }
}
function onBackbone(model, label, name, context) {
  const rings = tubeRings(model.group.getObjectByName(name));
  const target = new THREE.Vector3().fromArray(label.position);
  let distance = Infinity;
  for (let i = 1; i < rings.length; i++) {
    new THREE.Line3(rings[i - 1], rings[i]).closestPointToPoint(
      target,
      true,
      point,
    );
    distance = Math.min(distance, point.distanceTo(target));
  }
  assert(
    distance < 0.001,
    `${context}: label misses its named backbone by ${distance}`,
  );
  assertions++;
}
for (const definition of definitions) {
  if (only && definition.id !== only) continue;
  const model = definition.create();
  const variants =
    definition.id === "promoterRegulation"
      ? [{ bindingSite: "intact" }, { bindingSite: "altered" }]
      : [{ coactivator: "competent" }, { coactivator: "impaired" }];
  const samples = [
    ...Array.from({ length: 51 }, (_, i) => i / 50),
    0.739999,
    0.74,
    0.755,
    0.79,
    0.81,
    0.815,
    0.869999,
    0.87,
    0.985,
    0.99,
  ];
  for (const parameters of variants)
    for (const p of samples) {
      model.update(p, parameters);
      model.group.updateMatrixWorld(true);
      const labels = model.labels;
      const context = `${definition.id} ${JSON.stringify(parameters)} p=${p}`;
      if (definition.id === "promoterRegulation") {
        if (labels[1].active)
          onSurface(
            labels[1],
            model.group.getObjectByName("TAF lobe B"),
            `${context} TFIID`,
          );
        onSurface(
          labels[3],
          model.group.getObjectByName("RPB1 wall"),
          `${context} Pol II`,
        );
        if (labels[4].active)
          onSurface(
            labels[4],
            model.group.getObjectByName("XPB lobe 2"),
            `${context} XPB`,
          );
        onBackbone(
          model,
          labels[0],
          "Promoter coding backbone",
          `${context} TATA`,
        );
        onBackbone(
          model,
          labels[6],
          "Promoter coding backbone",
          `${context} coding`,
        );
        onBackbone(
          model,
          labels[7],
          "Promoter template backbone",
          `${context} template`,
        );
        const start = model.group.children.find(
          (o) =>
            o.geometry?.type === "TorusGeometry" &&
            o.geometry.parameters.radius === 0.45,
        );
        const anchor = new THREE.Vector3().fromArray(labels[2].position);
        start.worldToLocal(anchor);
        assert(
          Math.abs(Math.hypot(anchor.x, anchor.y) - 0.45) < 1e-6 &&
            Math.abs(anchor.z) < 1e-6,
          `${context}: +1 label must attach to the actual marker ring`,
        );
        rnaEnd(model, labels[5], context);
      } else {
        onSurface(
          labels[0],
          model.group.getObjectByName("Sequence-specific activator 1 domain 2"),
          `${context} activator`,
        );
        onSurface(
          labels[1],
          model.group.getObjectByName("RPB1 wall"),
          `${context} Pol II`,
        );
        const core = model.group.children.find((o) =>
          o.name.startsWith("Nucleosome 4 —"),
        );
        onSurface(
          labels[2],
          core.getObjectByName("H3 B"),
          `${context} nucleosome`,
        );
        if (labels[3].active)
          onSurface(
            labels[3],
            model.group.getObjectByName("Mediator Middle scaffold"),
            `${context} Mediator`,
          );
        rnaEnd(model, labels[4], context);
      }
      const expected = JSON.stringify(labels);
      model.update(0.97, variants.at(-1));
      model.update(0.02, variants[0]);
      model.update(p, parameters);
      assert.equal(
        JSON.stringify(labels),
        expected,
        `${context}: labels must reconstruct after arbitrary seeks`,
      );
    }
}
console.log(
  `Regulation label anchors: ${assertions} actual surface/backbone/endpoint checks PASS; both conditions, burst boundaries and arbitrary seeks`,
);
