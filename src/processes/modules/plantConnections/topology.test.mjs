import assert from "node:assert/strict";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import pd from "./plasmodesmataProcess.js";
import photo from "./photorespirationProcess.js";
import carbon from "./c4camProcess.js";

const matrix = new THREE.Matrix4(),
  v = new THREE.Vector3();
const pore = pd.create(),
  membranes = [],
  collars = [];
pore.group.traverse((o) => {
  if (!o.isMesh) return;
  if (["86a99a", "a8bdae"].includes(o.material.color?.getHexString()))
    membranes.push(o);
  if (o.name.startsWith("wall-side-callose-collar-")) collars.push(o);
});
assert.equal(collars.length, 2);
assert(
  membranes.length >= 10,
  "check both pore leaflets, mouth lips and cell-facing PM",
);
let collarChecks = 0,
  minClearance = Infinity,
  minHeadClearance = Infinity;
for (const gate of ["open", "callose"])
  for (const p of [
    0,
    0.35,
    ...Array.from({ length: 13 }, (_, i) => 0.35 + (i / 12) * 0.25),
    0.8,
    1,
  ]) {
    pore.update(p, { gate });
    pore.group.updateMatrixWorld(true);
    for (const membrane of membranes) {
      if (membrane.geometry.boundsTree) membrane.geometry.boundsTree.refit();
      else membrane.geometry.boundsTree = new MeshBVH(membrane.geometry);
    }
    for (const collar of collars) {
      const tree = new MeshBVH(collar.geometry);
      const heads = pore.group.getObjectByName("pore-paired-headgroups");
      for (let i = 0; i < heads.count; i++) {
        heads.getMatrixAt(i, matrix);
        v.setFromMatrixPosition(matrix).applyMatrix4(heads.matrixWorld);
        collar.worldToLocal(v);
        const result = {};
        tree.closestPointToPoint(v, result);
        minHeadClearance = Math.min(minHeadClearance, result.distance - 0.022);
        assert(
          result.distance > 0.022,
          "callose intersects an actual lipid head sphere",
        );
      }
      for (const membrane of membranes) {
        matrix.copy(collar.matrixWorld).invert().multiply(membrane.matrixWorld);
        assert(
          !tree.intersectsGeometry(membrane.geometry, matrix),
          `callose intersects ${membrane.name || "cell PM"}, p=${p}, gate=${gate}`,
        );
        // Exact triangle proximity on representative open, mid and closed frames.
        if ([0, 0.475, 1].some((q) => Math.abs(p - q) < 1e-10)) {
          const result = {};
          tree.closestPointToGeometry(membrane.geometry, matrix, result);
          assert(result.distance > 0.009, "insufficient wall-side clearance");
          minClearance = Math.min(minClearance, result.distance);
        }
        collarChecks++;
      }
      // The complete collar stays wall-side of the outer PM slab at |x|=.99.
      const positions = collar.geometry.attributes.position;
      for (let i = 0; i < positions.count; i++) {
        v.fromBufferAttribute(positions, i).applyMatrix4(collar.matrixWorld);
        assert(Math.abs(v.x) <= 0.961);
      }
    }
  }
for (const gate of ["open", "callose"]) {
  pore.update(1, { gate });
  assert.equal(
    pore.group.userData.smallSoluteCompleted,
    gate === "open" ? 4 : 1,
  );
  assert.equal(pore.group.userData.largeUntargetedCargoPasses, false);
}
// Reconstruct the audited original collar/profile as a geometric negative control.
const oldCollar = new THREE.Mesh(new THREE.TorusGeometry(1.057, 0.52, 10, 56));
oldCollar.position.x = 1;
oldCollar.rotation.y = Math.PI / 2;
oldCollar.updateMatrixWorld(true);
const oldLeaflet = pore.group
  .getObjectByName("pore-cytosolic-leaflet")
  .geometry.clone();
const op = oldLeaflet.attributes.position;
for (let i = 0; i < op.count; i++) {
  const x = op.getX(i),
    r = 0.84 - 0.35 * (Math.abs(x) / 1.06) ** 5,
    radial = Math.hypot(op.getY(i), op.getZ(i));
  op.setXYZ(i, x, (op.getY(i) * r) / radial, (op.getZ(i) * r) / radial);
}
oldLeaflet.computeBoundingBox();
oldLeaflet.computeBoundingSphere();
assert(
  new MeshBVH(oldCollar.geometry).intersectsGeometry(
    oldLeaflet,
    oldCollar.matrixWorld.clone().invert(),
  ),
  "original collar must fail the same triangle nonintersection invariant",
);
oldCollar.geometry.dispose();
oldLeaflet.dispose();

let junctionChecks = 0;
function checkCristae(model, parameters) {
  const scene = model.create({ rootId: "plant" });
  scene.update(0.6, parameters);
  scene.group.updateMatrixWorld(true);
  const membrane = scene.group.getObjectByName(
    "inner-membrane-with-open-crista-junctions",
  );
  assert(
    membrane,
    "cristae must be an attached open inner membrane, not isolated neck cylinders",
  );
  const g = membrane.geometry,
    p = g.attributes.position,
    idx = g.index,
    { junctions, envelopeIndexCount } = g.userData;
  assert.equal(junctions.length, 5);
  const edges = new Map(),
    parent = Array.from({ length: p.count }, (_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const join = (a, b) => {
    parent[find(a)] = find(b);
  };
  for (let i = 0; i < idx.count; i += 3)
    for (let j = 0; j < 3; j++) {
      const a = idx.getX(i + j),
        b = idx.getX(i + ((j + 1) % 3)),
        key = a < b ? `${a}:${b}` : `${b}:${a}`;
      const edge = edges.get(key) || {
        count: 0,
        orientation: 0,
        envelope: 0,
        crista: 0,
        a,
        b,
      };
      edge.count++;
      edge.orientation += a < b ? 1 : -1;
      edge[i < envelopeIndexCount ? "envelope" : "crista"]++;
      edges.set(key, edge);
      join(a, b);
    }
  assert.equal(
    new Set(parent.map((_, i) => find(i))).size,
    1,
    "all actual membrane vertices must form one connected component",
  );
  for (const edge of edges.values()) {
    assert(edge.count <= 2, "non-manifold membrane edge");
    if (edge.count === 1) {
      assert(
        Math.abs(p.getZ(edge.a) - 0.014) < 1e-6 &&
          Math.abs(p.getZ(edge.b) - 0.014) < 1e-6,
        "unattached crista boundary away from intentional front cut",
      );
    } else
      assert.equal(edge.orientation, 0, "inconsistent surface orientation");
  }
  // Independent geometry bound: no crista vertex may reach the outer envelope.
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).sub(new THREE.Vector3(0, 0, 0.014));
    assert(
      v.length() <= 0.901,
      "crista crosses inner-envelope radius toward outer membrane",
    );
  }
  const localMesh = new THREE.Mesh(
    g,
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
  );
  localMesh.updateMatrixWorld(true);
  const tree = new MeshBVH(g, { indirect: true });
  assert(
    !tree.bvhcast(tree, new THREE.Matrix4(), {
      intersectsTriangles(a, b, ai, bi) {
        if (ai >= bi) return false;
        const ia = tree.resolveTriangleIndex(ai),
          ib = tree.resolveTriangleIndex(bi),
          av = [0, 1, 2].map((j) => idx.getX(ia * 3 + j)),
          bv = [0, 1, 2].map((j) => idx.getX(ib * 3 + j));
        if (av.some((id) => bv.includes(id))) return false;
        return a.intersectsTriangle(b);
      },
    }),
    "inner membrane/crista surface self-intersection",
  );
  for (const junction of junctions)
    for (const side of ["start", "end"]) {
      const ring = junction[side];
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i],
          b = ring[(i + 1) % ring.length],
          edge = edges.get(a < b ? `${a}:${b}` : `${b}:${a}`);
        assert.equal(edge.count, 2);
        assert.equal(
          edge.envelope,
          1,
          "junction must reuse an actual envelope edge",
        );
        assert.equal(
          edge.crista,
          1,
          "junction must reuse an actual crista edge",
        );
      }
      const center = ring
          .reduce(
            (sum, id) =>
              sum.add(new THREE.Vector3().fromBufferAttribute(p, id)),
            new THREE.Vector3(),
          )
          .divideScalar(ring.length),
        outward = center
          .clone()
          .sub(new THREE.Vector3(0, 0, 0.014))
          .normalize();
      const ray = new THREE.Raycaster(
        center.clone().addScaledVector(outward, -0.01),
        outward,
        0,
        0.25,
      );
      assert.equal(
        ray.intersectObject(localMesh).length,
        0,
        "junction lumen is blocked by an envelope triangle or end cap",
      );
      assert(
        Math.min(
          ...ring.map((id) =>
            new THREE.Vector3().fromBufferAttribute(p, id).distanceTo(center),
          ),
        ) > 0.02,
        "collapsed junction lumen",
      );
      junctionChecks++;
    }
  localMesh.material.dispose();
}
checkCristae(photo, { glyk: "active" });
checkCristae(photo, { glyk: "absent" });
checkCristae(carbon, { strategy: "cam" });
// The original central neck ends wholly inside the inner sphere; it cannot attach.
const oldNeck = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 16));
const base = -0.62 * Math.sqrt(1 - 0.04 ** 2),
  a = new THREE.Vector3(0.055, base, -0.12),
  b = new THREE.Vector3(0.055, base - 0.12, -0.13),
  direction = b.clone().sub(a);
oldNeck.position.copy(a).add(b).multiplyScalar(0.5);
oldNeck.scale.set(0.065, direction.length(), 0.065);
oldNeck.quaternion.setFromUnitVectors(
  new THREE.Vector3(0, 1, 0),
  direction.normalize(),
);
oldNeck.updateMatrixWorld(true);
let maxOld = 0;
for (let i = 0; i < oldNeck.geometry.attributes.position.count; i++) {
  v.fromBufferAttribute(oldNeck.geometry.attributes.position, i)
    .applyMatrix4(oldNeck.matrixWorld)
    .sub(new THREE.Vector3(0, 0, 0.014));
  maxOld = Math.max(maxOld, v.length());
}
assert(
  0.9 - maxOld > 0.13,
  "original detached central neck must fail surface attachment",
);
oldNeck.geometry.dispose();
console.log(
  "PASS 20261004-plantConnections-01/02/03: actual collar/PM triangles and lipid heads, old collision negative control, connected oriented inner membrane without self-intersection, open junction lumen and old detached-neck negative control",
  { collarChecks, minClearance, minHeadClearance, junctionChecks },
);
