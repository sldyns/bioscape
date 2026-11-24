import * as THREE from "three";

const FAMILIES = ["H2A", "H2B", "H3", "H4"];
const PALETTE = {
  H2A: "#947b9b",
  H2B: "#b58e87",
  H3: "#698298",
  H4: "#ae9f7d",
  I: "#415e73",
  J: "#64898e",
  base: "#a89983",
};
const UNIT = 0.036; // Model units per ångström. The presentation frames either model independently.
const TAU = 2 * Math.PI;
const V = () => new THREE.Vector3();
const lerp = THREE.MathUtils.lerp;

// Bins directly produce indexed, worker-transferable geometry. The scene has one
// material per histone family and strand, including separate modes when needed.
class Surface {
  vertices = [];
  normals = [];
  indices = [];

  vertex(p, n) {
    const index = this.vertices.length / 3;
    this.vertices.push(p.x * UNIT, p.y * UNIT, p.z * UNIT);
    this.normals.push(n.x, n.y, n.z);
    return index;
  }

  strip(a, b) {
    for (let i = 0; i < a.length; i++) {
      const j = (i + 1) % a.length;
      this.indices.push(a[i], a[j], b[i], a[j], b[j], b[i]);
    }
  }

  disk(points, normal, reversed) {
    const center = points
      .reduce((sum, p) => sum.add(p), V())
      .multiplyScalar(1 / points.length);
    const pole = this.vertex(center, normal);
    const ring = points.map((p) => this.vertex(p, normal));
    for (let i = 0; i < ring.length; i++) {
      const j = (i + 1) % ring.length;
      this.indices.push(pole, ring[reversed ? j : i], ring[reversed ? i : j]);
    }
  }

  finish() {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(this.vertices, 3),
    );
    geo.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(this.normals, 3),
    );
    geo.setIndex(this.indices);
    return geo;
  }
}

function decode(flat, scale) {
  const points = [];
  for (let i = 0; i < flat.length; i += 3)
    points.push(
      new THREE.Vector3(flat[i], flat[i + 1], flat[i + 2]).multiplyScalar(
        1 / scale,
      ),
    );
  return points;
}

// A natural cubic spline has continuous curvature at residue boundaries.
// Use the deposited points as knots and the exact analytic tangent for normals.
function smoothTrace(points) {
  const last = points.length - 1;
  const second = points.map(() => V());
  const upper = new Float32Array(points.length);
  for (let i = 1; i < last; i++) {
    const diagonal = 4 - upper[i - 1];
    upper[i] = 1 / diagonal;
    second[i]
      .copy(points[i - 1])
      .add(points[i + 1])
      .addScaledVector(points[i], -2)
      .multiplyScalar(6)
      .sub(second[i - 1])
      .divideScalar(diagonal);
  }
  for (let i = last - 1; i > 0; i--)
    second[i].addScaledVector(second[i + 1], -upper[i]);
  function evaluate(t, tangent) {
    const index = Math.min(Math.floor(t * last), last - 1);
    const b = t * last - index,
      a = 1 - b;
    if (tangent)
      return points[index + 1]
        .clone()
        .sub(points[index])
        .addScaledVector(second[index], (1 - 3 * a * a) / 6)
        .addScaledVector(second[index + 1], (3 * b * b - 1) / 6)
        .normalize();
    return points[index]
      .clone()
      .lerp(points[index + 1], b)
      .addScaledVector(second[index], (a * a * a - a) / 6)
      .addScaledVector(second[index + 1], (b * b * b - b) / 6);
  }
  return {
    getPoint: (t) => evaluate(t, false),
    getTangent: (t) => evaluate(t, true),
  };
}

function softened(points, weight) {
  return points.map((p, i) =>
    i > 0 && i < points.length - 1
      ? p
          .clone()
          .multiplyScalar(1 - 2 * weight)
          .addScaledVector(points[i - 1], weight)
          .addScaledVector(points[i + 1], weight)
      : p.clone(),
  );
}

function perpendicular(tangent, guide) {
  const v = guide.clone().addScaledVector(tangent, -guide.dot(tangent));
  if (v.lengthSq() < 1e-8) {
    v.set(
      Math.abs(tangent.x) > 0.8 ? 0 : 1,
      Math.abs(tangent.x) > 0.8 ? 1 : 0,
      0,
    );
    v.addScaledVector(tangent, -v.dot(tangent));
  }
  return v.normalize();
}

function section(center, tangent, wide, width, thickness, sides) {
  const thin = V().crossVectors(tangent, wide).normalize();
  const points = [],
    normals = [];
  for (let j = 0; j < sides; j++) {
    const angle = (TAU * j) / sides,
      c = Math.cos(angle),
      s = Math.sin(angle);
    points.push(
      center
        .clone()
        .addScaledVector(wide, c * width)
        .addScaledVector(thin, s * thickness),
    );
    normals.push(
      wide
        .clone()
        .multiplyScalar(c / width)
        .addScaledVector(thin, s / thickness)
        .normalize(),
    );
  }
  return { points, normals, tangent };
}

function ringVertices(surface, ring) {
  return ring.points.map((p, i) => surface.vertex(p, ring.normals[i]));
}

// Successive ring pairs may go in different visibility bins. Keep the very
// same positions and normals at a cut seam in the assembled conformation.
function loft(curve, segments, sides, profile, bucket, cutLids) {
  let previous, previousIndices, previousSurface;
  let wide = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const tangent = curve.getTangent(t).normalize();
    const { guide, width, depth } = profile(t);
    wide = perpendicular(tangent, wide);
    if (guide) {
      const target = perpendicular(tangent, guide);
      if (target.dot(wide) < 0) target.negate();
      wide.copy(target);
    }
    const ring = section(curve.getPoint(t), tangent, wide, width, depth, sides);
    if (previous) {
      const surface = bucket((i - 0.5) / segments);
      if (surface !== previousSurface) {
        previousIndices = ringVertices(surface, previous);
        if (!previousSurface)
          surface.disk(
            previous.points,
            previous.tangent.clone().negate(),
            true,
          );
        else if (cutLids) {
          const removedStarts = surface === cutLids.removed;
          cutLids.surface.disk(
            previous.points,
            previous.tangent.clone().multiplyScalar(removedStarts ? 1 : -1),
            !removedStarts,
          );
        }
      }
      const indices = ringVertices(surface, ring);
      surface.strip(previousIndices, indices);
      previousIndices = indices;
      previousSurface = surface;
      if (i === segments) surface.disk(ring.points, tangent, false);
    }
    previous = ring;
  }
}

function line(surface, from, to, radius) {
  if (from.distanceToSquared(to) < 1e-10) return;
  loft(
    new THREE.LineCurve3(from, to),
    1,
    7,
    () => ({ width: radius, depth: radius }),
    () => surface,
  );
}

function localAxis(points, i, first, last) {
  // Averaging paired tracks roughly one helical turn apart suppresses the
  // corkscrew displacement and retains the bending of the helix axis.
  const span = Math.min(4, last - first);
  const axis = V();
  const start = Math.max(first, Math.min(i - 3, last - span));
  const end = Math.min(last - span, start + 3);
  for (let a = start; a <= end; a++) axis.add(points[a + span]).sub(points[a]);
  return axis.normalize();
}

function proteinRun(surface, chain, scale) {
  const points = decode(chain.ca, scale);
  const profiles = points.map(() => ({
    width: 0.81,
    depth: 0.81,
    guide: null,
  }));
  for (const [kind, from, to] of chain.secondary) {
    const first = Math.max(0, from - chain.start);
    const last = Math.min(points.length - 1, to - chain.start);
    if (last <= first) continue;
    for (let i = first; i <= last; i++) {
      if (kind === "strand") {
        const a = points[Math.max(0, i - 1)],
          b = points[Math.min(points.length - 1, i + 1)];
        const guide = points[i].clone().sub(a.clone().lerp(b, 0.5));
        profiles[i] = {
          width: i === last ? 0.91 : 1.65,
          depth: 0.45,
          guide: guide.lengthSq() > 1e-5 ? guide.normalize() : null,
        };
      } else {
        profiles[i] = {
          width: kind === "alpha" ? 2.03 : 1.56,
          depth: 0.51,
          guide: localAxis(points, i, first, last),
        };
      }
    }
  }
  // A small, symmetric Cα smoothing kernel keeps the axes and pitch while
  // rounding the polygonal corners of the deposited residue trace.
  const curve = smoothTrace(softened(points, 0.055));
  const profile = (t) => {
    const at = t * (points.length - 1),
      i = Math.min(Math.floor(at), points.length - 2);
    const a = profiles[i],
      b = profiles[i + 1],
      f = at - i;
    const guide =
      a.guide && b.guide
        ? a.guide
            .clone()
            .lerp(
              b.guide.clone().multiplyScalar(a.guide.dot(b.guide) < 0 ? -1 : 1),
              f,
            )
        : a.guide || b.guide;
    return {
      guide,
      width: lerp(a.width, b.width, f),
      depth: lerp(a.depth, b.depth, f),
    };
  };
  loft(curve, (points.length - 1) * 6, 10, profile, () => surface);
}

function plaque(surface, points, spread, depth) {
  const center = points
    .reduce((sum, p) => sum.add(p), V())
    .multiplyScalar(1 / points.length);
  const directions = points.map((p) => p.clone().sub(center));
  const normal = V();
  for (let i = 0; i < points.length; i++)
    normal.add(
      V().crossVectors(directions[i], directions[(i + 1) % directions.length]),
    );
  normal.normalize();
  const radial = directions.map((d) => perpendicular(normal, d));
  let previous;
  for (const [edge, height] of [
    [0, -1],
    [1, -0.45],
    [1, 0.45],
    [0, 1],
  ]) {
    const row = points.map((p, i) =>
      p
        .clone()
        .addScaledVector(radial[i], spread * edge)
        .addScaledVector(normal, depth * height),
    );
    const ring = row.map((p, i) =>
      surface.vertex(
        p,
        radial[i]
          .clone()
          .multiplyScalar(edge ? 1 : 0.35)
          .addScaledVector(normal, height)
          .normalize(),
      ),
    );
    if (previous) surface.strip(previous, ring);
    if (!edge)
      surface.disk(row, normal.clone().multiplyScalar(height), height < 0);
    previous = ring;
  }
}

function dnaStrand(bins, strand, index, data) {
  const { coordinateScale: scale, window } = data;
  const last = strand.rings.length - 1;
  const [firstCut, lastCut] = index
    ? [last - window[1], last - window[0]]
    : window;
  const inWindow = (n) => n >= firstCut && n <= lastCut;
  const spine = bins(strand.chain, "dna");
  const removed = bins(strand.chain, "dna", "cap");
  const path = decode(strand.path, scale);
  const count = path.length - 1;
  loft(
    smoothTrace(softened(path, 0.22)),
    count * 4,
    10,
    (t) => {
      const p = t * count;
      const radius = 0.95 + 0.18 * Math.max(0, Math.cos(Math.PI * p)) ** 3;
      return { width: radius, depth: radius };
    },
    (t) => (inWindow(Math.floor((t * count) / 2)) ? removed : spine),
    { removed, surface: bins(strand.chain, "dna", "cutOnly") },
  );
  const sugars = decode(strand.sugars, scale);
  for (let i = 0; i <= last; i++) {
    const mode = inWindow(i) ? "cap" : "";
    const backbone = mode ? removed : spine;
    const sugar = sugars.slice(i * 5, i * 5 + 5);
    const base = decode(strand.rings[i], scale);
    plaque(backbone, sugar, 0.35, 0.42);
    line(backbone, sugar[2], base[0], 0.46);
    plaque(bins("base", "dna", mode), base, 0.46, 0.46);
  }
}

// Local model-space points on visible triangles, sampled from this exact mesh.
// Tests project and pick these points against both whole and cutaway modes.
const PART_TARGETS = {
  histones: [
    [0.06152779, -0.02974239, 0.72809608],
    [0.81934968, 0.22396031, -0.09540384],
    [0.00213923, -0.42715069, 1.06222365],
  ],
  dna: [
    [1.3166743, 0.19100358, -0.04125359],
    [-0.30159493, 1.03530471, -0.44676325],
    [-0.48856882, -1.27269057, 0.37945556],
  ],
};
const FAMILY_ANCHORS = {
  H2A: [-0.01088584, -0.60742404, -0.16230636],
  H2B: [-0.36792317, 0.21023251, -0.4545083],
  H3: [0.21397933, 0.2534519, -0.9916487],
  H4: [0.61405407, -0.45891766, 0.92225071],
};

export function nucleosomeReference(id, data) {
  if (id !== "nucleosome" && id !== "histones") return null;
  const group = new THREE.Group();
  const surfaces = new Map();
  const bin = (color, hit, mode = "") => {
    const key = color + "/" + mode;
    if (!surfaces.has(key))
      surfaces.set(key, { color, hit, mode, surface: new Surface() });
    return surfaces.get(key).surface;
  };
  for (const chain of data.histones) {
    const mode =
      id === "histones" && data.frontDimer.includes(chain.chain) ? "cap" : "";
    const surface = bin(chain.family, "histones", mode);
    proteinRun(surface, chain, data.coordinateScale);
  }
  if (id === "nucleosome") {
    data.dna.forEach((strand, i) => dnaStrand(bin, strand, i, data));
    const endpoints = decode(data.contacts, data.coordinateScale);
    for (let i = 0; i < endpoints.length; i += 2) {
      const a = endpoints[i],
        b = endpoints[i + 1];
      // A single measured N1–N3 distance per pair. Explicitly skip weak or
      // excessively long candidates rather than implying a continuous bond.
      if (a.distanceTo(b) > 3.5) continue;
      const n = i / 2;
      const s = bin(
        "base",
        "dna",
        n >= data.window[0] && n <= data.window[1] ? "cap" : "",
      );
      for (const [start, end] of [
        [0.19, 0.4],
        [0.6, 0.81],
      ])
        line(s, a.clone().lerp(b, start), a.clone().lerp(b, end), 0.21);
    }
    group.annotationTargets = structuredClone(PART_TARGETS);
    group.userData.partAnchors = Object.fromEntries(
      Object.entries(PART_TARGETS).map(([k, targets]) => [k, [...targets[0]]]),
    );
  } else {
    group.userData.landmarks = FAMILIES.flatMap((family) => {
      const mark = (copies, visibleModes) => ({
        zh: family + " × " + copies,
        en: family + " × " + copies,
        position: [...FAMILY_ANCHORS[family]],
        ...(visibleModes ? { visibleModes } : {}),
      });
      return family === "H2A" || family === "H2B"
        ? [mark(2, ["whole"]), mark(1, ["section", "explode"])]
        : [mark(2)];
    });
  }
  const materials = new Map();
  for (const { color, hit, mode, surface } of surfaces.values()) {
    if (!materials.has(color))
      materials.set(
        color,
        new THREE.MeshStandardMaterial({
          color: PALETTE[color],
          roughness: color === "base" ? 0.68 : 0.54,
          metalness: 0,
        }),
      );
    const m = new THREE.Mesh(surface.finish(), materials.get(color));
    m.name = "1KX5 " + color + (mode ? " " + mode : "");
    m.userData.hitId = hit;
    if (mode) m.userData[mode] = true;
    group.add(m);
  }
  return group;
}
