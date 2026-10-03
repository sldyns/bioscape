import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const TAU = Math.PI * 2;
const v = (p) => new T.Vector3(...p);
const C = {
  membrane: "#76a7ac",
  dendrite: "#88b7b9",
  core: "#d9b67c",
  myelin: "#90b9aa",
  lamella: "#d6d5af",
  dark: "#658f82",
  nucleus: "#ac95b7",
  chromatin: "#785f91",
  nissl: "#7b9cae",
  vesicle: "#ddbd82",
  mito: "#bd917f",
};
export const neuronInternodes = Array.from({ length: 5 }, (_, i) => ({
  start: 0.2 + i * 0.145,
  end: 0.325 + i * 0.145,
}));
const AXON = [
  [-1.62, -0.08, 0],
  [-0.91, -0.3, 0.07],
  [0.15, -0.38, 0.14],
  [1.27, -0.5, 0.08],
  [2.4, -0.37, -0.09],
  [3.48, -0.56, 0.04],
];
export const neuronAxonSampling = Object.freeze({
  longitudinalSegments: 150,
  radialSegments: 16,
});
const arms = [
  [
    [-1.97, 0.35, 0],
    [-2.44, 0.94, 0.05],
    [-2.76, 1.63, 0.33],
    [-3.37, 2.18, 0.48],
  ],
  [
    [-2.12, 0.2, 0.02],
    [-2.93, 0.48, 0.36],
    [-3.6, 0.65, 0.59],
    [-4.22, 1.03, 0.42],
  ],
  [
    [-2.06, -0.08, 0],
    [-2.82, -0.51, 0.16],
    [-3.45, -0.95, -0.26],
    [-4.03, -1.25, -0.39],
  ],
  [
    [-1.84, -0.18, 0],
    [-2.08, -0.97, -0.23],
    [-2.44, -1.61, -0.61],
    [-2.38, -2.18, -0.49],
  ],
  [
    [-1.68, 0.36, -0.03],
    [-1.32, 1.01, -0.28],
    [-0.99, 1.65, -0.65],
    [-0.46, 2.01, -0.59],
  ],
  [
    [-1.96, 0.12, -0.22],
    [-2.73, 0.04, -0.81],
    [-3.23, 0.34, -1.18],
    [-3.57, 0.62, -1.49],
  ],
];
function curve(points) {
  return new T.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : v(p))));
}
function frame(c, t) {
  const p = c.getPointAt(t),
    x = c.getTangentAt(t).normalize(),
    y = new T.Vector3().crossVectors(x, new T.Vector3(0, 0, 1)).normalize(),
    z = new T.Vector3().crossVectors(y, x).normalize();
  return { p, x, y, z };
}
function tube(
  c,
  r0,
  r1 = r0,
  {
    start = 0,
    end = 1,
    angle = Math.PI / 2,
    arc = TAU,
    steps = 48,
    radial = 16,
    profile = null,
  } = {},
) {
  const pos = [],
    uv = [],
    idx = [];
  for (let i = 0; i <= steps; i++) {
    const u = i / steps,
      t = start + (end - start) * u,
      f = frame(c, t),
      r = profile ? profile(u) : T.MathUtils.lerp(r0, r1, u);
    for (let j = 0; j <= radial; j++) {
      const a = angle + (arc * j) / radial,
        p = f.p
          .clone()
          .addScaledVector(f.z, r * Math.cos(a))
          .addScaledVector(f.y, r * Math.sin(a));
      pos.push(...p.toArray());
      uv.push(u, j / radial);
      if (i < steps && j < radial) {
        const k = i * (radial + 1) + j;
        idx.push(
          k,
          k + radial + 1,
          k + 1,
          k + 1,
          k + radial + 1,
          k + radial + 2,
        );
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function ring(c, t, inner, outer, angle = 0, arc = TAU) {
  const f = frame(c, t),
    g = new T.RingGeometry(inner, outer, 48, 1, angle, arc);
  g.applyMatrix4(new T.Matrix4().makeBasis(f.z, f.y, f.x).setPosition(f.p));
  return g;
}
function ellipse(p, s, half = null, irregular = false) {
  const tiny = Math.max(...s) < 0.08,
    small = Math.max(...s) < 0.24;
  const g = new T.SphereGeometry(
    1,
    tiny ? 12 : small ? 20 : 40,
    tiny ? 8 : small ? 12 : 28,
    half === false ? Math.PI : 0,
    half === null ? TAU : Math.PI,
  );
  if (irregular) {
    const a = g.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i),
        y = a.getY(i),
        z = a.getZ(i),
        phi = Math.atan2(y, x);
      const r = 1 + 0.08 * Math.cos(3 * phi) * (1 - z * z) + 0.035 * x * y;
      a.setXYZ(i, x * r, y * r, z * (1 + 0.06 * x));
    }
    g.computeVertexNormals();
  }
  g.scale(...s);
  g.translate(...p);
  return g;
}
function builder() {
  const bins = new Map();
  return {
    add(geo, color, id, flags = {}) {
      const key = JSON.stringify([color, id, flags]);
      if (!bins.has(key)) bins.set(key, { geo: [], color, id, flags });
      bins.get(key).geo.push(geo);
    },
    finish() {
      const g = new T.Group();
      for (const b of bins.values()) {
        const geometry = mergeGeometries(b.geo);
        for (const geo of b.geo) geo.dispose();
        const m = new T.Mesh(
          geometry,
          new T.MeshPhysicalMaterial({
            color: b.color,
            roughness: 0.52,
            clearcoat: 0.16,
            side: T.DoubleSide,
          }),
        );
        m.userData = { hitId: b.id, ...b.flags };
        g.add(m);
      }
      return g;
    },
  };
}
function shell(b, p, s, id, color = C.membrane, irregular = false) {
  b.add(ellipse(p, s, false, irregular), color, id);
  b.add(ellipse(p, s, true, irregular), color, id, { cap: true });
}
function mitochondrion(b, p, s, id, flags = {}) {
  b.add(ellipse(p, s), C.mito, id, flags);
  for (let i = -2; i <= 2; i++) {
    const g = new T.TorusGeometry(s[1] * 0.7, 0.009, 5, 16, Math.PI * 1.65);
    g.rotateY(Math.PI / 2);
    g.translate(p[0] + i * s[0] * 0.25, p[1], p[2] + s[2] * 0.82);
    b.add(g, "#e3be9c", id, flags);
  }
}
function nuclearBody(b, p, r, id) {
  // A perforated envelope: selected pore positions and counts are schematic.
  const pores = Array.from({ length: 18 }, (_, i) => {
    const y = 1 - (2 * (i + 0.5)) / 18,
      a = i * 2.39996323,
      q = Math.sqrt(1 - y * y);
    return new T.Vector3(Math.cos(a) * q, y, Math.sin(a) * q);
  });
  for (const front of [false, true]) {
    const geo = new T.SphereGeometry(1, 80, 56, front ? 0 : Math.PI, Math.PI),
      pos = geo.attributes.position,
      index = geo.index.array,
      keep = [];
    for (let i = 0; i < index.length; i += 3) {
      const mid = new T.Vector3();
      for (let j = 0; j < 3; j++)
        mid.add(new T.Vector3().fromBufferAttribute(pos, index[i + j]));
      mid.normalize();
      if (!pores.some((d) => mid.dot(d) > Math.cos(0.073)))
        keep.push(index[i], index[i + 1], index[i + 2]);
    }
    geo.setIndex(keep);
    geo.scale(r, r * 0.93, r * 0.81).translate(...p);
    b.add(geo, C.nucleus, id, front ? { cap: true } : {});
  }
  for (const d of pores) {
    const center = new T.Vector3(
        p[0] + d.x * r,
        p[1] + d.y * r * 0.93,
        p[2] + d.z * r * 0.81,
      ),
      normal = new T.Vector3(d.x, d.y / 0.93, d.z / 0.81).normalize(),
      q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 0, 1), normal),
      geo = new T.TorusGeometry(r * 0.069, r * 0.015, 6, 24);
    geo.applyQuaternion(q).translate(...center.toArray());
    b.add(geo, "#cbb9d2", id, d.z > 0 ? { cap: true } : {});
  }
  const border = new T.EllipseCurve(p[0], p[1], r, r * 0.93, 0, TAU, false, 0)
    .getPoints(100)
    .map((a) => [a.x, a.y, p[2]]);
  b.add(
    tube(curve(border), r * 0.018, r * 0.018, { steps: 100, radial: 8 }),
    "#d6c4d5",
    id,
    { cutOnly: true },
  );
  b.add(
    ellipse(
      [p[0] + r * 0.18, p[1] + r * 0.08, p[2] + r * 0.1],
      [r * 0.26, r * 0.23, r * 0.24],
    ),
    "#c9a0b7",
    id,
  );
  // Irregular peripheral chromatin domains and curved interior chromatin tracks.
  for (let i = 0; i < 8; i++) {
    const a = (i * TAU) / 8 + 0.12 * Math.sin(i * 2),
      pts = Array.from({ length: 28 }, (_, j) => {
        const t = j / 27;
        return [
          p[0] +
            r *
              (0.59 * Math.cos(a) +
                0.13 * Math.sin(t * 10 + i) +
                0.04 * Math.sin(t * 23)),
          p[1] +
            r *
              (0.55 * Math.sin(a) +
                0.12 * Math.sin(t * 7.3 + i * 0.7) +
                0.045 * Math.cos(t * 19)),
          p[2] + r * (-0.12 + 0.17 * Math.sin(t * 5 + i)),
        ];
      });
    b.add(
      tube(curve(pts), r * 0.016, r * 0.011, { steps: 65, radial: 6 }),
      C.chromatin,
      id,
      { cutOnly: true },
    );
  }
  for (let i = 0; i < 5; i++) {
    const a = (i * TAU) / 5 + 0.3;
    b.add(
      ellipse(
        [
          p[0] + r * 0.78 * Math.cos(a),
          p[1] + r * 0.73 * Math.sin(a),
          p[2] - 0.04 * r,
        ],
        [r * 0.08, r * 0.13, r * 0.054],
        null,
        true,
      ),
      "#94799e",
      id,
      { cutOnly: true },
    );
  }
}
function soma(b, local = false) {
  const p = local ? [0, 0, 0] : [-1.83, 0.13, 0],
    s = local ? 1.95 : 1,
    id = "neuronSoma";
  shell(b, p, [0.73 * s, 0.67 * s, 0.49 * s], id, C.membrane, true);
  nuclearBody(
    b,
    [p[0] - 0.06 * s, p[1] + 0.06 * s, p[2] - 0.025 * s],
    0.32 * s,
    local ? id : "neuronNucleus",
  );
  // Nissl cisternae arranged around nucleus, deliberately absent from hillock.
  for (let k = 0; k < 7; k++) {
    const a = 0.8 + k * 0.68,
      center = [
        p[0] + 0.48 * s * Math.cos(a),
        p[1] + 0.44 * s * Math.sin(a),
        p[2] - 0.05 * s,
      ];
    for (let j = 0; j < 3; j++) {
      const pts = Array.from({ length: 8 }, (_, i) => {
        const q = (i / 7 - 0.5) * 0.24 * s;
        return [
          center[0] + q * Math.cos(a + 0.8),
          center[1] + q * Math.sin(a + 0.8) + j * 0.036 * s,
          center[2] + 0.09 * s * Math.sin((i / 7) * Math.PI),
        ];
      });
      b.add(
        tube(curve(pts), 0.016 * s, 0.016 * s, { steps: 12, radial: 6 }),
        C.nissl,
        id,
        { cutOnly: true },
      );
      for (let i = 1; i < 7; i += 2) {
        const q = pts[i];
        b.add(
          ellipse(
            [q[0], q[1] + 0.012 * s, q[2] + 0.022 * s],
            [0.017 * s, 0.012 * s, 0.013 * s],
          ),
          "#d4b89d",
          id,
          { cutOnly: true },
        );
      }
    }
  }
  for (const a of [1.3, 3.35, 4.8])
    mitochondrion(
      b,
      [
        p[0] + 0.53 * s * Math.cos(a),
        p[1] + 0.46 * s * Math.sin(a),
        p[2] + 0.035 * s,
      ],
      [0.1 * s, 0.038 * s, 0.035 * s],
      id,
      { cutOnly: true },
    );
  if (local) {
    for (const [a, r] of [
      [0.9, 0.23],
      [2.4, 0.25],
      [3.5, 0.23],
      [4.5, 0.22],
    ]) {
      const start = [
          p[0] + 0.55 * s * Math.cos(a),
          p[1] + 0.5 * s * Math.sin(a),
          0,
        ],
        end = [
          p[0] + 1.12 * s * Math.cos(a),
          p[1] + 1.05 * s * Math.sin(a),
          0.2 * Math.sin(a),
        ];
      b.add(tube(curve([start, end]), r, 0.085), C.dendrite, id);
    }
    b.add(
      tube(
        curve([
          [1, 0.0, 0],
          [1.6, -0.22, 0.05],
          [2.05, -0.29, 0.1],
        ]),
        0.27,
        0.08,
      ),
      C.core,
      id,
    );
  }
}
function dendrites(b) {
  const id = "neuronDendrites";
  arms.forEach((arm, index) => {
    const c = curve(arm);
    b.add(
      tube(c, 0.22, 0.012, {
        steps: 62,
        profile: (t) => 0.205 * (1 - t) ** 1.45 + 0.012,
      }),
      C.dendrite,
      id,
    );
    for (let k = 0; k < 4; k++) {
      const t = 0.3 + k * 0.17,
        f = frame(c, t),
        sgn = (index + k) % 2 ? 1 : -1,
        side = f.y
          .clone()
          .multiplyScalar(sgn * 0.6)
          .addScaledVector(f.z, 0.25 * Math.sin(index + k));
      const p = f.p,
        e = p.clone().addScaledVector(f.x, 0.55).add(side),
        mid = p.clone().lerp(e, 0.5).addScaledVector(f.x, 0.12),
        branch = curve([p, mid, e]);
      b.add(
        tube(branch, 0.069 * (1 - t) + 0.014, 0.005, { steps: 28 }),
        C.dendrite,
        id,
      );
      if (k < 3) {
        const q = branch.getPointAt(0.58),
          tip = q
            .clone()
            .addScaledVector(f.x, 0.45)
            .addScaledVector(side, -0.27)
            .addScaledVector(f.z, 0.18);
        b.add(
          tube(curve([q, q.clone().lerp(tip, 0.5), tip]), 0.027, 0.004, {
            steps: 20,
          }),
          C.dendrite,
          id,
        );
      }
    }
  });
}
function sheath(b, c, start, end, r, id, detail = false) {
  const inner = r * 0.46,
    layers = detail ? 7 : 5;
  for (const front of [false, true])
    b.add(
      tube(c, r, r, {
        start,
        end,
        angle: front ? -Math.PI / 2 : Math.PI / 2,
        arc: Math.PI,
        profile: (u) => r * (0.54 + 0.46 * Math.sin(Math.PI * u) ** 0.25),
      }),
      C.myelin,
      id,
      front ? { cap: true } : {},
    );
  // Lamellae terminate progressively towards the node: not concentric floating cylinders.
  for (let n = 0; n < layers; n++) {
    const rr = inner + ((r - inner) * n) / layers,
      inset = (layers - n - 1) * (end - start) * 0.009,
      a = start + inset,
      e = end - inset;
    b.add(
      tube(c, rr, rr, {
        start: a,
        end: e,
        angle: Math.PI / 2,
        arc: Math.PI,
        steps: 48,
        profile: (u) =>
          inner + (rr - inner) * (0.14 + 0.86 * Math.sin(Math.PI * u) ** 0.25),
      }),
      n % 2 ? C.lamella : C.dark,
      id,
      { cutOnly: true },
    );
    for (const t of [a, e]) {
      b.add(
        ring(
          c,
          t,
          inner + (rr - inner) * 0.14,
          inner + (rr - inner) * 0.14 + ((r - inner) / layers) * 0.08,
          Math.PI / 2,
          Math.PI,
        ),
        n % 2 ? C.lamella : C.dark,
        id,
        { cutOnly: true },
      );
    }
    // Longitudinal cut edges are thin paired strips, all following same axonal curve.
    for (const angle of [Math.PI / 2, Math.PI * 1.5])
      b.add(
        tube(c, rr, rr, {
          start: a,
          end: e,
          angle: angle - 0.013,
          arc: 0.026,
          steps: 48,
          radial: 2,
          profile: (u) =>
            inner +
            (rr - inner) * (0.14 + 0.86 * Math.sin(Math.PI * u) ** 0.25),
        }),
        C.lamella,
        id,
        { cutOnly: true },
      );
  }
  for (const t of [start, end]) {
    b.add(ring(c, t, inner, r * 0.54, Math.PI / 2, Math.PI), C.lamella, id);
    b.add(ring(c, t, inner, r * 0.54, -Math.PI / 2, Math.PI), C.lamella, id, {
      cap: true,
    });
  }
  // Successive terminal loops converge onto the axolemma on each side.
  for (const sign of [-1, 1])
    for (let n = 0; n < 4; n++) {
      const t =
          sign < 0
            ? start + (end - start) * (0.012 + n * 0.013)
            : end - (end - start) * (0.012 + n * 0.013),
        f = frame(c, t),
        rr = r * (0.5 + n * 0.07),
        g = new T.TorusGeometry(rr, r * 0.029, 6, 28);
      g.applyMatrix4(new T.Matrix4().makeBasis(f.z, f.y, f.x).setPosition(f.p));
      b.add(g, "#c0caae", id);
    }
}
function axonalCore(b, c, r, id, { start = 0, end = 1, inside = false } = {}) {
  b.add(
    tube(c, r, r, {
      start,
      end,
      angle: Math.PI / 2,
      arc: inside ? Math.PI : TAU,
    }),
    C.core,
    id,
  );
  if (inside) {
    b.add(
      tube(c, r, r, { start, end, angle: -Math.PI / 2, arc: Math.PI }),
      C.core,
      id,
      { cap: true },
    );
    const pos = [],
      uv = [],
      indices = [];
    for (let i = 0; i <= 64; i++) {
      const f = frame(c, start + ((end - start) * i) / 64);
      for (const side of [-1, 1]) {
        pos.push(
          ...f.p
            .clone()
            .addScaledVector(f.y, r * side)
            .toArray(),
        );
        uv.push(i / 64, (side + 1) / 2);
      }
      if (i < 64) {
        const k = i * 2;
        indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2);
      }
    }
    const cutFace = new T.BufferGeometry();
    cutFace.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    cutFace.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    cutFace.setIndex(indices);
    cutFace.computeVertexNormals();
    b.add(cutFace, "#e3c793", id, { cutOnly: true });
    for (const off of [-0.3, 0, 0.3]) {
      const pts = Array.from({ length: 25 }, (_, i) => {
        const f = frame(c, start + ((end - start) * i) / 24);
        return f.p
          .clone()
          .addScaledVector(f.y, r * off)
          .addScaledVector(f.z, r * 0.025);
      });
      b.add(
        tube(curve(pts), r * 0.037, r * 0.037, { radial: 6, steps: 60 }),
        "#9d855f",
        id,
        { cutOnly: true },
      );
    }
  }
}
function nodes(b, c, end, next, r, id) {
  b.add(
    tube(c, r * 1.04, r * 1.04, { start: end, end: next, steps: 16 }),
    "#efc58b",
    id,
  );
  const mid = (end + next) / 2;
  // Nodal channel clusters in the exposed gap, not beneath internodal myelin.
  for (let i = 0; i < 3; i++) {
    const f = frame(c, mid + (i - 1) * (next - end) * 0.19);
    for (let j = 0; j < 7; j++) {
      const a = (j * TAU) / 7,
        p = f.p
          .clone()
          .addScaledVector(f.y, r * 1.035 * Math.sin(a))
          .addScaledVector(f.z, r * 1.035 * Math.cos(a));
      b.add(
        ellipse(p.toArray(), [r * 0.09, r * 0.09, r * 0.09]),
        "#ad8250",
        id,
      );
    }
  }
}
function bouton(b, p, s, id) {
  shell(b, p, [s * 0.69, s * 0.49, s * 0.42], id, C.membrane);
  // Vesicle cluster is localized above the presynaptic active-zone membrane patch.
  for (let row = 0; row < 3; row++)
    for (let i = 0; i < 5 - row; i++) {
      const x =
          p[0] +
          (i - (4 - row) / 2) * s * 0.15 +
          s * 0.025 * Math.sin(i * 2.4 + row),
        y =
          p[1] -
          0.22 * s +
          row * 0.14 * s +
          s * 0.024 * Math.sin(i * 1.7 + row),
        z = p[2] + 0.09 * s * Math.sin(i * 1.9 + row);
      b.add(
        ellipse([x, y, z], [s * 0.046, s * 0.046, s * 0.046]),
        C.vesicle,
        id,
        { cutOnly: true },
      );
    }
  for (const x of [-0.21, 0, 0.21]) {
    b.add(
      ellipse(
        [
          p[0] + x * s,
          p[1] - (0.335 - Math.abs(x) * 0.05) * s,
          p[2] + 0.05 * s,
        ],
        [s * 0.045, s * 0.045, s * 0.045],
      ),
      C.vesicle,
      id,
      { cutOnly: true },
    );
  }
  mitochondrion(
    b,
    [p[0] + s * 0.15, p[1] + s * 0.2, p[2] - 0.045 * s],
    [s * 0.23, s * 0.078, s * 0.071],
    id,
    { cutOnly: true },
  );
  const active = curve([
    [p[0] - 0.32 * s, p[1] - 0.38 * s, p[2]],
    [p[0], p[1] - 0.405 * s, p[2] + 0.075 * s],
    [p[0] + 0.32 * s, p[1] - 0.38 * s, p[2]],
  ]);
  b.add(
    tube(active, 0.023 * s, 0.023 * s, { steps: 26, radial: 8 }),
    "#aa807a",
    id,
    { cutOnly: true },
  );
}
function terminals(b, isolated = false) {
  const id = "neuronTerminals";
  if (isolated) {
    b.add(
      tube(
        curve([
          [-2.5, 0.42, -0.05],
          [-1.65, 0.28, 0],
          [-0.83, 0.04, 0],
        ]),
        0.11,
        0.18,
      ),
      C.dendrite,
      id,
    );
    bouton(b, [0, 0, 0], 1.7, id);
    return;
  }
  const origin = v(AXON.at(-1));
  for (let i = 0; i < 4; i++) {
    const end = v([4.13 + (i % 2) * 0.17, -1.46 + i * 0.56, -0.31 + i * 0.22]),
      mid = origin
        .clone()
        .lerp(end, 0.58)
        .add(v([0.12, 0, 0.1 * Math.sin(i)]));
    b.add(
      tube(curve([origin, mid, end]), 0.058, 0.022, { steps: 32 }),
      C.dendrite,
      id,
    );
    bouton(b, end.toArray(), 0.16, id);
  }
}
function whole(b) {
  soma(b);
  dendrites(b);
  const c = curve(AXON);
  b.add(
    tube(c, 0.14, 0.065, {
      steps: neuronAxonSampling.longitudinalSegments,
      radial: neuronAxonSampling.radialSegments,
      profile: (t) => 0.065 + 0.15 * Math.exp(-28 * t),
    }),
    C.core,
    "neuronAxon",
  );
  // Initial segment undercoating is indicated by a darker proximal band, not myelin.
  b.add(
    tube(c, 0.079, 0.072, { start: 0.082, end: 0.165, steps: 24 }),
    "#ba965f",
    "neuronAxon",
  );
  for (const { start, end } of neuronInternodes)
    sheath(b, c, start, end, 0.19, "neuronMyelin");
  for (let i = 0; i < 4; i++)
    nodes(
      b,
      c,
      neuronInternodes[i].end,
      neuronInternodes[i + 1].start,
      0.065,
      "neuronNodes",
    );
  terminals(b);
}
const landmark = (id, zh, en, p) => ({ id, zh, en, position: p });
export function buildNeuron(id = "neuron") {
  const b = builder();
  let landmarks = [];
  if (id === "neuron") whole(b);
  else if (id === "neuronSoma") {
    soma(b, true);
    landmarks = [
      landmark(
        "nissl",
        "尼氏体 · 粗面内质网",
        "Nissl substance · rough ER",
        [-0.72, 0.75, 0.18],
      ),
      landmark(
        "hillock",
        "轴丘 · 不含尼氏体",
        "Axon hillock · no Nissl substance",
        [1.46, -0.16, 0.1],
      ),
    ];
  } else if (id === "neuronNucleus") {
    nuclearBody(b, [0, 0, 0], 1.45, id);
    landmarks = [
      landmark("nucleolus", "核仁", "Nucleolus", [0.26, 0.12, 0.14]),
      landmark("chromatin", "染色质", "Chromatin", [-0.92, 0.45, 0.1]),
    ];
  } else if (id === "neuronDendrites") {
    dendrites(b);
    b.add(
      ellipse([-1.83, 0.13, 0], [0.73, 0.67, 0.49], null, true),
      "#b6c7c5",
      id,
      { nonInteractive: true },
    );
    landmarks = [
      landmark(
        "soma-context",
        "胞体位置 · 上下文",
        "Soma position · context",
        [-1.8, 0.12, 0.5],
      ),
      landmark(
        "branch",
        "三级分支 · 空间展开",
        "Higher-order branches · three-dimensional arbor",
        [-3.25, 0.8, 0.5],
      ),
    ];
  } else if (id === "neuronMyelin") {
    const c = curve([
      [-2.05, -0.13, 0],
      [0, 0, 0.07],
      [2.05, 0.1, 0],
    ]);
    axonalCore(b, c, 0.26, id, { inside: true });
    sheath(b, c, 0.05, 0.95, 0.64, id, true);
    landmarks = [
      landmark(
        "wraps",
        "压紧髓鞘 · 膜层示意",
        "Compact myelin · selected lamellae",
        [0, 0.48, 0],
      ),
      landmark(
        "paranode",
        "末端旁结袢",
        "Terminal paranodal loops",
        [1.79, 0.3, 0.1],
      ),
    ];
  } else if (id === "neuronNodes") {
    const c = curve([
      [-2.6, 0, 0],
      [0, 0.07, 0.04],
      [2.6, 0, 0],
    ]);
    axonalCore(b, c, 0.25, id, { inside: true });
    sheath(b, c, 0, 0.435, 0.61, id, true);
    sheath(b, c, 0.565, 1, 0.61, id, true);
    nodes(b, c, 0.435, 0.565, 0.25, id);
    landmarks = [
      landmark(
        "node",
        "裸露结区 · 通道簇",
        "Exposed node · channel clusters",
        [0, 0.31, 0.07],
      ),
      landmark(
        "paranode",
        "旁结袢接近轴膜",
        "Paranodal loops approach axolemma",
        [0.52, 0.35, 0.1],
      ),
    ];
  } else if (id === "neuronAxon") {
    const c = curve([
      [-2.6, 0.3, 0],
      [-1.5, 0.05, 0],
      [0, -0.06, 0.06],
      [2.55, 0.04, 0],
    ]);
    axonalCore(b, c, 0.19, id, { inside: true });
    b.add(tube(c, 0.37, 0.19, { start: 0, end: 0.2 }), C.membrane, id);
    b.add(
      tube(c, 0.202, 0.202, {
        start: 0.2,
        end: 0.42,
        angle: Math.PI / 2,
        arc: Math.PI,
      }),
      "#aa8758",
      id,
    );
    b.add(
      tube(c, 0.202, 0.202, {
        start: 0.2,
        end: 0.42,
        angle: -Math.PI / 2,
        arc: Math.PI,
      }),
      "#aa8758",
      id,
      { cap: true },
    );
    sheath(b, c, 0.55, 0.95, 0.43, id, true);
    landmarks = [
      landmark(
        "ais",
        "轴突初始段 · 膜下支架",
        "Axon initial segment · submembrane scaffold",
        [-0.95, 0.13, 0],
      ),
      landmark(
        "tracks",
        "纵行微管束示意",
        "Longitudinal microtubule bundles",
        [0.5, 0.1, 0.2],
      ),
    ];
  } else if (id === "neuronTerminals") {
    terminals(b, true);
    landmarks = [
      landmark("vesicles", "突触小泡", "Synaptic vesicles", [-0.2, -0.17, 0.1]),
      landmark(
        "active",
        "突触前活性区",
        "Presynaptic active zone",
        [0, -0.68, 0.1],
      ),
      landmark("mito", "线粒体", "Mitochondrion", [0.25, 0.35, 0]),
    ];
  } else return null;
  // Whole shells conceal these teaching targets; keep their leaders in cutaways.
  const sectionLandmarks = {
    neuronSoma: ["nissl"],
    neuronNucleus: ["nucleolus", "chromatin"],
    neuronAxon: ["ais", "tracks"],
    neuronMyelin: ["wraps", "paranode"],
    neuronNodes: ["paranode"],
    neuronTerminals: ["vesicles", "active", "mito"],
  };
  landmarks = landmarks.map((item) =>
    sectionLandmarks[id]?.includes(item.id)
      ? { ...item, visibleModes: ["section"] }
      : item,
  );
  const g = b.finish();
  g.userData = {
    ownedGeometry: true,
    specimenId: "neuron",
    landmarks,
    partLabelModes:
      id === "neuron" ? { neuronNucleus: ["section", "explode"] } : {},
    partAnchors:
      id === "neuron"
        ? {
            neuronSoma: [-2.3, 0.14, 0.3],
            neuronNucleus: [-1.89, 0.19, 0.26],
            neuronDendrites: [-3.05, 1.2, 0.24],
            neuronAxon: [-0.87, -0.28, 0.12],
            neuronMyelin: [1.35, -0.47, 0.25],
            neuronNodes: curve(AXON)
              .getPointAt(
                (neuronInternodes[1].end + neuronInternodes[2].start) / 2,
              )
              .toArray(),
            neuronTerminals: [4.25, -0.92, 0.1],
          }
        : {},
    biology: {
      nuclei: 1,
      axons: 1,
      primaryDendrites: arms.length,
      myelinInternodes: 5,
      nodes: 4,
      continuousAxon: AXON,
      axonLongitudinallyCompressed: true,
      lamellaeSchematic: true,
      detailScaleVaries: true,
    },
  };
  return g;
}
