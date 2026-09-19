import { THREE } from "../../kit.js";

const resourceCache = new WeakMap();
const resources = (k) => {
  if (!resourceCache.has(k))
    resourceCache.set(k, {
      helices: new Map(),
      ribbon: new THREE.BoxGeometry(0.075, 0.35, 0.025),
    });
  return resourceCache.get(k);
};
// Secondary-structure cartoons. Coordinates are designed for teaching, not fitted atoms.
// Repeated helices share a local-axis buffer and differ only by placement.
export function helix(k, parent, from, to, radius, material, turns = 4) {
  const a = new THREE.Vector3(...from),
    b = new THREE.Vector3(...to),
    axis = b.clone().sub(a),
    length = axis.length();
  const key = [length.toFixed(6), radius, turns].join(":"),
    cache = resources(k).helices;
  if (!cache.has(key)) {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const t = i / 64;
      points.push(
        new THREE.Vector3(
          Math.cos(t * Math.PI * 2 * turns) * radius,
          (t - 0.5) * length,
          Math.sin(t * Math.PI * 2 * turns) * radius,
        ),
      );
    }
    cache.set(
      key,
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        96,
        radius * 0.37,
        8,
        false,
      ),
    );
  }
  const m = k.mesh(
    cache.get(key),
    material,
    a.clone().add(b).multiplyScalar(0.5).toArray(),
    parent,
  );
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
  return m;
}

export function lrr(
  k,
  parent,
  { rx, ry, start, end, width, depth, repeats, material, accent },
) {
  // Continuous inner beta-sheet face and convex outer rim have a real depth.
  const shape = new THREE.Shape();
  const n = 80;
  for (let i = 0; i <= n; i++) {
    const a = start + ((end - start) * i) / n,
      x = Math.cos(a) * rx,
      y = Math.sin(a) * ry;
    i ? shape.lineTo(x, y) : shape.moveTo(x, y);
  }
  for (let i = n; i >= 0; i--) {
    const a = start + ((end - start) * i) / n;
    shape.lineTo(Math.cos(a) * (rx + width), Math.sin(a) * (ry + width));
  }
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    curveSegments: 64,
  });
  geom.translate(0, 0, -depth / 2);
  k.mesh(geom, material, [0, 0, 0], parent);
  const slab = new THREE.BoxGeometry(width * 0.78, 0.036, depth * 0.88);
  for (let i = 0; i < repeats; i++) {
    const a = start + ((end - start) * (i + 0.5)) / repeats;
    const m = k.mesh(
      slab,
      accent,
      [
        Math.cos(a) * (rx + width * 0.38),
        Math.sin(a) * (ry + width * 0.38),
        0.035,
      ],
      parent,
    );
    m.rotation.z = a;
    const outer = [
      Math.cos(a) * (rx + width * 0.87),
      Math.sin(a) * (ry + width * 0.87),
      0,
    ];
    const tangent = [-Math.sin(a) * 0.08, Math.cos(a) * 0.08, 0];
    helix(
      k,
      parent,
      [outer[0] - tangent[0], outer[1] - tangent[1], -0.13],
      [outer[0] + tangent[0], outer[1] + tangent[1], 0.13],
      0.046,
      accent,
      2,
    );
  }
}

export function domain(k, parent, position, scale, material, accent) {
  const g = new THREE.Group();
  g.position.set(...position);
  g.scale.set(...scale);
  parent.add(g);
  const lobes = [
    [-0.21, 0.02, -0.07, 0.29, 0.34, 0.24],
    [0.18, -0.05, -0.06, 0.25, 0.3, 0.25],
    [-0.04, 0.22, -0.12, 0.26, 0.19, 0.21],
    [0.07, -0.27, -0.13, 0.25, 0.19, 0.22],
  ];
  for (const a of lobes) k.ball(a.slice(0, 3), a.slice(3), material, g);
  for (let i = 0; i < 3; i++)
    helix(
      k,
      g,
      [-0.29 + i * 0.22, -0.24, 0.13],
      [-0.22 + i * 0.22, 0.21, 0.16],
      0.04,
      accent,
      3,
    );
  const ribbon = resources(k).ribbon;
  for (let i = 0; i < 3; i++) {
    const m = k.mesh(ribbon, accent, [-0.16 + i * 0.12, 0.02, 0.205], g);
    m.rotation.z = (i - 1) * 0.12;
  }
  return g;
}

export function instances(parent, geometry, material, count, name) {
  const m = new THREE.InstancedMesh(geometry, material, count);
  m.name = name;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  m.frustumCulled = false;
  parent.add(m);
  return m;
}
export function instanceWriter() {
  const o = new THREE.Object3D(),
    a = new THREE.Vector3(),
    d = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  return {
    bead(mesh, i, p, r) {
      o.position.set(...p);
      o.quaternion.identity();
      o.scale.setScalar(r);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    },
    segment(mesh, i, p, q, r) {
      a.set(...p);
      d.set(...q).sub(a);
      o.position.copy(a).addScaledVector(d, 0.5);
      const length = d.length();
      o.quaternion.setFromUnitVectors(up, d.divideScalar(length || 1));
      o.scale.set(r, Math.max(length, 1e-6), r);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    },
    finish(mesh) {
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingBox();
      mesh.computeBoundingSphere();
    },
  };
}

// Flexible cytoplasmic peptide tether. Geometry is allocated once and every
// segment is placed from absolute endpoints, including during backward seeks.
export function flexibleLink(k, parent, name, material) {
  const group = new THREE.Group();
  group.name = name;
  parent.add(group);
  const links = Array.from({ length: 12 }, () =>
    k.segment([0, 0, 0], [0, 1, 0], 0.035, material, group),
  );
  const up = new THREE.Vector3(0, 1, 0),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    d = new THREE.Vector3();
  function update(from, to) {
    for (let i = 0; i < 12; i++) {
      const t = i / 12,
        u = (i + 1) / 12;
      a.set(
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t + 0.05 * Math.sin(Math.PI * t),
      );
      b.set(
        from[0] + (to[0] - from[0]) * u,
        from[1] + (to[1] - from[1]) * u,
        from[2] + (to[2] - from[2]) * u + 0.05 * Math.sin(Math.PI * u),
      );
      d.subVectors(b, a);
      const length = d.length(),
        m = links[i];
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(up, d.normalize());
      m.scale.set(0.035, Math.max(length, 0.00001), 0.035);
    }
  }
  return { group, update };
}
