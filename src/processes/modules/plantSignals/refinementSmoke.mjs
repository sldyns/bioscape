import * as THREE from "three";
import assert from "node:assert/strict";
import { build } from "esbuild";
const targets = [
  "./auxinProcess.js",
  "./plantDefenseProcess.js",
  "../../photosynthesisProcess.js",
];
const snapshot = (s) => {
  s.group.updateMatrixWorld(true);
  const data = [];
  s.group.traverse((o) => {
    data.push(
      o.visible,
      o.matrix.elements,
      o.instanceMatrix ? Array.from(o.instanceMatrix.array) : null,
    );
    if (o.material)
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        data.push(m.color?.toArray(), m.opacity, m.emissiveIntensity);
  });
  return JSON.stringify([data, s.labels, s.group.userData]);
};
const inventory = (s) => {
  const n = new Set(),
    g = new Set(),
    m = new Set();
  s.group.traverse((o) => {
    n.add(o);
    if (o.geometry) g.add(o.geometry);
    if (o.material)
      for (const x of Array.isArray(o.material) ? o.material : [o.material])
        m.add(x);
  });
  return { n, g, m };
};
for (const relative of targets) {
  const url = new URL(relative, import.meta.url);
  const { default: model } = await import(url);
  const s = model.create(),
    original = inventory(s);
  let maxBound = 0;
  const controls = model.controls?.[0],
    conditions = controls
      ? controls.options.map((o) => ({ [controls.id]: o.value }))
      : [{}];
  for (const params of conditions) {
    const states = [];
    for (const p of [NaN, 0, 0.17, 0.35, 0.52, 0.68, 0.81, 1]) {
      s.update(p, params);
      states.push(snapshot(s));
      const box = new THREE.Box3().setFromObject(s.group);
      const size = box.getSize(new THREE.Vector3());
      const longest = Math.max(...size.toArray());
      assert(Number.isFinite(longest) && longest > 2 && longest < 20);
      maxBound = Math.max(maxBound, longest);
      s.group.traverse((o) => {
        for (const arr of [
          o.position.toArray(),
          o.quaternion.toArray(),
          o.scale.toArray(),
          ...(o.geometry
            ? Object.values(o.geometry.attributes).map((a) => a.array)
            : []),
          o.instanceMatrix?.array ?? [],
        ])
          assert(Array.from(arr).every(Number.isFinite));
      });
    }
    if (!controls || Object.values(params)[0] === controls.default)
      assert(new Set(states).size >= 5);
    s.update(0.73, params);
    const before = snapshot(s);
    s.update(0.16, params);
    s.update(0.73, params);
    assert.equal(snapshot(s), before);
  }
  for (let i = 0; i < 60; i++)
    s.update((i % 11) / 10, conditions[i % conditions.length]);
  const end = inventory(s);
  for (const key of ["n", "g", "m"]) {
    assert.equal(end[key].size, original[key].size);
    for (const x of end[key]) assert(original[key].has(x));
  }
  assert.equal(model.stages[0].at, 0);
  for (const stage of model.stages)
    for (const lang of ["zh", "en"])
      assert(stage.title[lang] && stage.description[lang]);
  await build({
    entryPoints: [url.pathname],
    bundle: true,
    write: false,
    platform: "browser",
    logLevel: "silent",
  });
  console.log(
    `${model.id}: PASS ${original.n.size} nodes, ${original.g.size} geometries, ${original.m.size} materials; max bound ${maxBound.toFixed(2)}; finite buffers, seek determinism, conditions, stable resources, esbuild.`,
  );
}
