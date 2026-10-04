import assert from "node:assert/strict";
import apoptosis from "./apoptosisProcess.js";

// Count connected components of the actual emitted membrane triangles.
// Event identity is checked against geometry, not only against a time flag.
function componentCount(mesh) {
  const vertices = new Map(),
    parents = [];
  const p = mesh.geometry.attributes.position;
  const root = (id) => {
    while (parents[id] !== id) {
      parents[id] = parents[parents[id]];
      id = parents[id];
    }
    return id;
  };
  for (let i = 0; i < mesh.geometry.drawRange.count; i += 3) {
    const triangle = [];
    for (let j = 0; j < 3; j++) {
      const v = i + j;
      const key = [p.getX(v), p.getY(v), p.getZ(v)]
        .map((x) => Math.round(x * 1e5))
        .join(",");
      if (!vertices.has(key)) {
        const id = parents.length;
        vertices.set(key, id);
        parents.push(id);
      }
      triangle.push(vertices.get(key));
    }
    parents[root(triangle[1])] = root(triangle[0]);
    parents[root(triangle[2])] = root(triangle[0]);
  }
  return new Set(parents.map((_, i) => root(i))).size;
}

const model = apoptosis.create();
const cargo = model.science.chromatin[3].cargo;
const cases = [
  [0.825, "凝缩的染色质片段", "Condensed chromatin fragment", 1, 0],
  [0.89, "膜出泡与小体形成", "Membrane blebbing and body formation", 1, 0],
  [0.91, "膜出泡与小体形成", "Membrane blebbing and body formation", 1, 0],
  [0.94, "膜包裹的凋亡小体", "Membrane-enclosed apoptotic bodies", 6, 5],
  [0.97, "膜包裹的凋亡小体", "Membrane-enclosed apoptotic bodies", 6, 5],
  [1, "膜包裹的凋亡小体", "Membrane-enclosed apoptotic bodies", 6, 5],
  [0.9, "膜出泡与小体形成", "Membrane blebbing and body formation", 1, 0],
  [0.825, "凝缩的染色质片段", "Condensed chromatin fragment", 1, 0],
];
for (const [p, zh, en, components, bodies] of cases) {
  model.update(p, { condition: "stress" });
  assert.equal(
    model.labels[6].text.zh,
    zh,
    `p=${p}: label must name the currently shown structure/event`,
  );
  assert.equal(model.labels[6].text.en, en, `p=${p}: bilingual event identity`);
  assert.equal(
    componentCount(model.science.plasma.mesh),
    components,
    `p=${p}: actual membrane topology`,
  );
  assert.equal(
    model.group.userData.apoptoticBodies,
    bodies,
    `p=${p}: complete separated-body count`,
  );
  assert.equal(
    model.science.labelAnchors[6].target,
    cargo,
    "same chromatin/body target; no offset workaround",
  );
  assert(model.labels[6].active);
}
for (const p of [0, 0.825, 0.91, 1, 0.89]) {
  model.update(p, { condition: "noStress" });
  assert.equal(componentCount(model.science.plasma.mesh), 1);
  assert.equal(model.labels[6].active, false);
  assert.equal(model.group.userData.apoptoticBodies, 0);
}
console.log(
  "signals-label-events: chromatin, budding/formation and five separated bodies match actual membrane components; both languages, inactive control and reverse seeks PASS",
);

for (const [p, zh, en, assembled] of [
  [0.375, "Apaf-1 单体", "Apaf-1 monomers", false],
  [0.445, "Apaf-1 · 凋亡小体组装", "Apaf-1 · apoptosome assembly", false],
  [0.605, "Apaf-1 凋亡小体", "Apaf-1 apoptosome", true],
  [0.445, "Apaf-1 · 凋亡小体组装", "Apaf-1 · apoptosome assembly", false],
]) {
  model.update(p, { condition: "stress" });
  assert.equal(model.labels[3].text.zh, zh, `p=${p}: Apaf-1 assembly state`);
  assert.equal(model.labels[3].text.en, en);
  assert.equal(model.group.userData.apoptosomeAssembled, assembled);
  const arm = model.science.labelAnchors[3].target.parent;
  assert.equal(
    arm.position.length() < 0.1,
    assembled,
    "actual Apaf-1 arms reach the assembled central ring",
  );
}
console.log(
  "signals-label-events: Apaf-1 monomer/assembly/assembled names follow actual arm configuration PASS",
);
