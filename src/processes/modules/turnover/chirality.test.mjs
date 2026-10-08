import assert from "node:assert/strict";
import { test } from "node:test";
import * as THREE from "three";
import rna from "./rnaSilencingProcess.js";
import proteasome from "./proteasomeProcess.js";
import crispr from "./crisprProcess.js";
import sos from "./bacterialRepairProcess.js";

const seek = (scene, progress, parameters = {}) => {
  scene.update(progress, parameters);
  scene.group.updateMatrixWorld(true);
};

function assertRightHanded(points) {
  assert.ok(points.length > 6, "enough helical samples");
  for (let i = 0; i < points.length - 3; i++) {
    const a = points[i + 1].clone().sub(points[i]),
      b = points[i + 2].clone().sub(points[i + 1]),
      c = points[i + 3].clone().sub(points[i + 2]);
    assert.ok(a.dot(b.cross(c)) > 1e-12, "left-handed protein helix");
  }
}

// Independent sign calibration, including invariance under proper rotations
// and nonuniform positive scaling. A reflection must reverse handedness.
const control = Array.from(
  { length: 15 },
  (_, i) => new THREE.Vector3(i * 0.1, Math.cos(i * 0.4), Math.sin(i * 0.4)),
);
const transform = new THREE.Matrix4().compose(
  new THREE.Vector3(1.2, -0.7, 0.8),
  new THREE.Quaternion().setFromEuler(new THREE.Euler(0.4, -0.6, 0.3)),
  new THREE.Vector3(0.7, 1.2, 1.5),
);
assertRightHanded(control.map((p) => p.clone().applyMatrix4(transform)));
assert.throws(
  () =>
    assertRightHanded(control.map((p) => new THREE.Vector3(-p.x, p.y, p.z))),
  /left-handed protein helix/,
);

function tubeCenters(mesh) {
  const { tubularSegments, radialSegments } = mesh.geometry.parameters,
    positions = mesh.geometry.attributes.position,
    points = [];
  // Average complete rings from the actual tube vertices. Exclude end caps
  // and Catmull-Rom endpoint behavior rather than reading the declared path.
  for (let ring = 3; ring < tubularSegments - 3; ring++) {
    const center = new THREE.Vector3();
    for (let radial = 0; radial < radialSegments; radial++)
      center.add(
        new THREE.Vector3().fromBufferAttribute(
          positions,
          ring * (radialSegments + 1) + radial,
        ),
      );
    points.push(mesh.localToWorld(center.multiplyScalar(1 / radialSegments)));
  }
  return points;
}

test("turnover protein helices retain right-handed geometry in world space", () => {
  for (const [model, rootId, domainName] of [
    [rna, "cell", "N domain"],
    [proteasome, "cell", "AAA small helical domain"],
    [proteasome, "plant", "AAA small helical domain"],
    [proteasome, "yeast", "AAA small helical domain"],
    [crispr, "bacterium", "HNH target-strand nuclease"],
    [sos, "bacterium", "RecA ATPase core"],
  ]) {
    const scene = model.create({ rootId });
    seek(scene, 0.7);
    const domain = scene.group.getObjectByName(domainName);
    assert.ok(domain, domainName);
    const helices = domain.children.filter(
      (o) => o.geometry?.type === "TubeGeometry",
    );
    assert.ok(helices.length > 0, `${model.id}: actual protein helices`);
    for (const helix of helices) {
      const points = tubeCenters(helix);
      assertRightHanded(points);
      assert.throws(
        () =>
          assertRightHanded(
            points.map((p) => new THREE.Vector3(-p.x, p.y, p.z)),
          ),
        /left-handed protein helix/,
        "a mirrored actual tube must be rejected",
      );
    }
  }
});

function phosphatePositions(scene) {
  return [0, 1].map((strand) => {
    const mesh = scene.group.getObjectByName(
      `SOS locus strand ${strand} phosphates`,
    );
    assert.ok(mesh, `strand ${strand} phosphate geometry`);
    return Array.from({ length: mesh.count }, (_, index) => {
      const matrix = new THREE.Matrix4();
      mesh.getMatrixAt(index, matrix);
      return new THREE.Vector3()
        .setFromMatrixPosition(matrix)
        .applyMatrix4(mesh.matrixWorld);
    });
  });
}

function assertRightHandedDuplex(scene, strands) {
  const centers = strands[0].map((p, i) =>
      p.clone().add(strands[1][i]).multiplyScalar(0.5),
    ),
    radial = strands[0].map((p, i) =>
      p.clone().sub(strands[1][i]).multiplyScalar(0.5),
    );
  let closed = 0;
  for (let i = 0; i < centers.length - 1; i++) {
    if (
      !scene.group.getObjectByName(`SOS DNA pair ${i}`).visible ||
      !scene.group.getObjectByName(`SOS DNA pair ${i + 1}`).visible
    )
      continue;
    const axis = centers[i + 1].clone().sub(centers[i]);
    const handedness = radial[i]
      .clone()
      .cross(radial[i + 1])
      .dot(axis);
    assert.ok(handedness > 1e-8, "left-handed closed SOS DNA");
    closed++;
  }
  assert.ok(closed > 30, "closed duplex flanks remain available");
}

test("SOS DNA stays right-handed around the moving bubble in both LexA branches", () => {
  const scene = sos.create();
  for (const lexA of ["wildtype", "noncleavable"]) {
    for (let frame = 0; frame <= 100; frame++) {
      seek(scene, frame / 100, { lexA });
      assertRightHandedDuplex(scene, phosphatePositions(scene));
    }
    for (const progress of [0.635, 0.638, 0.641, 0.647, 0.65, 1, 0.2, 0.8]) {
      seek(scene, progress, { lexA });
      assertRightHandedDuplex(scene, phosphatePositions(scene));
    }
    seek(scene, 0, { lexA });
    const mirrored = phosphatePositions(scene).map((strand) =>
      strand.map((p) => new THREE.Vector3(p.x, p.y, -p.z)),
    );
    assert.throws(
      () => assertRightHandedDuplex(scene, mirrored),
      /left-handed closed SOS DNA/,
      "a reflected real duplex must be rejected",
    );
  }
});

test("SOS bubble opens continuously without an extra whole-duplex rotation", () => {
  const scene = sos.create(),
    previous = new THREE.Vector3();
  let angularTravel = 0;
  for (let frame = 0; frame <= 150; frame++) {
    seek(scene, 0.635 + (frame / 150) * 0.015, { lexA: "wildtype" });
    const strands = phosphatePositions(scene),
      radial = strands[0][0].clone().sub(strands[1][0]).normalize();
    if (frame > 0) angularTravel += previous.angleTo(radial);
    previous.copy(radial);
  }
  assert.ok(angularTravel < Math.PI, "bubble opening spins the entire duplex");
});
