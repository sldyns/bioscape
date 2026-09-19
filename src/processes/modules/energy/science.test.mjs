import assert from "node:assert/strict";
import { Matrix4, Vector3, Box3 } from "three";
import respiration from "./respirationProcess.js";
import glycolysis from "./glycolysisProcess.js";
import bacterialEnergetics from "./bacterialEnergeticsProcess.js";
import bacterialPhotosynthesis from "./bacterialPhotosynthesisProcess.js";

const visible = (o) => !o || (o.visible && visible(o.parent));
const near = (a, b, message) => assert.ok(a.distanceTo(b) < 1e-5, message);
const point = (o) => o.getWorldPosition(new Vector3());
function named(model, name) {
  const o = model.group.getObjectByName(name);
  assert.ok(o, `missing geometry: ${name}`);
  return o;
}
function leafletPoints(model, side, ellipse) {
  model.group.updateMatrixWorld(true);
  const result = [];
  model.group.traverse((o) => {
    if (!visible(o) || !o.isInstancedMesh || o.name !== `${side}-leaflet-heads`)
      return;
    assert.equal(o.geometry.type, "SphereGeometry");
    const m = new Matrix4(),
      scale = new Vector3();
    for (let i = 0; i < o.count; i++) {
      o.getMatrixAt(i, m);
      const p = new Vector3()
        .setFromMatrixPosition(m)
        .applyMatrix4(o.matrixWorld);
      if (
        ((p.x - ellipse[0]) / ellipse[2]) ** 2 +
          ((p.z - ellipse[1]) / ellipse[3]) ** 2 >=
        1
      )
        continue;
      scale.setFromMatrixScale(m);
      assert.ok(
        scale.x > 0.06 && scale.y > 0.05 && scale.z > 0.06,
        "real lipid head geometry",
      );
      result.push(p);
    }
  });
  return result;
}
function expectedLattice(length, depth, ellipse, curve, side) {
  const result = [];
  for (let ix = 0; ix <= Math.round(length / 0.16); ix++)
    for (let iz = 0; iz <= Math.round(depth / 0.16); iz++) {
      const x = -length / 2 + ix * 0.16 + (iz % 2) * 0.08;
      const z = -depth / 2 + iz * 0.16;
      if (
        ((x - ellipse[0]) / ellipse[2]) ** 2 +
          ((z - ellipse[1]) / ellipse[3]) ** 2 <
        1
      )
        result.push(new Vector3(x, curve(x) + side * 0.205, z));
    }
  return result;
}
function continuousLeaflets(model, length, depth, ellipse, curve = () => 0) {
  for (const [side, sign] of [
    ["upper", 1],
    ["lower", -1],
  ]) {
    const expected = expectedLattice(length, depth, ellipse, curve, sign);
    const actual = leafletPoints(model, side, ellipse);
    assert.ok(expected.length > 20, "test spans the entire missing footprint");
    assert.equal(
      actual.length,
      expected.length,
      "no missing or duplicated lipids at peripheral enzyme",
    );
    for (const p of expected)
      assert.ok(
        actual.some((a) => a.distanceTo(p) < 1e-5),
        "every original cutout lattice site is filled",
      );
  }
}

// energy-01 / energy-04: actual head instance positions on both leaflets, at
// every stage and after switching back from the transmembrane control branch.
const yeast = respiration.create({ rootId: "yeast" });
const ecoli = bacterialEnergetics.create({ rootId: "bacterium" });
const mitochondrialHole = [-3.25, 0, 0.64, 0.54];
const bacterialHole = [-2.35, 0, 0.8, 0.5];
for (const p of [0, 0.16, 0.33, 0.5, 0.67, 0.73, 0.86, 1]) {
  for (const coupling of ["coupled", "leak"]) {
    yeast.update(p, { coupling });
    continuousLeaflets(yeast, 9, 1.65, mitochondrialHole);
  }
  ecoli.update(p, { route: "ndh1-bo" });
  assert.equal(leafletPoints(ecoli, "upper", bacterialHole).length, 0);
  assert.ok(visible(named(ecoli, "transmembrane-NDH-I")));
  ecoli.update(p, { route: "ndh2-bd" });
  continuousLeaflets(ecoli, 8.5, 1.55, bacterialHole, (x) => -0.075 * x * x);
  assert.ok(!visible(named(ecoli, "transmembrane-NDH-I")));
  assert.ok(visible(named(ecoli, "cytoplasmic-peripheral-NDH-II")));
}
const animal = respiration.create({ rootId: "cell" });
assert.equal(leafletPoints(animal, "upper", mitochondrialHole).length, 0);
assert.ok(visible(named(animal, "transmembrane-complex-I")));
console.log(
  "energy-01/04: continuous peripheral-enzyme bilayer footprints; embedded branches retained PASS",
);

// energy-02 / energy-05: count actual twin-helix meshes, inspect their angular
// distribution, and distinguish a truly unsegmented contour from hidden c10.
function checkRing(model, count, headSide) {
  const rotor = named(model, "ATP-synthase-rotor");
  const subunits = rotor.children.filter(
    (o) => o.name === "c-ring-subunit" && visible(o),
  );
  assert.equal(subunits.length, count ?? 0);
  if (count !== null) {
    const angles = subunits
      .map((o) => {
        assert.equal(
          o.children.filter(
            (c) => c.isMesh && c.geometry.type === "TubeGeometry",
          ).length,
          3,
        );
        assert.ok(o.children.every((c) => c.visible));
        assert.ok(
          Math.abs(Math.hypot(o.position.x, o.position.z) - 0.28) < 1e-6,
        );
        o.updateWorldMatrix(true, true);
        const loop = o.children[2];
        const vertices = loop.geometry.attributes.position;
        const ringY = point(rotor).y;
        for (let i = 0; i < vertices.count; i++) {
          const p = new Vector3()
            .fromBufferAttribute(vertices, i)
            .applyMatrix4(loop.matrixWorld);
          assert.ok(
            headSide * (p.y - ringY) > 0.25,
            "polar c-hairpin loop must face F1",
          );
        }
        assert.ok(
          Math.abs(o.matrix.determinant() - 1) < 1e-6,
          "rigid reorientation preserves helix handedness",
        );
        const box = new Box3().setFromObject(o);
        assert.ok(box.max.y - box.min.y > 0.5, "hairpin spans membrane depth");
        return Math.atan2(o.position.z, o.position.x);
      })
      .sort((a, b) => a - b);
    for (let i = 0; i < angles.length; i++) {
      const delta =
        (angles[(i + 1) % count] - angles[i] + Math.PI * 2) % (Math.PI * 2);
      assert.ok(Math.abs(delta - (Math.PI * 2) / count) < 1e-6);
    }
    assert.ok(!rotor.getObjectByName("unresolved-c-ring-contour"));
  } else {
    const contour = named(model, "unresolved-c-ring-contour");
    assert.ok(visible(contour));
    assert.equal(contour.geometry.type, "LatheGeometry");
    contour.geometry.computeBoundingBox();
    const size = contour.geometry.boundingBox.getSize(new Vector3());
    assert.ok(size.x > 0.6 && size.y > 0.59 && size.z > 0.6);
  }
  model.group.updateMatrixWorld(true);
  const fixed = named(model, "stationary-a-subunit-and-peripheral-stator");
  const headLobes = fixed.children.filter(
    (o) => o.name === "schematic-protein-domain-cleft",
  );
  assert.equal(headLobes.length, 6, "alpha3 beta3 catalytic head retained");
  assert.ok(
    headLobes.every((o) => headSide * (point(o).y - point(rotor).y) > 0.8),
  );
}
for (const [rootId, count] of [
  ["cell", 8],
  ["yeast", 10],
  ["plant", null],
  ["paramecium", null],
]) {
  const m = respiration.create({ rootId });
  for (const coupling of ["coupled", "leak"])
    for (const p of [0, 0.55, 0.67, 0.86, 1]) {
      m.update(p, { coupling });
      checkRing(m, count, -1);
    }
}
checkRing(ecoli, 10, -1);
const cyano = bacterialPhotosynthesis.create({ rootId: "bacterium" });
for (const light of ["light", "dark"])
  for (const p of [0, 0.42, 0.59, 0.74, 0.9, 1]) {
    cyano.update(p, { light });
    checkRing(cyano, 14, 1);
  }
console.log(
  "energy-02/05: actual c8/c10/c14 hairpin counts; no invented plant/protist count; F1 orientation PASS",
);

// energy-03: transformed cylinder endpoints must meet the correct carbon
// and phosphate positions. This catches the original terminal-C3 PEP bond.
const gly = glycolysis.create();
function assertBond(index, carbonName, phosphateName) {
  gly.group.updateMatrixWorld(true);
  const bond = named(gly, `substrate-phosphate-bond-${index}`);
  assert.ok(visible(bond));
  const a = new Vector3(0, -0.5, 0).applyMatrix4(bond.matrixWorld);
  const b = new Vector3(0, 0.5, 0).applyMatrix4(bond.matrixWorld);
  near(a, point(named(gly, carbonName)), "bond originates at correct carbon");
  near(
    b,
    point(named(gly, phosphateName)),
    "bond ends at its one phosphate group",
  );
}
for (const p of [0.55, 0.57, 0.58]) {
  gly.update(p);
  for (let i = 0; i < 2; i++) {
    assertBond(2 * i, `carbon-${i ? 5 : 0}`, `inherited-phosphate-${i}`);
    assertBond(2 * i + 1, `carbon-${i ? 3 : 2}`, `oxidation-phosphate-${i}`);
  }
}
for (const p of [0.7, 0.715]) {
  gly.update(p);
  for (let i = 0; i < 2; i++)
    assertBond(2 * i, `carbon-${i ? 5 : 0}`, `inherited-phosphate-${i}`);
}
for (const p of [0.72, 0.735, 0.749]) {
  gly.update(p);
  for (let i = 0; i < 2; i++) {
    assert.ok(
      !visible(named(gly, `substrate-phosphate-bond-${2 * i}`)),
      "no sliding covalent bond during omitted mutase intermediate",
    );
    assert.ok(
      visible(named(gly, `inherited-phosphate-${i}`)),
      "one phosphate remains visible through relocation",
    );
  }
}
for (const p of [0.75, 0.76, 0.77, 0.78]) {
  gly.update(p);
  for (let i = 0; i < 2; i++)
    assertBond(2 * i, `carbon-${i ? 4 : 1}`, `inherited-phosphate-${i}`);
}
for (const p of [0.79, 0.84, 0.9, 0.91, 1]) {
  gly.update(p);
  for (let i = 0; i < 2; i++)
    assert.ok(!visible(named(gly, `substrate-phosphate-bond-${2 * i}`)));
}
gly.update(1);
gly.group.updateMatrixWorld(true);
for (let i = 0; i < 6; i++) assert.ok(visible(named(gly, `carbon-${i}`)));
for (let i = 0; i < 2; i++) {
  const side = i ? 1 : -1;
  near(
    point(named(gly, `inherited-phosphate-${i}`)),
    new Vector3(side * 2.59, -1.6, 0.12),
    "second ATP receives one phosphate",
  );
  near(
    point(named(gly, `oxidation-phosphate-${i}`)),
    new Vector3(side * 2.59, -0.2, 0.15),
    "first ATP receives one phosphate",
  );
  assert.ok(
    !visible(named(gly, `investment-phosphate-${i}`)),
    "invested phosphate is not duplicated",
  );
}
console.log(
  "energy-03: actual C1/C3/C2 bond endpoints, detached transfer intervals, six carbons and four output phosphates PASS",
);

// Existing local regression covers finite vertex data, finite world bounds,
// deterministic backward/forward seeks, stable resources, every root/control
// combination and browser-target compilation, without workspace-wide mutation.
await import("./refinement-smoke.mjs");
