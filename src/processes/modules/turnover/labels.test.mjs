import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import rna from "./rnaSilencingProcess.js";
import proteasome from "./proteasomeProcess.js";
import crispr from "./crisprProcess.js";
import sos from "./bacterialRepairProcess.js";
import { visibleProcessBounds } from "../../sceneBounds.js";

const find = (scene, name) => {
  const object = scene.group.getObjectByName(name);
  assert.ok(object, `missing rendered object ${name}`);
  return object;
};
const seek = (scene, p, params) => {
  scene.update(p, params);
  scene.group.updateMatrixWorld(true);
};
const point = (object, local = [0, 0, 0]) =>
  object.localToWorld(new THREE.Vector3(...local));
const near = (label, expected, reason) =>
  assert.ok(
    new THREE.Vector3(...label.position).distanceTo(expected) < 2e-6,
    reason,
  );
const core = (scene, name) => find(scene, name).children[0];
const samples = [
  0, 0.13, 0.165, 0.195, 0.395, 0.575, 0.65, 0.651, 0.795, 0.85, 0.93, 1, 0.37,
  0.79, 0.1,
];

test("rendered RNA labels follow real molecules and disappear with cap/target/tail", () => {
  const scene = rna.create(),
    labels = [...scene.labels],
    positions = scene.labels.map((l) => l.position);
  for (const pairing of ["seed", "slice", "mismatch"]) {
    for (const p of samples) {
      seek(scene, p, { pairing });
      near(
        labels[0],
        point(core(scene, "PIWI catalytic lobe")),
        "AGO leader must follow its actual protein core",
      );
      near(
        labels[7],
        point(find(scene, "miRNA backbone 20")),
        "guide leader follows its own backbone through docking/rejection",
      );
      const cap = find(scene, "target 5-prime cap");
      assert.equal(labels[1].active, cap.visible);
      if (labels[1].active)
        near(labels[1], point(cap), "cap leader follows visible moving cap");
      const target = Array.from({ length: 22 }, (_, i) =>
        find(scene, `target backbone ${i + 3}`),
      ).filter((o) => o.visible);
      assert.equal(labels[3].active, target.length > 0);
      if (labels[3].active)
        assert.ok(
          target.some(
            (o) =>
              new THREE.Vector3(...labels[3].position).distanceTo(point(o)) <
              2e-6,
          ),
          "UTR leader must terminate on currently visible target backbone",
        );
      const tail = Array.from({ length: 12 }, (_, i) =>
        find(scene, `poly(A) residue ${i}`),
      ).filter((o) => o.visible);
      assert.equal(labels[2].active, tail.length > 0);
      if (labels[2].active)
        assert.ok(
          tail.some(
            (o) =>
              new THREE.Vector3(...labels[2].position).distanceTo(point(o)) <
              2e-6,
          ),
          "tail leader tracks actual surviving residue",
        );
      if (labels[4].active)
        near(
          labels[4],
          point(core(scene, "TNRC6 interacting domain 1")),
          "TNRC6 leader is on recruited domain",
        );
      if (labels[5].active)
        near(
          labels[5],
          point(core(scene, "deadenylase catalytic pocket")),
          "CCR4 leader follows moving catalytic domain",
        );
      if (labels[6].active)
        near(
          labels[6],
          point(find(scene, "AGO2 cleavage marker")),
          "cleavage marker leader",
        );
      scene.labels.forEach((label, i) => {
        assert.equal(label, labels[i]);
        assert.equal(label.position, positions[i]);
      });
    }
  }
});

test("proteasome leaders identify current named structures and actual visible products", () => {
  for (const rootId of ["cell", "plant", "yeast"]) {
    const scene = proteasome.create({ rootId });
    for (const tag of ["ubiquitin", "untagged"])
      for (const shell of ["cutaway", "whole"])
        for (const p of samples) {
          seek(scene, p, { tag, shell });
          const labels = scene.labels;
          near(
            labels[5],
            point(core(scene, "Rpn11 catalytic domain")),
            "Rpn11 must terminate on Rpn11 protein",
          );
          near(
            labels[2],
            point(find(scene, "Rpt ATPase 2").children[0].children[0]),
            "ATPase leader follows actual motor, including active oscillation",
          );
          near(
            labels[3],
            point(find(scene, "20S beta subunit 1:0").children[1].children[0]),
            "core leader terminates on always visible subunit",
          );
          assert.equal(labels[4].active, shell === "cutaway");
          if (labels[4].active)
            near(
              labels[4],
              point(find(scene, "beta catalytic site 1 (beta2)")),
              "chamber leader identifies the actual exposed internal catalytic site",
            );
          if (labels[0].active)
            near(
              labels[0],
              point(find(scene, "substrate residue 41")),
              "substrate leader follows actual residue",
            );
          for (const index of [1, 7])
            if (labels[index].active) {
              assert.equal(tag, "ubiquitin");
              near(
                labels[index],
                point(core(scene, "ubiquitin 3")),
                "ubiquitin leader follows the correct chain unit during release/recycling",
              );
            }
          const peptide = find(scene, "product peptide 0");
          assert.equal(labels[6].active, peptide.visible);
          if (labels[6].active) {
            const tube = peptide.children[0],
              local = tube.geometry.parameters.path.getPoint(0.5);
            near(
              labels[6],
              tube.localToWorld(local),
              "product leader follows an actual peptide curve, including rotation",
            );
          }
        }
  }
});

test("Cas9 leaders preserve nuclease/PAM/strand identity under current parent transforms", () => {
  const scene = crispr.create();
  for (const target of ["matched", "noPam", "mismatch"])
    for (const p of samples) {
      seek(scene, p, { target });
      const labels = scene.labels;
      near(
        labels[6],
        point(core(scene, "HNH target-strand nuclease")),
        "HNH leader follows actual HNH, including elevated pre-docking Cas9",
      );
      near(
        labels[7],
        point(core(scene, "RuvC non-target nuclease")),
        "RuvC leader follows actual RuvC",
      );
      near(
        labels[0],
        point(core(scene, "REC3 proofreading domain")),
        "Cas9 title on actual protein",
      );
      near(
        labels[1],
        point(find(scene, "Cas9 DNA backbone 0 0"), [0, -0.5, 0]),
        "non-target direction leader remains on its own DNA strand",
      );
      near(
        labels[2],
        point(find(scene, "Cas9 DNA backbone 1 0"), [0, -0.5, 0]),
        "target direction leader remains on its own DNA strand",
      );
      near(
        labels[3],
        point(find(scene, "DNA PAM nucleotide 1")),
        "PAM leader identifies DNA bases rather than the PAM-interacting protein",
      );
      near(
        labels[4],
        point(find(scene, "Cas9 guide backbone 4")),
        "crRNA guide leader follows current RNA",
      );
      const scaffold = find(scene, "tracrRNA anti-repeat scaffold"),
        local = scaffold.geometry.parameters.path.getPoint(0.9);
      near(
        labels[5],
        scaffold.localToWorld(local),
        "tracrRNA leader terminates on its actual scaffold curve",
      );
      if (labels[8].active)
        near(
          labels[8],
          point(find(scene, "Cas9 DNA backbone 0 24")),
          "displaced leader remains on non-target rail",
        );
    }
});

test("SOS leaders follow actual operator/proteins/strands and currently visible response RNA", () => {
  const scene = sos.create();
  seek(scene, 0.795, { lexA: "wildtype" });
  near(
    scene.labels[5],
    point(find(scene, "SOS transcript backbone 0"), [0, -0.5, 0]),
    "response RNA leader must touch the visible transcript at the recorded stage frame",
  );
  for (const lexA of ["wildtype", "noncleavable"])
    for (const p of samples) {
      seek(scene, p, { lexA });
      const labels = scene.labels,
        transcript = find(scene, "SOS transcript backbone 0");
      assert.equal(labels[5].active, transcript.visible);
      if (labels[5].active)
        near(
          labels[5],
          point(transcript, [0, -0.5, 0]),
          "response RNA leader follows its actual growing/exiting 5-prime endpoint",
        );
      near(
        labels[3],
        point(find(scene, "SOS operator box")),
        "operator leader on actual box",
      );
      if (labels[1].active)
        near(
          labels[1],
          point(
            find(scene, "RecA nucleoprotein subunit 1").children[0].children[0],
          ),
          "RecA leader follows rotated/scaled subunit",
        );
      if (labels[2].active)
        near(
          labels[2],
          point(core(scene, "LexA C-terminal self-cleavage domain")),
          "LexA leader follows domain through dissociation and return",
        );
      if (labels[4].active)
        near(
          labels[4],
          point(core(scene, "RNAP assembly lobe")),
          "RNAP label follows current polymerase lobe",
        );
      for (let strand = 0; strand < 2; strand++)
        near(
          labels[6 + strand],
          point(find(scene, `SOS DNA backbone ${strand} 0`), [0, -0.5, 0]),
          "direction leader follows actual changing strand endpoint",
        );
      if (labels[8].active)
        near(
          labels[8],
          point(core(scene, "LexA C-terminal self-cleavage domain")),
          "autocleavage annotation stays on catalytic fragment until clearance",
        );
      const [x, y, z] = labels[0].position;
      assert.ok(
        x > -1.9 && x < 1.9 && y > 1.08 && y < 1.45 && z === 0,
        "damage-gap regional anchor stays inside the complementary-strand gap",
      );
    }
});

test("all label objects and arrays survive irregular seeks with deterministic finite anchors", () => {
  const cases = [
    [rna, { pairing: "seed" }, { pairing: "slice" }],
    [
      proteasome,
      { tag: "ubiquitin", shell: "cutaway" },
      { tag: "untagged", shell: "whole" },
    ],
    [crispr, { target: "matched" }, { target: "noPam" }],
    [sos, { lexA: "wildtype" }, { lexA: "noncleavable" }],
  ];
  for (const [definition, parameters, alternate] of cases) {
    const scene = definition.create({ rootId: "cell" }),
      labels = [...scene.labels],
      arrays = labels.map((l) => l.position);
    const inventory = () => {
      const values = [];
      scene.group.traverse((o) =>
        values.push([
          o.uuid,
          o.geometry?.uuid,
          Array.isArray(o.material)
            ? o.material.map((m) => m.uuid)
            : o.material?.uuid,
        ]),
      );
      return JSON.stringify(values);
    };
    const state = () => JSON.stringify(scene.labels);
    const originalResources = inventory();
    for (const p of [0, 0.395, 0.795, 1]) {
      seek(scene, p, parameters);
      const expected = state();
      for (const q of [1, 0.13, 0.85, 0.5, 0]) seek(scene, q, alternate);
      seek(scene, p, parameters);
      assert.equal(
        state(),
        expected,
        `${definition.id} labels restore independently of seek history`,
      );
      assert.equal(
        inventory(),
        originalResources,
        "no scene node, material or geometry allocation during update",
      );
      scene.labels.forEach((label, i) => {
        assert.equal(label, labels[i]);
        assert.equal(label.position, arrays[i]);
        assert.ok(label.position.every(Number.isFinite));
      });
    }
  }
});

// Reproduce ProcessScene's fixed whole-animation bounds fit at the original
// gallery's 960x640 export aspect, retaining the model's actual default view.
function defaultProteasomeCamera(scene, parameters) {
  const bounds = new THREE.Box3(),
    sample = new THREE.Box3();
  for (const p of new Set([
    ...Array.from({ length: 9 }, (_, i) => i / 8),
    ...proteasome.stages.map((stage) => stage.at),
  ])) {
    scene.update(p, parameters);
    bounds.union(visibleProcessBounds(scene.group, sample));
  }
  const camera = new THREE.PerspectiveCamera(36, 960 / 640, 0.1, 150);
  const target = new THREE.Vector3(...scene.camera.target);
  camera.position.fromArray(scene.camera.position);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  const direction = camera.position.clone().sub(target).normalize();
  const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const back = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 2);
  const tanVertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const tanHorizontal = tanVertical * camera.aspect;
  let distance = 0.5;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = new THREE.Vector3(x, y, z).sub(target);
        distance = Math.max(
          distance,
          corner.dot(back) +
            1.12 *
              Math.max(
                Math.abs(corner.dot(right)) / tanHorizontal,
                Math.abs(corner.dot(up)) / tanVertical,
              ),
        );
      }
  camera.position.copy(target).addScaledVector(direction, distance);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  return camera;
}

test("default proteasome chamber leader reaches an exposed real catalytic site before any wall", () => {
  for (const rootId of ["cell", "plant", "yeast"]) {
    const scene = proteasome.create({ rootId });
    for (const tag of ["ubiquitin", "untagged"]) {
      const parameters = { tag, shell: "cutaway" };
      const camera = defaultProteasomeCamera(scene, parameters),
        ray = new THREE.Raycaster();
      const site = find(scene, "beta catalytic site 1 (beta2)");
      for (const p of new Set([
        ...samples,
        ...Array.from({ length: 101 }, (_, i) => i / 100),
      ])) {
        seek(scene, p, parameters);
        assert.equal(scene.labels[4].active, true);
        const meshes = [];
        scene.group.traverseVisible((object) => {
          if (object.isMesh) meshes.push(object);
        });
        const anchor = new THREE.Vector3(...scene.labels[4].position);
        ray.set(camera.position, anchor.sub(camera.position).normalize());
        const hit = ray.intersectObjects(meshes, false)[0];
        assert.equal(
          hit?.object.name,
          site.name,
          `p=${p}: real default-view ray must hit the labelled catalytic site before the shell or substrate`,
        );
        if (p === 0) {
          const previous = find(scene, "beta catalytic site 2 (beta5)");
          ray.set(
            camera.position,
            previous
              .getWorldPosition(new THREE.Vector3())
              .sub(camera.position)
              .normalize(),
          );
          assert.equal(
            ray.intersectObjects(meshes, false)[0]?.object.name,
            "20S protein volume 1 0",
            "the earlier exact-geometry anchor was actually occluded by the right beta wall",
          );
        }
      }
    }
  }
});
