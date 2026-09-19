import { THREE } from "../../kit.js";

// The zero surface encloses the vesicle/cell-plate lumen. Union operations
// really remove internal membrane caps when vesicles or the parental PM join.
// Fixed buffers keep scrubbing deterministic without creating GPU resources.
export function cellPlateMembrane(k, material) {
  const nx = 40,
    ny = 16,
    nz = 24;
  const lo = [-2.56, -0.5, -0.88],
    hi = [2.56, 0.5, 0.88];
  const count = (nx + 1) * (ny + 1) * (nz + 1);
  const points = new Float32Array(count * 3),
    values = new Float32Array(count);
  const index = (x, y, z) => (x * (ny + 1) + y) * (nz + 1) + z;
  for (let x = 0; x <= nx; x++)
    for (let y = 0; y <= ny; y++)
      for (let z = 0; z <= nz; z++) {
        const i = index(x, y, z) * 3;
        points[i] = lo[0] + ((hi[0] - lo[0]) * x) / nx;
        points[i + 1] = lo[1] + ((hi[1] - lo[1]) * y) / ny;
        points[i + 2] = lo[2] + ((hi[2] - lo[2]) * z) / nz;
      }
  const positions = new Float32Array(nx * ny * nz * 36 * 3);
  const normals = new Float32Array(positions.length);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setAttribute(
    "normal",
    new THREE.BufferAttribute(normals, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.boundingBox = new THREE.Box3(
    new THREE.Vector3(...lo),
    new THREE.Vector3(...hi),
  );
  geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(
    new THREE.Sphere(),
  );
  const mesh = k.mesh(geometry, material);
  mesh.name = "Continuous cell-plate lumen membrane and parental junction";
  const tetrahedra = [
    [0, 5, 1, 6],
    [0, 1, 2, 6],
    [0, 2, 3, 6],
    [0, 3, 7, 6],
    [0, 7, 4, 6],
    [0, 4, 5, 6],
  ];
  let cursor = 0;
  function crossing(a, b) {
    const t = values[a] / (values[a] - values[b]);
    return [0, 1, 2].map(
      (c) => points[a * 3 + c] + t * (points[b * 3 + c] - points[a * 3 + c]),
    );
  }
  function triangle(a, b, c, inside) {
    const u = b.map((v, i) => v - a[i]),
      v = c.map((s, i) => s - a[i]);
    const n = [
      u[1] * v[2] - u[2] * v[1],
      u[2] * v[0] - u[0] * v[2],
      u[0] * v[1] - u[1] * v[0],
    ];
    if (n.reduce((s, v, i) => s + v * (inside[i] - a[i]), 0) > 0) {
      [b, c] = [c, b];
      n.forEach((v, i) => (n[i] = -v));
    }
    const length = Math.hypot(...n) || 1;
    for (const p of [a, b, c])
      for (let j = 0; j < 3; j++) {
        positions[cursor] = p[j];
        normals[cursor++] = n[j] / length;
      }
  }
  function update(field, width, depth) {
    // Concentrate samples around the growing plate, while retaining the same
    // outer parent-membrane domain and GPU buffers. Early network pores must
    // remain actual holes even when the nascent plate occupies a tiny volume.
    const focusX = Math.min(2.3, width + 0.13);
    const focusZ = Math.min(0.78, depth + 0.12);
    const stretch = (u, focus, fraction, limit) => {
      const a = Math.abs(u);
      return (
        Math.sign(u) *
        (a <= fraction
          ? (a * focus) / fraction
          : focus + ((a - fraction) * (limit - focus)) / (1 - fraction))
      );
    };
    for (let x = 0; x <= nx; x++)
      for (let y = 0; y <= ny; y++)
        for (let z = 0; z <= nz; z++) {
          const i = index(x, y, z);
          points[i * 3] = stretch((2 * x) / nx - 1, focusX, 0.85, hi[0]);
          points[i * 3 + 2] = stretch((2 * z) / nz - 1, focusZ, 0.8, hi[2]);
          values[i] = field(
            points[i * 3],
            points[i * 3 + 1],
            points[i * 3 + 2],
          );
        }
    cursor = 0;
    for (let x = 0; x < nx; x++)
      for (let y = 0; y < ny; y++)
        for (let z = 0; z < nz; z++) {
          const ids = [
            index(x, y, z),
            index(x + 1, y, z),
            index(x + 1, y + 1, z),
            index(x, y + 1, z),
            index(x, y, z + 1),
            index(x + 1, y, z + 1),
            index(x + 1, y + 1, z + 1),
            index(x, y + 1, z + 1),
          ];
          if (
            ids.every((i) => values[i] < 0) ||
            ids.every((i) => values[i] >= 0)
          )
            continue;
          for (const tetra of tetrahedra) {
            const inside = tetra
              .map((i) => ids[i])
              .filter((i) => values[i] < 0);
            const outside = tetra
              .map((i) => ids[i])
              .filter((i) => values[i] >= 0);
            if (!inside.length || !outside.length) continue;
            const interior = [0, 1, 2].map((c) => points[inside[0] * 3 + c]);
            if (inside.length === 1)
              triangle(...outside.map((i) => crossing(inside[0], i)), interior);
            else if (outside.length === 1)
              triangle(...inside.map((i) => crossing(i, outside[0])), interior);
            else {
              const a = crossing(inside[0], outside[0]),
                b = crossing(inside[0], outside[1]);
              const c = crossing(inside[1], outside[0]),
                d = crossing(inside[1], outside[1]);
              triangle(a, b, c, interior);
              triangle(b, d, c, interior);
            }
          }
        }
    // The full fixed-capacity buffer is observable during export and exact
    // state hashing. Remove old larger surfaces beyond the current draw range.
    positions.fill(0, cursor);
    normals.fill(0, cursor);
    geometry.setDrawRange(0, cursor / 3);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
  }
  return { mesh, update };
}

export function plateFootprint(x, z, width, depth) {
  const rounding = Math.min(0.09, width * 0.35, depth * 0.35);
  const qx = Math.abs(x) - width + rounding;
  const qz = Math.abs(z) - depth + rounding;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) +
    Math.min(Math.max(qx, qz), 0) -
    rounding
  );
}

export function plateMargin(angle, width, depth) {
  const dx = Math.cos(angle),
    dz = Math.sin(angle);
  let a = 0,
    b = Math.hypot(width, depth) + 0.1;
  for (let i = 0; i < 24; i++) {
    const t = (a + b) / 2;
    if (plateFootprint(t * dx, t * dz, width, depth) < 0) a = t;
    else b = t;
  }
  return [(a + b) * 0.5 * dx, (a + b) * 0.5 * dz];
}
