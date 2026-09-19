import { THREE } from "../../kit.js";

// A single isosurface of smoothly joined ellipsoids. Overlapping lobes have no
// internal membrane, and a narrowing neck becomes two closed surfaces at fission.
// Fixed buffers preserve scene/resource identity during deterministic seeks.
export function continuousMembrane(
  parent,
  material,
  bounds,
  resolution = [40, 32, 16],
) {
  const [nx, ny, nz] = resolution;
  const points = [],
    values = new Float64Array((nx + 1) * (ny + 1) * (nz + 1));
  const index = (x, y, z) => (x * (ny + 1) + y) * (nz + 1) + z;
  for (let x = 0; x <= nx; x++)
    for (let y = 0; y <= ny; y++)
      for (let z = 0; z <= nz; z++)
        points.push([
          bounds[0][0] + ((bounds[1][0] - bounds[0][0]) * x) / nx,
          bounds[0][1] + ((bounds[1][1] - bounds[0][1]) * y) / ny,
          bounds[0][2] + ((bounds[1][2] - bounds[0][2]) * z) / nz,
        ]);
  const tetrahedra = [],
    pattern = [
      [0, 5, 1, 6],
      [0, 1, 2, 6],
      [0, 2, 3, 6],
      [0, 3, 7, 6],
      [0, 7, 4, 6],
      [0, 4, 5, 6],
    ];
  for (let x = 0; x < nx; x++)
    for (let y = 0; y < ny; y++)
      for (let z = 0; z < nz; z++) {
        const cube = [
          index(x, y, z),
          index(x + 1, y, z),
          index(x + 1, y + 1, z),
          index(x, y + 1, z),
          index(x, y, z + 1),
          index(x + 1, y, z + 1),
          index(x + 1, y + 1, z + 1),
          index(x, y + 1, z + 1),
        ];
        for (const t of pattern) tetrahedra.push(t.map((i) => cube[i]));
      }
  const capacity = 60000;
  const positions = new Float32Array(capacity * 3),
    normals = new Float32Array(capacity * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setDrawRange(0, 0);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "continuous-plasma-membrane";
  parent.add(mesh);
  let lobes = [],
    blend = 0.12;
  function field(x, y, z, normal) {
    let d = 100,
      gx = 0,
      gy = 0,
      gz = 0;
    for (const l of lobes) {
      const dx = x - l.center[0],
        dy = y - l.center[1],
        dz = z - l.center[2];
      const q = Math.sqrt(
        dx * dx * l.inv[0] + dy * dy * l.inv[1] + dz * dz * l.inv[2],
      );
      const b = (q - 1) * l.min;
      if (normal) {
        const w = Math.max(0, Math.min(1, 0.5 + (0.5 * (d - b)) / blend)),
          f = l.min / Math.max(q, 1e-12);
        gx = gx * (1 - w) + w * f * dx * l.inv[0];
        gy = gy * (1 - w) + w * f * dy * l.inv[1];
        gz = gz * (1 - w) + w * f * dz * l.inv[2];
      }
      const h = Math.max(0, 1 - Math.abs(d - b) / blend);
      d = Math.min(d, b) - blend * h * h * 0.25;
    }
    if (normal) {
      const len = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
      normal[0] = gx / len;
      normal[1] = gy / len;
      normal[2] = gz / len;
    }
    return d;
  }
  function update(nextLobes, smoothing = 0.12) {
    lobes = nextLobes.map((l) => ({
      ...l,
      inv: l.radii.map((r) => 1 / (r * r)),
      min: Math.min(...l.radii),
    }));
    blend = smoothing;
    for (let i = 0; i < points.length; i++) values[i] = field(...points[i]);
    let count = 0;
    const edge = (a, b) => {
      const u = values[a] / (values[a] - values[b]);
      return points[a].map((v, j) => v + (points[b][j] - v) * u);
    };
    function emit(a, b, c) {
      const ga = [0, 0, 0],
        gb = [0, 0, 0],
        gc = [0, 0, 0];
      field(...a, ga);
      field(...b, gb);
      field(...c, gc);
      const ux = b[0] - a[0],
        uy = b[1] - a[1],
        uz = b[2] - a[2],
        vx = c[0] - a[0],
        vy = c[1] - a[1],
        vz = c[2] - a[2];
      if (
        (uy * vz - uz * vy) * ga[0] +
          (uz * vx - ux * vz) * ga[1] +
          (ux * vy - uy * vx) * ga[2] <
        0
      ) {
        positions.set(a, count * 3);
        positions.set(c, (count + 1) * 3);
        positions.set(b, (count + 2) * 3);
        normals.set(ga, count * 3);
        normals.set(gc, (count + 1) * 3);
        normals.set(gb, (count + 2) * 3);
      } else {
        positions.set(a, count * 3);
        positions.set(b, (count + 1) * 3);
        positions.set(c, (count + 2) * 3);
        normals.set(ga, count * 3);
        normals.set(gb, (count + 1) * 3);
        normals.set(gc, (count + 2) * 3);
      }
      count += 3;
    }
    for (const t of tetrahedra) {
      const inside = t.filter((i) => values[i] < 0),
        outside = t.filter((i) => values[i] >= 0);
      if (inside.length === 1) emit(...outside.map((i) => edge(inside[0], i)));
      else if (inside.length === 3)
        emit(...inside.map((i) => edge(outside[0], i)));
      else if (inside.length === 2) {
        const a = edge(inside[0], outside[0]),
          b = edge(inside[0], outside[1]),
          c = edge(inside[1], outside[0]),
          d = edge(inside[1], outside[1]);
        emit(a, b, c);
        emit(b, d, c);
      }
    }
    if (count > capacity) throw new Error("Membrane capacity exceeded");
    positions.fill(0, count * 3);
    normals.fill(0, count * 3);
    geometry.setDrawRange(0, count);
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    // Unused entries stay finite and are excluded by drawRange.
    geometry.boundingBox = new THREE.Box3(
      new THREE.Vector3(...bounds[0]),
      new THREE.Vector3(...bounds[1]),
    );
    geometry.boundingSphere = geometry.boundingBox.getBoundingSphere(
      new THREE.Sphere(),
    );
  }
  return { mesh, update, field };
}
