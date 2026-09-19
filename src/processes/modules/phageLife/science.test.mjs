import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import lytic from "./phageLyticProcess.js";
import lysogenic from "./phageLysogenicProcess.js";

function effective(object) {
  assert(object, "expected scene object exists");
  for (let p = object; p; p = p.parent) if (!p.visible) return false;
  return true;
}
function ringCenter(mesh, index) {
  const p = mesh.geometry.attributes.position,
    center = new THREE.Vector3();
  // TubeGeometry repeats the first radial vertex at the seam.
  for (let j = 0; j < 7; j++)
    center.add(new THREE.Vector3().fromBufferAttribute(p, index * 8 + j));
  return center.multiplyScalar(1 / 7).applyMatrix4(mesh.matrixWorld);
}
function drawnCenters(mesh) {
  const { start, count } = mesh.geometry.drawRange;
  const first = start / 42,
    last = (start + count) / 42;
  return Array.from({ length: last - first + 1 }, (_, i) =>
    ringCenter(mesh, first + i),
  );
}
const a = lytic.create();
const named = (name) => a.group.getObjectByName(name);
const visitor = named("T4-attached-visitor"),
  incoming = named("T4-entry-dsDNA");
const rails = [named("entry-backbone-0"), named("entry-backbone-1")];
let previousEnd = -1,
  previousStart = -1,
  previousTipY = Infinity;
let minLength = Infinity,
  maxLength = 0;
for (const p of [0, 0.01, 0.03, 0.05, 0.1, 0.15, 0.17]) {
  a.update(p);
  a.group.updateMatrixWorld(true);
  assert(effective(incoming));
  assert.deepEqual(
    incoming.scale.toArray(),
    [1, 1, 1],
    "DNA is not grown by scaling about host origin",
  );
  assert.equal(visitor.position.y, 2.04, "attached tail outlet is stationary");
  const out = visitor.localToWorld(new THREE.Vector3(0, -0.76, 0));
  const r = rails.map(drawnCenters);
  assert.equal(
    r[0].length,
    r[1].length,
    "both backbones have the same contiguous interval",
  );
  const centers = r[0].map((v, i) =>
    v.clone().add(r[1][i]).multiplyScalar(0.5),
  );
  let length = 0;
  centers.forEach((v, i) => {
    assert(
      Math.abs(r[0][i].distanceTo(r[1][i]) - 0.03) < 2e-5,
      "duplex rails stay paired",
    );
    if (i) {
      const step = v.distanceTo(centers[i - 1]);
      assert(
        step < 0.012,
        "no gap between residual head DNA, tail and entering strand",
      );
      length += step;
    }
  });
  minLength = Math.min(minLength, length);
  maxLength = Math.max(maxLength, length);
  const draw = rails[0].geometry.drawRange;
  assert(
    draw.start >= previousStart && draw.start + draw.count > previousEnd,
    "both DNA ends advance in the delivery direction",
  );
  previousStart = draw.start;
  previousEnd = draw.start + draw.count;
  if (p <= 0.1) {
    assert(
      Math.min(...centers.map((v) => v.distanceTo(out))) < 0.009,
      "drawn molecule passes the actual tail outlet during transfer",
    );
    assert(
      centers.at(-1).y < previousTipY,
      "leading DNA end advances inward, never grows back toward the head",
    );
    previousTipY = centers.at(-1).y;
  }
  if (p === 0.03 || p === 0.05) {
    assert(
      centers[0].y > visitor.position.y,
      "residual DNA remains in the head while leading DNA enters",
    );
    assert(
      centers.at(-1).y < 1.31,
      "leading DNA is in cytoplasm after envelope passage",
    );
  }
  if (p === 0.17)
    assert(
      centers.every(
        (v) => (v.x / 2.96) ** 2 + (v.y / 1.369) ** 2 + (v.z / 1.036) ** 2 < 1,
      ),
      "complete interval is intracellular after entry",
    );
}
assert(
  maxLength - minLength < 0.025,
  "transfer preserves molecule length to discretization tolerance",
);
// The generic packaged genome must not duplicate the moving molecule.
assert(!effective(visitor.getObjectByName("packaged-dsDNA")));

// Trace the drawn backbone centerlines against actual capsid, neck, tube and
// baseplate triangles. A hollow decoration around a solid axial rod must fail.
const barriers = [];
for (const name of [
  "T4-open-neck-capsid-shell",
  "T4-open-neck-connector",
  "T4-open-tail-tube",
  "T4-baseplate",
]) {
  const object = visitor.getObjectByName(name);
  assert(object, `missing open delivery structure ${name}`);
  object.traverse((o) => {
    if (o.isMesh) barriers.push(o);
  });
}
a.group.updateMatrixWorld(true);
const triangles = barriers.flatMap((mesh) => {
  const pos = mesh.geometry.attributes.position,
    index = mesh.geometry.index;
  const result = [];
  for (let i = 0; i < (index ? index.count : pos.count); i += 3) {
    result.push(
      [0, 1, 2].map((j) =>
        new THREE.Vector3()
          .fromBufferAttribute(pos, index ? index.getX(i + j) : i + j)
          .applyMatrix4(mesh.matrixWorld),
      ),
    );
  }
  return result;
});
const ray = new THREE.Ray(),
  hit = new THREE.Vector3();
for (const p of [0, 0.03, 0.05, 0.1, 0.15]) {
  a.update(p);
  a.group.updateMatrixWorld(true);
  for (const mesh of rails) {
    const centers = drawnCenters(mesh);
    for (let i = 1; i < centers.length; i++) {
      const from = centers[i - 1],
        to = centers[i],
        length = from.distanceTo(to);
      ray.set(from, to.clone().sub(from).normalize());
      for (const triangle of triangles) {
        const intersection = ray.intersectTriangle(...triangle, false, hit);
        assert(
          !intersection || hit.distanceTo(from) > length + 1e-7,
          `DNA crosses a solid delivery-route triangle at p=${p}: ${hit.toArray()}`,
        );
      }
      if (from.y > 1.433 && from.y < 2.039)
        assert(
          Math.hypot(from.x + 0.8, from.z - 0.08) + 0.008 <
            0.031 * 0.8 * Math.cos(Math.PI / 48),
          "full DNA backbone thickness fits the tube lumen",
        );
    }
  }
}

const b = lysogenic.create();
const get = (name) => b.group.getObjectByName(name);
for (const fate of ["maintain", "induce"]) {
  for (const p of [0.65, 0.8, 0.96, 0.975, 1]) {
    b.update(p, { fate });
    b.group.updateMatrixWorld(true);
    for (const i of [0, 1]) {
      const chr = get(`lambda-chromosome-${i}`),
        insert = get(`lambda-integrated-prophage-${i}`);
      assert.equal(
        effective(chr),
        i === 1 || fate === "maintain" || p < 0.97,
        "chromosome loss is restricted to induced left lysis",
      );
      assert.equal(
        effective(insert),
        i === 1 || fate === "maintain" || p < 0.805,
        "retained chromosome contains its integrated prophage",
      );
      if (fate === "maintain" || i === 1) {
        assert(effective(get(`lambda-CI-${i}`)));
        const host = get(i ? "lambda-right-host" : "lambda-left-host");
        assert(effective(host));
        assert.equal(
          chr.position.x,
          host.position.x,
          "chromosome belongs to its own daughter",
        );
        host.traverse((o) => {
          if (o.name === "paired-leaflet-headgroups")
            assert(effective(o), "uninduced daughter envelope stays intact");
        });
        assert(
          chr
            .getObjectByName("organized-host-nucleoid-duplex")
            .children.some(effective),
          "actual chromosome geometry is rendered",
        );
      }
    }
    if (fate === "maintain") {
      assert(!effective(get("lambda-excised-prophage")));
      for (let i = 0; i < 5; i++)
        assert(!effective(get(`lambda-progeny-${i}`)));
    }
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
  const rows = [];
  group.traverse((o) =>
    rows.push([
      o.visible,
      o.matrix.toArray(),
      o.geometry?.drawRange,
      o.isInstancedMesh ? [o.count, ...o.instanceMatrix.array] : null,
    ]),
  );
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}
for (const [model, scene] of [
  [lytic, a],
  [lysogenic, b],
]) {
  const initial = inventory(scene.group);
  scene.group.traverse((o) => {
    for (const attr of Object.values(o.geometry?.attributes || {}))
      assert([...attr.array].every(Number.isFinite));
  });
  for (const fate of ["maintain", "induce"]) {
    for (const p of [
      0,
      ...model.stages.map((s) => s.at),
      0.03,
      0.05,
      0.15,
      0.975,
      1,
    ]) {
      scene.update(p, { fate });
      const before = snapshot(scene.group);
      scene.update(1 - p, {
        fate: fate === "maintain" ? "induce" : "maintain",
      });
      scene.update(p, { fate });
      assert.equal(
        snapshot(scene.group),
        before,
        `${model.id}: deterministic seek`,
      );
      assert.equal(
        inventory(scene.group),
        initial,
        `${model.id}: stable object/geometry/material inventory`,
      );
    }
  }
}
console.log(
  "PASS phageLife-01: continuous forward DNA, fixed outlet, conserved length, open capsid/tube/baseplate and no duplicate genome",
);
console.log(
  "PASS phageLife-02: effective chromosome/prophage/CI/envelope visibility in both daughters and both fates",
);
console.log(
  "PASS finite geometry, all-stage deterministic seeks and stable resources for both corrected models",
);
