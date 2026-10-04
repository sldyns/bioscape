import assert from "node:assert/strict";
import * as THREE from "three";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { visibleProcessBounds } from "../../sceneBounds.js";

const moduleRoot = process.env.GENOME_MODULE_ROOT
  ? pathToFileURL(resolve(process.env.GENOME_MODULE_ROOT) + "/")
  : new URL("./", import.meta.url);
const transduction = (
  await import(new URL("transductionProcess.js", moduleRoot))
).default;
const v = (...values) => new THREE.Vector3(...values);

// Match ProcessScene's fixed, whole-animation fit at the native review size.
// This tests actual material-sensitive triangle intersections in the rendered
// default direction, rather than just requiring a particular material flag.
function defaultCamera(model, parameters) {
  const camera = new THREE.PerspectiveCamera(36, 960 / 640, 0.1, 150);
  const target = v(...model.camera.target);
  camera.position.fromArray(model.camera.position);
  camera.lookAt(target);
  camera.updateMatrixWorld(true);
  const right = v().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = v().setFromMatrixColumn(camera.matrixWorld, 1);
  const back = v().setFromMatrixColumn(camera.matrixWorld, 2);
  const bounds = new THREE.Box3();
  const samples = new Set([
    ...Array.from({ length: 9 }, (_, i) => i / 8),
    ...transduction.stages.map((stage) => stage.at),
  ]);
  for (const p of samples) {
    model.update(p, parameters);
    bounds.union(visibleProcessBounds(model.group));
  }
  const tanVertical = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const tanHorizontal = tanVertical * camera.aspect;
  let distance = 0.5;
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const corner = v(x, y, z).sub(target);
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
  camera.position.copy(target).addScaledVector(back, distance);
  camera.updateMatrixWorld(true);
  return camera;
}

function visibleMeshes(group) {
  const meshes = [];
  group.traverseVisible((object) => {
    if (
      object.isMesh &&
      object.material.visible &&
      !(object.material.transparent && object.material.opacity === 0)
    )
      meshes.push(object);
  });
  return meshes;
}

let states = 0;
let rays = 0;
for (const rootId of ["bacterium", "phage"])
  for (const route of ["p1", "lambda"]) {
    const model = transduction.create({ rootId });
    const camera = defaultCamera(model, { route });
    const shaft = model.group.getObjectByName(
      "transduction-tail-tube-open-lumen",
    );
    assert.ok(shaft);
    const geometry = shaft.geometry;
    assert.equal(geometry.parameters.openEnded, true, "tail lumen stays open");
    assert.equal(geometry.parameters.thetaLength, Math.PI, "keep the cutaway");
    for (const p of [0.725, 0.82, 0.915, 1]) {
      model.update(p, { route });
      model.group.updateMatrixWorld(true);
      assert.strictEqual(shaft.geometry, geometry, "reuse the existing tube");
      const meshes = visibleMeshes(model.group);
      let unobstructed = 0;
      for (const axial of [-0.05, 0.05, 0.15])
        for (const x of [-0.55, 0.15, 0.55]) {
          const target = shaft.localToWorld(v(x, axial, -Math.sqrt(1 - x * x)));
          const ray = new THREE.Raycaster(
            camera.position,
            target.clone().sub(camera.position).normalize(),
          );
          assert.ok(
            ray.intersectObject(shaft, false).length > 0,
            `${rootId}/${route} p=${p} axial=${axial} x=${x}: default camera cannot see the tail tube inner wall`,
          );
          if (ray.intersectObjects(meshes, false)[0]?.object === shaft)
            unobstructed++;
          rays++;
        }
      if (p >= 0.82 || route === "lambda")
        assert.ok(
          unobstructed > 0,
          `${rootId}/${route} p=${p}: tail tube remains hidden after sheath contraction`,
        );
      states++;
    }
  }
console.log(
  `PASS: ${states} fitted-default-camera tail states, ${rays} material-sensitive rays; exposed tube stays visible with open lumen and stable geometry.`,
);
