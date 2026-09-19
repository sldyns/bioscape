import assert from "node:assert/strict";
import * as THREE from "three";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
const cases = [
  ["translation", ["cell", "plant", "yeast", "paramecium"]],
  ["proteinFolding", ["cell", "plant", "yeast"], "cycle", ["complete", "hold"]],
  ["alternativeSplicing", ["cell"], "isoform", ["include", "skip"]],
  ["nitrogenFixation", ["bacterium"], "oxygen", ["protected", "exposed"]],
];
for (const [id, roots, key, values = [null]] of cases) {
  const url = new URL(`./${id}Process.js`, import.meta.url),
    { default: model } = await import(url);
  assert.equal(model.stages[0].at, 0);
  for (const stage of model.stages)
    assert(
      stage.title.zh &&
        stage.title.en &&
        stage.description.zh &&
        stage.description.en,
    );
  for (const rootId of roots) {
    const s = model.create({ rootId }),
      resources = [],
      geometries = new Set();
    let instanced = 0;
    s.group.traverse((o) => {
      resources.push(o.uuid, o.geometry?.uuid, o.material?.uuid);
      if (o.geometry) geometries.add(o.geometry);
      if (o.isInstancedMesh) instanced++;
    });
    const snapshot = () => {
      s.group.updateMatrixWorld(true);
      const out = [];
      s.group.traverse((o) => {
        out.push(
          o.uuid,
          o.visible,
          ...o.matrix.elements,
          o.material?.color?.getHex(),
        );
        if (o.isInstancedMesh)
          for (const value of o.instanceMatrix.array) out.push(value);
      });
      return JSON.stringify([out, s.labels, s.group.userData]);
    };
    const ends = [];
    let largest = 0;
    for (const value of values) {
      const parameters = key ? { [key]: value } : {};
      for (const p of [0, 0.15, 0.33, 0.51, 0.7, 0.85, 1]) {
        s.update(p, parameters);
        snapshot();
        const current = [];
        s.group.traverse((o) => {
          current.push(o.uuid, o.geometry?.uuid, o.material?.uuid);
          if (o.isInstancedMesh) {
            for (const n of o.instanceMatrix.array) assert(Number.isFinite(n));
            assert(Number.isFinite(o.boundingSphere.radius));
          }
        });
        assert.deepEqual(current, resources);
        const box = new THREE.Box3().setFromObject(s.group),
          size = box.getSize(new THREE.Vector3());
        assert(
          [...box.min.toArray(), ...box.max.toArray()].every(Number.isFinite),
        );
        largest = Math.max(largest, ...size.toArray());
        assert(largest > 2 && largest < 20);
      }
      s.update(0.7, parameters);
      const expected = snapshot();
      s.update(0.2, parameters);
      s.update(0.7, parameters);
      assert.equal(snapshot(), expected);
      s.update(1, parameters);
      ends.push(snapshot());
    }
    if (ends.length > 1) assert.notEqual(ends[0], ends[1]);
    s.update(NaN);
    const nan = snapshot();
    s.update(0);
    assert.equal(snapshot(), nan);
    for (const geometry of geometries)
      for (const attr of Object.values(geometry.attributes))
        for (const v of attr.array) assert(Number.isFinite(v));
    console.log(
      `${id}/${rootId}: PASS (${resources.length / 3} nodes; ${instanced} instanced meshes; largest dimension ${largest.toFixed(2)})`,
    );
  }
  await build({
    entryPoints: [fileURLToPath(url)],
    bundle: true,
    write: false,
    platform: "browser",
    format: "esm",
    external: ["three"],
    logLevel: "silent",
  });
}
