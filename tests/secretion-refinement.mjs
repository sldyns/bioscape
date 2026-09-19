import assert from "node:assert/strict";
import * as THREE from "three";
import secretion from "../src/processes/secretionProcess.js";

const model = secretion.create();
const { group } = model;
// Identify semantic assemblies by their geometry, without depending on child indices.
const golgi = group.children.filter(
  (o) =>
    o.isGroup &&
    o.children.filter((c) => c.geometry?.type === "BufferGeometry").length ===
      2,
);
assert.equal(golgi.length, 5, "Expected five Golgi cisternae");
const active = golgi.reduce((a, b) => (a.position.x < b.position.x ? a : b));
const surfaces = active.children.filter(
  (o) => o.geometry?.type === "BufferGeometry",
);
const [body, cap] = surfaces;
const cargo = group.children.find(
  (o) =>
    o.isGroup &&
    o.children.some(
      (c) =>
        c.geometry?.type === "TorusGeometry" &&
        c.geometry.parameters.radius === 0.13,
    ),
);
assert.ok(cargo, "Selected soluble cargo must be identifiable");

const uniqueMaterials = (root) => {
  const result = new Set();
  root.traverse((o) => {
    for (const m of Array.isArray(o.material) ? o.material : [o.material])
      if (m) result.add(m);
  });
  return [...result];
};
model.update(0.42);
const baselines = golgi.map(
  (sac) => new Map(uniqueMaterials(sac).map((m) => [m, m.opacity])),
);
let previous = [],
  wraps = 0;
// Every surface, cut edge, enzyme and lipid component must fade together during recycling.
for (let i = 4200; i <= 6700; i++) {
  model.update(i / 10000);
  const current = golgi.map((sac, index) => {
    const main = sac.children.find(
      (o) => o.geometry?.type === "BufferGeometry",
    ).material;
    const fraction = main.opacity / baselines[index].get(main);
    for (const [m, base] of baselines[index]) {
      assert.ok(
        Math.abs(m.opacity - base * fraction) < 1e-9,
        `Incomplete cisternal fade at ${i / 10000}`,
      );
      if (fraction < 0.999) {
        assert.equal(
          m.transparent,
          true,
          "Fading lipid/protein material requires alpha blending",
        );
        assert.equal(
          m.depthWrite,
          false,
          "Faded details must not retain an invisible depth occluder",
        );
      }
    }
    if (fraction === 0)
      assert.equal(
        sac.visible,
        false,
        "A recycled empty cisterna must hide its whole subtree",
      );
    const now = { x: sac.position.x, fraction };
    if (previous[index] && Math.abs(now.x - previous[index].x) > 0.5) {
      wraps++;
      assert.ok(
        previous[index].fraction < 0.02 && now.fraction === 0,
        "Cisternal position wraps must occur only after fading out",
      );
    }
    return now;
  });
  previous = current;
}
assert.equal(
  wraps,
  4,
  "Exercise every non-cargo cisterna recycling transition",
);

// Infer the existing flattened-sac dimensions from its actual mesh and mouth curve.
// The removed front is only a viewing cutaway: biological cargo must still fit
// the implied lumen, except through the real lower opening while its cap is open.
body.geometry.computeBoundingBox();
const ry = body.geometry.boundingBox.max.y;
const bend = body.geometry.attributes.position.getX(0);
const lip = active.children.find(
  (o) =>
    o.geometry?.type === "TubeGeometry" &&
    o.geometry.parameters.path.points.length === 49,
);
assert.ok(lip, "Cisterna needs a geometric mouth rim");
const points = lip.geometry.parameters.path.points;
const mouthY = points[0].y;
const widthAtMouth = (1 - (mouthY / ry) ** 2) ** 0.24;
const rx =
  (Math.max(...points.map((p) => p.x)) - Math.min(...points.map((p) => p.x))) /
  2 /
  widthAtMouth;
const rz = Math.max(...points.map((p) => Math.abs(p.z))) / widthAtMouth;
const inverse = new THREE.Matrix4(),
  vertex = new THREE.Vector3();
let checked = 0;
for (let tick = 420; tick < 780; tick++) {
  const progress = tick / 1000;
  model.update(progress);
  inverse.copy(active.matrixWorld).invert();
  cargo.traverse((object) => {
    // The locator halo is an annotation, not a physical part of the protein.
    if (!object.isMesh || object.geometry.type === "TorusGeometry") return;
    for (let p = object; p !== cargo; p = p.parent) if (!p.visible) return;
    const positions = object.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      vertex
        .fromBufferAttribute(positions, i)
        .applyMatrix4(object.matrixWorld)
        .applyMatrix4(inverse);
      if (!cap.visible && vertex.y < mouthY) continue;
      const h = vertex.y / ry;
      const width = Math.max(0, 1 - h * h) ** 0.24;
      const radial =
        ((vertex.x - bend * h * h) / (rx * width)) ** 2 +
        (vertex.z / (rz * width)) ** 2;
      assert.ok(
        Math.abs(h) <= 1 && radial <= 1.015,
        `Physical cargo crosses a retained cisternal membrane at ${progress} (normalized radius² ${radial})`,
      );
      checked++;
    }
  });
}
assert.ok(
  checked > 100000,
  "Exercise folded protein and glycan surfaces across maturation and export",
);

const nodes = [];
group.traverse((o) => nodes.push(o));
const geometryIds = nodes.map((o) => o.geometry);
const materialIds = nodes.map((o) => o.material);
function snapshot(progress) {
  model.update(progress);
  const current = [];
  group.traverse((o) => current.push(o));
  assert.deepEqual(
    current,
    nodes,
    "Seeking must not add or replace scene nodes",
  );
  return JSON.stringify(
    nodes.map((o, i) => {
      assert.equal(o.geometry, geometryIds[i]);
      assert.equal(o.material, materialIds[i]);
      return [
        o.visible,
        o.matrix.toArray(),
        o.material?.color?.toArray(),
        o.material?.opacity,
      ];
    }),
  );
}
const checkpoints = [
  0,
  0.12,
  0.2,
  0.34,
  0.39,
  0.42,
  0.56,
  0.67,
  0.695,
  0.7,
  0.78,
  0.9,
  0.963,
  0.992,
  1,
  NaN,
];
const reference = checkpoints.map(snapshot);
[0.99, 0.35, 0.76, 0.08, 0.68, 0.44, 0.001, 0.999, 0.49].forEach(snapshot);
checkpoints.forEach((p, i) =>
  assert.equal(snapshot(p), reference[i], `Non-deterministic seek to ${p}`),
);
const geometries = new Set(nodes.map((o) => o.geometry).filter(Boolean));
geometries.forEach((g) => g.dispose());
uniqueMaterials(group).forEach((m) => m.dispose());
console.log(
  "Secretion refinement: cargo containment, complete cisternal fade, recycling and arbitrary seeks passed.",
);
