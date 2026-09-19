import assert from "node:assert/strict";
import * as THREE from "three";
import chemotaxis from "./chemotaxisProcess.js";
import twoComponent from "./twoComponentProcess.js";
import quorumSensing from "./quorumSensingProcess.js";
import biofilm from "./biofilmProcess.js";

const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
function torsion(points) {
  const differences = points.slice(1).map((p, i) => p.clone().sub(points[i]));
  return differences[0].clone().cross(differences[1]).dot(differences[2]);
}
const rightReference = Array.from({ length: 4 }, (_, i) =>
  v(i * 0.1, Math.cos(i * 0.3), Math.sin(i * 0.3)),
);
assert(
  torsion(rightReference) > 0,
  "right-handed reference calibrates the scalar triple product",
);
function endpoint(mesh, end = 1) {
  mesh.updateMatrix();
  return v(0, end / 2, 0).applyMatrix4(mesh.matrix);
}
function named(scene, name) {
  const node = scene.group.getObjectByName(name);
  assert(node, name);
  return node;
}
const chemo = chemotaxis.create();
for (const environment of ["gradient", "uniform"]) {
  const intervals =
    environment === "gradient"
      ? [[0.75, 0.83]]
      : [
          [0.26, 0.34],
          [0.52, 0.6],
          [0.75, 0.83],
        ];
  const sample = (p, f, j = 83) => {
    chemo.update(p, { environment });
    return endpoint(named(chemo, `flagellum-${f}-segment-${j}`));
  };
  for (const p of [0.1, 0.4, 0.65, 0.9]) {
    for (let f = 0; f < 5; f++) {
      const points = [60, 61, 62, 63].map((j) => sample(p, f, j));
      assert(torsion(points) < -1e-8, "all normal filaments are left-handed");
    }
  }
  for (const [start, end] of intervals) {
    const middle = (start + end) / 2;
    assert(
      torsion([60, 61, 62, 63].map((j) => sample(middle, 0, j))) > 1e-8,
      "selected reversed filament reaches a right-handed semicoiled form",
    );
    for (const [p, selected, sign, spread] of [
      [start - 0.02, 0, -1, -0.11],
      [middle, 0, 1, -1.24],
      [middle, 1, -1, -0.135],
      [end + 0.02, 0, -1, -0.11],
    ]) {
      const a = sample(p, selected).sub(v(-3.4, spread, 0.1));
      const b = sample(p + 0.0001, selected).sub(v(-3.4, spread, 0.1));
      // About +x: negative is CCW when viewed from behind (-x toward cell).
      assert(
        sign * (a.y * b.z - a.z * b.y) > 1e-6,
        "geometry rotates CCW in runs, selected CW in tumbles, then CCW again",
      );
    }
    for (const edge of [start, start + 0.015, end - 0.015, end]) {
      assert(
        sample(edge - 1e-7, 0).distanceTo(sample(edge + 1e-7, 0)) < 0.0001,
        "shape and integrated motor phase remain continuous across boundaries",
      );
    }
  }
  for (const p of [
    0, 0.26, 0.275, 0.3, 0.339, 0.54, 0.6, 0.75, 0.79, 0.815, 0.83, 1,
  ]) {
    chemo.update(p, { environment });
    for (let f = 0; f < 5; f++) {
      const hook = named(
        chemo,
        `flagellar-hook-${f}`,
      ).geometry.parameters.path.points.at(-1);
      assert(
        endpoint(named(chemo, `flagellum-${f}-segment-0`), -1).distanceTo(
          hook,
        ) < 1e-9,
      );
      for (let j = 0; j < 83; j++) {
        assert(
          endpoint(named(chemo, `flagellum-${f}-segment-${j}`)).distanceTo(
            endpoint(named(chemo, `flagellum-${f}-segment-${j + 1}`), -1),
          ) < 1e-9,
          "every filament remains joined throughout its polymorphic transition",
        );
      }
    }
  }
}
console.log(
  "chemotaxis: rendered handedness, rotation reversal, recovery and hook/filament continuity passed",
);

const two = twoComponent.create();
const donor = named(two, "NarX-His-site"),
  acceptor = named(two, "NarL-Asp-site"),
  marker = named(two, "transferred-phosphoryl-group"),
  gamma = named(two, "ATP-terminal-phosphate");
function world(node) {
  return node.getWorldPosition(v());
}
for (const nitrate of ["present", "absent"]) {
  for (const p of [
    0, 0.34, 0.349999, 0.35, 0.36, 0.4, 0.45999, 0.46, 0.48, 0.51, 0.54, 0.58,
    0.619, 0.62, 0.625, 0.63, 0.65, 0.7, 0.8, 1,
  ]) {
    two.update(p, { nitrate });
    two.group.updateMatrixWorld(true);
    assert.equal(
      Number(gamma.visible) + Number(marker.visible),
      1,
      "one conserved ATP terminal phosphate, including former duplicate frames",
    );
    let visiblePhosphates = 0;
    two.group.traverse((node) => {
      if (
        node.geometry === marker.geometry &&
        node.material === marker.material &&
        node.visible
      )
        visiblePhosphates++;
    });
    assert.equal(
      visiblePhosphates,
      3,
      "three physical phosphate spheres conserved across ATP, ADP and protein sites; no duplicate bound marker",
    );
    if (nitrate === "absent") {
      assert(!marker.visible);
      continue;
    }
    if (p >= 0.46 && p <= 0.62) {
      const a = world(donor),
        b = world(acceptor),
        m = world(marker);
      assert(
        a.distanceTo(b) < 0.13,
        "His/Asp encounter persists for the entire transfer",
      );
      const nearest = new THREE.Line3(a, b).closestPointToPoint(m, true, v());
      assert(
        m.distanceTo(nearest) < 1e-9,
        "phosphoryl group stays in the contacting active-site gap",
      );
    }
    if (p >= 0.62)
      assert(
        world(marker).distanceTo(world(acceptor)) < 1e-9,
        "phosphate follows actual Asp pocket on departing NarL",
      );
    if (p >= 0.35 && p <= 0.46)
      assert(world(marker).distanceTo(world(donor)) < 1e-9);
  }
}
two.update(0.35 - 1e-7, { nitrate: "present" });
two.group.updateMatrixWorld(true);
const gammaBefore = world(gamma);
two.update(0.35, { nitrate: "present" });
two.group.updateMatrixWorld(true);
assert(
  gammaBefore.distanceTo(world(marker)) < 1e-7,
  "ATP gamma to His handoff has no position jump",
);
console.log(
  "twoComponent: physical encounter, short direct transfer, phosphate conservation and Asp attachment passed",
);

for (const model of [twoComponent, quorumSensing]) {
  const scene = model.create(),
    matrix = new THREE.Matrix4();
  for (const option of model.controls[0].options)
    for (const p of [0, 0.4, 0.6, 0.8, 0.85, 1]) {
      scene.update(p, { [model.controls[0].id]: option.value });
      for (let strand = 0; strand < 2; strand++) {
        const rail = named(scene, `DNA-${strand}-backbone`);
        // These first spans lie outside either model's transcription bubble.
        for (let start = 0; start < 12; start++) {
          const points = Array.from({ length: 4 }, (_, j) => {
            rail.getMatrixAt(start + j, matrix);
            return v().setFromMatrixPosition(matrix);
          });
          assert(
            torsion(points) > 1e-7,
            `${model.id}: both ordinary DNA rails are right-handed in ${option.value} at ${p}`,
          );
        }
      }
      const rnas = [];
      scene.group.traverse((n) => {
        if (n.name === "RNA-backbone") rnas.push(n);
      });
      assert.equal(rnas.length, 1, "RNA remains a single nascent backbone");
    }
}
const film = biofilm.create(),
  helices = [];
film.group.traverse((n) => {
  if (n.name === "extracellular-DNA-double-helix") helices.push(n);
});
assert.equal(helices.length, 6);
for (const cue of ["NO", "none"])
  for (const p of [0.55, 0.64, 0.8, 0.95, 1]) {
    film.update(p, { cue });
    for (const helix of helices) {
      const rails = helix.children.filter(
        (n) => n.geometry?.type === "TubeGeometry",
      );
      assert.equal(rails.length, 2);
      for (const rail of rails) {
        const points = rail.geometry.parameters.path.points;
        for (let j = 0; j < points.length - 3; j++)
          assert(torsion(points.slice(j, j + 4)) > 1e-6);
        assert(
          points.every((point) => point.z > 0.6),
          "extracellular strands retain their matrix placement",
        );
      }
      const links = helix.children.filter(
        (n) => n.geometry?.type === "CylinderGeometry",
      );
      assert.equal(links.length, 15);
      links.forEach((link, j) => {
        assert(
          endpoint(link, -1).distanceTo(
            rails[0].geometry.parameters.path.points[j * 2],
          ) < 1e-9,
        );
        assert(
          endpoint(link, 1).distanceTo(
            rails[1].geometry.parameters.path.points[j * 2],
          ) < 1e-9,
        );
      });
    }
  }
console.log(
  "DNA: both regulatory duplexes and all six matrix duplexes are right-handed; paired links and single RNA retained",
);

// Existing group regression checks finite buffers/bounds, deterministic absolute
// seeking, stable scene/geometries/materials, both controls and local bundling.
await import("./smoke.test.mjs");
