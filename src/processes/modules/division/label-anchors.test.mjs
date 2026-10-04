import assert from "node:assert/strict";
import * as THREE from "three";
import currentMitosis from "./mitosisProcess.js";
import currentMeiosis from "./meiosisProcess.js";
const definitions = process.env.BIOSCAPE_DIVISION_LABEL_BASELINE
  ? await Promise.all(
      ["mitosis", "meiosis"].map(
        async (name) =>
          (
            await import(
              new URL(
                `../../../../docs/qa/process-review-2026-10-04/evidence/division/${name}Process.baseline.mjs`,
                import.meta.url,
              )
            )
          ).default,
      ),
    )
  : [currentMitosis, currentMeiosis];
function named(group, name) {
  const result = [];
  group.traverse((object) => {
    if (object.name === name) result.push(object);
  });
  return result;
}
function nearestVertex(point, mesh) {
  const geometry = mesh.geometry,
    p = geometry.attributes.position,
    vertex = new THREE.Vector3();
  let nearest = Infinity;
  const end = Math.min(
    geometry.index?.count ?? p.count,
    geometry.drawRange.start + geometry.drawRange.count,
  );
  for (let i = geometry.drawRange.start; i < end; i++) {
    vertex
      .fromBufferAttribute(p, geometry.index ? geometry.index.getX(i) : i)
      .applyMatrix4(mesh.matrixWorld);
    nearest = Math.min(nearest, vertex.distanceTo(point));
  }
  return nearest;
}
let checks = 0;
for (const definition of definitions) {
  const model = definition.create(),
    chromatin = named(model.group, "centromeric-chromatin"),
    membranes = named(model.group, "membrane-outer-leaflet"),
    poles = named(model.group, "centrosome-with-orthogonal-centriole-triplets"),
    ring = named(model.group, "actomyosin-contractile-belt")[0],
    germ = named(model.group, "germ-cell-outer-leaflet")[0],
    cross = named(model.group, "chiasma-at-reciprocal-exchange")[0];
  for (const parameters of definition.id === "mitosis"
    ? [{ attachment: "normal" }, { attachment: "unattached" }]
    : [{}]) {
    for (const transformed of [false, true]) {
      model.group.position.set(
        transformed ? 0.7 : 0,
        transformed ? -0.35 : 0,
        0.1,
      );
      model.group.rotation.set(
        0.02,
        transformed ? 0.3 : 0,
        transformed ? -0.17 : 0,
      );
      for (const p of [
        0, 0.123, 0.219, 0.276, 0.349, 0.43, 0.489, 0.552, 0.641, 0.714, 0.817,
        0.921, 0.941, 1,
      ]) {
        model.update(p, parameters);
        model.group.updateMatrixWorld(true);
        const targets =
          definition.id === "mitosis"
            ? [
                membranes[0],
                poles[0].children.at(-1),
                chromatin[6],
                ring.children[1],
                named(model.group, "outer-kinetochore-plate")[7],
                membranes[2],
              ]
            : [
                germ,
                cross.visible ? cross : chromatin[1],
                chromatin[0],
                chromatin[1],
                germ,
                germ,
              ];
        const expected = model.labels.map(({ active, position }) => ({
          active,
          position: [...position],
        }));
        model.labels.forEach((label, index) => {
          if (label.active === false) return;
          assert(
            nearestVertex(
              new THREE.Vector3(...label.position),
              targets[index],
            ) < 1e-6,
            `${definition.id} label ${index} must touch its named rendered surface at ${p}`,
          );
          checks++;
        });
        if (definition.id === "meiosis" && p >= 0.94) {
          const bridge = model.group.worldToLocal(
            new THREE.Vector3(...model.labels[4].position),
          );
          assert(
            Math.abs(bridge.x) < 0.15 &&
              Math.abs(bridge.y - 1.32) < 0.15 &&
              bridge.z < -0.05,
            "bridge label selects the retained channel, not a distant cell lobe",
          );
        }
        model.update(0.037, parameters);
        model.update(0.983, parameters);
        model.update(p, parameters);
        assert.deepEqual(
          model.labels.map(({ active, position }) => ({ active, position })),
          expected,
          "all world-space annotations restore after irregular seeks",
        );
      }
    }
  }
}
console.log(
  `Division label anchors PASS: ${checks} active surface checks, both attachment conditions, root transforms and deterministic seeks.`,
);
