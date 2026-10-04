import assert from "node:assert/strict";
import * as THREE from "three";
import replication from "./replicationProcess.js";
import repair from "./dnaRepairProcess.js";
import transduction from "./transductionProcess.js";
import sporulation from "./bacterialSporulationProcess.js";
const v = (a) => new THREE.Vector3(...a);
const near = (a, b) =>
  assert.ok(
    v(a).distanceTo(b) < 2e-5,
    `label anchor misses named geometry: ${v(a).distanceTo(b)}`,
  );
function railHit(item, mesh) {
  const m = new THREE.Matrix4();
  for (let i = 0; i < mesh.count; i++) {
    mesh.getMatrixAt(i, m);
    if (Math.hypot(...m.elements.slice(0, 3)) < 1e-8) continue;
    if (
      v(item.position).distanceTo(
        new THREE.Vector3().setFromMatrixPosition(m),
      ) < 2e-5
    )
      return true;
  }
  return false;
}
let cases = 0;
for (const rootId of ["cell", "plant", "yeast"])
  for (const ligase of ["active", "absent"]) {
    const c = replication.create({ rootId });
    for (const p of [0, 0.15, 0.25, 0.37, 0.5, 0.65, 0.8, 0.93, 1]) {
      c.update(p, { ligase });
      near(
        c.labels[6].position,
        c.group.getObjectByName("CMG-helicase-schematic-central-channel")
          .position,
      );
      for (const [idx, name] of [
        [4, "leading-daughter"],
        [7, "RNA-primers"],
      ])
        if (c.labels[idx].active)
          assert.ok(
            railHit(
              c.labels[idx],
              c.group.getObjectByName(name + "-sugar-phosphate-backbone"),
            ),
          );
      if (c.labels[8].active)
        near(
          c.labels[8].position,
          c.group.getObjectByName("ligase-functional-domains").position,
        );
      cases++;
    }
  }
for (const rootId of ["cell", "plant", "yeast"])
  for (const incision of ["active", "blocked"]) {
    const c = repair.create({ rootId });
    for (const p of [0.1, 0.4, 0.55, 0.7, 0.93, 1]) {
      c.update(p, { incision });
      near(
        c.labels[4].position,
        c.group.getObjectByName("adjacent-base-UV-photoproduct").position,
      );
      if (c.labels[8].active)
        near(
          c.labels[8].position,
          c.group.getObjectByName("DNA-polymerase-functional-domains").position,
        );
      if (c.labels[9].active)
        near(
          c.labels[9].position,
          c.group.getObjectByName("ligase-functional-domains").position,
        );
      if (c.labels[10].active)
        near(
          c.labels[10].position,
          c.group.getObjectByName("adjacent-base-UV-photoproduct").position,
        );
      cases++;
    }
  }
for (const rootId of ["bacterium", "phage"])
  for (const route of ["p1", "lambda"]) {
    const c = transduction.create({ rootId });
    for (const p of [0.2, 0.4, 0.6, 0.73, 0.78, 0.8, 0.9, 1]) {
      c.update(p, { route });
      c.group.updateMatrixWorld(true);
      near(
        c.labels[4].position,
        c.group.getObjectByName("packaging-and-delivery-virion").position,
      );
      near(
        c.labels[2].position,
        c.group.getObjectByName("transferred-DNA-segment-16").position,
      );
      near(
        c.labels[3].position,
        c.group.getObjectByName("transferred-DNA-segment-32").position,
      );
      const front = new THREE.Vector3(0, -0.5, 0).applyMatrix4(
        c.group.getObjectByName("transferred-DNA-segment-0").matrixWorld,
      );
      near(c.labels[5].position, front);
      if (c.labels[5].active) assert.ok(front.y < 0.8325);
      near(c.labels[7].position, new THREE.Vector3(2.65, 0.835, 0));
      cases++;
    }
  }
for (const engulfment of ["normal", "blocked"]) {
  const c = sporulation.create();
  for (const p of [0.16, 0.25, 0.36, 0.43, 0.5, 0.65, 0.8, 0.96, 1]) {
    c.update(p, { engulfment });
    c.group.updateMatrixWorld(true);
    for (const [idx, name, index] of [
      [2, "polar-septum-inward-annulus", 48 * 33 + 28],
      [3, "mother-membrane-continuous-engulfment", 60 * 33 + 28],
      [4, "external-protein-coat-shell", 6 * 41 + 20],
      [5, "intermembrane-cortex-cut-edge", 0],
      [7, "external-protein-coat-shell", 6 * 41 + 20],
      [8, "mother-membrane-continuous-engulfment", 60 * 33 + 28],
    ]) {
      if (!c.labels[idx].active) continue;
      const mesh = c.group.getObjectByName(name),
        point = new THREE.Vector3()
          .fromBufferAttribute(mesh.geometry.attributes.position, index)
          .applyMatrix4(mesh.matrixWorld);
      near(c.labels[idx].position, point);
    }
    cases++;
  }
}
console.log(
  `PASS: ${cases} genome label-anchor states across every root and condition; actual enzyme, DNA and membrane targets.`,
);
