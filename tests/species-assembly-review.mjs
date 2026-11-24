import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { Raycaster, Vector3 } from "three";

const assembly = JSON.parse(
  await readFile(
    new URL("../src/scene/data/ribosome-8b2l-assembly.json", import.meta.url),
  ),
);
assert.equal(assembly.pdb, "8B2L");
assert.equal(assembly.assembly, 1);
for (const [role, chainCount, residues] of [
  ["plant60S", 45, 9898],
  ["plant40S", 34, 6399],
  ["mrna", 1, 12],
  ["trna", 2, 152],
]) {
  const chains = assembly.chains.filter((chain) => chain.role === role);
  assert.equal(chains.length, chainCount, role);
  assert.equal(
    chains.reduce((count, chain) => count + chain.residues.length, 0),
    residues,
    role,
  );
}

const bundle = await build({
  stdin: {
    resolveDir: process.cwd(),
    contents: `
    export { loadDetailModel } from "./src/scene/loadDetailModel.js";
    export { yeastCorticalER } from "./src/scene/yeastCorticalER.js";`,
  },
  platform: "node",
  format: "esm",
  bundle: true,
  write: false,
  logLevel: "silent",
});
const { loadDetailModel, yeastCorticalER } = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].contents).toString("base64")
);
const plant = await loadDetailModel("plantRibosome");
assert.deepEqual(
  new Set(Object.keys(plant.userData.partAnchors)),
  new Set(["plant60S", "plant40S", "mrna", "trna"]),
);
const parts = [];
plant.traverse((object) => {
  if (object.isMesh) parts.push(object);
});
for (const role of ["plant60S", "plant40S", "mrna", "trna"]) {
  const matches = parts.filter((mesh) => mesh.userData.hitId === role);
  assert.ok(
    matches.some((mesh) => !mesh.userData.cap),
    role,
  );
  assert.equal(
    matches.some((mesh) => mesh.userData.cap),
    role.startsWith("plant"),
    "Open the subunit cleft and preserve both ligands",
  );
}

const er = yeastCorticalER();
er.updateMatrixWorld(true);
const fenestra = er.userData.landmarks.find((point) =>
  point.en.includes("fenestra"),
);
const ray = new Raycaster(
  new Vector3(...fenestra.position).add(new Vector3(0, 0, 3)),
  new Vector3(0, 0, -1),
);
// Cytosol crosses the cisternal fenestra before the adjacent plasma membrane.
const hits = ray.intersectObjects(er.children, true);
assert.ok(hits.length > 0);
assert.ok(
  hits.every((hit) => hit.object.name === "adjacent-plasma-membrane"),
  "A fenestra must lead through cytosol, without a span of ER membrane",
);
const root = await loadDetailModel("yeast");
assert.ok(root.userData.partAnchors.yeastER.every(Number.isFinite));
console.log(
  "Tobacco assembly and ligands, yeast cortex and open fenestra passed.",
);
