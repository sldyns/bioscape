import assert from "node:assert/strict";
import * as THREE from "three";
import definition from "./phototransductionProcess.js";
import { disposeScene } from "../../disposeScene.js";
import { resolveStageCopy } from "../../stageCopy.js";

const model = definition.create({ rootId: "rodPhotoreceptor" }),
  group = model.group;
const named = (name) => group.getObjectByName(name);
const namedAll = (name) => {
  const all = [];
  group.traverse((o) => {
    if (o.name === name) all.push(o);
  });
  return all;
};
const channel = named("rod-cng-channel"),
  plasma = named("outer-segment-plasma-membrane");
const wall = named("plasma-membrane-with-cng-aperture"),
  disks = group.children.filter((o) => o.name.startsWith("rod-mature-disk-"));
const gates = namedAll("cng-gate-sector"),
  alpha = named("transducin-alpha"),
  pde = named("disk-cytosolic-PDE6");
const ions = [
  ...namedAll("dark-current-sodium"),
  ...namedAll("dark-current-calcium"),
];
assert.equal(disks.length, 3);
assert.equal(gates.length, 4);
assert.equal(namedAll("opsin-transmembrane-helix").length, 7);
assert.equal(namedAll("CNGA1-subunit").length, 3);
assert.equal(namedAll("CNGB1-subunit").length, 1);
const ray = new THREE.Raycaster(),
  point = new THREE.Vector3(),
  direction = new THREE.Vector3(),
  orientation = new THREE.Quaternion();
const geometries = new Set(),
  materials = new Set(model.materials),
  nodes = [];
group.traverse((o) => {
  nodes.push(o.uuid);
  if (o.geometry) geometries.add(o.geometry);
});
for (const g of geometries) {
  for (const attr of Object.values(g.attributes))
    assert(attr.array.every(Number.isFinite));
  if (g.index)
    assert(g.index.array.every((i) => i < g.attributes.position.count));
}
function update(p, illumination) {
  model.update(p, { illumination });
  group.updateMatrixWorld(true);
}
function geometrySignature() {
  const graph = [];
  group.traverse((o) =>
    graph.push([
      o.visible,
      ...o.position.toArray(),
      ...o.quaternion.toArray(),
      ...o.scale.toArray(),
      ...(Array.isArray(o.material)
        ? o.material
        : o.material
          ? [o.material]
          : []
      ).map((m) => m.uuid),
    ]),
  );
  return JSON.stringify([graph, model.labels, group.userData]);
}
function channelRay(x, y) {
  channel.getWorldQuaternion(orientation);
  ray.set(
    channel.localToWorld(point.set(x, y, 0.92)),
    direction.set(0, 0, -1).applyQuaternion(orientation),
  );
  ray.far = 1.84;
}
const top = disks.at(-1);
update(0, "flash");
ray.set(new THREE.Vector3(-0.69, 1.4, -0.55), new THREE.Vector3(0, -1, 0));
ray.far = 2;
const membraneIntersections = ray
  .intersectObject(top, true)
  .map((hit) => hit.point.y);
const levels = [
  ...new Set(membraneIntersections.map((v) => Math.round(v * 1000))),
];
assert.deepEqual(
  levels,
  [255, 201, 19, -35],
  "mature disk has upper and lower bilayers separated by an intradiscal lumen",
);
channelRay(0.014, 0.011);
assert.equal(ray.intersectObject(wall).length, 0);
channelRay(0.72, 0);
assert(
  ray.intersectObject(wall).length > 0,
  "plasma membrane exists adjacent to the true channel opening",
);
const saved = new Map(),
  seenNodes = [];
let poreChecks = 0,
  inPoreDark = 0,
  inPorePeak = 0,
  ionPoses = 0;
for (const illumination of ["flash", "dark", "flash"]) {
  for (const raw of [
    0,
    0.23,
    0.33,
    0.49,
    0.54,
    0.69,
    0.76,
    0.78,
    0.82,
    0.87,
    0.95,
    1,
    NaN,
    -1,
    2,
    0.54,
    0.23,
  ]) {
    const p = THREE.MathUtils.clamp(Number.isFinite(raw) ? raw : 0, 0, 1);
    update(raw, illumination);
    seenNodes.length = 0;
    group.traverse((o) => {
      seenNodes.push(o.uuid);
      if (o.geometry) assert(geometries.has(o.geometry));
      for (const m of Array.isArray(o.material)
        ? o.material
        : o.material
          ? [o.material]
          : [])
        assert(materials.has(m));
      assert(o.matrixWorld.elements.every(Number.isFinite));
      if (o.isInstancedMesh)
        assert(o.boundingSphere && o.boundingSphere.radius > 0);
    });
    assert.deepEqual(seenNodes, nodes);
    const box = new THREE.Box3().setFromObject(group);
    const size = box.getSize(new THREE.Vector3());
    assert(size.length() > 2 && size.length() < 20);
    assert(model.labels.filter((l) => l.active).length <= 3);
    assert(
      model.labels
        .filter((l) => l.active)
        .every(
          (l) => l.position.every(Number.isFinite) && l.text.zh && l.text.en,
        ),
    );
    const key = illumination + " " + p,
      sig = geometrySignature();
    if (saved.has(key)) assert.equal(sig, saved.get(key));
    else saved.set(key, sig);
    const dark = illumination === "dark",
      state = group.userData;
    if (dark) {
      assert.equal(state.retinalIsomer, "11-cis");
      assert.equal(state.transducinState, "GDP");
      assert.equal(state.pdeActivation, 0);
      assert.equal(state.hydrolysisProducts, 0);
      assert.equal(state.gradedHyperpolarization, 0);
      assert.equal(state.channelOpening, 1);
      assert(
        !named("incoming-photon").visible &&
          model.labels[6].active &&
          !model.labels[5].active,
      );
    }
    if (!dark && p === 0.49) {
      assert.equal(state.transducinState, "GTP");
      assert(
        alpha.position.distanceTo(
          new THREE.Vector3(pde.position.x - 0.29, 0.65, pde.position.z + 0.1),
        ) < 0.06,
      );
    }
    if (!dark && p === 0.82) {
      assert.equal(state.hydrolysisProducts, 5);
      assert.equal(state.channelOpening, 0);
      assert.equal(state.gradedHyperpolarization, 1);
    }
    if (!dark && p === 1) {
      assert.equal(state.retinalIsomer, "all-trans");
      assert.equal(state.transducinState, "GDP");
      assert.equal(state.channelOpening, 1);
      assert.equal(state.gradedHyperpolarization, 0);
      assert.equal(state.hydrolysisProducts, 5);
      assert.equal(state.newlySynthesizedCGMP, 5);
    }
    if (state.channelOpening === 0 || state.channelOpening === 1)
      for (const [x, y] of [
        [0.01, 0.013],
        [-0.046, 0.032],
        [0.035, -0.039],
        [-0.023, -0.04],
      ]) {
        channelRay(x, y);
        assert.equal(ray.intersectObject(wall).length, 0);
        assert.equal(
          ray.intersectObjects(gates, false).length > 0,
          state.channelOpening === 0,
        );
        poreChecks++;
      }
  }
}
for (const illumination of ["dark", "flash"])
  for (let frame = 0; frame <= 240; frame++) {
    const p = frame / 240;
    update(p, illumination);
    for (const ion of ions) {
      if (!ion.visible) continue;
      ionPoses++;
      if (Math.abs(ion.position.z) < 0.07) {
        const r = Math.hypot(ion.position.x, ion.position.y) + ion.scale.x;
        assert(
          r < 0.185 * group.userData.channelOpening + 0.001,
          "entire ion fits through the moving channel",
        );
        if (illumination === "dark") inPoreDark++;
        else if (p >= 0.77 && p <= 0.86) inPorePeak++;
      }
      if (ion.position.z < -0.1) {
        ion.getWorldPosition(point);
        assert(
          point.x - ion.scale.x > 1.39,
          "entered cations stay in cytosol beyond the disk rim",
        );
      }
    }
  }
assert(inPoreDark > 65 && inPorePeak === 0);
update(0.82, "flash");
model.setParameters({ illumination: "dark" });
assert.equal(group.userData.channelOpening, 1);
model.setProgress(0.82);
assert.equal(group.userData.illumination, "dark");
model.setParameters({ illumination: "flash" });
assert.equal(group.userData.channelOpening, 0);
for (const st of definition.stages) {
  assert(st.title.zh && st.title.en && st.description.zh && st.description.en);
  const dark = resolveStageCopy(st, { illumination: "dark" });
  assert.notEqual(st.title, dark.title);
  assert(dark.title.zh && dark.description.en);
}
disposeScene(group, model.materials);
console.log(
  JSON.stringify({
    model: definition.id,
    stages: definition.stages.length,
    nodes: nodes.length,
    uniqueGeometries: geometries.size,
    materials: materials.size,
    conditionCopies: definition.stages.length,
    poreRaycasts: poreChecks,
    ionPoses,
    openPoreDarkSamples: inPoreDark,
    closedPoreIonSamples: inPorePeak,
    matureDiskSurfaceHeights: levels.map((v) => v / 1000),
    deterministic: true,
  }),
);
