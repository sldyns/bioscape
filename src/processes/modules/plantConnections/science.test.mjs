import assert from "node:assert/strict";
import * as THREE from "three";
import transport from "./plantTransportProcess.js";
import carbon from "./c4camProcess.js";

const v = new THREE.Vector3();
function endpoint(object, y) {
  return new THREE.Vector3(0, y, 0).applyMatrix4(object.matrixWorld);
}
function checkSUCBackbone(scene) {
  const helices = [],
    loops = [];
  scene.group.traverse((o) => {
    if (/^SUC2-[NC]-helix-\d+$/.test(o.name)) helices.push(o);
    if (/^SUC2-[NC]-loop-\d+$/.test(o.name)) loops.push(o);
  });
  assert.equal(helices.length, 12);
  assert.equal(loops.length, 10);
  const ends = [];
  for (const h of helices)
    for (const side of [-1, 1])
      ends.push({ h, side, p: endpoint(h, side * 0.565) });
  const degrees = new Array(24).fill(1); // Each rendered transmembrane helix is one chain edge.
  const closest = (p) => {
    let best = -1,
      distance = Infinity;
    ends.forEach((e, i) => {
      const d = e.p.distanceTo(p);
      if (d < distance) {
        best = i;
        distance = d;
      }
    });
    assert(
      distance < 1e-6,
      `peptide connector detached from helix endpoint: ${distance}`,
    );
    return best;
  };
  for (const loop of loops) {
    const n = Number(loop.name.split("-").at(-1)),
      expected = n % 2 === 1 ? 1 : -1,
      path = loop.geometry.parameters.path;
    const a = path.getPoint(0),
      b = path.getPoint(1);
    assert(
      Math.sign(a.y) === expected && Math.sign(b.y) === expected,
      "loops must alternate membrane sides",
    );
    degrees[closest(a.applyMatrix4(loop.matrixWorld))]++;
    degrees[closest(b.applyMatrix4(loop.matrixWorld))]++;
  }
  const linker = scene.group.getObjectByName(
    "SUC2-cytoplasmic-interdomain-linker",
  );
  assert(linker && linker.children.length === 24);
  for (let i = 1; i < linker.children.length; i++)
    assert(
      endpoint(linker.children[i - 1], 0.5).distanceTo(
        endpoint(linker.children[i], -0.5),
      ) < 1e-6,
      "rendered linker segment gap",
    );
  for (const p of [
    endpoint(linker.children[0], -0.5),
    endpoint(linker.children.at(-1), 0.5),
  ]) {
    const index = closest(p);
    assert.equal(
      ends[index].side,
      -1,
      "interdomain linkage must join cytoplasmic helix ends",
    );
    degrees[index]++;
  }
  assert.equal(degrees.filter((d) => d === 1).length, 2);
  assert(
    degrees.every((d) => d === 1 || d === 2),
    "branched peptide backbone",
  );
}
const scene = transport.create();
const pump = scene.group.getObjectByName("H-ATPase-domain-schematic");
assert(pump);
assert.equal(
  pump.children.filter((o) => o.isMesh).length,
  0,
  "pump domain schematic must not restore fabricated interhelix connector meshes",
);
assert.equal(
  pump.children.filter((o) => /^H-ATPase-M/.test(o.name)).length,
  10,
);
const actualH = [];
scene.group.children.forEach((o) => {
  if (
    o.isMesh &&
    o.geometry.type === "SphereGeometry" &&
    Math.abs(o.scale.x - 0.09) < 1e-9 &&
    o.material.color.getHexString() === "c59656"
  )
    actualH.push(o);
});
assert.equal(
  actualH.length,
  1,
  "one actual tracked proton for one rendered ATP hydrolysis, not nine exports",
);
const atp = scene.group.getObjectByName("single-cycle-ATP-to-ADP");
assert(atp);
assert.equal(
  atp.children.filter((o) => /^ATP-phosphate-/.test(o.name)).length,
  3,
);
for (const energy of ["available", "depleted"]) {
  for (let j = 0; j <= 200; j++) {
    scene.update(j / 200, { energy });
    scene.group.updateMatrixWorld(true);
    checkSUCBackbone(scene);
  }
  scene.update(0.4, { energy });
  assert.equal(atp.visible, energy === "available");
  assert(
    energy === "available"
      ? actualH[0].position.y > 0
      : actualH[0].position.y < 0,
  );
  const gamma = atp.getObjectByName("ATP-phosphate-3"),
    beta = atp.getObjectByName("ATP-phosphate-2");
  assert(
    energy === "available"
      ? gamma.position.distanceTo(beta.position) > 0.45
      : Math.abs(gamma.position.distanceTo(beta.position) - 0.15) < 1e-8,
  );
  scene.update(0.87, { energy });
  assert(
    actualH[0].position.y < 0,
    "tracked H+ returns to cytosol only by symport when energized",
  );
}
console.log(
  "PASS plantConnections-01/02: actual SUC2 peptide endpoints, alternating loops, chain degree, dynamic linker continuity; omitted false pump connectors; one ATP/one H+ geometry and both energy branches",
);

const c = carbon.create();
c.update(0, { strategy: "c4" });
c.group.updateMatrixWorld(true);
const pores = ["outbound", "return"].map((id) =>
  c.group.getObjectByName(`C4-symplastic-pore-${id}`),
);
assert(pores.every(Boolean));
const atoms = [];
c.group.traverse((o) => {
  if (o.userData.trackedCarbon !== undefined && o.parent.visible) atoms.push(o);
});
assert.equal(atoms.length, 4);
const crossings = [0, 0];
const rims = atoms[0].parent.children.filter(
  (o) => o.geometry?.type === "TorusGeometry",
);
assert.equal(rims.length, 8);
const bonds = [0, 1, 2].map((i) =>
  c.group.getObjectByName(`C4-carbon-bond-${i}`),
);
const tri = new THREE.Triangle(),
  nearest = new THREE.Vector3();
let minRimClearance = Infinity,
  triangleChecks = 0,
  bondChecks = 0,
  oldRimCollisions = 0;
function torusClearance(p, radius, tube, particleRadius) {
  return Math.hypot(Math.hypot(p.x, p.y) - radius, p.z) - tube - particleRadius;
}
function triangleClearance(rim, local, radius) {
  const pos = rim.geometry.attributes.position,
    idx = rim.geometry.index;
  let min = Infinity;
  for (let j = 0; j < idx.count; j += 3) {
    tri.a.fromBufferAttribute(pos, idx.getX(j));
    tri.b.fromBufferAttribute(pos, idx.getX(j + 1));
    tri.c.fromBufferAttribute(pos, idx.getX(j + 2));
    tri.closestPointToPoint(local, nearest);
    min = Math.min(min, nearest.distanceTo(local) - radius);
  }
  return min;
}
for (let j = 0; j <= 10000; j++) {
  const p = j / 10000;
  c.update(p, { strategy: "c4" });
  c.group.updateMatrixWorld(true);
  for (const atom of atoms) {
    const a = atom.getWorldPosition(new THREE.Vector3()),
      radius = atom.geometry.parameters.radius * atom.getWorldScale(v).x;
    for (const rim of rims) {
      const local = rim.worldToLocal(a.clone());
      const { radius: R, tube } = rim.geometry.parameters;
      const clearance = torusClearance(local, R, tube, radius);
      assert(
        clearance >= -1e-7,
        `p=${p} atom overlaps actual torus ${rim.name}`,
      );
      if (Math.abs(local.z) <= tube + radius) {
        const actual = triangleClearance(rim, local, radius);
        assert(actual >= -1e-7, `p=${p} atom overlaps actual torus triangles`);
        minRimClearance = Math.min(minRimClearance, actual);
        triangleChecks++;
        if (R < 0.23 && torusClearance(local, 0.19, tube, radius) < 0)
          oldRimCollisions++;
      }
    }
    for (let i = 0; i < pores.length; i++) {
      if ((i === 0 && p > 0.55) || (i === 1 && p < 0.6)) continue;
      const pore = pores[i],
        center = pore.getWorldPosition(new THREE.Vector3()),
        innerRadius = pore.geometry.parameters.radiusTop,
        halfLength = pore.geometry.parameters.height / 2;
      if (Math.abs(a.x - center.x) <= halfLength + radius) {
        const radial = Math.hypot(a.y - center.y, a.z - center.z);
        assert(
          radial + radius <= innerRadius + 1e-7,
          `p=${p} cargo hits pore membrane`,
        );
        const desmotubule = pore.parent.children.find(
          (o) =>
            o.isMesh &&
            o.geometry.type === "CylinderGeometry" &&
            Math.abs(o.position.y - center.y) < 1e-8 &&
            Math.abs(o.position.x) < 1e-8 &&
            Math.abs(o.scale.x - 0.025) < 1e-8,
        );
        assert(desmotubule, "rendered desmotubule geometry missing");
        assert(
          radial - radius >= desmotubule.scale.x - 1e-7,
          "cargo enters desmotubule",
        );
        crossings[i]++;
      }
    }
  }
  for (const bond of bonds.filter((o) => o.visible)) {
    const radius = bond.scale.x * bond.geometry.parameters.radiusTop;
    const ends = [-0.5, 0.5].map((y) => endpoint(bond, y));
    for (const rim of rims) {
      const local = ends.map((e) => rim.worldToLocal(e.clone()));
      const { radius: R, tube } = rim.geometry.parameters;
      if (
        Math.min(local[0].z, local[1].z) > tube + radius ||
        Math.max(local[0].z, local[1].z) < -tube - radius
      )
        continue;
      // Transported bonds align with the channel axis. Their capsule minimum
      // is at the point closest to the rim plane; no vertex-only proxy.
      assert(
        Math.hypot(local[0].x - local[1].x, local[0].y - local[1].y) < 1e-7,
      );
      const t = THREE.MathUtils.clamp(
        -local[0].z / (local[1].z - local[0].z),
        0,
        1,
      );
      const closest = local[0].clone().lerp(local[1], t);
      assert(
        torusClearance(closest, R, tube, radius) >= 0,
        "bond capsule overlaps rim",
      );
      const radial = Math.hypot(closest.x, closest.y);
      if (radial > R + tube + radius) continue;
      assert(
        radial + radius < 0.2 && radial - radius > 0.025,
        "bond capsule leaves cytoplasmic sleeve",
      );
      bondChecks++;
    }
  }
}
assert(crossings.every((n) => n > 100));
assert(triangleChecks > 100 && bondChecks > 100);
assert(
  oldRimCollisions > 100,
  "old R=.19 geometry must fail as a negative control",
);
// Independent mesh negative control: reproduce the review's p=.3638 witness.
c.update(0.3638, { strategy: "c4" });
c.group.updateMatrixWorld(true);
const witnessRim = rims.find(
  (r) =>
    r.position.x < 0 && r.position.y > 0 && r.geometry.parameters.radius < 0.23,
);
const witness = witnessRim.worldToLocal(
  atoms[1].getWorldPosition(new THREE.Vector3()),
);
const oldMesh = { geometry: new THREE.TorusGeometry(0.19, 0.012, 8, 40) };
assert(
  triangleClearance(oldMesh, witness, 0.085) < -0.019,
  "original indexed torus triangles must intersect the witness sphere",
);
oldMesh.geometry.dispose();
for (const strategy of ["c4", "cam"]) {
  c.update(0, { strategy });
  const groups = c.group.children.filter((o) => o.isGroup);
  assert.equal(groups.filter((o) => o.visible).length, 1);
  c.update(1, { strategy });
}
console.log(
  "PASS plantConnections-03: 10001-frame actual sphere-radius sweep fits outbound/return pore sleeve, avoids desmotubule; both strategy branches retained",
  { crossings, triangleChecks, bondChecks, minRimClearance, oldRimCollisions },
);
