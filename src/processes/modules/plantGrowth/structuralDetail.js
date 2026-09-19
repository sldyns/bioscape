import { THREE } from "../../kit.js";
// Schematic mesoscale structures, not atomically fitted coordinates.
const vesicleResources = new WeakMap();
export function beads(k, parent, points, radius, mat, name) {
  const mesh = new THREE.InstancedMesh(k.sphere, mat, points.length);
  mesh.name = name;
  const pose = new THREE.Object3D();
  points.forEach((p, i) => {
    pose.position.set(...p);
    pose.scale.setScalar(radius);
    pose.updateMatrix();
    mesh.setMatrixAt(i, pose.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  parent.add(mesh);
  return mesh;
}
export function vesicle(k, material, cargoMaterial) {
  const g = new THREE.Group();
  k.group.add(g);
  g.name = "Cutaway vesicle with lumen and paired membrane rims";
  if (!vesicleResources.has(k))
    vesicleResources.set(k, {
      shell: new THREE.SphereGeometry(
        1,
        20,
        14,
        Math.PI * 0.18,
        Math.PI * 1.64,
        0,
        Math.PI,
      ),
      rim: new THREE.TorusGeometry(0.82, 0.07, 8, 24),
    });
  const { shell, rim } = vesicleResources.get(k);
  k.mesh(shell, material, [0, 0, 0], g);
  for (const z of [0.48, 0.56]) k.mesh(rim, material, [0, 0, z], g);
  for (const p of [
    [-0.27, 0.1, 0.38],
    [0.28, -0.15, 0.33],
    [0, 0.3, 0.29],
  ])
    k.ball(p, 0.19, cargoMaterial, g);
  return g;
}
export function chromatid(k, mat) {
  const g = new THREE.Group();
  k.group.add(g);
  g.name = "Condensed looped chromatin chromatid";
  const points = [];
  for (let j = 0; j <= 160; j++) {
    const t = j / 160,
      a = t * Math.PI * 22,
      r = 0.065 * (0.52 + 0.48 * Math.abs(2 * t - 1));
    points.push([r * Math.cos(a), -0.37 + 0.74 * t, r * Math.sin(a)]);
  }
  k.tube(points, 0.026, mat, g, 192);
  const chromatin = [];
  for (let j = 0; j < 66; j++) {
    const t = j / 65,
      a = t * Math.PI * 22,
      r = 0.07 * (0.52 + 0.48 * Math.abs(2 * t - 1));
    chromatin.push([r * Math.cos(a), -0.37 + 0.74 * t, r * Math.sin(a)]);
  }
  beads(k, g, chromatin, 0.032, mat, "Chromatin packing domains");
  for (const side of [-1, 1]) {
    const attachment = k.ball(
      [side * 0.065, 0, 0.015],
      [0.037, 0.07, 0.065],
      k.material("#b4a8bf"),
      g,
    );
    attachment.name = "Kinetochore attachment domain";
  }
  return g;
}
export function microtubule(k, mat) {
  const g = new THREE.Group();
  k.group.add(g);
  g.name = "Phragmoplast microtubule protofilament cylinder";
  const pts = [];
  for (let f = 0; f < 8; f++)
    for (let j = 0; j < 18; j++) {
      const a = (f * Math.PI) / 4;
      pts.push([Math.cos(a) * 0.021, -0.43 + j * 0.05, Math.sin(a) * 0.021]);
    }
  beads(k, g, pts, 0.0105, mat, "Tubulin subunits on a hollow cylinder");
  return g;
}
export function leafletEdge(k, parent, mat) {
  const heads = [];
  for (const z of [-0.085, 0.085])
    for (let i = 0; i <= 50; i++)
      for (const y of [-1.97, 1.97]) heads.push([-2.5 + i * 0.1, y, z]);
  beads(k, parent, heads, 0.042, mat, "Paired membrane leaflet cut edges");
  const tails = k.material("#c7bea0");
  for (let i = 0; i <= 50; i++)
    for (const y of [-1.97, 1.97])
      for (const dx of [-0.014, 0.014])
        k.segment(
          [-2.5 + i * 0.1 + dx, y, -0.05],
          [-2.5 + i * 0.1 + dx, y, 0.05],
          0.009,
          tails,
          parent,
        );
}
