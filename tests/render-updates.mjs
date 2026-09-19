import assert from "node:assert/strict";
import * as THREE from "three";
import { createPresentationAppearance } from "../src/scene/presentationAppearance.js";
import { prepareAnnotationLabels } from "../src/processes/annotationDom.js";

// Compare cached appearance updates with the previous traversal at every frame,
// including overlapping cut/assembly flags, fade reversal and view re-entry.
const root = new THREE.Group();
for (const data of [
  {},
  { cap: true },
  { cutOnly: true },
  { assembledOnly: true },
  { cap: true, assembledOnly: true },
  { cutOnly: true, assembledOnly: true },
]) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({ emissive: "#102030" }),
  );
  mesh.userData = {
    ...data,
    hitId: "part",
    restEmissive: mesh.material.emissive.clone(),
  };
  root.add(mesh);
}
const reference = root.clone();
reference.children.forEach((mesh, index) => {
  mesh.material = root.children[index].material.clone();
  mesh.userData.restEmissive = mesh.material.emissive.clone();
});
const hover = new THREE.Color("#294866");
let update = createPresentationAppearance(root);
for (const mode of ["cut", "whole", "explode", "cut"]) {
  for (const active of [null, "part", null, "part", "another"]) {
    for (let frame = 0; frame < 90; frame++) {
      let expectedMoving = false;
      reference.traverse((object) => {
        const data = object.userData;
        if (data.assembledOnly) object.visible = mode !== "explode";
        if (data.cap || data.cutOnly)
          object.visible = data.cap ? mode === "whole" : mode !== "whole";
        if (!object.isMesh) return;
        const target =
          active && data.hitId === active ? hover : data.restEmissive;
        const value = object.material.emissive;
        if (
          Math.abs(value.r - target.r) +
            Math.abs(value.g - target.g) +
            Math.abs(value.b - target.b) >
          0.0001
        ) {
          value.lerp(target, 0.2);
          expectedMoving = true;
        } else value.copy(target);
      });
      const result = update(mode, active, 0.2);
      assert.equal(result.moving, expectedMoving);
      root.children.forEach((mesh, index) => {
        assert.equal(mesh.visible, reference.children[index].visible);
        assert.deepEqual(
          mesh.material.emissive.toArray(),
          reference.children[index].material.emissive.toArray(),
        );
      });
    }
  }
  // Re-enter a cached view whose material can still carry the last highlight.
  update = createPresentationAppearance(root);
}
// Settled camera frames must not traverse the hierarchy or touch materials.
update("cut", null, 1);
update("cut", null, 1);
root.traverse = () => {
  throw new Error("Camera frame traversed the model");
};
for (const mesh of root.children)
  Object.defineProperty(mesh.material, "emissive", {
    get() {
      throw new Error("Camera frame updated settled highlighting");
    },
  });
for (let i = 0; i < 100; i++)
  assert.deepEqual(update("cut", null, 0.2), {
    moving: false,
    shadowChanged: false,
  });

// Simulate DOM layout reads/writes to catch per-label layout thrashing without
// depending on machine-specific frame rates or a GPU in CI.
let operations = [];
const element = () =>
  new Proxy(
    {
      textContent: "",
      hidden: false,
      classList: {
        toggle() {
          operations.push("write");
        },
      },
      setAttribute() {
        operations.push("write");
      },
    },
    {
      get(target, key) {
        if (key === "offsetWidth" || key === "offsetHeight") {
          operations.push("read");
          return 21;
        }
        return target[key];
      },
      set(target, key, value) {
        operations.push("write");
        target[key] = value;
        return true;
      },
    },
  );
const sources = [
  { text: { zh: "核糖体实验结构", en: "Experimental ribosome" } },
  { text: { zh: "P", en: "P" } },
  { text: { zh: "tRNA", en: "tRNA" }, active: false },
  { text: { zh: "正在延长的肽链", en: "Elongating peptide" } },
];
const items = sources
  .map((source, sourceIndex) => ({
    source,
    sourceIndex,
    element: element(),
    key: element(),
    wording: element(),
    numberElement: element(),
  }))
  .reverse();
prepareAnnotationLabels(items, sources, "zh", "600|400");
const firstRead = operations.indexOf("read");
assert(firstRead > 0);
assert(
  operations.slice(firstRead).every((op) => op === "read"),
  "All text mutations must precede all measurements",
);
operations = [];
for (let frame = 0; frame < 100; frame++)
  prepareAnnotationLabels(items, sources, "zh", "600|400");
assert.deepEqual(
  operations,
  [],
  "Camera movement must neither remeasure text nor rewrite annotation content",
);
sources[0].active = false;
prepareAnnotationLabels(items, sources, "zh", "600|400");
assert.equal(
  items.find((item) => item.sourceIndex === 3).element.textContent,
  "1",
);
sources[0].active = true;
prepareAnnotationLabels(items, sources, "en", "600|400");
assert.equal(
  items.find((item) => item.sourceIndex === 3).element.textContent,
  "2",
);
assert.equal(
  items.find((item) => item.sourceIndex === 0).wording.textContent,
  "Experimental ribosome",
);
operations = [];
prepareAnnotationLabels(items, sources, "en", "350|500");
assert.equal(
  operations.filter((op) => op === "read").length,
  6,
  "Viewport changes remeasure active labels",
);
console.log(
  "Render updates: appearance equivalence, settled-frame caching, batched label measurement and renumbering PASS",
);
