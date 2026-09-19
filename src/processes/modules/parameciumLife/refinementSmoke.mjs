import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import * as THREE from "three";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

for (const id of [
  "parameciumFeeding",
  "contractileVacuole",
  "parameciumDivision",
  "parameciumConjugation",
]) {
  const source = new URL(`./${id}Process.js`, import.meta.url),
    p = (await import(source)).default,
    v = p.create();
  const geometries = new Set(),
    materials = new Set();
  let before = 0;
  v.group.traverse((o) => {
    before++;
    if (o.geometry) geometries.add(o.geometry);
    if (o.material) materials.add(o.material);
  });
  function snapshot(t, parameters = {}) {
    v.update(t, parameters);
    v.group.updateMatrixWorld(true);
    const hash = createHash("sha256");
    v.group.traverse((o) => {
      hash.update(
        JSON.stringify([
          o.visible,
          ...o.matrix.elements,
          o.material?.opacity,
          o.material?.color?.getHex(),
        ]),
      );
      if (o.geometry)
        for (const attribute of Object.values(o.geometry.attributes)) {
          assert(attribute.array.every(Number.isFinite));
          hash.update(new Uint8Array(attribute.array.buffer));
        }
      if (o.isInstancedMesh) {
        assert(o.instanceMatrix.array.every(Number.isFinite));
        assert(Number.isFinite(o.boundingSphere?.radius));
        hash.update(new Uint8Array(o.instanceMatrix.array.buffer));
      }
    });
    hash.update(JSON.stringify([v.labels, v.group.userData]));
    return hash.digest("hex");
  }
  for (const condition of p.controls
    ? [{ osmotic: "freshwater" }, { osmotic: "mild" }]
    : [{}]) {
    for (const t of [NaN, 0, 0.2, 0.4, 0.6, 0.7, 0.85, 0.94, 1]) {
      snapshot(t, condition);
      const size = new THREE.Box3()
        .setFromObject(v.group)
        .getSize(new THREE.Vector3());
      assert(size.toArray().every(Number.isFinite));
      assert(
        Math.max(...size.toArray()) > 2 && Math.max(...size.toArray()) < 20,
      );
    }
    const a = snapshot(0.7, condition);
    snapshot(0.2, condition);
    assert.equal(snapshot(0.7, condition), a);
    assert.notEqual(snapshot(0, condition), snapshot(0.6, condition));
  }
  if (p.controls)
    assert.notEqual(
      snapshot(0.65, { osmotic: "freshwater" }),
      snapshot(0.65, { osmotic: "mild" }),
    );
  let after = 0;
  v.group.traverse((o) => {
    after++;
    if (o.geometry) assert(geometries.has(o.geometry));
    if (o.material) assert(materials.has(o.material));
  });
  assert.equal(after, before);
  for (const stage of p.stages)
    assert(
      stage.title.zh &&
        stage.title.en &&
        stage.description.zh &&
        stage.description.en,
    );
  await build({
    entryPoints: [fileURLToPath(source)],
    bundle: true,
    platform: "browser",
    format: "esm",
    write: false,
  });
  console.log(
    `${id}: PASS (${before} nodes, ${geometries.size} geometries, ${materials.size} materials)`,
  );
}
