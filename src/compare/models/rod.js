import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildRodRhodopsin } from "./rodRhodopsin.js";

const TAU = 2 * Math.PI;
const ROOT = "rodPhotoreceptor",
  OUT = "rodOuterSegment",
  DISCS = "rodDiscs",
  CIL = "rodConnectingCilium",
  INNER = "rodInnerSegment",
  SYN = "rodSpherule",
  RH = "rodRhodopsin";
const C = {
  outer: "#788696",
  edge: "#c4bec1",
  disc: "#b69567",
  discRim: "#e2c69a",
  cilium: "#a2a5b0",
  doublet: "#ab835c",
  link: "#d5b783",
  inner: "#a3a4aa",
  mitochondria: "#ac7c6a",
  crista: "#e0b497",
  nucleus: "#9e91a5",
  chromatin: "#7f688d",
  terminal: "#9292a1",
  ribbon: "#9e7186",
  density: "#775c70",
  vesicle: "#d4b685",
  rhodopsin: "#92566d",
  retinal: "#dbb36b",
};
const section = { cutOnly: true },
  cap = { cap: true };
const cutModes = ["section", "explode"];
const vector = (p) => new T.Vector3(...p);
const mark = (id, zh, en, p, modes) => ({
  id,
  zh,
  en,
  position: p,
  ...(modes ? { visibleModes: modes } : {}),
});

function builder() {
  const bins = new Map();
  return {
    add(geometry, color, id, role, flags = {}) {
      const key = [id, role, color, !!flags.cap, !!flags.cutOnly].join("/");
      if (!bins.has(key))
        bins.set(key, { color, id, role, flags, geometries: [] });
      geometry.deleteAttribute("uv");
      bins.get(key).geometries.push(geometry);
    },
    finish() {
      const group = new T.Group(),
        materials = new Map();
      for (const { color, id, role, flags, geometries } of bins.values()) {
        const tinted = Boolean(geometries[0].attributes.color);
        const materialKey = color + tinted;
        if (!materials.has(materialKey))
          materials.set(
            materialKey,
            new T.MeshPhysicalMaterial({
              color: tinted ? "#ffffff" : color,
              vertexColors: tinted,
              roughness: 0.53,
              clearcoat: 0.12,
              clearcoatRoughness: 0.48,
              side: T.DoubleSide,
            }),
          );
        const mesh = new T.Mesh(
          mergeGeometries(geometries),
          materials.get(materialKey),
        );
        mesh.userData = { hitId: id, anatomyRole: role, ...flags };
        group.add(mesh);
        geometries.forEach((g) => g.dispose());
      }
      return group;
    },
  };
}
function indexed(position, normal, index) {
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(position, 3));
  g.setIndex(index);
  if (normal) g.setAttribute("normal", new T.Float32BufferAttribute(normal, 3));
  else g.computeVertexNormals();
  return g;
}
function ball(p, radii, radial = 18) {
  return new T.SphereGeometry(1, radial, Math.max(7, Math.ceil(radial * 0.6)))
    .scale(...radii)
    .translate(...p);
}
function tube(points, radius, steps = 18, radial = 6) {
  return new T.TubeGeometry(
    new T.CatmullRomCurve3(points.map(vector)),
    steps,
    radius,
    radial,
    false,
  );
}
function rod(a, b, r, radial = 7) {
  const p = vector(a),
    d = vector(b).sub(p);
  const g = new T.CylinderGeometry(r, r, d.length(), radial);
  g.applyQuaternion(
    new T.Quaternion().setFromUnitVectors(
      new T.Vector3(0, 1, 0),
      d.clone().normalize(),
    ),
  );
  return g.translate(...p.addScaledVector(d, 0.5).toArray());
}

// A meridian row contains longitudinal position, transverse centre, and two radii.
// The angular derivative is shared by both halves, so the whole shell has no light seam.
function surface(rows, front, sides, contour = () => 1) {
  const position = [],
    normal = [],
    index = [],
    rings = [];
  const point = (row, a) => {
    const [x, y, z, ry, rz] = row,
      r = contour(a);
    return new T.Vector3(x, y + ry * r * Math.cos(a), z + rz * r * Math.sin(a));
  };
  for (const [i, row] of rows.entries()) {
    const axis = row[3] === 0 && row[4] === 0;
    const ids = [];
    for (let j = 0; j <= (axis ? 0 : sides); j++) {
      const a = (front ? 0 : Math.PI) + (Math.PI * j) / sides;
      ids.push(position.length / 3);
      position.push(...point(row, a).toArray());
      if (axis) normal.push(i === 0 ? -1 : 1, 0, 0);
      else {
        const tangent = point(row, a + 0.0001).sub(point(row, a - 0.0001));
        const along = point(rows[Math.min(i + 1, rows.length - 1)], a).sub(
          point(rows[Math.max(0, i - 1)], a),
        );
        normal.push(...tangent.cross(along).normalize().toArray());
      }
    }
    rings.push(ids);
  }
  for (let i = 0; i < rings.length - 1; i++)
    for (let j = 0; j < sides; j++) {
      const a = rings[i],
        b = rings[i + 1];
      if (a.length === 1) index.push(a[0], b[j + 1], b[j]);
      else if (b.length === 1) index.push(a[j], a[j + 1], b[0]);
      else index.push(a[j], a[j + 1], b[j], a[j + 1], b[j + 1], b[j]);
    }
  return indexed(position, normal, index);
}
function shell(b, rows, color, id, role, sides = 28, contour, flags = {}) {
  for (const front of [false, true])
    b.add(
      surface(rows, front, sides, contour),
      color,
      id,
      role,
      front ? cap : flags,
    );
}
// Interpolate smooth, shape-preserving meridians through anatomical landmarks.
// Minmod slopes also retain exact extrema at the shoulders and neck.
function smoothRows(knots, steps = 5) {
  const result = [];
  const slope = (i, d) => {
    const a = knots[Math.max(0, i - 1)],
      c = knots[Math.min(knots.length - 1, i + 1)];
    const p = knots[i];
    if (i === 0) return (c[d] - p[d]) / (c[0] - p[0]);
    if (i === knots.length - 1) return (p[d] - a[d]) / (p[0] - a[0]);
    const left = (p[d] - a[d]) / (p[0] - a[0]),
      right = (c[d] - p[d]) / (c[0] - p[0]);
    return left * right > 0 ? (2 * left * right) / (left + right) : 0;
  };
  for (let i = 0; i < knots.length - 1; i++) {
    const a = knots[i],
      c = knots[i + 1],
      dx = c[0] - a[0];
    for (let j = 0; j < steps; j++) {
      const t = j / steps,
        row = [a[0] + dx * t],
        t2 = t * t,
        t3 = t2 * t;
      for (let d = 1; d < 5; d++)
        row.push(
          (2 * t3 - 3 * t2 + 1) * a[d] +
            (t3 - 2 * t2 + t) * dx * slope(i, d) +
            (-2 * t3 + 3 * t2) * c[d] +
            (t3 - t2) * dx * slope(i + 1, d),
        );
      result.push(row);
    }
  }
  result.push(knots.at(-1));
  return result;
}
function seam(b, rows, color, id, radius, contour = () => 1) {
  for (const a of [0, Math.PI]) {
    const path = rows.map(([x, y, z, ry]) => [
      x,
      y + ry * contour(a) * Math.cos(a),
      z,
    ]);
    b.add(
      tube(path, radius, rows.length - 1, 6),
      color,
      id,
      "sectionEdge",
      section,
    );
  }
}

const ciliumY = 0.29,
  ciliumZ = 0,
  ciliumRadius = 0.098,
  ciliumStart = 0.64,
  ciliumEnd = 1.04;
const count = 29,
  stackStart = 1.27,
  stackEnd = 4.0;
const stackX = (i) => T.MathUtils.lerp(stackStart, stackEnd, i / (count - 1));
const pigmentIndex = 19;
function outerRows() {
  return smoothRows(
    [
      [ciliumEnd, ciliumY, 0, ciliumRadius, ciliumRadius],
      [1.066, 0.256, 0, 0.136, 0.14],
      [1.105, 0.16, 0, 0.261, 0.26],
      [1.16, 0.053, 0, 0.393, 0.38],
      [1.23, 0.005, 0, 0.471, 0.457],
      [1.43, 0, 0, 0.485, 0.467],
      [3.87, 0, 0, 0.475, 0.459],
      [4.04, 0, 0, 0.465, 0.455],
      [4.115, 0, 0, 0.406, 0.399],
      [4.165, 0, 0, 0.292, 0.287],
      [4.194, 0, 0, 0.172, 0.169],
      [4.21, 0, 0, 0, 0],
    ],
    5,
  );
}
// A single deep incisure is continuous with the peripheral rim. It enters from
// the side; the two faces and both sides of the notch enclose one intradiscal lumen.
function incisure(a) {
  const d = Math.atan2(Math.sin(a + 0.27), Math.cos(a + 0.27));
  return 1 - 0.58 * Math.exp(-(d * d) / (2 * 0.085 ** 2));
}
function disc(b, x, radius, h, id, detail = false) {
  const rows = [
    [0, -0.74],
    [0.42, -0.75],
    [0.78, -0.81],
    [0.91, -1.03],
    [0.96, -0.94],
    [0.989, -0.56],
    [1, 0],
    [0.989, 0.56],
    [0.96, 0.94],
    [0.91, 1.03],
    [0.78, 0.81],
    [0.42, 0.75],
    [0, 0.74],
  ].map(([r, t]) => [x + h * t, 0, 0, radius * r, radius * 0.965 * r]);
  shell(b, rows, C.disc, id, "closedDisc", detail ? 72 : 40, incisure);
  seam(b, rows, C.discRim, id, h * 0.21, incisure);
}
function pigmentSite(b, x, y, z, h, size, id) {
  // One enlarged location marker traverses just ONE face of the flattened sac.
  for (let j = 0; j < 7; j++) {
    const a = (TAU * j) / 7,
      dy = size * Math.cos(a),
      dz = size * Math.sin(a);
    b.add(
      rod(
        [x - h * 0.46, y + dy * 0.84, z + dz * 0.84],
        [x + h * 0.46, y + dy * 1.03, z + dz * 1.03],
        size * 0.32,
        8,
      ),
      C.rhodopsin,
      id,
      "pigmentHelices",
    );
  }
  b.add(
    ball([x + h * 0.24, y, z], [h * 0.2, size * 0.54, size * 0.22], 12),
    C.retinal,
    id,
    "pigmentSite",
  );
}
function outer(b, leaf = false) {
  const owner = OUT,
    rows = outerRows();
  shell(b, rows, C.outer, owner, "outerPlasmalemma", 36);
  seam(b, rows, C.edge, owner, 0.007);
  for (let i = 0; i < count; i++)
    disc(
      b,
      stackX(i),
      0.422 - (0.004 * i) / (count - 1),
      0.024,
      leaf ? OUT : DISCS,
    );
  pigmentSite(
    b,
    stackX(pigmentIndex) + 0.024 * 0.75,
    0.13,
    0.004,
    0.024,
    0.026,
    leaf ? OUT : RH,
  );
}
function isolatedDiscs(b) {
  for (const x of [-0.82, 0, 0.82]) disc(b, x, 1.12, 0.076, DISCS, true);
  pigmentSite(b, 0.82 + 0.076 * 0.75, 0.26, -0.14, 0.076, 0.057, DISCS);
}

function arc2(cx, cy, r, from, to, steps) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = T.MathUtils.lerp(from, to, i / steps);
    return new T.Vector2(cx + r * Math.cos(a), cy + r * Math.sin(a));
  });
}
// Extrude a genuinely perforated wall: the cell-facing section has separate
// A and B lumina. Interior sidewalls use the opposite orientation to the outside.
function hollowPrism(outer, holes, start, end) {
  const wind = (points, clockwise) =>
    T.ShapeUtils.isClockWise(points) === clockwise
      ? points
      : [...points].reverse();
  const outline = wind(outer, false),
    openings = holes.map((h) => wind(h, true));
  const loops = [outline, ...openings],
    points = loops.flat(),
    position = [],
    index = [];
  const caps = T.ShapeUtils.triangulateShape(outline, openings);
  for (const [side, x] of [start, end].entries()) {
    const base = position.length / 3;
    for (const p of points) position.push(x, p.x, p.y);
    for (const [a, b, c] of caps)
      index.push(base + a, base + (side ? b : c), base + (side ? c : b));
  }
  for (const loop of loops) {
    const base = position.length / 3;
    for (const p of loop) position.push(start, p.x, p.y, end, p.x, p.y);
    for (let i = 0; i < loop.length; i++) {
      const a = base + i * 2,
        b = base + ((i + 1) % loop.length) * 2;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return indexed(position, null, index);
}
function doubletShape(theta, r, cy, cz, start, end) {
  const a = 0.155,
    b = 0.136,
    d = 0.214,
    wall = 0.026;
  const meet = (ra, rb) => {
    const u = (ra * ra - rb * rb + d * d) / (2 * d),
      v = Math.sqrt(ra * ra - u * u);
    return [Math.atan2(v, u), Math.atan2(v, u - d)];
  };
  const [angleA, angleB] = meet(a, b),
    [sharedA, innerB] = meet(a, b - wall);
  // Only the exposed arc of the B tube has an independent outer wall.
  // Its incomplete inner outline closes against the outer side of the A tube.
  const outline = [
    ...arc2(0, 0, a, angleA, TAU - angleA, 27),
    ...arc2(d, 0, b, -angleB, angleB, 22).slice(1, -1),
  ];
  const lumenA = arc2(0, 0, a - wall, 0, TAU, 28).slice(0, -1);
  const lumenB = [
    ...arc2(d, 0, b - wall, -innerB, innerB, 21),
    ...arc2(0, 0, a, sharedA, -sharedA, 10).slice(1, -1),
  ];
  const c = Math.cos(theta),
    s = Math.sin(theta);
  const transform = (poly) =>
    poly.map(
      ({ x: u, y: v }) =>
        new T.Vector2(
          cy + r * ((0.61 + v) * c - u * s),
          cz + r * ((0.61 + v) * s + u * c),
        ),
    );
  const geometry = hollowPrism(
    transform(outline),
    [transform(lumenA), transform(lumenB)],
    start,
    end,
  );
  const p = geometry.attributes.position,
    colors = [];
  const complete = new T.Color(C.doublet),
    incomplete = new T.Color("#d2b383");
  const shared = (a * a - b * b + d * d) / (2 * d);
  for (let i = 0; i < p.count; i++) {
    const u = (-(p.getY(i) - cy) * s + (p.getZ(i) - cz) * c) / r;
    const tint = u < shared ? complete : incomplete;
    colors.push(tint.r, tint.g, tint.b);
  }
  geometry.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  return geometry;
}
function cilium(b, leaf = false) {
  const start = leaf ? -1.36 : ciliumStart,
    end = leaf ? 1.36 : ciliumEnd,
    r = leaf ? 0.79 : ciliumRadius;
  const cy = leaf ? 0 : ciliumY,
    cz = leaf ? 0 : ciliumZ;
  const rows = [
    [start, cy, cz, r, r],
    [end, cy, cz, r, r],
  ];
  shell(b, rows, C.cilium, CIL, "ciliaryPlasmalemma", 36);
  seam(b, rows, C.edge, CIL, 0.017 * r);
  for (let j = 0; j < 9; j++) {
    const a = (TAU * j) / 9;
    // The axial ends of the isolated view are artificial transverse crops.
    b.add(
      doubletShape(a, r, cy, cz, start, end),
      C.doublet,
      CIL,
      "axonemalDoublets",
    );
    for (const u of leaf ? [0.16, 0.39, 0.62, 0.85] : [0.32, 0.7]) {
      const x = T.MathUtils.lerp(start, end, u),
        c = Math.cos(a),
        s = Math.sin(a);
      const at = (dr, dt, dx = 0) => [
        x + dx,
        cy + r * (dr * c - dt * s),
        cz + r * (dr * s + dt * c),
      ];
      const stem = at(0.846, 0.015);
      const visibility = s > 1e-6 ? cap : {};
      b.add(
        rod(at(0.748, 0.015), stem, 0.02 * r, 7),
        C.link,
        CIL,
        "transitionLinks",
        visibility,
      );
      for (const sign of [-1, 1])
        b.add(
          rod(stem, at(0.99, sign * 0.082, sign * r * 0.018), 0.014 * r, 7),
          C.link,
          CIL,
          "transitionLinks",
          visibility,
        );
    }
  }
}

const synCentre = -3.7,
  synScale = 0.58;
const joinX = synCentre + 0.82 * synScale,
  joinR = 0.145 * synScale;
function innerRows(leaf) {
  const knots = [
    [joinX, 0, 0, joinR, joinR],
    [-2.85, 0.015, 0, 0.083, 0.084],
    [-2.57, 0.037, 0, 0.112, 0.108],
    [-2.43, 0.068, 0, 0.226, 0.198],
    [-2.22, 0.092, 0, 0.424, 0.372],
    [-1.985, 0.1, 0, 0.521, 0.454],
    [-1.78, 0.089, 0, 0.487, 0.431],
    [-1.54, 0.057, 0, 0.367, 0.33],
    [-1.3, 0.015, 0, 0.3, 0.29],
    [-0.87, 0, 0, 0.337, 0.322],
    [-0.38, 0, 0, 0.456, 0.399],
    [-0.07, 0, 0, 0.478, 0.426],
    [0.19, 0.009, 0, 0.448, 0.405],
    [0.38, 0.052, 0, 0.358, 0.325],
    [0.54, 0.169, 0, 0.203, 0.179],
    [ciliumStart, ciliumY, ciliumZ, ciliumRadius, ciliumRadius],
  ];
  return smoothRows(leaf ? knots.slice(2) : knots, 5);
}
function ellipsoidRows(p, rx, ry, rz, n = 28) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (Math.PI * i) / n,
      radial = i === 0 || i === n ? 0 : Math.sin(a);
    return [p[0] - rx * Math.cos(a), p[1], p[2], ry * radial, rz * radial];
  });
}
function inner(b, leaf = false) {
  const id = INNER,
    rows = innerRows(leaf);
  shell(b, rows, C.inner, id, "innerAndSomaMembrane", 36);
  seam(b, rows, C.edge, id, 0.0065);
  const p = [-1.96, 0.09, 0],
    nucleus = ellipsoidRows(p, 0.391, 0.398, 0.349, 34);
  shell(b, nucleus, C.nucleus, id, "nuclearEnvelope", 26);
  seam(b, nucleus, "#c3b7c3", id, 0.008);
  // Adult mouse rods have centrally concentrated heterochromatin.
  b.add(
    ball([p[0] + 0.015, p[1], -0.073], [0.255, 0.247, 0.212], 32),
    C.chromatin,
    id,
    "centralHeterochromatin",
    section,
  );
  for (let i = 0; i < 9; i++) {
    const a = (TAU * i) / 9,
      pts = Array.from({ length: 16 }, (_, k) => {
        const t = k / 15,
          d = a + 0.56 * (t - 0.5);
        return [
          p[0] + (0.265 + 0.014 * Math.sin(9 * t + i)) * Math.cos(d),
          p[1] + (0.277 + 0.016 * Math.cos(12 * t + i)) * Math.sin(d),
          -0.12 + 0.065 * Math.sin(5 * t + i),
        ];
      });
    b.add(
      tube(pts, 0.009, 19, 6),
      "#b2a1b3",
      id,
      "peripheralChromatin",
      section,
    );
  }
  // The myoid between the soma and ellipsoid contains the Golgi complex.
  for (let i = 0; i < 5; i++) {
    const sheet = new T.SphereGeometry(1, 28, 14),
      p = sheet.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const u = p.getX(k),
        v = p.getY(k),
        w = p.getZ(k);
      p.setXYZ(
        k,
        -1.08 + (i - 2) * 0.01 + u * (0.191 + 0.006 * Math.sin(i)),
        -0.127 +
          i * 0.046 +
          0.012 * v +
          0.05 * u * u +
          0.02 * w * w +
          0.021 * u,
        -0.08 + 0.105 * w,
      );
    }
    sheet.computeVertexNormals();
    b.add(sheet, "#a38c99", id, "myoidGolgi", section);
  }
  const angles = [0, 0.71, 1.61, 2.43, Math.PI, 4.1, 5.19];
  for (let j = 0; j < 7; j++) {
    const a = angles[j],
      cy = 0.205 * Math.cos(a),
      cz = 0.165 * Math.sin(a),
      x = -0.162 + 0.04 * Math.sin(j * 1.7),
      rx = 0.423 + 0.037 * Math.cos(j),
      ry = 0.087 + 0.008 * Math.sin(j),
      rz = 0.084 + 0.008 * Math.cos(j);
    const sample = j === 0 || j === 4,
      organelle = ellipsoidRows([x, cy, cz], rx, ry, rz, 22);
    if (!sample)
      for (const [i, row] of organelle.entries()) {
        const u = i / (organelle.length - 1);
        row[1] += 0.021 * Math.sin(Math.PI * u) * Math.sin(5.2 * u + j);
        row[2] += 0.012 * Math.sin(Math.PI * u) * Math.cos(4.7 * u + j);
      }
    for (const front of [false, true]) {
      const flags = sample ? (front ? cap : {}) : cz > 0 ? cap : {};
      b.add(
        surface(organelle, front, leaf ? 18 : 12),
        C.mitochondria,
        id,
        "ellipsoidMitochondria",
        flags,
      );
    }
    if (!sample) continue;
    seam(b, organelle, "#d6a68c", id, 0.005);
    // Profiles of inner-membrane folds in the one mitochondrion cut longitudinally.
    for (let k = 0; k < 8; k++) {
      const tx = -0.72 + k * 0.202,
        rr = Math.sqrt(1 - tx * tx);
      const path = [
        [0, 0.87, -0.25],
        [0.01, 0.67, -0.2],
        [0.02, 0.16, -0.13],
        [0.03, -0.26, -0.15],
        [0.043, -0.36, -0.2],
        [0.054, -0.17, -0.23],
        [0.055, 0.28, -0.23],
        [0.055, 0.79, -0.26],
      ].map(([dx, dy, dz]) => [
        x + rx * tx + dx,
        cy + ry * rr * dy,
        cz + rz * rr * dz,
      ]);
      b.add(tube(path, 0.006, 15), C.crista, id, "cristaProfiles", section);
    }
  }
}

function roofX(r) {
  return -0.15 - 0.375 * (r / 0.335) ** 1.8;
}
const spheruleRows = () => {
  const dome = Array.from({ length: 16 }, (_, i) => {
    const r = (0.335 * i) / 15;
    return [roofX(r), 0, 0, r, r];
  });
  // The mouth turns back into the outer membrane. The invagination is open to
  // the extracellular space and its blind end lies under the synaptic ribbon.
  const rim = [
    [-0.544, 0.356],
    [-0.548, 0.385],
    [-0.534, 0.416],
    [-0.508, 0.445],
  ];
  const outside = smoothRows(
    [
      [-0.508, 0, 0, 0.445, 0.445],
      [-0.399, 0, 0, 0.535, 0.53],
      [-0.21, 0, 0, 0.617, 0.592],
      [0.018, 0, 0, 0.636, 0.606],
      [0.245, 0, 0, 0.575, 0.551],
      [0.452, 0, 0, 0.428, 0.414],
      [0.61, 0, 0, 0.249, 0.241],
      [0.752, 0, 0, 0.154, 0.153],
      [0.82, 0, 0, 0.145, 0.145],
    ],
    5,
  );
  return [
    ...dome,
    ...rim.map(([x, r]) => [x, 0, 0, r, r]),
    ...outside.slice(1),
  ];
};
function spherule(b, leaf = false) {
  const id = SYN,
    scale = leaf ? 2.05 : synScale,
    origin = leaf ? 0 : synCentre;
  const loc = (p) => [origin + p[0] * scale, p[1] * scale, p[2] * scale];
  const rows = spheruleRows().map(([x, y, z, ry, rz]) => [
    ...loc([x, y, z]),
    ry * scale,
    rz * scale,
  ]);
  shell(b, rows, C.terminal, id, "invaginatedTerminalMembrane", 36);
  seam(b, rows, C.edge, id, 0.009 * scale);
  const position = [],
    index = [],
    foot = [];
  function ribbonPoint(t, height, across = 0) {
    const a = Math.PI * (1.04 + 0.92 * t);
    const y = 0.257 * Math.cos(a) + across * Math.cos(a),
      z = -0.017 + 0.2 * Math.sin(a) + across * Math.sin(a);
    const base = roofX(Math.hypot(y, z));
    return [base + 0.037 + height, y, z];
  }
  for (let i = 0; i <= 36; i++) {
    const t = i / 36,
      h = 0.23 * (0.69 + 0.31 * Math.sin(Math.PI * t));
    for (const [height, side] of [
      [0, -0.014],
      [0, 0.014],
      [h, 0.014],
      [h, -0.014],
    ])
      position.push(...loc(ribbonPoint(t, height, side)));
    foot.push(loc(ribbonPoint(t, -0.022)));
    if (i === 36) continue;
    for (let k = 0; k < 4; k++) {
      const a = 4 * i + k,
        c = 4 * i + ((k + 1) % 4);
      index.push(a, c, a + 4, c, c + 4, a + 4);
    }
  }
  index.push(0, 2, 1, 0, 3, 2, 144, 145, 146, 144, 146, 147);
  b.add(
    indexed(position, null, index),
    C.ribbon,
    id,
    "synapticRibbon",
    section,
  );
  b.add(
    tube(foot, 0.021 * scale, 38, 8),
    C.density,
    id,
    "arciformDensity",
    section,
  );
  for (let j = 0; j < 9; j++) {
    const t = (j + 0.5) / 9,
      h = 0.23 * (0.69 + 0.31 * Math.sin(Math.PI * t));
    for (const sign of [-1, 1])
      for (let row = 0; row < 3; row++) {
        const level = 0.018 + (row * (h - 0.025)) / 2;
        const attach = ribbonPoint(t, level, sign * 0.014);
        const centre = ribbonPoint(
          t,
          level + 0.009,
          sign * (0.055 + 0.004 * Math.sin(j + 2 * row)),
        );
        const r = 0.024 * scale;
        b.add(
          ball(loc(centre), [r, r, r], leaf ? 14 : 9),
          C.vesicle,
          id,
          "ribbonVesicles",
          section,
        );
        b.add(
          rod(loc(attach), loc(centre), 0.0047 * scale, 5),
          "#b3a085",
          id,
          "vesicleTethers",
          section,
        );
      }
  }
}

export function buildRod(id = ROOT) {
  if (id === RH) {
    const molecular = buildRodRhodopsin();
    molecular.userData.specimenId = ROOT;
    return molecular;
  }
  const b = builder();
  let landmarks = [],
    biology = {};
  if (id === ROOT || id === OUT) outer(b, id === OUT);
  else if (id === DISCS) isolatedDiscs(b);
  if (id === ROOT || id === CIL) cilium(b, id === CIL);
  if (id === ROOT || id === INNER) inner(b, id === INNER);
  if (id === ROOT || id === SYN) spherule(b, id === SYN);
  if (![ROOT, OUT, DISCS, CIL, INNER, SYN].includes(id)) return null;
  if (id === ROOT)
    biology = {
      representedMatureDiscs: count,
      axonemalDoublets: 9,
      centralPair: 0,
      nuclei: 1,
    };
  if (id === OUT) {
    biology = { representedMatureDiscs: count, separateOuterPlasmalemma: true };
    landmarks = [
      mark(
        "sheath",
        "外节质膜",
        "Outer-segment plasma membrane",
        [1.43, -0.485, 0],
      ),
      mark(
        "stack",
        "横向排列的成熟膜盘",
        "Stack of mature transverse discs",
        [stackX(14) + 0.018, 0, 0],
        cutModes,
      ),
      mark(
        "gap",
        "膜盘与质膜之间的胞质",
        "Cytosol between disc and plasma membrane",
        [3.6, -0.449, 0],
        cutModes,
      ),
    ];
  } else if (id === DISCS) {
    biology = {
      representedMatureDiscs: 3,
      closedDiscs: true,
      incisuresPerDisc: 1,
    };
    landmarks = [
      mark("rim", "向内折返的盘缘", "Curved disc rim", [0.82, -1.12, 0]),
      mark("incisure", "由盘缘伸入的切迹", "Incisure from the rim", [
        0.82,
        1.12 * 0.42 * Math.cos(-0.27),
        1.12 * 0.965 * 0.42 * Math.sin(-0.27),
      ]),
      mark(
        "lumen",
        "封闭的盘内腔",
        "Enclosed intradiscal lumen",
        [0, -0.31, 0],
        cutModes,
      ),
      mark(
        "cleft",
        "盘间胞质间隙",
        "Interdiscal cytoplasmic gap",
        [-0.41, 0.32, -0.08],
      ),
    ];
  } else if (id === CIL) {
    biology = {
      axonemalDoublets: 9,
      centralPair: 0,
      completeATubule: true,
      sharedDoubletWall: true,
    };
    const angle = (TAU * 4) / 9;
    landmarks = [
      mark("a-tubule", "A 管 · 完整管壁", "A tubule · complete wall", [
        1.36,
        0.79 * (0.61 + 0.14),
        0,
      ]),
      mark("b-tubule", "B 管 · 与 A 管共壁", "B tubule · shares the A wall", [
        1.36,
        0.79 * (0.732 * Math.cos(angle) - 0.214 * Math.sin(angle)),
        0.79 * (0.732 * Math.sin(angle) + 0.214 * Math.cos(angle)),
      ]),
      mark(
        "centre",
        "中央无微管对",
        "Centre without a microtubule pair",
        [1.36, 0, 0],
      ),
      mark(
        "link",
        "双联体与膜间的 Y 形连接",
        "Y-link from doublet to membrane",
        [0.408, 0.79 * 0.846, 0.79 * 0.015],
        cutModes,
      ),
    ];
  } else if (id === INNER) {
    biology = { nuclei: 1, representedMitochondria: 7 };
    landmarks = [
      mark(
        "ellipsoid",
        "椭球部内纵向排列的线粒体",
        "Longitudinal mitochondria of the ellipsoid",
        [-0.12, 0.205, 0],
        cutModes,
      ),
      mark(
        "crista",
        "线粒体嵴的剖面",
        "Crista profiles",
        [-0.1, 0.23, -0.022],
        cutModes,
      ),
      mark(
        "nucleus",
        "胞体内的细胞核",
        "Nucleus in the cell body",
        [-1.96, -0.308, 0],
        cutModes,
      ),
      mark(
        "myoidGolgi",
        "近端肌样部的高尔基体",
        "Golgi cisternae in the proximal myoid",
        [-1.08, -0.014, -0.05],
        cutModes,
      ),
      mark(
        "chromatin",
        "成年小鼠视杆细胞的中央异染色质",
        "Central heterochromatin of an adult mouse rod",
        [-1.97, 0.1, 0.13],
        cutModes,
      ),
    ];
  } else if (id === SYN) {
    biology = {
      ribbons: 1,
      presynapticInvagination: true,
      sampledTetheredVesicles: 54,
    };
    const a = Math.PI * 1.5,
      base = roofX(Math.hypot(0.257 * Math.cos(a), -0.017 + 0.2 * Math.sin(a)));
    landmarks = [
      mark(
        "mouth",
        "突触小球的内陷开口",
        "Opening into the spherule invagination",
        [-0.548 * 2.05, -0.385 * 2.05, 0],
      ),
      mark(
        "ribbon",
        "位于内陷顶部的突触带",
        "Ribbon above the invagination",
        [(base + 0.23) * 2.05, 0, -0.217 * 2.05],
        cutModes,
      ),
      mark(
        "vesicles",
        "系在突触带两侧的小泡",
        "Vesicles tethered to the ribbon",
        [(roofX(0.272) + 0.164) * 2.05, 0, -0.272 * 2.05],
        cutModes,
      ),
      mark(
        "active",
        "膜内侧的弓形致密区",
        "Arciform density at the active zone",
        [(base + 0.015) * 2.05, 0, -0.217 * 2.05],
        cutModes,
      ),
    ];
  }
  const result = b.finish();
  result.userData = {
    ownedGeometry: true,
    specimenId: ROOT,
    landmarks,
    biology: { species: "Mus musculus", schematicSampling: true, ...biology },
  };
  if (id === ROOT) {
    result.userData.partAnchors = {
      [OUT]: [1.43, 0.485, 0],
      [DISCS]: [stackX(11) + 0.018, 0, 0],
      [CIL]: [(ciliumStart + ciliumEnd) / 2, ciliumY + ciliumRadius, 0],
      [INNER]: [-1.985, 0.1 + 0.521, 0],
      [SYN]: [synCentre + 0.018 * synScale, 0.636 * synScale, 0],
      [RH]: [
        stackX(pigmentIndex) + 0.018,
        0.13 + 0.026 * Math.cos((TAU * 2) / 7),
        0.004 + 0.026 * Math.sin((TAU * 2) / 7),
      ],
    };
    result.userData.partLabelModes = { [DISCS]: cutModes, [RH]: cutModes };
  }
  result.rotation.z = id === ROOT ? -0.094 : -0.105;
  if (id === DISCS || id === CIL)
    result.rotation.y = id === CIL ? -0.87 : -0.67;
  if (id === SYN) result.rotation.y = 0.42;
  return result;
}
