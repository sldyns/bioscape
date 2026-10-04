import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";
import * as THREE from "three";

// The optional directory permits a read-only regression challenge against
// archived baseline modules, without replacing files in the working tree.
const moduleBase = process.env.BIOSCAPE_MEMBRANE_TEST_MODULES
  ? pathToFileURL(`${process.env.BIOSCAPE_MEMBRANE_TEST_MODULES}/`)
  : new URL("./", import.meta.url);
const load = async (name) =>
  (await import(new URL(`${name}Process.js`, moduleBase))).default;
const [diffusion, pump, osmosis, wall] = await Promise.all(
  ["diffusion", "activeTransport", "osmoticBalance", "bacterialCellWall"].map(
    load,
  ),
);
const { seeded } = await import(new URL("membraneGeometry.js", moduleBase));
const near = (a, b, eps = 1e-7) =>
  assert(Math.abs(a - b) <= eps, `${a} != ${b}`);
const named = (s, name) => {
  const object = s.group.getObjectByName(name);
  assert(object, `Missing ${name}`);
  return object;
};
const world = (o) => o.getWorldPosition(new THREE.Vector3());
const ends = (o) =>
  [-0.5, 0.5].map((y) => o.localToWorld(new THREE.Vector3(0, y, 0)));
const connects = (bond, a, b) => {
  const [u, v] = ends(bond);
  assert(
    Math.min(
      u.distanceTo(a) + v.distanceTo(b),
      u.distanceTo(b) + v.distanceTo(a),
    ) < 1e-7,
    `${bond.name || "bond"} has a detached endpoint`,
  );
};
function closestSurface(group, point) {
  const triangle = new THREE.Triangle(),
    closest = new THREE.Vector3();
  let distance = Infinity;
  group.traverse((o) => {
    if (!o.geometry) return;
    const positions = o.geometry.attributes.position,
      index = o.geometry.index;
    for (let i = 0; i < (index?.count ?? positions.count); i += 3) {
      [triangle.a, triangle.b, triangle.c].forEach((v, j) =>
        v
          .fromBufferAttribute(positions, index ? index.getX(i + j) : i + j)
          .applyMatrix4(o.matrixWorld),
      );
      triangle.closestPointToPoint(point, closest);
      distance = Math.min(distance, point.distanceTo(closest));
    }
  });
  return distance;
}

test("01: actual secondary-structure helices are right-handed in all three consumers", () => {
  for (const definition of [diffusion, pump, wall]) {
    const s = definition.create();
    s.update(0.57);
    s.group.updateMatrixWorld(true);
    let count = 0;
    s.group.traverse((o) => {
      if (o.geometry?.parameters?.tubularSegments !== 112) return;
      const points = [0.2, 0.21, 0.22, 0.23].map((t) =>
        o.localToWorld(o.geometry.parameters.path.getPoint(t)),
      );
      const [a, b, c, d] = points;
      const chirality = b
        .clone()
        .sub(a)
        .cross(c.clone().sub(b))
        .dot(d.clone().sub(c));
      assert(chirality > 1e-9, `${definition.id}: left-handed alpha helix`);
      count++;
    });
    assert(count >= 10, `${definition.id}: expected detailed helices`);
  }
});

test("02: ATP phosphate handoff preserves one continuous visible marker", () => {
  const s = pump.create();
  const terminal = named(s, "ATP-terminal-phosphate"),
    attached = named(s, "pump-phosphate"),
    nucleotide = named(s, "ATP-ADP-nucleotide");
  const displayed = () => {
    const visible = [terminal, attached].filter((o) => o.visible);
    assert.equal(visible.length, 1);
    return visible[0];
  };
  for (const epsilon of [1e-3, 1e-5, 1e-7]) {
    s.update(0.29 - epsilon, { energy: "atp" });
    const before = displayed().position.clone(),
      radius = displayed().scale.x;
    s.update(0.29 + epsilon, { energy: "atp" });
    assert(before.distanceTo(displayed().position) < epsilon * 2);
    assert(Math.abs(radius - displayed().scale.x) < epsilon * 2);
  }
  for (const p of [0, 0.12, 0.22, 0.28, 0.289999]) {
    s.update(p, { energy: "atp" });
    assert(terminal.visible && !attached.visible);
    near(terminal.position.x - nucleotide.position.x, 0.76);
    near(terminal.position.y, nucleotide.position.y);
    near(terminal.position.z, nucleotide.position.z);
  }
  for (const p of [0.29, 0.31, 0.55, 0.779999]) {
    s.update(p, { energy: "atp" });
    assert(attached.visible && !terminal.visible);
    near(attached.position.x, 0.12);
  }
  for (const p of [0, 0.29, 0.78, 1]) {
    s.update(p, { energy: "none" });
    assert(!terminal.visible && !attached.visible && !nucleotide.visible);
  }
});

test("03: every osmotic tracer reset is invisible, with fully visible transport retained", () => {
  for (const rootId of ["cell", "erythrocyte"]) {
    const s = osmosis.create({ rootId });
    // The fallback also identifies original unnamed tracers in the baseline.
    const water = s.group.children.filter(
      (o) =>
        o.isMesh &&
        o.material?.color?.getHexString() === "80a9b5" &&
        Math.abs(o.scale.x - 0.07) < 1e-9,
    );
    assert.equal(water.length, 20);
    const materials = water.map((o) => o.material.uuid);
    for (const tonicity of ["hypotonic", "isotonic", "hypertonic"]) {
      const params = { tonicity };
      for (let i = 0; i < water.length; i++) {
        for (let turn = 1; turn <= 3; turn++) {
          const seam = (turn - seeded(i, 23)) / 2.2;
          if (seam <= 0 || seam >= 1) continue;
          const epsilon = 1e-6;
          for (const p of [seam - epsilon, seam, seam + epsilon]) {
            s.update(p, params);
            assert(
              water[i].material.opacity < 1e-7,
              `${rootId}/${tonicity}/water-${i}: visible reservoir teleport`,
            );
            assert(water[i].material.transparent);
          }
        }
        const middle = (1.5 - seeded(i, 23)) / 2.2;
        s.update(middle, params);
        near(water[i].material.opacity, 1);
        near(Math.hypot(water[i].position.x, water[i].position.z), 2.2);
        const before = water[i].position.length();
        s.update(middle + 1e-4, params);
        const inward =
          tonicity === "isotonic"
            ? i % 2 === 0
            : tonicity === "hypotonic"
              ? i % 5 !== 0
              : i % 5 === 0;
        assert(
          inward
            ? water[i].position.length() < before
            : water[i].position.length() > before,
        );
      }
      s.update(0.742, params);
      const state = water.map((o) => [...o.position, o.material.opacity]);
      for (const p of [0.031, 1, 0.527, 0]) s.update(p, params);
      s.update(0.742, params);
      assert.deepEqual(
        water.map((o) => [...o.position, o.material.opacity]),
        state,
      );
      assert.deepEqual(
        water.map((o) => o.material.uuid),
        materials,
      );
    }
  }
});

test("04: both transpeptidations contact the actual moving PBP2 cleft", () => {
  const s = wall.create();
  const cleft = named(s, "PBP2-transpeptidase-cleft");
  // Same actual residue object is identifiable even before it received a name.
  const serine = cleft.children.find(
    (o) => o.position.x === 0 && o.position.y === 0.06 && o.position.z === 0.27,
  );
  assert(serine);
  for (const [i, reaction] of [
    [0, 0.69],
    [1, 0.82],
  ]) {
    for (const p of [reaction - 0.002, reaction, reaction + 0.002]) {
      s.update(p, { antibiotic: "none" });
      s.group.updateMatrixWorld(true);
      const donor = world(named(s, `reactant-${i}-residue-4`));
      const acceptor = world(named(s, `wall-0-${5 + i * 2}-residue-3`));
      assert(
        donor.distanceTo(world(serine)) < 0.105,
        `reaction ${i}: donor misses active site`,
      );
      assert(
        closestSurface(cleft, donor) <= 0.064 + 1e-4,
        `reaction ${i}: donor detached from enzyme`,
      );
      assert(
        closestSurface(cleft, acceptor) <= 0.064 + 1e-4,
        `reaction ${i}: acceptor detached from enzyme`,
      );
      assert.equal(
        named(s, `new-peptide-crosslink-${i}`).visible,
        p >= reaction,
      );
    }
  }
  const stalk = named(s, "PBP2-attached-flexible-stalk");
  for (const p of [
    0, 0.42, 0.53, 0.64, 0.69, 0.72, 0.76, 0.8, 0.82, 0.92, 0.97, 1,
  ]) {
    s.update(p);
    s.group.updateMatrixWorld(true);
    const [start, end] = [0, 1].map((t) =>
      stalk.localToWorld(stalk.geometry.parameters.path.getPoint(t)),
    );
    const anchor = s.group.localToWorld(new THREE.Vector3(0.65, 0.5, -0.38));
    near(start.distanceTo(anchor), 0);
    near(
      end.distanceTo(cleft.localToWorld(new THREE.Vector3(0, -0.33, -0.15))),
      0,
    );
  }
  for (const boundary of [0.42, 0.64, 0.72, 0.8, 0.92]) {
    s.update(boundary - 1e-6);
    const before = cleft.position.clone();
    s.update(boundary + 1e-6);
    assert(before.distanceTo(cleft.position) < 1e-4);
  }
  for (const p of [0.69, 0.82, 1]) {
    s.update(p, { antibiotic: "betaLactam" });
    for (const i of [0, 1]) {
      assert(!named(s, `new-peptide-crosslink-${i}`).visible);
      assert(named(s, `reactant-${i}-stem-bond-5`).visible);
    }
  }
});

test("06: beta-lactam acylation opens its carbonyl C–N bond and joins actual atoms", () => {
  const s = wall.create();
  const drug = s.group.children.find(
    (o) =>
      o.isGroup && o.children[0]?.material?.color?.getHexString() === "bd8170",
  );
  assert(drug);
  const ringBonds = drug.children.slice(0, 4);
  for (const p of [1, 0, 0.2, 0.36, 0.379999, 0.38, 0.381, 0.6]) {
    s.update(p, { antibiotic: "betaLactam" });
    s.group.updateMatrixWorld(true);
    const carbon = drug.localToWorld(new THREE.Vector3(0.12, 0.12, 0));
    const nitrogen = drug.localToWorld(new THREE.Vector3(0.12, -0.12, 0));
    const broken = ringBonds.filter((o) => !o.visible);
    if (p < 0.38) {
      assert.equal(broken.length, 0);
      connects(ringBonds[1], carbon, nitrogen);
    } else {
      assert.equal(broken.length, 1);
      connects(broken[0], carbon, nitrogen);
      const acyl = named(s, "PBP2-beta-lactam-acyl-bond");
      assert(acyl.visible);
      connects(acyl, world(named(s, "PBP2-active-serine")), carbon);
      near(
        world(named(s, "beta-lactam-carbonyl-carbon")).distanceTo(carbon),
        0,
      );
      near(
        world(named(s, "beta-lactam-ring-nitrogen")).distanceTo(nitrogen),
        0,
      );
      const oxygen = world(named(s, "beta-lactam-carbonyl-oxygen"));
      for (const side of [-1, 1]) {
        const carbonylBond = named(s, `beta-lactam-carbonyl-bond-${side}`);
        const [a, b] = ends(carbonylBond);
        assert(carbonylBond.visible);
        assert(
          Math.min(
            a.distanceTo(carbon) + b.distanceTo(oxygen),
            a.distanceTo(oxygen) + b.distanceTo(carbon),
          ) < 0.03,
        );
      }
    }
  }
  s.update(1, { antibiotic: "none" });
  assert(!drug.visible);
  assert(!named(s, "PBP2-beta-lactam-acyl-bond").visible);
  assert(ringBonds.every((o) => o.visible));
});

const labelPoint = (s, i) =>
  s.group.localToWorld(new THREE.Vector3(...s.labels[i].position));
const onSurface = (s, i, mesh) =>
  assert(
    closestSurface(mesh, labelPoint(s, i)) < 1e-6,
    `label ${i} does not touch ${mesh.name || "its actual mesh"}`,
  );

test("07: aquaporin callout touches the actual channel in all root/control combinations", () => {
  for (const rootId of ["cell", "plant", "bacterium", "yeast"]) {
    const s = diffusion.create({ rootId });
    // The material/transform fallback challenges the original unnamed helix.
    const helix = s.group.children.find(
      (o) =>
        o.geometry?.parameters?.tubularSegments === 112 &&
        Math.abs(o.position.x - 0.75) < 1e-6 &&
        Math.abs(o.position.z - 0.46) < 1e-6,
    );
    assert(helix);
    for (const route of ["water", "oxygen"])
      for (const gradient of ["outside", "equal"])
        for (const p of [0, 0.395, 0.875, 1]) {
          s.update(p, { route, gradient });
          s.group.updateMatrixWorld(true);
          onSurface(s, 2, helix);
        }
  }
});

test("08: pump callouts follow real domains, gates and nucleotide/phosphate objects", () => {
  const s = pump.create();
  for (const energy of ["atp", "none"]) {
    for (const p of [
      1, 0, 0.18, 0.28, 0.29, 0.395, 0.58, 0.71, 0.78, 0.795, 0.805, 0.875,
      0.94,
    ]) {
      s.update(p, { energy });
      s.group.updateMatrixWorld(true);
      onSurface(s, 4, named(s, "N-domain-nucleotide-cleft").children[0]);
      onSurface(s, 5, named(s, "P-domain-phosphorylation-pocket").children[1]);
      onSurface(s, 6, named(s, "alpha-subunit-helix-M3"));
      const nucleotide = named(s, "ATP-ADP-nucleotide");
      near(
        labelPoint(s, 7).distanceTo(
          world(energy === "atp" ? nucleotide : named(s, "pump-internal-gate")),
        ),
        0,
      );
      const phosphate = named(s, "pump-phosphate");
      assert.equal(s.labels[8].active, phosphate.visible);
      if (phosphate.visible)
        near(labelPoint(s, 8).distanceTo(world(phosphate)), 0);
      assert.equal(nucleotide.visible, energy === "atp");
    }
  }
});

test("09: red-cell callouts follow actual deformed membrane, cortex and arrows", () => {
  const matrix = new THREE.Matrix4(),
    node = new THREE.Vector3();
  for (const rootId of ["cell", "erythrocyte"]) {
    const s = osmosis.create({ rootId });
    const membrane = named(s, "deforming-red-cell-membrane");
    const junctions = named(s, "cortical-junctions");
    // Original arrows had no names: identify their actual cone children.
    const arrows = s.group.children.filter(
      (o) =>
        o.isGroup &&
        o.children.some((c) => c.geometry?.type === "ConeGeometry"),
    );
    assert.equal(arrows.length, 2);
    for (const tonicity of ["hypotonic", "isotonic", "hypertonic"]) {
      for (const p of [1, 0.875, 0, 0.15, 0.395, 0.62]) {
        s.update(p, { tonicity });
        s.group.updateMatrixWorld(true);
        let nearestVertex = Infinity,
          nearestNode = Infinity;
        const point = labelPoint(s, 1);
        for (let i = 0; i < membrane.geometry.attributes.position.count; i++) {
          node
            .fromBufferAttribute(membrane.geometry.attributes.position, i)
            .applyMatrix4(membrane.matrixWorld);
          nearestVertex = Math.min(nearestVertex, point.distanceTo(node));
        }
        near(nearestVertex, 0);
        const cortexPoint = labelPoint(s, 5);
        for (let i = 0; i < junctions.count; i++) {
          junctions.getMatrixAt(i, matrix);
          node
            .setFromMatrixPosition(matrix)
            .applyMatrix4(junctions.matrixWorld);
          nearestNode = Math.min(nearestNode, cortexPoint.distanceTo(node));
        }
        near(nearestNode, 0);
        arrows.forEach((arrow, i) =>
          near(labelPoint(s, 3 + i).distanceTo(world(arrow.children[1])), 0),
        );
      }
    }
  }
});

test("10: cell-wall callouts track real proteins/substrate and only annotate extant products", () => {
  const s = wall.create();
  const rodA = s.group.children.find(
    (o) =>
      o.geometry?.parameters?.tubularSegments === 112 &&
      Math.abs(o.position.x - (-3 + Math.cos((2 * Math.PI) / 5) * 0.5)) <
        1e-6 &&
      o.material.color.getHexString() === "7f9ba3",
  );
  assert(rodA);
  const cleft = named(s, "PBP2-transpeptidase-cleft");
  const serine = cleft.children.find(
    (o) => o.position.x === 0 && o.position.y === 0.06 && o.position.z === 0.27,
  );
  for (const antibiotic of ["none", "betaLactam"]) {
    for (const p of [
      1, 0, 0.17, 0.319999, 0.32, 0.36, 0.379999, 0.38, 0.61, 0.689999, 0.69,
      0.785, 0.819999, 0.82,
    ]) {
      s.update(p, { antibiotic });
      s.group.updateMatrixWorld(true);
      onSurface(s, 2, rodA);
      near(labelPoint(s, 3).distanceTo(world(serine)), 0);
      onSurface(s, 4, named(s, "reactant-1-NAM").children[1]);
      const active = antibiotic === "betaLactam" ? p >= 0.38 : p >= 0.69;
      assert.equal(s.labels[5].active, active);
      if (active) {
        const target =
          antibiotic === "betaLactam"
            ? serine
            : named(s, "new-peptide-crosslink-0");
        near(labelPoint(s, 5).distanceTo(world(target)), 0);
        assert(
          antibiotic === "betaLactam"
            ? named(s, "PBP2-beta-lactam-acyl-bond").visible
            : target.visible,
        );
      }
    }
  }
});

test("11: mDAP branches retain peptide identities with clear bonds and separated nonendpoint residues", () => {
  const s = wall.create(),
    line = new THREE.Line3(),
    closest = new THREE.Vector3();
  let minimumBondClearance = Infinity,
    minimumSphereClearance = Infinity,
    closestPair = "";
  const residues = [];
  s.group.traverse((o) => {
    if (/-residue-\d$/.test(o.name)) residues.push(o);
  });
  assert.equal(residues.length, 50);
  for (const antibiotic of ["none", "betaLactam"]) {
    // Includes exact reaction instants, both sides of each event, and dense seeks.
    for (const p of [
      ...Array.from({ length: 201 }, (_, i) => i / 200),
      0.689999,
      0.69,
      0.690001,
      0.819999,
      0.82,
      0.820001,
    ]) {
      s.update(p, { antibiotic });
      s.group.updateMatrixWorld(true);
      for (const i of [0, 1]) {
        const donor = named(s, `reactant-${i}-residue-4`);
        const leaving = named(s, `reactant-${i}-residue-5`);
        const acceptor = named(s, `wall-0-${5 + i * 2}-residue-3`);
        const other = named(s, `wall-0-${5 + i * 2}-residue-4`);
        const crosslink = named(s, `new-peptide-crosslink-${i}`);
        const terminalBond = named(s, `reactant-${i}-stem-bond-5`);
        connects(
          named(s, `wall-0-${5 + i * 2}-stem-bond-4`),
          world(acceptor),
          world(other),
        );
        assert.equal(other.material.color.getHexString(), "c3a475");
        assert.equal(acceptor.material.color.getHexString(), "a18eac");
        minimumSphereClearance = Math.min(
          minimumSphereClearance,
          world(donor).distanceTo(world(other)) - donor.scale.x - other.scale.x,
        );
        if (terminalBond.visible)
          connects(terminalBond, world(donor), world(leaving));
        if (antibiotic === "betaLactam")
          assert(!crosslink.visible && terminalBond.visible);
        if (!crosslink.visible) continue;
        connects(crosslink, world(donor), world(acceptor));
        assert(!terminalBond.visible);
        [line.start, line.end] = ends(crosslink);
        for (const residue of residues) {
          if (residue === donor || residue === acceptor) continue;
          const center = world(residue);
          line.closestPointToPoint(center, true, closest);
          const radius =
            residue.geometry.parameters.radius *
            residue.getWorldScale(new THREE.Vector3()).x;
          const clearance =
            center.distanceTo(closest) - crosslink.scale.x - radius;
          if (clearance < minimumBondClearance) {
            minimumBondClearance = clearance;
            closestPair = `${crosslink.name} / ${residue.name}`;
          }
        }
      }
    }
  }
  assert(
    minimumBondClearance > 1e-4,
    `${closestPair}: bond-to-nonendpoint-sphere clearance ${minimumBondClearance}`,
  );
  assert(
    minimumSphereClearance > 0,
    `unrelated D-Ala residue-sphere clearance ${minimumSphereClearance}`,
  );
});
