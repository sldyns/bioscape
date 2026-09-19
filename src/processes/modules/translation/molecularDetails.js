import { THREE } from "../../kit.js";

// Schematic secondary structure. These are not fitted atomic reconstructions.
export function helix(
  k,
  parent,
  from,
  to,
  radius,
  turns,
  mat,
  thickness = 0.035,
) {
  const a = new THREE.Vector3(...from),
    axis = new THREE.Vector3(...to).sub(a),
    u = new THREE.Vector3(0, 0, 1);
  if (Math.abs(axis.clone().normalize().dot(u)) > 0.9) u.set(0, 1, 0);
  const v = new THREE.Vector3().crossVectors(axis, u).normalize();
  u.crossVectors(v, axis).normalize();
  const points = [];
  for (let i = 0; i <= turns * 14; i++) {
    const t = i / (turns * 14),
      angle = t * turns * Math.PI * 2;
    points.push(
      a
        .clone()
        .addScaledVector(axis, t)
        .addScaledVector(u, radius * Math.cos(angle))
        .addScaledVector(v, radius * Math.sin(angle))
        .toArray(),
    );
  }
  return k.tube(points, thickness, mat, parent, Math.ceil(turns * 24));
}
export function sheet(k, parent, center, width, height, count, mat) {
  const geo = new THREE.BufferGeometry(),
    pos = [],
    ind = [];
  for (let strand = 0; strand < count; strand++) {
    const x = center[0] + ((strand - (count - 1) / 2) * width) / count,
      flip = strand % 2 ? -1 : 1,
      offset = pos.length / 3;
    for (let j = 0; j <= 12; j++) {
      const t = j / 12,
        y = center[1] + flip * (t - 0.5) * height,
        w =
          (width / count) *
          (t > 0.78 ? Math.max(0.03, (1 - t) / 0.22) * 0.9 : 0.34),
        z =
          center[2] +
          0.04 * Math.sin(t * Math.PI * 6) +
          0.05 * Math.cos(strand);
      pos.push(x - w, y, z, x + w, y, z);
      if (j < 12) {
        const q = offset + j * 2;
        ind.push(q, q + 1, q + 2, q + 1, q + 3, q + 2);
      }
    }
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(ind);
  geo.computeVertexNormals();
  return k.mesh(geo, mat, [0, 0, 0], parent);
}
export function rnaStem(k, parent, from, to, radius, turns, mat) {
  const a = new THREE.Vector3(...from),
    axis = new THREE.Vector3(...to).sub(a),
    u = new THREE.Vector3(0, 0, 1),
    v = new THREE.Vector3().crossVectors(axis, u).normalize();
  u.crossVectors(v, axis).normalize();
  const paths = [[], []],
    n = Math.max(12, Math.round(turns * 14));
  for (let i = 0; i <= n; i++) {
    const t = i / n,
      theta = t * turns * Math.PI * 2;
    for (let side = 0; side < 2; side++) {
      const q = theta + side * Math.PI;
      paths[side].push(
        a
          .clone()
          .addScaledVector(axis, t)
          .addScaledVector(u, radius * Math.cos(q))
          .addScaledVector(v, radius * Math.sin(q)),
      );
    }
  }
  for (const path of paths)
    k.tube(
      path.map((p) => p.toArray()),
      0.026,
      mat,
      parent,
      n * 2,
    );
  const inst = new THREE.InstancedMesh(k.cylinder, mat, Math.floor(n / 2) + 1),
    temp = new THREE.Object3D(),
    dir = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  parent.add(inst);
  let count = 0;
  for (let i = 0; i <= n; i += 2) {
    const p = paths[0][i],
      q = paths[1][i];
    temp.position.copy(p).add(q).multiplyScalar(0.5);
    dir.subVectors(q, p);
    temp.scale.set(0.014, dir.length(), 0.014);
    temp.quaternion.setFromUnitVectors(up, dir.normalize());
    temp.updateMatrix();
    inst.setMatrixAt(count++, temp.matrix);
  }
  inst.count = count;
  inst.instanceMatrix.needsUpdate = true;
  inst.computeBoundingBox();
  inst.computeBoundingSphere();
  const tip = paths[0][n]
    .clone()
    .lerp(paths[1][n], 0.5)
    .addScaledVector(axis.clone().normalize(), radius * 1.6);
  k.tube(
    [paths[0][n].toArray(), tip.toArray(), paths[1][n].toArray()],
    0.026,
    mat,
    parent,
    16,
  );
}
export function cutawayLobe(k, parent, center, scale, mat, phase = 0) {
  const points = [],
    indices = [],
    nu = 38,
    nv = 24;
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const a = (i / nu) * Math.PI,
        t = 0.06 + (j / nv) * (Math.PI - 0.12),
        s = Math.sin(t),
        r =
          1 +
          0.07 * s * Math.cos(a * 5 + phase) +
          0.055 * Math.sin(t * 4 + phase);
      points.push(
        center[0] + scale[0] * s * Math.cos(a) * r,
        center[1] + scale[1] * Math.cos(t) * r,
        center[2] - scale[2] * s * Math.sin(a),
      );
      if (j < nv && i < nu) {
        const q = j * (nu + 1) + i;
        indices.push(q, q + 1, q + nu + 1, q + 1, q + nu + 2, q + nu + 1);
      }
    }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return k.mesh(geo, mat, [0, 0, 0], parent);
}
export function cubane(k, parent, center, size, iron, sulfur) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const p = [
      center[0] + (i & 1 ? 1 : -1) * size,
      center[1] + (i & 2 ? 1 : -1) * size,
      center[2] + (i & 4 ? 1 : -1) * size,
    ];
    pts.push(p);
    k.ball(
      p,
      size * 0.39,
      ((i & 1) + ((i >> 1) & 1) + ((i >> 2) & 1)) % 2 ? iron : sulfur,
      parent,
    );
  }
  for (let i = 0; i < 8; i++)
    for (let axis = 0; axis < 3; axis++) {
      const j = i ^ (1 << axis);
      if (j > i) k.segment(pts[i], pts[j], size * 0.11, sulfur, parent);
    }
}
export function ferredoxinFold(k, parent, center, scale, mat) {
  const g = new THREE.Group();
  parent.add(g);
  g.position.set(...center);
  g.scale.setScalar(scale);
  sheet(k, g, [0, 0, 0.16], 0.72, 0.73, 4, mat);
  helix(k, g, [-0.48, -0.4, 0.24], [-0.48, 0.39, 0.24], 0.12, 3.2, mat);
  helix(k, g, [0.46, -0.28, 0.14], [0.48, 0.31, 0.15], 0.1, 2.6, mat);
  return g;
}
export function peptideSidechains(k, chain, parent = k.group) {
  const sideMat = k.material("#ddbd94"),
    oxygenMat = k.material("#bd8c80"),
    count = Math.floor(chain.points.length / 3);
  const sites = new THREE.InstancedMesh(k.sphere, sideMat, count),
    oxygens = new THREE.InstancedMesh(k.sphere, oxygenMat, count),
    bonds = new THREE.InstancedMesh(k.cylinder, sideMat, count);
  parent.add(sites, oxygens, bonds);
  const temp = new THREE.Object3D(),
    end = new THREE.Vector3(),
    dir = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  for (const mesh of [sites, oxygens, bonds]) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
  }
  function update() {
    for (let i = 0; i < count; i++) {
      const p = chain.points[i * 3],
        angle = i * 2.2;
      end.set(
        p.x + 0.12 * Math.cos(angle),
        p.y + 0.12 * Math.sin(angle),
        p.z + 0.14,
      );
      temp.position.copy(end);
      temp.quaternion.identity();
      temp.scale.setScalar(0.045);
      temp.updateMatrix();
      sites.setMatrixAt(i, temp.matrix);
      temp.position.z += 0.07;
      temp.scale.setScalar(0.035);
      temp.updateMatrix();
      oxygens.setMatrixAt(i, temp.matrix);
      dir.subVectors(end, p);
      temp.position.copy(p).add(end).multiplyScalar(0.5);
      const length = dir.length();
      temp.quaternion.setFromUnitVectors(up, dir.normalize());
      temp.scale.set(0.018, length, 0.018);
      temp.updateMatrix();
      bonds.setMatrixAt(i, temp.matrix);
    }
    for (const mesh of [sites, oxygens, bonds]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    }
  }
  return update;
}
export function rnaBaseDetails(k, chain, parent = k.group) {
  const count = chain.points.length,
    mat = k.material("#8d9e9d");
  const bases = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.047, 0.105, 0.023),
      mat,
      count,
    ),
    sugars = new THREE.InstancedMesh(k.sphere, k.material("#d0d5ca"), count);
  parent.add(bases, sugars);
  const temp = new THREE.Object3D();
  for (const mesh of [bases, sugars]) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
  }
  return () => {
    for (let i = 0; i < count; i++) {
      const p = chain.points[i],
        next = chain.points[Math.min(count - 1, i + 1)],
        prev = chain.points[Math.max(0, i - 1)];
      const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
      temp.position.set(
        p.x - 0.05 * Math.sin(angle),
        p.y + 0.05 * Math.cos(angle),
        p.z + 0.08,
      );
      temp.rotation.set(0, 0, angle);
      temp.scale.set(1, 1, 1);
      temp.updateMatrix();
      bases.setMatrixAt(i, temp.matrix);
      temp.position.copy(p);
      temp.position.z += 0.035;
      temp.scale.setScalar(0.037);
      temp.updateMatrix();
      sugars.setMatrixAt(i, temp.matrix);
    }
    for (const mesh of [bases, sugars]) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.computeBoundingBox();
    }
  };
}
export function feMoCofactor(k, parent, center, scale = 1) {
  const g = new THREE.Group();
  parent.add(g);
  g.position.set(...center);
  g.scale.setScalar(scale);
  const fe = k.material("#ae7954"),
    s = k.material("#cfb365"),
    mo = k.material("#8b75a8"),
    carbon = k.material("#5f6768"),
    pts = [];
  for (let side of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const p = [side * 0.18, 0.22 * Math.cos(a), 0.22 * Math.sin(a)];
      pts.push(p);
      k.ball(p, 0.077, fe, g);
    }
  const sulfurPts = [];
  for (let side of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const a = ((i + 0.5) * Math.PI * 2) / 3;
      const p = [side * 0.25, 0.2 * Math.cos(a), 0.2 * Math.sin(a)];
      sulfurPts.push(p);
      k.ball(p, 0.069, s, g);
    }
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    const p = [0, 0.27 * Math.cos(a), 0.27 * Math.sin(a)];
    sulfurPts.push(p);
    k.ball(p, 0.069, s, g);
  }
  k.ball([-0.43, 0, 0], 0.079, fe, g);
  k.ball([0.43, 0, 0], 0.09, mo, g);
  k.ball([0, 0, 0], 0.06, carbon, g);
  for (const p of pts) {
    k.segment([0, 0, 0], p, 0.014, carbon, g);
    for (const q of sulfurPts)
      if (new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...q)) < 0.33)
        k.segment(p, q, 0.022, s, g);
  }
  for (let i = 0; i < 6; i++)
    k.segment([i < 3 ? -0.43 : 0.43, 0, 0], sulfurPts[i], 0.022, s, g);
  k.tube(
    [
      [0.43, 0, 0],
      [0.65, -0.15, 0.01],
      [0.69, -0.3, 0.02],
      [0.55, -0.37, 0.05],
    ],
    0.025,
    k.material("#a7b296"),
    g,
    22,
  );
  return g;
}
export function pCluster(k, parent, center, size, iron, sulfur) {
  const all = [];
  for (const side of [-1, 1]) {
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const p = [
        center[0] + side * size + (i & 1 ? 1 : -1) * size,
        center[1] + side * size + (i & 2 ? 1 : -1) * size,
        center[2] + side * size + (i & 4 ? 1 : -1) * size,
      ];
      pts.push(p);
      const shared = side === 1 && i === 0;
      const parity = ((i & 1) + ((i >> 1) & 1) + ((i >> 2) & 1)) % 2;
      const isIron = side === -1 ? !parity : !!parity;
      if (!shared) {
        k.ball(p, size * 0.38, isIron ? iron : sulfur, parent);
        all.push(p);
      }
    }
    for (let i = 0; i < 8; i++)
      for (let axis = 0; axis < 3; axis++) {
        const j = i ^ (1 << axis);
        if (j > i) k.segment(pts[i], pts[j], size * 0.12, sulfur, parent);
      }
  }
}
