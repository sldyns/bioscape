import assert from "node:assert/strict";
import * as THREE from "three";
import stomata from "./stomataProcess.js";
import xylem from "./plantLongDistanceTransportProcess.js";
import chloroplast from "./chloroplastMovementProcess.js";

const point = new THREE.Vector3(),
  a = new THREE.Vector3(),
  b = new THREE.Vector3(),
  c = new THREE.Vector3(),
  closest = new THREE.Vector3();
const triangle = new THREE.Triangle(),
  transform = new THREE.Matrix4(),
  instance = new THREE.Matrix4();
function surfaceDistance(position, mesh) {
  mesh.updateWorldMatrix(true, false);
  point.fromArray(position);
  const vertices = mesh.geometry.attributes.position,
    index = mesh.geometry.index;
  let distance = Infinity;
  for (let item = 0; item < (mesh.isInstancedMesh ? mesh.count : 1); item++) {
    transform.copy(mesh.matrixWorld);
    if (mesh.isInstancedMesh) {
      mesh.getMatrixAt(item, instance);
      transform.multiply(instance);
    }
    for (let i = 0; i < (index ? index.count : vertices.count); i += 3) {
      a.fromBufferAttribute(vertices, index ? index.getX(i) : i).applyMatrix4(
        transform,
      );
      b.fromBufferAttribute(
        vertices,
        index ? index.getX(i + 1) : i + 1,
      ).applyMatrix4(transform);
      c.fromBufferAttribute(
        vertices,
        index ? index.getX(i + 2) : i + 2,
      ).applyMatrix4(transform);
      triangle.set(a, b, c).closestPointToPoint(point, closest);
      distance = Math.min(distance, point.distanceTo(closest));
    }
  }
  return distance;
}
function namedAll(group, name) {
  const nodes = [];
  group.traverse((n) => {
    if (n.name === name) nodes.push(n);
  });
  return nodes;
}
function assertOnSurface(label, mesh, description) {
  assert(surfaceDistance(label.position, mesh) < 1e-6, description);
}
const samples = [
  0, 0.12, 0.14, 0.21, 0.275, 0.475, 0.48, 0.635, 0.66, 0.705, 0.875, 0.915,
  0.93, 1,
];

const guard = stomata.create({ rootId: "plant" });
const guardBodies = namedAll(
  guard.group,
  "guard cell wall and intact membrane",
);
const guardWalls = namedAll(guard.group, "thick pore-facing wall");
const guardVacuoles = namedAll(guard.group, "guard cell vacuole");
const ions = guard.group.children.filter(
  (n) => n.name.startsWith("guard-cell ") && n.name.endsWith("tracer"),
);
for (const signal of ["aba", "light"])
  for (const p of samples) {
    guard.update(p, { signal });
    assertOnSurface(
      guard.labels[0],
      guardBodies[0],
      "Guard-cell context anchor misses actual guard cell",
    );
    assertOnSurface(
      guard.labels[2],
      guardWalls[1],
      "Thick-wall leader misses deformed pore-facing wall",
    );
    assertOnSurface(
      guard.labels[3],
      guardBodies[0],
      "Ion flux-region leader misses actual membrane crossing",
    );
    assertOnSurface(
      guard.labels[4],
      guardVacuoles[1],
      "Vacuolar-water leader misses vacuole",
    );
    assert.equal(
      guard.labels[3].active,
      ions.some((n) => n.visible),
      "Ion label remains after tracers disappear",
    );
    for (const [label, type] of [
      [guard.labels[5], "ConeGeometry"],
      [guard.labels[6], "IcosahedronGeometry"],
    ]) {
      const icon = guard.group.children.find((n) => n.geometry?.type === type);
      assert.equal(label.active, icon.visible);
      assert(
        new THREE.Vector3()
          .fromArray(label.position)
          .distanceTo(icon.getWorldPosition(new THREE.Vector3())) < 1e-9,
      );
    }
  }
guard.update(0.475);
assert(
  surfaceDistance([1.35, -2.15, 0.6], guardWalls[1]) > 0.1,
  "Legacy thick-wall offset must fail",
);
guard.update(0);
assert(!guard.labels[3].active);

const tree = xylem.create({ rootId: "plant" });
const column = tree.group.getObjectByName("continuous liquid water column");
const wet = tree.group.getObjectByName("wet mesophyll wall film");
const rootCell = tree.group.getObjectByName("root cortical cell");
const top = tree.group.getObjectByName("upper leaf guard cell"),
  bottom = tree.group.getObjectByName("lower leaf guard cell");
for (const stomata of ["open", "close"])
  for (const p of samples) {
    tree.update(p, { stomata });
    assertOnSurface(
      tree.labels[0],
      rootCell,
      "Root region leader points into soil instead of root tissue",
    );
    assertOnSurface(
      tree.labels[1],
      column,
      "Continuous-liquid leader misses water column",
    );
    assertOnSurface(tree.labels[2], wet, "Wet-wall leader misses actual film");
    const outlet = new THREE.Vector3().fromArray(tree.labels[4].position);
    assert(
      Math.abs(outlet.x - (top.position.x + bottom.position.x) / 2) < 1e-9,
    );
    assert(
      Math.abs(outlet.y - (top.position.y + bottom.position.y) / 2) < 1e-9,
    );
    for (const cell of [top, bottom]) {
      cell.updateWorldMatrix(true, false);
      assert(
        outlet
          .clone()
          .applyMatrix4(cell.matrixWorld.clone().invert())
          .length() > 1,
        "Outlet region is inside guard cell",
      );
    }
  }
assert(
  surfaceDistance([-1.6, -0.2, 0.7], column) > 0.1,
  "Legacy liquid leader must fail",
);
assert(
  surfaceDistance([0.45, 3.9, 0.6], wet) > 0.1,
  "Legacy wet-wall leader must fail",
);

const photo = chloroplast.create({ rootId: "plant" });
const plastids = photo.group.children.filter((n) =>
  n.name.startsWith("chloroplast cutaway:"),
);
const grana = plastids[14].getObjectByName(
  "three grana, five flattened thylakoids each",
);
const membrane = photo.group.getObjectByName("cell plasma membrane boundary");
const vacuole = photo.group.getObjectByName("central vacuole");
const floor = photo.group.children.find(
  (n) => n.geometry?.type === "PlaneGeometry",
);
const ray = photo.group.children.find(
  (n) =>
    n.type === "Group" &&
    n.children.some((m) => m.geometry?.type === "ConeGeometry"),
);
let moved = false;
for (const genotype of ["wild", "phot2"]) {
  photo.update(0, { genotype });
  const start = [...photo.labels[4].position];
  for (const p of samples) {
    photo.update(p, { genotype });
    assertOnSurface(
      photo.labels[1],
      floor,
      "Periclinal region misses actual floor plane",
    );
    assertOnSurface(
      photo.labels[2],
      membrane,
      "Anticlinal region lies beyond actual membrane wall",
    );
    assertOnSurface(
      photo.labels[3],
      vacuole,
      "Vacuole anchor misses its surface",
    );
    assertOnSurface(
      photo.labels[4],
      grana,
      "Moving chloroplast label misses actual granum surface",
    );
    const arrowAnchor = new THREE.Vector3(0, -0.55, 0);
    ray.localToWorld(arrowAnchor);
    assert(
      arrowAnchor.distanceTo(
        new THREE.Vector3().fromArray(photo.labels[0].position),
      ) < 1e-9,
    );
    if (
      new THREE.Vector3()
        .fromArray(start)
        .distanceTo(new THREE.Vector3().fromArray(photo.labels[4].position)) > 1
    )
      moved = true;
  }
}
assert(moved, "Chloroplast annotation never follows relocation");
photo.update(0.375);
assert(
  surfaceDistance([-2.55, -1.8, 1.6], grana) > 1,
  "Legacy fixed cortical annotation must fail",
);
for (const [model, params] of [
  [guard, { signal: "aba" }],
  [tree, { stomata: "close" }],
  [photo, { genotype: "wild" }],
]) {
  model.update(0.705, params);
  const snapshot = JSON.stringify(model.labels);
  for (const p of [1, 0, 0.375, 0.915, 0.145]) model.update(p, params);
  model.update(0.705, params);
  assert.equal(
    JSON.stringify(model.labels),
    snapshot,
    "Label anchors/visibility depend on seek history",
  );
}
console.log(
  "plantWater rendered-label PASS: actual deforming wall/vacuole/column/film/granum triangle contact, root/outlet region placement, ion/icon visibility, both branches, deterministic seeks and legacy offset failures.",
);
