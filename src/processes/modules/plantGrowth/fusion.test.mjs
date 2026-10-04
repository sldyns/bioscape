import assert from "node:assert/strict";
import * as THREE from "three";
import division from "./plantDivisionProcess.js";
import fertilization from "./doubleFertilizationProcess.js";
import hyphae from "./fungalHyphaeProcess.js";
import wall from "./cellWallGrowthProcess.js";

const named = (g, name) => {
  const a = [];
  g.traverse((n) => {
    if (n.name === name) a.push(n);
  });
  return a;
};
const update = (v, p, parameters = {}) => {
  v.update(p, parameters);
  v.group.updateMatrixWorld(true);
};
const visible = (n) => n.visible && (!n.parent || visible(n.parent));
const world = (n) => n.getWorldPosition(new THREE.Vector3());
const a = new THREE.Vector3(),
  b = new THREE.Vector3(),
  c = new THREE.Vector3(),
  hit = new THREE.Vector3();
// Actual triangles, both orientations. A membrane cannot pass by hiding its lid
// with front-face culling or by reporting a metadata-only fusion state.
function hits(mesh, origin, direction, length) {
  const ray = new THREE.Ray(origin, direction),
    g = mesh.geometry,
    attr = g.attributes.position;
  const count = Math.min(g.drawRange.count, g.index?.count ?? attr.count),
    distances = [];
  for (let i = 0; i < count; i += 3) {
    a.fromBufferAttribute(attr, g.index ? g.index.getX(i) : i).applyMatrix4(
      mesh.matrixWorld,
    );
    b.fromBufferAttribute(
      attr,
      g.index ? g.index.getX(i + 1) : i + 1,
    ).applyMatrix4(mesh.matrixWorld);
    c.fromBufferAttribute(
      attr,
      g.index ? g.index.getX(i + 2) : i + 2,
    ).applyMatrix4(mesh.matrixWorld);
    if (ray.intersectTriangle(a, b, c, false, hit)) {
      const d = hit.distanceTo(origin);
      if (
        d > 1e-6 &&
        d < length &&
        !distances.some((x) => Math.abs(d - x) < 1e-5)
      )
        distances.push(d);
    }
  }
  return distances.sort((a, b) => a - b);
}
function contained(mesh, surface) {
  const center = new THREE.Vector3(...surface.userData.femaleCenter);
  const radii = new THREE.Vector3(...surface.userData.femaleRadii);
  const attr = mesh.geometry.attributes.position,
    p = new THREE.Vector3();
  for (let i = 0; i < attr.count; i++) {
    p.fromBufferAttribute(attr, i)
      .applyMatrix4(mesh.matrixWorld)
      .sub(center)
      .divide(radii);
    assert(
      p.lengthSq() < 1 + 1e-6,
      "the whole nuclear body stays inside its female gamete",
    );
  }
}
function anchorOnVertex(label, mesh, vertex = 0) {
  const p = new THREE.Vector3().fromBufferAttribute(
    mesh.geometry.attributes.position,
    vertex,
  );
  if (mesh.isInstancedMesh) {
    const matrix = new THREE.Matrix4();
    mesh.getMatrixAt(0, matrix);
    p.applyMatrix4(matrix);
  }
  p.applyMatrix4(mesh.matrixWorld);
  assert(
    p.distanceTo(new THREE.Vector3(...label.position)) < 1e-6,
    "named label terminates on actual target geometry",
  );
}
const d = division.create();
const chromosomeLabelText = d.labels[1].text;
for (const p of [
  0, 0.129999, 0.13, 0.130001, 0.335, 1, 0.2, 0.13, 0.72, 0, 0.34,
]) {
  update(d, p);
  assert.equal(
    d.labels[1].text,
    chromosomeLabelText,
    "live bilingual label identity is stable",
  );
  assert.deepEqual(
    d.labels[1].text,
    p > 0.13
      ? { zh: "子染色体", en: "Daughter chromosomes" }
      : { zh: "已复制的染色体", en: "Duplicated chromosomes" },
    `chromosome identity follows the actual separation boundary at progress ${p}`,
  );
  anchorOnVertex(
    d.labels[1],
    named(d.group, "Condensed looped chromatin chromatid")[5].children[0],
  );
}
console.log(
  "20261004-plantGrowth-07: bilingual chromosome identity tracks separation and arbitrary seeks without changing its anchor",
);
const membrane = named(
  d.group,
  "Continuous cell-plate lumen membrane and parental junction",
)[0];
const ray = new THREE.Raycaster(
  new THREE.Vector3(),
  new THREE.Vector3(1, 0, 0),
);
for (const p of [0.5, 0.7]) {
  update(d, p - 1e-7);
  const before = ray.intersectObject(membrane)[0].point.x;
  update(d, p + 1e-7);
  const after = ray.intersectObject(membrane)[0].point.x;
  assert(
    Math.abs(after - before) < 1e-4,
    "fused rim does not lose one vesicle radius at cycle reset",
  );
}
for (const p of [0.2, 0.32, 0.65, 0.91]) {
  update(d, p);
  if (d.labels[1].active)
    anchorOnVertex(
      d.labels[1],
      named(d.group, "Condensed looped chromatin chromatid")[5].children[0],
    );
  if (d.labels[2].active)
    anchorOnVertex(
      d.labels[2],
      named(d.group, "Phragmoplast microtubule protofilament cylinder")[1]
        .children[0],
    );
}
console.log(
  "20261004-plantGrowth-01: actual cell-plate rim continuous at both repeating fusion boundaries",
);

const f = fertilization.create();
const female = [
  named(f.group, "Egg plasma membrane with continuous sperm fusion neck")[0],
  named(
    f.group,
    "Central-cell plasma membrane with continuous sperm fusion neck",
  )[0],
];
assert(
  female.every(Boolean),
  "actual joined female/sperm membrane surfaces required",
);
const carried = named(f.group, "Paternal nucleus carried by sperm"),
  markers = named(f.group, "Paternal nuclear contribution after fusion");
for (const assignment of ["frontEgg", "frontCentral"]) {
  update(f, 0.54, { assignment });
  for (const surface of female) {
    const contact = new THREE.Vector3(...surface.userData.fusionContact),
      normal = new THREE.Vector3(...surface.userData.fusionNormal);
    assert.equal(
      hits(
        surface,
        contact.clone().addScaledVector(normal, -0.09),
        normal,
        0.18,
      ).length,
      0,
      "fusion neck has no intervening gamete/sperm cap",
    );
    assert(
      hits(
        surface,
        new THREE.Vector3(...surface.userData.femaleCenter),
        new THREE.Vector3(0, 1, 0),
        4,
      ).length > 0,
      "female compartment retains its surrounding membrane",
    );
  }
  for (const p of [0.56, 0.6, 0.65, 0.719999, 0.72, 0.8]) {
    update(f, p, { assignment });
    for (let i = 0; i < 2; i++) {
      const target = (i === 0) !== (assignment === "frontCentral") ? 0 : 1;
      if (p < 0.72) contained(carried[i], female[target]);
      else contained(markers[i], female[i]);
    }
    assert(
      named(f.group, "Separate sperm plasma membrane before plasmogamy").every(
        (n) => !visible(n),
      ),
      "intact separate sperm membrane does not travel to the maternal nucleus",
    );
  }
  for (const [i, name] of [
    "Egg maternal nucleus inside female gamete",
    "Central maternal nucleus inside female gamete",
  ].entries())
    contained(named(f.group, name)[0], female[i]);
  update(f, 0.72 - 1e-7, { assignment });
  const prior = carried.map(world);
  update(f, 0.72, { assignment });
  prior.forEach((point, i) => {
    const target = (i === 0) !== (assignment === "frontCentral") ? 0 : 1;
    assert(
      point.distanceTo(world(markers[target])) < 1e-6,
      "paternal identity handoff has no world-position jump",
    );
    assert.equal(
      carried[i].scale.x,
      markers[target].scale.x,
      "handoff preserves nuclear visual size",
    );
  });
  for (const p of [0.17, 0.54, 0.75, 0.91]) {
    update(f, p, { assignment });
    if (f.labels[1].active)
      anchorOnVertex(
        f.labels[1],
        named(f.group, "Central maternal nucleus inside female gamete")[0],
      );
    if (f.labels[2].active) anchorOnVertex(f.labels[2], female[0], 8 * 49 + 24);
    if (f.labels[5].active) {
      const target =
        p < 0.9
          ? named(f.group, "Egg maternal nucleus inside female gamete")[0]
          : named(f.group, "Basal embryo cell")[0];
      anchorOnVertex(f.labels[5], target);
    }
  }
}
console.log(
  "20261004-plantGrowth-02/03: real membrane opening, whole-nucleus containment and continuous paternal handoff in both assignments",
);

const h = hyphae.create();
const carriers = named(
  h.group,
  "Cutaway vesicle with lumen and paired membrane rims",
).filter((n) => n.parent === h.group);
const apical = named(
  h.group,
  "Apical plasma membrane continuous with exocytotic vesicle lumens",
)[0];
assert(apical, "actual apical exocytotic membrane required");
function visibleExtent(g) {
  const box = new THREE.Box3(),
    scale = new THREE.Vector3();
  g.traverse((n) => {
    if (n.geometry && visible(n) && n.getWorldScale(scale).length() > 1e-8)
      box.union(new THREE.Box3().setFromObject(n));
  });
  return box.isEmpty() ? 0 : box.getSize(new THREE.Vector3()).length();
}
for (const delivery of ["normal", "reduced"]) {
  const speed = delivery === "normal" ? 1.5 : 0.36;
  const junction = delivery === "normal" ? 0 : 12,
    p = (0.68 - junction / 20) / speed;
  update(h, p - 1e-7, { delivery });
  const before = world(carriers[junction]);
  update(h, p + 1e-7, { delivery });
  assert(
    before.distanceTo(world(carriers[junction])) < 1e-4,
    "same visible carrier crosses a continuous Spitzenkorper junction",
  );
  const i = delivery === "normal" ? 3 : 16;
  for (const t of [0.84, 0.9]) {
    update(h, (t - i / 20) / speed, { delivery });
    const center = world(carriers[i]),
      normal = center.clone().sub(apical.position);
    normal.z = 0;
    normal.normalize();
    center.z -= 0.025;
    const crossings = hits(apical, center, normal, 0.2);
    if (t === 0.84)
      assert(
        crossings.length > 0,
        "pre-contact lumen is still bounded by membrane",
      );
    else
      assert.equal(
        crossings.length,
        0,
        "after contact, cargo lumen opens into extracellular space through a real membrane neck",
      );
  }
  update(h, (0.97 - i / 20) / speed, { delivery });
  for (const cargo of named(carriers[i], "Vesicle lumen wall cargo")) {
    const point = world(cargo).sub(apical.position);
    assert(
      point.length() > 0.69,
      "delivered lumen cargo reaches the extracellular side before handoff",
    );
  }
  const wrap = delivery === "normal" ? 0 : 16,
    at = (1 - wrap / 20) / speed;
  for (const epsilon of [-1e-7, 1e-7]) {
    update(h, at + epsilon, { delivery });
    assert(
      visibleExtent(carriers[wrap]) < 1e-5,
      "no full-size carrier teleports between apex and base",
    );
  }
  update(h, 0.95, { delivery });
  for (const cohort of named(h.group, "Delivered wall matrix cohort").filter(
    visible,
  )) {
    const point = world(cohort).sub(apical.position);
    assert(
      Math.hypot(Math.max(0, point.x), point.y, point.z) > 0.77,
      "retained released material remains in the extracellular wall",
    );
  }
  anchorOnVertex(
    h.labels[1],
    named(h.group, "Septal solid wall with central pore")[1],
  );
  anchorOnVertex(
    h.labels[2],
    named(h.group, "Chitin synthase microvesicle core")[0],
  );
}
console.log(
  "20261004-plantGrowth-04/05: actual exocytotic opening/cargo delivery, invisible reuse and joined transport paths in both conditions",
);

const w = wall.create();
for (const extensibility of ["yielding", "restrained"])
  for (const p of [0.2, 0.55, 0.8, 1]) {
    update(w, p, { extensibility });
    anchorOnVertex(w.labels[2], named(w.group, "Cortical microtubule")[3]);
    anchorOnVertex(
      w.labels[3],
      named(
        w.group,
        "Six-lobed cellulose synthase rosette with cytosolic catalytic lobes",
      )[0].children[0],
    );
    const fiber = named(w.group, "Deposited cellulose microfibril")[13];
    anchorOnVertex(
      w.labels[4],
      fiber,
      Math.floor(fiber.geometry.attributes.position.count / 2),
    );
  }
console.log(
  "20261004-plantGrowth-06: named labels follow actual geometry across all four models and moving/control branches",
);
