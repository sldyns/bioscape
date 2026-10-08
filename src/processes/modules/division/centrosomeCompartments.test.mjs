import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";
import mitosis from "./mitosisProcess.js";
import meiosis from "./meiosisProcess.js";
const definitions = process.env.BIOSCAPE_CENTROSOME_BASELINE
  ? await Promise.all(
      ["mitosis", "meiosis"].map(
        async (id) =>
          (
            await import(
              pathToFileURL(
                resolve(
                  process.env.BIOSCAPE_CENTROSOME_BASELINE,
                  `${id}.tdv01-before.mjs`,
                ),
              )
            )
          ).default,
      ),
    )
  : [mitosis, meiosis];
const named = (group, name) => {
  const result = [];
  group.traverse((o) => {
    if (o.name === name) result.push(o);
  });
  return result;
};
const vector = new THREE.Vector3(),
  matrix = new THREE.Matrix4(),
  inverse = new THREE.Matrix4(),
  ray = new THREE.Ray(new THREE.Vector3(), new THREE.Vector3(0, 0, -1));
let nuclearMinimum = Infinity,
  plasmaMinimum = Infinity,
  vertexChecks = 0,
  pathChecks = 0;
for (const definition of definitions) {
  const scene = definition.create(),
    poles = named(scene.group, "centrosome-with-orthogonal-centriole-triplets"),
    nuclei = named(scene.group, "nuclear-envelope-paired-membranes-cutaway"),
    fibres = named(scene.group, "kinetochore-microtubule-bundle");
  const vertices = poles.map((pole) => {
    const scale = pole.scale.clone();
    pole.scale.setScalar(1);
    scene.group.updateMatrixWorld(true);
    inverse.copy(pole.matrixWorld).invert();
    const result = [];
    pole.traverse((o) => {
      if (!o.geometry) return;
      const a = o.geometry.attributes.position;
      for (
        let instance = 0;
        instance < (o.isInstancedMesh ? o.count : 1);
        instance++
      ) {
        if (o.isInstancedMesh) {
          o.getMatrixAt(instance, matrix);
          matrix.premultiply(o.matrixWorld);
        } else matrix.copy(o.matrixWorld);
        matrix.premultiply(inverse);
        for (let i = 0; i < a.count; i++) {
          vector.fromBufferAttribute(a, i).applyMatrix4(matrix);
          result.push(vector.x, vector.y, vector.z);
        }
      }
    });
    pole.scale.copy(scale);
    return new Float64Array(result);
  });
  const poses = [
    1,
    0,
    ...Array.from({ length: 51 }, (_, i) => i / 50),
    ...Array.from({ length: 29 }, (_, i) => 0.72 + i * 0.01),
    0.54999,
    0.58001,
    0.61999,
    0.62001,
    0.86999,
    0.87001,
    0.92999,
    0.93001,
    0.93999,
    0.94001,
  ];
  for (const parameters of definition.id === "mitosis"
    ? [{ attachment: "normal" }, { attachment: "unattached" }]
    : [{}])
    for (const [index, p] of poses.entries()) {
      if (index % 17 === 0) {
        scene.update(0.975);
        scene.update(0.143, { attachment: "unattached" });
      }
      scene.update(p, parameters);
      scene.group.updateMatrixWorld(true);
      const activeNuclei = nuclei.filter((n) => n.visible),
        walls = [];
      scene.group.traverse((o) => {
        if (
          o.name === "germ-cell-inner-leaflet" ||
          (o.name === "membrane-inner-leaflet" && o.parent.visible)
        )
          walls.push(o);
      });
      const surfaces = walls.map((w) => ({
        mesh: w,
        bvh: new MeshBVH(w.geometry.clone(), { indirect: true }),
      }));
      for (const [pi, pole] of poles.entries()) {
        if (!pole.visible || pole.scale.x < 1e-8) continue;
        const a = vertices[pi];
        for (let i = 0; i < a.length; i += 3) {
          const world = new THREE.Vector3()
            .fromArray(a, i)
            .applyMatrix4(pole.matrixWorld);
          for (const nucleus of activeNuclei) {
            const radius = nucleus.worldToLocal(world.clone()).length();
            nuclearMinimum = Math.min(nuclearMinimum, radius);
            assert(
              radius > 1,
              `${definition.id} ${parameters.attachment ?? ""} p=${p} centrosome ${pi} enters nuclear envelope: radius=${radius}`,
            );
          }
          let clearance = -Infinity;
          for (const { mesh, bvh } of surfaces) {
            const local = mesh.worldToLocal(world.clone());
            ray.origin.set(local.x, local.y, 0.2);
            const hit = bvh.raycastFirst(ray, THREE.DoubleSide);
            if (hit)
              clearance = Math.max(clearance, -Math.abs(local.z) - hit.point.z);
          }
          plasmaMinimum = Math.min(plasmaMinimum, clearance);
          assert(
            clearance > 0,
            `${definition.id} ${parameters.attachment ?? ""} p=${p} centrosome ${pi} exits actual inner plasma membrane: clearance=${clearance}, vertex=${world.toArray()}`,
          );
          vertexChecks++;
        }
      }
      fibres.forEach((f, fi) => {
        if (!f.visible) return;
        f.getMatrixAt(0, matrix);
        vector.set(0, -0.5, 0).applyMatrix4(matrix).applyMatrix4(f.matrixWorld);
        const pole =
          definition.id === "mitosis"
            ? poles[fi % 2]
            : p < 0.55
              ? poles[Math.floor((fi % 4) / 2)]
              : poles[2 + (fi % 4)];
        assert(
          vector.distanceTo(pole.getWorldPosition(new THREE.Vector3())) < 1e-6,
          "microtubule start must follow its settling centrosome",
        );
        pathChecks++;
      });
      for (const { bvh } of surfaces) bvh.geometry.dispose();
    }
  for (const boundary of definition.id === "mitosis"
    ? [0.73, 0.8, 0.83, 0.84, 0.87, 0.94]
    : [0.55, 0.58, 0.63, 0.8, 0.86, 0.87, 0.9, 0.91, 0.93, 0.94, 0.98]) {
    scene.update(boundary - 1e-6);
    const before = poles.map((p) => [p.position.clone(), p.scale.clone()]);
    scene.update(boundary + 1e-6);
    poles.forEach((p, i) => {
      assert(
        p.position.distanceTo(before[i][0]) < 0.0001,
        "settling centre must be continuous",
      );
      assert(
        p.scale.distanceTo(before[i][1]) < 0.0001,
        "centrosome size must be continuous",
      );
    });
  }
}
console.log(
  `Centrosome compartments PASS: ${vertexChecks} actual vertices outside complete nuclear envelope and inside actual plasma leaflets, ${pathChecks} attached bundle starts; minimum nuclear radius=${nuclearMinimum}, plasma clearance=${plasmaMinimum}; normal/arrested mitosis, meiosis and reverse seeks`,
);
