import assert from "node:assert/strict";
import * as THREE from "three";
import budding from "./yeastBuddingProcess.js";
import fermentation from "./yeastFermentationProcess.js";
import mating from "./yeastMatingProcess.js";
import sporulation from "./yeastSporulationProcess.js";
import { backSurfaceAt } from "./topology.js";

const vec = (x, y, z) => new THREE.Vector3(x, y, z);
const get = (scene, name) => {
  const o = scene.group.getObjectByName(name);
  assert(o, `missing real geometry: ${name}`);
  return o;
};
function update(scene, p, parameters) {
  scene.update(p, parameters);
  scene.group.updateMatrixWorld(true);
}
function vertices(mesh) {
  const a = mesh.geometry.attributes.position;
  return Array.from({ length: a.count }, (_, i) =>
    vec(a.getX(i), a.getY(i), a.getZ(i)).applyMatrix4(mesh.matrixWorld),
  );
}
function endpoints(mesh) {
  return [-0.5, 0.5].map((y) => vec(0, y, 0).applyMatrix4(mesh.matrixWorld));
}
// Read the actual longitudinal mesh profile, interpolating the triangle-strip
// section, rather than comparing to metadata or only a nearest vertex.
function containsRevolved(mesh, p, columns = 48, tolerance = 0.004) {
  const a = mesh.geometry.attributes.position;
  const local = p.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
  for (let i = 0; i < a.count - columns - 1; i += columns + 1) {
    const j = i + columns + 1,
      x0 = a.getX(i),
      x1 = a.getX(j);
    if (local.x < Math.min(x0, x1) - 1e-6 || local.x > Math.max(x0, x1) + 1e-6)
      continue;
    if (Math.abs(x1 - x0) < 1e-8) continue;
    const u = (local.x - x0) / (x1 - x0);
    const r =
      Math.hypot(a.getY(i), a.getZ(i)) * (1 - u) +
      Math.hypot(a.getY(j), a.getZ(j)) * u;
    if (Math.hypot(local.y, local.z) <= r + tolerance) return true;
  }
  return false;
}

// yeastLife-01: septum vertices are annular, its aperture matches the actual
// terminal membrane ring, and no daughter separates before both apertures close.
{
  const s = budding.create(),
    septum = get(s, "budding-centripetal-septum-mother");
  let lastOpening = Infinity;
  for (const p of [0.76, 0.78, 0.8, 0.82, 0.845, 0.85, 0.94, 1]) {
    update(s, p);
    const a = septum.geometry.attributes.position;
    const inner = Math.hypot(a.getX(0), a.getY(0));
    const outer = Math.hypot(a.getX(49), a.getY(49));
    assert(
      Math.abs(outer - 0.43) < 1e-5,
      "septum grows from fixed circumference",
    );
    assert(inner <= lastOpening + 1e-6);
    lastOpening = inner;
    const mother = get(s, "budding-mother-envelope:envelope-layer-2");
    const daughter = get(s, "budding-daughter-envelope:envelope-layer-2");
    const ma = mother.geometry.attributes.position,
      da = daughter.geometry.attributes.position;
    const mr = Math.hypot(ma.getY(40 * 49), ma.getZ(40 * 49));
    const dr = Math.hypot(da.getY(0), da.getZ(0));
    assert(Math.abs(mr - inner * 0.909) < 1e-5 && Math.abs(dr - mr) < 1e-5);
    if (p < 0.85) assert(inner > 0 && inner < outer + 1e-6);
    else assert(inner < 1e-6 && mr < 1e-6 && dr < 1e-6);
  }
  // yeastLife-02: SPBs coincide with actual envelope pole vertices; spindle
  // endpoints meet them. These are exact pole/surface anchors, not nearest-vertex
  // approximations for arbitrary points on a triangulated surface.
  for (const p of [0.35, 0.46, 0.57, 0.68, 0.72]) {
    update(s, p);
    const ne = vertices(get(s, "budding-continuous-nuclear-envelope"));
    const ends = endpoints(get(s, "budding-intranuclear-spindle"));
    for (let i = 0; i < 2; i++) {
      const pole = get(s, `budding-spb-${i}`).getWorldPosition(vec());
      assert(pole.distanceTo(ne[i ? 40 * 49 : 0]) < 1e-5);
      assert(Math.min(...ends.map((e) => e.distanceTo(pole))) < 1e-5);
    }
  }
}

// yeastLife-03: infer bonds from actual cylinder endpoints and carbon centers.
{
  const s = fermentation.create();
  for (const condition of ["anaerobic", "aerobic"]) {
    for (const p of [0, 0.15, 0.32, 0.62, 0.83, 1]) {
      update(s, p, { condition });
      const atoms = Array.from({ length: 6 }, (_, i) =>
        get(s, `fermentation-carbon-${i}`).getWorldPosition(vec()),
      );
      const edges = [];
      for (let i = 0; i < 6; i++) {
        const bond = get(s, `fermentation-carbon-bond-${i}`);
        if (!bond.visible) continue;
        const ids = endpoints(bond).map((e) =>
          atoms.findIndex((a) => a.distanceTo(e) < 1e-5),
        );
        assert(
          ids.every((i) => i >= 0),
          "each visible C-C rod ends at a carbon",
        );
        edges.push(ids.sort((a, b) => a - b).join("-"));
      }
      assert(!edges.includes("0-5"), "no false cyclic C6-C1 bond");
      if (p === 0) assert.deepEqual(edges, ["0-1", "1-2", "2-3", "3-4", "4-5"]);
      // Original glucose C3/C4 are lost as CO2; retain terminal pairs in ethanol.
      if (p === 1) assert.deepEqual(edges, ["0-1", "4-5"]);
    }
  }
}

// yeastLife-04/05: microtubules are cytoplasmic and cell-contained. Nuclear
// envelopes, not metadata counts, transition from two touching parents to one.
{
  const s = mating.create();
  for (const p of [0.29, 0.35, 0.45, 0.48, 0.55, 0.63, 0.68, 0.74, 0.769]) {
    update(s, p, { partner: "compatible" });
    const cells = ["left", "right"].map((side) =>
      get(s, `mating-${side}-cell-envelope:envelope-layer-2`),
    );
    for (let i = 0; i < 2; i++) {
      const pole = get(s, `mating-spb-${i}`).position;
      const nucleus = get(s, `mating-parent-nuclear-envelope-${i}`);
      const relative = pole.clone().sub(nucleus.position).divide(nucleus.scale);
      assert(
        Math.abs(relative.length() - 1) < 1e-5,
        "SPB anchored in parent NE",
      );
      const [a, b] = endpoints(get(s, `mating-cytoplasmic-microtubule-${i}`));
      for (let j = 1; j <= 40; j++) {
        const point = a.clone().lerp(b, j / 40);
        const cytoplasmic = point
          .clone()
          .sub(nucleus.position)
          .divide(nucleus.scale);
        assert(cytoplasmic.length() >= 0.999, "MT must not enter nucleoplasm");
        assert(
          cells.some((c) => containsRevolved(c, point)),
          `MT crosses intact PM at p=${p}, side=${i}, sample=${j}`,
        );
        if (p < 0.62)
          assert(
            containsRevolved(cells[i], point),
            "pre-fusion MT remains in its own cell",
          );
      }
    }
  }
  for (const p of [0.6, 0.769, 0.77, 0.775, 0.79, 0.82, 0.84, 0.86, 0.9, 1]) {
    update(s, p, { partner: "compatible" });
    const cells = ["left", "right"].map((side) =>
      get(s, `mating-${side}-cell-envelope:envelope-layer-2`),
    );
    const envelopes = [
      get(s, "mating-fused-nuclear-envelope"),
      ...[0, 1].map((i) => get(s, `mating-parent-nuclear-envelope-${i}`)),
    ].filter((o) => o.visible);
    assert.equal(
      envelopes.length,
      p < 0.77 ? 2 : 1,
      "no third replacement nucleus",
    );
    for (const ne of envelopes)
      for (const point of vertices(ne))
        assert(
          cells.some((c) => containsRevolved(c, point)),
          `NE outside cell PM at p=${p}`,
        );
    if (p > 0.77) {
      const a = envelopes[0].geometry.attributes.position;
      assert(
        Math.hypot(a.getY(20 * 49), a.getZ(20 * 49)) > 0,
        "fused nuclear lumen connected at neck",
      );
    }
  }
  for (const p of [0, 0.45, 0.8, 1]) {
    update(s, p, { partner: "same" });
    assert(!get(s, "mating-fused-nuclear-envelope").visible);
    for (let i = 0; i < 2; i++)
      assert(!get(s, `mating-cytoplasmic-microtubule-${i}`).visible);
  }
}

// yeastLife-06/07: a common real nuclear mesh across MI/MII; persistent inner
// membrane object; wall shell coordinates occupy the correct compartment.
{
  const s = sporulation.create();
  for (const p of [0.3, 0.47, 0.48, 0.5, 0.6, 0.69, 0.75, 0.799]) {
    update(s, p, { nutrients: "starved" });
    const common = get(s, "sporulation-common-nuclear-envelope");
    assert(common.visible);
    // Probe the actual triangulated back surface through the common lumen.
    // Late MII retains three connecting necks while the four lobes constrict.
    const points =
      p < 0.68
        ? Array.from({ length: 15 }, (_, i) => [
            common.geometry.boundingBox.max.x * (i / 7 - 1) * 0.9,
            0,
          ])
        : [
            ...Array.from({ length: 17 }, (_, i) => [
              -0.88 + (1.76 * i) / 16,
              0,
            ]),
            ...[-0.88, 0.88].flatMap((x) =>
              Array.from({ length: 17 }, (_, i) => [
                x,
                -0.82 + (1.64 * i) / 16,
              ]),
            ),
          ];
    for (const [x, y] of points) {
      const back = vec(),
        normal = vec();
      assert(
        backSurfaceAt(common, x, y, back, normal),
        "common lumen has a real back surface",
      );
      assert(back.z < -1e-7, "common lumen keeps finite depth until partition");
    }
    for (let i = 0; i < 4; i++)
      assert(!get(s, `sporulation-daughter-nucleus-${i}`).visible);
  }
  const membranes = Array.from({ length: 4 }, (_, i) =>
    get(s, `sporulation-persistent-spore-pm-${i}`),
  );
  for (const p of [0.8, 0.835, 0.85, 0.88, 0.9, 0.92, 0.96, 1]) {
    update(s, p, { nutrients: "starved" });
    assert(!get(s, "sporulation-common-nuclear-envelope").visible);
    for (let i = 0; i < 4; i++) {
      const pm = get(s, `sporulation-persistent-spore-pm-${i}`),
        outer = get(s, `sporulation-outer-prospore-membrane-${i}`);
      assert.equal(pm, membranes[i]);
      assert(pm.visible);
      const radii = vertices(pm).map((v) => v.sub(pm.position).length());
      const innerRadius = Math.min(...radii);
      assert(Math.abs(innerRadius - 0.64 * 0.947) < 1e-5);
      assert.equal(outer.visible, p < 0.9);
      const nucleus = get(s, `sporulation-daughter-nucleus-${i}`);
      assert(nucleus.visible);
      for (const point of vertices(nucleus))
        assert(point.sub(pm.position).length() < innerRadius);
      for (const type of ["mannan", "glucan", "chitosan", "dityrosine"]) {
        const layer = get(s, `sporulation-wall-${i}-${type}`);
        if (!layer.visible) continue;
        for (const point of vertices(layer)) {
          const r = point.sub(pm.position).length();
          assert(
            r > innerRadius,
            "wall must remain outside persistent spore PM",
          );
          if (outer.visible)
            assert(r < 0.64, "early wall lies in intermembrane lumen");
        }
      }
    }
  }
  for (const p of [0.5, 0.9, 1]) {
    update(s, p, { nutrients: "rich" });
    assert(get(s, "sporulation-common-nuclear-envelope").visible);
    for (let i = 0; i < 4; i++) {
      assert(!get(s, `sporulation-daughter-nucleus-${i}`).visible);
      assert(!get(s, `sporulation-persistent-spore-pm-${i}`).visible);
    }
  }
}

// 20261004-yeastLife-01/02: inspect the detailed tubes, not only chromosome
// beads. Inherited chromatin never exits the closed nucleus, and growing actin
// cables and their carriers remain inside the actual plasma-membrane profiles.
{
  const s = budding.create();
  const inherited = [0, 1].map((i) =>
    get(s, `budding-inherited-chromatin-${i}`),
  );
  for (const p of [
    0, 0.075, 0.09, 0.105, 0.12001, 0.15, 0.2, 0.24, 0.28, 0.4, 0.6, 0.65, 0.68,
    0.7, 0.72, 0.74, 0.74999, 0.75, 0.8, 1,
  ]) {
    update(s, p);
    for (let side = 0; side < 2; side++) {
      assert.equal(
        get(s, `budding-inherited-chromatin-${side}`),
        inherited[side],
      );
      if (!inherited[side].visible) continue;
      for (const tube of inherited[side].children)
        for (const point of vertices(tube)) {
          if (p < 0.75) {
            assert(
              containsRevolved(
                get(s, "budding-continuous-nuclear-envelope:envelope-layer-1"),
                point,
                48,
                0.00001,
              ),
              `detailed chromatin outside intact nuclear envelope at ${p}`,
            );
          } else {
            const nucleus = get(
              s,
              side ? "budding-daughter-nucleus" : "budding-mother-nucleus",
            );
            assert(
              point.sub(nucleus.position).divide(nucleus.scale).length() < 0.94,
            );
          }
        }
    }
    const cells = ["mother", "daughter"].map((name) =>
      get(s, `budding-${name}-envelope:envelope-layer-2`),
    );
    for (let i = 0; i < 2; i++) {
      const cable = get(s, `budding-actin-cable-${i}`);
      if (!cable.visible) continue;
      for (const point of vertices(cable))
        assert(
          cells.some((c) => containsRevolved(c, point, 48, 0.00001)),
          `actin outside PM at ${p}`,
        );
    }
    for (let i = 0; i < 8; i++) {
      const carrier = get(s, `budding-secretory-vesicle-${i}`);
      if (!carrier.visible || carrier.scale.x < 0.00001) continue;
      for (const point of vertices(carrier))
        assert(
          cells.some((c) => containsRevolved(c, point, 48, 0.00001)),
          `carrier outside PM at ${p}`,
        );
    }
  }
}

// 20261004-yeastLife-03: follow original carbon object identities through
// decarboxylation, and derive CO2 membership from real C-O bond endpoints.
{
  const s = fermentation.create();
  const carbons = Array.from({ length: 6 }, (_, i) =>
    get(s, `fermentation-carbon-${i}`),
  );
  for (const condition of ["anaerobic", "aerobic"]) {
    for (const p of [0, 0.15, 0.3, 0.58, 1]) {
      update(s, p, { condition });
      for (let i = 0; i < 6; i++)
        assert.equal(get(s, `fermentation-carbon-${i}`), carbons[i]);
    }
    const carbonPositions = carbons.map((c) => c.getWorldPosition(vec()));
    const co2 = new Set();
    for (let i = 0; i < 4; i++) {
      const bond = get(s, `fermentation-co2-bond-${i}`),
        oxygen = get(s, `fermentation-co2-oxygen-${i}`).getWorldPosition(vec()),
        ends = endpoints(bond);
      assert(bond.visible && ends.some((p) => p.distanceTo(oxygen) < 1e-5));
      const index = carbonPositions.findIndex((p) =>
        ends.some((e) => p.distanceTo(e) < 1e-5),
      );
      assert(index >= 0);
      co2.add(index);
    }
    assert.deepEqual(
      [...co2].sort(),
      [2, 3],
      "CO2 must inherit the middle glucose carbons",
    );
  }
}

function requireInvisibleReset(scene, name, p, parameters) {
  const mesh = get(scene, name),
    eps = 1e-7;
  update(scene, p - eps, parameters);
  const a = mesh.position.clone(),
    sizeBefore = Math.max(...mesh.scale.toArray());
  update(scene, p + eps, parameters);
  const sizeAfter = Math.max(...mesh.scale.toArray());
  if (a.distanceTo(mesh.position) > 0.1)
    assert(
      Math.max(sizeBefore, sizeAfter) < 1e-6,
      `${name} resets at full size p=${p}`,
    );
}

// 20261004-yeastLife-04/05/06: all active repeats, the post-fusion MT extension,
// and all detailed chromatin colors in the same-type negative control.
{
  const s = mating.create();
  for (let i = 0; i < 8; i++) {
    const p = (1 - (i % 4) / 4) / 2;
    if (p > 0.17 && p < 0.57)
      requireInvisibleReset(s, `mating-secretory-vesicle-${i}`, p, {
        partner: "compatible",
      });
  }
  for (let i = 0; i < 14; i++) {
    const p = (1 - (i % 7) / 7) / 1.8;
    if (p < 0.46)
      requireInvisibleReset(s, `mating-pheromone-${i}`, p, {
        partner: "compatible",
      });
  }
  for (const p of [0.62, 0.625, 0.635, 0.645, 0.655]) {
    update(s, p - 1e-7);
    const before = endpoints(get(s, "mating-cytoplasmic-microtubule-0"));
    update(s, p + 1e-7);
    const after = endpoints(get(s, "mating-cytoplasmic-microtubule-0"));
    assert(Math.max(...before.map((v, i) => v.distanceTo(after[i]))) < 0.00002);
  }
  for (const partner of ["same", "compatible", "same"]) {
    update(s, 0.74, { partner });
    for (let side = 0; side < 2; side++)
      for (const mesh of get(s, `mating-inherited-chromatin-${side}`).children)
        if (mesh.geometry.type === "TubeGeometry")
          assert.equal(
            mesh.material.color.getHexString(),
            side && partner === "compatible" ? "b68190" : "5a9588",
          );
  }
}

function distanceToSurface(mesh, point) {
  const a = mesh.geometry.attributes.position,
    index = mesh.geometry.index,
    triangle = new THREE.Triangle(),
    nearest = vec(),
    local = point.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
  let distance = Infinity;
  for (let i = 0; i < index.count; i += 3) {
    triangle.a.fromBufferAttribute(a, index.getX(i));
    triangle.b.fromBufferAttribute(a, index.getX(i + 1));
    triangle.c.fromBufferAttribute(a, index.getX(i + 2));
    triangle.closestPointToPoint(local, nearest);
    distance = Math.min(distance, nearest.distanceTo(local));
  }
  return distance;
}

// 20261004-yeastLife-07/08: actual spindle ends, exact NE triangle surfaces,
// the nascent PSM basal site and all active carrier reset boundaries.
{
  const s = sporulation.create();
  for (const p of [
    0.3, 0.45, 0.49, 0.51, 0.52, 0.56, 0.6, 0.64, 0.67, 0.71, 0.75, 0.79,
  ]) {
    update(s, p, { nutrients: "starved" });
    const ne = get(s, "sporulation-common-nuclear-envelope");
    const poles = [0, 1, 2, 3].map((i) => get(s, `sporulation-spb-${i}`));
    for (const pole of poles)
      if (pole.visible)
        assert(
          distanceToSurface(ne, pole.getWorldPosition(vec())) < 1e-5,
          `SPB detached from NE at ${p}`,
        );
    if (p < 0.5) {
      const ends = endpoints(get(s, "sporulation-spindle-I"));
      for (const [i, poleIndex] of [0, 2].entries())
        assert(ends[i].distanceTo(poles[poleIndex].position) < 1e-5);
    } else if (p < 0.72) {
      for (let spindle = 0; spindle < 2; spindle++) {
        const ends = endpoints(get(s, `sporulation-spindle-II-${spindle}`));
        for (let end = 0; end < 2; end++)
          assert(
            ends[end].distanceTo(poles[spindle * 2 + end].position) < 1e-5,
          );
      }
    }
    if (p > 0.59 && p < 0.7)
      for (let i = 0; i < 4; i++) {
        const membrane = get(s, `sporulation-outer-prospore-membrane-${i}`),
          basal = vec()
            .fromBufferAttribute(membrane.geometry.attributes.position, 0)
            .applyMatrix4(membrane.matrixWorld);
        assert(
          Math.abs(basal.distanceTo(poles[i].position) - 0.06) < 1e-5,
          "initial PSM must adjoin its SPB",
        );
      }
  }
  for (let i = 0; i < 12; i++)
    for (const cycle of [1, 2]) {
      const p = (cycle - i / 12) / 2;
      if (p > 0.59 && p < 0.82)
        requireInvisibleReset(s, `sporulation-secretory-vesicle-${i}`, p, {
          nutrients: "starved",
        });
    }
  const surface = vec(),
    normal = vec();
  for (const p of [0.59001, 0.6, 0.65, 0.7, 0.74, 0.78, 0.799]) {
    update(s, p);
    const ne = get(s, "sporulation-common-nuclear-envelope");
    for (let i = 0; i < 4; i++)
      for (const name of ["outer-prospore-membrane", "persistent-spore-pm"])
        for (const point of vertices(get(s, `sporulation-${name}-${i}`)))
          if (backSurfaceAt(ne, point.x, point.y, surface, normal))
            assert(
              point.z < surface.z + 0.006,
              `PSM cup intersects common NE at ${p}`,
            );
  }
}
console.log(
  "yeastLife scientific geometry invariants: PASS (historical regressions plus 8 process-review issues, all controls)",
);

// R01-R04: label.position is the leader endpoint in both the native player and
// capture. Check actual target coordinates and visibility across all scenarios.
function atLabelTarget(scene, labelIndex, meshName, vertex) {
  const mesh = get(scene, meshName),
    expected =
      vertex === undefined
        ? mesh.getWorldPosition(vec())
        : vec()
            .fromBufferAttribute(mesh.geometry.attributes.position, vertex)
            .applyMatrix4(mesh.matrixWorld),
    actual = vec().fromArray(scene.labels[labelIndex].position);
  assert(
    actual.distanceTo(expected) < 1e-6,
    `${meshName}: detached label ${labelIndex}`,
  );
  if (scene.labels[labelIndex].active !== false)
    for (let object = mesh; object; object = object.parent)
      assert(
        object.visible,
        `${meshName}: active label targets hidden geometry`,
      );
}
function deterministicLabels(scene, parameters) {
  const arrays = scene.labels.map((l) => l.position);
  update(scene, 0.72, parameters);
  const before = JSON.stringify(scene.labels);
  update(scene, 0.1, parameters);
  update(scene, 0.98, parameters);
  update(scene, 0.72, parameters);
  assert.equal(JSON.stringify(scene.labels), before);
  scene.labels.forEach((label, i) => assert.equal(label.position, arrays[i]));
}
{
  const s = budding.create();
  for (const p of [
    0, 0.09, 0.15, 0.35, 0.5, 0.72, 0.74999, 0.75, 0.78, 0.91, 1,
  ]) {
    update(s, p);
    atLabelTarget(s, 0, "budding-mother-envelope", 20 * 49);
    atLabelTarget(s, 1, "budding-daughter-envelope", 24 * 49);
    atLabelTarget(s, 2, "budding-mother-envelope", 36 * 49);
    atLabelTarget(
      s,
      3,
      p < 0.75
        ? "budding-continuous-nuclear-envelope"
        : "budding-mother-nucleus",
      p < 0.75 ? 11 * 49 : 0,
    );
  }
  deterministicLabels(s, {});
}
{
  const s = fermentation.create();
  for (const condition of ["anaerobic", "aerobic"]) {
    for (const p of [
      0, 0.1, 0.15, 0.2, 0.27, 0.29, 0.4, 0.49, 0.57, 0.6, 0.72, 0.76, 0.8, 0.9,
      1,
    ]) {
      update(s, p, { condition });
      for (const label of [0, 1, 4, 5, 12])
        atLabelTarget(s, label, "fermentation-carbon-1");
      atLabelTarget(s, 2, "fermentation-pdc-label-target");
      atLabelTarget(s, 3, "fermentation-adh-label-target");
      atLabelTarget(s, 6, "fermentation-carbon-2");
      atLabelTarget(s, 7, "fermentation-atp-label-target");
      for (const label of [8, 11])
        atLabelTarget(s, label, "fermentation-nad-label-target");
      atLabelTarget(s, 10, "fermentation-oxygen-label-target");
      const wholeGlucose = get(s, "fermentation-carbon-bond-2").visible,
        carboxylAttached = get(s, "fermentation-carbon-bond-1").visible,
        pyruvateGroups = get(s, "fermentation-co2-bond-0").visible,
        carbonylDouble = get(s, "fermentation-carbonyl-bond-1").visible,
        hydroxyl = get(s, "fermentation-hydroxyl-hydrogen-0").visible;
      assert.equal(s.labels[0].active, wholeGlucose);
      assert.equal(s.labels[1].active, pyruvateGroups && carboxylAttached);
      assert.equal(s.labels[4].active, !carboxylAttached && carbonylDouble);
      assert.equal(s.labels[5].active, hydroxyl);
      assert.equal(s.labels[6].active, !carboxylAttached);
      assert.equal(s.labels[12].active, !wholeGlucose && !pyruvateGroups);
    }
    deterministicLabels(s, { condition });
  }
}
{
  const s = mating.create();
  for (const partner of ["compatible", "same"]) {
    for (const p of [0, 0.2, 0.43, 0.55, 0.7, 0.76999, 0.77, 0.85, 0.91, 1]) {
      update(s, p, { partner });
      atLabelTarget(s, 0, "mating-left-cell-envelope", 20 * 49);
      atLabelTarget(s, 1, "mating-right-cell-envelope", 20 * 49);
      atLabelTarget(s, 3, "mating-left-cell-envelope", 0);
      const fused = get(s, "mating-fused-nuclear-envelope").visible;
      atLabelTarget(
        s,
        4,
        fused
          ? "mating-fused-nuclear-envelope"
          : "mating-parent-nuclear-envelope-0",
        fused ? 20 * 49 : 14 * 41 + 20,
      );
      atLabelTarget(s, 5, "mating-fused-nuclear-envelope", 14 * 49);
    }
    deterministicLabels(s, { partner });
  }
}
{
  const s = sporulation.create();
  for (const nutrients of ["starved", "rich"]) {
    for (const p of [
      0, 0.14, 0.31, 0.5, 0.59, 0.66, 0.72, 0.8, 0.83, 0.87, 0.92, 0.96, 1,
    ]) {
      update(s, p, { nutrients });
      atLabelTarget(s, 0, "sporulation-maternal-ascus", 0);
      atLabelTarget(s, 1, "sporulation-maternal-ascus", 28 * 41);
      for (const label of [2, 3])
        atLabelTarget(s, label, "sporulation-centromere-0");
      atLabelTarget(s, 4, "sporulation-centromere-1");
      atLabelTarget(s, 5, "sporulation-outer-prospore-membrane-1", 24 * 37);
      if (s.labels[6].active) {
        const wall = ["dityrosine", "chitosan", "glucan", "mannan"].find(
          (name) => get(s, `sporulation-wall-0-${name}`).visible,
        );
        atLabelTarget(s, 6, `sporulation-wall-0-${wall}`, 14 * 41 + 20);
      }
      atLabelTarget(s, 7, "sporulation-rich-nutrient-label-target");
      assert.match(s.labels[0].text.en, /starting/);
      assert.match(s.labels[0].text.zh, /起始/);
    }
    deterministicLabels(s, { nutrients });
  }
}
console.log(
  "yeastLife annotation anchors and named chemical states: PASS (4 supplementary findings, 7 scenarios)",
);

// R05: the rendered .799/.801 discontinuity must be fixed on actual membrane
// triangles. Equal-area samples keep an arbitrarily thin, vanishing lumen
// bridge from dominating the metric, while the reverse direction and area
// bound prevent a smaller or hidden envelope from satisfying the check.
function membraneSamples(mesh, count = 128) {
  const a = mesh.geometry.attributes.position,
    index = mesh.geometry.index,
    triangles = [];
  let total = 0;
  for (let i = 0; i < index.count; i += 3) {
    const points = [0, 1, 2].map((k) =>
      vec()
        .fromBufferAttribute(a, index.getX(i + k))
        .applyMatrix4(mesh.matrixWorld),
    );
    const triangle = new THREE.Triangle(...points),
      area = triangle.getArea();
    if (area <= 1e-10) continue;
    triangles.push({ triangle, area });
    total += area;
  }
  const points = [];
  let cursor = 0,
    preceding = 0;
  for (let i = 0; i < count; i++) {
    const target = (total * (i + 0.5)) / count;
    while (
      cursor < triangles.length - 1 &&
      preceding + triangles[cursor].area < target
    )
      preceding += triangles[cursor++].area;
    points.push(triangles[cursor].triangle.getMidpoint(vec()));
  }
  return { points, area: total };
}
{
  const s = sporulation.create();
  update(s, 0.799, { nutrients: "starved" });
  const common = get(s, "sporulation-common-nuclear-envelope"),
    before = common.clone(false);
  before.geometry = common.geometry.clone();
  before.matrixWorld.copy(common.matrixWorld);
  const source = membraneSamples(before);
  update(s, 0.801, { nutrients: "starved" });
  const daughters = [0, 1, 2, 3].map((i) =>
      get(s, `sporulation-daughter-nucleus-${i}`),
    ),
    targetSamples = daughters.map((n) => membraneSamples(n, 32)),
    targetArea = targetSamples.reduce((n, sample) => n + sample.area, 0),
    forward = source.points
      .map((p) => Math.min(...daughters.map((n) => distanceToSurface(n, p))))
      .sort((a, b) => a - b),
    reverse = targetSamples
      .flatMap((sample) =>
        sample.points.map((p) => distanceToSurface(before, p)),
      )
      .sort((a, b) => a - b);
  assert(
    forward[Math.floor(forward.length * 0.95)] < 0.025,
    "R05 common surface must converge to real daughter surfaces before handoff",
  );
  assert(
    forward.filter((d) => d > 0.05).length / forward.length < 0.025,
    "R05 only vanishing lumen necks may remain between daughter lobes",
  );
  assert(
    reverse[Math.floor(reverse.length * 0.95)] < 0.025,
    "R05 daughter surfaces cannot appear far from their preceding envelope",
  );
  assert(
    source.area / targetArea > 0.95 && source.area / targetArea < 1.05,
    "R05 no broad connecting sheet may disappear at partition",
  );
  before.geometry.dispose();

  const sites = [
      [-0.88, -0.82],
      [-0.88, 0.82],
      [0.88, -0.82],
      [0.88, 0.82],
    ],
    previous = sites.map(() => null);
  for (let step = 0; step <= 122; step++) {
    const p = 0.68 + step * 0.001;
    update(s, p, { nutrients: "starved" });
    for (let i = 0; i < sites.length; i++) {
      const [x, y] = sites[i],
        surface = vec(),
        normal = vec();
      if (p < 0.8) assert(backSurfaceAt(common, x, y, surface, normal));
      else {
        const n = daughters[i];
        // Query the daughter's real local triangulated surface, then bring
        // that point back to world space rather than using radius metadata.
        const local = n.worldToLocal(vec(x, y, 0));
        assert(backSurfaceAt(n, local.x, local.y, surface, normal));
        n.localToWorld(surface);
      }
      if (previous[i])
        assert(
          surface.distanceTo(previous[i]) < 0.02,
          `R05 membrane trajectory jumps at ${p}`,
        );
      previous[i] = surface;
    }
  }
}
console.log(
  "yeastLife nuclear partition: PASS (R05 actual bidirectional surfaces, disappearing-neck area, and boundary trajectories)",
);
