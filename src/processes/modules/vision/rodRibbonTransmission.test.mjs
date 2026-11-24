import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { THREE } from "../../kit.js";
import process from "./rodRibbonTransmissionProcess.js";
import { EVENTS, TOKENS_PER_VESICLE } from "./rodRibbonSignals.js";
import {
  RELEASE,
  CALCIUM_SITE,
  TRPM_SITE,
  ROD_Y,
  TIP_Y,
  HALF_MEMBRANE,
  FUSION_PATCH,
  roofY,
  POCKETS,
  VESICLE_RADIUS,
} from "./rodRibbonAnatomy.js";

const model = process.create({ rootId: "rodPhotoreceptor" }),
  { group } = model;
const named = (name) => {
  const o = group.getObjectByName(name);
  assert.ok(o, name);
  return o;
};
const cargo = named("glutamate-markers"),
  ca = named("presynaptic-calcium-markers"),
  post = named("postsynaptic-cation-markers");
const vesicles = EVENTS.map((_, i) => named("loaded-vesicle-" + i));
const collars = RELEASE.map((_, i) => named("active-zone-fusion-collar-" + i));
const m4 = new THREE.Matrix4(),
  vec = new THREE.Vector3();
const near = (actual, expected, msg, tol = 3e-5) =>
  assert.ok(
    Math.abs(actual - expected) < tol,
    msg + " | " + actual + " vs " + expected,
  );
function actual(mesh, i) {
  mesh.getMatrixAt(i, m4);
  return {
    x: m4.elements[12],
    y: m4.elements[13],
    z: m4.elements[14],
    size: Math.hypot(...m4.elements.slice(0, 3)),
  };
}
function sample(t, illumination) {
  model.update(t, { illumination });
  group.updateMatrixWorld(true);
  return group.userData;
}
function insideHole(geom, x, z, y) {
  const ray = new THREE.Raycaster(
    new THREE.Vector3(x, y + 0.3, z),
    new THREE.Vector3(0, -1, 0),
    0,
    0.55,
  );
  return ray.intersectObject(geom, false).length === 0;
}
const labels = model.labels;
assert.ok(labels.length >= 8);
function anchors() {
  let visible = 0;
  for (const l of labels) {
    if (!l.active) continue;
    visible++;
    assert.ok(l.text.en.trim() && l.text.zh.trim());
    const obj = named(l.anchorName);
    obj.getVertexPosition(l.anchorVertex, vec);
    obj.localToWorld(vec);
    l.position.forEach((v, i) =>
      near(v, vec.getComponent(i), "label follows native mesh"),
    );
  }
  assert.ok(visible >= 2 && visible <= 3);
}
const topology = [];
group.traverse((o) => {
  if (o.geometry)
    topology.push([
      o,
      o.geometry,
      o.geometry.attributes.position.array,
      o.geometry.index?.array,
      o.instanceMatrix?.array,
    ]);
});
function fixedTopology() {
  const now = [];
  group.traverse((o) => {
    if (o.geometry) now.push(o);
  });
  assert.equal(now.length, topology.length);
  for (const [i, [o, g, p, ix, instances]] of topology.entries()) {
    assert.equal(now[i], o);
    assert.equal(o.geometry, g);
    assert.equal(g.attributes.position.array, p);
    assert.equal(g.index?.array, ix);
    assert.equal(o.instanceMatrix?.array, instances);
  }
}
// Inspect the complete cut geometry, including the back face of the curved roof.
const clearanceReport = {};
function clearanceOf(o, presynaptic) {
  const matrix = new THREE.Matrix4(),
    instance = new THREE.Matrix4(),
    point = new THREE.Vector3();
  const positions = o.geometry.attributes.position;
  let gap = Infinity;
  for (let index = 0; index < (o.isInstancedMesh ? o.count : 1); index++) {
    matrix.copy(o.matrixWorld);
    if (o.isInstancedMesh) {
      o.getMatrixAt(index, instance);
      matrix.multiply(instance);
    }
    for (let i = 0; i < positions.count; i++) {
      o.getVertexPosition(i, point).applyMatrix4(matrix);
      const d = point.y - roofY(point.x, point.z);
      gap = Math.min(gap, (presynaptic ? d : -d) - HALF_MEMBRANE);
    }
  }
  return gap;
}
sample(0, "step");
for (const name of [
  "RIBEYE-ribbon-front",
  "RIBEYE-ribbon-back",
  "ribbon-tethered-vesicle-membranes",
  "ribbon-tethered-vesicle-contents",
  "ribbon-vesicle-tethers",
  "rod-cytosolic-vesicles",
  "horizontal-process--1",
  "horizontal-process-1",
]) {
  const d = clearanceOf(named(name), !name.startsWith("horizontal"));
  assert.ok(d > 0, name + " crosses the invaginated membrane at " + d);
  clearanceReport[name] = Number(d.toFixed(5));
}
const hcs = [named("horizontal-process--1"), named("horizontal-process-1")];
const ray = new THREE.Raycaster(),
  down = new THREE.Vector3(0, -1, 0);
for (const [index, event] of EVENTS.entries()) {
  for (const delta of [
    -0.05, -0.01, 0.039, 0.053, 0.067, 0.081, 0.093, 0.112,
  ]) {
    sample(event.at + delta, "dark");
    const v = vesicles[index];
    if (delta < 0)
      assert.ok(
        clearanceOf(v, true) > -1e-6,
        "intact vesicle remains completely presynaptic",
      );
    for (let j = 0; j < TOKENS_PER_VESICLE; j++) {
      const id = 1 + index * TOKENS_PER_VESICLE + j;
      if (cargo.userData.compartments[id] !== "cleft") continue;
      const pos = actual(cargo, id);
      for (const [x, z] of [
        [0, 0],
        [-0.021, 0],
        [0.021, 0],
        [0, -0.018],
        [0, 0.018],
      ]) {
        ray.set(new THREE.Vector3(pos.x + x, ROD_Y + 0.4, pos.z + z), down);
        for (const hc of hcs) {
          const hits = ray.intersectObject(hc, false);
          if (hits.length >= 2) {
            const high = hits[0].point.y,
              low = hits.at(-1).point.y;
            assert.ok(
              pos.y + 0.016 < low || pos.y - 0.016 > high,
              "released ligand stays in the cleft outside both horizontal processes",
            );
          }
        }
      }
    }
  }
}
const conditions = ["step", "dark", "light"];
const total = 1 + EVENTS.length * TOKENS_PER_VESICLE;
assert.equal(cargo.count, total);
assert.equal(process.controls[0].default, "step");
assert.deepEqual(
  process.controls[0].options.map((o) => o.value),
  conditions,
);
assert.equal(process.id, "rodRibbonTransmission");
assert.equal(process.stages.length, 8);
assert.ok(
  process.stages.every(
    (s, i) =>
      s.title.zh &&
      s.title.en &&
      s.description.zh &&
      s.description.en &&
      (!i || s.at > process.stages[i - 1].at),
  ),
);
assert.ok(process.sources.every((s) => s.url.startsWith("https://")));
for (const p of [0, 0.18, 0.238]) {
  const baseline = { ...sample(p, "dark") };
  for (const condition of ["step", "light"]) {
    const s = sample(p, condition);
    for (const key of [
      "rodHyperpolarization",
      "calciumDrive",
      "cleftGlutamate",
      "mGluR6",
      "go",
      "trpm",
      "bipolarDepolarization",
      "committedVesicles",
    ])
      assert.equal(s[key], baseline[key], "common preceding dark state");
  }
}
sample(0, "dark");
for (const [i, v] of vesicles.entries()) {
  const tether = named("tracked-vesicle-tether-" + i);
  const attachment = tether.localToWorld(new THREE.Vector3(0, 0.5, 0));
  const center = new THREE.Vector3(
    v.position.x,
    v.position.y + VESICLE_RADIUS,
    v.position.z,
  );
  near(
    attachment.distanceTo(center),
    VESICLE_RADIUS,
    "tether ends at vesicle membrane",
  );
}
const dark = { ...sample(0.69, "dark") },
  light = { ...sample(0.69, "light") };
assert.ok(light.rodHyperpolarization > dark.rodHyperpolarization);
for (const key of ["calciumDrive", "cleftGlutamate", "mGluR6", "go"])
  assert.ok(light[key] < dark[key], key);
for (const key of ["trpm", "bipolarDepolarization"])
  assert.ok(light[key] > dark[key], key);
for (const key of [
  "rodHyperpolarization",
  "calciumDrive",
  "cleftGlutamate",
  "mGluR6",
  "go",
  "trpm",
  "bipolarDepolarization",
]) {
  near(sample(1, "step")[key], dark[key], "return to dark level for " + key);
  near(sample(1, "light")[key], light[key], "maintained light for " + key);
}
const terminalTotals = {};
const crossCount = { rodUp: 0, dendriteDown: 0, ligandInsidePore: 0 };
const ionGates = [
  [ca, named("CaV1.4-gate"), CALCIUM_SITE, ROD_Y, "rodUp"],
  [post, named("TRPM1-gate"), TRPM_SITE, TIP_Y, "dendriteDown"],
];
const porePairs = new Set();
for (const condition of conditions) {
  let lastCommitted = 0;
  for (let tick = 0; tick <= 1000; tick++) {
    const p = tick / 1000,
      s = sample(p, condition),
      comps = cargo.userData.compartments;
    const measured = { vesicle: 0, pore: 0, cleft: 0, receptor: 0, outside: 0 };
    for (let i = 0; i < total; i++) {
      const c = comps[i],
        pos = actual(cargo, i);
      assert.ok(Object.hasOwn(measured, c));
      measured[c]++;
      if (c === "outside") {
        near(pos.size, 0, "material exits the represented volume");
        continue;
      }
      assert.ok(pos.size > 0, "tracked visible marker");
      if (c === "receptor") {
        assert.ok(
          POCKETS.some(
            ([x, y, z]) => Math.hypot(x - pos.x, y - pos.y, z - pos.z) < 0.0001,
          ),
          "bound ligand in physical receptor pocket",
        );
      }
      if (c === "cleft") {
        assert.ok(
          pos.y < ROD_Y - HALF_MEMBRANE + 1e-6 && pos.y > TIP_Y + HALF_MEMBRANE,
          "cleft marker remains extracellular",
        );
      }
      if (i === 0) continue;
      const idx = Math.floor((i - 1) / TOKENS_PER_VESICLE),
        ev = EVENTS[idx],
        v = vesicles[idx],
        lane = ev.lane;
      if (
        c === "vesicle" &&
        ["docked", "approaching", "tethered"].includes(v.userData.phase)
      ) {
        const centerY = v.position.y + VESICLE_RADIUS;
        assert.ok(
          Math.hypot(
            pos.x - v.position.x,
            pos.z - v.position.z,
            pos.y - centerY,
          ) <
            VESICLE_RADIUS - 0.01,
          "payload stays inside an existing vesicle",
        );
      }
      if (c === "pore") {
        const [x, z] = RELEASE[lane],
          r = 0.112 * collars[lane].morphTargetInfluences[0];
        assert.ok(
          Math.hypot(pos.x - x, pos.z - z) + 0.036 < r,
          "entire ligand fits in the current fusion opening",
        );
        assert.ok(
          insideHole(collars[lane], pos.x + 0.0001, pos.z, ROD_Y),
          "no membrane face blocks the ligand",
        );
        assert.equal(v.userData.phase, "fusing");
        crossCount.ligandInsidePore++;
        porePairs.add(condition + "/" + idx);
      }
    }
    assert.deepEqual(measured, s.cargo);
    assert.equal(
      Object.values(s.cargo).reduce((a, b) => a + b, 0),
      total,
      "finite cargo conservation",
    );
    assert.ok(s.committedVesicles >= lastCommitted);
    lastCommitted = s.committedVesicles;
    for (const [ions, gate, [gx, gz], gy] of ionGates) {
      for (let i = 0; i < ions.count; i++) {
        const pos = actual(ions, i);
        if (pos.size < 0.001 || Math.abs(pos.y - gy) > HALF_MEMBRANE) continue;
        assert.ok(
          Math.hypot(pos.x - gx, pos.z - gz) + pos.size < gate.userData.radius,
          "whole ion fits through its open membrane gate",
        );
      }
    }
    anchors();
  }
  terminalTotals[condition] = lastCommitted;
  for (const [ions, gate, [gx, gz], gy, kind] of ionGates) {
    for (const [i, t] of ions.userData.crossingTimes.entries()) {
      if (t < 0.02 || t > 0.98) continue;
      sample(t - 0.012, condition);
      const from = actual(ions, i);
      sample(t + 0.012, condition);
      const to = actual(ions, i);
      if (from.size < 0.005 || to.size < 0.005) continue;
      assert.equal(Math.sign(to.y - from.y), kind === "rodUp" ? 1 : -1);
      assert.ok((to.y - gy) * (from.y - gy) < 0, "ion changes compartments");
      sample(t, condition);
      const at = actual(ions, i);
      near(at.x, gx, "ion centered on gate x");
      near(at.z, gz, "ion centered on gate z");
      assert.ok(insideHole(gate, gx + 0.006, gz + 0.002, gy));
      crossCount[kind]++;
    }
  }
  fixedTopology();
}
assert.deepEqual(terminalTotals, { step: 5, dark: 8, light: 3 });
assert.equal(
  porePairs.size,
  terminalTotals.step + terminalTotals.dark + terminalTotals.light,
);
const zoneTop = named("presynaptic-active-zone-upper"),
  zoneBottom = named("presynaptic-active-zone-lower");
for (const [i, { at, lane }] of EVENTS.entries()) {
  const [x, z] = RELEASE[lane];
  sample(at - 0.012, "dark");
  const shell = vesicles[i];
  assert.equal(shell.userData.phase, "docked");
  near(shell.position.x, x, "preloaded vesicle docked at aperture x");
  near(shell.position.z, z, "preloaded vesicle docked at aperture z");
  near(
    shell.position.y,
    ROD_Y + HALF_MEMBRANE,
    "vesicle contacts the cytoplasmic leaflet before opening",
  );
  assert.ok(
    !insideHole(collars[lane], x + 0.016, z, ROD_Y),
    "closed membrane at dock",
  );
  for (const delta of [0.006, 0.026, 0.065, 0.087, 0.096]) {
    sample(at + delta, "dark");
    const collar = collars[lane];
    const shellEdge = shell.localToWorld(
      shell.getVertexPosition(0, new THREE.Vector3()),
    );
    near(
      shellEdge.y,
      ROD_Y + HALF_MEMBRANE,
      "vesicle lip meets cytoplasmic face",
    );
    near(
      Math.hypot(shellEdge.x - x, shellEdge.z - z),
      0.112 * collar.morphTargetInfluences[0],
      "fusion aperture matches the vesicle lip radius",
    );
  }
  sample(at + 0.035, "dark");
  for (const membrane of [zoneTop, zoneBottom]) {
    assert.ok(
      insideHole(membrane, x + 0.018, z, ROD_Y),
      "physical hole in both host leaflets",
    );
    assert.ok(
      !insideHole(membrane, x + FUSION_PATCH + 0.021, z, ROD_Y),
      "surrounding active-zone bilayer is present",
    );
  }
  sample(at + 0.108, "dark");
  assert.ok(
    !insideHole(collars[lane], x + 0.016, z, ROD_Y),
    "membrane reseals after release",
  );
}
for (const [gate, site, y, closed, open] of [
  [ionGates[0][1], CALCIUM_SITE, ROD_Y, "light", "dark"],
  [ionGates[1][1], TRPM_SITE, TIP_Y, "dark", "light"],
]) {
  sample(0.69, closed);
  assert.ok(
    !insideHole(gate, site[0] + 0.045, site[1], y),
    "low-probability gate restricts its physical opening",
  );
  sample(0.69, open);
  assert.ok(
    insideHole(gate, site[0] + 0.045, site[1], y),
    "high-probability gate has a passable lumen",
  );
}
function hash() {
  const h = createHash("sha256");
  for (const [o] of topology) {
    h.update(Buffer.from(new Float64Array(o.matrixWorld.elements).buffer));
    if (o.instanceMatrix) h.update(Buffer.from(o.instanceMatrix.array.buffer));
    if (o.morphTargetInfluences)
      h.update(Buffer.from(new Float64Array(o.morphTargetInfluences).buffer));
  }
  h.update(JSON.stringify(group.userData));
  h.update(JSON.stringify(cargo.userData.compartments));
  h.update(JSON.stringify(labels));
  return h.digest("hex");
}
const times = [
  0, 0.075, 0.121, 0.164, 0.202, 0.29, 0.397, 0.428, 0.527, 0.593, 0.631, 0.69,
  0.823, 0.951, 1,
];
const expected = new Map();
for (const condition of conditions)
  for (const t of times) {
    sample(t, condition);
    expected.set(condition + t, hash());
  }
for (let j = 0; j < 3; j++)
  for (let i = 0; i < times.length; i++) {
    const p = times[(7 * i + 4 * j) % times.length],
      condition = conditions[(j + i) % 3];
    model.setParameters({ illumination: condition });
    model.setProgress(p);
    group.updateMatrixWorld(true);
    assert.equal(
      hash(),
      expected.get(condition + p),
      "seek and condition restore mesh positions, contents, all labels and currents",
    );
  }
sample(0.69, "dark");
model.setParameters({ illumination: "light" });
assert.equal(group.userData.illumination, "light");
model.setProgress(0.9);
assert.equal(group.userData.illumination, "light");
assert.ok(
  crossCount.rodUp > 20 &&
    crossCount.dendriteDown > 10 &&
    crossCount.ligandInsidePore > 100,
);
console.log(
  JSON.stringify({
    process: process.id,
    cargoMarkers: total,
    conditions: terminalTotals,
    sampledStates: 3003,
    seekComparisons: 45,
    transitObservations: crossCount,
    eventConditionPairs: porePairs.size,
    stableMeshes: topology.length,
    labels: labels.length,
    membraneClearances: clearanceReport,
  }),
);
