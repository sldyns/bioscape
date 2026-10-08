import { THREE, clamp } from "../../kit.js";

// All folds and surface motifs are schematic, not atomic coordinate models.
export function helix(k, parent, from, to, radius, turns, thickness, material) {
  const a = new THREE.Vector3(...from),
    b = new THREE.Vector3(...to),
    direction = b.clone().sub(a).normalize();
  const u = new THREE.Vector3(0, 0, 1);
  if (Math.abs(u.dot(direction)) > 0.9) u.set(1, 0, 0);
  u.cross(direction).normalize();
  const v = direction.clone().cross(u);
  const points = Array.from({ length: 65 }, (_, i) => {
    const t = i / 64,
      angle = t * turns * Math.PI * 2;
    return a
      .clone()
      .lerp(b, t)
      .addScaledVector(u, radius * Math.cos(angle))
      .addScaledVector(v, radius * Math.sin(angle))
      .toArray();
  });
  return k.tube(points, thickness, material, parent, 96);
}
export function beadInstances(k, parent, points, radius, material, name) {
  const mesh = new THREE.InstancedMesh(k.sphere, material, points.length),
    temp = new THREE.Object3D();
  mesh.name = name;
  points.forEach((p, i) => {
    temp.position.set(...p);
    temp.scale.setScalar(radius);
    temp.updateMatrix();
    mesh.setMatrixAt(i, temp.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  parent.add(mesh);
  return mesh;
}
export function bilayer(
  k,
  parent,
  { x0 = -3.8, x1 = 3.8, y = 0.92, z0 = -0.35, z1 = 0.3, skip = () => false },
) {
  const heads = [],
    tailMaterial = k.material("#c5b99a"),
    headMaterial = k.material("#a7bca6");
  const tails = [];
  for (let x = x0; x <= x1; x += 0.155)
    for (let z = z0; z <= z1; z += 0.155) {
      if (skip(x)) continue;
      for (const side of [-1, 1]) {
        heads.push([x, y + side * 0.17, z]);
        for (const dx of [-0.028, 0.028])
          tails.push([
            [x + dx, y + side * 0.125, z],
            [x + dx * 1.2, y + side * 0.025, z + 0.025],
          ]);
      }
    }
  beadInstances(
    k,
    parent,
    heads,
    0.062,
    headMaterial,
    "paired-phospholipid-headgroups",
  );
  const mesh = new THREE.InstancedMesh(k.cylinder, tailMaterial, tails.length),
    temp = new THREE.Object3D(),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  tails.forEach(([p, q], i) => {
    a.set(...p);
    b.set(...q).sub(a);
    temp.position.copy(a).addScaledVector(b, 0.5);
    temp.quaternion.setFromUnitVectors(up, b.clone().normalize());
    temp.scale.set(0.014, b.length(), 0.014);
    temp.updateMatrix();
    mesh.setMatrixAt(i, temp.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingBox();
  mesh.computeBoundingSphere();
  parent.add(mesh);
}
export function bacterialPolymerase(k, parent) {
  const g = new THREE.Group();
  g.name = "bacterial-RNA-polymerase-open-cleft-schematic";
  parent.add(g);
  const colors = ["#92a9ad", "#a9babe", "#7c999d"];
  const lobes = [
    [-0.28, 0.04, -0.1, 0.23, 0.35, 0.2],
    [0.28, 0.04, -0.1, 0.23, 0.33, 0.2],
    [0, 0.34, -0.14, 0.32, 0.17, 0.2],
    [0, -0.27, -0.15, 0.3, 0.14, 0.18],
    [-0.4, -0.16, -0.07, 0.12, 0.18, 0.14],
    [0.4, -0.12, -0.08, 0.13, 0.17, 0.14],
  ];
  lobes.forEach((l, i) =>
    k.ball(l.slice(0, 3), l.slice(3), k.material(colors[i % 3]), g),
  );
  for (let side of [-1, 1])
    for (let i = 0; i < 3; i++)
      helix(
        k,
        g,
        [side * 0.27, -0.14 + i * 0.12, 0.08],
        [side * 0.37, -0.03 + i * 0.12, 0.08],
        0.035,
        2,
        0.016,
        k.material("#c0cfce"),
      );
  k.ball([0, 0, 0.07], 0.048, k.material("#d0ad66"), g);
  return g;
}
export function transcriptionDetail(k, parent, { x0, x1, y, radius = 0.18 }) {
  const g = new THREE.Group();
  g.name = "antiparallel-DNA-and-nascent-RNA";
  parent.add(g);
  const railMats = [k.material("#7a9e9c"), k.material("#9d9fba")],
    baseMats = [k.material("#bdd0bc"), k.material("#cec6da")],
    rnaMat = k.material("#c79774");
  const n = 112,
    pairs = 42,
    rnaN = 48,
    temp = new THREE.Object3D(),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    c = new THREE.Vector3(),
    d = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  function inst(geo, mat, count, name) {
    const m = new THREE.InstancedMesh(geo, mat, count);
    m.name = name;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    g.add(m);
    return m;
  }
  const rails = railMats.map((m, i) =>
      inst(k.cylinder, m, n, `DNA-${i}-backbone`),
    ),
    phosphates = railMats.map((m, i) =>
      inst(k.sphere, m, pairs, `DNA-${i}-phosphates`),
    ),
    bases = baseMats.map((m, i) =>
      inst(k.cylinder, m, pairs, `DNA-${i}-bases`),
    );
  const rna = inst(k.cylinder, rnaMat, rnaN, "RNA-backbone"),
    rnaBases = inst(k.sphere, k.material("#dfbe94"), rnaN, "RNA-nucleotides");
  const polymerase = bacterialPolymerase(k, parent);
  function segment(mesh, i, start, end, r) {
    d.copy(end).sub(start);
    temp.position.copy(start).add(end).multiplyScalar(0.5);
    temp.quaternion.setFromUnitVectors(up, d.clone().normalize());
    temp.scale.set(r, Math.max(0.00001, d.length()), r);
    temp.updateMatrix();
    mesh.setMatrixAt(i, temp.matrix);
  }
  function bead(mesh, i, p, r) {
    temp.position.copy(p);
    temp.quaternion.identity();
    temp.scale.setScalar(r);
    temp.updateMatrix();
    mesh.setMatrixAt(i, temp.matrix);
  }
  function point(x, strand, center, opening, out) {
    const sign = strand ? 1 : -1,
      angle = (x - x0) * 10 + strand * Math.PI,
      w = opening * Math.max(0, 1 - Math.abs(x - center) / 0.5);
    out.set(
      x,
      y + (1 - w) * Math.sin(angle) * radius + w * sign * 0.24,
      -(1 - w) * Math.cos(angle) * radius + w * 0.1,
    );
    return out;
  }
  function rnaPoint(t, center, length, out) {
    const s = t * length;
    out.set(
      center - 0.68 * s,
      y + 0.1 + 0.62 * s + 0.07 * Math.sin(s * 6),
      0.2 + 0.12 * Math.sin(s * 4),
    );
    return out;
  }
  function update(center, opening, length, active) {
    opening = clamp(opening);
    polymerase.visible = active;
    polymerase.position.set(center, y + 0.02, 0.12);
    rna.visible = rnaBases.visible = length > 0;
    for (let strand = 0; strand < 2; strand++) {
      for (let i = 0; i < n; i++) {
        point(x0 + ((x1 - x0) * i) / n, strand, center, opening, a);
        point(x0 + ((x1 - x0) * (i + 1)) / n, strand, center, opening, b);
        segment(rails[strand], i, a, b, 0.029);
      }
      for (let i = 0; i < pairs; i++) {
        const x = x0 + ((x1 - x0) * (i + 0.5)) / pairs;
        point(x, strand, center, opening, a);
        point(x, 1 - strand, center, opening, b);
        bead(phosphates[strand], i, a, 0.041);
        c.copy(a).lerp(b, 0.46);
        const w = opening * Math.max(0, 1 - Math.abs(x - center) / 0.5);
        c.lerp(a, 0.7 * w);
        segment(bases[strand], i, a, c, 0.022);
      }
    }
    for (let i = 0; i < rnaN; i++) {
      rnaPoint(i / rnaN, center, length, a);
      rnaPoint((i + 1) / rnaN, center, length, b);
      segment(rna, i, a, b, 0.025);
      bead(rnaBases, i, b, 0.032);
    }
    for (const m of [...rails, ...phosphates, ...bases, rna, rnaBases]) {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingBox();
      m.computeBoundingSphere();
    }
  }
  update((x0 + x1) / 2, 0, 0, false);
  return { update, polymerase, group: g };
}
