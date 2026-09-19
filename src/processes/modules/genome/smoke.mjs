import * as THREE from "three";
import { build } from "esbuild";
const ids = [
  "replication",
  "dnaRepair",
  "transduction",
  "bacterialSporulation",
];
const report = [];
for (const id of ids) {
  const url = new URL(`./${id}Process.js`, import.meta.url);
  const model = (await import(url)).default;
  await build({
    entryPoints: [url.pathname],
    write: false,
    bundle: true,
    format: "esm",
    platform: "browser",
    logLevel: "silent",
  });
  if (
    model.stages[0].at !== 0 ||
    model.stages.some(
      (s) =>
        !s.title.zh || !s.title.en || !s.description.zh || !s.description.en,
    )
  )
    throw Error(id + " metadata");
  for (const option of model.controls[0].options) {
    const params = { [model.controls[0].id]: option.value },
      c = model.create({
        rootId: ["replication", "dnaRepair"].includes(id)
          ? "plant"
          : "bacterium",
      }),
      objects = [];
    c.group.traverse((o) => objects.push(o));
    const geos = objects.map((o) => o.geometry),
      mats = new Set([
        ...(c.materials ?? []),
        ...objects.map((o) => o.material).filter(Boolean),
      ]);
    const snap = () => {
      c.group.updateMatrixWorld(true);
      return JSON.stringify(
        objects.map((o) => [
          o.visible,
          o.matrix.toArray(),
          o.material?.uuid,
          o.instanceMatrix ? Array.from(o.instanceMatrix.array) : null,
          o.instanceColor ? Array.from(o.instanceColor.array) : null,
        ]),
      );
    };
    const states = new Set();
    for (const p of [NaN, 0, 0.15, 0.28, 0.4, 0.52, 0.65, 0.79, 0.92, 1]) {
      c.update(p, params);
      c.group.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(c.group),
        size = box.getSize(new THREE.Vector3());
      if (
        ![...box.min, ...box.max].every(Number.isFinite) ||
        Math.max(...size) < 2 ||
        Math.max(...size) > 20
      )
        throw Error(id + " bounds");
      const now = [];
      c.group.traverse((o) => now.push(o));
      if (
        now.length !== objects.length ||
        now.some(
          (o, i) =>
            o !== objects[i] ||
            o.geometry !== geos[i] ||
            (o.material && !mats.has(o.material)),
        )
      )
        throw Error(id + " resources");
      for (const o of now) {
        for (const attr of Object.values(o.geometry?.attributes ?? {}))
          if (!Array.from(attr.array).every(Number.isFinite))
            throw Error(id + " vertex buffer");
        if (
          o.instanceMatrix &&
          !Array.from(o.instanceMatrix.array).every(Number.isFinite)
        )
          throw Error(id + " instance buffer");
      }
      states.add(snap());
    }
    c.update(0.7, params);
    const a = snap();
    c.update(0.2, params);
    c.update(0.7, params);
    if (a !== snap()) throw Error(id + " seeking");
    if (states.size < 4) throw Error(id + " stages");
    report.push({
      id,
      condition: option.value,
      nodes: objects.length,
      instancedMeshes: objects.filter((o) => o.isInstancedMesh).length,
      distinctStates: states.size,
      status: "PASS",
    });
  }
}
console.log(JSON.stringify(report, null, 2));
