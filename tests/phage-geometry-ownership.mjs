import assert from "node:assert/strict";
import { build } from "esbuild";
import { disposeScene } from "../src/processes/disposeScene.js";

const compiled = await build({
  stdin: {
    contents: [
      'export { phageDetail } from "./src/scene/phageDetails.js";',
      'export { detailModel } from "./src/scene/detailModels.js";',
    ].join("\n"),
    resolveDir: new URL("..", import.meta.url).pathname,
    sourcefile: "phage-ownership-entry.mjs",
  },
  bundle: true,
  write: false,
  platform: "node",
  format: "esm",
  logLevel: "silent",
  plugins: [
    {
      name: "shared-three-runtime",
      setup(builder) {
        builder.onResolve({ filter: /^three(?:\/.*)?$/ }, ({ path }) => ({
          path: import.meta.resolve(path),
          external: true,
        }));
      },
    },
  ],
});
const { phageDetail, detailModel } = await import(
  `data:text/javascript,${encodeURIComponent(compiled.outputFiles[0].text)}`
);

function resources(group) {
  const geometry = new Set(),
    materials = new Set(),
    buffers = new Set();
  group.traverse((object) => {
    if (object.geometry) geometry.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material])
      if (material) materials.add(material);
  });
  for (const g of geometry)
    for (const attribute of [...Object.values(g.attributes), g.index])
      if (attribute) buffers.add(attribute.array.buffer);
  return { geometry, materials, buffers };
}
function observeDisposal(owned) {
  const counts = new Map();
  for (const resource of [...owned.geometry, ...owned.materials]) {
    counts.set(resource, 0);
    resource.addEventListener("dispose", () =>
      counts.set(resource, counts.get(resource) + 1),
    );
  }
  return (expected, message) => {
    for (const count of counts.values()) assert.equal(count, expected, message);
  };
}

const ids = [
  "phage",
  "phageHead",
  "phageCapsomers",
  "phageGenome",
  "phageTail",
  "phageSheath",
  "phageTube",
  "phageBaseplate",
  "phageFibers",
];
for (const id of ids) {
  const a = phageDetail(id),
    b = phageDetail(id),
    ownedA = resources(a),
    ownedB = resources(b),
    disposalA = observeDisposal(ownedA),
    disposalB = observeDisposal(ownedB);
  for (const key of ["geometry", "materials", "buffers"])
    for (const resource of ownedA[key])
      assert(!ownedB[key].has(resource), `${id}: independent ${key} ownership`);
  if (id === "phageHead" || id === "phageSheath") {
    const spheres = a.children.filter(
      (mesh) => mesh.geometry?.type === "SphereGeometry",
    );
    assert(spheres.length > 100, `${id}: retain all protein meshes`);
    assert.equal(
      new Set(spheres.map((mesh) => mesh.geometry)).size,
      1,
      `${id}: static local protein geometry is shared within the model`,
    );
    assert.equal(
      new Set(spheres.map((mesh) => mesh.material)).size,
      spheres.length,
      `${id}: protein materials remain independent`,
    );
    assert.equal(spheres[0].geometry.parameters.widthSegments, 32);
    assert.equal(spheres[0].geometry.parameters.heightSegments, 24);
    assert(spheres.some((mesh) => mesh.userData.cap));
    assert(spheres.some((mesh) => !mesh.userData.cap));
  }
  disposeScene(a);
  disposalA(1, `${id}: shared source resources released once`);
  disposalB(0, `${id}: disposing one model leaves the other model alive`);

  const merged = detailModel(id, b),
    ownedMerged = resources(merged),
    disposalMerged = observeDisposal(ownedMerged);
  disposalB(1, `${id}: Atlas merge releases each source resource once`);
  for (const key of ["geometry", "materials", "buffers"])
    for (const resource of ownedMerged[key])
      assert(!ownedB[key].has(resource), `${id}: merged ${key} owns its copy`);
  disposeScene(merged);
  disposalMerged(1, `${id}: merged resources released once`);
  disposalB(1, `${id}: output disposal does not release its source twice`);
}
console.log(
  "PASS phage geometry ownership: nine factories stay private across models; detailed proteins share within head/sheath; source and merged resources dispose once",
);
