import { THREE } from "../../kit.js";

// Repeated secondary structures are pedagogical folds, not atomic coordinates.
export function molecularDetail(k) {
  const sphere = new THREE.SphereGeometry(1, 16, 12),
    sugar = new THREE.IcosahedronGeometry(1, 0),
    base = new THREE.BoxGeometry(1, 1, 1);
  const coilPoints = [];
  for (let i = 0; i <= 80; i++) {
    const t = i / 80,
      a = t * Math.PI * 10;
    coilPoints.push(
      new THREE.Vector3(0.11 * Math.cos(a), t - 0.5, 0.11 * Math.sin(a)),
    );
  }
  const helix = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(coilPoints),
    80,
    0.035,
    6,
    false,
  );
  const arrow = new THREE.Shape();
  arrow.moveTo(-0.085, -0.5);
  arrow.lineTo(0.085, -0.5);
  arrow.lineTo(0.085, 0.22);
  arrow.lineTo(0.15, 0.22);
  arrow.lineTo(0, 0.5);
  arrow.lineTo(-0.15, 0.22);
  arrow.lineTo(-0.085, 0.22);
  arrow.closePath();
  const sheet = new THREE.ExtrudeGeometry(arrow, {
    depth: 0.036,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 1,
    steps: 1,
  });
  function fold(
    parent,
    name,
    position,
    scale,
    mat,
    accent,
    { sheetCount = 3, helixCount = 2, rotation = 0 } = {},
  ) {
    const g = new THREE.Group();
    g.name = name;
    parent.add(g);
    g.position.set(...position);
    g.scale.set(...scale);
    g.rotation.z = rotation;
    const core = new THREE.Mesh(sphere, mat);
    core.scale.set(0.77, 0.73, 0.45);
    core.position.z = -0.12;
    g.add(core);
    for (let i = 0; i < sheetCount; i++) {
      const m = new THREE.Mesh(sheet, accent);
      m.position.set(
        (i - (sheetCount - 1) / 2) * 0.25,
        Math.sin(i * 1.5) * 0.06,
        0.28,
      );
      m.rotation.z = (i % 2 ? Math.PI : 0) + 0.13;
      g.add(m);
    }
    for (let i = 0; i < helixCount; i++) {
      const m = new THREE.Mesh(helix, mat);
      m.position.set(i % 2 ? 0.66 : -0.66, 0.02, 0.0);
      m.rotation.z = i % 2 ? -0.22 : 0.22;
      m.scale.y = 0.96;
      g.add(m);
    }
    return g;
  }
  const temp = new THREE.Object3D(),
    d = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  function instances(geometry, material, count, parent, name) {
    const m = new THREE.InstancedMesh(geometry, material, count);
    m.name = name;
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
    parent.add(m);
    return m;
  }
  function bead(mesh, i, p, scale) {
    temp.position.copy(p);
    temp.quaternion.identity();
    Array.isArray(scale)
      ? temp.scale.set(...scale)
      : temp.scale.setScalar(scale);
    temp.updateMatrix();
    mesh.setMatrixAt(i, temp.matrix);
  }
  function bar(mesh, i, a, z, width = 0.035, depth = width) {
    temp.position.copy(a).add(z).multiplyScalar(0.5);
    d.copy(z).sub(a);
    const len = d.length();
    temp.quaternion.setFromUnitVectors(up, d.divideScalar(len || 1));
    temp.scale.set(width, Math.max(len, 1e-6), depth);
    temp.updateMatrix();
    mesh.setMatrixAt(i, temp.matrix);
  }
  function finish(...meshes) {
    for (const m of meshes) {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingBox();
      m.computeBoundingSphere();
    }
  }
  function inventory(group, extra = []) {
    const all = new Set(extra);
    group.traverse((o) => {
      if (o.material)
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
          all.add(m),
        );
    });
    return [...all];
  }
  return {
    fold,
    instances,
    bead,
    bar,
    finish,
    inventory,
    sphere,
    sugar,
    base,
    helix,
    sheet,
  };
}
