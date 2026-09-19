import { THREE } from "../../kit.js";

// Functional molecular surfaces and secondary-structure traces, not atomic fits.
export function proteinDomain(k, parent, position, scale, material, phase = 0) {
  const geometry = new THREE.SphereGeometry(1, 32, 22);
  const a = geometry.attributes.position;
  for (let i = 0; i < a.count; i++) {
    const x = a.getX(i),
      y = a.getY(i),
      z = a.getZ(i);
    // An asymmetric cleft and shoulder form a domain, rather than a bead.
    const cleft =
      0.17 *
      Math.exp(-((x - 0.25) ** 2 * 10 + (y + 0.05) ** 2 * 6)) *
      Math.max(0, z);
    const shoulder = 1 + 0.07 * Math.sin(y * 4 + phase) + 0.05 * x * y;
    a.setXYZ(
      i,
      x * shoulder,
      y * (1 + 0.06 * Math.cos(x * 5 + phase)),
      z * shoulder - cleft,
    );
  }
  geometry.computeVertexNormals();
  const mesh = k.mesh(geometry, material, position, parent);
  mesh.scale.set(...scale);
  return mesh;
}

export function helix(
  k,
  parent,
  from,
  to,
  radius,
  turns,
  mat,
  thickness = 0.023,
) {
  const start = new THREE.Vector3(...from),
    end = new THREE.Vector3(...to),
    axis = end.clone().sub(start),
    unit = axis.clone().normalize();
  const side = new THREE.Vector3(0, 0, 1);
  if (Math.abs(unit.z) > 0.9) side.set(0, 1, 0);
  side.cross(unit).normalize();
  const other = unit.clone().cross(side).normalize();
  const points = [];
  for (let i = 0; i <= Math.max(32, turns * 16); i++) {
    const t = i / Math.max(32, turns * 16),
      a = t * Math.PI * 2 * turns;
    points.push(
      start
        .clone()
        .addScaledVector(axis, t)
        .addScaledVector(side, Math.cos(a) * radius)
        .addScaledVector(other, Math.sin(a) * radius)
        .toArray(),
    );
  }
  return k.tube(points, thickness, mat, parent, Math.max(64, turns * 24));
}

// A membrane cross section with an exposed wedge: paired leaflets, hydrocarbon
// core, and lipid tails on both cut edges. Axis is x; yz is the membrane plane.
export function annularBilayer(
  k,
  parent,
  { x, inner, outer, material, tailMaterial, cut = 0.8 },
) {
  const start = Math.PI + cut / 2,
    span = Math.PI * 2 - cut,
    half = 0.085;
  for (const face of [-1, 1]) {
    const m = k.mesh(
      new THREE.RingGeometry(inner, outer, 64, 1, start, span),
      material,
      [x + face * half, 0, 0],
      parent,
    );
    m.rotation.y = Math.PI / 2;
  }
  for (const theta of [start, start + span]) {
    const geometry = new THREE.BufferGeometry();
    const points = [];
    for (const [dx, r] of [
      [-half, inner],
      [-half, outer],
      [half, outer],
      [half, inner],
    ])
      points.push(x + dx, Math.sin(theta) * r, -Math.cos(theta) * r);
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(points, 3),
    );
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    geometry.computeVertexNormals();
    k.mesh(geometry, tailMaterial, [0, 0, 0], parent);
  }
  const headGeo = new THREE.SphereGeometry(1, 10, 8),
    tailGeo = new THREE.CylinderGeometry(1, 1, 1, 7),
    rows = 3,
    arc = 72,
    count = rows * arc * 2;
  const heads = new THREE.InstancedMesh(headGeo, material, count),
    tails = new THREE.InstancedMesh(tailGeo, tailMaterial, count * 2),
    obj = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0),
    axis = new THREE.Vector3(1, 0, 0);
  obj.quaternion.setFromUnitVectors(up, axis);
  let n = 0;
  for (const face of [-1, 1])
    for (let r = 0; r < rows; r++)
      for (let i = 0; i < arc; i++) {
        const theta = start + (span * (i + 0.5)) / arc,
          rad = inner + ((outer - inner) * (r + 0.5)) / rows,
          y = Math.sin(theta) * rad,
          z = -Math.cos(theta) * rad;
        obj.position.set(x + face * half, y, z);
        obj.scale.set(0.048, 0.048, 0.048);
        obj.updateMatrix();
        heads.setMatrixAt(n, obj.matrix);
        for (let twin = 0; twin < 2; twin++) {
          obj.position.set(x + face * 0.038, y + (twin - 0.5) * 0.042, z);
          obj.scale.set(0.014, 0.092, 0.014);
          obj.updateMatrix();
          tails.setMatrixAt(n * 2 + twin, obj.matrix);
        }
        n++;
      }
  heads.instanceMatrix.needsUpdate = true;
  tails.instanceMatrix.needsUpdate = true;
  heads.computeBoundingSphere();
  tails.computeBoundingSphere();
  parent.add(heads, tails);
  return { heads, tails };
}

export function molecularInventory(group) {
  const set = new Set();
  group.traverse((o) => {
    if (o.material) {
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        set.add(m);
    }
  });
  return [...set];
}
