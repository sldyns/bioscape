import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { nucleosomeReference } from "../src/scene/nucleosomeReference.js";
import { loadSceneReferences } from "./helpers/load-scene-references.mjs";

const { loadDetailModel } = await loadSceneReferences(
  'export { loadDetailModel } from "./src/scene/loadDetailModel.js";',
);

const data = JSON.parse(
  readFileSync(
    new URL("../src/scene/data/nucleosome-1kx5.json", import.meta.url),
  ),
);
const V = (...p) => new THREE.Vector3(...p);
const at = (flat, index) =>
  V(...flat.slice(index * 3, index * 3 + 3)).divideScalar(data.coordinateScale);
const mean = (a) => a.reduce((s, v) => s.add(v), V()).divideScalar(a.length);
const project = (v, n) => v.clone().addScaledVector(n, -v.dot(n));
const angle = (a, b, n) => Math.atan2(n.dot(V().crossVectors(a, b)), a.dot(b));

assert.equal(data.pdb, "1KX5");
assert.equal(data.resolutionAngstrom, 1.94);
assert.equal(
  data.sourceSha256,
  "6f99aa27cffb3174d0406ebd644eba6475bed61047305aac94fb844d3718112a",
);
assert.deepEqual(
  data.histones.map((h) => h.chain + "/" + h.family),
  ["A/H3", "B/H4", "C/H2A", "D/H2B", "E/H3", "F/H4", "G/H2A", "H/H2B"],
);
assert.deepEqual(
  data.histones.map((h) => [h.start, h.ca.length / 3]),
  [
    [33, 103],
    [24, 79],
    [15, 106],
    [22, 101],
    [31, 105],
    [16, 87],
    [13, 109],
    [24, 99],
  ],
);
assert.equal(
  data.histones.reduce((n, c) => n + c.occupiedCa, 0),
  860,
);
for (const chain of data.histones) {
  for (let i = 1; i < chain.ca.length / 3; i++) {
    const d = at(chain.ca, i).distanceTo(at(chain.ca, i - 1));
    assert.ok(d > 2.7 && d < 4.5, chain.chain + " bridges a coordinate gap");
  }
}
const rotation = data.rotation.map((n) => V(...n));
assert.ok(
  Math.abs(rotation[0].dot(V().crossVectors(rotation[1], rotation[2])) - 1) <
    1e-9,
);

const [a, b] = data.dna;
assert.deepEqual([a.chain, b.chain], ["I", "J"]);
for (const strand of data.dna) {
  assert.deepEqual([strand.first, strand.last], [-73, 73]);
  assert.equal(strand.rings.length, 147);
  assert.equal(strand.path.length / 3, 295); // 5' O5' + both rails + terminal O3'
  assert.equal(strand.sugars.length / 3, 147 * 5);
  assert.ok(strand.rings.every((r) => r.length === 18 || r.length === 27));
}
const pairCenters = [],
  pairDirections = [];
let supportedContacts = 0;
for (let i = 0; i < 147; i++) {
  const j = 146 - i;
  const x = at(a.sugars, i * 5 + 2),
    y = at(b.sugars, j * 5 + 2);
  const crossWidth = x.distanceTo(y);
  assert.ok(crossWidth > 8.5 && crossWidth < 12.6);
  // RCSB I and J occur in chemical order; reversed indices are paired.
  assert.equal(a.rings[i].length + b.rings[j].length, 45);
  const d = at(data.contacts, 2 * i).distanceTo(at(data.contacts, 2 * i + 1));
  assert.ok(d > 2.4 && d < 4.3);
  if (d <= 3.5) supportedContacts++;
  pairCenters.push(x.clone().lerp(y, 0.5));
  pairDirections.push(y.sub(x));
}
assert.equal(supportedContacts, 146);
const discAxis = V(...data.discAxis).normalize();
const radial = pairCenters.map((p) => project(p, discAxis).normalize());
const phase = [0];
for (let i = 1; i < 147; i++)
  phase.push(phase[i - 1] + angle(radial[i - 1], radial[i], discAxis));
const z = pairCenters.map((p) => p.dot(discAxis));
const avg = (v) => v.reduce((x, y) => x + y, 0) / v.length;
const meanPhase = avg(phase),
  meanZ = avg(z);
const slope =
  phase.reduce((sum, x, i) => sum + (x - meanPhase) * (z[i] - meanZ), 0) /
  phase.reduce((sum, x) => sum + (x - meanPhase) ** 2, 0);
const pitch = slope * Math.PI * 2;
assert.ok(pitch < -22 && pitch > -29, "global wrap must be left-handed");
const smooth = pairCenters.map((p, i) =>
  mean(pairCenters.slice(Math.max(0, i - 4), Math.min(147, i + 5))),
);
const twist = [];
for (let i = 0; i < 146; i++) {
  const tangent = smooth[Math.min(146, i + 2)]
    .clone()
    .sub(smooth[Math.max(0, i - 1)])
    .normalize();
  twist.push(
    (angle(
      project(pairDirections[i], tangent),
      project(pairDirections[i + 1], tangent),
      tangent,
    ) *
      180) /
      Math.PI,
  );
}
assert.ok(twist.every((step) => step > 15 && step < 55));
assert.ok(
  avg(twist) > 33 && avg(twist) < 36,
  "local duplex must be right-handed",
);
assert.deepEqual(data.window, [43, 73]);
assert.deepEqual(data.frontDimer, ["C", "D"]);

const colors = { H2A: "947b9b", H2B: "b58e87", H3: "698298", H4: "ae9f7d" };
const view = V(0.05, 0.065, 1).normalize();
const totals = {};
for (const id of ["nucleosome", "histones"]) {
  const g = nucleosomeReference(id, data);
  g.updateMatrixWorld(true);
  const allVertices = g.children.reduce(
    (n, m) => n + m.geometry.attributes.position.count,
    0,
  );
  const meshCount = g.children.length;
  const verticesByColor = new Map();
  for (const m of g.children) {
    const p = m.geometry.attributes.position,
      n = m.geometry.attributes.normal;
    assert.ok(m.isMesh && m.geometry.index && !m.material.transparent);
    assert.equal(p.count, n.count);
    assert.ok(p.array.every(Number.isFinite) && n.array.every(Number.isFinite));
    for (let i = 0; i < n.count; i += 71)
      assert.ok(Math.abs(V().fromBufferAttribute(n, i).length() - 1) < 1e-5);
    for (const index of m.geometry.index.array) assert.ok(index < p.count);
    if (m.userData.hitId === "histones") {
      const color = m.material.color.getHexString();
      verticesByColor.set(color, (verticesByColor.get(color) || 0) + p.count);
    }
  }
  assert.deepEqual(
    new Set(verticesByColor.keys()),
    new Set(Object.values(colors)),
  );
  if (id === "nucleosome") {
    assert.ok(meshCount <= 12 && allVertices < 120000);
    assert.deepEqual(
      new Set(g.children.map((m) => m.userData.hitId)),
      new Set(["histones", "dna"]),
    );
    assert.deepEqual(Object.keys(g.userData.partAnchors).sort(), [
      "dna",
      "histones",
    ]);
    assert.deepEqual(Object.keys(g.annotationTargets).sort(), [
      "dna",
      "histones",
    ]);
    assert.ok(Object.values(g.annotationTargets).every((p) => p.length >= 3));
  } else {
    assert.ok(meshCount <= 6);
    assert.ok(g.children.every((m) => m.userData.hitId === "histones"));
    assert.equal(g.userData.partAnchors, undefined);
    assert.deepEqual(
      g.userData.landmarks
        .filter((m) => !m.visibleModes || m.visibleModes.includes("whole"))
        .map((l) => l.zh),
      Object.keys(colors).map((f) => f + " × 2"),
    );
  }
  totals[id] = {};
  const loaded = await loadDetailModel(id);
  for (const mode of ["whole", "section"]) {
    const visible = (m) =>
      mode === "whole" ? !m.userData.cutOnly : !m.userData.cap;
    const meshes = g.children.filter(visible);
    totals[id][mode] = meshes.reduce(
      (sum, m) => sum + m.geometry.index.count / 3,
      0,
    );
    assert.equal(
      loaded.children
        .filter(visible)
        .reduce((count, mesh) => count + mesh.geometry.index.count / 3, 0),
      totals[id][mode],
      id + " detail loader must preserve the " + mode + " structure",
    );
    const active = (g.userData.landmarks || []).filter(
      (m) => !m.visibleModes || m.visibleModes.includes(mode),
    );
    if (id === "histones") {
      assert.deepEqual(
        active.map((m) => m.zh),
        Object.keys(colors).map(
          (family) =>
            family +
            " × " +
            (mode === "section" && ["H2A", "H2B"].includes(family) ? 1 : 2),
        ),
      );
    }
    const checks =
      id === "nucleosome"
        ? Object.entries(g.annotationTargets).flatMap(([hit, targets]) =>
            targets.map((position) => ({ hit, position })),
          )
        : active.map(({ zh, en, position }) => {
            assert.equal(zh, en);
            return { color: colors[zh.split(" ")[0]], position };
          });
    const center = new THREE.Box3().setFromObject(g).getCenter(V());
    for (const p of checks) {
      const point = V(...p.position);
      for (const origin of [
        point.clone().addScaledVector(view, 10),
        center.clone().addScaledVector(view, 7.5),
      ]) {
        const h = new THREE.Raycaster(
          origin,
          point.clone().sub(origin).normalize(),
        ).intersectObjects(meshes, false)[0];
        assert.ok(
          h && h.point.distanceTo(point) < 1e-5,
          id + " " + mode + " label obscured",
        );
        if (p.hit) assert.equal(h.object.userData.hitId, p.hit);
        if (p.color)
          assert.equal(h.object.material.color.getHexString(), p.color);
      }
    }
  }
  assert.ok(
    totals[id].section < totals[id].whole * 0.94,
    id + " cutaway must expose a different structure",
  );
  assert.deepEqual(
    Object.keys(loaded.userData.partAnchors),
    Object.keys(g.userData.partAnchors || {}),
  );
  loaded.children.forEach((mesh) => {
    mesh.geometry.dispose();
    mesh.material.dispose();
  });
  g.children.forEach((m) => {
    m.geometry.dispose();
    m.material.dispose();
  });
}
assert.equal(nucleosomeReference("chromatin", data), null);
assert.equal(nucleosomeReference("dna", data), null);
console.log(
  JSON.stringify({
    pdb: data.pdb,
    foldCa: 789,
    basePairs: 147,
    closeContacts: supportedContacts,
    globalPitchAngstromPerTurn: +pitch.toFixed(2),
    meanLocalTwistDegrees: +avg(twist).toFixed(2),
    triangles: totals,
  }),
);
