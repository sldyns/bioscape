import { THREE, ease } from "../../kit.js";

const TAU = Math.PI * 2;
export const CUT_Z = 0.46;
export const ROD_Y = 0.045;
export const TIP_Y = -0.82;
export const HALF_MEMBRANE = 0.036;
export const VESICLE_RADIUS = 0.166;
export const FUSION_PATCH = 0.2;
export const GATE_PATCH = 0.16;
export const RELEASE = [
  [-0.58, 0.065],
  [0.55, 0.065],
];
export const CALCIUM_SITE = [0.0, 0.15];
export const TRPM_SITE = [0.49, 0.095];
export const RECEPTOR_X = -0.33;
export const RECEPTOR_Z = 0.12;
export const POCKETS = [
  [RECEPTOR_X - 0.1, TIP_Y + 0.219, RECEPTOR_Z + 0.047],
  [RECEPTOR_X + 0.1, TIP_Y + 0.219, RECEPTOR_Z + 0.047],
];

export function roofY(x, z) {
  const r = Math.hypot(x, (z - CUT_Z) / 0.78);
  return ROD_Y - 0.8 * ease(r, 1.07, 1.93);
}
export function ribbonPoint(a, level, across = 0) {
  const s = Math.sin(a),
    c = Math.cos(a);
  const x = 1.35 * s,
    z = 0.12 - 0.75 * c;
  const nx = -s * 0.75,
    nz = c * 1.35,
    norm = Math.hypot(nx, nz);
  const px = x + (across * nx) / norm,
    pz = z - 0.08 * level + (across * nz) / norm;
  return [px, roofY(px, pz) + 0.092 + level, pz];
}
function spherePosition(x, y, z, r) {
  return [x, y, z, r, r, r];
}
function beads(k, name, items, material, geometry = k.sphere) {
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  mesh.name = name;
  const pose = new THREE.Object3D();
  items.forEach(([x, y, z, sx, sy, sz], i) => {
    pose.position.set(x, y, z);
    pose.scale.set(sx, sy, sz);
    pose.updateMatrix();
    mesh.setMatrixAt(i, pose.matrix);
  });
  k.group.add(mesh);
  return mesh;
}
function sticks(k, name, items, material) {
  const mesh = new THREE.InstancedMesh(k.cylinder, material, items.length);
  mesh.name = name;
  const pose = new THREE.Object3D(),
    a = new THREE.Vector3(),
    b = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  items.forEach(([start, end, radius], i) => {
    a.fromArray(start);
    b.fromArray(end);
    pose.position.copy(a).add(b).multiplyScalar(0.5);
    b.sub(a);
    pose.scale.set(radius, b.length(), radius);
    pose.quaternion.setFromUnitVectors(up, b.normalize());
    pose.updateMatrix();
    mesh.setMatrixAt(i, pose.matrix);
  });
  k.group.add(mesh);
  return mesh;
}
function net(rows, columns, point) {
  const positions = [],
    indices = [];
  for (let j = 0; j <= rows; j++)
    for (let i = 0; i <= columns; i++) {
      positions.push(...point(j / rows, i / columns));
      if (i === columns || j === rows) continue;
      const a = j * (columns + 1) + i,
        b = a + columns + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
function named(k, name, geometry, material, parent = k.group) {
  const m = k.mesh(geometry, material, [0, 0, 0], parent);
  m.name = name;
  return m;
}
const v3 = (p) => new THREE.Vector3(...p);

function shell(k, name, profile, material, lip, aspect, frontZ) {
  const meridian = new THREE.CatmullRomCurve3(
    profile.map(([r, y, xc = 0]) => new THREE.Vector3(r, y, xc)),
  );
  const point = (v, u) => {
    const { x: r, y, z: xc } = meridian.getPoint(v);
    const a = Math.PI * u;
    return [xc + r * Math.cos(a), y, frontZ - aspect * r * Math.sin(a)];
  };
  const m = named(k, name, net(68, 84, point), material);
  for (const u of [0, 1]) {
    k.tube(
      Array.from({ length: 60 }, (_, i) => point(i / 59, u)),
      0.027,
      lip,
      k.group,
      74,
    );
  }
  return m;
}
function halfDisk(radius, aspect, frontZ) {
  return Array.from({ length: 97 }, (_, i) => {
    const a = (Math.PI * i) / 96;
    return new THREE.Vector2(
      radius * Math.cos(a),
      frontZ - radius * aspect * Math.sin(a),
    );
  });
}
function circle([x, z, r]) {
  return Array.from({ length: 64 }, (_, i) => {
    const a = (TAU * i) / 64;
    return new THREE.Vector2(x + r * Math.cos(a), z + r * Math.sin(a));
  });
}
function perforatedLeaflet(k, name, outer, holes, y, material) {
  const borders = holes.map(circle);
  const faces = THREE.ShapeUtils.triangulateShape(outer, borders);
  const vertices = outer.concat(...borders).flatMap(({ x, y: z }) => [x, y, z]);
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.setIndex(faces.flat());
  geom.computeVertexNormals();
  return named(k, name, geom, material);
}
function flatSlab(
  k,
  name,
  radius,
  aspect,
  frontZ,
  y,
  openings,
  membrane,
  edge,
) {
  const outer = halfDisk(radius, aspect, frontZ);
  const top = perforatedLeaflet(
    k,
    name + "-upper",
    outer,
    openings,
    y + HALF_MEMBRANE,
    membrane,
  );
  perforatedLeaflet(
    k,
    name + "-lower",
    outer,
    openings,
    y - HALF_MEMBRANE,
    membrane,
  );
  const strip = net(1, 12, (v, u) => [
    (2 * u - 1) * radius,
    y + (v * 2 - 1) * HALF_MEMBRANE,
    frontZ,
  ]);
  named(k, name + "-section", strip, edge);
  return top;
}
function roof(k, m, edge) {
  const holes = [
    ...RELEASE.map(([x, z]) => [x, z, FUSION_PATCH]),
    [...CALCIUM_SITE, GATE_PATCH],
  ];
  const plane = flatSlab(
    k,
    "presynaptic-active-zone",
    1.07,
    0.78,
    CUT_Z,
    ROD_Y,
    holes,
    m,
    edge,
  );
  for (const side of [-1, 1]) {
    named(
      k,
      "invagination-roof-" + side,
      net(29, 96, (v, u) => {
        const r = 1.07 + 0.86 * v,
          a = Math.PI * u;
        const x = r * Math.cos(a),
          z = CUT_Z - r * 0.78 * Math.sin(a);
        return [x, roofY(x, z) + side * HALF_MEMBRANE, z];
      }),
      m,
    );
  }
  for (const sign of [-1, 1]) {
    named(
      k,
      "roof-cut-rim",
      net(1, 35, (v, u) => {
        const x = sign * (1.07 + 0.86 * u);
        return [x, roofY(x, CUT_Z) + (2 * v - 1) * HALF_MEMBRANE, CUT_Z];
      }),
      edge,
    );
  }
  return plane;
}
function ribbon(k, mats) {
  function contour(a) {
    return 0.86 + 0.33 * Math.cos(a);
  }
  const point = (a, l, o) => ribbonPoint(a, l, o);
  const plate = named(
    k,
    "RIBEYE-ribbon-front",
    net(30, 90, (v, u) => {
      const a = (u - 0.5) * 2.96;
      return point(a, v * contour(a), 0.041 + 0.008 * Math.sin(5 * a + v * 4));
    }),
    mats.ribbon,
  );
  named(
    k,
    "RIBEYE-ribbon-back",
    net(18, 90, (v, u) => {
      const a = (u - 0.5) * 2.96;
      return point(a, v * contour(a), -0.041);
    }),
    mats.ribbon,
  );
  for (const height of [0, 1]) {
    named(
      k,
      "ribbon-edge",
      net(1, 90, (v, u) => {
        const a = (u - 0.5) * 2.96;
        return point(a, height * contour(a), (v - 0.5) * 0.082);
      }),
      mats.ribbonEdge,
    );
  }
  for (const sign of [-1, 1]) {
    const a = sign * 1.48;
    named(
      k,
      "ribbon-end",
      net(12, 1, (v, u) => point(a, v * contour(a), (u - 0.5) * 0.082)),
      mats.ribbonEdge,
    );
  }
  const foot = k.tube(
    Array.from({ length: 51 }, (_, i) => point((i / 50 - 0.5) * 2.96, -0.023)),
    0.047,
    mats.graphite,
    k.group,
    70,
  );
  foot.name = "arciform-density";
  const cords = [],
    grain = [],
    cargo = [],
    vesicles = [];
  for (let i = 0; i < 17; i++) {
    const a = -1.42 + (i * 2.84) / 16;
    for (let row = 0; row < 3; row++) {
      for (const side of [-1, 1]) {
        // Leave room on the near face for the finite tracked pool.
        if (side === 1 && Math.abs(a) < 0.85) continue;
        const localA = a + 0.02 * Math.sin(i * 3 + row);
        const h =
          (0.12 + row * 0.31 + 0.025 * Math.cos(i + row)) * contour(localA);
        const from = point(localA, h, side * 0.044),
          to = point(localA, h + 0.028, side * (0.192 + 0.012 * Math.sin(i)));
        const r = 0.077 + 0.013 * (0.5 + 0.5 * Math.cos(3 * i + row * 2));
        vesicles.push(spherePosition(...to, r));
        cargo.push(spherePosition(to[0] - 0.006, to[1], to[2] + 0.007, 0.034));
        const separation = Math.hypot(...to.map((v, j) => v - from[j]));
        const surface = to.map((v, j) => v - ((v - from[j]) * r) / separation);
        cords.push([from, surface, 0.012]);
      }
    }
  }
  // Irregular fine relief hints at the dense scaffold in the section.
  const fraction = (value) => value - Math.floor(value);
  for (let i = 0; i < 740; i++) {
    const a =
      -1.44 + 2.88 * fraction(i * 0.61803399 + 0.18 * Math.sin(7.9 * i));
    const h =
      (0.02 + 0.96 * fraction(i * 0.406421 + 0.21 * Math.cos(5.4 * i))) *
      contour(a);
    const p = point(
      a,
      h,
      0.043 + 0.008 * Math.sin(5 * a + (4 * h) / contour(a)),
    );
    grain.push([
      ...p,
      0.006 + 0.007 * fraction(i * 0.31),
      0.0035 + 0.004 * fraction(i * 0.79),
      0.0042,
    ]);
  }
  const cutSphere = new THREE.SphereGeometry(1, 20, 14, 0, Math.PI * 1.7);
  cutSphere.rotateY(-0.83);
  beads(
    k,
    "ribbon-tethered-vesicle-membranes",
    vesicles,
    mats.reserve,
    cutSphere,
  );
  beads(k, "ribbon-tethered-vesicle-contents", cargo, mats.dimGold);
  beads(
    k,
    "ribbon-relief",
    grain,
    mats.ribbonGrain,
    new THREE.SphereGeometry(1, 6, 4),
  );
  const reserveSites = [
    [-1.79, 0.65, -0.16, 0.075],
    [-1.58, 0.91, -0.28, 0.065],
    [-1.66, 0.38, -0.32, 0.083],
    [-1.87, 0.23, -0.11, 0.057],
    [-1.47, 1.12, -0.19, 0.062],
    [1.59, 0.79, -0.31, 0.071],
    [1.78, 0.46, -0.12, 0.081],
    [1.47, 1.02, -0.23, 0.06],
    [1.92, 0.12, -0.19, 0.061],
    [1.63, 0.27, -0.25, 0.062],
    [1.21, 1.14, -0.32, 0.055],
  ];
  beads(
    k,
    "rod-cytosolic-vesicles",
    reserveSites.map(([x, y, z, r]) => spherePosition(x, y, z, r)),
    mats.reserve,
    cutSphere,
  );
  sticks(k, "ribbon-vesicle-tethers", cords, mats.tether);
  return { plate, foot };
}
function horizontalTip(k, side, mats) {
  const s = side;
  // The centerline heights are offsets below the invaginated roof. Map the
  // whole swept surface into that curved cleft to keep its far side extracellular.
  const curve = new THREE.CatmullRomCurve3(
    [
      [2.04 * s, -0.84, -0.03],
      [1.7 * s, -0.53, -0.015],
      [1.37 * s, -0.41, -0.07],
      [1.1 * s, -0.38, -0.15],
      [0.77 * s, -0.335, -0.24],
      [0.58 * s, -0.25, -0.28],
    ].map(v3),
  );
  function center(v) {
    const p = curve.getPoint(v);
    p.y += roofY(p.x, p.z);
    return p;
  }
  function surface(v, u) {
    const p = curve.getPoint(v);
    const d = center(Math.min(1, v + 0.001))
      .sub(center(Math.max(0, v - 0.001)))
      .normalize();
    const angle = u * TAU;
    const r =
      (0.146 + 0.095 * Math.sin(v * Math.PI * 0.87)) *
      Math.sqrt(Math.max(0, 1 - v ** 13));
    const n = new THREE.Vector3(-d.y, d.x, 0).normalize();
    const e = new THREE.Vector3().crossVectors(d, n).normalize();
    p.addScaledVector(n, r * Math.cos(angle)).addScaledVector(
      e,
      r * 1.25 * Math.sin(angle),
    );
    p.y += roofY(p.x, p.z);
    return p.toArray();
  }
  const base = named(
    k,
    "horizontal-process-" + side,
    net(54, 40, surface),
    mats.horizontal,
  );
  for (const angle of [0.15, 0.24, 0.35]) {
    k.tube(
      Array.from({ length: 39 }, (_, i) => surface((i / 38) * 0.93, angle)),
      0.008,
      mats.horizontalRidge,
      k.group,
      40,
    );
  }
  return base;
}
function mitochondrion(k, mats) {
  const group = new THREE.Group();
  group.position.set(-0.47, 1.4, -0.14);
  group.scale.set(0.76, 0.76, 0.8);
  group.rotation.z = -0.13;
  group.name = "single-rod-terminal-mitochondrion";
  k.group.add(group);
  const g = new THREE.SphereGeometry(1, 48, 26, Math.PI, Math.PI);
  const shell = named(k, "mitochondrial-envelope", g, mats.mito, group);
  shell.scale.set(0.66, 0.235, 0.26);
  const inner = k.ball(
    [0, 0, -0.05],
    [0.62, 0.199, 0.14],
    mats.mitoInner,
    group,
  );
  const seam = Array.from({ length: 67 }, (_, i) => [
    0.66 * Math.cos((TAU * i) / 66),
    0.235 * Math.sin((TAU * i) / 66),
    0.0,
  ]);
  k.tube(seam, 0.016, mats.mitoRim, group, 64);
  for (let j = 0; j < 7; j++) {
    const x = (j - 3) * 0.15,
      h = 0.15 * Math.sqrt(1 - (x / 0.66) ** 2);
    const sign = j % 2 ? 1 : -1;
    k.tube(
      [
        [x - 0.046, sign * h, 0.013],
        [x - 0.025, sign * h * 0.35, 0.087],
        [x + 0.023, -sign * h * 0.55, 0.086],
        [x + 0.051, -sign * h * 0.66, 0.066],
      ],
      0.015,
      mats.mitoRim,
      group,
      16,
    );
  }
  return inner;
}
export function anatomy(k) {
  const mat = (color, options = {}) =>
    k.material(color, { side: THREE.DoubleSide, roughness: 0.62, ...options });
  const mats = {
    shell: mat("#aaa49b"),
    roof: mat("#b7ada0"),
    edge: mat("#d6c9b4"),
    tip: mat("#8498a8"),
    tipEdge: mat("#becbd1"),
    horizontal: mat("#777582"),
    horizontalRidge: mat("#8a8792"),
    ribbon: mat("#655665"),
    ribbonEdge: mat("#8d7780"),
    ribbonGrain: mat("#776875"),
    graphite: mat("#494650"),
    reserve: mat("#b19677"),
    tether: mat("#a69882"),
    dimGold: mat("#b98145"),
    mito: mat("#8a7166"),
    mitoInner: mat("#6a5956"),
    mitoRim: mat("#b3967e"),
    shellVesicle: mat("#cba272"),
    gold: mat("#c67d22", {
      roughness: 0.42,
      emissive: "#492600",
      emissiveIntensity: 0.26,
    }),
    pore: mat("#ac7c51"),
    calcium: mat("#4c82a7", { roughness: 0.38 }),
    calciumRim: mat("#678da7"),
    calciumIon: mat("#5597bf", {
      emissive: "#123d63",
      emissiveIntensity: 0.28,
    }),
    trpm: mat("#68718e"),
    trpmRim: mat("#979cb3"),
    sodium: mat("#998787"),
    receptor: mat("#936953"),
    receptorLight: mat("#be8f70"),
    go: mat("#636479"),
    goLight: mat("#9793a8"),
    charge: mat("#53596b"),
  };
  const terminal = shell(
    k,
    "rod-spherule-cutaway",
    [
      [0.34, 2.1, 0.22],
      [0.4, 1.9, 0.22],
      [0.83, 1.64, 0.17],
      [1.59, 1.47, 0.1],
      [2.1, 1.11, 0.04],
      [2.39, 0.52],
      [2.46, -0.1],
      [2.36, -0.61],
      [2.15, -0.84],
      [1.99, -0.84],
      [1.93, -0.755],
    ],
    mats.shell,
    mats.edge,
    0.78,
    CUT_Z,
  );
  const activeZone = roof(k, mats.roof, mats.edge);
  const tip = shell(
    k,
    "rod-bipolar-cutaway",
    [
      [0.3, -2.05, -0.22],
      [0.32, -1.87, -0.19],
      [0.43, -1.68, -0.12],
      [0.72, -1.47, -0.07],
      [0.96, -1.18],
      [1.02, -0.99],
      [0.99, -0.89],
      [0.93, TIP_Y],
    ],
    mats.tip,
    mats.tipEdge,
    0.9,
    CUT_Z,
  );
  const tipCap = flatSlab(
    k,
    "bipolar-tip-membrane",
    0.93,
    0.9,
    CUT_Z,
    TIP_Y,
    [[...TRPM_SITE, GATE_PATCH]],
    mats.tip,
    mats.tipEdge,
  );
  const laterals = [horizontalTip(k, -1, mats), horizontalTip(k, 1, mats)];
  mitochondrion(k, mats);
  const { plate, foot } = ribbon(k, mats);
  return { mats, terminal, activeZone, tip, tipCap, laterals, plate, foot };
}
