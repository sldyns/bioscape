import assert from "node:assert/strict";
import test from "node:test";
import { Box3, Matrix4, Raycaster, Vector3 } from "three";
import actionPotential from "./actionPotentialProcess.js";

function system() {
  const scene = actionPotential.create();
  const detail = scene.group.getObjectByName(
    "stationary selected membrane region enlarged",
  );
  const overview = scene.group.getObjectByName(
    "unmyelinated axon propagation overview",
  );
  const pores = (group) =>
    group.children.filter((c) => c.name === "four-domain transmembrane pore");
  const pose = (p, stimulus = "on") => {
    scene.update(p, { stimulus });
    scene.group.updateMatrixWorld(true);
  };
  pose(0);
  return {
    scene,
    detail,
    overview,
    local: pores(detail),
    axial: pores(overview),
    pose,
  };
}
const state = (pore) => pore.getObjectByName("splayed S6 pore lining").visible;
const vec = () => new Vector3();

function closestEdge(ax, az, bx, bz) {
  const dx = bx - ax,
    dz = bz - az;
  const t = Math.max(
    0,
    Math.min(1, -(ax * dx + az * dz) / (dx * dx + dz * dz || 1)),
  );
  return Math.hypot(ax + t * dx, az + t * dz);
}
function triangleRadius(a, b, c) {
  const ab = a.x * b.z - a.z * b.x,
    bc = b.x * c.z - b.z * c.x,
    ca = c.x * a.z - c.z * a.x;
  if (
    Math.abs(ab + bc + ca) > 1e-14 &&
    ((ab >= 0 && bc >= 0 && ca >= 0) || (ab <= 0 && bc <= 0 && ca <= 0))
  )
    return 0;
  return Math.min(
    closestEdge(a.x, a.z, b.x, b.z),
    closestEdge(b.x, b.z, c.x, c.z),
    closestEdge(c.x, c.z, a.x, a.z),
  );
}
// Minimum distance from a *triangle*, including each placed instance and its
// interior, to the actual axis of this pore. Work in pore-local coordinates so
// the nonuniform scaling of the right-hand overview cannot inflate clearance.
function aperture(pore, surrounding) {
  const inverse = pore.matrixWorld.clone().invert();
  const objectMatrix = new Matrix4(),
    matrix = new Matrix4(),
    instance = new Matrix4(),
    box = new Box3();
  let min = 0.16;
  for (const part of [pore, ...surrounding])
    part.traverseVisible((mesh) => {
      if (!mesh.isMesh) return;
      const geom = mesh.geometry,
        pos = geom.attributes.position;
      if (!geom.boundingBox) geom.computeBoundingBox();
      objectMatrix.multiplyMatrices(inverse, mesh.matrixWorld);
      for (let i = 0; i < (mesh.isInstancedMesh ? mesh.count : 1); i++) {
        matrix.copy(objectMatrix);
        if (mesh.isInstancedMesh) {
          mesh.getMatrixAt(i, instance);
          matrix.multiply(instance);
        }
        box.copy(geom.boundingBox).applyMatrix4(matrix);
        if (
          box.max.y < -0.68 ||
          box.min.y > 0.68 ||
          box.max.x < -min ||
          box.min.x > min ||
          box.max.z < -min ||
          box.min.z > min
        )
          continue;
        const points = Array.from({ length: pos.count }, (_, j) =>
          vec().fromBufferAttribute(pos, j).applyMatrix4(matrix),
        );
        const indices = geom.index?.array;
        for (let j = 0; j < (indices?.length ?? points.length); j += 3) {
          const a = points[indices?.[j] ?? j],
            b = points[indices?.[j + 1] ?? j + 1],
            c = points[indices?.[j + 2] ?? j + 2];
          if (Math.max(a.y, b.y, c.y) < -0.68 || Math.min(a.y, b.y, c.y) > 0.68)
            continue;
          min = Math.min(min, triangleRadius(a, b, c));
        }
      }
    });
  return min;
}
function markerRadius(ion, pore) {
  const inverse = pore.matrixWorld.clone().invert();
  const center = ion.getWorldPosition(vec()).applyMatrix4(inverse);
  let max = 0;
  ion.traverse((node) => {
    const mat = inverse.clone().multiply(node.matrixWorld),
      p = vec();
    for (let i = 0; i < node.geometry.attributes.position.count; i++) {
      p.fromBufferAttribute(node.geometry.attributes.position, i).applyMatrix4(
        mat,
      );
      max = Math.max(max, Math.hypot(p.x - center.x, p.z - center.z));
    }
  });
  return max;
}
function firstWallHit(pore, wall) {
  const origin = pore.localToWorld(new Vector3(0, 0.67, 0));
  const end = pore.localToWorld(new Vector3(0, -0.67, 0));
  const length = end.distanceTo(origin);
  return new Raycaster(
    origin,
    end.sub(origin).normalize(),
    0,
    length,
  ).intersectObject(wall, false)[0];
}

test("each displayed open pore clears the entire charged marker; both shut states block its central ray", (t) => {
  const { local, axial, overview, detail, pose } = system();
  assert.equal(axial.length, 12);
  assert.equal(local.length, 2);
  const isLipid = (x) =>
    x.name === "paired lipid headgroup leaflets" ||
    x.name === "paired hydrophobic lipid tails";
  const axialWalls = overview.children.filter(
    (x) =>
      isLipid(x) ||
      x.name.startsWith("axon state band") ||
      x.name === "axon cutaway wall",
  );
  const localWalls = detail.children
    .filter((x) => x.name.includes("collar"))
    .concat(detail.children[0]);
  const chain = overview.children.filter((x) =>
    x.name.endsWith("overview crossing ion"),
  );
  const measured = [];
  for (const [i, pore] of [...axial, ...local].entries()) {
    const enlarged = i >= axial.length,
      isNa = i % 2 === 0;
    const zone = enlarged ? 3 : Math.floor(i / 2);
    const start = [0.14, 0.2345, 0.35, 0.455, 0.56, 0.665][zone];
    const ion = enlarged
      ? detail.getObjectByName((isNa ? "na" : "k") + " crossing ion 0")
      : chain[i];
    const walls = enlarged ? localWalls : axialWalls;
    pose(start + (isNa ? 0.027 : 0.088));
    assert.ok(state(pore));
    assert.equal(
      pore.getObjectByName("constricted S6 pore lining").visible,
      false,
    );
    const radius = markerRadius(ion, pore),
      clearance = aperture(pore, walls);
    assert.ok(
      clearance > radius + 0.002,
      "ion plus its charge glyph must clear the continuous central cylinder",
    );
    assert.equal(
      firstWallHit(pore, pore.getObjectByName("splayed S6 pore lining")),
      undefined,
    );
    for (const p of [0, start + 0.16, 1]) {
      pose(p);
      const shut = pore.getObjectByName("constricted S6 pore lining");
      assert.equal(shut.visible, true);
      assert.equal(state(pore), false);
      const hit = firstWallHit(pore, shut);
      assert.ok(
        hit && Math.abs(pore.worldToLocal(hit.point.clone()).y) < 0.31,
        "actual pore lining seals the axis",
      );
    }
    measured.push({
      site: enlarged ? "detail" : zone,
      ion: isNa ? "Na+" : "K+",
      radius,
      clearance,
    });
  }
  t.diagnostic(JSON.stringify({ measured, unit: "pore-local model units" }));
});

test("Na and K cross both leaflets in opposite directions only through their own open pores", (t) => {
  const { scene, local, axial, detail, overview, pose } = system();
  const props = scene.group.userData;
  const particles = local.flatMap((pore, i) =>
    Array.from({ length: 3 }, (_, j) => {
      const ion = detail.getObjectByName(
        (i === 0 ? "na" : "k") + " crossing ion " + j,
      );
      assert.ok(ion.getObjectByName("positive ionic charge"));
      return { i, pore, ion, ys: [] };
    }),
  );
  const overviewIons = overview.children.filter((node) =>
    node.name.endsWith("overview crossing ion"),
  );
  assert.equal(overviewIons.length, 12);
  const firstConducting = new Array(12).fill(null);
  let overlaps = 0;
  for (let n = 0; n <= 1000; n++) {
    const p = n / 1000;
    pose(p);
    for (const { pore, ion, ys, i } of particles) {
      if (!ion.visible) continue;
      assert.ok(state(pore));
      assert.equal(pore.userData.ion, i === 0 ? "Na+" : "K+");
      assert.equal(ion.position.x, pore.position.x);
      assert.equal(ion.position.z, pore.position.z);
      ys.push(ion.position.y);
    }
    axial.forEach((pore, i) => {
      const ion = overviewIons[i];
      assert.equal(ion.visible, state(pore));
      assert.equal(ion.position.x, pore.position.x);
      assert.equal(ion.position.z, pore.position.z);
      if (ion.visible && firstConducting[i] === null) firstConducting[i] = p;
    });
    assert.equal(props.detailSodiumOpen, state(local[0]));
    assert.equal(props.detailPotassiumOpen, state(local[1]));
    if (state(local[0]) && state(local[1])) overlaps++;
  }
  assert.ok(overlaps > 0 && overlaps < 10);
  for (const { i, ys } of particles) {
    assert.ok(Math.max(...ys) > 0.59 && Math.min(...ys) < -0.59);
    for (let j = 1; j < ys.length; j++)
      assert.ok(i === 0 ? ys[j] < ys[j - 1] : ys[j] > ys[j - 1]);
  }
  for (let i = 0; i < 6; i++) {
    const [na, k] = firstConducting.slice(2 * i, 2 * i + 2);
    assert.ok(k > na);
    if (i) assert.ok(na > firstConducting[2 * i - 2]);
  }
  pose(0.24);
  assert.ok(
    state(axial[2]),
    "Na-opening stage button exposes a conducting pore upstream",
  );
  assert.equal(
    state(local[0]),
    false,
    "the fixed patch is still ahead of the wave",
  );
  for (const p of [0, 0.24, 0.42, 0.48, 0.505, 0.55, 0.62, 0.9, 1]) {
    pose(p, "off");
    assert.ok([...axial, ...local].every((a) => !state(a)));
    assert.ok(
      [...overviewIons, ...particles.map((v) => v.ion)].every(
        (ion) => !ion.visible,
      ),
    );
    assert.equal(props.detailSodiumState, "closed");
    assert.equal(props.recovered, false);
  }
  t.diagnostic(
    JSON.stringify({
      observedNaKOnsets: firstConducting,
      overlapSamples: overlaps,
      intervals: 1000,
      detailTransitRanges: particles.map((x) => [
        Math.min(...x.ys),
        Math.max(...x.ys),
      ]),
    }),
  );
});

function tubeEnd(mesh, last = false, instanceId) {
  const { radialSegments, tubularSegments } = mesh.geometry.parameters;
  const start = last ? tubularSegments * (radialSegments + 1) : 0;
  const center = vec(),
    pos = mesh.geometry.attributes.position;
  for (let i = 0; i < radialSegments; i++)
    center.add(vec().fromBufferAttribute(pos, start + i));
  center.divideScalar(radialSegments);
  if (instanceId !== undefined) {
    const m = new Matrix4();
    mesh.getMatrixAt(instanceId, m);
    center.applyMatrix4(m);
  }
  return mesh.localToWorld(center);
}

test("the lateral Na linker stays connected to DIII S6 and DIV S1 as it docks and recovers", (t) => {
  const { local, pose } = system(),
    na = local[0],
    k = local[1];
  assert.equal(k.getObjectByName("Na docked III-IV linker"), undefined);
  const free = na.getObjectByName("Na undocked III-IV linker"),
    dock = na.getObjectByName("Na docked III-IV linker");
  const outer = na.getObjectByName("twenty outer transmembrane helices");
  const lips = [];
  na.traverse((x) => {
    if (x.name === "Na lateral inactivation pocket lip") lips.push(x);
  });
  const pocket = lips
    .reduce((v, x) => v.add(x.getWorldPosition(vec())), vec())
    .divideScalar(2);
  let maxTerminalError = 0,
    freeGap,
    dockedGap;
  for (const [p, stimulus, docked] of [
    [0, "on", false],
    [0.48, "on", false],
    [0.55, "on", true],
    [0.62, "on", true],
    [0.7, "on", false],
    [1, "on", false],
    [0.55, "off", false],
    [0.55, "on", true],
  ]) {
    pose(p, stimulus);
    assert.equal(dock.visible, docked);
    assert.equal(free.visible, !docked);
    const live = docked ? dock : free;
    const chain = live.getObjectByName("Na III-IV linker backbone"),
      motif = live.getObjectByName("Na inactivation motif");
    const actual = na.getObjectByName(
      state(na) ? "splayed S6 pore lining" : "constricted S6 pore lining",
    );
    maxTerminalError = Math.max(
      maxTerminalError,
      tubeEnd(chain).distanceTo(tubeEnd(actual, false, 0)),
      tubeEnd(chain, true).distanceTo(tubeEnd(outer, false, 15)),
    );
    const point = na.worldToLocal(motif.getWorldPosition(vec()));
    assert.ok(
      Math.hypot(point.x, point.z) - 0.056 > 0.12,
      "motif remains beside the pore in both conformations",
    );
    const gap =
      motif.getWorldPosition(vec()).distanceTo(pocket) /
      na.getWorldScale(vec()).x;
    if (docked) dockedGap = gap;
    else freeGap = gap;
  }
  assert.ok(maxTerminalError < 1e-6);
  assert.ok(dockedGap < 0.018 && freeGap > 0.22);
  t.diagnostic(
    JSON.stringify({
      maxWorldTerminalError: maxTerminalError,
      dockedPocketGap: dockedGap,
      undockedPocketGap: freeGap,
    }),
  );
});

test("the spatial voltage crest advances while the probe and magnification leader stay attached to one membrane region", (t) => {
  const { scene, detail, overview, pose } = system();
  const trace = scene.group.getObjectByName(
    "spatial membrane potential profile",
  ).geometry.attributes.position;
  const samplePoint = scene.group.getObjectByName(
    "fixed voltage sample on spatial trace",
  );
  const lead = scene.group.getObjectByName(
    "fixed membrane magnification leader",
  );
  const ring = overview.getObjectByName("fixed overview membrane sample");
  const evidence = [];
  const x0 = samplePoint.position.x;
  function plotPoint(i) {
    return vec()
      .fromBufferAttribute(trace, 3 * i + 1)
      .add(vec().fromBufferAttribute(trace, 3 * i + 2))
      .multiplyScalar(0.5);
  }
  const ringCenter = vec();
  const { radialSegments, tubularSegments } = ring.geometry.parameters;
  for (let j = 0; j < radialSegments; j++)
    ringCenter.add(
      vec().fromBufferAttribute(
        ring.geometry.attributes.position,
        j * (tubularSegments + 1) + tubularSegments / 4,
      ),
    );
  ring.localToWorld(ringCenter.divideScalar(radialSegments));
  const heads = detail.children[0].getObjectByName(
    "paired lipid headgroup leaflets",
  );
  const hMatrix = new Matrix4();
  heads.getMatrixAt(heads.count - 1, hMatrix);
  const head = heads.localToWorld(vec().setFromMatrixPosition(hMatrix));
  for (const p of [0.21, 0.3, 0.39, 0.48, 0.57, 0.66]) {
    pose(p);
    const line = Array.from({ length: trace.count / 3 }, (_, i) =>
      plotPoint(i),
    );
    const peak = line.reduce((best, x) => (x.y > best.y ? x : best));
    if (evidence.length)
      assert.ok(
        peak.x > evidence.at(-1).x + 0.35,
        "wave regenerates progressively to the right",
      );
    assert.ok(peak.y - Math.min(...line.map((point) => point.y)) > 0.6);
    const match = line.find((x) => Math.abs(x.x - x0) < 1e-6);
    assert.ok(match && Math.abs(match.y - samplePoint.position.y) < 1e-6);
    assert.equal(samplePoint.position.x, x0);
    assert.ok(tubeEnd(lead).distanceTo(ringCenter) < 1e-6);
    assert.ok(tubeEnd(lead, true).distanceTo(head) < 1e-6);
    evidence.push({ p, x: peak.x });
  }
  pose(0);
  const rest = Array.from(trace.array),
    volts = samplePoint.position.y;
  pose(0.505);
  const peakVoltage = samplePoint.position.y;
  pose(0.55);
  assert.ok(
    peakVoltage > samplePoint.position.y && samplePoint.position.y > volts,
  );
  pose(0.62);
  assert.equal(samplePoint.position.y, volts);
  assert.equal(scene.group.userData.detailSodiumState, "inactivated");
  for (const [p, stim] of [
    [0.9, "on"],
    [1, "on"],
    [0.55, "off"],
    [0.24, "off"],
  ]) {
    pose(p, stim);
    assert.deepEqual(
      Array.from(trace.array),
      rest,
      "resting electrical profile is recovered exactly",
    );
  }
  t.diagnostic(
    JSON.stringify({
      voltageCrests: evidence,
      restY: volts,
      peakY: peakVoltage,
    }),
  );
});
