import { THREE } from "../../kit.js";

// The zero surface encloses the vesicle/cell-plate lumen. Union operations
// really remove internal membrane caps when vesicles or the parental PM join.
// Fixed buffers keep scrubbing deterministic without creating GPU resources.
export function fieldMembrane(
  k,
  material,
  { nx, ny, nz, lo, hi, name, focus = false, maxVertices = nx * ny * nz * 36 },
) {
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
  const positions = new Float32Array(maxVertices * 3);
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
  mesh.name = name;
  const tetrahedra = [
    [0, 5, 1, 6],
    [0, 1, 2, 6],
    [0, 2, 3, 6],
    [0, 3, 7, 6],
    [0, 7, 4, 6],
    [0, 4, 5, 6],
  ];
  let cursor = 0;
  const ids = new Int32Array(8),
    inside = new Int32Array(4),
    outside = new Int32Array(4);
  const crossings = Array.from({ length: 4 }, () => new Float64Array(3));
  const interior = new Float64Array(3);
  const xCoordinates = new Float32Array(nx + 1),
    zCoordinates = new Float32Array(nz + 1);
  function crossing(a, b, result) {
    const t = values[a] / (values[a] - values[b]);
    for (let c = 0; c < 3; c++)
      result[c] =
        points[a * 3 + c] + t * (points[b * 3 + c] - points[a * 3 + c]);
    return result;
  }
  function triangle(a, b, c, inside) {
    const ux = b[0] - a[0],
      uy = b[1] - a[1],
      uz = b[2] - a[2];
    const vx = c[0] - a[0],
      vy = c[1] - a[1],
      vz = c[2] - a[2];
    let nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    if (
      nx * (inside[0] - a[0]) +
        ny * (inside[1] - a[1]) +
        nz * (inside[2] - a[2]) >
      0
    ) {
      const swap = b;
      b = c;
      c = swap;
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }
    const length = Math.hypot(nx, ny, nz) || 1;
    if (cursor + 9 > positions.length)
      throw new Error("Membrane surface capacity exceeded");
    for (let vertex = 0; vertex < 3; vertex++) {
      const p = vertex === 0 ? a : vertex === 1 ? b : c;
      positions[cursor] = p[0];
      normals[cursor++] = nx / length;
      positions[cursor] = p[1];
      normals[cursor++] = ny / length;
      positions[cursor] = p[2];
      normals[cursor++] = nz / length;
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
    if (focus) {
      for (let x = 0; x <= nx; x++)
        xCoordinates[x] = stretch((2 * x) / nx - 1, focusX, 0.85, hi[0]);
      for (let z = 0; z <= nz; z++)
        zCoordinates[z] = stretch((2 * z) / nz - 1, focusZ, 0.8, hi[2]);
    }
    for (let x = 0; x <= nx; x++)
      for (let z = 0; z <= nz; z++)
        for (let y = 0; y <= ny; y++) {
          const i = index(x, y, z);
          if (focus) {
            points[i * 3] = xCoordinates[x];
            points[i * 3 + 2] = zCoordinates[z];
          }
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
          ids[0] = index(x, y, z);
          ids[1] = index(x + 1, y, z);
          ids[2] = index(x + 1, y + 1, z);
          ids[3] = index(x, y + 1, z);
          ids[4] = ids[0] + 1;
          ids[5] = ids[1] + 1;
          ids[6] = ids[2] + 1;
          ids[7] = ids[3] + 1;
          let negatives = 0;
          for (let j = 0; j < 8; j++) if (values[ids[j]] < 0) negatives++;
          if (negatives === 0 || negatives === 8) continue;
          for (const tetra of tetrahedra) {
            let ni = 0,
              no = 0;
            for (let j = 0; j < 4; j++) {
              const id = ids[tetra[j]];
              if (values[id] < 0) inside[ni++] = id;
              else outside[no++] = id;
            }
            if (!ni || !no) continue;
            for (let c = 0; c < 3; c++) interior[c] = points[inside[0] * 3 + c];
            if (ni === 1) {
              for (let j = 0; j < 3; j++)
                crossing(inside[0], outside[j], crossings[j]);
              triangle(crossings[0], crossings[1], crossings[2], interior);
            } else if (no === 1) {
              for (let j = 0; j < 3; j++)
                crossing(inside[j], outside[0], crossings[j]);
              triangle(crossings[0], crossings[1], crossings[2], interior);
            } else {
              const a = crossing(inside[0], outside[0], crossings[0]),
                b = crossing(inside[0], outside[1], crossings[1]);
              const c = crossing(inside[1], outside[0], crossings[2]),
                d = crossing(inside[1], outside[1], crossings[3]);
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

export function cellPlateMembrane(k, material) {
  return fieldMembrane(k, material, {
    nx: 40,
    ny: 16,
    nz: 24,
    lo: [-2.56, -0.5, -0.88],
    hi: [2.56, 0.5, 0.88],
    focus: true,
    name: "Continuous cell-plate lumen membrane and parental junction",
  });
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
