import * as T from "three";
import { addMesh } from "../../scene/specimenGeometry.js";
import data from "./data/rod-rhodopsin-1u19.json" with { type: "json" };

const ID = "rodRhodopsin";
const SCALE = 0.083;
const HELIX_COLORS = [
  "#97a7b2",
  "#788d9a",
  "#a3a6b6",
  "#8096a0",
  "#aaa4aa",
  "#85899c",
  "#b1b1ba",
];
const LOOP = "#98a3ab";
const RETINAL = "#ec972d";
const LYSINE = "#767d8c";
const roman = ["I", "II", "III", "IV", "V", "VI", "VII"];
const v = (p) => new T.Vector3(...p);
const mean = (points) =>
  points
    .reduce((s, p) => s.add(p), new T.Vector3())
    .divideScalar(points.length);
const clamp = T.MathUtils.clamp;

// The crystal axes are arbitrary. Align alternating helical ends to the disc
// lumen (+Y). The ligand's projected long axis is horizontal, keeping its
// native bend and the link to helix VII visible in the default projection.
function specimenFrame(backbone, ligand) {
  const lumen = [],
    cytoplasm = [];
  data.tm.forEach(([first, last], i) => {
    const start = mean(backbone.slice(first - 1, first + 3));
    const end = mean(backbone.slice(last - 4, last));
    lumen.push(i % 2 ? end : start);
    cytoplasm.push(i % 2 ? start : end);
  });
  const lum = mean(lumen),
    cyto = mean(cytoplasm);
  const center = lum.clone().lerp(cyto, 0.5),
    y = lum.clone().sub(cyto).normalize();
  const x = ligand[14].clone().sub(mean(ligand.slice(0, 6)));
  x.addScaledVector(y, -x.dot(y)).normalize();
  const z = new T.Vector3().crossVectors(x, y).normalize();
  const pocket = mean(ligand);
  const occlusion = (sign) =>
    backbone.reduce((s, p) => {
      const d = p.clone().sub(pocket);
      if (sign * d.dot(z) < 0) return s;
      return s + Math.exp(-((d.dot(x) / 10) ** 2 + (d.dot(y) / 5) ** 2));
    }, 0);
  if (occlusion(-1) < occlusion(1)) {
    x.negate();
    z.negate();
  }
  return (p) => {
    const d = p.clone().sub(center);
    return new T.Vector3(d.dot(x), d.dot(y), d.dot(z)).multiplyScalar(SCALE);
  };
}

function add(group, geometry, color, options, flags) {
  const item = addMesh(group, geometry, color, ID, {
    roughness: 0.49,
    clearcoat: 0.18,
    clearcoatRoughness: 0.55,
    ...options,
  });
  Object.assign(item.userData, flags);
  item.castShadow = !item.material.transparent;
  item.receiveShadow = true;
  return item;
}

function profile(residue) {
  const rangeProfile = ([a, b]) =>
    clamp(Math.min(residue - a + 0.75, b - residue + 0.75) / 1.15, 0, 1);
  for (const [i, range] of data.tm.entries()) {
    const w = rangeProfile(range);
    if (w > 0)
      return {
        width: 0.52 + 1.25 * w,
        thickness: 0.52 - 0.16 * w,
        color: HELIX_COLORS[i],
      };
  }
  for (const range of [data.helixVIII, data.shortHelix]) {
    const w = rangeProfile(range);
    if (w > 0)
      return {
        width: 0.52 + 1.0 * w,
        thickness: 0.52 - 0.15 * w,
        color: "#8794a2",
      };
  }
  for (const range of data.sheet) {
    const w = rangeProfile(range);
    if (w > 0)
      return {
        width: 0.52 + 0.66 * w,
        thickness: 0.52 - 0.2 * w,
        color: "#b0b1ba",
      };
  }
  return { width: 0.52, thickness: 0.52, color: LOOP };
}

// Build the complete ribbon before splitting its material and cutaway runs.
// Normals remain continuous where two retained runs meet. The curve passes
// through the measured Cα of every residue, including loop and terminal sites.
function backboneMesh(group, points, ligand) {
  const curve = new T.CatmullRomCurve3(points, false, "centripetal");
  const stepsPerResidue = 6,
    stride = 12,
    rows = (points.length - 1) * stepsPerResidue + 1;
  const pos = [],
    uv = [],
    allIndices = [],
    bins = new Map();
  const previous = new T.Vector3(0, 0, 1);
  const at = (r) =>
    curve.getPoint(clamp(r, 0, points.length - 1) / (points.length - 1));
  for (let i = 0; i < rows; i++) {
    const r = i / stepsPerResidue,
      center = at(r),
      tangent = at(r + 0.04)
        .sub(at(r - 0.04))
        .normalize();
    const radial = center.clone().sub(at(r - 0.8).lerp(at(r + 0.8), 0.5));
    radial.addScaledVector(tangent, -radial.dot(tangent));
    if (radial.lengthSq() < 1e-10)
      radial.copy(previous).addScaledVector(tangent, -previous.dot(tangent));
    if (radial.lengthSq() < 1e-10)
      radial.set(1, 0, 0).addScaledVector(tangent, -tangent.x);
    radial.normalize();
    if (i && radial.dot(previous) < 0) radial.negate();
    previous.copy(radial);
    const wide = new T.Vector3().crossVectors(tangent, radial).normalize();
    const shape = profile(r + 1);
    for (let j = 0; j < stride; j++) {
      const a = (2 * Math.PI * j) / stride;
      const p = center
        .clone()
        .addScaledVector(radial, SCALE * shape.thickness * Math.cos(a))
        .addScaledVector(wide, SCALE * shape.width * Math.sin(a));
      pos.push(p.x, p.y, p.z);
      uv.push(r / (points.length - 1), j / stride);
    }
    if (i + 1 === rows) continue;
    // The protein stays continuous in whole mode. Only portions lying in
    // front of the native chromophore receive a pale contextual trace in section.
    const cut = ligand.some(
      (q) =>
        center.z > q.z + 0.5 * SCALE &&
        Math.hypot(center.x - q.x, center.y - q.y) < 6 * SCALE,
    );
    const key = shape.color + (cut ? "-window" : "");
    if (!bins.has(key)) bins.set(key, { color: shape.color, cut, indices: [] });
    const bin = bins.get(key);
    for (let j = 0; j < stride; j++) {
      const a = i * stride + j,
        b = i * stride + ((j + 1) % stride);
      const face = [a, b, a + stride, b, b + stride, a + stride];
      allIndices.push(...face);
      bin.indices.push(...face);
    }
  }
  const whole = new T.BufferGeometry();
  whole.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  whole.setIndex(allIndices);
  whole.computeVertexNormals();
  const normals = whole.attributes.normal.array;
  for (const { color, cut, indices } of bins.values()) {
    const local = new Map(),
      positions = [],
      refNormals = [],
      coords = [],
      faces = [];
    for (const id of indices) {
      if (!local.has(id)) {
        local.set(id, local.size);
        positions.push(pos[3 * id], pos[3 * id + 1], pos[3 * id + 2]);
        refNormals.push(
          normals[3 * id],
          normals[3 * id + 1],
          normals[3 * id + 2],
        );
        coords.push(uv[2 * id], uv[2 * id + 1]);
      }
      faces.push(local.get(id));
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new T.Float32BufferAttribute(refNormals, 3));
    geo.setAttribute("uv", new T.Float32BufferAttribute(coords, 2));
    geo.setIndex(faces);
    add(group, geo, color, {}, cut ? { cap: true } : {});
    if (cut)
      add(
        group,
        geo.clone(),
        color,
        { transparent: true, opacity: 0.1, depthWrite: false },
        { cutOnly: true, nonInteractive: true },
      );
  }
  whole.dispose();
}

function atom(group, p, r, color) {
  const m = add(group, new T.SphereGeometry(r * SCALE, 20, 14), color, {}, {});
  m.position.copy(p);
}
function stick(group, a, b, r, color) {
  const d = b.clone().sub(a);
  const m = add(
    group,
    new T.CylinderGeometry(r * SCALE, r * SCALE, d.length(), 12, 1, false),
    color,
    {},
    {},
  );
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
  m.position.copy(a).lerp(b, 0.5);
}
function doubleBond(group, a, b, reference, color) {
  const dir = b.clone().sub(a).normalize();
  const offset = reference.clone().sub(a);
  offset
    .addScaledVector(dir, -offset.dot(dir))
    .normalize()
    .multiplyScalar(0.22 * SCALE);
  for (const s of [-1, 1])
    stick(
      group,
      a.clone().addScaledVector(offset, s),
      b.clone().addScaledVector(offset, s),
      0.145,
      color,
    );
}

export function buildRodRhodopsin() {
  const raw = data.ca.map(v),
    rawLigand = data.retinal.positions.map(v),
    transform = specimenFrame(raw, rawLigand);
  const ca = raw.map(transform),
    ligand = rawLigand.map(transform);
  const lys = data.retinal.lysPositions.map((p) => transform(v(p)));
  const g = new T.Group();
  g.userData.ownedGeometry = true;
  g.userData.hitId = ID;
  backboneMesh(g, ca, [...ligand, lys[5]]);
  atom(g, ca[0], 0.52, LOOP);
  atom(g, ca.at(-1), 0.52, LOOP);
  for (const [a, b, order] of data.retinal.bonds) {
    if (order === 1) {
      stick(g, ligand[a - 1], ligand[b - 1], 0.25, RETINAL);
      continue;
    }
    const neighbor = data.retinal.bonds.find(
      ([u, v]) => (u === a && v !== b) || (v === a && u !== b),
    );
    const other = neighbor[0] === a ? neighbor[1] : neighbor[0];
    doubleBond(g, ligand[a - 1], ligand[b - 1], ligand[other - 1], RETINAL);
  }
  for (const p of ligand) atom(g, p, 0.53, RETINAL);
  for (let i = 1; i < lys.length; i++) {
    stick(g, lys[i - 1], lys[i], 0.22, LYSINE);
    atom(g, lys[i], i === 5 ? 0.51 : 0.44, i === 5 ? "#a1a6b9" : LYSINE);
  }
  doubleBond(g, lys[5], ligand[14], lys[4], "#c79a68");
  const mark = (zh, en, p, visibleModes) => ({
    zh,
    en,
    position: p.toArray(),
    ...(visibleModes ? { visibleModes } : {}),
  });
  g.userData.landmarks = [
    mark("11-顺式视黄醛", "11-cis-retinal", ligand[10], ["section"]),
    mark(
      "与 Lys296 的席夫碱键",
      "Schiff-base link to Lys296",
      lys[5].clone().lerp(ligand[14], 0.5),
      ["section"],
    ),
    ...data.tm.map(([a, b], i) => {
      // Use a real surface-facing Cα near one end; stagger anchors between
      // the two bilayer faces to avoid seven labels at the pocket center.
      const f = i % 2 ? 0.68 : 0.29,
        near = a + Math.round((b - a) * f);
      const p = ca
        .slice(near - 3, near + 2)
        .reduce((best, q) => (q.z > best.z ? q : best));
      return mark("跨膜螺旋 " + roman[i], "Transmembrane helix " + roman[i], p);
    }),
    mark("盘腔侧 · N 端", "Disc lumen · N-terminus", ca[0]),
    mark("胞质侧 · 螺旋 VIII", "Cytoplasmic face · helix VIII", ca[315 - 1]),
  ];
  return g;
}
