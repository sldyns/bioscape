import assert from "node:assert/strict";
import {
  smoothFusionProfile,
  fusionEnvelope,
  profileAtX,
} from "./fusionProfiles.js";
import autophagy from "./autophagyProcess.js";
import endocytosis from "./endocytosisProcess.js";
const points = [
  [-1.92, 0],
  [-1.75, 0.68],
  [-1.27, 1.19],
  [-0.55, 1.42],
  [0.15, 1.18],
  [0.6, 0.64],
  [0.91, 0.56],
  [1.4, 0.81],
  [2.05, 0.92],
  [2.66, 0.64],
  [2.94, 0],
];
const profile = smoothFusionProfile(points);
for (let i = 1; i < points.length - 1; i++) {
  const t = i / (points.length - 1),
    h = 1e-6,
    a = profile(t - h),
    b = profile(t),
    c = profile(t + h);
  for (let j = 0; j < 2; j++)
    assert(
      Math.abs((b[j] - a[j]) / h - (c[j] - b[j]) / h) < 0.002,
      "C1 continuity at control-point join",
    );
}
for (const [left, right, k] of [
  [[-0.5, 1.42], [2.02, 0.92], 1.2],
  [[0.35, 0.96], [2.35, 1.05], 0.16],
]) {
  const envelope = fusionEnvelope(profile, left, right, k);
  for (let i = 1; i < 1000; i++)
    assert(
      envelope(i / 1000, 0)[1] > 0,
      "nascent fusion has a continuous open lumen",
    );
}
for (let i = 1; i < 100; i++) {
  const [x, r] = profile(i / 100);
  assert(Math.abs(profileAtX(profile, x)[0] - r) < 1e-5);
}
function inventory(group) {
  const nodes = [],
    geometries = new Set(),
    materials = new Set();
  group.traverse((o) => {
    nodes.push(o.uuid);
    if (o.geometry) geometries.add(o.geometry.uuid);
    for (const m of o.material
      ? Array.isArray(o.material)
        ? o.material
        : [o.material]
      : [])
      materials.add(m.uuid);
  });
  return [nodes, [...geometries], [...materials]];
}
for (const definition of [autophagy, endocytosis]) {
  const s = definition.create(),
    initial = inventory(s.group);
  for (const p of [
    ...definition.stages.map((x) => x.at),
    ...Array.from({ length: 61 }, (_, i) => 0.62 + i * 0.003),
    1,
    0,
    0.73,
    0.44,
  ]) {
    s.update(p);
    assert.deepEqual(inventory(s.group), initial);
    s.group.traverse((o) => {
      if (o.geometry)
        for (const attr of Object.values(o.geometry.attributes))
          assert(attr.array.every(Number.isFinite));
    });
  }
  if (definition.id === "autophagy") {
    s.update(0.7);
    assert(s.group.userData.innerMembraneIntact);
    s.update(0.8);
    assert.equal(s.group.userData.innerMembraneDegradation, 1);
    assert.equal(s.group.userData.cargoDegradation, 0);
    s.update(0.94);
    assert(s.group.userData.cargoDegradation > 0);
  }
  console.log(
    definition.id,
    "stable nodes/geometries/materials",
    initial.map((x) => x.length),
  );
}
console.log(
  "Fusion profiles: smooth joins, positive lumen, anchors, stages, resource stability, barrier order passed.",
);
