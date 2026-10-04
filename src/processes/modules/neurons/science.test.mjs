import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { Vector3, Matrix4, Triangle, Raycaster } from "three";
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

// 20261004-neurons-01: real triangle contact, not a centerline or metadata claim.
// The original target missed the B wall by .02577 (stalk radius .011) and lay
// next to the neighboring A wall. Exercise every azimuth and every motor row.
const triA = new Vector3(),
  triB = new Vector3(),
  triC = new Vector3(),
  triangle = new Triangle(triA, triB, triC),
  closest = new Vector3(),
  instance = new Matrix4(),
  transform = new Matrix4();
function distanceToTriangles(mesh, point) {
  const position = mesh.geometry.attributes.position,
    index = mesh.geometry.index;
  let distance = Infinity;
  for (let k = 0; k < (mesh.isInstancedMesh ? mesh.count : 1); k++) {
    if (mesh.isInstancedMesh) {
      mesh.getMatrixAt(k, instance);
      transform.multiplyMatrices(mesh.matrixWorld, instance);
    } else transform.copy(mesh.matrixWorld);
    for (let i = 0; i < index.count; i += 3) {
      triA.fromBufferAttribute(position, index.getX(i)).applyMatrix4(transform);
      triB
        .fromBufferAttribute(position, index.getX(i + 1))
        .applyMatrix4(transform);
      triC
        .fromBufferAttribute(position, index.getX(i + 2))
        .applyMatrix4(transform);
      triangle.closestPointToPoint(point, closest);
      distance = Math.min(distance, closest.distanceTo(point));
    }
  }
  return distance;
}
const endpoint = (mesh, end) => mesh.localToWorld(new Vector3(0, end * 0.5, 0));
let maxAttachedWallError = 0,
  checkedWallContacts = 0;
for (const atp of ["available", "absent"])
  for (const p of [0, 0.18, 0.31, 0.43, 0.57, 0.72, 0.89, 1]) {
    cil.update(p, { atp });
    cil.group.updateMatrixWorld(true);
    for (let row = 1; row < 7; row++)
      for (let j = 0; j < 9; j++) {
        const tail = cil.group.getObjectByName(
            `dynein A-wall tail ${row}:${j}`,
          ),
          stalk = cil.group.getObjectByName(`dynein B-wall stalk ${row}:${j}`),
          neighbor = (j + 8) % 9,
          ownA = cil.group.getObjectByName(`axonemal tube ${j * 4}`),
          neighborA = cil.group.getObjectByName(
            `axonemal tube ${neighbor * 4}`,
          ),
          neighborB = cil.group.getObjectByName(
            `axonemal tube ${neighbor * 4 + 2}`,
          );
        assert.ok(tail && stalk && ownA && neighborA && neighborB);
        const anchorError = distanceToTriangles(ownA, endpoint(tail, -1));
        assert.ok(anchorError < 1e-6, "dynein tail detached from own A wall");
        if (stalk.visible) {
          const tip = endpoint(stalk, 1),
            start = endpoint(stalk, -1),
            tipError = distanceToTriangles(neighborB, tip),
            direction = tip.clone().sub(start),
            length = direction.length(),
            ray = new Raycaster(start, direction.normalize(), 0, length - 1e-6);
          maxAttachedWallError = Math.max(
            maxAttachedWallError,
            anchorError,
            tipError,
          );
          checkedWallContacts++;
          assert.ok(
            tipError < 1e-6,
            "dynein MTBD must touch actual B-wall triangles",
          );
          assert.equal(
            ray.intersectObject(neighborA, false).length,
            0,
            "stalk passes through neighboring A to reach B",
          );
        }
      }
  }
// Magnified transverse schematic must touch the actual rendered subunit shells.
let maxCrossWallError = 0;
for (let j = 0; j < 9; j++) {
  const tail = cil.group.getObjectByName(
      `cross-section dynein A-wall tail ${j}`,
    ),
    stalk = cil.group.getObjectByName(`cross-section dynein B-wall stalk ${j}`);
  for (const [mesh, point] of [
    [
      cil.group.getObjectByName(`cross-section A tubulin ${j}`),
      endpoint(tail, -1),
    ],
    [
      cil.group.getObjectByName(`cross-section B tubulin ${(j + 8) % 9}`),
      endpoint(stalk, 1),
    ],
  ]) {
    const error = distanceToTriangles(mesh, point);
    maxCrossWallError = Math.max(maxCrossWallError, error);
    assert.ok(
      error < 0.001,
      "transverse dynein detached from tubulin subunit surface",
    );
  }
}
cil.update(0.170001);
cil.group.updateMatrixWorld(true);
const minusStrokeStart = endpoint(
  cil.group.getObjectByName("dynein B-wall stalk 3:0"),
  1,
);
cil.update(0.18);
cil.group.updateMatrixWorld(true);
const minusStrokeEnd = endpoint(
  cil.group.getObjectByName("dynein B-wall stalk 3:0"),
  1,
);
assert.ok(
  minusStrokeEnd.y < minusStrokeStart.y,
  "engaged stroke must move toward basal minus end",
);

// 20261004-neurons-02: shrinking epsilon must shrink the actual motor motion.
// A binary reach switch previously caused a .217-unit jump at both .31/.65.
const motorLobes = named(mus, "myosin motor cleft and lever arm").map(
  (h) => h.children[2],
);
let maxTransitionStep = 0;
for (const p of [0.27, 0.31, 0.65, 0.675]) {
  mus.update(p - 1e-6);
  mus.group.updateMatrixWorld(true);
  const before = motorLobes.map(world);
  mus.update(p + 1e-6);
  mus.group.updateMatrixWorld(true);
  for (let i = 0; i < motorLobes.length; i++) {
    const step = before[i].distanceTo(world(motorLobes[i]));
    maxTransitionStep = Math.max(maxTransitionStep, step);
    assert.ok(step < 1e-6, `motor snaps at ${p}: ${step}`);
  }
}
for (const p of [0.27, 0.28, 0.29, 0.3, 0.31, 0.65, 0.66, 0.675]) {
  mus.update(p, { calcium: "low" });
  assert.equal(
    fingerprint(mus),
    lowSnapshot,
    "approach envelope must respect low Ca",
  );
}

// 20261004-neurons-03: compare cut-edge vertices in world space. The two
// geometry classes use different azimuth conventions; equal phi is insufficient.
const docked = syn.group.getObjectByName("docked vesicle cutaway"),
  fused = syn.group.getObjectByName("fused vesicle cutaway"),
  dockShell = docked.children.find(
    (o) => o.geometry?.type === "SphereGeometry",
  ),
  fuseShell = fused.children.find((o) => o.geometry?.type === "LatheGeometry");
syn.update(0.38 - 1e-7);
syn.group.updateMatrixWorld(true);
assert.ok(docked.visible && !fused.visible);
const spherePosition = dockShell.geometry.attributes.position,
  sphereWidth = dockShell.geometry.parameters.widthSegments,
  sphereRow = Math.floor(dockShell.geometry.parameters.heightSegments / 2),
  dockOrigin = dockShell.getWorldPosition(new Vector3()),
  dockEdges = [0, sphereWidth].map((column) =>
    dockShell
      .localToWorld(
        new Vector3().fromBufferAttribute(
          spherePosition,
          sphereRow * (sphereWidth + 1) + column,
        ),
      )
      .sub(dockOrigin),
  );
syn.update(0.38 + 1e-7);
syn.group.updateMatrixWorld(true);
assert.ok(!docked.visible && fused.visible);
const lathePosition = fuseShell.geometry.attributes.position,
  contourRows = fuseShell.geometry.parameters.points.length,
  fuseOrigin = fuseShell.getWorldPosition(new Vector3()),
  fuseEdges = [0, fuseShell.geometry.parameters.segments].map((column) =>
    fuseShell
      .localToWorld(
        new Vector3().fromBufferAttribute(
          lathePosition,
          column * contourRows + 3,
        ),
      )
      .sub(fuseOrigin),
  );
const sector = (edges) => {
  const direction = edges[0].clone().add(edges[1]);
  direction.y = 0;
  return direction.normalize();
};
assert.ok(
  sector(dockEdges).dot(sector(fuseEdges)) > 0.999999,
  "vesicle cutaway rotates during fusion",
);
assert.ok(
  sector(fuseEdges).z > 0.99,
  "fusion cutaway must continue facing the camera",
);
console.log(
  `2026-10-04 neurons: ${checkedWallContacts} longitudinal wall contacts, max error ${maxAttachedWallError.toExponential(2)}; transverse error ${maxCrossWallError.toFixed(6)}; motor boundary step ${maxTransitionStep.toExponential(2)}; fusion cutaway continuity passed`,
);

// 20261004-neurons-04: leader targets follow the named geometry and only
// describe active transfer/motion when that event is present.
const labelPoint = (scene, index) =>
  new Vector3().fromArray(scene.labels[index].position);
const samePoint = (a, b, message) => assert.ok(a.distanceTo(b) < 1e-8, message);
function instanceCenter(mesh, index) {
  const transform = new Matrix4();
  mesh.getMatrixAt(index, transform);
  return new Vector3()
    .setFromMatrixPosition(transform)
    .applyMatrix4(mesh.matrixWorld);
}
const ap = actionPotential.create();
for (const stimulus of ["on", "off"])
  for (const p of [0, 0.255, 0.48, 0.55, 0.915, 1]) {
    ap.update(p, { stimulus });
    ap.group.updateMatrixWorld(true);
    samePoint(
      labelPoint(ap, 1),
      world(ap.group.getObjectByName("enlarged na extracellular collar")),
      "Na label misses actual collar",
    );
    samePoint(
      labelPoint(ap, 2),
      world(ap.group.getObjectByName("enlarged k extracellular collar")),
      "K label misses actual collar",
    );
    samePoint(
      labelPoint(ap, 3),
      world(ap.group.getObjectByName("enlarged na cytoplasmic collar")),
      "cytoplasmic label misses channel exit",
    );
  }
for (const calcium of ["available", "blocked"])
  for (const p of [
    0,
    0.275,
    0.38 - 0.000001,
    0.38 + 0.000001,
    0.575,
    0.795,
    1,
  ]) {
    syn.update(p, { calcium });
    syn.group.updateMatrixWorld(true);
    samePoint(
      labelPoint(syn, 1),
      world(syn.group.getObjectByName("four-domain transmembrane pore")),
      "Ca label misses presynaptic pore",
    );
    samePoint(
      labelPoint(syn, 4),
      world(receptors[0].getObjectByName("AMPA extracellular ligand cleft")),
      "AMPA label misses extracellular cleft",
    );
    samePoint(
      labelPoint(syn, 5),
      world(syn.group.getObjectByName("astrocytic EAAT uptake opening")),
      "EAAT label misses uptake opening",
    );
    const shell = docked.visible ? dockShell : fuseShell;
    assert.ok(
      distanceToTriangles(shell, labelPoint(syn, 2)) < 1e-7,
      "vesicle label targets the hidden shell or empty background",
    );
  }
const leftDisc = mus.group.getObjectByName("left Z disc"),
  rightDisc = mus.group.getObjectByName("right Z disc"),
  leftActin = mus.group.getObjectByName("actin thin filament -1:-0.79"),
  calciumMarker = mus.group.getObjectByName("muscle calcium marker 6"),
  markedHead = mus.group.getObjectByName("myosin cross-bridge 1:-0.79:1.62");
for (const calcium of ["released", "low"])
  for (const p of [
    0, 0.15, 0.27, 0.31, 0.5, 0.6, 0.665, 0.76, 0.865, 0.94, 1,
  ]) {
    mus.update(p, { calcium });
    mus.group.updateMatrixWorld(true);
    assert.ok(
      distanceToTriangles(leftDisc, labelPoint(mus, 2)) < 1e-8,
      "left Z label must follow the actual disc face",
    );
    assert.ok(
      distanceToTriangles(rightDisc, labelPoint(mus, 3)) < 1e-8,
      "right Z label must follow the actual disc face",
    );
    samePoint(
      labelPoint(mus, 6),
      instanceCenter(leftActin, 40),
      "actin label does not follow a material subunit",
    );
    assert.equal(
      mus.labels[7].active,
      calciumMarker.visible,
      "Ca transfer label shown without visible Ca",
    );
    samePoint(
      labelPoint(mus, 7),
      world(calciumMarker),
      "Ca label does not follow moving ion",
    );
    if (calcium === "low") assert.match(mus.labels[4].text.en, /no shortening/);
    if (mus.labels[7].active && p >= 0.83)
      assert.match(mus.labels[7].text.en, /leaves troponin/);
    const ATP = markedHead.getObjectByName("ATP bound marker"),
      ADP = markedHead.getObjectByName("ADP bound marker"),
      target = ATP.visible
        ? ATP
        : ADP.visible
          ? ADP
          : markedHead.getObjectByName("myosin motor cleft and lever arm")
              .children[2];
    samePoint(
      labelPoint(mus, 8),
      world(target),
      "nucleotide label misses the current visible marker or empty motor",
    );
  }
for (const atp of ["available", "absent"])
  for (const p of [0, 0.17, 0.185, 0.355, 0.525, 0.715, 0.905, 1]) {
    cil.update(p, { atp });
    cil.group.updateMatrixWorld(true);
    const membrane = cil.group.getObjectByName("ciliary membrane cutaway"),
      membraneVertex = membrane.localToWorld(
        new Vector3().fromBufferAttribute(
          membrane.geometry.attributes.position,
          14,
        ),
      );
    samePoint(
      labelPoint(cil, 0),
      membraneVertex,
      "cilium label must follow deformed membrane",
    );
    samePoint(
      labelPoint(cil, 1),
      instanceCenter(
        cil.group.getObjectByName("cross-section A tubulin 2"),
        42,
      ),
      "9+2 annotation misses the transverse structure",
    );
    samePoint(
      labelPoint(cil, 5),
      endpoint(cil.group.getObjectByName("dynein B-wall stalk 4:0"), -1),
      "bending label must follow actual motor",
    );
    assert.equal(
      cil.labels[5].active,
      atp === "available" && p > 0.17,
      "bending label shown during arrest",
    );
  }
console.log(
  "2026-10-04 neurons rendered-label regressions: all four models, both conditions, moving object anchors and inactive labels passed",
);

// 20261004-neurons-05: actual default-camera rays must see the existing inner
// state bands. A FrontSide cylinder silently culls the needed interior face.
const axonCamera = new Vector3(...ap.camera.position);
let visibleBandStates = 0;
for (const stimulus of ["on", "off"])
  for (let zone = 0; zone < 6; zone++)
    for (const [delay, activeColor] of [
      [0.027, "4b9694"],
      [0.08, "c49b5d"],
      [0.17, "928c9d"],
      [0.2, "81968b"],
    ]) {
      ap.update(0.14 + zone * 0.105 + delay, { stimulus });
      ap.group.updateMatrixWorld(true);
      const band = ap.group.getObjectByName(`axon state band ${zone}`);
      assert.equal(
        band.material.color.getHexString(),
        stimulus === "on" ? activeColor : "81968b",
        "visibility repair changed a voltage-state color or no-stimulus control",
      );
      let unobstructed = 0;
      for (const axial of [-0.35, 0, 0.35]) {
        const target = band.localToWorld(new Vector3(0, axial, -0.8)),
          ray = new Raycaster(
            axonCamera,
            target.clone().sub(axonCamera).normalize(),
          );
        assert.ok(
          ray.intersectObject(band, false).length > 0,
          "default camera cannot see the state band's inner face",
        );
        if (ray.intersectObject(ap.group, true)[0]?.object === band)
          unobstructed++;
      }
      // Ions/arrows may legitimately cover one sample, never the whole band.
      assert.ok(
        unobstructed > 0,
        "state band hidden behind another model surface",
      );
      visibleBandStates++;
    }
console.log(
  `2026-10-04 actionPotential: ${visibleBandStates} visible band/control/state cases; palette and electrical timing preserved`,
);
