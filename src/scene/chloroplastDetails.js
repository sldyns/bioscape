import * as T from "three";
import { addMesh, ball, shell, setHit } from "./specimenGeometry";
import { implicitMembrane, splitSection } from "./implicitMembrane";
import { exactIndexGeometry } from "./exactGeometry";

// Continuous union: junctions remove the original end walls of both sacs.
export function thylakoidSamples(single = false) {
  const centers = single ? [0] : [-0.73, 0.73];
  const samples = [];
  for (const x of centers) {
    for (let l = 0; l < 6; l++)
      samples.push({ p: [x, (l - 2.5) * 0.14, 0], r: [0.4, 0.042, 0.33] });
    // A sloping peripheral connection joins successive levels at the rear.
    // The path is illustrative, rather than a reconstruction of one chloroplast.
    for (let l = 0; l < 5; l++)
      for (let i = 0; i <= 24; i++) {
        const t = i / 24,
          a = 1.05 + Math.PI * 1.8 * t;
        samples.push({
          p: [
            x + 0.31 * Math.cos(a),
            (l - 2.5 + t) * 0.14,
            -0.035 + 0.235 * Math.sin(a),
          ],
          r: [0.075, 0.034, 0.072],
        });
      }
  }
  if (!single)
    for (const l of [0, 2, 4]) {
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        samples.push({
          p: [
            -0.47 + t * 0.94,
            (l - 2.5 + t * 0.5) * 0.14,
            -0.11 + 0.025 * Math.sin(t * Math.PI),
          ],
          r: [0.09, 0.037, 0.14],
        });
      }
      // Join the tilted sheet to the next level at the right-hand granum margin.
      for (let i = 0; i <= 12; i++)
        samples.push({
          p: [0.47 + (i / 12) * 0.08, (l - 2 + (0.5 * i) / 12) * 0.14, -0.11],
          r: [0.08, 0.035, 0.12],
        });
    }
  return samples;
}
export function thylakoidField(samples, p) {
  let value = -Infinity;
  for (const { p: c, r } of samples) {
    // Keep the same arithmetic, without millions of reducer callbacks while
    // sampling the section rim. The field and resulting surface are unchanged.
    const dx = (p[0] - c[0]) / r[0];
    const dy = (p[1] - c[1]) / r[1];
    const dz = (p[2] - c[2]) / r[2];
    value = Math.max(value, 1 - (dx ** 2 + dy ** 2 + dz ** 2));
  }
  return value;
}
function classify(x, z, single) {
  if (single) return "granum";
  return Math.abs(x) > 0.42 || (Math.abs(x) > 0.31 && z > 0.06)
    ? "granum"
    : "stromaLamella";
}
function partition(geometry, single) {
  const src = geometry.index ? geometry.toNonIndexed() : geometry;
  const bins = {
    granum: { position: [], normal: [], uv: [] },
    stromaLamella: { position: [], normal: [], uv: [] },
  };
  const p = src.attributes.position;
  for (let i = 0; i < p.count; i += 3) {
    const id = classify(
      (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3,
      (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3,
      single,
    );
    for (const [name, attr] of Object.entries(src.attributes))
      for (let j = 0; j < 3; j++)
        for (let k = 0; k < attr.itemSize; k++)
          bins[id][name].push(attr.array[(i + j) * attr.itemSize + k]);
  }
  if (src !== geometry) src.dispose();
  geometry.dispose();
  return Object.entries(bins)
    .filter(([, b]) => b.position.length)
    .map(([id, b]) => {
      const geo = new T.BufferGeometry();
      for (const [key, arr] of Object.entries(b))
        geo.setAttribute(
          key,
          new T.Float32BufferAttribute(arr, key === "uv" ? 2 : 3),
        );
      return [id, exactIndexGeometry(geo)];
    });
}
function cutRim(samples, half, z) {
  const positions = [],
    nx = 240,
    ny = 120;
  const grid = Array.from({ length: (nx + 1) * (ny + 1) }, (_, i) => {
    const p = [
      (((i % (nx + 1)) / nx) * 2 - 1) * half[0],
      ((Math.floor(i / (nx + 1)) / ny) * 2 - 1) * half[1],
      z,
    ];
    return { p, f: thylakoidField(samples, p) };
  });
  const clip = (poly, threshold, sign) => {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length],
        da = (a.f - threshold) * sign,
        db = (b.f - threshold) * sign;
      if (da >= 0) out.push(a);
      if (da >= 0 !== db >= 0) {
        const t = da / (da - db);
        out.push({ p: a.p.map((v, k) => v + (b.p[k] - v) * t), f: threshold });
      }
    }
    return out;
  };
  for (let y = 0; y < ny; y++)
    for (let x = 0; x < nx; x++) {
      const i = y * (nx + 1) + x;
      for (const tri of [
        [grid[i], grid[i + 1], grid[i + nx + 2]],
        [grid[i], grid[i + nx + 2], grid[i + nx + 1]],
      ]) {
        const poly = clip(clip(tri, 0, 1), 0.42, -1);
        for (let k = 1; k < poly.length - 1; k++)
          positions.push(...poly[0].p, ...poly[k].p, ...poly[k + 1].p);
      }
    }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute(
    "uv",
    new T.Float32BufferAttribute(
      new Float32Array((positions.length / 3) * 2),
      2,
    ),
  );
  geo.computeVertexNormals();
  return geo;
}
export function thylakoidNetwork({ single = false, leaf = false } = {}) {
  const g = new T.Group(),
    samples = thylakoidSamples(single),
    half = [single ? 0.55 : 1.25, 0.53, 0.45];
  for (const [layer, geo] of implicitMembrane(
    samples,
    half,
    128,
    450000,
  ).entries()) {
    for (const [cap, piece] of splitSection(geo, (p) => p[2] - 0.065).entries())
      for (const [id, part] of partition(piece, single)) {
        const m = addMesh(
          g,
          part,
          layer ? "#749464" : id === "granum" ? "#91aa75" : "#a9bd8f",
          leaf ? "stromaLamella" : id,
          leaf && id === "granum"
            ? { transparent: true, opacity: 0.17, depthWrite: false }
            : {},
        );
        m.userData.cap = Boolean(cap);
      }
  }
  for (const [id, geo] of partition(cutRim(samples, half, 0.065), single))
    addMesh(
      g,
      geo,
      "#c5d3a5",
      leaf ? "stromaLamella" : id,
      leaf && id === "granum"
        ? { transparent: true, opacity: 0.17, depthWrite: false }
        : {},
    ).userData.cutOnly = true;
  g.userData.partAnchors = {
    granum: [-0.85, 0.26, 0.065],
    stromaLamella: [0, -0.23, 0.065],
  };
  g.userData.landmarks = [
    {
      zh: "连通的类囊体腔",
      en: "Connected thylakoid lumen",
      position: [single ? 0 : -0.73, 0.21, 0.065],
    },
    {
      zh: "膜外是基质",
      en: "Stroma outside the membrane",
      position: [single ? 0.35 : 1.06, 0.44, 0.08],
    },
  ];
  if (leaf) g.userData.partAnchors = {};
  g.rotation.set(0.38, -0.18, 0.05);
  return g;
}
function envelope() {
  const g = new T.Group();
  shell(g, [1.42, 0.68, 0.73], 0.026, "#a8bb8d", "chloroplastEnvelope", {
    opacity: 0.73,
  });
  shell(g, [1.3, 0.57, 0.61], 0.027, "#839e76", "chloroplastEnvelope", {
    opacity: 0.85,
  });
  g.userData.landmarks = [
    { zh: "外膜", en: "Outer membrane", position: [-1.25, 0.22, 0.28] },
    { zh: "膜间隙", en: "Intermembrane space", position: [0, 0.54, 0.34] },
    {
      zh: "内膜 · 包围基质",
      en: "Inner membrane · Encloses stroma",
      position: [1.07, -0.1, 0.27],
    },
  ];
  g.rotation.set(0.18, -0.3, 0.13);
  return g;
}
export function chloroplastAssembly() {
  const g = new T.Group();
  const e = envelope();
  e.rotation.set(0, 0, 0);
  e.traverse((o) => {
    if (o.isMesh) {
      o.material.transparent = true;
      o.material.opacity *= 0.5;
      o.material.depthWrite = false;
    }
  });
  g.add(e);
  const th = thylakoidNetwork();
  setHit(th, "thylakoids");
  th.rotation.set(0, 0, 0);
  // The local network is enlarged for inspection. Fit its full curved surface
  // inside the envelope's inner face here, leaving a visible stromal clearance.
  const interior = new T.Group();
  interior.scale.setScalar(0.87);
  interior.add(th);
  g.add(interior);
  for (let i = 0; i < 24; i++) {
    const a = i * 2.3999;
    ball(
      interior,
      [Math.cos(a) * 1.13, Math.sin(a) * 0.46, -0.12 + 0.17 * Math.sin(i)],
      [0.037, 0.035, 0.038],
      "#c3cda9",
      "stroma",
    );
  }
  g.userData.partAnchors = {
    chloroplastEnvelope: [-1.22, 0.31, 0.24],
    thylakoids: [0.64, 0.2, 0.052],
    stroma: [-0.24, -0.43, 0.11],
  };
  g.rotation.set(0.22, -0.2, 0.15);
  return g;
}
export function chloroplastDetail(id) {
  if (id === "chloroplast") return chloroplastAssembly();
  if (id === "chloroplastEnvelope") return envelope();
  if (id === "thylakoids") return thylakoidNetwork();
  if (id === "granum") return thylakoidNetwork({ single: true });
  if (id === "stromaLamella") return thylakoidNetwork({ leaf: true });
  return null;
}
