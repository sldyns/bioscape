import assert from "node:assert/strict";
import { Vector3 } from "three";
import { entries } from "./entries.js";
import respiration from "./respirationProcess.js";
import glycolysis from "./glycolysisProcess.js";
import bacterialEnergetics from "./bacterialEnergeticsProcess.js";
import bacterialPhotosynthesis from "./bacterialPhotosynthesisProcess.js";

const definitions = {
  respiration,
  glycolysis,
  bacterialEnergetics,
  bacterialPhotosynthesis,
};
const results = [];
let leftHanded = 0;

// Average real tube vertices around each ring, excluding its duplicated seam.
// This measures the rendered centerline after all parent transforms, rather
// than trusting a path formula or the determinant of a subunit's transform.
function ringCenter(mesh, ring) {
  const vertices = mesh.geometry.attributes.position;
  const radial = mesh.geometry.parameters.radialSegments;
  const center = new Vector3();
  const vertex = new Vector3();
  for (let j = 0; j < radial; j++)
    center.add(vertex.fromBufferAttribute(vertices, ring * (radial + 1) + j));
  return center.divideScalar(radial).applyMatrix4(mesh.matrixWorld);
}

for (const entry of entries) {
  const definition = definitions[entry.id];
  let conditions = [{}];
  for (const control of definition.controls ?? [])
    conditions = conditions.flatMap((parameters) =>
      control.options.map((option) => ({
        ...parameters,
        [control.id]: option.value,
      })),
    );
  for (const rootId of entry.roots) {
    const model = definition.create({ rootId });
    for (const parameters of conditions) {
      let samples = 0;
      let minimum = Infinity;
      let failures = 0;
      for (const progress of [0, 0.7, 1]) {
        model.update(progress, parameters);
        model.group.updateMatrixWorld(true);
        let helices = 0;
        model.group.traverseVisible((mesh) => {
          if (mesh.geometry?.parameters?.tubularSegments !== 72) return;
          const { radialSegments, radius } = mesh.geometry.parameters;
          assert.equal(radialSegments, 6, "retain alpha-helix tube detail");
          assert.equal(radius, 0.019, "retain alpha-helix tube radius");
          assert.equal(mesh.geometry.attributes.position.count, 73 * 7);
          const [a, b, c, d] = [14, 15, 16, 17].map((i) => ringCenter(mesh, i));
          const handedness = b
            .clone()
            .sub(a)
            .cross(c.clone().sub(b))
            .dot(d.clone().sub(c));
          assert.ok(Number.isFinite(handedness));
          // Positive torsion is right-handed, independent of view or the
          // rigid half-turn that puts mitochondrial c-ring loops toward F1.
          if (handedness <= 1e-10) failures++;
          minimum = Math.min(minimum, handedness);
          helices++;
        });
        assert.ok(
          helices >= 12,
          `${entry.id}: resolved helices remain visible`,
        );
        samples += helices;
      }
      leftHanded += failures;
      results.push({
        process: entry.id,
        rootId,
        parameters,
        samples,
        minimum,
        leftHanded: failures,
      });
    }
  }
}

console.log(
  JSON.stringify({
    test: "20261005-energy-alpha-helix-chirality",
    contexts: results.length,
    samples: results.reduce((sum, result) => sum + result.samples, 0),
    leftHanded,
    results,
  }),
);
assert.equal(
  leftHanded,
  0,
  "every displayed energy alpha helix is right-handed",
);
