import assert from "node:assert/strict";
import * as THREE from "three";
import definition from "../src/processes/photosynthesisProcess.js";

const scene = definition.create({ rootId: "plant" });
scene.group.updateMatrixWorld(true);
const thylakoids = scene.group.getObjectByName(
  "thylakoid-membranes-and-lumina",
);
const point = (mesh, i) =>
  new THREE.Vector3()
    .fromBufferAttribute(mesh.geometry.attributes.position, i)
    .applyMatrix4(mesh.matrixWorld);
const membranes = thylakoids.children.flatMap((o) =>
  o.isMesh ? [o] : o.children.flatMap((d) => d.children.slice(0, 3)),
);
function boundaryEdges(mesh) {
  const edges = new Map(),
    index = mesh.geometry.index;
  for (let i = 0; i < index.count; i += 3) {
    const triangle = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
    for (let j = 0; j < 3; j++) {
      const a = triangle[j],
        b = triangle[(j + 1) % 3],
        key = [a, b].sort((a, b) => a - b).join(":");
      const edge = edges.get(key) ?? { a, b, count: 0 };
      edge.count++;
      edges.set(key, edge);
    }
  }
  return [...edges.values()]
    .filter((e) => e.count === 1)
    .map((e) => [point(mesh, e.a), point(mesh, e.b)]);
}
const ray = new THREE.Raycaster();
let maxWeldError = 0;
for (let connection = 0; connection < 2; connection++) {
  const source = thylakoids.children[0].children[connection ? 3 : 1];
  const destination = thylakoids.children[1].children[connection ? 4 : 1];
  const inner = scene.group.getObjectByName(
    `intergranal-lamella-${connection}-inner`,
  );
  assert(inner, "lamella must expose a real connected inner membrane");
  const around = 72,
    rings = inner.geometry.attributes.position.count / around;
  for (const layer of ["outer", "inner"]) {
    const lamella = scene.group.getObjectByName(
      `intergranal-lamella-${connection}-${layer}`,
    );
    for (const [disc, row] of [
      [source, 0],
      [destination, rings - 1],
    ]) {
      const edges = boundaryEdges(disc.children[layer === "outer" ? 0 : 1]);
      for (let i = 0; i < around; i++) {
        const a = point(lamella, row * around + i),
          b = point(lamella, row * around + ((i + 1) % around));
        let closest = Infinity;
        for (const [c, d] of edges)
          closest = Math.min(
            closest,
            Math.max(a.distanceTo(c), b.distanceTo(d)),
            Math.max(a.distanceTo(d), b.distanceTo(c)),
          );
        maxWeldError = Math.max(maxWeldError, closest);
        assert(
          closest < 3e-7,
          `paired membrane boundary is not welded: ${connection}/${layer}/${i}: ${closest}`,
        );
      }
    }
  }
  const centers = Array.from({ length: rings }, (_, row) => {
    const center = new THREE.Vector3();
    for (let i = 0; i < around; i++) center.add(point(inner, row * around + i));
    return center.divideScalar(around);
  });
  const outerLamella = scene.group.getObjectByName(
    `intergranal-lamella-${connection}-outer`,
  );
  // Interior lamella sections have no observation window. Close to a disc,
  // an oblique ray can legitimately leave through its separately drawn cut;
  // those endpoints are checked by the exact paired-boundary test above.
  for (const row of [6, 12, 18])
    for (let angle = 0; angle < around; angle += 9) {
      const inside = point(inner, row * around + angle),
        direction = inside.clone().sub(centers[row]);
      const innerDistance = direction.length();
      ray.set(centers[row], direction.normalize());
      ray.near = 0;
      ray.far = 1;
      const hits = ray.intersectObjects(
        [outerLamella, source.children[0], destination.children[0]],
        false,
      );
      assert(
        hits.length && hits[0].distance > innerDistance + 0.001,
        `lamellar leaflets cross or lose their bilayer interval: ${connection}/${row}/${angle}: inner ${innerDistance}, outer ${hits[0]?.distance}`,
      );
    }
  // Four displaced lumen routes supplement the centerline. Test the actual
  // complete membrane meshes, including the viewing cut and both leaflets.
  for (const angle of [-1, 0, 18, 36, 54]) {
    const path = centers.map((c, row) =>
      angle < 0
        ? c.clone()
        : c.clone().lerp(point(inner, row * around + angle), 0.25),
    );
    path.unshift(source.getWorldPosition(new THREE.Vector3()));
    path.push(destination.getWorldPosition(new THREE.Vector3()));
    for (let i = 0; i + 1 < path.length; i++) {
      const delta = path[i + 1].clone().sub(path[i]),
        length = delta.length();
      ray.set(path[i], delta.normalize());
      ray.near = 1e-7;
      ray.far = length - 1e-7;
      assert.equal(
        ray.intersectObjects(membranes, false).length,
        0,
        `membrane blocks lumen route ${connection}/${angle}/${i}`,
      );
    }
  }
}
console.log(
  "20261004-original-04: open lumen routes and welded paired leaflets",
  { maxWeldError },
);

const topDisc = thylakoids.children[0].children[4];
const inner = topDisc.children[1],
  outer = topDisc.children[0];
const psii = scene.group.getObjectByName("photosystem-II-dimer-with-antenna");
let minimumOecClearance = Infinity;
for (const cap of [psii.children[4], psii.children[12]])
  cap.traverse((o) => {
    if (!o.geometry) return;
    for (let i = 0; i < o.geometry.attributes.position.count; i++) {
      const p = point(o, i);
      // The actual inner shell must lie above and below every OEC vertex. The
      // cap sits behind the observation window, where both boundaries exist.
      for (const sign of [-1, 1]) {
        ray.set(p, new THREE.Vector3(0, sign, 0));
        ray.near = 0;
        ray.far = 1;
        const hits = ray.intersectObject(inner, false);
        assert(hits.length, "OEC escaped the thylakoid lumen");
        minimumOecClearance = Math.min(minimumOecClearance, hits[0].distance);
        assert(
          hits[0].distance > 0.003,
          "OEC intersects the opposite/luminal leaflet",
        );
      }
    }
  });
const synthase = scene.group.getObjectByName("chloroplast-ATP-synthase");
const rotor = synthase.children[0];
let minimumRotorLowerClearance = Infinity;
for (const helix of rotor.children.slice(0, 14)) {
  const positions = helix.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const p = point(helix, i),
      start = new THREE.Vector3(p.x, 1.5, p.z);
    ray.set(start, new THREE.Vector3(0, -1, 0));
    ray.near = 0;
    ray.far = 2;
    const hits = ray.intersectObject(outer, false);
    assert(hits.length >= 2, "rotor footprint leaves the membrane rim");
    const lower = hits.at(-1).point.y;
    minimumRotorLowerClearance = Math.min(
      minimumRotorLowerClearance,
      p.y - lower,
    );
    assert(p.y > lower + 0.02, "rotor crosses the opposite lower membrane");
  }
}
const head = synthase.children[2].getWorldPosition(new THREE.Vector3());
assert(head.y > 0.85, "ATP synthase catalytic head must stay stromal");
console.log("20261004-original-06: OEC compartment and rotor footprint", {
  minimumOecClearance,
  minimumRotorLowerClearance,
});

const starts = [0.12, 0.12, 0.3, 0.3, 0.48, 0.48, 0.48, 0.64, 0.64, 0.79, 0.87];
let openWraps = 0;
for (let route = 0; route < starts.length; route++) {
  const guide = scene.group.getObjectByName(`explanatory-flow-${route}-guide`),
    curve = guide.geometry.parameters.path;
  const closed = curve.getPoint(0).distanceTo(curve.getPoint(1)) < 1e-8;
  const packets = scene.group.children.filter((o) =>
    o.name.startsWith(`explanatory-flow-${route}-packet-`),
  );
  for (let i = 0; i < packets.length; i++)
    for (let turn = 1; turn <= 4; turn++) {
      const p = starts[route] + (turn - i / packets.length) / 3.8;
      if (p >= 1 || p <= starts[route] + 0.05) continue;
      const epsilon = 1e-7;
      scene.update(p - epsilon);
      const before = packets[i].position.clone(),
        oldScale = packets[i].scale.x;
      scene.update(p + epsilon);
      const displacement = packets[i].position.distanceTo(before);
      if (closed)
        assert(displacement < 0.0001, "closed reaction loop is not continuous");
      else {
        openWraps++;
        assert(
          oldScale < 1e-8 && packets[i].scale.x < 1e-8 && !packets[i].visible,
          "finite route resets a visible full-size marker",
        );
      }
    }
}
assert(openWraps > 15);
console.log(
  "20261004-original-03: finite pulses vanish at every sampled route reset",
  { openWraps },
);

const inventory = () => {
  const nodes = [],
    geometries = new Set(),
    materials = new Set();
  scene.group.traverse((o) => {
    nodes.push(o.uuid);
    if (o.geometry) geometries.add(o.geometry.uuid);
    for (const m of o.material
      ? Array.isArray(o.material)
        ? o.material
        : [o.material]
      : [])
      materials.add(m.uuid);
  });
  return [nodes, [...geometries], [...materials]];
};
const fingerprint = () => {
  const state = [];
  scene.group.traverse((o) =>
    state.push([
      o.uuid,
      o.visible,
      ...o.position,
      ...o.quaternion,
      ...o.scale,
      o.material?.opacity,
      o.material?.emissiveIntensity,
    ]),
  );
  return JSON.stringify(state);
};
const original = inventory();
for (const p of [
  0,
  0.14,
  0.32,
  0.5,
  0.66,
  0.88,
  1,
  0.193,
  0.719,
  0.33,
  0.719,
  NaN,
]) {
  scene.update(p);
  assert.deepEqual(inventory(), original);
  scene.group.traverse((o) => {
    if (o.geometry)
      for (const a of Object.values(o.geometry.attributes))
        assert(a.array.every(Number.isFinite));
    if (o.instanceMatrix) assert(o.instanceMatrix.array.every(Number.isFinite));
  });
}
scene.update(0.719);
const first = fingerprint();
scene.update(0.193);
scene.update(1);
scene.update(0.719);
assert.equal(fingerprint(), first);
console.log(
  "Original photosynthesis: finite buffers, stable inventory and deterministic seeking passed",
);

const labels = scene.labels.slice(),
  labelArrays = labels.map((l) => l.position);
const psi = scene.group.getObjectByName("photosystem-I-with-LHCI-crescent"),
  rubisco = scene.group.getObjectByName("stromal-Rubisco-L8S8");
for (const p of [0, 0.14, 0.32, 0.5, 0.66, 0.88, 1, 0.32]) {
  scene.update(p);
  scene.group.updateMatrixWorld(true);
  for (const [index, object] of [
    [3, psii.children[12].children[0]],
    [9, psii.children[0].children[0]],
    [10, psi.children[0].children[0]],
    [11, synthase.children[2].children[0].children[0]],
    [12, rubisco.children[0].children[0]],
  ]) {
    const expected = object.getWorldPosition(new THREE.Vector3());
    assert(
      expected.distanceTo(new THREE.Vector3(...labels[index].position)) < 2e-6,
      "protein label points to a stale text offset",
    );
  }
  for (const [index, route, at] of [
    [0, 0, 0.25],
    [4, 6, 0],
    [6, 7, 0.15],
    [7, 9, 0.84],
    [8, 10, 0.55],
  ]) {
    const guide = scene.group.getObjectByName(
      `explanatory-flow-${route}-guide`,
    );
    const expected = guide.geometry.parameters.path
      .getPoint(at)
      .applyMatrix4(guide.matrixWorld);
    assert(
      expected.distanceTo(new THREE.Vector3(...labels[index].position)) < 2e-6,
      "reaction-label anchor leaves its explanatory route",
    );
  }
  const labelledMembrane = thylakoids.children[0].children[2].children[0];
  assert(
    point(labelledMembrane, 20).distanceTo(
      new THREE.Vector3(...labels[1].position),
    ) < 2e-6,
  );
  labels.forEach((l, i) => {
    assert.equal(l, scene.labels[i]);
    assert.equal(l.position, labelArrays[i]);
  });
}
console.log(
  "20261004-original-photosynthesis-labels-01: membrane, protein and explanatory-route leaders",
);
