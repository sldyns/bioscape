import assert from "node:assert/strict";
import * as THREE from "three";
import transport from "./plantTransportProcess.js";
import pd from "./plasmodesmataProcess.js";
import photo from "./photorespirationProcess.js";
import carbon from "./c4camProcess.js";
import { visibleProcessBounds } from "../../sceneBounds.js";

const position = new THREE.Vector3(),
  expected = new THREE.Vector3();
let checks = 0;
function at(label, object, point = [0, 0, 0]) {
  expected.fromArray(point);
  object.localToWorld(expected);
  position.fromArray(label.position);
  assert(
    position.distanceTo(expected) < 1e-7,
    `${label.text.en} leader misses its actual geometry`,
  );
  checks++;
}
const stages = [0, 0.16, 0.28, 0.41, 0.53, 0.6, 0.7, 0.85, 0.93, 1, 0.37, 0.85];
const transportScene = transport.create();
for (const energy of ["available", "depleted"])
  for (const p of stages) {
    transportScene.update(p, { energy });
    transportScene.group.updateMatrixWorld(true);
    const labels = transportScene.labels,
      group = transportScene.group;
    at(
      labels[2],
      group.getObjectByName("nucleotide-binding-domain").children[0],
    );
    at(labels[3], group.getObjectByName("SUC2-N-helix-1"));
    at(labels[5], group.getObjectByName("tracked-sucrose"), [0.02, 0, 0]);
    at(labels[6], group.getObjectByName("single-cycle-ATP-to-ADP").children[0]);
    assert.equal(labels[6].active, energy === "available");
  }
transportScene.update(1);
assert(
  position
    .fromArray([3.1, 1.18, 0.4])
    .distanceTo(
      new THREE.Vector3().fromArray(transportScene.labels[5].position),
    ) > 2,
  "original static sucrose anchor must fail the molecular-target invariant",
);
const pore = pd.create();
for (const gate of ["open", "callose"])
  for (const p of stages) {
    pore.update(p, { gate });
    pore.group.updateMatrixWorld(true);
    at(
      pore.labels[7],
      pore.group.getObjectByName("untargeted-large-cargo").children[0],
    );
    const collar = pore.group.getObjectByName("wall-side-callose-collar-A");
    expected.fromBufferAttribute(
      collar.geometry.attributes.position,
      5 * 57 + 28,
    );
    at(pore.labels[6], collar, expected.toArray());
    const pm = pore.group.getObjectByName("pore-cytosolic-leaflet");
    expected.fromBufferAttribute(pm.geometry.attributes.position, 32 * 49 + 3);
    at(pore.labels[3], pm, expected.toArray());
  }
const salvage = photo.create();
const release = salvage.group.children.find(
  (o) => o.userData.trackedCarbon === 3,
);
for (const glyk of ["active", "absent"])
  for (const p of stages) {
    salvage.update(p, { glyk });
    salvage.group.updateMatrixWorld(true);
    at(
      salvage.labels[3],
      salvage.group.getObjectByName("tracked-photorespiratory-carbon-bond"),
    );
    at(salvage.labels[5], release);
    at(
      salvage.labels[6],
      salvage.group.getObjectByName("glycerate-kinase-binding-cleft")
        .children[0],
    );
  }
const strategies = carbon.create();
for (const strategy of ["c4", "cam"])
  for (const p of stages) {
    strategies.update(p, { strategy });
    strategies.group.updateMatrixWorld(true);
    const labels = strategies.labels,
      group = strategies.group;
    at(labels[2], group.getObjectByName("C4-PEPC").children[0]);
    at(labels[3], group.getObjectByName("C4-carbon-bond-1"));
    at(labels[4], group.getObjectByName("C4-NADP-ME").children[0]);
    at(labels[5], group.getObjectByName("C4-carbon-bond-0"));
    at(labels[6], group.getObjectByName("C4-PPDK").children[0]);
    at(labels[10], group.getObjectByName("CAM-PEPC").children[0]);
    at(labels[11], group.getObjectByName("CAM-NAD-ME").children[0]);
    at(labels[12], group.getObjectByName("CAM-Rubisco").children[0]);
    assert.equal(labels[3].active, strategy === "c4" && p >= 0.28 && p < 0.58);
    assert.equal(labels[5].active, strategy === "c4" && p >= 0.65 && p <= 0.93);
  }

// Match ProcessScene's whole-animation fit. Region captions must remain within
// the depicted reaction, independently of shared label-box collision handling.
function photoCamera(model, parameters, width, height) {
  const bounds = new THREE.Box3();
  for (const p of new Set([
    ...Array.from({ length: 9 }, (_, i) => i / 8),
    ...photo.stages.map((stage) => stage.at),
  ])) {
    model.update(p, parameters);
    bounds.union(visibleProcessBounds(model.group));
  }
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 150);
  const target = new THREE.Vector3(...model.camera.target);
  camera.position.fromArray(model.camera.position);
  camera.lookAt(target);
  camera.updateMatrixWorld(true);
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
  camera.position.copy(target).addScaledVector(back, distance);
  camera.updateMatrixWorld(true);
  return { camera, bounds };
}

let captionChecks = 0;
const mitochondrion = salvage.group.getObjectByName(
  "mitochondrion-double-envelope-and-cristae",
);
for (const glyk of ["active", "absent"])
  for (const [width, height] of [
    [960, 640],
    [640, 960],
  ]) {
    const { camera, bounds } = photoCamera(salvage, { glyk }, width, height);
    const oldCaption = new THREE.Vector3(0, 2.65, 0.2);
    assert(
      !bounds.containsPoint(oldCaption),
      "original caption must fail the actual pathway-bounds invariant",
    );
    assert(
      mitochondrion.worldToLocal(oldCaption.clone()).length() > 1,
      "original caption lies outside the mitochondrial reaction region",
    );
    for (const p of [0.6, 0.665, 0.815, 0.975, 1, 0.37, 0.665]) {
      salvage.update(p, { glyk });
      salvage.group.updateMatrixWorld(true);
      const caption = salvage.labels[7];
      assert.equal(caption.active, p >= 0.6);
      assert.equal(caption.text.zh, "4C = 3C 回收 + 1C 释放");
      assert.equal(caption.text.en, "4C = 3C recovered + 1C released");
      if (!caption.active) continue;
      const anchor = new THREE.Vector3().fromArray(caption.position);
      assert(
        bounds.containsPoint(anchor),
        "carbon balance is inside the pathway",
      );
      assert(
        mitochondrion.worldToLocal(anchor.clone()).length() < 0.75,
        "carbon balance points inside the matrix reaction region",
      );
      const projected = anchor.clone().project(camera);
      const x = ((projected.x + 1) * width) / 2;
      const y = ((1 - projected.y) * height) / 2;
      const margin = Math.min(width, height) * 0.075;
      assert(
        projected.z > -1 &&
          projected.z < 1 &&
          x >= margin &&
          x <= width - margin &&
          y >= margin &&
          y <= height - margin,
        `carbon balance anchor leaves the fitted ${width}x${height} view`,
      );
      captionChecks++;
    }
  }
console.log(
  "PASS 20261004-plantConnections-04: actual geometry anchors in all eight conditions; carbon-balance region and fitted-camera projections; original sucrose/caption negative controls",
  { checks, captionChecks },
);
