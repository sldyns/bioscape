import * as T from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { specimenDirection } from "./specimenViews";
import { exactIndexGeometry } from "./exactGeometry";
import { addMesh, TAU, V } from "./specimenGeometry";

// P. caudatum thin sections show a granular micronucleus with chromatin
// distributed through the compact body, with an achromatic polar cap. A
// central chromatin core surrounded by a clear rim belongs to other species.
// These deterministic density contours represent local staining texture at
// nuclear scale, not individual DNA paths, chromosomes or measured isosurfaces.
function seeded(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
const noise = new SimplexNoise({ random: seeded(739319) });
const relief = (x, y, z) => noise.noise3d(x, y, z);
const chromatinDark = new T.Color("#6c6275");
const chromatinLight = new T.Color("#b6a7b4");
const nucleolusDark = new T.Color("#977d70");
const nucleolusLight = new T.Color("#c9aa92");
const envelopeOuter = new T.Color("#c5b8c2");
const envelopeInner = new T.Color("#9e92a4");
const cutFace = new T.Color("#ac9f9b");
const surface = { vertexColors: true, roughness: 0.82, clearcoat: 0 };

function addColoredMesh(group, geometry, id, role) {
  const mesh = addMesh(group, geometry, "white", id, surface);
  mesh.name = role;
  return mesh;
}

// Only the envelope views put a cut edge above the nuclear material. Curvature
// is qualitative; the fold and section thickness at the one pore are shared.
const curvature = (macro) => (macro ? 0.085 : 0.55);
const midplane = (x, y, macro) =>
  -curvature(macro) * Math.max(0, Math.hypot(x, y) - 0.32) ** 2;

function nucleolarBody(group, id, center, radii) {
  const geometry = new T.SphereGeometry(1, 112, 72);
  const points = geometry.attributes.position;
  const colors = new Float32Array(points.count * 3);
  const color = new T.Color();
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i),
      y = points.getY(i),
      z = points.getZ(i);
    const broad = relief(x * 1.55, y * 1.55, z * 1.55);
    const grain = relief(x * 12 + 3, y * 12, z * 12);
    const speckle = relief(x * 24 + 7, y * 24, z * 24);
    const radius = 1 + 0.12 * broad + 0.038 * grain + 0.017 * speckle;
    points.setXYZ(
      i,
      center.x + radii.x * radius * (x + 0.12 * y * y),
      center.y + radii.y * radius * (y * (1 - 0.17 * x) + 0.78 * x * x - 0.22),
      center.z + radii.z * radius * z,
    );
    color
      .copy(nucleolusDark)
      .lerp(
        nucleolusLight,
        0.48 + 0.26 * grain + 0.19 * speckle + 0.07 * broad,
      );
    color.toArray(colors, i * 3);
  }
  geometry.computeVertexNormals();
  geometry.setAttribute("color", new T.BufferAttribute(colors, 3));
  return addColoredMesh(group, geometry, id, "nucleolar-profile");
}

// Tsujita et al. describe macronuclear chromatin bodies linked by fine
// material in P. caudatum sections. Only nearby bodies receive short links;
// these are local fragments, with no assigned chromosome connectivity.
function somaticField(group, id, underEnvelope) {
  const radii = underEnvelope ? V(1.43, 0.55, 0.21) : V(1.6, 0.88, 0.62);
  const center = underEnvelope ? V(0, -0.38, -0.42) : V(0, 0, 0);
  const bodyRadii = underEnvelope ? V(0.31, 0.2, 0.15) : V(0.41, 0.29, 0.25);
  const bodyCenter = underEnvelope
    ? V(-0.59, -0.63, -0.49)
    : V(-0.55, -0.08, 0.27);
  const parts = [],
    centers = [];
  const count = underEnvelope ? 54 : 176;
  const next = seeded(0x73ae59);
  const color = new T.Color(),
    point = V();
  const bodySpace = (p) =>
    ((p.x - bodyCenter.x) / bodyRadii.x) ** 2 +
    ((p.y - bodyCenter.y) / bodyRadii.y) ** 2 +
    ((p.z - bodyCenter.z) / bodyRadii.z) ** 2;
  for (
    let attempt = 0;
    centers.length < count && attempt < count * 80;
    attempt++
  ) {
    const p = V(next() * 2 - 1, next() * 2 - 1, next() * 2 - 1);
    if (p.lengthSq() > 1) continue;
    p.multiply(radii).add(center);
    const r = (underEnvelope ? 0.043 : 0.06) * (0.6 + next() * 0.85);
    if (
      bodySpace(p) < 2.08 ||
      centers.some(
        (other) => p.distanceToSquared(other.p) < ((r + other.r) * 0.89) ** 2,
      )
    )
      continue;
    centers.push({ p, r });
  }
  function pigment(geo, tint) {
    const vertices = geo.attributes.position,
      rgb = new Float32Array(vertices.count * 3);
    for (let i = 0; i < vertices.count; i++) {
      point.fromBufferAttribute(vertices, i);
      const grain = relief(point.x * 26, point.y * 26, point.z * 26);
      color
        .copy(chromatinDark)
        .lerp(chromatinLight, 0.44 + 0.22 * grain + tint)
        .toArray(rgb, 3 * i);
      if (underEnvelope)
        vertices.setZ(i, point.z + midplane(point.x, point.y, true));
    }
    geo.computeVertexNormals();
    geo.setAttribute("color", new T.BufferAttribute(rgb, 3));
    parts.push(geo);
  }
  for (const [i, { p, r }] of centers.entries()) {
    const geo = new T.SphereGeometry(1, 17, 12);
    const v = geo.attributes.position,
      sy = 0.72 + next() * 0.43,
      sz = 0.73 + next() * 0.39;
    const rotation = new T.Quaternion().setFromEuler(
      new T.Euler(next() * 3, next() * 3, next() * 3),
    );
    for (let j = 0; j < v.count; j++) {
      point.fromBufferAttribute(v, j);
      const reliefScale =
        1 +
        0.24 * relief(point.x * 1.6 + i, point.y * 1.6, point.z * 1.6) +
        0.06 * relief(point.x * 3.9, point.y * 3.9 + i, point.z * 3.9);
      point.y *= sy;
      point.z *= sz;
      point
        .multiplyScalar(r * reliefScale)
        .applyQuaternion(rotation)
        .add(p);
      v.setXYZ(j, point.x, point.y, point.z);
    }
    pigment(geo, (next() - 0.5) * 0.2);
    const neighbor = centers
      .slice(0, i)
      .filter(
        ({ p: q }) =>
          p.distanceToSquared(q) < (underEnvelope ? 0.31 : 0.42) ** 2,
      )
      .sort((a, b) => p.distanceToSquared(a.p) - p.distanceToSquared(b.p))[0];
    if (!neighbor || next() < 0.19) continue;
    const q = neighbor.p,
      bend = p
        .clone()
        .lerp(q, 0.47)
        .add(
          V((next() - 0.5) * 0.1, (next() - 0.5) * 0.12, (next() - 0.5) * 0.09),
        );
    if (bodySpace(bend) < 1.7) continue;
    const curve = new T.CatmullRomCurve3([p, bend, q]);
    pigment(
      new T.TubeGeometry(curve, 12, r * (0.13 + next() * 0.065), 6, false),
      0.1,
    );
  }
  const merged = mergeGeometries(parts);
  for (const geo of parts) geo.dispose();
  const chromatin = addColoredMesh(group, merged, id, "chromatin-field");
  if (underEnvelope) bodyCenter.z += midplane(bodyCenter.x, bodyCenter.y, true);
  const nucleolus = nucleolarBody(group, id, bodyCenter, bodyRadii);
  return { chromatin, nucleolus };
}

// A section through the compact micronuclear body shows the chromatin-poor
// space at one pole in the context of the nuclear boundary (Fokin 1997).
function polarBoundary(group, id) {
  const geo = new T.SphereGeometry(1, 96, 38, 0, TAU, Math.PI / 2, Math.PI / 2);
  geo.rotateX(Math.PI / 2);
  geo.scale(1.18, 1.02, 0.86);
  const wall = addMesh(group, geo, "#adacb5", id, {
    transparent: true,
    opacity: 0.27,
    depthWrite: false,
    roughness: 0.79,
    clearcoat: 0,
  });
  wall.name = "micronuclear-boundary";
  return wall;
}

function germlineField(group, id, underEnvelope) {
  const radii = underEnvelope ? V(1.15, 0.57, 0.24) : V(1.12, 0.99, 0.85);
  const center = underEnvelope ? V(0, -0.35, -0.42) : V(0, 0, 0);
  const n = underEnvelope ? 42 : 74;
  const maxTriangles = underEnvelope ? 43000 : 220000;
  const placeholder = new T.MeshBasicMaterial();
  const mc = new MarchingCubes(n, placeholder, false, false, maxTriangles);
  const half = radii.clone().multiplyScalar(1.13);
  mc.field.fill(-2);
  for (let k = 1; k < n - 1; k++) {
    const z = ((k * 2) / n - 1) * half.z;
    for (let j = 1; j < n - 1; j++) {
      const y = ((j * 2) / n - 1) * half.y;
      for (let i = 1; i < n - 1; i++) {
        const x = ((i * 2) / n - 1) * half.x;
        const distance =
          (x / radii.x) ** 2 + (y / radii.y) ** 2 + (z / radii.z) ** 2;
        if (distance >= 1.06) continue;
        const px = x + center.x,
          py = y + center.y,
          pz = z + center.z;
        const f = underEnvelope ? 4.25 : 5.6;
        const coarse = relief(px * f, py * f, pz * f + 7);
        const fine = relief(px * f * 2.1 + 6, py * f * 2.1, pz * f * 2.1);
        const grain = relief(px * f * 3.7, py * f * 3.7 + 5, pz * f * 3.7);
        let density = coarse + 0.31 * fine + 0.14 * grain - 0.11;
        density -= Math.max(0, distance - 0.81) * 4;
        if (!underEnvelope) {
          const edge = 0.77 - x - 0.12 * y + 0.035 * relief(y * 5, z * 5, 2);
          density = Math.min(density, edge * 12);
        }
        mc.field[i + n * (j + n * k)] = density;
      }
    }
  }
  mc.isolation = 0;
  mc.update();
  if (mc.count >= maxTriangles * 3)
    throw new Error("Chromatin field exceeded its mesh capacity");
  const geo = new T.BufferGeometry();
  for (const key of ["position", "normal"]) {
    const attr = mc.geometry.attributes[key];
    geo.setAttribute(
      key,
      new T.BufferAttribute(attr.array.slice(0, mc.count * 3), 3),
    );
  }
  geo.setAttribute(
    "uv",
    new T.BufferAttribute(new Float32Array(mc.count * 2), 2),
  );
  mc.geometry.dispose();
  placeholder.dispose();
  exactIndexGeometry(geo);
  geo.scale(half.x, half.y, half.z);
  geo.translate(center.x, center.y, center.z);
  const points = geo.attributes.position,
    normals = geo.attributes.normal;
  const colors = new Float32Array(points.count * 3),
    color = new T.Color();
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i),
      y = points.getY(i),
      z = points.getZ(i);
    const value =
      0.47 +
      0.28 * relief(x * 6, y * 6, z * 6) +
      0.15 * relief(x * 17, y * 17, z * 17);
    color
      .copy(chromatinDark)
      .lerp(chromatinLight, value)
      .toArray(colors, i * 3);
    if (underEnvelope) {
      points.setZ(i, z + midplane(x, y, false));
      const slope =
        -2 * curvature(false) * Math.max(0, 1 - 0.32 / (Math.hypot(x, y) || 1));
      const nx = normals.getX(i),
        ny = normals.getY(i),
        nz = normals.getZ(i);
      const normal = V(
        nx - nz * x * slope,
        ny - nz * y * slope,
        nz,
      ).normalize();
      normals.setXYZ(i, normal.x, normal.y, normal.z);
    }
  }
  geo.setAttribute("color", new T.BufferAttribute(colors, 3));
  const chromatin = addColoredMesh(group, geo, id, "chromatin-field");
  if (!underEnvelope) polarBoundary(group, id);
  return { chromatin };
}
function envelope(group, id, macro) {
  const w = macro ? 1.66 : 1.32,
    h = 0.98;
  const pore = 0.31,
    gap = 0.107,
    thickness = 0.014,
    segments = 80;
  const rows = [],
    points = [],
    colors = [],
    indices = [];
  // Separate staggered section edges expose the two membranes and a window
  // onto the nucleoplasm. They are observation cuts, not natural membrane ends.
  const radiusAt = (a, inner) => {
    const x = Math.cos(a),
      y = Math.sin(a);
    const ellipse =
      1 / (Math.abs(x / w) ** 3.1 + Math.abs(y / h) ** 3.1) ** (1 / 3.1);
    const cut = inner ? 0.65 : 0.43;
    const front = y < -0.025 ? cut / (-y + 0.11 * x) : Infinity;
    return front > 0 ? Math.min(ellipse, front) : ellipse;
  };
  // A closed profile runs along both faces of each membrane and around
  // the curved pore lip. Its sampled rings share vertices across the fold.
  function sheet(from, to, level, color, includeFirst = false) {
    for (let j = includeFirst ? 0 : 1; j <= 10; j++) {
      const extent = T.MathUtils.lerp(from, to, j / 10);
      rows.push({ extent, radius: pore, z: level, color });
    }
  }
  function fold(radius, reverse) {
    for (let j = 1; j <= 16; j++) {
      const a = Math.PI * (reverse ? 1 - j / 16 : j / 16);
      const color = envelopeOuter
        .clone()
        .lerp(envelopeInner, (1 - Math.cos(a)) / 2);
      rows.push({
        extent: 0,
        radius: pore - radius * Math.sin(a),
        z: radius * Math.cos(a),
        color,
      });
    }
  }
  sheet(1, 0, gap + thickness, envelopeOuter, true);
  fold(gap + thickness, false);
  sheet(0, 1, -gap - thickness, envelopeInner);
  rows.push({ extent: 1, radius: pore, z: -gap + thickness, color: cutFace });
  sheet(1, 0, -gap + thickness, envelopeInner);
  fold(gap - thickness, true);
  sheet(0, 1, gap - thickness, envelopeOuter);
  for (const row of rows) {
    for (let i = 0; i < segments; i++) {
      const a = (TAU * i) / segments;
      const r = T.MathUtils.lerp(
        row.radius,
        radiusAt(a, row.z < 0),
        row.extent,
      );
      const x = r * Math.cos(a),
        y = r * Math.sin(a);
      points.push(x, y, midplane(x, y, macro) + row.z);
      colors.push(row.color.r, row.color.g, row.color.b);
    }
  }
  for (let j = 0; j < rows.length; j++) {
    const nextRow = (j + 1) % rows.length;
    for (let i = 0; i < segments; i++) {
      const next = (i + 1) % segments;
      const a = j * segments + i,
        b = j * segments + next;
      const c = nextRow * segments + i,
        d = nextRow * segments + next;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(points, 3));
  geo.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  addColoredMesh(group, geo, id, "continuous-envelope");
  const atEdge = (a, z) => {
    const r = radiusAt(a, z < 0),
      x = r * Math.cos(a),
      y = r * Math.sin(a);
    return [x, y, midplane(x, y, macro) + z];
  };
  return [
    {
      zh: "外核膜",
      en: "Outer nuclear membrane",
      position: [-0.78, 0.24, midplane(-0.78, 0.24, macro) + gap + thickness],
    },
    {
      zh: "内核膜",
      en: "Inner nuclear membrane",
      position: atEdge(-0.92, -gap),
    },
    { zh: "核周隙", en: "Perinuclear space", position: atEdge(-2.35, 0) },
    {
      zh: "核孔处的膜连续",
      en: "Membrane fold at a pore",
      position: [0, 0.31 - gap - thickness, 0],
    },
  ];
}

// Triangle interiors are stable ray targets even at coincident UV seams.
function frontAnchor(mesh, near, direction) {
  const { position } = mesh.geometry.attributes,
    index = mesh.geometry.index;
  const best = V(),
    point = V(),
    b = V(),
    c = V(),
    relative = V();
  let bestScore = -Infinity;
  for (let i = 0; i < index.count; i += 3) {
    point.fromBufferAttribute(position, index.getX(i));
    b.fromBufferAttribute(position, index.getX(i + 1));
    c.fromBufferAttribute(position, index.getX(i + 2));
    point
      .add(b)
      .add(c)
      .multiplyScalar(1 / 3);
    relative.copy(point).sub(near);
    const depth = relative.dot(direction);
    const radial = Math.max(0, relative.lengthSq() - depth * depth);
    const score = depth - 30 * radial;
    if (score > bestScore) {
      bestScore = score;
      best.copy(point);
    }
  }
  return best.toArray();
}

export function parameciumNuclearField(id) {
  const group = new T.Group();
  const macro = id.startsWith("paraMacro"),
    membrane = id.endsWith("Envelope");
  if (membrane) group.rotation.set(-0.95, 0.12, -0.13);
  const { chromatin, nucleolus } = macro
    ? somaticField(group, id, membrane)
    : germlineField(group, id, membrane);
  const direction = V(...specimenDirection(id))
    .normalize()
    .applyQuaternion(group.quaternion.clone().invert());
  const marks = membrane ? envelope(group, id, macro) : [];
  if (macro) {
    if (!membrane)
      marks.push({
        zh: "染色质小体",
        en: "Chromatin body",
        position: frontAnchor(chromatin, V(0.69, 0.18, 0), direction),
      });
    marks.push({
      zh: "核仁",
      en: "Nucleolus",
      position: frontAnchor(
        nucleolus,
        membrane ? V(-0.59, -0.7, -0.5) : V(-0.55, -0.08, 0.27),
        direction,
      ),
    });
  } else {
    marks.push({
      zh: "分散的生殖系染色质",
      en: "Distributed germline chromatin",
      position: frontAnchor(
        chromatin,
        membrane ? V(0.22, -0.78, -0.45) : V(-0.43, 0.3, 0),
        direction,
      ),
    });
    if (!membrane)
      marks.push({
        zh: "无染色质的极帽",
        en: "Chromatin-free polar cap",
        position: [
          0.99,
          0.13,
          -0.86 * Math.sqrt(1 - (0.99 / 1.18) ** 2 - (0.13 / 1.02) ** 2),
        ],
      });
  }
  group.userData.landmarks = marks;
  return group;
}
