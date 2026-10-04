import assert from "node:assert/strict";
import * as THREE from "three";
import plasmolysis from "./plasmolysisProcess.js";
import stomata from "./stomataProcess.js";
import xylem from "./plantLongDistanceTransportProcess.js";
import { ease } from "../../kit.js";

export function runWaterFluxRegression() {
  const plasma = plasmolysis.create({ rootId: "plant" });
  const gap = plasma.group.children.filter(
    (n) => n.name === "impermeant bath-gap solute",
  );
  const heads = plasma.group.getObjectByName("paired phospholipid headgroups");
  const wall = plasma.group.getObjectByName("fixed porous cell wall");
  const wallVertices = wall.geometry.attributes.position;
  let innerWall = Infinity;
  for (let i = 0; i < wallVertices.count; i++) {
    if (Math.abs(wallVertices.getY(i)) < 1.9)
      innerWall = Math.min(innerWall, Math.abs(wallVertices.getX(i)));
  }
  const membraneBox = new THREE.Box3();
  function gapClearance() {
    plasma.group.updateMatrixWorld(true);
    membraneBox.setFromObject(heads);
    const membraneEdge = Math.max(
      Math.abs(membraneBox.min.x),
      Math.abs(membraneBox.max.x),
    );
    return Math.min(
      ...gap
        .filter((n) => n.visible)
        .map((n) =>
          Math.min(
            Math.abs(n.position.x) - n.scale.x - membraneEdge,
            innerWall - Math.abs(n.position.x) - n.scale.x,
          ),
        ),
    );
  }
  let minimumGap = Infinity;
  assert.equal(gap.length, 12);
  for (const bath of ["recover", "hold"])
    for (let step = 0; step <= 400; step++) {
      plasma.update(step / 400, { bath });
      const clearance = gapClearance();
      assert(
        clearance > 0.02,
        `Bath solute touches membrane/wall at ${bath} ${step / 400}`,
      );
      minimumGap = Math.min(minimumGap, clearance);
    }
  plasma.update(0.325);
  gap.forEach((n) => {
    n.position.x = Math.sign(n.position.x) * 2.05;
  });
  assert(
    gapClearance() < 0,
    "Original fixed-x solutes must fail the actual membrane-silhouette check",
  );
  plasma.update(0);

  const guard = stomata.create({ rootId: "plant" });
  const ions = guard.group.children.filter(
    (n) => n.name.startsWith("guard-cell ") && n.name.endsWith("tracer"),
  );
  assert.equal(ions.length, 16);
  function eachCellHasBothIons() {
    return [-1, 1].every((side) => {
      const colors = new Set(
        ions
          .filter((n) => n.visible && Math.sign(n.position.x) === side)
          .map((n) => n.material.color.getHexString()),
      );
      return colors.has("baa574") && colors.has("a698b2");
    });
  }
  for (const signal of ["aba", "light"])
    for (const progress of [0.3, 0.36, 0.42, 0.7, 0.8, 0.86]) {
      guard.update(progress, { signal });
      if (!ions.some((n) => n.visible)) continue;
      assert(
        eachCellHasBothIons(),
        `Ion identities segregated by guard cell at ${signal} ${progress}`,
      );
      const positions = ions.map((n) => n.position.x);
      guard.update(progress + 1e-6, { signal });
      for (let i = 0; i < ions.length; i++) {
        const motion = Math.abs(ions[i].position.x) - Math.abs(positions[i]);
        if (Math.abs(motion) > 0.01) continue; // endpoint recycling is not transport direction
        assert(
          progress < 0.48 ? motion < 0 : motion > 0,
          "Wrong ion transport direction",
        );
      }
    }
  guard.update(0.36);
  const originalMaterials = ions.map((n) => n.material);
  const gold = ions.find(
    (n) => n.material.color.getHexString() === "baa574",
  ).material;
  const purple = ions.find(
    (n) => n.material.color.getHexString() === "a698b2",
  ).material;
  ions.forEach((n) => {
    n.material = n.position.x < 0 ? gold : purple;
  });
  assert(!eachCellHasBothIons(), "Original side-coupled ion colors must fail");
  ions.forEach((n, i) => {
    n.material = originalMaterials[i];
  });

  const tree = xylem.create({ rootId: "plant" });
  const vapor = tree.group.children.filter(
    (n) => n.name === "water-vapor tracer",
  );
  const wet = tree.group.getObjectByName("wet mesophyll wall film");
  const delivery = tree.group.getObjectByName(
    "liquid delivery through lateral pit to wet mesophyll wall",
  );
  const mesophyll = tree.group.children.filter(
    (n) => n.name === "mesophyll cell surface",
  );
  const guardCells = [
    tree.group.getObjectByName("upper leaf guard cell"),
    tree.group.getObjectByName("lower leaf guard cell"),
  ];
  const vessel = tree.group.children
    .filter((n) => n.name === "pitted lignified vessel wall, open lumen")
    .at(-1);
  assert.equal(vapor.length, 15);
  assert.equal(new Set(vapor.map((n) => n.material)).size, 15);
  tree.group.updateMatrixWorld(true);
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3(),
    closest = new THREE.Vector3(),
    triangle = new THREE.Triangle();
  function surfaceDistance(point, mesh) {
    const positions = mesh.geometry.attributes.position,
      index = mesh.geometry.index;
    let distance = Infinity;
    for (let i = 0; i < (index ? index.count : positions.count); i += 3) {
      a.fromBufferAttribute(positions, index ? index.getX(i) : i).applyMatrix4(
        mesh.matrixWorld,
      );
      b.fromBufferAttribute(
        positions,
        index ? index.getX(i + 1) : i + 1,
      ).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(
        positions,
        index ? index.getX(i + 2) : i + 2,
      ).applyMatrix4(mesh.matrixWorld);
      triangle.set(a, b, c).closestPointToPoint(point, closest);
      distance = Math.min(distance, point.distanceTo(closest));
    }
    return distance;
  }
  let maxBirthToWall = 0;
  for (let i = 0; i < vapor.length; i++) {
    tree.update((2 - i / 15 + 1e-8) / 4, { stomata: "open" });
    const birth = vapor[i].position;
    assert(
      surfaceDistance(birth, wet) < vapor[i].scale.x,
      "Vapor birth detached from actual wet-film surface",
    );
    const wallDistance = Math.min(
      ...mesophyll.map((n) => surfaceDistance(birth, n)),
    );
    maxBirthToWall = Math.max(maxBirthToWall, wallDistance);
    assert(
      wallDistance < 0.012,
      "Wet evaporation interface detached from mesophyll wall",
    );
    const oldBirth = new THREE.Vector3(
      1.25,
      2.36 + Math.sin(i * 2) * 0.1,
      0.15 + Math.cos(i) * 0.09,
    );
    assert(
      surfaceDistance(oldBirth, wet) > vapor[i].scale.x,
      "Legacy air-space birth must fail attachment",
    );
  }
  // The delivery mesh's last actual ring is centered on the wet surface.
  const vertices = delivery.geometry.attributes.position;
  const endRing = new THREE.Vector3();
  for (let i = vertices.count - 9; i < vertices.count - 1; i++)
    endRing.add(new THREE.Vector3().fromBufferAttribute(vertices, i));
  endRing.multiplyScalar(1 / 8).applyMatrix4(delivery.matrixWorld);
  assert(surfaceDistance(endRing, wet) < 0.05);
  assert(
    Math.min(...mesophyll.map((n) => surfaceDistance(endRing, n))) < 0.012,
  );
  let pitCrossings = 0,
    pitClearance = Infinity;
  const pathPoint = new THREE.Vector3();
  for (let step = 0; step <= 600; step++) {
    delivery.geometry.parameters.path.getPoint(step / 600, pathPoint);
    const radius = Math.hypot(pathPoint.x + 0.85, pathPoint.z);
    if (radius < 0.415 || radius > 0.52) continue;
    pitCrossings++;
    pitClearance = Math.min(
      pitClearance,
      surfaceDistance(pathPoint, vessel) - 0.025,
    );
  }
  assert(pitCrossings > 0);
  assert(
    pitClearance > 0,
    `Liquid delivery crosses lignified wall instead of pit: ${pitClearance}`,
  );

  let minPoreClearance = Infinity;
  for (const stomata of ["open", "close"])
    for (let step = 0; step <= 180; step++) {
      tree.update(0.14 + (step * 0.86) / 180, { stomata });
      tree.group.updateMatrixWorld(true);
      for (const n of vapor) {
        if (n.position.x < 2.75 || n.position.x > 3.56) continue;
        for (const cell of guardCells)
          assert(
            n.position
              .clone()
              .applyMatrix4(cell.matrixWorld.clone().invert())
              .length() > 1,
            "Vapor center lies inside a guard cell",
          );
        const clearance =
          Math.min(
            ...guardCells.map((cell) => surfaceDistance(n.position, cell)),
          ) - n.scale.x;
        minPoreClearance = Math.min(minPoreClearance, clearance);
        assert(
          clearance > 0,
          `Vapor intersects guard cells: ${stomata} ${step} ${clearance}`,
        );
      }
    }
  const nodes = [];
  tree.group.traverse((n) => nodes.push([n, n.geometry, n.material]));
  const state = () =>
    nodes.map(([n]) => [
      n.visible,
      ...n.position.toArray(),
      ...n.scale.toArray(),
      n.material?.opacity,
    ]);
  tree.update(0.7778, { stomata: "close" });
  const repeat = state();
  for (const p of [1, NaN, 0.32, -1, 0.96, 0.2])
    tree.update(p, { stomata: "open" });
  tree.update(0.7778, { stomata: "close" });
  assert.deepEqual(state(), repeat);
  for (const [n, geometry, material] of nodes) {
    assert.equal(n.geometry, geometry);
    assert.equal(n.material, material);
  }
  let lo = 0.65,
    hi = 0.85;
  for (let i = 0; i < 50; i++) {
    const p = (lo + hi) / 2;
    if (ease(p, 0.65, 0.85) < 0.7) lo = p;
    else hi = p;
  }
  const cutoff = (lo + hi) / 2;
  const weights = () => vapor.map((n) => (n.visible ? n.material.opacity : 0));
  tree.update(cutoff - 1e-7, { stomata: "close" });
  const before = weights();
  tree.update(cutoff + 1e-7, { stomata: "close" });
  const after = weights();
  assert(
    Math.max(...before.map((w, i) => Math.abs(w - after[i]))) < 1e-4,
    "Vapor cohort blinks during smooth closure",
  );
  for (const stomata of ["open", "close"]) {
    let previous = null;
    for (let step = 0; step <= 2000; step++) {
      tree.update(step / 2000, { stomata });
      const current = weights();
      assert(current.every((w) => Number.isFinite(w) && w >= 0 && w <= 1));
      if (previous)
        assert(
          Math.max(...current.map((w, i) => Math.abs(w - previous[i]))) < 0.09,
          "Unexpected opacity jump across full playback",
        );
      previous = current;
    }
  }
  const legacyWeight = (p, i) => (ease(p, 0.65, 0.85) < 0.7 || i < 3 ? 1 : 0);
  assert.equal(
    Math.max(
      ...vapor.map((_, i) =>
        Math.abs(
          legacyWeight(cutoff - 1e-7, i) - legacyWeight(cutoff + 1e-7, i),
        ),
      ),
    ),
    1,
  );
  // Every route recycling seam is invisible from both sides, including open flow.
  for (let i = 0; i < vapor.length; i++) {
    const p = (2 - i / 15) / 4;
    for (const offset of [-1e-7, 1e-7]) {
      tree.update(p + offset, { stomata: "open" });
      assert(weights()[i] < 1e-7);
    }
  }
  console.log(
    `plantWater flux PASS: bath-gap clearance ${minimumGap.toFixed(4)}, vapor/wall attachment ${maxBirthToWall.toFixed(4)}, pit clearance ${pitClearance.toFixed(4)}, pore clearance ${minPoreClearance.toFixed(4)}; both-ion guard-cell transport, continuous cohort/endpoint fading, deterministic resources, and legacy negative controls.`,
  );
}

runWaterFluxRegression();
