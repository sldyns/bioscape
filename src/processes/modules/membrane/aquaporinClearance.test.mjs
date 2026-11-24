import assert from "node:assert/strict";
import { Box3, Line3, Ray, Vector3 } from "three";
import { MeshBVH } from "three-mesh-bvh";
import diffusion from "./diffusionProcess.js";
import { resolveStageCopy } from "../../stageCopy.js";

const model = diffusion.create({ rootId: "plant" });
model.update(0.265, { route: "water", gradient: "equal" });
model.group.updateMatrixWorld(true);
const molecule = model.group.getObjectByName("diffusing-molecule-0");
const axialRotation = molecule.rotation.y;
const atoms = [
  molecule,
  ...molecule.children.filter((atom) => atom.visible),
].map((atom) => ({
  offset: atom.getWorldPosition(new Vector3()).sub(molecule.position),
  radius: atom.geometry.parameters.radius * atom.getWorldScale(new Vector3()).x,
}));
assert.equal(atoms.length, 3);
const channelColors = new Set(["788f9c", "94adaf", "c8b88d"]);
const channelBounds = new Box3();
const surfaces = model.group.children
  .filter((mesh) => channelColors.has(mesh.material?.color?.getHexString()))
  .map((mesh) => {
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    geometry.computeBoundingBox();
    channelBounds.union(geometry.boundingBox);
    return new MeshBVH(geometry);
  });
assert.equal(surfaces.length, 64);

const poreCenters = [
  [-0.46, -0.46],
  [0.46, -0.46],
  [-0.46, 0.46],
  [0.46, 0.46],
];
const axisHalfLength = 1.3;
const margin = 0.01;
const up = new Vector3(0, 1, 0);
const hit = new Vector3();
for (const [x, z] of poreCenters) {
  for (const { offset, radius } of atoms) {
    const start = new Vector3(x, -axisHalfLength, z).add(offset);
    const end = new Vector3(x, axisHalfLength, z).add(offset);
    const axis = new Line3(start, end);
    const reach = radius + margin;
    const box = new Box3().setFromPoints([start, end]).expandByScalar(reach);
    const ray = new Ray(start, up);
    for (const surface of surfaces) {
      const contact = surface.shapecast({
        intersectsBounds: (bounds) => box.intersectsBox(bounds),
        intersectsTriangle: (triangle) => {
          const crossing = ray.intersectTriangle(
            triangle.a,
            triangle.b,
            triangle.c,
            false,
            hit,
          );
          return (
            Boolean(
              crossing && hit.distanceToSquared(start) <= axis.distanceSq(),
            ) || triangle.closestPointToSegment(axis) < reach
          );
        },
      });
      assert(
        !contact,
        "A rendered aquaporin surface intersects an atom's swept path",
      );
    }
  }
}

// Every molecule near the protein's vertical span must follow one of the
// verified axes. The entry and exit bends stay beyond that span.
const particles = Array.from({ length: 32 }, (_, i) =>
  model.group.getObjectByName("diffusing-molecule-" + i),
);
const lower = Math.min(...atoms.map(({ offset, radius }) => offset.y - radius));
const upper = Math.max(...atoms.map(({ offset, radius }) => offset.y + radius));
const moleculeRadius = Math.max(
  ...atoms.map(({ offset, radius }) => offset.length() + radius),
);
const uprightAtoms = atoms.map(({ offset, radius }) => ({
  offset: offset.clone().applyAxisAngle(up, -axialRotation),
  radius,
}));
const pairReachSquared = (2 * moleculeRadius + margin) ** 2;
const atomA = new Vector3();
const atomB = new Vector3();
let minAtomGap = Infinity;
for (const gradient of ["equal", "outside"]) {
  model.update(0, { route: "water", gradient });
  const previousY = particles.map((p) => p.position.y);
  let inward = 0,
    outward = 0,
    lateIn = 0,
    lateOut = 0;
  const usedPores = new Set();
  for (let step = 0; step <= 2000; step++) {
    model.update(step / 2000, { route: "water", gradient });
    for (const [i, m] of particles.entries()) {
      const y = m.position.y;
      if (previousY[i] > 0 && y <= 0) {
        inward++;
        if (step / 2000 > 0.85) lateIn++;
        usedPores.add(m.position.x + "," + m.position.z);
      }
      if (previousY[i] < 0 && y >= 0) {
        outward++;
        if (step / 2000 > 0.85) lateOut++;
        usedPores.add(m.position.x + "," + m.position.z);
      }
      previousY[i] = y;
    }
    if (gradient === "equal") assert.equal(inward, outward);
    const reservoir = particles.filter(({ rotation }) => rotation.y === 0);
    for (let i = 0; i < reservoir.length; i++) {
      for (let j = i + 1; j < reservoir.length; j++) {
        assert(
          reservoir[i].position.distanceTo(reservoir[j].position) >
            2 * moleculeRadius + margin,
          "Water molecules overlap in the reservoir outside a transit",
        );
      }
    }
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        if (a.position.distanceToSquared(b.position) > pairReachSquared)
          continue;
        for (const left of uprightAtoms) {
          atomA
            .copy(left.offset)
            .applyAxisAngle(up, a.rotation.y)
            .add(a.position);
          for (const right of uprightAtoms) {
            atomB
              .copy(right.offset)
              .applyAxisAngle(up, b.rotation.y)
              .add(b.position);
            const gap = atomA.distanceTo(atomB) - left.radius - right.radius;
            minAtomGap = Math.min(minAtomGap, gap);
            assert(
              gap > margin,
              "Two water molecules intersect along their routes",
            );
          }
        }
      }
    }
    for (const { position, rotation } of particles) {
      const { x, y, z } = position;
      if (
        y + lower > channelBounds.max.y + margin ||
        y + upper < channelBounds.min.y - margin
      )
        continue;
      assert(
        Math.abs(y) <= axisHalfLength &&
          Math.abs(rotation.y - axialRotation) < 1e-8 &&
          poreCenters.some(
            ([px, pz]) => Math.abs(x - px) < 1e-8 && Math.abs(z - pz) < 1e-8,
          ),
        "An entry or exit bend reaches the aquaporin surface region",
      );
    }
  }
  assert.equal(usedPores.size, 4);
  assert.deepEqual([lateIn, lateOut], [4, 4]);
  assert.equal(inward - outward, gradient === "equal" ? 0 : 8);
  assert.equal(model.group.userData.netInward, inward - outward);
}
for (const route of ["water", "oxygen"]) {
  const equal = { route, gradient: "equal" };
  const exchange = resolveStageCopy(diffusion.stages[3], equal);
  assert.match(
    exchange.description.en,
    route === "water" ? /Water activity/ : /Oxygen concentrations/,
  );
  assert.match(
    exchange.description.zh,
    route === "water" ? /水活度/ : /氧浓度/,
  );
  assert.deepEqual(resolveStageCopy(diffusion.stages[4], equal).title, {
    zh: "动态平衡",
    en: "Dynamic equilibrium",
  });
  assert.equal(
    resolveStageCopy(diffusion.stages[3], { route, gradient: "outside" }),
    diffusion.stages[3],
  );
}
assert(Number.isFinite(minAtomGap));
console.log(
  `Aquaporin clearance PASS: all three atoms swept through four resolved pores with a ${margin} margin; closest sampled atom gap ${minAtomGap.toFixed(5)}. Both gradients had four inward and four outward late crossings.`,
);
