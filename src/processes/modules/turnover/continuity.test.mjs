import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import rna from "./rnaSilencingProcess.js";
import sos from "./bacterialRepairProcess.js";

const find = (scene, name) => {
  const object = scene.group.getObjectByName(name);
  assert.ok(object, `missing rendered object: ${name}`);
  return object;
};
const contribution = (group) => {
  const opacities = [];
  group.traverseVisible((object) => {
    if (object.isMesh)
      for (const material of Array.isArray(object.material)
        ? object.material
        : [object.material])
        opacities.push(material.opacity);
  });
  return opacities.length
    ? opacities.reduce((sum, value) => sum + value, 0) / opacities.length
    : 0;
};
const seek = (scene, progress, parameters) => {
  scene.update(progress, parameters);
  scene.group.updateMatrixWorld(true);
};
const resources = (scene) => {
  const nodes = [],
    geometries = new Set(),
    materials = new Set(scene.materials);
  scene.group.traverse((object) => {
    nodes.push(object.uuid);
    if (object.geometry) geometries.add(object.geometry.uuid);
    if (object.material)
      (Array.isArray(object.material)
        ? object.material
        : [object.material]
      ).forEach((material) => materials.add(material));
  });
  return JSON.stringify([
    nodes,
    [...geometries].sort(),
    [...materials].map((m) => m.uuid).sort(),
  ]);
};
const pose = (scene) => {
  const values = [];
  scene.group.traverse((object) =>
    values.push([
      object.visible,
      object.position.toArray(),
      object.quaternion.toArray(),
      object.scale.toArray(),
      object.material
        ? [
            object.material.opacity,
            object.material.transparent,
            object.material.depthWrite,
          ]
        : null,
      object.isInstancedMesh ? Array.from(object.instanceMatrix.array) : null,
    ]),
  );
  return JSON.stringify(values);
};

test("RNA effectors enter continuously without fading shared AGO or RNA materials", () => {
  const scene = rna.create();
  const factors = [
    find(scene, "TNRC6 interacting domain 0").parent,
    find(scene, "deadenylase catalytic pocket").parent,
  ];
  for (const p of [0.38 - 1e-7, 0.38, 0.38 + 1e-7]) {
    seek(scene, p, { pairing: "seed" });
    for (const factor of factors)
      assert.ok(
        contribution(factor) < 1e-6,
        "effector contribution tends to zero at entry",
      );
  }
  seek(scene, 0.405, { pairing: "seed" });
  for (const factor of factors) {
    assert.ok(
      contribution(factor) > 0.1 && contribution(factor) < 0.9,
      "finite intermediate recruitment fade",
    );
    assert.deepEqual(
      factor.scale.toArray(),
      [1, 1, 1],
      "native protein detail is not shrunk",
    );
  }
  assert.equal(find(scene, "N domain").children[0].material.opacity, 1);
  assert.equal(find(scene, "target backbone 0").material.opacity, 1);
  assert.equal(find(scene, "miRNA backbone 0").material.opacity, 1);
  seek(scene, 0.53, { pairing: "seed" });
  for (const factor of factors) assert.equal(contribution(factor), 1);
  for (const pairing of ["slice", "mismatch"])
    for (const p of [0.39, 0.405, 0.53, 1]) {
      seek(scene, p, { pairing });
      for (const factor of factors) assert.equal(contribution(factor), 0);
    }
});

test("SOS recruitment and fragment clearance have finite continuous contributions", () => {
  const scene = sos.create();
  const rec = find(scene, "RecA nucleoprotein subunit 1"),
    pol = find(scene, "SOS elongating RNAP"),
    bind = find(scene, "LexA N-terminal DNA-binding domain"),
    lex = bind.parent;
  for (const p of [0.13 - 1e-7, 0.13, 0.13 + 1e-7]) {
    seek(scene, p, { lexA: "wildtype" });
    assert.ok(
      contribution(rec) < 1e-6,
      "RecA must not appear at 88% size in one frame",
    );
  }
  seek(scene, 0.6175, { lexA: "wildtype" });
  assert.ok(
    contribution(pol) > 0.1 && contribution(pol) < 0.9,
    "RNAP has a finite entry interval",
  );
  assert.equal(find(scene, "ssDNA phosphate rail").material.opacity, 1);
  assert.equal(
    contribution(rec),
    1,
    "RecA is assembled before LexA cleavage/RNAP entry",
  );
  for (const [boundary, object] of [
    [0.63, pol],
    [0.84, lex],
  ]) {
    seek(scene, boundary - 1e-7, { lexA: "wildtype" });
    const before = contribution(object);
    seek(scene, boundary + 1e-7, { lexA: "wildtype" });
    assert.ok(
      Math.abs(before - contribution(object)) < 1e-4,
      "no finite-opacity jump at the former threshold",
    );
  }
  seek(scene, 0.7, { lexA: "wildtype" });
  const before = bind.getWorldPosition(new THREE.Vector3());
  seek(scene, 0.79, { lexA: "wildtype" });
  assert.ok(
    contribution(lex) > 0.1 && contribution(lex) < 0.9,
    "cleaved fragments clear over an interval",
  );
  assert.ok(
    bind.getWorldPosition(new THREE.Vector3()).distanceTo(before) > 0.1,
    "cleaved fragments physically disperse before removal",
  );
  seek(scene, 0.86, { lexA: "wildtype" });
  assert.equal(contribution(lex), 0);
  assert.equal(contribution(pol), 1);
  for (const p of [0.6175, 0.79, 0.86, 1]) {
    seek(scene, p, { lexA: "noncleavable" });
    assert.equal(contribution(pol), 0);
    assert.equal(contribution(lex), 1);
    assert.equal(find(scene, "SOS transcript backbone 0").visible, false);
  }
});

test("protein fades are deterministic, allocation-free and fully disposable across conditions", () => {
  for (const definition of [rna, sos]) {
    const scene = definition.create(),
      initial = resources(scene);
    for (const option of definition.controls[0].options) {
      const parameters = { [definition.controls[0].id]: option.value };
      for (const p of [0.405, 0.6175, 0.79, 0.9]) {
        seek(scene, p, parameters);
        const expected = pose(scene);
        seek(scene, 1, parameters);
        seek(scene, 0.02, parameters);
        seek(scene, p, parameters);
        assert.equal(pose(scene), expected);
        assert.equal(resources(scene), initial);
        const inventory = new Set(scene.materials);
        scene.group.traverse((object) => {
          if (object.material)
            assert.ok(
              inventory.has(object.material),
              "every cloned fade material belongs to the disposal inventory",
            );
        });
      }
    }
  }
});
