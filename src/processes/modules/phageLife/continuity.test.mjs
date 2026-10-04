import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import lysogenic from "./phageLysogenicProcess.js";
import assembly from "./phageAssemblyProcess.js";
import packaging from "./phagePackagingProcess.js";

const effective = (o) => {
  for (let n = o; n; n = n.parent) if (!n.visible) return false;
  return true;
};
function centers(mesh) {
  const p = mesh.geometry.attributes.position,
    rows = [];
  for (let i = 0; i < p.count / 8; i++) {
    const v = new THREE.Vector3();
    for (let j = 0; j < 7; j++)
      v.add(new THREE.Vector3().fromBufferAttribute(p, i * 8 + j));
    rows.push(v.multiplyScalar(1 / 7).applyMatrix4(mesh.matrixWorld));
  }
  return rows;
}
function duplexEnds(group) {
  return group.children
    .filter((o) => o.isMesh && !o.isInstancedMesh)
    .map((mesh) => {
      const c = centers(mesh);
      return [c[0], c.at(-1)];
    });
}
function readGenome(scene) {
  const object = scene.group.getObjectByName("lambda-integrated-prophage-0"),
    rails = object.children
      .filter((o) => o.isMesh && !o.isInstancedMesh)
      .map(centers);
  return {
    object,
    rails,
    center: rails[0].map((v, i) =>
      v.clone().add(rails[1][i]).multiplyScalar(0.5),
    ),
  };
}
const lambda = lysogenic.create();
let minLength = Infinity,
  maxLength = 0;
const barriers = [];
const visitor = lambda.group.getObjectByName("lambda-attached-visitor");
assert(visitor, "lambda visitor is independently identifiable");
for (const name of [
  "lambda-capsid-shell",
  "lambda-open-neck",
  "lambda-open-tail-tube",
  "lambda-tail-lumen-wall",
  "lambda-open-tail-outlet",
])
  visitor.getObjectByName(name).traverse((o) => {
    if (o.isMesh) barriers.push(o);
  });
lambda.group.updateMatrixWorld(true);
const triangles = barriers.flatMap((mesh) => {
  const p = mesh.geometry.attributes.position,
    index = mesh.geometry.index,
    result = [];
  for (let i = 0; i < (index ? index.count : p.count); i += 3)
    result.push(
      [0, 1, 2].map((j) =>
        new THREE.Vector3()
          .fromBufferAttribute(p, index ? index.getX(i + j) : i + j)
          .applyMatrix4(mesh.matrixWorld),
      ),
    );
  return result;
});
const ray = new THREE.Ray(),
  hit = new THREE.Vector3();
for (const p of [0, 0.01, 0.025, 0.04, 0.055, 0.075, 0.09, 0.104, 0.105]) {
  lambda.update(p);
  lambda.group.updateMatrixWorld(true);
  const { object, center, rails } = readGenome(lambda);
  assert(effective(object));
  assert(
    !effective(visitor.getObjectByName("packaged-dsDNA")),
    "no scaled duplicate capsule genome",
  );
  let length = 0;
  for (let i = 1; i < center.length; i++) {
    const step = center[i].distanceTo(center[i - 1]);
    assert(step < 0.015, `lambda one continuous molecular interval at ${p}`);
    length += step;
  }
  minLength = Math.min(minLength, length);
  maxLength = Math.max(maxLength, length);
  for (const rail of rails)
    for (let i = 1; i < rail.length; i++) {
      const from = rail[i - 1],
        to = rail[i],
        length = from.distanceTo(to);
      ray.set(from, to.clone().sub(from).normalize());
      for (const triangle of triangles) {
        const intersection = ray.intersectTriangle(...triangle, false, hit);
        assert(
          !intersection || hit.distanceTo(from) > length + 1e-7,
          `lambda DNA crosses actual capsid/tail wall at ${p}: ${hit.toArray()}`,
        );
      }
    }
  if (p === 0.105)
    assert(
      center.every(
        (v) => (v.x / 2.96) ** 2 + (v.y / 1.369) ** 2 + (v.z / 1.036) ** 2 < 1,
      ),
      "complete genome inside cytoplasm before circularization",
    );
}
assert(
  maxLength - minLength < 0.025,
  `lambda schematic contour conserved through entry: range=${maxLength - minLength}`,
);

for (const fate of ["induce", "maintain"])
  for (const p of [
    0.11, 0.165, 0.18, 0.22, 0.295, 0.32, 0.5, 0.65, 0.78, 0.795, 0.8, 0.805,
    0.829, 0.83, 0.85, 1,
  ]) {
    lambda.update(p, { fate });
    lambda.group.updateMatrixWorld(true);
    const { object, rails } = readGenome(lambda),
      excised = lambda.group.getObjectByName("lambda-excised-prophage");
    assert(
      !(effective(object) && effective(excised)),
      "integrated/excised ownership never duplicates one genome",
    );
    if (fate === "maintain") assert(!effective(excised));
    const host = lambda.group.getObjectByName("lambda-chromosome-0"),
      left = duplexEnds(host.getObjectByName("lambda-attB-left-arm")),
      right = duplexEnds(host.getObjectByName("lambda-attB-right-arm"));
    if (p >= 0.165 && (fate === "maintain" || p <= 0.83))
      for (let s = 0; s < 2; s++) {
        assert(
          left[s][1].distanceTo(rails[s][0]) < 1e-6,
          "left attB arm covalently continuous with matching viral backbone",
        );
        assert(
          right[s][0].distanceTo(rails[s].at(-1)) < 1e-6,
          "right attB arm covalently continuous with matching viral backbone",
        );
      }
    if (p >= 0.83 && fate === "induce")
      for (let s = 0; s < 2; s++)
        assert(
          left[s][1].distanceTo(right[s][0]) < 1e-6,
          "host chromosome junction resealed after excision",
        );
    if ((p === 0.165 || p === 0.83) && fate === "induce")
      for (const rail of rails)
        assert(
          rail[0].distanceTo(rail.at(-1)) < 1e-6,
          "viral circularization/excision produces a closed molecule",
        );
  }

// Directly compare visible polymer vertices immediately across every conversion.
function visibleViralVertices(scene) {
  const primary = scene.group.getObjectByName("lambda-integrated-prophage-0"),
    excised = scene.group.getObjectByName("lambda-excised-prophage"),
    object = effective(primary) ? primary : excised;
  assert(effective(object));
  return object.children
    .filter((o) => o.isMesh && !o.isInstancedMesh)
    .flatMap(centers);
}
for (const p of [
  0.105, 0.165, 0.18, 0.29, 0.3, 0.32, 0.78, 0.795, 0.805, 0.83,
]) {
  lambda.update(p - 1e-6);
  lambda.group.updateMatrixWorld(true);
  const a = visibleViralVertices(lambda);
  lambda.update(p + 1e-6);
  lambda.group.updateMatrixWorld(true);
  const b = visibleViralVertices(lambda);
  assert(
    Math.max(...a.map((v, i) => v.distanceTo(b[i]))) < 0.001,
    `no full-genome swap across ${p}`,
  );
}

const a = assembly.create();
const fibers = Array.from({ length: 6 }, (_, i) =>
  a.group.getObjectByName(`T4-assembling-long-fiber-${i}`),
);
assert(
  fibers.every(Boolean),
  "six physical long fibers have individual assembly paths",
);
const rootPoint = (f) => f.children[0].getWorldPosition(new THREE.Vector3());
const tipPoint = (f) => f.children[2].getWorldPosition(new THREE.Vector3());
for (const protease of ["active", "inactive"]) {
  let lengths;
  for (const p of [
    0.6,
    0.8,
    0.93 - 1e-6,
    0.93 + 1e-6,
    0.94,
    0.95,
    0.97,
    0.99,
    1,
  ]) {
    a.update(p, { protease });
    a.group.updateMatrixWorld(true);
    const current = fibers.map((f) => {
      assert(
        effective(f),
        "previously assembled fibers persist through docking",
      );
      return rootPoint(f).distanceTo(tipPoint(f));
    });
    lengths ??= current;
    current.forEach((length, i) =>
      assert(
        Math.abs(length - lengths[i]) < 1e-6,
        "full fiber length preserved throughout docking",
      ),
    );
    for (const f of fibers) {
      const localAnchor = f.children[0].position.clone(),
        tail = f.parent.parent,
        attached = tail.localToWorld(localAnchor);
      if (protease === "active" && p >= 0.99)
        assert(
          rootPoint(f).distanceTo(attached) < 1e-6,
          "mature fiber root actually docks at baseplate",
        );
    }
    const mature = a.labels.find((label) =>
      label.text.en.includes("mature progeny"),
    );
    assert.equal(
      mature.active,
      protease === "active" && p >= 0.99,
      "mature label only after final physical attachment",
    );
  }
}
for (const p of [0.93, 0.94, 0.95, 0.99]) {
  a.update(p - 1e-6);
  a.group.updateMatrixWorld(true);
  const before = fibers.map(rootPoint);
  a.update(p + 1e-6);
  a.group.updateMatrixWorld(true);
  fibers.forEach((f, i) =>
    assert(
      rootPoint(f).distanceTo(before[i]) < 0.001,
      "fiber roots have continuous world trajectories",
    ),
  );
}

const pkg = packaging.create();
for (const atp of ["present", "absent"])
  for (const p of [0.2, 0.3, 0.5, 0.7, 0.78, 0.85, 1]) {
    pkg.update(p, { atp });
    pkg.group.updateMatrixWorld(true);
    // The exterior polymer contains 54 segment triplets (two rails + one rung).
    const dna = pkg.group.children.find((o) => o.children.length === 162);
    assert(dna, "external DNA geometry exists");
    for (const i of [16, 25, 35]) {
      const rail = dna.children[i * 3];
      if (!effective(rail)) continue;
      const start = rail.localToWorld(new THREE.Vector3(0, -0.5, 0)),
        end = rail.localToWorld(new THREE.Vector3(0, 0.5, 0)),
        radial0 = new THREE.Vector3(start.x, 0, start.z),
        radial1 = new THREE.Vector3(end.x, 0, end.z),
        axis = new THREE.Vector3(0, end.y - start.y, 0).normalize();
      assert(
        radial0.cross(radial1).dot(axis) > 0,
        "ordinary exterior dsDNA has right-handed B-form twist",
      );
      const other = dna.children[i * 3 + 1],
        otherStart = other.localToWorld(new THREE.Vector3(0, -0.5, 0));
      assert(
        Math.abs(start.x + otherStart.x) < 1e-7 &&
          Math.abs(start.z + otherStart.z) < 1e-7,
        "the two backbones remain paired around a common axis",
      );
    }
    if (atp === "absent") {
      assert.equal(pkg.group.userData.packagedFraction, 0);
      assert.equal(pkg.group.userData.concatemerCut, false);
      assert.equal(pkg.group.userData.neckSealed, false);
    }
  }

function inventory(group) {
  const rows = [];
  group.traverse((o) =>
    rows.push([
      o.uuid,
      o.geometry?.uuid,
      Array.isArray(o.material)
        ? o.material.map((m) => m.uuid)
        : o.material?.uuid,
    ]),
  );
  return JSON.stringify(rows);
}
function snapshot(group) {
  group.updateMatrixWorld(true);
  const hash = createHash("sha256");
  group.traverse((o) => {
    hash.update(
      JSON.stringify([o.visible, o.matrix.elements, o.geometry?.drawRange]),
    );
    for (const attr of Object.values(o.geometry?.attributes || {})) {
      assert(
        attr.array.every(Number.isFinite),
        "all mutable geometric attributes remain finite",
      );
      hash.update(
        Buffer.from(
          attr.array.buffer,
          attr.array.byteOffset,
          attr.array.byteLength,
        ),
      );
    }
    if (o.isInstancedMesh) {
      assert(o.instanceMatrix.array.every(Number.isFinite));
      hash.update(Buffer.from(o.instanceMatrix.array.buffer));
    }
  });
  return hash.digest("hex");
}
for (const [scene, conditions] of [
  [lambda, [{ fate: "induce" }, { fate: "maintain" }]],
  [a, [{ protease: "active" }, { protease: "inactive" }]],
  [pkg, [{ atp: "present" }, { atp: "absent" }]],
]) {
  const initial = inventory(scene.group);
  for (const parameters of conditions)
    for (const p of [
      0,
      0.031,
      0.105,
      0.165,
      0.295,
      0.507,
      0.795,
      0.805,
      0.83,
      0.932,
      0.995,
      1,
      NaN,
    ]) {
      scene.update(p, parameters);
      const before = snapshot(scene.group);
      scene.update(0.717, conditions.at(-1));
      scene.update(p, parameters);
      assert.equal(
        snapshot(scene.group),
        before,
        "mutable DNA buffers and all scene states seek deterministically",
      );
      assert.equal(
        inventory(scene.group),
        initial,
        "no scene/geometry/material allocation during updates",
      );
    }
}
console.log(
  "PASS 20261004-phageLife-01: one lambda duplex through open delivery geometry; continuous/nonduplicating recombination junctions and ownership",
);
console.log(
  "PASS 20261004-phageLife-02: full-length preassembled fibers dock continuously with correct roots and mature timing",
);
console.log(
  "PASS 20261004-phageLife-03: actual external duplex rail segments have right-handed twist in both ATP conditions",
);
console.log(
  "PASS dynamic-buffer finite data, deterministic arbitrary seeks and stable scene resources for all repaired branches",
);
