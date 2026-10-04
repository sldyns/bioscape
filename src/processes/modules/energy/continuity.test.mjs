import assert from "node:assert/strict";
import { Box3, Matrix4, Triangle, Vector3 } from "three";
import respiration from "./respirationProcess.js";
import bacterialEnergetics from "./bacterialEnergeticsProcess.js";
import bacterialPhotosynthesis from "./bacterialPhotosynthesisProcess.js";

const visible = (o) => !o || (o.visible && visible(o.parent));
const named = (m, name) => {
  const o = m.group.getObjectByName(name);
  assert.ok(o, name);
  return o;
};
const point = (o) => o.getWorldPosition(new Vector3());
const curve = (x) => -0.075 * x * x;
const measurements = [];

// Exact world-space distance to the actual instanced lipid-head triangles.
// A point/vertex proxy would miss both the old penetration and finite glyph size.
function lipidDistance(m, target) {
  const instance = new Matrix4(),
    world = new Matrix4(),
    center = new Vector3();
  const a = new Vector3(),
    b = new Vector3(),
    c = new Vector3();
  const triangle = new Triangle(a, b, c),
    closest = new Vector3();
  let best = Infinity;
  m.group.traverse((o) => {
    if (!visible(o) || !o.isInstancedMesh || !o.name.endsWith("leaflet-heads"))
      return;
    const vertices = o.geometry.attributes.position,
      index = o.geometry.index;
    for (let i = 0; i < o.count; i++) {
      o.getMatrixAt(i, instance);
      world.multiplyMatrices(o.matrixWorld, instance);
      center.setFromMatrixPosition(world);
      // Lipid heads have <0.065 radius. This lower bound safely prunes distant
      // instances after a nearer triangle distance has been established.
      if (center.distanceTo(target) - 0.065 > best) continue;
      for (let j = 0; j < index.count; j += 3) {
        a.fromBufferAttribute(vertices, index.getX(j)).applyMatrix4(world);
        b.fromBufferAttribute(vertices, index.getX(j + 1)).applyMatrix4(world);
        c.fromBufferAttribute(vertices, index.getX(j + 2)).applyMatrix4(world);
        triangle.closestPointToPoint(target, closest);
        best = Math.min(best, closest.distanceTo(target));
      }
    }
  });
  assert.ok(Number.isFinite(best));
  return best;
}
function checkPort(m, particle, domainName, membraneY, side, nominalRadius) {
  m.group.updateMatrixWorld(true);
  assert.ok(visible(particle));
  const p = point(particle),
    radius = particle.scale.x;
  assert.ok(
    Math.abs(radius - nominalRadius) < 1e-6,
    "glyph is fully sized while crossing; no hidden transport",
  );
  assert.ok(Math.abs(p.y - (membraneY + side * 0.205)) < 1e-6);
  const domain = named(m, domainName),
    origin = point(domain);
  // The same coordinates are grounded in the actual drawn protein domain,
  // not merely an arbitrary hole in the membrane or userData channel metadata.
  assert.ok(
    Math.hypot(p.x - origin.x, p.z - origin.z) < 1e-6,
    "crossing follows the protein domain axis",
  );
  const domainBox = new Box3().setFromObject(domain);
  assert.ok(
    domainBox.containsPoint(p),
    "both leaflet crossings lie inside the membrane protein",
  );
  const clearance = lipidDistance(m, p) - radius;
  assert.ok(
    clearance > 0.05,
    `protein port has lipid clearance (${clearance})`,
  );
  measurements.push({ domainName, side, clearance });
}

// 20261004-energy-01: CI (except yeast), III and IV cross inside their domains.
for (const rootId of ["cell", "plant", "yeast", "paramecium"]) {
  const m = respiration.create({ rootId });
  const domains =
    rootId === "yeast"
      ? [
          "complex-III-proton-transfer-domain",
          "complex-IV-proton-transfer-domain",
        ]
      : [
          "complex-I-proton-transfer-domain",
          "complex-III-proton-transfer-domain",
          "complex-IV-proton-transfer-domain",
        ];
  for (const coupling of ["coupled", "leak"]) {
    for (const [i, domain] of domains.entries())
      for (const side of [-1, 1]) {
        const t = (side * 0.205 + 0.8) / 1.75;
        m.update((1 + t) / 3, { coupling });
        checkPort(
          m,
          named(m, `pumped-proton-${i * 3}`),
          domain,
          0,
          side,
          0.085,
        );
      }
  }
}

// 20261004-energy-03: active pumps remain absent in NDH-II/bd-I; chemical
// substrate protons still enter the oxidase through its membrane footprint.
const ecoli = bacterialEnergetics.create();
for (const [i, x, domain] of [
  [0, -2.07, "NDH-I-proton-transfer-domain"],
  [3, 0.52, "bo3-proton-transfer-domain"],
]) {
  for (const side of [-1, 1]) {
    const t = (side * 0.205 + 0.65) / 1.45;
    ecoli.update((1 + t) / 3, { route: "ndh1-bo" });
    checkPort(
      ecoli,
      named(ecoli, `pumped-proton-${i}`),
      domain,
      curve(x),
      side,
      0.087,
    );
  }
}
for (const route of ["ndh1-bo", "ndh2-bd"]) {
  const x = 0.52,
    membraneY = curve(x),
    t = (membraneY - 0.205 + 1.25) / 1.32;
  ecoli.update((1 + t) / 3, { route });
  ecoli.group.updateMatrixWorld(true);
  const chemical = named(ecoli, "chemical-proton-0");
  assert.ok(visible(chemical));
  assert.ok(Math.abs(point(chemical).y - membraneY + 0.205) < 1e-6);
  assert.ok(lipidDistance(ecoli, point(chemical)) - chemical.scale.x > 0.05);
  assert.ok(
    Math.hypot((chemical.position.x - 0.65) / 0.65, chemical.position.z / 0.5) <
      0.5,
  );
  for (let i = 0; i <= 80; i++) {
    ecoli.update(0.44 + (i * 0.56) / 80, { route });
    for (let j = 0; j < 3; j++) {
      assert.ok(
        named(ecoli, `chemical-proton-${j}`).position.y < membraneY + 0.205,
        "chemical uptake does not emerge as a periplasmic pump",
      );
    }
    if (route === "ndh2-bd")
      for (let j = 0; j < 6; j++)
        assert.ok(!visible(named(ecoli, `pumped-proton-${j}`)));
  }
}

// 20261004-energy-05: b6f transfer crosses its actual protein domain, with
// cytoplasm above and lumen below. Darkness must not acquire proton flux.
const cyano = bacterialPhotosynthesis.create();
for (const side of [-1, 1]) {
  const t = (0.95 - (0.4 + side * 0.205)) / 1.54;
  cyano.update((1 + t) / 3, { light: "light" });
  checkPort(
    cyano,
    named(cyano, "b6f-proton-0"),
    "b6f-proton-transfer-domain",
    0.4,
    side,
    0.08,
  );
}
for (const p of [0, 0.24, 0.5, 0.59, 0.75, 1]) {
  cyano.update(p, { light: "dark" });
  for (let i = 0; i < 4; i++) {
    assert.ok(!visible(named(cyano, `b6f-proton-${i}`)));
    assert.ok(!visible(named(cyano, `Fo-return-proton-${i}`)));
  }
  assert.equal(named(cyano, "ATP-synthase-rotor").rotation.y, 0);
}

// Repaired Fo return tracks remain within the existing motor opening. This also
// prevents a corrected pump annotation from leaving a misleading return arrow.
for (const [definition, x, membraneY, radius] of [
  [respiration, 3.49, 0, 0.085],
  [bacterialEnergetics, 3.44, curve(3.44), 0.087],
  [bacterialPhotosynthesis, 3.76, 0.4, 0.08],
]) {
  const m = definition.create();
  m.update(0.8);
  m.group.updateMatrixWorld(true);
  const p = named(m, "Fo-return-proton-0");
  assert.ok(visible(p));
  assert.ok(Math.abs(p.position.x - x) < 1e-6 && Math.abs(p.position.z) < 1e-6);
  for (const side of [-1, 1])
    assert.ok(
      lipidDistance(m, new Vector3(x, membraneY + side * 0.205, 0)) >
        radius + 0.05,
    );
}

// 20261004-energy-02/04/06: unique, full-sized carriers traverse a continuous
// return leg. Dense samples check compartment/range; eps pairs catch wrap cuts.
const carrierCases = [
  [respiration, "ubiquinone-carrier", 3, [-1.6, -0.45], () => 0],
  [respiration, "cytochrome-c-carrier", 3, [0.3, 1.33], () => 0.85],
  [bacterialEnergetics, "ubiquinone-carrier", 2, [-1.6, 0.25], curve],
  [
    bacterialPhotosynthesis,
    "plastoquinone-carrier",
    2,
    [-2.3, -0.95],
    () => 0.4,
  ],
  [
    bacterialPhotosynthesis,
    "lumenal-PC-c6-carrier",
    2,
    [-0.45, 0.9],
    () => -0.2,
  ],
];
let maxWrapJump = 0;
for (const [definition, name, cycles, range, y] of carrierCases) {
  const roots =
    definition === respiration
      ? ["cell", "plant", "yeast", "paramecium"]
      : ["bacterium"];
  const control = definition.controls[0];
  for (const rootId of roots)
    for (const option of control.options) {
      const m = definition.create({ rootId }),
        params = { [control.id]: option.value };
      const carrier = named(m, name),
        originalScale = carrier.scale.clone();
      let outward = false,
        inward = false,
        previous;
      for (let i = 0; i <= 180; i++) {
        m.update(i / 180, params);
        assert.ok(visible(carrier));
        assert.ok(
          carrier.scale.equals(originalScale),
          "unique carrier is never faded or shrunk",
        );
        assert.ok(
          carrier.position.x >= range[0] - 1e-9 &&
            carrier.position.x <= range[1] + 1e-9,
        );
        assert.ok(Math.abs(carrier.position.y - y(carrier.position.x)) < 1e-9);
        if (previous !== undefined) {
          outward ||= carrier.position.x > previous + 1e-4;
          inward ||= carrier.position.x < previous - 1e-4;
        }
        previous = carrier.position.x;
      }
      assert.ok(
        outward && inward,
        "carrier takes both outward and return legs",
      );
      for (let n = 1; n <= cycles; n++)
        for (const epsilon of [1e-4, 1e-6]) {
          const boundary = n / cycles;
          m.update(boundary - epsilon, params);
          const before = carrier.position.clone();
          m.update(Math.min(1, boundary + epsilon), params);
          const jump = before.distanceTo(carrier.position);
          assert.ok(jump < epsilon * 0.1, `${name}: no endpoint teleport`);
          maxWrapJump = Math.max(maxWrapJump, jump);
        }
      m.update(0.713, params);
      const saved = carrier.position.clone();
      for (const p of [1, 0.12, 0.91, 0.33, 0.5]) m.update(p, params);
      m.update(0.713, params);
      assert.ok(carrier.position.equals(saved));
    }
}

// Negative controls restore the original offending positions in instantiated
// geometry. The same actual-triangle test rejects them without editing sources.
const negative = respiration.create();
negative.update((1 + (0.205 + 0.8) / 1.75) / 3);
negative.group.updateMatrixWorld(true);
const oldCrossing = new Vector3(-2.93, 0.205, 0.6);
assert.ok(
  lipidDistance(negative, oldCrossing) < 0.085,
  "original CI path must be rejected",
);
assert.ok(
  lipidDistance(ecoli, new Vector3(0.5, curve(0.5) - 0.205, 0.57)) < 0.087,
  "original chemical uptake must be rejected",
);
cyano.update(0.5);
cyano.group.updateMatrixWorld(true);
assert.ok(
  lipidDistance(cyano, new Vector3(-0.82, 0.605, 0.55)) < 0.08,
  "original b6f path must be rejected",
);
console.log(
  JSON.stringify({
    test: "20261004-energy-01..06",
    proteinPortChecks: measurements.length,
    minimumLipidClearance: Math.min(...measurements.map((m) => m.clearance)),
    maximumCarrierWrapJump: maxWrapJump,
    restoredDefectControls: "PASS",
    result: "PASS",
  }),
);
