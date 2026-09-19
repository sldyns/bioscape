import assert from "node:assert/strict";
import * as THREE from "three";
import budding from "./yeastBuddingProcess.js";
import fermentation from "./yeastFermentationProcess.js";
import mating from "./yeastMatingProcess.js";
import sporulation from "./yeastSporulationProcess.js";

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
      if (p === 1) assert.deepEqual(edges, ["1-2", "4-5"]);
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
    const a = common.geometry.attributes.position;
    for (let row = 1; row < 32; row++) {
      const section = Array.from({ length: 41 }, (_, j) =>
        vec(a.getX(row * 41 + j), a.getY(row * 41 + j), a.getZ(row * 41 + j)),
      );
      assert(
        Math.max(...section.map((p) => Math.abs(p.z))) > 0.0001,
        "nuclear lumen stays connected across each section",
      );
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
console.log(
  "yeastLife scientific geometry invariants: PASS (7 audit issues, both control branches)",
);
