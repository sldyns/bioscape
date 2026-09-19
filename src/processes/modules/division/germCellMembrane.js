import { THREE } from "../../kit.js";

// A single level set joins the cell lobes and their retained channels. Unlike
// intersecting closed ellipsoids plus a connector, this has no internal caps.
// The positive-z half is intentionally omitted as the lesson's viewing cutaway.
export function germCellMembrane(k) {
  const group = new THREE.Group();
  group.name = "continuous-germ-cell-membrane";
  k.group.add(group);
  const nx = 64,
    ny = 56,
    nz = 18;
  const dx = 8 / nx,
    dy = 6.6 / ny,
    dz = 1.65 / nz;
  const row = nx + 1,
    plane = row * (ny + 1),
    count = plane * (nz + 1);
  const field = new Float32Array(count);
  const gradients = new Float32Array(count * 3);
  const coordinates = new Float32Array(count * 3);
  const index = (i, j, l) => i + j * row + l * plane;
  for (let l = 0; l <= nz; l++)
    for (let j = 0; j <= ny; j++)
      for (let i = 0; i <= nx; i++) {
        coordinates.set(
          [-4 + i * dx, -3.3 + j * dy, -1.65 + l * dz],
          index(i, j, l) * 3,
        );
      }
  const layers = [0, -0.035].map((level, i) => {
    const material = k.material(i ? "#dce7dd" : "#b8d0c6", {
      side: THREE.DoubleSide,
      roughness: 0.7,
    });
    k.materials.add(material);
    const geometry = new THREE.BufferGeometry();
    // Fixed resource and buffer identities while the division topology evolves.
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(90000 * 3), 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    geometry.setAttribute(
      "normal",
      new THREE.BufferAttribute(new Float32Array(90000 * 3), 3).setUsage(
        THREE.DynamicDrawUsage,
      ),
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = i ? "germ-cell-inner-leaflet" : "germ-cell-outer-leaflet";
    group.add(mesh);
    return { level, geometry };
  });
  const tets = [
    [0, 5, 1, 6],
    [0, 1, 2, 6],
    [0, 2, 3, 6],
    [0, 3, 7, 6],
    [0, 7, 4, 6],
    [0, 4, 5, 6],
  ];
  const edges = [
    [0, 1],
    [1, 2],
    [2, 0],
    [0, 3],
    [1, 3],
    [2, 3],
  ];
  const triangles = [
    [],
    [0, 3, 2],
    [0, 1, 4],
    [1, 4, 2, 2, 4, 3],
    [1, 2, 5],
    [0, 3, 5, 0, 5, 1],
    [0, 2, 5, 0, 5, 4],
    [5, 4, 3],
    [3, 4, 5],
    [4, 5, 0, 5, 2, 0],
    [1, 5, 0, 5, 3, 0],
    [5, 2, 1],
    [3, 4, 2, 2, 4, 1],
    [4, 1, 0],
    [2, 3, 0],
    [],
  ];
  const corner = new Int32Array(8),
    ids = new Int32Array(4);
  const v = new Float64Array(4),
    ep = new Float64Array(18),
    en = new Float64Array(18);
  const smoothMin = (a, b) => {
    const h = Math.max(0.12 - Math.abs(a - b), 0) / 0.12;
    return Math.min(a, b) - h * h * 0.03;
  };
  let lastFirst = -1,
    lastSecond = -1;
  function update(first, second) {
    if (first === lastFirst && second === lastSecond) return;
    lastFirst = first;
    lastSecond = second;
    const cx = 2.05 * first,
      cy = 1.32 * second;
    const rx = 3.3 + (1.58 - 3.3) * first - 0.1 * second;
    const ry = 2.15 + (1.85 - 2.15) * first - 0.65 * second;
    const rz = 1.35 + (1.15 - 1.35) * first - 0.11 * second;
    function evaluate(x, y, z) {
      // Symmetric lobe centres permit the exact nearest-lobe reduction, so
      // evaluate one ellipsoid rather than four at every grid sample.
      let d =
        (Math.hypot((Math.abs(x) - cx) / rx, (Math.abs(y) - cy) / ry, z / rz) -
          1) *
        rz;
      // The old I bridge follows the upper lineage. Two II bridges join sisters.
      const horizontal =
        Math.hypot(Math.max(Math.abs(x) - cx, 0), y - cy, z) - 0.2;
      d = smoothMin(d, horizontal);
      const vertical =
        Math.hypot(Math.abs(x) - cx, Math.max(Math.abs(y) - cy, 0), z) - 0.2;
      d = smoothMin(d, vertical);
      return d;
    }
    for (let n = 0; n < count; n++)
      field[n] = evaluate(
        coordinates[n * 3],
        coordinates[n * 3 + 1],
        coordinates[n * 3 + 2],
      );
    for (let l = 0; l <= nz; l++)
      for (let j = 0; j <= ny; j++)
        for (let i = 0; i <= nx; i++) {
          const n = index(i, j, l) * 3;
          gradients[n] =
            (field[index(Math.min(nx, i + 1), j, l)] -
              field[index(Math.max(0, i - 1), j, l)]) /
            ((i === 0 || i === nx ? 1 : 2) * dx);
          gradients[n + 1] =
            (field[index(i, Math.min(ny, j + 1), l)] -
              field[index(i, Math.max(0, j - 1), l)]) /
            ((j === 0 || j === ny ? 1 : 2) * dy);
          gradients[n + 2] =
            (field[index(i, j, Math.min(nz, l + 1))] -
              field[index(i, j, Math.max(0, l - 1))]) /
            ((l === 0 || l === nz ? 1 : 2) * dz);
        }
    for (const { level, geometry } of layers) {
      const positions = geometry.attributes.position.array,
        normals = geometry.attributes.normal.array;
      positions.fill(0);
      normals.fill(0);
      let cursor = 0;
      for (let l = 0; l < nz; l++)
        for (let j = 0; j < ny; j++)
          for (let i = 0; i < nx; i++) {
            const n = index(i, j, l);
            corner.set([
              n,
              n + 1,
              n + row + 1,
              n + row,
              n + plane,
              n + plane + 1,
              n + plane + row + 1,
              n + plane + row,
            ]);
            let min = Infinity,
              max = -Infinity;
            for (const c of corner) {
              min = Math.min(min, field[c]);
              max = Math.max(max, field[c]);
            }
            if (min > level || max < level) continue;
            for (const tet of tets) {
              let mask = 0;
              for (let q = 0; q < 4; q++) {
                ids[q] = corner[tet[q]];
                v[q] = field[ids[q]];
                if (v[q] < level) mask |= 1 << q;
              }
              const tri = triangles[mask];
              if (!tri.length) continue;
              for (let e = 0; e < 6; e++) {
                const [a, b] = edges[e],
                  t = (level - v[a]) / (v[b] - v[a]);
                if (v[a] < level === v[b] < level) continue;
                for (let q = 0; q < 3; q++) {
                  ep[e * 3 + q] =
                    coordinates[ids[a] * 3 + q] * (1 - t) +
                    coordinates[ids[b] * 3 + q] * t;
                  en[e * 3 + q] =
                    gradients[ids[a] * 3 + q] * (1 - t) +
                    gradients[ids[b] * 3 + q] * t;
                }
                const norm =
                  Math.hypot(en[e * 3], en[e * 3 + 1], en[e * 3 + 2]) || 1;
                for (let q = 0; q < 3; q++) en[e * 3 + q] /= norm;
              }
              for (const e of tri) {
                if (cursor + 3 > positions.length)
                  throw new Error("Germ-cell surface capacity exceeded");
                for (let q = 0; q < 3; q++) {
                  positions[cursor] = ep[e * 3 + q];
                  normals[cursor++] = en[e * 3 + q];
                }
              }
            }
          }
      geometry.setDrawRange(0, cursor / 3);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.normal.needsUpdate = true;
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    }
  }
  update(0, 0);
  return { group, update };
}
