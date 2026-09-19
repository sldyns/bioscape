import assert from "node:assert/strict";
import * as THREE from "three";
import feedingModel from "./parameciumFeedingProcess.js";
import cvModel from "./contractileVacuoleProcess.js";
import divisionModel from "./parameciumDivisionProcess.js";
import conjugationModel from "./parameciumConjugationProcess.js";

const object = (scene, name) => {
  const o = scene.group.getObjectByName(name);
  assert(o, `Missing scientific object ${name}`);
  return o;
};
const point = new THREE.Vector3(),
  inverse = new THREE.Matrix4();
function ring(mesh, row, columns = 32) {
  const a = mesh.geometry.attributes.position;
  return Array.from({ length: columns + 1 }, (_, j) =>
    new THREE.Vector3().fromBufferAttribute(a, row * (columns + 1) + j),
  );
}
function assertShared(a, b) {
  assert.equal(a.length, b.length);
  for (let i = 0; i < a.length; i++)
    assert(
      a[i].distanceTo(b[i]) < 2e-6,
      "fusion surfaces must share the same terminal curve",
    );
}
function visible(o) {
  for (let p = o; p; p = p.parent) if (!p.visible) return false;
  return true;
}

const feeding = feedingModel.create();
for (const p of [0.35, 0.37, 0.4, 0.43, 0.46, 0.52, 0.54, 0.565, 0.59, 0.615]) {
  feeding.update(p);
  feeding.group.updateMatrixWorld(true);
  const recipient = object(feeding, "food-vacuole-membrane"),
    donor = object(feeding, "fusing-donor-membrane"),
    neck = object(feeding, "food-vacuole-fusion-neck");
  assert(visible(donor) && visible(neck));
  const recipientRim = ring(recipient, 40),
    donorRim = ring(donor, 0);
  assertShared(recipientRim, ring(neck, 12));
  assertShared(donorRim, ring(neck, 0));
  assert(
    Math.hypot(recipientRim[0].y, recipientRim[0].z) > 0.001,
    "recipient must have an open pore",
  );
  for (let i = 0; i < donor.geometry.attributes.position.count; i++)
    assert(
      donor.geometry.attributes.position.getX(i) <= -1 + 1e-6,
      "whole donor must remain external",
    );
  const inner = object(feeding, "food-vacuole-inner-leaflet"),
    innerNeck = object(feeding, "food-vacuole-fusion-neck-inner");
  assertShared(ring(inner, 40), ring(innerNeck, 12));
}
for (const p of [0, 0.27, 0.48, 0.63, 0.8]) {
  feeding.update(p);
  const neck = object(feeding, "food-vacuole-fusion-neck");
  assert(!visible(neck), "port must be closed outside fusion");
}
const food = Array.from({ length: 7 }, (_, i) =>
  object(feeding, `tracked-food-${i}`),
);
feeding.update(0);
assert(
  food.every((o) => o.position.x > 1.9),
  "food must begin outside, not preloaded inside the tracked vacuole",
);
for (let i = 0; i < 7; i++) {
  const arrival = 0.205 + i * 0.008;
  feeding.update(arrival - 1e-7);
  const before = food[i].position.clone();
  feeding.update(arrival + 1e-7);
  assert(
    before.distanceTo(food[i].position) < 1e-5,
    "oral-route handoff must not teleport",
  );
}
for (const p of [0.26, 0.33, 0.5, 0.7]) {
  feeding.update(p);
  feeding.group.updateMatrixWorld(true);
  const membrane = object(feeding, "food-vacuole-fusion-assembly");
  inverse.copy(membrane.matrixWorld).invert();
  assert.equal(food.filter(visible).length, 7);
  for (const o of food) {
    point.copy(o.position).applyMatrix4(inverse);
    assert(
      point.length() < 0.8,
      "ingested cargo center must be in vacuolar lumen",
    );
  }
}

const cv = cvModel.create();
for (const osmotic of ["freshwater", "mild"]) {
  let entries = 0;
  for (let step = 0; step <= 120; step++) {
    const p = step / 120;
    cv.update(p, { osmotic });
    cv.group.updateMatrixWorld(true);
    const bladder = object(cv, "central-contractile-bladder");
    inverse.copy(bladder.matrixWorld).invert();
    for (let arm = 0; arm < 6; arm++) {
      const inlet = object(cv, `collecting-inlet-${arm}`);
      if (visible(inlet)) {
        const sectorStart = arm * 13 * 33;
        for (const [port, membrane, radius] of [
          [inlet.children[0], bladder, 1],
          [
            inlet.children[1],
            object(cv, "central-contractile-bladder-inner"),
            0.91,
          ],
        ]) {
          const first = new THREE.Vector3(),
            last = new THREE.Vector3();
          for (let j = 0; j <= 32; j++) {
            const boundary = new THREE.Vector3()
              .fromBufferAttribute(
                membrane.geometry.attributes.position,
                sectorStart + j,
              )
              .applyMatrix4(membrane.matrixWorld);
            point
              .fromBufferAttribute(port.geometry.attributes.position, j)
              .applyMatrix4(port.matrixWorld);
            assert(
              point.distanceTo(boundary) < 2e-6,
              "both inlet leaflets must share the actual bladder pore boundary",
            );
            point.applyMatrix4(inverse);
            assert(
              Math.abs(point.length() - radius) < 2e-6,
              "port must follow the evolving bladder membrane",
            );
            if (j === 0) first.copy(boundary);
            if (j === 32) last.copy(boundary);
          }
          assert(
            first.distanceTo(last) > 0.08,
            "connected pore must have finite aperture",
          );
          const indices = port.geometry.index.array;
          assert(
            indices.length === 12 * 32 * 6,
            "tube must contain side faces only",
          );
        }
      }
      if (step % 20 === 0) {
        const angle = (arm * Math.PI) / 3,
          latitude = -0.08,
          direction = new THREE.Vector3(
            Math.cos(angle) * Math.cos(latitude),
            Math.sin(angle) * Math.cos(latitude),
            Math.sin(latitude),
          ),
          ray = new THREE.Ray(new THREE.Vector3(), direction),
          a = new THREE.Vector3(),
          b = new THREE.Vector3(),
          c = new THREE.Vector3(),
          hit = new THREE.Vector3(),
          geometry = bladder.geometry,
          positions = geometry.attributes.position,
          indices = geometry.index.array;
        let intersections = 0;
        for (let i = 0; i < indices.length; i += 3) {
          a.fromBufferAttribute(positions, indices[i]);
          b.fromBufferAttribute(positions, indices[i + 1]);
          c.fromBufferAttribute(positions, indices[i + 2]);
          if (ray.intersectTriangle(a, b, c, false, hit)) intersections++;
        }
        assert.equal(
          intersections === 0,
          visible(inlet),
          "a ray through the claimed aperture must escape during filling and hit sealed membrane during isolation",
        );
      }
      for (let j = 0; j < 3; j++) {
        const drop = object(cv, `radial-water-${arm}-${j}`);
        if (!visible(drop)) continue;
        point.copy(drop.position).applyMatrix4(inverse);
        if (!visible(inlet))
          assert(
            point.length() > 1,
            "isolated arms must not deliver water into the bladder",
          );
        else if (point.length() < 1) entries++;
      }
    }
  }
  assert(
    entries > 0,
    "water must reach the central bladder in both conditions",
  );
}

const division = divisionModel.create();
for (let step = 300; step < 540; step += 2) {
  division.update(step / 1000);
  division.group.updateMatrixWorld(true);
  const nucleus = object(division, "dividing-micronucleus");
  inverse.copy(nucleus.matrixWorld).invert();
  division.group.traverse((o) => {
    if (!o.geometry || !visible(o)) return;
    const isChromatid = o.name.startsWith("segregating-chromatid"),
      isSpindle = o.parent?.name === "micronuclear-spindle";
    if (!isChromatid && !isSpindle) return;
    for (let i = 0; i < o.geometry.attributes.position.count; i++) {
      point
        .fromBufferAttribute(o.geometry.attributes.position, i)
        .applyMatrix4(o.matrixWorld)
        .applyMatrix4(inverse);
      assert(
        point.lengthSq() <= 1.00001,
        `closed micronucleus must contain ${o.name || "spindle"} at ${step / 1000}`,
      );
    }
  });
}
for (const p of [0.59, 0.63, 0.67, 0.7, 0.74, 0.755]) {
  division.update(p);
  const envelope = object(division, "continuous-macronuclear-envelope");
  assert(visible(envelope));
  for (const i of [0, 1])
    assert(
      !visible(object(division, `daughter-macronucleus-${i}`)),
      "no disconnected daughter shells during the bridge stage",
    );
  const a = envelope.geometry.attributes.position;
  for (let row = 1; row < 64; row++)
    assert(
      Math.hypot(a.getY(row * 33), a.getZ(row * 33)) > 0,
      "envelope cross-section must remain connected",
    );
}
for (const p of [0.76, 0.8, 0.95, 1]) {
  division.update(p);
  assert(!visible(object(division, "continuous-macronuclear-envelope")));
  for (const i of [0, 1])
    assert(visible(object(division, `daughter-macronucleus-${i}`)));
}
assert(
  conjugationModel.intro.zh.includes("营养") &&
    conjugationModel.intro.en.includes("nutritionally"),
);
assert(
  conjugationModel.stages.at(-1).description.zh.includes("营养") &&
    conjugationModel.stages.at(-1).description.en.includes("nutrient"),
);

function snapshot(scene) {
  scene.group.updateMatrixWorld(true);
  const data = [];
  scene.group.traverse((o) => {
    data.push(o.uuid, o.visible, ...o.matrix.elements);
    if (o.geometry)
      data.push(o.geometry.uuid, ...o.geometry.attributes.position.array);
    if (o.isInstancedMesh) data.push(...o.instanceMatrix.array);
  });
  return JSON.stringify(data);
}
for (const model of [feedingModel, cvModel, divisionModel, conjugationModel]) {
  const scene = model.create(),
    ids = [],
    geometries = new Set();
  scene.group.traverse((o) => {
    ids.push(o.uuid);
    if (o.geometry) geometries.add(o.geometry.uuid);
  });
  const controls = model.controls?.[0],
    cases = controls
      ? controls.options.map((o) => ({ [controls.id]: o.value }))
      : [{}];
  for (const params of cases) {
    for (const p of [NaN, 0, 0.18, 0.35, 0.52, 0.7, 0.9, 1]) {
      scene.update(p, params);
      const current = [];
      scene.group.traverse((o) => {
        current.push(o.uuid);
        if (o.geometry) {
          assert(geometries.has(o.geometry.uuid));
          for (const a of Object.values(o.geometry.attributes))
            assert([...a.array].every(Number.isFinite));
        }
      });
      assert.deepEqual(current, ids);
      const size = new THREE.Box3()
        .setFromObject(scene.group)
        .getSize(new THREE.Vector3())
        .toArray();
      assert(
        size.every(Number.isFinite) &&
          Math.max(...size) > 2 &&
          Math.max(...size) < 20,
      );
    }
    scene.update(0.7, params);
    const a = snapshot(scene);
    scene.update(0, params);
    scene.update(0.2, params);
    scene.update(0.7, params);
    assert.equal(snapshot(scene), a);
  }
  console.log(
    model.id,
    "scientific geometry + deterministic finite/resource checks PASS",
  );
}
