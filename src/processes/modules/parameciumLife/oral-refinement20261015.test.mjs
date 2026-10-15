import assert from "node:assert/strict";
import * as THREE from "three";
import division from "./parameciumDivisionProcess.js";
import conjugation from "./parameciumConjugationProcess.js";
for (const model of [division, conjugation]) {
  const scene = model.create();
  const walls = [];
  scene.group.traverse((o) => {
    if (o.name === "oral-lumen-wall") walls.push(o);
  });
  assert.equal(walls.length, 2);
  for (const wall of walls) {
    const positions = wall.geometry.attributes.position;
    for (let row = 0; row <= 24; row++) {
      const left = row * 13,
        center = left + 6,
        right = left + 12;
      assert(
        positions.getZ(left) - positions.getZ(center) > 0.1,
        "open concavity must expose a depressed floor",
      );
      assert(positions.getZ(right) - positions.getZ(center) > 0.1);
      assert(positions.getX(left) < positions.getX(center));
      assert(positions.getX(center) < positions.getX(right));
    }
    const outer = wall.parent.getObjectByName("oral-outer-wall");
    const hair = wall.parent.getObjectByName("oral-membranelle-rows");
    assert.equal(hair.count, model.id === "parameciumConjugation" ? 15 : 36);
    assert(Number.isFinite(hair.boundingSphere.radius));
    for (let i = 0; i < positions.count; i++)
      assert(
        Math.abs(
          positions.getZ(i) -
            outer.geometry.attributes.position.getZ(i) -
            0.018,
        ) < 1e-6,
      );
  }
  if (model.id === "parameciumConjugation") {
    const camera = new THREE.Vector3(...scene.camera.position);
    for (const p of [0.55, 0.6, 0.65]) {
      scene.update(p);
      scene.group.updateMatrixWorld(true);
      for (const i of [0, 1]) {
        const migrant = scene.group.getObjectByName(
          `migratory-pronucleus-${i}`,
        );
        assert(migrant.visible);
        const target = migrant.getWorldPosition(new THREE.Vector3());
        const ray = new THREE.Raycaster(
          camera,
          target.clone().sub(camera).normalize(),
          0,
          camera.distanceTo(target),
        );
        const oralMeshes = walls.flatMap((w) => w.parent.children);
        assert.equal(
          ray.intersectObjects(oralMeshes, false).length,
          0,
          "default-view sightline to active migrant must pass through oral observation window",
        );
      }
    }
  }
  const resources = () => {
    const objects = [],
      geometries = [],
      materials = [];
    scene.group.traverse((o) => {
      objects.push(o);
      if (o.geometry) geometries.push(o.geometry);
      if (o.material) materials.push(o.material);
    });
    return { objects, geometries, materials };
  };
  const before = resources();
  scene.update(0.7);
  scene.group.updateMatrixWorld(true);
  const matrices = walls.map((o) => o.matrixWorld.toArray());
  scene.update(0.2);
  scene.update(0.7);
  scene.group.updateMatrixWorld(true);
  assert.deepEqual(
    walls.map((o) => o.matrixWorld.toArray()),
    matrices,
  );
  assert.deepEqual(resources(), before);
  console.log(
    `${model.id}: oral concavity, paired walls, instancing, seek and resource identity PASS`,
  );
}
