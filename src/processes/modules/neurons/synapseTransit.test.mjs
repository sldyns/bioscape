import assert from "node:assert/strict";
import test from "node:test";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import synapse from "./synapseProcess.js";

// Bake only the rendered solid triangles. The open gate is excluded by actual
// visibility, not by a metadata assertion about channel state.
function solidTree(root) {
  const vertices = [],
    point = new THREE.Vector3();
  root.traverseVisible((mesh) => {
    if (!mesh.isMesh || mesh.isInstancedMesh) return;
    const geometry = mesh.geometry,
      positions = geometry.attributes.position,
      indices = geometry.index,
      start = geometry.drawRange.start,
      end = Math.min(
        start + geometry.drawRange.count,
        indices ? indices.count : positions.count,
      );
    for (let i = start; i < end; i++) {
      point
        .fromBufferAttribute(positions, indices ? indices.getX(i) : i)
        .applyMatrix4(mesh.matrixWorld);
      vertices.push(point.x, point.y, point.z);
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  return new MeshBVH(geometry);
}

function sweptSphereClear(tree, a, b, radius) {
  const segment = new THREE.Line3(a, b),
    bounds = new THREE.Box3().setFromPoints([a, b]).expandByScalar(radius);
  return !tree.shapecast({
    intersectsBounds: (box) => box.intersectsBox(bounds),
    intersectsTriangle: (triangle) =>
      triangle.closestPointToSegment(segment) < radius - 1e-6,
  });
}

function lipidBounds(scene) {
  const result = [],
    matrix = new THREE.Matrix4(),
    center = new THREE.Vector3(),
    scale = new THREE.Vector3(),
    rotation = new THREE.Quaternion();
  for (const mesh of scene.group.children) {
    if (!mesh.isInstancedMesh || !mesh.name.startsWith("paired ")) continue;
    mesh.geometry.computeBoundingSphere();
    for (let i = 0; i < mesh.count; i++) {
      mesh.getMatrixAt(i, matrix);
      matrix.premultiply(mesh.matrixWorld).decompose(center, rotation, scale);
      result.push({
        center: center.clone(),
        radius:
          mesh.geometry.boundingSphere.radius * Math.max(...scale.toArray()),
      });
    }
  }
  return result;
}

function fullRadius(mesh) {
  mesh.geometry.computeBoundingSphere();
  return (
    mesh.geometry.boundingSphere.radius * Math.max(...mesh.scale.toArray())
  );
}

test("presynaptic calcium crosses the open aqueous pore with full marker clearance", () => {
  const scene = synapse.create(),
    channel = scene.group.getObjectByName("four-domain transmembrane pore"),
    ions = scene.group.children.filter(
      (o) =>
        o.isMesh &&
        o.scale.x === 0.068 &&
        o.material?.color.getHexString() === "a59ac0",
    );
  assert.equal(ions.length, 5);
  scene.update(0.3);
  scene.group.updateMatrixWorld(true);
  const openTree = solidTree(channel),
    lipids = lipidBounds(scene);
  scene.update(0);
  scene.group.updateMatrixWorld(true);
  const closedTree = solidTree(channel);
  let poses = 0,
    minClearance = Infinity;
  for (const calcium of ["available", "blocked"]) {
    let previous = null;
    const progress = [
      0,
      ...Array.from({ length: 365 }, (_, i) => 0.219 + i * 0.0005),
      1,
    ];
    for (const p of progress) {
      scene.update(p, { calcium });
      scene.group.updateMatrixWorld(true);
      const open = scene.group.userData.calciumInflux,
        tree = open ? openTree : closedTree,
        centers = ions.map((ion) => ion.getWorldPosition(new THREE.Vector3()));
      for (const [i, ion] of ions.entries()) {
        if (calcium === "blocked") assert.equal(ion.visible, false);
        if (!ion.visible) continue;
        const center = centers[i],
          radius = fullRadius(ion),
          clearance = tree.closestPointToPoint(center).distance - radius;
        minClearance = Math.min(minClearance, clearance);
        assert.ok(
          clearance > 1e-4,
          `calcium ${i} intersects channel protein at p=${p}: ${clearance}`,
        );
        for (const lipid of lipids)
          assert.ok(
            center.distanceTo(lipid.center) > radius + lipid.radius,
            "calcium crosses lipid rather than pore",
          );
        if (previous?.open === open && previous.visible[i]) {
          assert.ok(
            sweptSphereClear(tree, previous.centers[i], center, radius),
            `calcium ${i} swept volume crosses protein between frames at p=${p}`,
          );
          assert.ok(
            center.y >= previous.centers[i].y - 1e-10,
            "calcium influx must point into presynaptic cytosol",
          );
        }
      }
      previous = { centers, open, visible: ions.map((ion) => ion.visible) };
      poses++;
    }
  }
  for (const p of [0.3, 0.339, 0.365, 0.392]) {
    scene.update(p);
    const expected = ions.map((ion) => [
      ion.visible,
      ...ion.position.toArray(),
    ]);
    scene.update(0.98, { calcium: "blocked" });
    scene.update(0.01);
    scene.update(p);
    assert.deepEqual(
      ions.map((ion) => [ion.visible, ...ion.position.toArray()]),
      expected,
    );
  }
  console.log(
    `synaptic calcium transit: ${poses} poses; whole-sphere and swept-triangle minimum clearance ${minClearance.toFixed(6)}`,
  );
});

test("all glutamate markers exit through the aqueous fusion neck and retain downstream targets", () => {
  const scene = synapse.create(),
    docked = scene.group.getObjectByName("docked vesicle cutaway"),
    fused = scene.group.getObjectByName("fused vesicle cutaway"),
    molecules = Array.from({ length: 20 }, (_, i) =>
      scene.group.getObjectByName(`glutamate ${i}`),
    );
  scene.group.updateMatrixWorld(true);
  const dockTree = solidTree(docked),
    lipids = lipidBounds(scene);
  scene.update(0.4);
  scene.group.updateMatrixWorld(true);
  const fusedTree = solidTree(fused),
    contour = fused.children.filter(
      (o) => o.geometry?.type === "LatheGeometry",
    )[1].geometry.parameters.points;
  function lumenRadius(y) {
    if (y > contour.at(-1).y) return -1;
    for (let i = 1; i < contour.length; i++) {
      if (y <= contour[i].y) {
        const a = contour[i - 1],
          b = contour[i],
          t = (y - a.y) / (b.y - a.y);
        return a.x + (b.x - a.x) * t;
      }
    }
    return 0;
  }
  const progress = [
    ...new Set([
      0,
      0.2,
      0.379999,
      0.38,
      ...Array.from({ length: 401 }, (_, i) => 0.38 + i * 0.0005),
      ...Array.from({ length: 43 }, (_, i) => 0.58 + i * 0.01),
    ]),
  ].sort((a, b) => a - b);
  let poses = 0,
    vertices = 0,
    minClearance = Infinity;
  const vertex = new THREE.Vector3();
  for (const calcium of ["available", "blocked"]) {
    let previous = null;
    for (const p of progress) {
      scene.update(p, { calcium });
      scene.group.updateMatrixWorld(true);
      const isFused = fused.visible,
        tree = isFused ? fusedTree : dockTree,
        centers = molecules.map((m) => m.getWorldPosition(new THREE.Vector3()));
      for (const [i, molecule] of molecules.entries()) {
        const center = centers[i],
          radius = fullRadius(molecule),
          clearance = tree.closestPointToPoint(center).distance - radius;
        minClearance = Math.min(minClearance, clearance);
        assert.ok(
          clearance > 1e-4,
          `glutamate ${i} intersects vesicle membrane at p=${p}: ${clearance}`,
        );
        if (previous?.isFused === isFused)
          assert.ok(
            sweptSphereClear(tree, previous.centers[i], center, radius),
            `glutamate ${i} swept volume crosses membrane at p=${p}`,
          );
        for (const lipid of lipids)
          assert.ok(
            center.distanceTo(lipid.center) > radius + lipid.radius,
            `glutamate ${i} intersects pre/post membrane lipids at p=${p}`,
          );
        if (calcium === "blocked") assert.ok(center.y > 0.55 + radius);
        if (isFused) {
          const pos = molecule.geometry.attributes.position;
          for (let j = 0; j < pos.count; j++) {
            vertex
              .fromBufferAttribute(pos, j)
              .applyMatrix4(molecule.matrixWorld);
            if (vertex.y >= contour[0].y)
              assert.ok(
                Math.hypot(vertex.x, vertex.z) < lumenRadius(vertex.y) + 1e-6,
                `glutamate ${i} exits via the cutaway or vesicle wall at p=${p}`,
              );
            vertices++;
          }
        }
        assert.ok(
          center.y - radius > -0.88,
          "transmitter must not enter the postsynaptic dendrite",
        );
      }
      previous = { isFused, centers };
      poses++;
    }
  }
  for (const p of [0.44, 0.467, 0.54, 0.7, 0.835, 0.98]) {
    scene.update(p);
    const expected = molecules.map((m) => m.position.toArray());
    scene.update(0.98, { calcium: "blocked" });
    scene.update(0.01);
    scene.update(p);
    assert.deepEqual(
      molecules.map((m) => m.position.toArray()),
      expected,
    );
  }
  console.log(
    `synaptic glutamate transit: ${poses} poses, ${vertices} full marker vertices; minimum membrane clearance ${minClearance.toFixed(6)}`,
  );
});
