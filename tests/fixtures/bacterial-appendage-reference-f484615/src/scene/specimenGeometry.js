import * as T from "three";
export const V = (...a) => new T.Vector3(...a),
  TAU = Math.PI * 2;
export function addMesh(g, geometry, color, id, options = {}) {
  if (!geometry.index)
    geometry.setIndex(
      Array.from({ length: geometry.attributes.position.count }, (_, i) => i),
    );
  if (!geometry.attributes.uv)
    geometry.setAttribute(
      "uv",
      new T.BufferAttribute(
        new Float32Array(geometry.attributes.position.count * 2),
        2,
      ),
    );
  const m = new T.Mesh(
    geometry,
    new T.MeshPhysicalMaterial({
      color,
      roughness: 0.56,
      clearcoat: 0.1,
      clearcoatRoughness: 0.55,
      side: T.DoubleSide,
      ...options,
    }),
  );
  m.userData.hitId = id;
  g.add(m);
  return m;
}
export function ball(g, p, s, c, id, options = {}) {
  const m = addMesh(g, new T.SphereGeometry(1, 32, 24), c, id, options);
  m.position.set(...p);
  m.scale.set(...s);
  return m;
}
export function tube(g, points, r, c, id, closed = false) {
  return addMesh(
    g,
    new T.TubeGeometry(
      new T.CatmullRomCurve3(
        points.map((p) => (Array.isArray(p) ? V(...p) : p)),
        closed,
      ),
      Math.max(48, points.length * 3),
      r,
      10,
      closed,
    ),
    c,
    id,
  );
}
export function ring(g, p, r, thickness, c, id) {
  const m = addMesh(g, new T.TorusGeometry(r, thickness, 12, 72), c, id);
  m.position.set(...p);
  return m;
}
export function setHit(g, id) {
  g.traverse((o) => {
    if (o.isMesh) o.userData.hitId = id;
  });
  g.userData.landmarks = [];
  g.userData.partAnchors = {};
  return g;
}
export function place(g, child, id, p, s, rotation = [0, 0, 0]) {
  setHit(child, id);
  child.position.set(...p);
  child.scale.setScalar(s);
  child.rotation.set(...rotation);
  g.add(child);
  return child;
}
const signedPow = (v, e) => Math.sign(v) * Math.abs(v) ** e;
export function surfacePoint(theta, phi, radii, exponent = 1) {
  return V(
    radii[0] * signedPow(Math.sin(theta) * Math.cos(phi), exponent),
    radii[1] * signedPow(Math.sin(theta) * Math.sin(phi), exponent),
    radii[2] * signedPow(Math.cos(theta), exponent),
  );
}
function surface(radii, start, end, exponent) {
  const p = [],
    uv = [],
    index = [],
    u = 112,
    v = 48;
  for (let i = 0; i <= u; i++)
    for (let j = 0; j <= v; j++) {
      p.push(
        ...surfacePoint(
          start + ((end - start) * j) / v,
          (i / u) * TAU,
          radii,
          exponent,
        ),
      );
      uv.push(i / u, j / v);
    }
  for (let i = 0; i < u; i++)
    for (let j = 0; j < v; j++) {
      const a = i * (v + 1) + j,
        b = a + v + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(p, 3));
  geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return geo;
}
export function shell(
  g,
  radii,
  thickness,
  c,
  id,
  { exponent = 1, cut = 1.15, opacity = 0.42 } = {},
) {
  const inner = radii.map((v) => v - thickness);
  for (const r of [radii, inner]) {
    addMesh(g, surface(r, cut, Math.PI, exponent), c, id, {
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity === 1,
    });
    const cap = addMesh(g, surface(r, 0, cut, exponent), c, id, {
      transparent: true,
      opacity: opacity * 0.52,
      depthWrite: false,
    });
    cap.userData.cap = true;
  }
  const points = Array.from({ length: 113 }, (_, i) =>
    surfacePoint(cut, (i / 112) * TAU, radii, exponent),
  );
  const rim = tube(g, points, thickness * 0.52, c, id);
  rim.userData.cutOnly = true;
  return g;
}
export function lipidPatch(
  id,
  { outer = "#a5bab0", inside = "#c0c9ab", glycans = false } = {},
) {
  const g = new T.Group();
  for (let x = -7; x <= 7; x++)
    for (let z = -4; z <= 4; z++)
      for (const side of [-1, 1]) {
        const px = x * 0.14,
          pz = z * 0.14;
        ball(
          g,
          [px, side * 0.22, pz],
          [0.058, 0.058, 0.058],
          side > 0 ? outer : inside,
          id,
        );
        for (const d of [-1, 1])
          tube(
            g,
            [
              [px + d * 0.02, side * 0.18, pz],
              [px + d * 0.024, side * 0.1, pz + 0.013],
              [px + d * 0.025, side * 0.028, pz - 0.012],
            ],
            0.016,
            "#bfb99d",
            id,
          );
      }
  for (const x of [-0.56, 0.52]) {
    ball(g, [x, 0, 0.1], [0.12, 0.36, 0.13], "#879f9a", id);
    ring(g, [x, 0.28, 0.1], 0.1, 0.025, "#819b94", id).rotation.x = Math.PI / 2;
  }
  if (glycans)
    for (let i = 0; i < 7; i++)
      tube(
        g,
        [
          [i * 0.22 - 0.7, 0.25, -0.2],
          [i * 0.22 - 0.7, 0.45, -0.18],
          [i * 0.22 - 0.65, 0.6, -0.18],
          [i * 0.22 - 0.71, 0.77, -0.18],
        ],
        0.025,
        "#c3b992",
        id,
      );
  g.rotation.set(0.38, -0.22, -0.12);
  return g;
}
export function dnaLoop(id, { radius = 1, turns = 9, tilt = 0.2 } = {}) {
  const g = new T.Group(),
    paths = [[], []];
  for (let i = 0; i <= 300; i++) {
    const a = (i / 300) * TAU,
      center = V(
        radius * Math.cos(a),
        radius * 0.68 * Math.sin(a),
        tilt * Math.sin(3 * a),
      );
    for (let side = 0; side < 2; side++) {
      const q = a * turns + side * Math.PI;
      paths[side].push(
        center
          .clone()
          .add(
            V(
              Math.cos(a) * Math.cos(q) * 0.075,
              Math.sin(a) * Math.cos(q) * 0.075,
              Math.sin(q) * 0.075,
            ),
          ),
      );
    }
    if (i % 5 === 0)
      tube(g, [paths[0].at(-1), paths[1].at(-1)], 0.009, "#c1b9c8", id);
  }
  paths.forEach((p, i) => tube(g, p, 0.019, i ? "#bca2bc" : "#91a7b7", id));
  return g;
}
export function solutes(id) {
  const g = new T.Group();
  for (let i = 0; i < 18; i++) {
    const a = i * 2.3999,
      r = 0.4 + 0.055 * i,
      p = V(Math.cos(a) * r, Math.sin(a) * r * 0.8, Math.sin(i * 1.7) * 0.42);
    const chain = Array.from({ length: 18 }, (_, j) =>
      p
        .clone()
        .add(
          V(0.12 * Math.cos(j * 0.8), 0.1 * Math.sin(j * 0.9), 0.025 * (j - 9)),
        ),
    );
    tube(g, chain, 0.023, i % 2 ? "#c0bc9f" : "#a4bdb0", id);
  }
  return g;
}

// Context-neutral aqueous mixture; no species-specific experimental protein is relabeled.
export function aqueousMixture(id) {
  const g = new T.Group();
  for (let i = 0; i < 5; i++) {
    const a = i * 2.3999,
      x = Math.cos(a) * 0.72,
      y = Math.sin(a) * 0.65,
      z = 0.17 * Math.sin(i * 1.3);
    for (let k = 0; k < 3 + (i % 2); k++) {
      const q = (k * TAU) / (3 + (i % 2));
      const m = ball(
        g,
        [x + 0.07 * Math.cos(q), y + 0.065 * Math.sin(q), z],
        [0.1, 0.075, 0.095],
        i % 2 ? "#b2b397" : "#a5b8a5",
        id,
      );
      m.rotation.set(i * 0.4, k * 0.7, i * 0.2);
    }
  }
  for (let i = 0; i < 48; i++) {
    const a = i * 2.3999,
      r = 0.2 + 0.013 * i,
      p = V(Math.cos(a) * r, Math.sin(a) * r, 0.38 * Math.sin(i * 1.71));
    ball(g, p.toArray(), [0.02, 0.02, 0.02], "#a8c0cc", id);
    for (const side of [-1, 1])
      ball(
        g,
        p
          .clone()
          .add(V(side * 0.019, 0.015, 0))
          .toArray(),
        [0.012, 0.012, 0.012],
        "#e1e6e3",
        id,
      );
  }
  for (let i = 0; i < 12; i++) {
    const a = i * 2.3999;
    ball(
      g,
      [0.94 * Math.cos(a), 0.81 * Math.sin(a), 0.23 * Math.sin(i)],
      [0.033, 0.033, 0.033],
      i % 2 ? "#b1a3be" : "#b7c397",
      id,
    );
  }
  g.userData.landmarks = [
    {
      zh: "代谢蛋白轮廓（非特定酶）",
      en: "Metabolic protein silhouettes (not a specific enzyme)",
      position: [0.72, 0, 0.1],
    },
    {
      zh: "水与溶解离子",
      en: "Water and dissolved ions",
      position: [-0.44, 0.57, 0.22],
    },
  ];
  return g;
}
