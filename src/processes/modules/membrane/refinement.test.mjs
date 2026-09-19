import assert from "node:assert/strict";
import * as THREE from "three";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
const ids = [
  "diffusion",
  "activeTransport",
  "osmoticBalance",
  "bacterialCellWall",
];
const variations = {
  diffusion: [
    {},
    { route: "oxygen" },
    { gradient: "equal" },
    { route: "oxygen", gradient: "equal" },
  ],
  activeTransport: [{}, { energy: "none" }],
  osmoticBalance: [
    { tonicity: "hypotonic" },
    { tonicity: "isotonic" },
    { tonicity: "hypertonic" },
  ],
  bacterialCellWall: [{}, { antibiotic: "betaLactam" }],
};
function resources(s) {
  const nodes = [],
    geometry = new Set(),
    material = new Set();
  s.group.traverse((o) => {
    nodes.push(o.uuid);
    if (o.geometry) geometry.add(o.geometry.uuid);
    if (o.material)
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        material.add(m.uuid);
  });
  return { nodes, geometry: [...geometry], material: [...material] };
}
function state(s) {
  const nodes = [],
    geo = new Set();
  s.group.traverse((o) => {
    nodes.push([o.uuid, o.visible, ...o.position, ...o.scale, ...o.quaternion]);
    if (o.instanceMatrix) nodes.push(Array.from(o.instanceMatrix.array));
    if (o.material)
      nodes.push(
        (Array.isArray(o.material) ? o.material : [o.material]).map(
          (m) => m.uuid,
        ),
      );
    if (o.geometry && !geo.has(o.geometry)) {
      geo.add(o.geometry);
      nodes.push(Array.from(o.geometry.attributes.position.array));
    }
  });
  nodes.push(s.group.userData);
  return JSON.stringify(nodes);
}
for (const id of ids) {
  const definition = (await import(`./${id}Process.js`)).default;
  const scene = definition.create();
  const initial = resources(scene),
    poses = new Set();
  for (const params of variations[id]) {
    for (const p of [0, 0.15, 0.33, 0.51, 0.72, 0.9, 1, NaN]) {
      scene.update(p, params);
      scene.group.updateMatrixWorld(true);
      const max = new THREE.Box3()
        .setFromObject(scene.group)
        .getSize(new THREE.Vector3())
        .toArray();
      assert(max.every(Number.isFinite));
      assert(Math.max(...max) > 2 && Math.max(...max) < 20);
      const checked = new Set();
      scene.group.traverse((o) => {
        if (o.geometry && !checked.has(o.geometry)) {
          checked.add(o.geometry);
          for (const attr of Object.values(o.geometry.attributes))
            assert(Array.from(attr.array).every(Number.isFinite));
        }
        if (o.instanceMatrix)
          assert(Array.from(o.instanceMatrix.array).every(Number.isFinite));
      });
      const after = resources(scene);
      assert.deepEqual(after.nodes, initial.nodes);
      assert.deepEqual(after.geometry, initial.geometry);
      if (scene.materials)
        assert(
          after.material.every((m) =>
            scene.materials.some((x) => x.uuid === m),
          ),
        );
      poses.add(state(scene));
    }
    scene.update(0.72, params);
    const a = state(scene);
    scene.update(0.2, params);
    scene.update(0.72, params);
    assert.equal(state(scene), a);
  }
  assert(poses.size >= 4);
  if (id === "diffusion") {
    for (let p = 0; p <= 1; p += 0.025) {
      scene.update(p);
      scene.group.traverse((o) => {
        if (
          o.name.startsWith("diffusing-molecule-") &&
          Math.abs(o.position.y) < 0.76
        ) {
          assert(Math.abs(Math.abs(o.position.x) - 0.46) < 1e-6);
          assert(Math.abs(Math.abs(o.position.z) - 0.46) < 1e-6);
        }
      });
    }
    scene.update(1);
    assert.equal(scene.group.userData.netInward, 8);
    scene.update(1, { gradient: "equal" });
    assert.equal(scene.group.userData.netInward, 0);
    assert.equal(scene.group.userData.waterPores, 4);
  }
  if (id === "activeTransport") {
    for (let p = 0; p <= 1; p += 0.01) {
      scene.update(p);
      const u = scene.group.userData;
      assert(!(u.inwardGateOpen > 0.05 && u.outwardGateOpen > 0.05));
    }
    scene.update(1);
    assert.equal(scene.group.userData.sodiumExported, 3);
    assert.equal(scene.group.userData.potassiumImported, 2);
    scene.update(1, { energy: "none" });
    assert.equal(scene.group.userData.atpHydrolyzed, 0);
  }
  if (id === "osmoticBalance") {
    scene.update(1, { tonicity: "hypotonic" });
    assert(scene.group.userData.geometricVolumeRatio > 1);
    scene.update(1, { tonicity: "isotonic" });
    assert(Math.abs(scene.group.userData.geometricVolumeRatio - 1) < 1e-6);
    scene.update(1, { tonicity: "hypertonic" });
    assert(scene.group.userData.geometricVolumeRatio < 1);
    assert(scene.group.userData.cortexEdges > 10);
  }
  if (id === "bacterialCellWall") {
    scene.update(1);
    assert.equal(scene.group.userData.newCrosslinks, 2);
    scene.update(1, { antibiotic: "betaLactam" });
    assert.equal(scene.group.userData.newCrosslinks, 0);
    assert.equal(scene.group.userData.terminalDAlanineReleased, 0);
    assert(scene.group.userData.pbpCovalentlyBlocked);
  }
  await build({
    entryPoints: [fileURLToPath(new URL(`./${id}Process.js`, import.meta.url))],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
  });
  console.log(
    `${id}: PASS; ${initial.nodes.length} nodes, ${initial.geometry.length} geometries; finite buffers, bounds, deterministic controls, resource stability, mechanism invariants, esbuild`,
  );
}
