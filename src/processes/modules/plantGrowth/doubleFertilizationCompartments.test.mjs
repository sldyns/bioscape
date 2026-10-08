import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { test } from "node:test";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";

// The optional module URL lets this exact regression run against the retained
// pre-fix source as a negative control, without rewriting production modules.
const { default: fertilization } = await import(
  process.env.BIOSCAPE_FERTILIZATION_REVIEW_MODULE ??
    "./doubleFertilizationProcess.js"
);
const assignments = ["frontEgg", "frontCentral"];
const evidence = { femaleMembranes: [], descendants: [], antipodalCopy: {} };
const objectNames = [
  "Egg plasma membrane with continuous sperm fusion neck",
  "Central-cell plasma membrane with continuous sperm fusion neck",
];
const update = (model, progress, assignment) => {
  model.update(progress, { assignment });
  model.group.updateMatrixWorld(true);
};
const point = new THREE.Vector3();
function maximumHostRadius(nucleus, hostTransform) {
  const positions = nucleus.geometry.attributes.position;
  let maximum = 0;
  for (let i = 0; i < positions.count; i++) {
    point
      .fromBufferAttribute(positions, i)
      .applyMatrix4(nucleus.matrixWorld)
      .applyMatrix4(hostTransform);
    maximum = Math.max(maximum, point.length());
  }
  return maximum;
}
function ellipsoidInverse(mesh) {
  const { femaleCenter, femaleRadii } = mesh.userData;
  return new THREE.Matrix4()
    .compose(
      new THREE.Vector3(...femaleCenter),
      new THREE.Quaternion(),
      new THREE.Vector3(...femaleRadii),
    )
    .premultiply(mesh.matrixWorld)
    .invert();
}

await test("PWG-01: female gametes and their fusion necks do not intersect", () => {
  const model = fertilization.create({ rootId: "plant" });
  const female = objectNames.map((name) => model.group.getObjectByName(name));
  assert(female.every(Boolean));
  // Indirect BVHs leave the original indexed geometry and group ordering intact.
  // Build at the expanded neck, then refit. Building while its triangles are
  // collapsed at p=0 produces poor spatial partitions for later fusion states.
  update(model, 0.53, assignments[0]);
  female.forEach((mesh) => {
    mesh.geometry.boundsTree = new MeshBVH(mesh.geometry, { indirect: true });
  });
  const samples = new Set([
    0,
    0.3,
    0.48,
    0.489999,
    0.490001,
    0.62,
    0.72,
    0.89,
    ...Array.from({ length: 27 }, (_, i) => 0.49 + i * 0.005),
  ]);
  for (const assignment of assignments) {
    let checked = 0;
    for (const progress of samples) {
      update(model, progress, assignment);
      female.forEach((mesh) => mesh.geometry.boundsTree.refit());
      const relative = female[0].matrixWorld
        .clone()
        .invert()
        .multiply(female[1].matrixWorld);
      const intersects = female[0].geometry.boundsTree.intersectsGeometry(
        female[1].geometry,
        relative,
      );
      assert.equal(
        intersects,
        false,
        `${assignment} p=${progress}: actual egg/central-cell triangles cross`,
      );
      // Also exclude containment without a surface crossing. Each host center
      // must be exterior to the other cell, including during fusion display.
      female.forEach((mesh, i) => {
        point
          .fromArray(mesh.userData.femaleCenter)
          .applyMatrix4(mesh.matrixWorld)
          .applyMatrix4(ellipsoidInverse(female[1 - i]));
        assert(point.length() > 1.05, "female gamete contains the other host");
      });
      checked++;
    }
    evidence.femaleMembranes.push({ assignment, checked, intersections: 0 });
  }
});

await test("PWG-02: complete descendant nuclei stay inside their cells", () => {
  const model = fertilization.create({ rootId: "plant" });
  const central = model.group.getObjectByName(objectNames[1]);
  for (const assignment of assignments) {
    let maxEndospermRadius = 0,
      maxEmbryoRadius = 0;
    // Reverse jumps cross the birth boundary and also exercise the other fate.
    for (const progress of [
      0.859999, 0.86, 0.860001, 0.88, 0.9, 0.94, 1, 0.3, 0.9, 0.859999, 1,
    ]) {
      update(model, progress, assignment);
      // Legacy source has no nucleus names. Identify the same late, large,
      // maternal-colored sphere meshes so the old-source failure measures
      // containment rather than merely detecting absent new names.
      const nuclei = model.group.children.filter(
        (n) =>
          n.isMesh &&
          n.geometry.type === "SphereGeometry" &&
          n.material.color?.getHexString() === "8a80a4" &&
          n.scale.x > 0.1 &&
          n.visible,
      );
      assert.equal(nuclei.length, progress >= 0.86 ? 4 : 0);
      const inverse = ellipsoidInverse(central);
      for (const nucleus of nuclei) {
        const radius = maximumHostRadius(nucleus, inverse);
        maxEndospermRadius = Math.max(maxEndospermRadius, radius);
        assert(
          radius < 0.95,
          `${assignment} p=${progress}: endosperm nucleus reaches host radius ${radius}`,
        );
        assert.match(nucleus.name, /^Free endosperm nucleus [1-4] /);
      }
      for (const name of ["Basal embryo cell", "Apical embryo cell"]) {
        const cell = model.group.getObjectByName(name),
          nucleus = model.group.getObjectByName(name + " nucleus 2n");
        if (!cell.parent.visible) continue;
        const radius = maximumHostRadius(
          nucleus,
          cell.matrixWorld.clone().invert(),
        );
        maxEmbryoRadius = Math.max(maxEmbryoRadius, radius);
        assert(radius < 0.95, `${name}: daughter nucleus breaches its cell`);
      }
    }
    evidence.descendants.push({
      assignment,
      maxEndospermRadius,
      maxEmbryoRadius,
      limit: 0.95,
    });
  }
});

await test("PWG-03: antipodal omission does not imply pre-fertilization death", () => {
  const description = fertilization.stages[0].description;
  assert.doesNotMatch(description.zh, /退化的反足细胞/);
  assert.doesNotMatch(description.en, /Degenerated antipodal cells/i);
  assert.match(description.zh, /三枚反足细胞.*省略.*早期胚乳/);
  assert.match(
    description.en,
    /three antipodal cells.*omitted.*early endosperm/,
  );
  assert(
    fertilization.sources.some(
      ({ url }) => url === "https://pubmed.ncbi.nlm.nih.gov/25389024/",
    ),
    "Arabidopsis antipodal persistence requires its primary evidence",
  );
  evidence.antipodalCopy = { ...description, primarySource: "PMID:25389024" };
});

if (process.env.BIOSCAPE_FERTILIZATION_REVIEW_EVIDENCE)
  writeFileSync(
    process.env.BIOSCAPE_FERTILIZATION_REVIEW_EVIDENCE,
    JSON.stringify(evidence, null, 2) + "\n",
  );
