import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { Vector3 } from "three";
import actionPotential from "./actionPotentialProcess.js";
import synapse from "./synapseProcess.js";
import muscle from "./muscleProcess.js";
import ciliaryMotion from "./ciliaryMotionProcess.js";

const objects = (s, predicate) => {
  const a = [];
  s.group.traverse((o) => {
    if (predicate(o)) a.push(o);
  });
  return a;
};
const named = (s, name) => objects(s, (o) => o.name === name);
const world = (o) => o.getWorldPosition(new Vector3());
function inventory(s) {
  return objects(s, () => true).map((o) => [
    o.uuid,
    o.geometry?.uuid,
    ...(Array.isArray(o.material) ? o.material : [o.material])
      .filter(Boolean)
      .map((m) => m.uuid),
  ]);
}
function fingerprint(s) {
  s.group.updateMatrixWorld(true);
  const h = createHash("sha256");
  const arrays = new Set();
  s.group.traverse((o) => {
    h.update(
      JSON.stringify([
        o.visible,
        o.matrix.elements,
        o.material?.color?.toArray(),
      ]),
    );
    for (const a of [
      ...Object.values(o.geometry?.attributes || {}),
      o.instanceMatrix,
    ].filter(Boolean)) {
      if (!arrays.has(a.array)) {
        arrays.add(a.array);
        h.update(
          Buffer.from(a.array.buffer, a.array.byteOffset, a.array.byteLength),
        );
      }
    }
  });
  return h.digest("hex");
}
function finite(s) {
  const seen = new Set();
  s.group.traverse((o) => {
    for (const a of [
      ...Object.values(o.geometry?.attributes || {}),
      o.instanceMatrix,
    ].filter(Boolean)) {
      if (seen.has(a.array)) continue;
      seen.add(a.array);
      for (const x of a.array)
        assert.ok(Number.isFinite(x), `nonfinite ${o.name}`);
    }
    for (const x of [
      ...o.position.toArray(),
      ...o.quaternion.toArray(),
      ...o.scale.toArray(),
    ])
      assert.ok(Number.isFinite(x));
  });
}

// Audit neurons-01: inspect the actual meshes, not receptor metadata.
const syn = synapse.create();
const receptors = named(syn, "AMPA tetramer: 3 TM plus M2 per subunit");
assert.equal(receptors.length, 2);
for (const receptor of receptors) {
  const domains = receptor.children.filter((o) =>
    o.name.startsWith("AMPA subunit"),
  );
  assert.equal(domains.length, 4);
  for (const d of domains) {
    const spans = d.children.filter((o) => /membrane span$/.test(o.name));
    assert.deepEqual(spans.map((o) => o.name).sort(), [
      "M1 membrane span",
      "M3 membrane span",
      "M4 membrane span",
    ]);
    for (const span of spans) {
      span.geometry.computeBoundingBox();
      const b = span.geometry.boundingBox;
      assert.ok(
        b.min.y < -0.2 && b.max.y > 0.2,
        "each M1/M3/M4 spans both membrane faces",
      );
    }
    const m2 = d.getObjectByName("M2 cytoplasmic re-entrant pore loop");
    assert.ok(m2?.isMesh);
    m2.geometry.computeBoundingBox();
    assert.ok(
      m2.geometry.boundingBox.min.y < -0.24 &&
        m2.geometry.boundingBox.max.y < 0.02,
      "M2 enters from cytoplasmic side without crossing extracellular face",
    );
    // Actual first/last tube rings both return to the cytoplasmic compartment.
    const pos = m2.geometry.attributes.position,
      r = m2.geometry.parameters.radialSegments + 1;
    for (const start of [0, pos.count - r]) {
      let y = 0;
      for (let i = 0; i < r - 1; i++) y += pos.getY(start + i);
      assert.ok(y / (r - 1) < -0.24);
    }
    const lobes = d.children.filter(
      (o) => o.name === "AMPA ligand-binding lobe",
    );
    assert.equal(lobes.length, 2);
    for (const lobe of lobes)
      assert.ok(
        lobe.position.y - lobe.scale.y > 0.21,
        "binding lobes extracellular",
      );
  }
}

// Audit neurons-02: every actual open gate needs two extracellular ligands
// touching its modeled clefts, including the originally failing p = .56 frame.
let openFrames = 0;
for (const calcium of ["available", "blocked"])
  for (let step = 0; step <= 200; step++) {
    const p = step / 200;
    syn.update(p, { calcium });
    syn.group.updateMatrixWorld(true);
    for (let ri = 0; ri < 2; ri++) {
      const receptor = receptors[ri],
        gate = receptor.getObjectByName("AMPA cation gate");
      const ligands = [0, 1].map((j) =>
        syn.group.getObjectByName(`glutamate ${ri * 2 + j}`),
      );
      const clefts = [0, 2].map((j) =>
        receptor
          .getObjectByName(`AMPA subunit ${j}`)
          .getObjectByName("AMPA extracellular ligand cleft"),
      );
      if (!gate.visible) {
        openFrames++;
        assert.equal(calcium, "available");
        for (let j = 0; j < 2; j++) {
          assert.ok(ligands[j].visible);
          assert.ok(
            world(ligands[j]).distanceTo(world(clefts[j])) < 0.035,
            "gate opened before ligand contact",
          );
        }
      }
      const ions = named(syn, "postsynaptic sodium ion").slice(
        ri * 3,
        ri * 3 + 3,
      );
      if (ions.some((i) => i.visible))
        assert.equal(gate.visible, false, "ion flux without open gate");
    }
  }
assert.ok(openFrames > 20);
syn.update(0.56);
assert.ok(
  receptors.every((r) => !r.getObjectByName("AMPA cation gate").visible),
);

// Audit neurons-03: nucleotide marker geometry and attached-head geometry.
const mus = muscle.create(),
  markerGroups = named(mus, "myosin nucleotide-state markers");
assert.ok(markerGroups.length >= 8);
const expected = [
  [0.35, false, true, true, true],
  [0.5, false, true, false, true],
  [0.6, false, false, false, true],
  [0.68, true, false, false, false],
  [0.76, false, true, true, false],
];
for (const [p, atp, adp, pi, bound] of expected) {
  mus.update(p);
  for (const g of markerGroups) {
    assert.equal(g.getObjectByName("ATP bound marker").visible, atp);
    assert.equal(g.getObjectByName("ADP bound marker").visible, adp);
    assert.equal(g.getObjectByName("Pi bound marker").visible, pi);
    assert.equal(g.parent.scale.y, bound ? 1.08 : 0.77);
  }
}
mus.update(0, { calcium: "low" });
const lowSnapshot = fingerprint(mus);
for (const p of [0, 0.15, 0.31, 0.43, 0.5, 0.6, 0.65, 0.72, 0.8, 0.94, 1]) {
  mus.update(p, { calcium: "low" });
  assert.equal(
    fingerprint(mus),
    lowSnapshot,
    "low Ca cannot discharge/reload the nucleotide markers",
  );
}

// Audit neurons-04: recover material centerlines from paired actual outer/inner
// tube meshes. Radius-weighted cancellation also handles incomplete B walls.
const cil = ciliaryMotion.create();
function centers(i) {
  const outer = cil.group.getObjectByName(`axonemal tube ${i}`),
    inner = cil.group.getObjectByName(`axonemal tube ${i + 1}`);
  assert.ok(outer && inner);
  const ro = outer.geometry.parameters.radiusTop,
    ri = inner.geometry.parameters.radiusTop,
    n = outer.geometry.parameters.radialSegments,
    rows = outer.geometry.parameters.heightSegments + 1;
  return Array.from({ length: rows }, (_, j) => {
    const a = new Vector3(),
      b = new Vector3();
    for (let k = 0; k < n; k++) {
      a.add(
        new Vector3().fromBufferAttribute(
          outer.geometry.attributes.position,
          j * (n + 1) + k,
        ),
      );
      b.add(
        new Vector3().fromBufferAttribute(
          inner.geometry.attributes.position,
          j * (n + 1) + k,
        ),
      );
    }
    return b
      .multiplyScalar(ro / n)
      .sub(a.multiplyScalar(ri / n))
      .multiplyScalar(1 / (ro - ri));
  });
}
cil.update(0);
const bases = Array.from({ length: 20 }, (_, i) => centers(i * 2).at(-1));
let largestMaterialSlide = 0,
  maxLengthError = 0;
for (const atp of ["available", "absent"])
  for (let step = 0; step <= 100; step++) {
    cil.update(step / 100, { atp });
    const tracks = [];
    for (let i = 0; i < 40; i += 2) {
      const c = centers(i);
      tracks.push(c);
      for (let row = 1; row < c.length; row++)
        assert.ok(
          Math.abs(c[row].distanceTo(c[row - 1]) - 0.1) < 0.0003,
          "material repeat spacing changed",
        );
      const length = c
        .slice(1)
        .reduce((sum, v, j) => sum + v.distanceTo(c[j]), 0);
      maxLengthError = Math.max(maxLengthError, Math.abs(length - 4.4));
      assert.ok(Math.abs(length - 4.4) < 0.0015, `tube ${i} length ${length}`);
      assert.ok(
        c.at(-1).distanceTo(bases[i / 2]) < 1e-6,
        "basal material point moved",
      );
    }
    // Equal material rows acquire longitudinal register differences: doublet 0
    // and doublet 4 tips no longer share the central-pair normal section.
    const ca = tracks[18],
      cb = tracks[19],
      tip = ca[0].clone().add(cb[0]).multiplyScalar(0.5),
      near = ca[1].clone().add(cb[1]).multiplyScalar(0.5),
      tangent = tip.sub(near).normalize();
    const slide = tracks[0][0].clone().sub(tracks[8][0]).dot(tangent);
    if (atp === "available")
      largestMaterialSlide = Math.max(largestMaterialSlide, Math.abs(slide));
    else assert.ok(Math.abs(slide) < 1e-6);
  }
assert.ok(
  largestMaterialSlide > 0.1,
  "no axial material sliding during bending",
);
cil.update(0, { atp: "absent" });
const arrested = fingerprint(cil);
cil.update(0.73, { atp: "absent" });
assert.equal(fingerprint(cil), arrested);

// All four models, both conditions, dense intermediate frames: finite buffers,
// resource identity stable, and backward/random seeks reproduce rendered state.
for (const model of [actionPotential, synapse, muscle, ciliaryMotion]) {
  const scene = model.create(),
    baseline = inventory(scene),
    control = model.controls[0];
  for (const option of control.options) {
    const params = { [control.id]: option.value };
    for (let i = 0; i <= 20; i++) {
      scene.update(i / 20, params);
      finite(scene);
      assert.deepEqual(inventory(scene), baseline);
    }
    for (const p of [0.235, 0.56, 0.735, 0.91]) {
      scene.update(p, params);
      const f = fingerprint(scene);
      scene.update(0.98, params);
      scene.update(0.03, params);
      scene.update(p, params);
      assert.equal(fingerprint(scene), f, `${model.id} seek nondeterminism`);
    }
  }
}
console.log(
  `neurons science: 4 issues passed; 402 synapse and 202 axoneme samples; max tube length error ${maxLengthError.toFixed(6)} / 4.4; axial register shift ${largestMaterialSlide.toFixed(4)}; all 4 model branch/resource checks passed`,
);
