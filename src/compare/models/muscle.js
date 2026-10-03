import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { mitochondriaDetail } from "../../scene/mitochondriaDetails.js";

const TAU = Math.PI * 2,
  V = (...v) => new T.Vector3(...v);
const C = {
  membrane: "#bf8e99",
  edge: "#edd0c1",
  thin: "#7aada0",
  thick: "#af7085",
  z: "#856779",
  m: "#cfad72",
  sr: "#91ada8",
  t: "#c99b68",
  nuclear: "#9986b4",
  chromatin: "#706589",
};
const ids = {
  membrane: "muscleFibreSarcolemma",
  nucleus: "muscleFibreNuclei",
  fibril: "muscleFibreMyofibrils",
  sarcomere: "muscleFibreSarcomere",
  sr: "muscleFibreSR",
  triad: "muscleFibreTriads",
  mito: "muscleFibreMitochondria",
};
export const muscleDimensions = Object.freeze({
  radius: 0.88,
  length: 5.28,
  sarcomereLength: 0.176,
  sarcomeres: 30,
  fibreDiameterMicrometres: 25,
  myofibrilRadius: 0.064,
  pitch: 0.142,
});
export const sarcomereAnatomy = Object.freeze({
  zLeft: -2.5,
  zRight: 2.5,
  thickLeft: -1.6,
  thickRight: 1.6,
  thinLeftTip: -0.42,
  thinRightTip: 0.42,
  bareHalfLength: 0.25,
  thinFilaments: 18,
  thickFilaments: 7,
});
function add(g, geo, color, id, flags = {}, appearance = {}) {
  const m = new T.Mesh(
    geo,
    new T.MeshPhysicalMaterial({
      color,
      roughness: 0.49,
      clearcoat: 0.18,
      side: T.DoubleSide,
      ...appearance,
    }),
  );
  m.userData = { hitId: id, ...flags };
  g.add(m);
  return m;
}
function batch(g, geos, color, id, flags = {}, appearance = {}) {
  if (!geos.length) return;
  const normalized = geos.map((a) => {
    const b = a.clone();
    b.deleteAttribute("uv");
    return b;
  });
  const geo = mergeGeometries(normalized);
  normalized.forEach((a) => a.dispose());
  geos.forEach((a) => a.dispose());
  return add(g, geo, color, id, flags, appearance);
}
function ball(p, s, segments = 16) {
  return new T.SphereGeometry(
    1,
    segments <= 12 ? 6 : segments,
    segments <= 12 ? 4 : 12,
  )
    .scale(...s)
    .translate(...p);
}
function rod(a, b, r, segments = 10) {
  const d = V(...b).sub(V(...a));
  return new T.CylinderGeometry(r, r, d.length(), segments)
    .rotateX(Math.PI / 2)
    .applyQuaternion(
      new T.Quaternion().setFromUnitVectors(V(0, 0, 1), d.clone().normalize()),
    )
    .translate(
      ...V(...a)
        .addScaledVector(d, 0.5)
        .toArray(),
    );
}
function tube(points, r, steps = 48, closed = false) {
  return new T.TubeGeometry(
    new T.CatmullRomCurve3(
      points.map((p) => V(...p)),
      closed,
    ),
    steps,
    r,
    8,
    closed,
  );
}
function ring(x, r, t = 0.01, start = 0, length = TAU) {
  return new T.TorusGeometry(r, t, 8, 64, length)
    .rotateZ(start)
    .rotateY(Math.PI / 2)
    .translate(x, 0, 0);
}
function shell(length, r, start, arc, steps = 96) {
  return new T.CylinderGeometry(
    r,
    r,
    length,
    steps,
    1,
    true,
    start,
    arc,
  ).rotateZ(Math.PI / 2);
}
function mark(g, zh, en, p, visibleModes) {
  (g.userData.landmarks ??= []).push({
    zh,
    en,
    position: p,
    ...(visibleModes ? { visibleModes } : {}),
  });
}
function finish(g, id, biology = {}) {
  g.userData = {
    ...g.userData,
    ownedGeometry: true,
    specimenId: "muscleFibre",
    biology: {
      species: "Homo sapiens",
      singleCell: true,
      croppedSegment: true,
      nucleiPeripheral: true,
      ...biology,
    },
  };
  g.rotation.x += 0.08;
  g.rotation.y -= 0.25;
  g.rotation.z -= 0.11;
  return g;
}

// Hexagonal packing is myofibrils inside ONE cell, never a fascicle of cells.
export function muscleMyofibrilCentres() {
  const a = [];
  for (let q = -5; q <= 5; q++)
    for (let r = -5; r <= 5; r++)
      if (Math.abs(q + r) <= 5)
        a.push([
          muscleDimensions.pitch * (q + r / 2),
          ((muscleDimensions.pitch * Math.sqrt(3)) / 2) * r,
        ]);
  return a;
}
function stripedRod(length, repeats, r, y = 0, z = 0, radial = 6) {
  const bands = [
      [0, 0.025, C.z],
      [0.025, 0.18, "#e6c5b4"],
      [0.18, 0.42, "#bd8b98"],
      [0.42, 0.485, "#d9b9ad"],
      [0.485, 0.515, C.m],
      [0.515, 0.58, "#d9b9ad"],
      [0.58, 0.82, "#bd8b98"],
      [0.82, 0.975, "#e6c5b4"],
      [0.975, 1, C.z],
    ],
    geos = [];
  for (let i = 0; i < repeats; i++)
    for (const [a, b, c] of bands) {
      const span = ((b - a) * length) / repeats;
      const x = -length / 2 + ((i + (a + b) / 2) * length) / repeats;
      const geo = new T.CylinderGeometry(r, r, span, radial, 1, true)
        .rotateZ(Math.PI / 2)
        .translate(x, y, z);
      const col = new T.Color(c);
      geo.setAttribute(
        "color",
        new T.Float32BufferAttribute(
          Array.from({ length: geo.attributes.position.count }, () => [
            col.r,
            col.g,
            col.b,
          ]).flat(),
          3,
        ),
      );
      geos.push(geo);
    }
  const geo = mergeGeometries(geos);
  geos.forEach((x) => x.dispose());
  return geo;
}

function sarcomere(id = ids.sarcomere) {
  const g = new T.Group(),
    thick = [],
    heads = [],
    thin = [],
    regulators = [],
    titin = [],
    zgrid = [],
    mline = [];
  const centres = [
    [0, 0],
    ...Array.from({ length: 6 }, (_, i) => [
      0.43 * Math.cos((i * TAU) / 6),
      0.43 * Math.sin((i * TAU) / 6),
    ]),
  ];
  // Finite lattice fragment: thin filaments interdigitate around the seven thick filaments.
  const actinCentres = Array.from({ length: 18 }, (_, i) => {
    const a = (i * TAU) / 18;
    return [
      (0.58 + (i % 3 === 0 ? -0.31 : 0)) * Math.cos(a),
      (0.58 + (i % 3 === 0 ? -0.31 : 0)) * Math.sin(a),
    ];
  });
  for (const [y, z] of centres) {
    thick.push(rod([-1.6, y, z], [1.6, y, z], 0.064, 16));
    for (const sign of [-1, 1])
      for (let j = 0; j < 12; j++) {
        const x = sign * (0.4 + j * 0.1),
          a = j * 2.38;
        const p = [x, y + 0.065 * Math.cos(a), z + 0.065 * Math.sin(a)],
          q = [
            x - sign * 0.1,
            y + 0.139 * Math.cos(a),
            z + 0.139 * Math.sin(a),
          ];
        heads.push(rod(p, q, 0.021, 8), ball(q, [0.048, 0.035, 0.035], 12));
      }
    for (const sign of [-1, 1]) {
      const pts = Array.from({ length: 50 }, (_, i) => {
        const u = i / 49;
        return [
          sign * (1.6 + 0.9 * u),
          y + 0.018 * Math.sin(u * TAU * 6),
          z + 0.018 * Math.cos(u * TAU * 6),
        ];
      });
      titin.push(tube(pts, 0.011, 60));
    }
    if (y || z) mline.push(rod([0, 0, 0], [0, y, z], 0.026));
  }
  for (const [y, z] of actinCentres)
    for (const sign of [-1, 1]) {
      for (let j = 0; j < 44; j++) {
        const x = sign * (0.454 + (j * 2.012) / 43),
          a = j * 1.24;
        thin.push(
          ball(
            [x, y + 0.02 * Math.cos(a), z + 0.02 * Math.sin(a)],
            [0.034, 0.027, 0.027],
            10,
          ),
          ball(
            [x, y - 0.02 * Math.cos(a), z - 0.02 * Math.sin(a)],
            [0.034, 0.027, 0.027],
            10,
          ),
        );
      }
      const pts = Array.from({ length: 64 }, (_, j) => {
        const x = sign * (0.454 + (j * 2.012) / 63),
          a = j * 0.845;
        return [x, y + 0.042 * Math.cos(a), z + 0.042 * Math.sin(a)];
      });
      regulators.push(tube(pts, 0.009, 64));
      for (let j = 0; j < 5; j++)
        regulators.push(
          ball(
            [sign * (0.65 + j * 0.4), y + 0.049, z],
            [0.043, 0.022, 0.028],
            10,
          ),
        );
    }
  for (const x of [-2.5, 2.5]) {
    zgrid.push(ring(x, 0.75, 0.024));
    for (let j = -3; j <= 3; j++) {
      const y = j * 0.19,
        h = Math.sqrt(0.73 * 0.73 - y * y);
      zgrid.push(
        rod([x, y, -h], [x, y, h], 0.018),
        rod([x, -h, y], [x, h, y], 0.018),
      );
    }
    for (const [y, z] of actinCentres)
      zgrid.push(ball([x, y, z], [0.035, 0.05, 0.05], 12));
  }
  batch(g, thick, C.thick, id).userData.anatomyRole = "thickFilament";
  batch(g, heads, "#c78c9e", id).userData.anatomyRole = "myosinHeads";
  batch(g, thin, C.thin, id).userData.anatomyRole = "thinFilament";
  batch(g, regulators, "#dbbd83", id).userData.anatomyRole = "thinRegulators";
  batch(g, titin, "#c3a8c2", id).userData.anatomyRole = "titin";
  batch(g, zgrid, C.z, id).userData.anatomyRole = "zDisc";
  batch(g, mline, C.m, id).userData.anatomyRole = "mLine";
  mark(
    g,
    "Z 盘 · 细肌丝锚定",
    "Z disc · thin-filament anchorage",
    [-2.5, 0.7, 0],
  );
  mark(
    g,
    "I 带 · 只有细肌丝",
    "I band · thin filaments only",
    [-2.05, 0.57, 0.35],
  );
  mark(
    g,
    "A 带 · 粗肌丝全长",
    "A band · full thick-filament length",
    [-1.2, -0.52, 0.35],
  );
  mark(
    g,
    "H 区 · 无细肌丝重叠",
    "H zone · no thin-filament overlap",
    [0, 0.43, 0.03],
  );
  mark(
    g,
    "M 线 · 粗肌丝连接",
    "M line · thick-filament crosslinks",
    [0, 0, 0.2],
  );
  mark(g, "肌联蛋白 · 弹性连接", "Titin · elastic linkage", [1.95, 0, 0]);
  g.userData.biology = {
    sarcomere: sarcomereAnatomy,
    schematicFilamentSampling: true,
  };
  return g;
}

function nuclearDetail() {
  const g = new T.Group(),
    id = ids.nucleus;
  for (const cap of [false, true]) {
    const start = cap ? 0 : Math.PI;
    add(
      g,
      new T.SphereGeometry(1, 48, 28, start, Math.PI).scale(2.15, 0.61, 0.66),
      C.nuclear,
      id,
      { cap },
    );
    add(
      g,
      new T.SphereGeometry(1, 48, 28, start, Math.PI).scale(2.1, 0.56, 0.61),
      "#c4b3d2",
      id,
      { cap },
    );
  }
  const chrom = [],
    pores = [],
    frontPores = [];
  for (let i = 0; i < 9; i++) {
    const x = -1.58 + i * 0.395;
    const pts = Array.from({ length: 49 }, (_, j) => {
      const a = (j * TAU) / 48;
      const px = x + 0.27 * Math.cos(2 * a + i * 0.43);
      const limit = Math.sqrt(Math.max(0.1, 1 - (px / 2.0) ** 2));
      return [
        px,
        limit * (0.28 * Math.sin(3 * a + i * 0.6) + 0.1 * Math.cos(a)),
        limit * (0.34 * Math.cos(2 * a + i * 0.7) + 0.1 * Math.sin(5 * a)),
      ];
    });
    chrom.push(tube(pts, 0.021, 96, true));
  }
  for (let i = 0; i < 44; i++) {
    const u = -0.9 + (1.8 * (i + 0.5)) / 44,
      a = i * 2.399;
    const n = V(
      u,
      Math.sqrt(1 - u * u) * Math.cos(a),
      Math.sqrt(1 - u * u) * Math.sin(a),
    );
    const geo = new T.TorusGeometry(0.065, 0.014, 8, 12);
    geo
      .applyQuaternion(
        new T.Quaternion().setFromUnitVectors(
          V(0, 0, 1),
          V(n.x / 2.15, n.y / 0.61, n.z / 0.66).normalize(),
        ),
      )
      .translate(n.x * 2.16, n.y * 0.615, n.z * 0.665);
    (n.z > 0 ? frontPores : pores).push(geo);
  }
  batch(g, chrom, C.chromatin, id);
  batch(g, pores, "#ded0e0", id);
  batch(g, frontPores, "#ded0e0", id, { cap: true });
  add(g, ball([-0.45, 0, 0.05], [0.27, 0.24, 0.23], 28), "#ad809b", id);
  mark(
    g,
    "双层核被膜",
    "Double nuclear envelope",
    [0.9, 0.5, 0.26],
    ["section"],
  );
  mark(g, "核孔复合体 · 示意", "Nuclear pores · schematic", [1.45, 0.34, 0.32]);
  mark(g, "染色质", "Chromatin", [-1.2, 0.22, 0.14], ["section"]);
  mark(g, "核仁", "Nucleolus", [-0.45, 0, 0.28], ["section"]);
  return g;
}

function membraneDetail() {
  const g = new T.Group(),
    id = ids.membrane,
    heads = [],
    tails = [];
  // Curved bilayer patch: radial thickness is magnified; no cell wall implied.
  const pos = (x, a, r) => [x, r * Math.cos(a), r * Math.sin(a)];
  for (let i = 0; i < 38; i++)
    for (let j = 0; j < 18; j++) {
      const x = -2.2 + i * 0.12,
        a = 0.15 + j * 0.11;
      for (const r of [0.9, 1.04]) {
        heads.push(ball(pos(x, a, r), [0.058, 0.052, 0.052], 10));
        const inward = r === 1.04 ? -0.072 : 0.072;
        for (const dx of [-0.015, 0.015])
          tails.push(
            rod(
              pos(x + dx, a, r + inward * 0.25),
              pos(x + dx + 0.013, a + 0.01, r + inward),
              0.009,
              6,
            ),
          );
      }
    }
  batch(g, heads, C.membrane, id);
  batch(g, tails, "#d8b8a1", id);
  const proteins = [];
  for (const [x, a] of [
    [-1.7, 0.45],
    [-0.8, 1.45],
    [0.2, 0.75],
    [1.4, 1.65],
  ]) {
    const p = pos(x, a, 0.97);
    proteins.push(ball(p, [0.1, 0.11, 0.11], 18));
  }
  batch(g, proteins, "#9d85a6", id);
  mark(
    g,
    "胞外侧亲水头部",
    "Extracellular polar headgroups",
    [-1.65, 0.91, 0.41],
  );
  mark(
    g,
    "疏水核心 · 厚度放大",
    "Hydrophobic core · thickness enlarged",
    [2.22, 0.6, 0.72],
  );
  mark(g, "膜蛋白 · 示意", "Membrane proteins · schematic", [0.2, 0.74, 0.67]);
  return g;
}

function triadDetail() {
  const g = new T.Group(),
    id = ids.triad;
  // T-tubule and cisternae have independent lumina: junctional feet bridge the cytosolic gap.
  for (const [x, r, color] of [
    [0, 0.14, C.t],
    [-0.52, 0.24, C.sr],
    [0.52, 0.24, C.sr],
  ]) {
    for (const cap of [false, true]) {
      const geo = new T.CylinderGeometry(
        r,
        r,
        3.5,
        48,
        1,
        true,
        cap ? -Math.PI / 2 : Math.PI / 2,
        Math.PI,
      );
      add(g, geo.translate(x, 0, 0), color, id, { cap });
      add(
        g,
        new T.CylinderGeometry(
          r - 0.032,
          r - 0.032,
          3.5,
          48,
          1,
          true,
          cap ? -Math.PI / 2 : Math.PI / 2,
          Math.PI,
        ).translate(x, 0, 0),
        "#ddcbb0",
        id,
        { cap },
      );
    }
    for (const y of [-1.75, 1.75]) {
      const geo = new T.RingGeometry(r - 0.032, r, 48)
        .rotateX(Math.PI / 2)
        .translate(x, y, 0);
      add(g, geo, C.edge, id);
    }
  }
  const feet = [],
    buffer = [];
  for (const sign of [-1, 1])
    for (let j = 0; j < 9; j++) {
      const y = -1.42 + j * 0.355;
      feet.push(
        new T.BoxGeometry(0.13, 0.17, 0.12).translate(sign * 0.225, y, 0.015),
      );
      for (const dz of [-0.053, 0.053])
        feet.push(ball([sign * 0.24, y, dz], [0.045, 0.073, 0.043], 12));
      buffer.push(
        tube(
          [
            [sign * 0.52, y - 0.12, -0.08],
            [sign * 0.58, y, 0],
            [sign * 0.48, y + 0.12, 0.04],
          ],
          0.022,
          12,
        ),
      );
    }
  batch(g, feet, "#a780a9", id);
  batch(g, buffer, "#bfc8ab", id, { cutOnly: true });
  mark(
    g,
    "T 小管 · 肌膜内陷",
    "T tubule · sarcolemmal invagination",
    [0, 0.8, 0.14],
  );
  mark(
    g,
    "终池 · Ca²⁺ 储库",
    "Terminal cisterna · Ca²⁺ store",
    [-0.52, -0.8, 0.2],
  );
  mark(
    g,
    "连接间隙 · 释放通道示意",
    "Junctional gap · release channels",
    [0.23, 0.12, 0.06],
  );
  mark(
    g,
    "人工截口 · 腔不相通",
    "Cropped openings · separate lumina",
    [0.52, 1.75, 0],
    ["section"],
  );
  g.rotation.z = Math.PI / 2;
  return g;
}

function srDetail() {
  const g = new T.Group(),
    id = ids.sr,
    tubules = [],
    cisternae = [];
  // Reticular sleeves are sparse fenestrated networks, not a solid external sheath.
  for (const end of [-1, 1])
    for (const x of [end * 1.48]) cisternae.push(ring(x, 0.62, 0.065));
  for (let j = 0; j < 12; j++) {
    const a = (j * TAU) / 12,
      pts = Array.from({ length: 20 }, (_, i) => {
        const x = -1.48 + (i * 2.96) / 19,
          r = 0.62 + 0.018 * Math.sin(i * 1.6 + j);
        return [x, r * Math.cos(a), r * Math.sin(a)];
      });
    tubules.push(tube(pts, 0.029, 32));
  }
  for (const x of [-0.85, -0.28, 0.28, 0.85])
    for (let j = 0; j < 6; j++) {
      const a = (j * TAU) / 6;
      tubules.push(
        tube(
          Array.from({ length: 10 }, (_, k) => [
            x + 0.055 * Math.sin((k * Math.PI) / 9),
            0.62 * Math.cos(a + (k * TAU) / 54),
            0.62 * Math.sin(a + (k * TAU) / 54),
          ]),
          0.025,
          14,
        ),
      );
    }
  batch(g, tubules, C.sr, id);
  batch(g, cisternae, "#aac5ba", id);
  mark(g, "纵行肌浆网", "Longitudinal SR", [0, 0.62, 0]);
  mark(
    g,
    "开窗管网 · 围绕肌原纤维",
    "Fenestrated network around myofibril",
    [0.85, 0.4, 0.44],
  );
  mark(
    g,
    "终池 · 接近 A/I 交界",
    "Terminal cisternae · near A/I boundaries",
    [1.48, 0, 0.62],
  );
  return g;
}

function myofibrilDetail() {
  const g = new T.Group(),
    id = ids.fibril;
  for (const [y, z] of [
    [-0.62, -0.36],
    [0.62, -0.36],
  ])
    add(
      g,
      stripedRod(5.2, 3, 0.48, y, z, 32),
      "#ffffff",
      id,
      {},
      { vertexColors: true },
    );
  const cropFaces = [];
  for (const [y, z] of [
    [-0.62, -0.36],
    [0.62, -0.36],
  ])
    for (const x of [-2.6, 2.6])
      cropFaces.push(
        new T.CircleGeometry(0.48, 32).rotateY(Math.PI / 2).translate(x, y, z),
      );
  cropFaces.push(
    new T.CircleGeometry(0.48, 32)
      .rotateY(Math.PI / 2)
      .translate(-2.6, 0, 0.53),
  );
  batch(g, cropFaces, "#d9b3a4", id);
  const sample = sarcomere(id);
  sample.scale.set(0.346, 0.63, 0.63);
  sample.position.set(1.733, 0, 0.53);
  g.add(sample);
  add(
    g,
    stripedRod(3.46, 2, 0.48, 0, 0.53, 32).translate(-0.87, 0, 0),
    "#ffffff",
    id,
    {},
    { vertexColors: true },
  );
  mark(
    g,
    "邻接肌原纤维 · Z 盘对齐",
    "Adjacent myofibrils · aligned Z discs",
    [-0.87, 0.8, -0.2],
  );
  mark(g, "肌丝级局部展示", "Local filament-level exposure", [1.2, 0, 0.9]);
  mark(
    g,
    "截取端面 · 非细胞末端",
    "Cropped end · not a cell terminus",
    [-2.6, 0.2, 0.53],
  );
  return g;
}

function whole() {
  const g = new T.Group(),
    { length, radius } = muscleDimensions;
  for (const cap of [false, true]) {
    const start = cap ? -Math.PI / 2 : Math.PI / 2;
    add(g, shell(length, radius, start, Math.PI), C.membrane, ids.membrane, {
      cap,
    });
    add(
      g,
      shell(length, radius - 0.017, start, Math.PI),
      "#d9adad",
      ids.membrane,
      { cap },
    );
  }
  // Cropped annuli remain visible in every mode; never terminal hemispheres.
  for (const x of [-length / 2, length / 2])
    add(
      g,
      new T.RingGeometry(radius - 0.017, radius, 72)
        .rotateY(Math.PI / 2)
        .translate(x, 0, 0),
      C.edge,
      ids.membrane,
    );
  const edge = [];
  for (const y of [-radius, radius])
    edge.push(rod([-length / 2, y, 0], [length / 2, y, 0], 0.013));
  batch(g, edge, C.edge, ids.membrane, { cutOnly: true });
  const rods = [],
    endFaces = [];
  const centres = muscleMyofibrilCentres();
  for (const [y, z] of centres) {
    rods.push(stripedRod(length, 30, 0.064, y, z));
    for (const x of [-length / 2, length / 2])
      endFaces.push(
        new T.CircleGeometry(0.064, 12).rotateY(Math.PI / 2).translate(x, y, z),
      );
  }
  batch(g, rods, "#ffffff", ids.fibril, {}, { vertexColors: true });
  batch(g, endFaces, "#d9b3a4", ids.fibril);
  const nuclei = [],
    nucleoli = [];
  for (let i = 0; i < 9; i++) {
    const angle = 0.5 + i * 2.4,
      x = -2.2 + i * 0.54,
      y = Math.cos(angle) * 0.824,
      z = Math.sin(angle) * 0.824;
    const n = ball([0, 0, 0], [0.22, 0.036, 0.1], 24)
      .rotateX(angle)
      .translate(x, y, z);
    nuclei.push(n);
    nucleoli.push(ball([x, y * 0.982, z * 0.982], [0.042, 0.022, 0.03], 12));
  }
  batch(g, nuclei, C.nuclear, ids.nucleus);
  batch(g, nucleoli, "#ad809b", ids.nucleus);
  // One exposed myofibril has localized SR sleeves and paired transverse junctions.
  const sr = srDetail();
  sr.traverse((o) => {
    if (o.isMesh) o.userData.hitId = ids.sr;
  });
  sr.scale.set(0.052, 0.15, 0.15);
  sr.position.set(0.08, 0.47, 0.48);
  g.add(sr);
  const triads = [];
  for (const x of [-0.005, 0.164])
    for (const [dx, r, c] of [
      [0, 0.009, C.t],
      [-0.013, 0.012, C.sr],
      [0.013, 0.012, C.sr],
    ]) {
      const geo = ring(x + dx, 0.09, r).translate(0, 0.47, 0.48);
      triads.push([geo, c]);
    }
  for (const [geo, c] of triads) add(g, geo, c, ids.triad);
  // Magnified leaf is separate; full view marks the same Z-to-Z region at specimen scale.
  add(
    g,
    stripedRod(0.176, 1, 0.066, 0.071, 0.615).translate(0.088, 0, 0),
    "#ffffff",
    ids.sarcomere,
    {},
    { vertexColors: true },
  );
  const mitoGeos = [],
    mitoFolds = [];
  for (const [x, y, z] of [
    [-1.7, 0.42, 0.62],
    [-0.6, -0.48, 0.59],
    [0.9, 0.61, 0.33],
    [1.9, -0.35, 0.66],
  ]) {
    mitoGeos.push(ball([x, y, z], [0.16, 0.036, 0.057], 20));
    for (let j = 0; j < 5; j++)
      mitoFolds.push(
        rod(
          [x - 0.1 + j * 0.05, y - 0.025, z + 0.042],
          [x - 0.1 + j * 0.05, y + 0.025, z + 0.042],
          0.007,
          6,
        ),
      );
  }
  batch(g, mitoGeos, "#b49372", ids.mito);
  batch(g, mitoFolds, "#dac097", ids.mito);
  g.rotation.y = -0.3;
  g.userData.partAnchors = {
    [ids.membrane]: [-1.5, -0.7, 0.51],
    [ids.nucleus]: [-0.58, Math.cos(7.7) * 0.824, Math.sin(7.7) * 0.824],
    [ids.fibril]: [1.7, 0.38, 0.53],
    [ids.sarcomere]: [0.088, 0.071, 0.68],
    [ids.sr]: [0.08, 0.47, 0.57],
    [ids.triad]: [0.164, 0.47, 0.57],
    [ids.mito]: [-1.7, 0.42, 0.68],
  };
  g.userData.partLabelModes = Object.fromEntries(
    [ids.nucleus, ids.sarcomere, ids.sr, ids.triad, ids.mito].map((partId) => [
      partId,
      ["section", "explode"],
    ]),
  );
  mark(g, "截取端面 · 纤维继续延伸", "Cropped end · fibre continues", [
    length / 2,
    0,
    0,
  ]);
  g.userData.biology = {
    nuclei: 9,
    myofibrils: centres.length,
    sarcomeresPerMyofibril: 30,
    zToZMicrometres: 2.5,
    representedDiameterMicrometres: 25,
    representativeOrganelleSampling: true,
  };
  return g;
}

export function buildMuscleFibre(id = "muscleFibre") {
  let g;
  if (id === "muscleFibre") g = whole();
  else if (id === ids.sarcomere) g = sarcomere();
  else if (id === ids.nucleus) g = nuclearDetail();
  else if (id === ids.membrane) g = membraneDetail();
  else if (id === ids.fibril) g = myofibrilDetail();
  else if (id === ids.sr) g = srDetail();
  else if (id === ids.triad) g = triadDetail();
  else if (id === ids.mito) {
    g = mitochondriaDetail("mitochondria");
    g.userData.landmarks = g.userData.landmarks.map((item) => ({
      ...item,
      visibleModes: ["section"],
    }));
    g.traverse((o) => {
      if (o.isMesh) o.userData.hitId = id;
    });
    g.rotation.set(0, 0, Math.PI / 2);
  } else return null;
  const biology = g.userData.biology || {};
  return finish(g, id, biology);
}
