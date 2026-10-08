import assert from "node:assert/strict";
import test from "node:test";
import { pathToFileURL } from "node:url";
import * as THREE from "three";
const models = process.env.RPP_BASELINE_MODELS
  ? await import(pathToFileURL(process.env.RPP_BASELINE_MODELS).href)
  : {
      assembly: (await import("./phageAssemblyProcess.js")).default,
      packaging: (await import("./phagePackagingProcess.js")).default,
    };
const effective = (object) => {
  for (let p = object; p; p = p.parent) if (!p.visible) return false;
  return true;
};
function surfaces(root) {
  const triangles = [];
  root.traverse((o) => {
    if (!o.isMesh || !effective(o)) return;
    const matrices = [];
    if (o.isInstancedMesh)
      for (let i = 0; i < o.count; i++) {
        const m = new THREE.Matrix4();
        o.getMatrixAt(i, m);
        matrices.push(o.matrixWorld.clone().multiply(m));
      }
    else matrices.push(o.matrixWorld);
    for (const matrix of matrices) {
      const a = o.geometry.attributes.position,
        index = o.geometry.index;
      const vertices = Array.from({ length: a.count }, (_, i) =>
        new THREE.Vector3().fromBufferAttribute(a, i).applyMatrix4(matrix),
      );
      for (let i = 0; i < (index?.count ?? a.count); i += 3)
        triangles.push(
          new THREE.Triangle(
            ...[0, 1, 2].map(
              (j) => vertices[index ? index.getX(i + j) : i + j],
            ),
          ),
        );
    }
  });
  return triangles;
}
function gateHits(scene, p, parameters) {
  scene.update(p, parameters);
  scene.group.updateMatrixWorld(true);
  const seal = scene.group.getObjectByName("gp14-seal-subunits").parent,
    center = seal.getWorldPosition(new THREE.Vector3()),
    triangles = surfaces(seal),
    point = new THREE.Vector3();
  return [0, 0.04, 0.08, 0.12].map((x) => {
    const ray = new THREE.Ray(
      new THREE.Vector3(center.x + x, center.y - 1, center.z),
      new THREE.Vector3(0, 1, 0),
    );
    return triangles.filter((t) => {
      const hit = ray.intersectTriangle(t.a, t.b, t.c, false, point);
      return hit && hit.distanceTo(ray.origin) < 1.5;
    }).length;
  });
}
for (const [id, p, parameters] of [
  ["assembly", 0.81, { protease: "active" }],
  ["packaging", 1, { atp: "present" }],
])
  test(`RPP-02: ${id} physically closes the pre-tail packaged-head neck`, () => {
    const scene = models[id].create();
    const hits = gateHits(scene, p, parameters);
    assert(
      hits.every((n) => n > 0),
      `${id} claims a sealed pre-tail neck but its channel is open: ${hits}`,
    );
  });
test("RPP-02: tail binding opens the gate, while inhibited assembly makes no seal", () => {
  const assembly = models.assembly.create(),
    packaging = models.packaging.create();
  for (const p of [0.955, 0.99, 1])
    assert(gateHits(assembly, p, { protease: "active" }).every((n) => n === 0));
  for (const [scene, parameters] of [
    [assembly, { protease: "inactive" }],
    [packaging, { atp: "absent" }],
  ])
    for (const p of [0.8, 0.95, 1]) {
      gateHits(scene, p, parameters);
      assert(
        !effective(scene.group.getObjectByName("gp14-seal-subunits")),
        "blocked condition must not acquire a neck seal",
      );
    }
});
test("RPP-02: the same six loops open continuously and seek without replacing geometry", () => {
  const scene = models.assembly.create(),
    loops = [];
  scene.group.traverse((o) => {
    if (o.name.startsWith("gp14-stopper-loop-")) loops.push(o);
  });
  assert.equal(loops.length, 6);
  const positions = () => {
    scene.group.updateMatrixWorld(true);
    return loops.flatMap((o) =>
      Array.from({ length: o.geometry.attributes.position.count }, (_, i) =>
        new THREE.Vector3()
          .fromBufferAttribute(o.geometry.attributes.position, i)
          .applyMatrix4(o.matrixWorld),
      ),
    );
  };
  for (const p of [0.94, 0.945, 0.955]) {
    scene.update(p - 1e-7);
    const before = positions();
    scene.update(p + 1e-7);
    const after = positions();
    assert(Math.max(...before.map((v, i) => v.distanceTo(after[i]))) < 1e-4);
  }
  const geometry = loops.map((o) => o.geometry),
    attributes = loops.map((o) => o.geometry.attributes.position.array);
  for (const p of [0, 0.51, 0.8, 0.93, 0.9425, 0.95, 0.955, 0.99, 1]) {
    scene.update(p, { protease: "active" });
    const expected = positions().map((v) => v.toArray());
    scene.update(0.99, { protease: "inactive" });
    scene.update(p, { protease: "active" });
    assert.deepEqual(
      positions().map((v) => v.toArray()),
      expected,
    );
    loops.forEach((o, i) => {
      assert.equal(o.geometry, geometry[i]);
      assert.equal(o.geometry.attributes.position.array, attributes[i]);
      assert(attributes[i].every(Number.isFinite));
    });
  }
});
