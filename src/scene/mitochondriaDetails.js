import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
const TAU = Math.PI * 2,
  V = (x, y, z) => new THREE.Vector3(x, y, z);
const colors = {
  outer: "#b68b73",
  inner: "#d2aa78",
  edge: "#ead1a7",
  protein: "#a494b5",
  matrix: "#b3b7a0",
  dna: "#8f9f91",
};
function mesh(g, geo, color, id, flags = {}) {
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.53,
      clearcoat: 0.15,
      side: THREE.DoubleSide,
    }),
  );
  m.userData = { hitId: id, ...flags };
  g.add(m);
  return m;
}
function ball(g, p, s, color, id) {
  const m = mesh(g, new THREE.SphereGeometry(1, 20, 14), color, id);
  m.position.copy(p);
  m.scale.set(...s);
  return m;
}
function line(g, points, r, color, id, closed = false) {
  return mesh(
    g,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points, closed),
      Math.max(48, points.length * 2),
      r,
      8,
      closed,
    ),
    color,
    id,
  );
}
function surface(fn, nu = 100, nv = 64) {
  const pos = [],
    uv = [],
    idx = [];
  for (let i = 0; i <= nu; i++)
    for (let j = 0; j <= nv; j++) {
      pos.push(...fn(i / nu, j / nv));
      uv.push(i / nu, j / nv);
    }
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const a = i * (nv + 1) + j,
        b = a + nv + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const folds = [-0.56, -0.39, -0.19, 0.02, 0.2, 0.4, 0.57];
function foldHeight(y, a) {
  return folds.reduce(
    (sum, f, i) =>
      sum +
      (1 + 0.12 * Math.sin(i * 1.7)) *
        Math.exp(
          -(
            ((y - f - 0.017 * Math.sin(a * 2 + i * 0.7)) /
              (0.033 + 0.006 * Math.cos(i))) **
            2
          ),
        ),
    0,
  );
}
const INNER_SCALE = 0.89;
function bean(t, a, inner = false) {
  const r = inner ? INNER_SCALE : 1,
    outerY = Math.cos(t) * 0.8,
    y = outerY * r,
    w = Math.sin(t) * 0.385,
    shift = 0.12 * (1 - (outerY * outerY) / 0.64);
  // Inset all three axes: the membranes must remain separate at the poles too.
  const x = (Math.cos(a) * w + shift) * r;
  let z = Math.sin(a) * w * 0.82 * r;
  // One continuous inner membrane: crests and their two flanks enclose crista lumen.
  if (inner && a >= Math.PI)
    z +=
      foldHeight(y, a) * 0.3 * Math.max(0, -Math.sin(a)) ** 1.7 * Math.sin(t);
  return V(x, y, z);
}
function membrane(g, inner) {
  const id = inner ? "cristae" : "mitoOuter",
    color = inner ? colors.inner : colors.outer;
  for (const front of [false, true])
    mesh(
      g,
      surface(
        (u, v) =>
          bean(
            v * Math.PI,
            (front ? 0 : Math.PI) + u * Math.PI,
            inner,
          ).toArray(),
        112,
        144,
      ),
      color,
      id,
      { cap: front },
    );
  const rim = [];
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * TAU,
      t = Math.acos(Math.cos(a));
    rim.push(bean(t, a < Math.PI ? 0 : Math.PI, inner));
  }
  const lip = line(g, rim, 0.009, inner ? colors.edge : colors.outer, id);
  lip.userData.cutOnly = true;
  if (!inner) {
    for (const front of [false, true])
      for (let i = 0; i < 30; i++) {
        const t = 0.35 + ((i % 10) / 9) * 2.4,
          a = (front ? 0 : Math.PI) + 0.25 + Math.floor(i / 10) * 1.05,
          p = bean(t, a);
        const channel = new THREE.TorusGeometry(0.018, 0.005, 6, 16);
        const normal = V(
          Math.cos(a) * Math.sin(t),
          Math.cos(t) * 0.4,
          Math.sin(a) * Math.sin(t),
        ).normalize();
        channel.applyQuaternion(
          new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), normal),
        );
        channel.translate(...p.toArray());
        mesh(g, channel, "#967d6d", id, { cap: front });
      }
  }
}
function synthase(g, base = V(0, 0, 0), scale = 1) {
  const sub = new THREE.Group();
  sub.position.copy(base);
  sub.scale.setScalar(scale);
  g.add(sub);
  const id = "atpSynthase";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    ball(
      sub,
      V(Math.cos(a) * 0.16, Math.sin(a) * 0.16, 0),
      [0.067, 0.067, 0.12],
      "#b5a17e",
      id,
    );
  }
  ball(sub, V(0.25, 0, -0.01), [0.13, 0.14, 0.12], "#c6b293", id);
  line(
    sub,
    [V(0, 0, 0.03), V(0, 0, 0.24), V(0, 0, 0.55)],
    0.041,
    "#91897d",
    id,
  );
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    ball(
      sub,
      V(Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0.47),
      [0.14, 0.14, 0.18],
      i % 2 ? "#b7a5c1" : "#d3bd94",
      id,
    );
  }
  line(
    sub,
    [
      V(0.29, 0, -0.02),
      V(0.33, 0.04, 0.26),
      V(0.3, 0.02, 0.53),
      V(0.11, 0.01, 0.62),
    ],
    0.026,
    "#a89479",
    id,
  );
  return sub;
}
function crestSynthase(g, fold, angle, scale) {
  const y = folds[fold] + 0.017 * Math.sin(angle * 2 + fold * 0.7),
    t = Math.acos(y / (0.8 * INNER_SCALE)),
    epsilon = 0.0001,
    along = bean(t + epsilon, angle, true).sub(bean(t - epsilon, angle, true)),
    across = bean(t, angle + epsilon, true).sub(bean(t, angle - epsilon, true));
  // F1 protrudes into the matrix normal to the local crista, rather than
  // sharing a world-space direction that tilts it through curved membranes.
  const normal = along.cross(across).normalize();
  const complex = synthase(g, bean(t, angle, true), scale);
  complex.quaternion.setFromUnitVectors(V(0, 0, 1), normal);
  return complex;
}
function circularDNA(g, id = "mitoDNA", scale = 1, offset = V(0, 0, 0)) {
  const point = (t, k) => {
    const a = t * TAU,
      phase = a * 24 + k * 2.35,
      center = V(
        Math.cos(a) * 0.68,
        Math.sin(a) * 0.68 * 0.82,
        0.07 * Math.sin(a * 3),
      );
    const tangent = V(
      -Math.sin(a) * 0.68,
      Math.cos(a) * 0.68 * 0.82,
      0.21 * Math.cos(a * 3),
    ).normalize();
    const normal = V(Math.cos(a), Math.sin(a), 0);
    normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
    const binormal = tangent.clone().cross(normal);
    return center
      .addScaledVector(normal, 0.035 * Math.cos(phase))
      .addScaledVector(binormal, 0.035 * Math.sin(phase))
      .multiplyScalar(scale)
      .add(offset);
  };
  for (let k = 0; k < 2; k++) {
    const pts = [];
    for (let i = 0; i < 320; i++) pts.push(point(i / 320, k));
    line(g, pts, 0.013 * scale, k ? "#c3ae86" : colors.dna, id, true);
  }
  if (scale >= 1)
    for (let i = 0; i < 240; i++) {
      const a = point(i / 240, 0),
        b = point(i / 240, 1),
        delta = b.clone().sub(a);
      const m = mesh(
        g,
        new THREE.CylinderGeometry(0.004, 0.004, delta.length(), 6),
        "#c4bdab",
        id,
      );
      m.position.copy(a).add(b).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(V(0, 1, 0), delta.normalize());
    }
}
function contents(g, includeDNA = true) {
  // Keep molecules in matrix-facing spaces between crests, rather than inside crista lumen.
  for (let row = 0; row < 6; row++)
    for (let k = 0; k < [3, 5, 4, 3, 5, 4][row]; k++) {
      const y =
          (folds[row] + folds[row + 1]) * 0.5 + 0.018 * Math.sin(k * 3 + row),
        x = (k - 2) * 0.074 + 0.13 + 0.022 * Math.sin(k * 2.7 + row),
        z = -0.014 + 0.029 * Math.sin(row * 3 + k);
      const p = V(x, y, z);
      for (let j = 0; j < 3; j++)
        ball(
          g,
          p
            .clone()
            .add(
              V(
                Math.cos((j / 3) * TAU) * 0.012,
                Math.sin((j / 3) * TAU) * 0.012,
                0,
              ),
            ),
          [0.016, 0.013, 0.015],
          (k + row) % 3 ? colors.matrix : "#c5bda1",
          "matrix",
        );
    }
  for (let i = 0; i < 4; i++) {
    const row = i + 1,
      p = V(i % 2 ? -0.07 : 0.23, (folds[row] + folds[row + 1]) * 0.5, 0.07);
    ball(g, p, [0.026, 0.021, 0.025], "#b6a8b9", "matrix");
    ball(
      g,
      p.clone().add(V(0.005, -0.027, 0.005)),
      [0.025, 0.013, 0.021],
      "#bda989",
      "matrix",
    );
  }
  if (includeDNA) circularDNA(g, "mitoDNA", 0.19, V(0.095, -0.3, 0.095));
}
export function rawMitochondrion({ includeDNA = true } = {}) {
  const g = new THREE.Group();
  membrane(g, false);
  membrane(g, true);
  contents(g, includeDNA);
  for (let i = 0; i < folds.length; i++) {
    for (const a of [Math.PI * 1.42, Math.PI * 1.58]) {
      crestSynthase(g, i, a, 0.095);
    }
  }
  return g;
}
// Shared batching keeps the cell overview and enlarged organelle anatomically consistent.
export function mergeMitochondrion(g, map = (id) => id) {
  g.updateMatrixWorld(true);
  const bins = new Map();
  g.traverse((o) => {
    if (!o.isMesh) return;
    const id = map(o.userData.hitId),
      key =
        id +
        o.material.color.getHexString() +
        !!o.userData.cap +
        !!o.userData.cutOnly;
    if (!bins.has(key))
      bins.set(key, {
        id,
        color: o.material.color.clone(),
        cap: !!o.userData.cap,
        cutOnly: !!o.userData.cutOnly,
        geos: [],
      });
    bins.get(key).geos.push(o.geometry.clone().applyMatrix4(o.matrixWorld));
  });
  const result = new THREE.Group();
  for (const b of bins.values()) {
    mesh(result, mergeGeometries(b.geos), b.color, b.id, {
      cap: b.cap,
      cutOnly: b.cutOnly,
    });
    b.geos.forEach((x) => x.dispose());
  }
  g.traverse((o) => {
    o.geometry?.dispose();
    o.material?.dispose();
  });
  return result;
}
export function mitochondriaDetail(id) {
  if (
    ![
      "mitochondria",
      "mitoOuter",
      "mitoInner",
      "cristae",
      "matrix",
      "mitoDNA",
      "atpSynthase",
    ].includes(id)
  )
    return null;
  const g = new THREE.Group();
  if (id === "mitochondria") {
    const model = mergeMitochondrion(rawMitochondrion(), (hit) =>
      ["cristae", "atpSynthase"].includes(hit)
        ? "mitoInner"
        : hit === "mitoDNA"
          ? "matrix"
          : hit,
    );
    model.userData.landmarks = [
      { zh: "膜间隙", en: "Intermembrane space", position: [-0.244, 0, 0] },
    ];
    return model;
  }
  if (id === "mitoOuter") membrane(g, false);
  if (id === "mitoInner") {
    membrane(g, true);
    for (let i = 0; i < folds.length; i++) {
      crestSynthase(g, i, Math.PI * 1.5, 0.13);
    }
  }
  if (id === "matrix") {
    contents(g);
    g.userData.landmarks = [
      {
        zh: "代谢酶（示意）",
        en: "Metabolic enzymes (schematic)",
        position: [0.11, 0.3, 0],
      },
      {
        zh: "线粒体核糖体（示意）",
        en: "Mitochondrial ribosome (schematic)",
        position: [0.23, -0.29, 0.07],
      },
    ];
  }
  if (id === "mitoDNA") {
    circularDNA(g);
    g.rotation.set(0.25, -0.12, -0.14);
  }
  if (id === "cristae") {
    // A cropped corrugated membrane patch exposes a connected lumen below each crest.
    const patch = (u, v) => {
      const x = (u - 0.5) * 1.8,
        y = (v - 0.5) * 1.7,
        z =
          -0.24 +
          0.65 * Math.exp(-(((y + 0.28) / 0.16) ** 2)) +
          0.58 * Math.exp(-(((y - 0.35) / 0.16) ** 2));
      return [x, y, z + 0.045 * Math.sin(x * 2)];
    };
    mesh(g, surface(patch, 80, 100), colors.inner, id);
    for (const u of [0, 1]) {
      const pts = [];
      for (let i = 0; i <= 100; i++) pts.push(V(...patch(u, i / 100)));
      line(g, pts, 0.013, colors.edge, id);
    }
    g.rotation.set(0.25, -0.65, -0.16);
    g.userData.landmarks = [
      { zh: "基质侧", en: "Matrix side", position: [0.3, 0.36, 0.56] },
      {
        zh: "嵴腔 · 通向膜间隙",
        en: "Crista lumen → intermembrane space",
        position: [-0.85, -0.28, 0.05],
      },
    ];
  }
  if (id === "atpSynthase") {
    synthase(g);
    const shape = new THREE.Shape();
    shape.absarc(0, 0, 0.73, 0, TAU, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.21, 0, TAU, true);
    shape.holes.push(hole);
    mesh(
      g,
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.1,
        bevelEnabled: false,
        curveSegments: 64,
      }),
      colors.inner,
      id,
    ).position.z = -0.05;
    g.rotation.set(-0.25, -0.95, -0.15);
    g.userData.landmarks = [
      { zh: "F₁ · 基质侧", en: "F₁ · Matrix side", position: [0, 0, 0.6] },
      {
        zh: "F₀ · 内膜中",
        en: "F₀ · In inner membrane",
        position: [0.17, 0, 0],
      },
      {
        zh: "膜间隙 / 嵴腔侧",
        en: "Intermembrane / crista lumen side",
        position: [-0.5, 0, -0.13],
      },
    ];
  }
  return g;
}
