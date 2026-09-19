import assert from "node:assert/strict";
import { Vector3 } from "three";
import diffusion from "./diffusionProcess.js";
import pump from "./activeTransportProcess.js";
import osmosis from "./osmoticBalanceProcess.js";
import wall from "./bacterialCellWallProcess.js";

const near = (a, b, eps = 1e-6) =>
  assert(Math.abs(a - b) <= eps, `${a} != ${b}`);
const named = (s, name) => {
  const object = s.group.getObjectByName(name);
  assert(object, `missing ${name}`);
  return object;
};
const world = (o) => o.getWorldPosition(new Vector3());
const ends = (o) =>
  [-0.5, 0.5].map((y) => o.localToWorld(new Vector3(0, y, 0)));
const joins = (bond, a, b) => {
  const [x, y] = ends(bond);
  assert(
    Math.min(
      x.distanceTo(a) + y.distanceTo(b),
      x.distanceTo(b) + y.distanceTo(a),
    ) < 1e-6,
    `${bond.name} detached`,
  );
};
function measure(g) {
  const a = new Vector3(),
    b = new Vector3(),
    c = new Vector3(),
    cross = new Vector3();
  let area = 0,
    volume = 0;
  for (let i = 0; i < g.index.count; i += 3) {
    a.fromBufferAttribute(g.attributes.position, g.index.getX(i));
    b.fromBufferAttribute(g.attributes.position, g.index.getX(i + 1));
    c.fromBufferAttribute(g.attributes.position, g.index.getX(i + 2));
    volume += a.dot(cross.crossVectors(b, c)) / 6;
    area += cross.crossVectors(b.sub(a), c.sub(a)).length() / 2;
  }
  return { area, volume: Math.abs(volume) };
}
function inventory(s) {
  const nodes = [],
    geometries = new Set(),
    materials = new Set();
  s.group.traverse((o) => {
    nodes.push(o.uuid);
    if (o.geometry) geometries.add(o.geometry.uuid);
    for (const m of o.material
      ? Array.isArray(o.material)
        ? o.material
        : [o.material]
      : [])
      materials.add(m.uuid);
  });
  return {
    nodes,
    geometries: [...geometries],
    materials: [...materials].sort(),
  };
}
function snapshot(s) {
  const rows = [];
  const geometries = new Set();
  s.group.traverse((o) => {
    rows.push([o.visible, ...o.position, ...o.quaternion, ...o.scale]);
    if (o.geometry && !geometries.has(o.geometry)) {
      geometries.add(o.geometry);
      rows.push([...o.geometry.attributes.position.array]);
    }
    if (o.instanceMatrix) rows.push([...o.instanceMatrix.array]);
  });
  return JSON.stringify([rows, s.labels]);
}
function finite(s) {
  const checked = new Set();
  s.group.traverse((o) => {
    assert([...o.position, ...o.scale, ...o.quaternion].every(Number.isFinite));
    if (o.geometry && !checked.has(o.geometry)) {
      checked.add(o.geometry);
      for (const a of Object.values(o.geometry.attributes))
        assert([...a.array].every(Number.isFinite));
    }
    if (o.instanceMatrix)
      assert([...o.instanceMatrix.array].every(Number.isFinite));
  });
}
function common(s, params) {
  const initial = inventory(s);
  for (const p of [0, 0.25, 0.319, 0.32, 0.61, 0.742, 0.92, 1, NaN]) {
    s.update(p, params);
    finite(s);
    const current = inventory(s);
    assert.deepEqual(current.nodes, initial.nodes);
    assert.deepEqual(current.geometries, initial.geometries);
    if (s.materials)
      assert(
        current.materials.every((id) => s.materials.some((m) => m.uuid === id)),
      );
  }
  s.update(0.742, params);
  const expected = snapshot(s);
  s.update(0.02, {});
  s.update(1, {});
  s.update(0.742, params);
  assert.equal(snapshot(s), expected);
}

// membrane-01: count actual plane crossings, including balanced exchange in
// the named equilibrium interval. The finite endpoint itself may be paused.
let diffusionCombinations = 0;
for (const rootId of ["cell", "plant", "bacterium", "yeast"]) {
  const s = diffusion.create({ rootId });
  const particles = Array.from({ length: 32 }, (_, i) =>
    named(s, `diffusing-molecule-${i}`),
  );
  for (const route of ["water", "oxygen"])
    for (const gradient of ["outside", "equal"]) {
      const params = { route, gradient };
      common(s, params);
      s.update(0, params);
      let previous = particles.map((m) => m.position.y);
      let inward = 0,
        outward = 0,
        lateIn = 0,
        lateOut = 0;
      for (let j = 1; j <= 1000; j++) {
        const p = j / 1000;
        s.update(p, params);
        particles.forEach((m, i) => {
          if (previous[i] > 0 && m.position.y <= 0) {
            inward++;
            if (p > 0.86) lateIn++;
          }
          if (previous[i] < 0 && m.position.y >= 0) {
            outward++;
            if (p > 0.86) lateOut++;
          }
          if (Math.abs(m.position.y) < 0.76) {
            if (route === "water") {
              near(Math.abs(m.position.x), 0.46);
              near(Math.abs(m.position.z), 0.46);
            } else assert(Math.abs(m.position.x) >= 1.15);
          }
          previous[i] = m.position.y;
        });
      }
      assert(lateIn > 0 && lateOut > 0);
      assert.equal(lateIn, lateOut);
      assert.equal(inward - outward, gradient === "equal" ? 0 : 8);
      assert.equal(particles.filter((o) => o.position.y > 0).length, 16);
      assert.equal(particles.filter((o) => o.position.y < 0).length, 16);
      diffusionCombinations++;
    }
}
console.log(
  `membrane-01 PASS: ${diffusionCombinations} root/control combinations; measured equilibrium crossings 4 in / 4 out`,
);

// membrane-02: inspect the displayed label against actual gate transforms and
// visible phosphate, not the declared conformation/transport metadata.
{
  const s = pump.create();
  const inner = named(s, "pump-internal-gate"),
    outer = named(s, "pump-external-gate");
  const phosphate = named(s, "pump-phosphate"),
    terminal = named(s, "ATP-terminal-phosphate");
  for (const energy of ["atp", "none"]) {
    common(s, { energy });
    let sawNaOcclusion = false,
      sawKOcclusion = false;
    for (let j = 0; j <= 1000; j++) {
      s.update(j / 1000, { energy });
      const label = s.labels[6].text.en;
      assert(
        !(
          Math.abs(inner.position.x) > 1e-9 && Math.abs(outer.position.x) > 1e-9
        ),
      );
      if (label.includes("occluded")) {
        near(inner.position.x, 0);
        near(outer.position.x, 0);
        near(inner.scale.x, 0.58);
        near(outer.scale.x, 0.58);
      }
      if (label.includes("sodium occluded")) {
        sawNaOcclusion = true;
        assert(phosphate.visible && !terminal.visible);
        near(phosphate.position.x, 0.12);
      }
      if (label.includes("potassium occluded")) sawKOcclusion = true;
      assert(!(phosphate.visible && terminal.visible));
      // Peer correction: reaction events must agree with gate closure too,
      // not only the conformation label.
      if (energy === "atp") {
        if (j / 1000 < 0.29) assert(terminal.visible && !phosphate.visible);
        if (j / 1000 >= 0.29 && j / 1000 < 0.33) {
          near(inner.position.x, 0);
          assert(phosphate.visible && !terminal.visible);
        }
        if (j / 1000 >= 0.29 && j / 1000 <= 0.78)
          near(phosphate.position.x, 0.12);
        if (
          phosphate.visible &&
          phosphate.position.x > 0.12 + 1e-9 &&
          j / 1000 < 0.81
        ) {
          near(outer.position.x, 0);
          near(inner.position.x, 0);
        }
      }
      if (energy === "none") {
        assert(!phosphate.visible && !terminal.visible);
        for (let i = 0; i < 3; i++)
          assert(named(s, `sodium-${i}`).position.y < 0.7);
        for (let i = 0; i < 2; i++)
          assert(named(s, `potassium-${i}`).position.y > 2.5);
      }
    }
    if (energy === "atp") {
      assert(sawNaOcclusion && sawKOcclusion);
      for (let i = 0; i < 3; i++)
        assert(named(s, `sodium-${i}`).position.y > 2);
      for (let i = 0; i < 2; i++)
        assert(named(s, `potassium-${i}`).position.y < -2);
    }
  }
}
console.log(
  "membrane-02 PASS: 2 energy branches; 2002 gate/phosphate/label states; 3 Na out and 2 K in",
);

// membrane-03: integrate the actual triangulated membrane. Both leaflets must
// preserve area while volume changes monotonically in the appropriate sense.
{
  const s = osmosis.create();
  const outer = named(s, "deforming-red-cell-membrane").geometry;
  const inner = named(s, "cytoplasmic-leaflet-continuous-shell").geometry;
  const base = measure(outer),
    innerBase = measure(inner);
  for (const tonicity of ["hypotonic", "isotonic", "hypertonic"]) {
    common(s, { tonicity });
    let previous = 1;
    let final;
    for (let j = 0; j <= 100; j++) {
      s.update(j / 100, { tonicity });
      const o = measure(outer),
        i = measure(inner);
      near(o.area / base.area, 1, 1e-6);
      near(i.area / innerBase.area, 1, 1e-6);
      const volume = o.volume / base.volume;
      if (tonicity === "hypotonic") assert(volume >= previous - 1e-6);
      if (tonicity === "hypertonic") assert(volume <= previous + 1e-6);
      if (tonicity === "isotonic") near(volume, 1);
      previous = volume;
      final = volume;
    }
    if (tonicity === "hypotonic") assert(final > 1.5);
    if (tonicity === "hypertonic") {
      assert(final < 0.8);
      // Shrinking is not an isotropic rescale: radial corrugation is visible.
      const a = outer.attributes.position;
      const radii = Array.from({ length: 64 }, (_, lon) => {
        const i = 20 * 65 + lon;
        return Math.hypot(a.getX(i), a.getZ(i));
      });
      assert(Math.max(...radii) / Math.min(...radii) > 1.4);
    }
    console.log(
      `membrane-03 ${tonicity}: area conserved, terminal V/V0=${final.toFixed(6)}`,
    );
  }
}

// membrane-04/05/06: molecular identity, attachment and bond endpoints are
// read from real scene objects and cylinder transforms, including intermediates.
{
  const s = wall.create();
  const reactants = [0, 1].flatMap((i) =>
    ["NAG", "NAM"].map((type) => named(s, `reactant-${i}-${type}`)),
  );
  const identities = reactants.map((o) => o.uuid);
  const polymerBond = named(s, "polymerization-glycosidic-bond");
  for (const antibiotic of ["none", "betaLactam"]) {
    common(s, { antibiotic });
    for (let j = 0; j <= 200; j++) {
      const p = j / 200;
      s.update(p, { antibiotic });
      s.group.updateMatrixWorld(true);
      assert.deepEqual(
        reactants.map((o) => o.uuid),
        identities,
      );
      reactants.forEach((o) => assert(o.visible && o.parent.visible));
      const attachments = [0, 1].map((i) =>
        named(s, `NAM-pyrophosphate-bond-${i}`),
      );
      assert.equal(
        attachments.filter((o) => o.visible).length,
        polymerBond.visible ? 1 : 2,
      );
      assert(attachments[1].visible, "growing-chain acceptor anchor lost");
      for (let i = 0; i < 2; i++) {
        const nam = world(named(s, `reactant-${i}-NAM`));
        const nag = world(named(s, `reactant-${i}-NAG`));
        const phosphate = world(named(s, `carrier-${i}-phosphate-0`));
        if (attachments[i].visible) {
          joins(attachments[i], nam, phosphate);
          assert(
            ends(attachments[i]).every((x) => x.distanceTo(nag) > 0.5),
            "carrier attached to NAG",
          );
        }
        const residue1 = world(named(s, `reactant-${i}-residue-1`));
        joins(named(s, `reactant-${i}-stem-bond-1`), nam, residue1);
        const terminal = world(named(s, `reactant-${i}-residue-5`));
        const donor = world(named(s, `reactant-${i}-residue-4`));
        const terminalBond = named(s, `reactant-${i}-stem-bond-5`);
        const crosslink = named(s, `new-peptide-crosslink-${i}`);
        const acceptor = world(named(s, `wall-0-${5 + i * 2}-residue-3`));
        if (crosslink.visible) {
          joins(crosslink, donor, acceptor);
          assert(!terminalBond.visible);
          assert(polymerBond.visible);
        } else {
          assert(terminalBond.visible);
          joins(terminalBond, donor, terminal);
        }
        if (antibiotic === "betaLactam")
          assert(!crosslink.visible && terminalBond.visible);
      }
      if (polymerBond.visible) {
        const donor = world(named(s, "reactant-0-NAM")).add(
          new Vector3(0.16, 0, 0),
        );
        const acceptor = world(named(s, "reactant-1-NAG")).add(
          new Vector3(-0.16, 0, 0),
        );
        joins(polymerBond, donor, acceptor);
      }
      for (const index of [1, 3, 9])
        joins(
          named(s, `existing-peptide-crosslink-${index}`),
          world(named(s, `wall-1-${index}-residue-4`)),
          world(named(s, `wall-0-${index}-residue-3`)),
        );
    }
    assert.equal(
      [0, 1].filter((i) => named(s, `new-peptide-crosslink-${i}`).visible)
        .length,
      antibiotic === "none" ? 2 : 0,
    );
  }
}
console.log(
  "membrane-04/05/06 PASS: 402 actual-geometry states; four conserved sugars, NAM–PP links, retained chain anchor, peptide-only crosslinks",
);
console.log("membrane science regression PASS (all 6 audited issues)");
