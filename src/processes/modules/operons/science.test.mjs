import assert from "node:assert/strict";
import "./duplexGeometry.test.mjs";
import * as THREE from "three";
import { build } from "esbuild";
import lac from "./lacOperonProcess.js";
import trp from "./trpOperonProcess.js";
import gal from "./yeastGalProcess.js";
import hog from "./yeastOsmoregulationProcess.js";

const mat = new THREE.Matrix4(),
  a = new THREE.Vector3(),
  b = new THREE.Vector3();
function instancePoint(mesh, index, point, out) {
  mesh.getMatrixAt(index, mat);
  out.copy(point).applyMatrix4(mat).applyMatrix4(mesh.matrixWorld);
  return out;
}
const origin = new THREE.Vector3(),
  segmentEnd = new THREE.Vector3(0, 0.5, 0);
const scenarios = (m) =>
  m.controls.reduce(
    (rows, c) =>
      rows.flatMap((row) =>
        c.options.map((o) => ({ ...row, [c.id]: o.value })),
      ),
    [{}],
  );
const named = (s, name) => {
  const o = s.group.getObjectByName(name);
  assert(o, `missing actual scene object: ${name}`);
  return o;
};

export function verifyLac(model) {
  const s = model.create(),
    p0 = named(s, "DNA phosphates 0"),
    p1 = named(s, "DNA phosphates 1"),
    base0 = named(s, "DNA bases 0"),
    base1 = named(s, "DNA bases 1");
  const polymerases = [];
  s.group.traverse((o) => {
    if (o.name.startsWith("Bacterial RNAP:")) polymerases.push(o.parent);
  });
  assert.equal(polymerases.length, 3);
  for (const params of scenarios(model))
    for (const t of [
      0, 0.53, 0.55, 0.605, 0.68, 0.72, 0.8, 0.85, 0.88, 0.92, 0.94, 1,
    ]) {
      s.update(t, params);
      s.group.updateMatrixWorld(true);
      for (const pol of polymerases.filter((o) => o.visible)) {
        let index = 0,
          distance = Infinity;
        for (let j = 0; j < p0.count; j++) {
          instancePoint(p0, j, origin, a);
          if (Math.abs(a.x - pol.position.x) < distance) {
            distance = Math.abs(a.x - pol.position.x);
            index = j;
          }
        }
        instancePoint(p0, index, origin, a);
        instancePoint(p1, index, origin, b);
        assert(
          a.distanceTo(b) > 0.5,
          `operons-01: closed backbone under active RNAP at p=${t}, x=${pol.position.x}`,
        );
        instancePoint(base0, index, segmentEnd, a);
        instancePoint(base1, index, segmentEnd, b);
        assert(
          a.distanceTo(b) > 0.3,
          `operons-01: base pairs still joined under RNAP at p=${t}`,
        );
      }
      if (params.lactose === "absent" || t === 1)
        for (let j = 0; j < p0.count; j++) {
          instancePoint(p0, j, origin, a);
          instancePoint(p1, j, origin, b);
          assert(
            a.distanceTo(b) < 0.405,
            "inactive/terminated DNA must reanneal",
          );
        }
    }
}

export function verifyTrp(model) {
  const low = model.controls
    .find((c) => c.id === "tryptophan")
    .options.find((o) => o.value === "low");
  assert.match(low.label.zh, /严重/);
  assert.match(low.label.en, /severely/i);
  assert.match(model.intro.zh, /带色氨酸 tRNA/);
  assert.match(model.intro.en, /limit charged tRNA/);
  const s = model.create();
  for (const params of scenarios(model)) {
    const sufficient =
      params.tryptophan === "high" && params.charging === "normal";
    s.update(0.55, params);
    assert.equal(named(s, "Charged tRNA tryptophan").visible, sufficient);
    s.update(0.9, params);
    assert.equal(named(s, "trp leader RNA terminator").visible, sufficient);
    assert.equal(
      named(s, "trp leader RNA antiterminator").visible,
      !sufficient,
    );
    const extension = named(s, "trp structural gene RNA extension");
    assert.equal(extension.visible, !sufficient);
    if (!sufficient) assert(extension.geometry.drawRange.count > 0);
  }
}

function cargoVertices(cargo) {
  const vertices = [];
  cargo.traverse((o) => {
    if (!o.geometry) return;
    const p = o.geometry.attributes.position;
    for (let i = 0; i < p.count; i++)
      vertices.push({
        mesh: o,
        point: new THREE.Vector3().fromBufferAttribute(p, i),
      });
  });
  return vertices;
}
export function verifyHog(model) {
  const option = model.controls
    .find((c) => c.id === "hog1")
    .options.find((o) => o.value === "inhibited");
  assert.match(option.label.zh, /不可磷酸化/);
  assert.match(option.label.en, /nonphosphorylatable/i);
  const s = model.create(),
    cargo = named(s, "Hog1 transport cargo"),
    hogP = named(s, "Hog1 activation phosphate"),
    pbsP = named(s, "Pbs2 activation phosphate"),
    aperture = named(s, "Hog1 transport pore aperture"),
    surface = named(s, "Nuclear envelope cut surface");
  const innerRadius =
    aperture.geometry.parameters.radius - aperture.geometry.parameters.tube;
  const vertices = cargoVertices(cargo),
    v = new THREE.Vector3(),
    poreLocal = new THREE.Vector3(),
    cutLocal = new THREE.Vector3(),
    centerAtPore = new THREE.Vector3();
  // Infer the real cut gap from referenced surface vertices, not a declared angle.
  const geometry = surface.geometry,
    angleSet = new Set();
  for (const i of geometry.index.array) {
    v.fromBufferAttribute(geometry.attributes.position, i);
    let theta = Math.atan2(v.y, v.x);
    if (theta < 0) theta += Math.PI * 2;
    angleSet.add(theta);
  }
  const angles = [...angleSet].sort((x, y) => x - y);
  let hole = null;
  for (let i = 0; i < angles.length - 1; i++)
    if (
      angles[i] < Math.PI &&
      angles[i + 1] > Math.PI &&
      angles[i + 1] - angles[i] > 0.5
    )
      hole = [angles[i], angles[i + 1]];
  assert(
    hole,
    "operons-05: no real opening in the envelope along the transport route",
  );
  let importCrossings = 0,
    exportCrossings = 0;
  for (const params of scenarios(model)) {
    let entered = false,
      previousInside = false;
    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      s.update(t, params);
      s.group.updateMatrixWorld(true);
      const inside =
        ((cargo.position.x - 1.18) / 0.95) ** 2 +
          ((cargo.position.y - 0.12) / 0.91) ** 2 <
        1;
      if (inside && !previousInside) {
        assert(
          pbsP.visible && hogP.visible,
          `operons-03: entry before activation at ${t}`,
        );
        importCrossings++;
        entered = true;
      }
      if (!inside && previousInside) exportCrossings++;
      if (t <= 0.51)
        assert(!inside, `operons-03: premature nuclear location at ${t}`);
      if (params.osmolarity === "unchanged" || params.hog1 === "inhibited") {
        assert(!inside);
        assert(!hogP.visible);
      }
      previousInside = inside;
      // Every visible molecular vertex intersecting the channel slab must fit its
      // actual torus inner radius; this catches cargo too wide for the drawn pore.
      cargo.getWorldPosition(centerAtPore);
      aperture.worldToLocal(centerAtPore);
      for (const item of vertices) {
        if (!item.mesh.visible) continue;
        v.copy(item.point).applyMatrix4(item.mesh.matrixWorld);
        poreLocal.copy(v);
        aperture.worldToLocal(poreLocal);
        if (Math.abs(centerAtPore.z) < 0.12)
          assert(
            Math.hypot(poreLocal.x, poreLocal.y) < innerRadius - 0.006,
            `operons-05: cargo clips pore wall at p=${t}`,
          );
        cutLocal.copy(v);
        surface.worldToLocal(cutLocal);
        const r = Math.hypot(cutLocal.x, cutLocal.y);
        if (r > 0.99 && r < 1.065) {
          let theta = Math.atan2(cutLocal.y, cutLocal.x);
          if (theta < 0) theta += Math.PI * 2;
          assert(
            theta > hole[0] && theta < hole[1],
            `operons-05: molecular extent crosses closed envelope at p=${t}`,
          );
        }
      }
    }
    assert.equal(
      entered,
      params.osmolarity === "high" && params.hog1 === "active",
    );
  }
  assert.equal(importCrossings, 1);
  assert.equal(exportCrossings, 1);
}

function snapshot(s) {
  s.group.updateMatrixWorld(true);
  const values = [];
  s.group.traverse((o) =>
    values.push([
      o.visible,
      o.matrix.elements,
      o.instanceMatrix ? Array.from(o.instanceMatrix.array) : null,
      o.geometry?.drawRange,
      o.material?.uuid,
    ]),
  );
  return JSON.stringify([values, s.labels, s.group.userData]);
}
async function verifyResources(model) {
  const s = model.create(),
    initial = [];
  s.group.traverse((o) => initial.push([o, o.geometry]));
  const mats = new Set(s.materials);
  for (const params of scenarios(model)) {
    for (const t of [NaN, 0, 0.4, 0.56, 0.61, 0.9, 0.95, 1]) {
      s.update(t, params);
      s.group.updateMatrixWorld(true);
      const current = [];
      s.group.traverse((o) => {
        current.push([o, o.geometry]);
        for (const arr of [
          o.position.toArray(),
          o.scale.toArray(),
          o.quaternion.toArray(),
          o.instanceMatrix?.array ?? [],
          ...Object.values(o.geometry?.attributes ?? {}).map((x) => x.array),
        ])
          assert(Array.from(arr).every(Number.isFinite));
        if (o.material) assert(mats.has(o.material));
      });
      assert.deepEqual(current, initial);
      const size = new THREE.Box3()
        .setFromObject(s.group)
        .getSize(new THREE.Vector3());
      assert(
        Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
      );
    }
    s.update(0.61, params);
    const expected = snapshot(s);
    s.update(0.95, params);
    s.update(0.2, params);
    s.update(0.61, params);
    assert.equal(snapshot(s), expected);
  }
  await build({
    entryPoints: [new URL(`./${model.id}Process.js`, import.meta.url).pathname],
    bundle: true,
    write: false,
    platform: "browser",
    logLevel: "silent",
  });
}
verifyLac(lac);
verifyTrp(trp);
verifyHog(hog);
for (const model of [lac, trp, gal, hog]) await verifyResources(model);
console.log(
  "operons science: 5 issue invariants PASS; actual DNA bases/backbones, full Hog1 transport geometry, event order, all 16 conditions, deterministic seek, finite buffers, stable resources and esbuild.",
);
