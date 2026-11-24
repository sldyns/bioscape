import * as T from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { splitSection } from "./implicitMembrane";

// West et al., JCB 193:333–346 (2011), Figs. 1 and 4. One unit = 230 nm.
// Widths are whole-domain measurements. The path and fenestra layout are illustrative.
const NM = 230;
const SHEET = 35.6 / (2 * NM);
const TUBE = 37.9 / (2 * NM);
const BILAYER = 4.2 / NM;
const GAP = 33 / NM;
const half = [1.64, 1.02, 0.46];
const V = (x, y, z) => new T.Vector3(x, y, z);
const v2 = (a) => new T.Vector3(...a, 0);
const smoothUnion = (a, b, k) =>
  Math.min(a, b) - Math.max(k - Math.abs(a - b), 0) ** 2 / (4 * k);
const cutHeight = 0.00163;
const cutLine = (x, y) => x + 0.24 * y + 0.23;

// Ellipses describe the broad cisternal mid-surface and its irregular fenestrae.
// A rounded 3-D edge grows around this mid-surface on both faces.
function ellipse(x, y, [cx, cy, rx, ry, angle]) {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const u = c * (x - cx) + s * (y - cy);
  const v = c * (y - cy) - s * (x - cx);
  const k = Math.hypot(u / rx, v / ry);
  return k < 1e-8
    ? -Math.min(rx, ry)
    : (k * (k - 1)) / Math.hypot(u / (rx * rx), v / (ry * ry));
}
const lobes = [
  [-0.76, 0.04, 0.65, 0.5, 0.33],
  [-0.51, -0.25, 0.74, 0.34, -0.19],
  [-0.28, 0.26, 0.47, 0.3, -0.32],
  [-0.82, 0.49, 0.36, 0.14, 0.43],
];
const windows = [
  [-1.08, 0.04, 0.167, 0.128, 0.66],
  [-0.68, 0.27, 0.184, 0.144, -0.53],
  [-0.58, -0.18, 0.214, 0.133, 0.48],
  [-0.21, 0.16, 0.14, 0.119, -0.33],
  [-0.96, -0.34, 0.127, 0.113, -0.27],
];
// Several curves share end points so this is a sheet-to-tubule continuum,
// including loops and three-way junctions. No tube lumens terminate in the sheet.
const paths = [
  [
    [-0.36, 0.39],
    [0.02, 0.48],
    [0.34, 0.67],
    [0.63, 0.62],
    [0.86, 0.39],
  ],
  [
    [0.86, 0.39],
    [1.08, 0.31],
    [1.25, 0.02],
    [1.2, -0.2],
  ],
  [
    [1.2, -0.2],
    [0.99, -0.47],
    [0.73, -0.56],
    [0.57, -0.48],
  ],
  [
    [0.57, -0.48],
    [0.31, -0.52],
    [0.1, -0.46],
    [-0.38, -0.48],
  ],
  [
    [-0.3, 0.05],
    [0.05, -0.025],
    [0.31, 0.074],
    [0.47, 0.13],
  ],
  [
    [0.47, 0.13],
    [0.65, 0.21],
    [0.78, 0.29],
    [0.86, 0.39],
  ],
  [
    [0.47, 0.13],
    [0.45, -0.07],
    [0.53, -0.29],
    [0.57, -0.48],
  ],
  [
    [0.86, 0.39],
    [0.98, 0.61],
    [1.22, 0.67],
    [1.39, 0.6],
  ],
  [
    [1.2, -0.2],
    [1.33, -0.25],
    [1.46, -0.18],
  ],
  [
    [-0.65, -0.39],
    [-0.51, -0.73],
    [-0.28, -0.88],
    [-0.044, -0.84],
    [0.1, -0.46],
  ],
];
const segments = paths.flatMap((path) => {
  const curve = new T.CatmullRomCurve3(path.map(v2), false, "centripetal");
  const ps = curve.getPoints((path.length - 1) * 8);
  return ps.slice(1).map((p, i) => {
    const dx = p.x - ps[i].x,
      dy = p.y - ps[i].y;
    return [ps[i].x, ps[i].y, dx, dy, 1 / (dx * dx + dy * dy)];
  });
});
function column(x, y) {
  let d = Infinity;
  for (const lobe of lobes) d = smoothUnion(d, ellipse(x, y, lobe), 0.12);
  for (const hole of windows) d = Math.max(d, -ellipse(x, y, hole));
  const edge2 = Math.max(0, d) ** 2;
  let centerline2 = Infinity;
  for (const [ax, ay, dx, dy, invLength2] of segments) {
    const px = x - ax,
      py = y - ay;
    const t = Math.max(0, Math.min(1, (px * dx + py * dy) * invLength2));
    centerline2 = Math.min(
      centerline2,
      (px - t * dx) ** 2 + (py - t * dy) ** 2,
    );
  }
  const h2 = (wall) =>
    -smoothUnion(
      edge2 - (SHEET - wall) ** 2,
      centerline2 - (TUBE - wall) ** 2,
      0.00155,
    );
  return [h2(0), h2(BILAYER)];
}
const bend = (x, y) => 0.045 * x * x + 0.062 * y * y + 0.02 * x * y;
const ripple = (x, y) =>
  0.009 * Math.sin(3.1 * x + 0.3) * Math.sin(2.1 * y + 0.1);
const localPoint = (x, y, h) => V(x, y, bend(x, y) + ripple(x, y) + h);

// Project a small chart directly onto the inner leaflet of the mother-cell PM.
// Positive h runs toward the cytosol. The inset is measured along its true normal.
function yeastCortexPoint(x, y, h) {
  const scale = 0.165;
  const a = 1.446,
    b = 1.786,
    c = 1.096;
  const lat = -0.14 + (y * scale) / b;
  const lon = 2.56 + (x * scale) / (1.27 * Math.cos(-0.14));
  const nx = Math.cos(lat) * Math.cos(lon),
    ny = Math.sin(lat),
    nz = Math.cos(lat) * Math.sin(lon);
  const n = V(nx / a, ny / b, nz / c).normalize();
  return V(a * nx, b * ny, c * nz).addScaledVector(
    n,
    -scale * (SHEET + GAP + ripple(x, y) + h),
  );
}

function material(color, opacity = 1) {
  return new T.MeshPhysicalMaterial({
    color,
    roughness: 0.36,
    clearcoat: 0.24,
    side: T.DoubleSide,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity === 1,
  });
}
function add(g, geo, mat, flags = {}) {
  const m = new T.Mesh(geo, mat);
  Object.assign(m.userData, { hitId: "yeastER" }, flags);
  g.add(m);
  return m;
}
function deform(geometry, inCell) {
  const p = geometry.attributes.position,
    n = geometry.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i),
      z = p.getZ(i);
    const q = inCell ? yeastCortexPoint(x, y, z) : localPoint(x, y, z);
    if (inCell) {
      // Curvature changes the local basis in the cellular overview.
      const du = yeastCortexPoint(x + 0.001, y, z).sub(q);
      const dv = yeastCortexPoint(x, y + 0.001, z).sub(q);
      const dw = yeastCortexPoint(x, y, z + 0.001).sub(q);
      const basis = new T.Matrix3().set(
        du.x,
        dv.x,
        dw.x,
        du.y,
        dv.y,
        dw.y,
        du.z,
        dv.z,
        dw.z,
      );
      const normal = V(n.getX(i), n.getY(i), n.getZ(i))
        .applyMatrix3(basis.invert().transpose())
        .normalize();
      n.setXYZ(i, normal.x, normal.y, normal.z);
    } else {
      const dx =
        0.09 * x +
        0.02 * y +
        0.0279 * Math.cos(3.1 * x + 0.3) * Math.sin(2.1 * y + 0.1);
      const dy =
        0.124 * y +
        0.02 * x +
        0.0189 * Math.sin(3.1 * x + 0.3) * Math.cos(2.1 * y + 0.1);
      const nz = n.getZ(i);
      const normal = V(
        n.getX(i) - dx * nz,
        n.getY(i) - dy * nz,
        nz,
      ).normalize();
      n.setXYZ(i, normal.x, normal.y, normal.z);
    }
    p.setXYZ(i, q.x, q.y, q.z);
  }
  return geometry;
}

function surfaces(g, inCell) {
  const n = inCell ? 55 : 94;
  const limit = inCell ? 32000 : 110000;
  const helper = new T.MeshBasicMaterial();
  const mc = new MarchingCubes(n, helper, true, false, limit);
  const outer = new Float32Array(n * n),
    inner = new Float32Array(n * n);
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const h = column(
        ((2 * x) / n - 1) * half[0],
        ((2 * y) / n - 1) * half[1],
      );
      outer[x + y * n] = h[0];
      inner[x + y * n] = h[1];
    }
  for (const [layer, columns] of (inCell
    ? [outer]
    : [outer, inner]
  ).entries()) {
    for (let z = 0; z < n; z++) {
      const z2 = (((2 * z) / n - 1) * half[2]) ** 2,
        offset = z * n * n;
      for (let i = 0; i < columns.length; i++)
        mc.field[offset + i] = columns[i] - z2;
    }
    // The second field has different derivatives at the sheet-to-tube joins.
    mc.normal_cache.fill(0);
    mc.isolation = 0;
    mc.update();
    if (mc.count > limit * 3)
      throw new Error("Cortical ER mesh exceeds its triangle budget");
    const geo = new T.BufferGeometry();
    for (const key of ["position", "normal", "uv"]) {
      const attr = mc.geometry.attributes[key];
      geo.setAttribute(
        key,
        new T.BufferAttribute(
          attr.array.slice(0, mc.count * attr.itemSize),
          attr.itemSize,
        ),
      );
    }
    geo.scale(...half);
    const paint = material(
      layer ? "#a3bab2" : "#93aaa2",
      layer ? 1 : inCell ? 1 : 0.89,
    );
    if (layer) paint.side = T.BackSide;
    if (inCell) add(g, deform(geo, true), paint);
    else {
      for (const [cap, piece] of splitSection(geo, ([x, y, z]) =>
        Math.min(cutLine(x, y), z - cutHeight),
      ).entries()) {
        add(g, deform(piece, false), paint, { cap: Boolean(cap) });
      }
      geo.dispose();
    }
  }
  mc.geometry.dispose();
  helper.dispose();
  return { n, outer, inner };
}
function geometry(pos, idx) {
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

function sectionRim(g, { n, outer, inner }) {
  // Physical cut faces between the cytosolic and lumen-facing membrane surfaces.
  // Horizontal and vertical halves form a window and leave the lumen empty.
  const pos = [],
    idx = [];
  const emit = (poly) => {
    if (poly.length < 3) return;
    const base = pos.length / 3;
    for (const [x, y, z] of poly) pos.push(...localPoint(x, y, z).toArray());
    for (let i = 1; i < poly.length - 1; i++)
      idx.push(base, base + i, base + i + 1);
  };
  function clip(poly, key) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length];
      if (a[key] >= 0) out.push(a);
      if (a[key] >= 0 === b[key] >= 0) continue;
      const f = a[key] / (a[key] - b[key]);
      out.push(a.map((v, j) => v + (b[j] - v) * f));
    }
    return out;
  }
  let prev;
  for (let j = 0; j <= n; j++) {
    const y = ((2 * j) / n - 1) * half[1];
    const row = Array.from({ length: n + 1 }, (_, i) => {
      const x = ((2 * i) / n - 1) * half[0];
      const outside = i === n || j === n;
      const a = outside ? -1 : outer[i + j * n];
      const b = outside ? -1 : inner[i + j * n];
      return [
        x,
        y,
        cutHeight,
        a - cutHeight ** 2,
        cutHeight ** 2 - b,
        cutLine(x, y),
      ];
    });
    if (prev)
      for (let i = 0; i < n; i++)
        for (const tri of [
          [prev[i], prev[i + 1], row[i + 1]],
          [prev[i], row[i + 1], row[i]],
        ]) {
          if (tri.some((p) => p[5] >= 0)) emit(clip(clip(clip(tri, 3), 4), 5));
        }
    prev = row;
  }
  let pair;
  for (let j = 0; j <= 220; j++) {
    const y = ((2 * j) / 220 - 1) * half[1],
      x = -0.24 * y - 0.23;
    const [o, i] = column(x, y);
    const next = [
      [x, y, Math.sqrt(Math.max(cutHeight ** 2, o))],
      [x, y, Math.sqrt(Math.max(cutHeight ** 2, i))],
    ];
    if (pair && (next[0][2] > cutHeight || pair[0][2] > cutHeight))
      emit([pair[0], pair[1], next[1], next[0]]);
    pair = next;
  }
  add(g, geometry(pos, idx), material("#d5d8bd"), { cutOnly: true });
}
function contextPM(g) {
  const pos = [],
    idx = [];
  const sectors = 90,
    rings = 16;
  const layerSize = 1 + rings * sectors;
  for (let side = 0; side < 2; side++) {
    const base = side * layerSize;
    const z = -SHEET - GAP - side * BILAYER;
    pos.push(0, 0, z);
    const triangle = (a, b, c) =>
      side ? idx.push(a, c, b) : idx.push(a, b, c);
    for (let i = 1; i <= rings; i++) {
      for (let j = 0; j < sectors; j++) {
        const t = (2 * Math.PI * j) / sectors,
          r = i / rings;
        const edge =
          1 + 0.032 * Math.cos(3 * t + 0.42) + 0.02 * Math.sin(5 * t - 0.12);
        const x = r * 1.7 * edge * Math.cos(t),
          y = r * 1.03 * edge * Math.sin(t);
        pos.push(x, y, bend(x, y) + z);
        const a = base + 1 + (i - 1) * sectors + j,
          b = a - j + ((j + 1) % sectors);
        if (i === 1) triangle(base, a, b);
        else {
          triangle(a - sectors, a, b - sectors);
          triangle(b - sectors, a, b);
        }
      }
    }
  }
  for (let j = 0; j < sectors; j++) {
    const a = 1 + (rings - 1) * sectors + j,
      b = a - j + ((j + 1) % sectors);
    idx.push(a, b + layerSize, b, a, a + layerSize, b + layerSize);
  }
  const plasmaMembrane = add(g, geometry(pos, idx), material("#a7b8c3", 0.25), {
    nonInteractive: true,
  });
  plasmaMembrane.name = "adjacent-plasma-membrane";
}
function cytosolicRibosomes(g) {
  const geo = new T.IcosahedronGeometry(1, 2),
    mat = material("#bbaa94");
  const sites = [];
  let anchor;
  for (let i = 0; i < 140 && sites.length < 15; i++) {
    const x = -1.34 + ((i * 0.61803398875) % 1) * 1.61,
      y = -0.61 + ((i * 0.38196601125 + ((i * i * 0.013) % 1)) % 1) * 1.25;
    const [h2] = column(x, y);
    if (
      h2 < SHEET * SHEET * 0.9 ||
      sites.some(([a, b]) => Math.hypot(x - a, y - b) < 0.18)
    )
      continue;
    sites.push([x, y]);
    const z = Math.sqrt(h2),
      angle = i * 2.4;
    for (const small of [false, true]) {
      const lateral = small ? 0.028 : -0.013;
      const m = add(g, geo, mat, {
        nonInteractive: true,
        cap: cutLine(x, y) > 0,
      });
      m.position.copy(
        localPoint(
          x + Math.cos(angle) * lateral,
          y + Math.sin(angle) * lateral,
          z + (small ? 0.081 : 0.044),
        ),
      );
      m.scale.set(...(small ? [0.035, 0.041, 0.026] : [0.052, 0.046, 0.044]));
      m.rotation.set(0.1, 0.15, angle);
      if (small && !anchor && !m.userData.cap) anchor = m.position.toArray();
    }
  }
  return anchor;
}
export function yeastCorticalER({ inCell = false } = {}) {
  const g = new T.Group();
  const fields = surfaces(g, inCell);
  if (inCell) {
    const x = -0.83,
      y = -0.08;
    g.userData.partAnchors = {
      yeastER: yeastCortexPoint(x, y, Math.sqrt(column(x, y)[0])).toArray(),
    };
    return g;
  }
  contextPM(g);
  sectionRim(g, fields);
  const ribosomeAnchor = cytosolicRibosomes(g);
  const [hx, hy] = windows[1];
  g.userData.landmarks = [
    {
      zh: "通向胞质的窗孔",
      en: "Cytosol through a fenestra",
      position: localPoint(hx, hy, 0).toArray(),
    },
    {
      zh: "膜管三叉连接",
      en: "Three-way tubule junction",
      position: localPoint(0.47, 0.13, -TUBE + BILAYER).toArray(),
    },
    {
      zh: "相邻的质膜",
      en: "Adjacent plasma membrane",
      position: [1.42, 0.38, bend(1.42, 0.38) - SHEET - GAP],
    },
    {
      zh: "胞质侧结合的核糖体",
      en: "Ribosome on the cytosolic face",
      position: ribosomeAnchor,
    },
  ];
  g.rotation.set(0.27, -0.18, -0.055);
  return g;
}
