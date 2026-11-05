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
// Match actual triangle surfaces across all instances, rather than prescribing
// an array index or the same vertex selected by the production anchor helper.
function anchorTouchesSurface(label, modelRoot, mesh) {
  const target = new THREE.Vector3(...label.position).applyMatrix4(
      modelRoot.matrixWorld,
    ),
    positions = mesh.geometry.attributes.position,
    index = mesh.geometry.index,
    triangle = new THREE.Triangle(),
    nearest = new THREE.Vector3(),
    local = new THREE.Vector3(),
    instance = new THREE.Matrix4(),
    matrix = new THREE.Matrix4();
  mesh.geometry.computeBoundingSphere();
  // Distances and tolerance below are in geometry-local units.
  const bounds = mesh.geometry.boundingSphere;
  for (let j = 0; j < (mesh.isInstancedMesh ? mesh.count : 1); j++) {
    matrix.copy(mesh.matrixWorld);
    if (mesh.isInstancedMesh) {
      mesh.getMatrixAt(j, instance);
      matrix.multiply(instance);
    }
    local.copy(target).applyMatrix4(matrix.invert());
    if (local.distanceTo(bounds.center) > bounds.radius + 1e-5) continue;
    for (let i = 0; i < (index ? index.count : positions.count); i += 3) {
      triangle.a.fromBufferAttribute(positions, index ? index.getX(i) : i);
      triangle.b.fromBufferAttribute(
        positions,
        index ? index.getX(i + 1) : i + 1,
      );
      triangle.c.fromBufferAttribute(
        positions,
        index ? index.getX(i + 2) : i + 2,
      );
      triangle.closestPointToPoint(local, nearest);
      if (nearest.distanceTo(local) < 1e-5) return true;
    }
  }
  return false;
}
// The label belongs to modelRoot, while each box may inherit a rotated and
// scaled wrapper. Test the solid in box-local space, never its loose world AABB.
function anchorInsideBox(label, modelRoot, mesh) {
  const inverse = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
  const local = new THREE.Vector3(...label.position)
    .applyMatrix4(modelRoot.matrixWorld)
    .applyMatrix4(inverse);
  mesh.geometry.computeBoundingBox();
  return mesh.geometry.boundingBox.containsPoint(local);
}
function assertPhragmoplastAnnotation(model, progress) {
  const label = model.labels.find(
    (item) => item.text.en === "Phragmoplast microtubules",
  );
  const tubulin = named(
    model.group,
    "Tubulin subunits on a hollow cylinder",
  ).filter(
    (mesh) =>
      mesh.isInstancedMesh &&
      mesh.parent?.name === "Phragmoplast microtubule protofilament cylinder",
  );
  assert(label && tubulin.length > 0, "named microtubule target exists");
  const active = progress >= 0.3 && progress < 0.93;
  assert.equal(
    label.active,
    active,
    `microtubule annotation follows its appearance/disassembly boundary at ${progress}`,
  );
  const visibleTubulin = tubulin.filter(visible);
  if (active) {
    assert(
      visibleTubulin.some((mesh) =>
        anchorTouchesSurface(label, model.group, mesh),
      ),
      `active annotation reaches a real, effectively visible tubulin surface at ${progress}`,
    );
    // This also rejects the former side-wall anchor even though that anchor
    // lay on real tubulin. A visible flag alone cannot detect an embedded target.
    model.group.traverse((mesh) => {
      if (
        visible(mesh) &&
        mesh.geometry?.type === "BoxGeometry" &&
        mesh.material?.transparent !== true
      )
        assert(
          !anchorInsideBox(label, model.group, mesh),
          `microtubule endpoint is not buried inside an opaque wall/plate slab at ${progress}`,
        );
    });
  } else {
    assert.equal(
      visibleTubulin.length,
      0,
      `inactive stage does not expose a microtubule target at ${progress}`,
    );
  }
  return [label.active, ...label.position];
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
}
console.log(
  "20261004-plantGrowth-01: actual cell-plate rim continuous at both repeating fusion boundaries",
);
const savedAnchors = new Map();
for (const p of [
  0, 0.299999, 0.3, 0.32, 0.43, 0.65, 0.9, 0.91, 0.929999, 0.93, 1, 0.9, 0.43,
  0.3, 0.299999, 0.93, 0.929999, 0,
]) {
  update(d, p);
  const state = assertPhragmoplastAnnotation(d, p);
  if (savedAnchors.has(p))
    assert.deepEqual(
      state,
      savedAnchors.get(p),
      `reverse seek restores annotation at ${p}`,
    );
  else savedAnchors.set(p, state);
}
// Keep the historical identity-space fixtures above and below untouched.
// Updating the wrapper first propagates its nonidentity world matrix to children.
const wrappedDivision = division.create();
const wrapper = new THREE.Group();
wrapper.position.set(10, -3, 2);
wrapper.rotation.set(0.31, -0.47, 0.23);
wrapper.scale.set(1.25, 0.8, 1.6);
wrapper.add(wrappedDivision.group);
const wrappedAnchors = new Map();
for (const p of [0.3, 0.43, 0.9, 0.93, 0.9, 0.43, 0.3]) {
  wrappedDivision.update(p);
  wrapper.updateMatrixWorld(true);
  const state = assertPhragmoplastAnnotation(wrappedDivision, p);
  assert.deepEqual(
    state,
    savedAnchors.get(p),
    "ancestor transforms do not alter model-local annotation coordinates",
  );
  if (wrappedAnchors.has(p))
    assert.deepEqual(
      state,
      wrappedAnchors.get(p),
      `wrapped reverse seek restores annotation at ${p}`,
    );
  else wrappedAnchors.set(p, state);
}
console.log(
  "S214-plantGrowth: actual surface, solid-box exclusion and annotation boundaries hold under ancestor transforms and reverse seeks",
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
    const geometry = fiber.geometry;
    assert(fiber.visible && visible(fiber), "deposited cellulose is visible");
    assert(geometry.index, "cellulose reveal uses indexed tube geometry");
    const radialSegments = geometry.parameters.radialSegments;
    const perSegmentIndices = radialSegments * 6;
    const drawStart = geometry.drawRange.start;
    const drawEnd = Math.min(
      geometry.index.count,
      drawStart + geometry.drawRange.count,
    );
    assert.equal(drawStart, 0, "deposition reveals its anchored origin first");
    assert.equal(
      (drawEnd - drawStart) % perSegmentIndices,
      0,
      "only complete tube segments are revealed",
    );
    const revealedSegments = (drawEnd - drawStart) / perSegmentIndices;
    assert(revealedSegments > 0, "active cellulose label has visible geometry");
    const vertex = Math.floor(revealedSegments / 2) * (radialSegments + 1);
    let referencedByVisibleTriangle = false;
    for (let i = drawStart; i < drawEnd; i++)
      if (geometry.index.getX(i) === vertex) referencedByVisibleTriangle = true;
    assert(
      referencedByVisibleTriangle,
      "label midpoint belongs to rendered triangles",
    );
    anchorOnVertex(w.labels[4], fiber, vertex);
    assert(
      w.labels[4].active,
      "cellulose anchor remains active at existing test poses",
    );
  }
console.log(
  "20261004-plantGrowth-06: named labels follow actual geometry across all four models and moving/control branches",
);
