import * as T from "three";
import {
  V,
  TAU,
  ball,
  tube,
  ring,
  addMesh,
  hollowTube,
} from "./microbeGeometry";
import { place } from "./specimenGeometry";
import { splitSection } from "./implicitMembrane";
// Straight protein links need no curve samples; keep a smooth radial silhouette.
function strut(g, a, b, radius, color, id) {
  const start = Array.isArray(a) ? V(...a) : a,
    end = Array.isArray(b) ? V(...b) : b,
    direction = end.clone().sub(start);
  const m = addMesh(
    g,
    new T.CylinderGeometry(radius, radius, direction.length(), 24),
    color,
    id,
  );
  m.position.copy(start).lerp(end, 0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), direction.normalize());
  return m;
}
function sectionContour(geometry, z) {
  const position = geometry.attributes.position,
    points = new Map();
  for (let i = 0; i < position.count; i += 3)
    for (let j = 0; j < 3; j++) {
      const a = V().fromBufferAttribute(position, i + j),
        b = V().fromBufferAttribute(position, i + ((j + 1) % 3));
      if (a.z < z === b.z < z) continue;
      const p = a.lerp(b, (z - a.z) / (b.z - a.z));
      points.set(
        `${p.x.toFixed(6)},${p.y.toFixed(6)}`,
        new T.Vector2(p.x, p.y),
      );
    }
  return [...points.values()].sort(
    (a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x),
  );
}
function head(id = "phageHead") {
  const g = new T.Group(),
    geo = new T.IcosahedronGeometry(0.9, 1);
  geo.scale(1, 1.38, 1);
  const inner = geo.clone().scale(0.95, 0.95, 0.95),
    outline = sectionContour(geo, 0.3),
    lumen = sectionContour(inner, 0.3),
    shape = new T.Shape(outline);
  shape.holes.push(new T.Path(lumen.reverse()));
  const rim = addMesh(g, new T.ShapeGeometry(shape), "#839bb6", id);
  rim.position.z = 0.3;
  rim.userData.cutOnly = true;
  // Keep the original facets for projecting the surface subunits before splitting.
  const facets = geo.attributes.position.array.slice();
  for (const [surface, color] of [
    [geo, "#a4b4c7"],
    [inner, "#8e9fb4"],
  ]) {
    // A basal portal must connect the capsid cavity to the hollow tail.
    // Only the basal pole is opened; the opposite vertex remains closed.
    const [removed, perforated] = splitSection(surface, (p) =>
      Math.max(Math.hypot(p[0], p[2]) - 0.13, p[1] + 0.9),
    );
    removed.dispose();
    const [back, front] = splitSection(perforated, (p) => p[2] - 0.3);
    addMesh(g, back, color, id, { roughness: 0.52 });
    addMesh(g, front, color, id, {
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
    }).userData.cap = true;
  }
  const collar = hollowTube(g, id, 0.155, 0.25, "#a7afa9", 0.105);
  collar.position.y = -1.185;
  const lattice = new T.IcosahedronGeometry(0.92, 4),
    pos = lattice.attributes.position,
    seen = new Set(),
    ray = new T.Ray(),
    a = V(),
    b = V(),
    c = V(),
    hit = V();
  for (let i = 0; i < pos.count; i++) {
    const direction = V(
        pos.getX(i),
        pos.getY(i) * 1.38,
        pos.getZ(i),
      ).normalize(),
      key = direction
        .toArray()
        .map((x) => x.toFixed(4))
        .join();
    if (seen.has(key)) continue;
    seen.add(key);
    ray.set(V(), direction);
    for (let j = 0; j < facets.length; j += 9) {
      a.fromArray(facets, j);
      b.fromArray(facets, j + 3);
      c.fromArray(facets, j + 6);
      if (!ray.intersectTriangle(a, b, c, false, hit)) continue;
      const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize(),
        p = hit.clone().addScaledVector(normal, 0.009);
      if (p.y < -0.9 && Math.hypot(p.x, p.z) < 0.17) break;
      const m = ball(
        g,
        p.toArray(),
        [0.029, 0.029, 0.015],
        i % 3 ? "#b6c3d1" : "#93a5ba",
        id,
      );
      m.quaternion.setFromUnitVectors(V(0, 0, 1), normal);
      if (p.z > 0.3) m.userData.cap = true;
      break;
    }
  }
  lattice.dispose();
  const seamSurface = new T.IcosahedronGeometry(0.907, 1),
    edges = new T.EdgesGeometry(seamSurface, 8),
    ep = edges.attributes.position;
  seamSurface.dispose();
  for (let i = 0; i < ep.count; i += 2) {
    const a = V(ep.getX(i), ep.getY(i) * 1.38, ep.getZ(i)),
      b = V(ep.getX(i + 1), ep.getY(i + 1) * 1.38, ep.getZ(i + 1));
    const da = Math.max(Math.hypot(a.x, a.z) - 0.145, a.y + 0.9),
      db = Math.max(Math.hypot(b.x, b.z) - 0.145, b.y + 0.9);
    if (da < 0 && db < 0) continue;
    if (da < 0) a.lerp(b, da / (da - db));
    else if (db < 0) b.lerp(a, db / (db - da));
    // Split crossing seams exactly at the removable cutaway plane.
    const segments =
      a.z > 0.3 !== b.z > 0.3
        ? [
            [a, a.clone().lerp(b, (0.3 - a.z) / (b.z - a.z))],
            [a.clone().lerp(b, (0.3 - a.z) / (b.z - a.z)), b],
          ]
        : [[a, b]];
    for (const [start, end] of segments) {
      const m = strut(g, start, end, 0.008, "#91a4b9", id);
      if ((start.z + end.z) / 2 > 0.3) m.userData.cap = true;
    }
  }
  edges.dispose();
  g.userData.landmarks = [
    {
      zh: "人为剖切窗口",
      en: "Illustrative cutaway window",
      position: [0.6, 0.3, 0.3],
    },
  ];
  return g;
}
function genome() {
  const g = new T.Group(),
    paths = [[], []];
  for (let i = 0; i <= 500; i++) {
    const t = i / 500,
      angle = t * TAU * 12,
      r = 0.3 + 0.35 * Math.sin(Math.PI * t),
      y = -0.92 + 1.84 * t;
    const center = V(r * Math.cos(angle), y, r * Math.sin(angle));
    for (let s = 0; s < 2; s++) {
      const q = t * TAU * 95 + s * Math.PI;
      paths[s].push(
        center
          .clone()
          .add(
            V(
              0.028 * Math.cos(q) * Math.cos(angle),
              0.028 * Math.sin(q),
              0.028 * Math.cos(q) * Math.sin(angle),
            ),
          ),
      );
    }
    if (i % 5 === 0)
      strut(
        g,
        paths[0].at(-1),
        paths[1].at(-1),
        0.006,
        "#c9baa2",
        "phageGenome",
      );
  }
  paths.forEach((p, i) =>
    tube(g, p, 0.01, i ? "#c5ad8b" : "#b6a092", "phageGenome"),
  );
  g.userData.landmarks = [
    {
      zh: "线性DNA的一个末端",
      en: "One end of linear DNA",
      position: paths[0][0].toArray(),
    },
    {
      zh: "包装路径仅为示意",
      en: "Packing path is schematic",
      position: [0.65, 0, 0],
    },
  ];
  return g;
}
// Low-amplitude, deterministic domain relief stays inside the original bounds.
function proteinBody(g, p, scale, color, id) {
  const geo = new T.SphereGeometry(1, 32, 24),
    position = geo.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i),
      y = position.getY(i),
      z = position.getZ(i),
      fold =
        0.92 +
        0.04 * Math.sin(3.8 * x + 2.1 * z) * Math.cos(4.2 * y - 1.3 * x) +
        0.03 * Math.cos(5.1 * z + 2.7 * y);
    position.setXYZ(i, x * fold, y * fold, z * fold);
  }
  geo.computeVertexNormals();
  const mesh = addMesh(g, geo, color, id, { roughness: 0.56, clearcoat: 0.12 });
  mesh.position.set(...p);
  mesh.scale.set(...scale);
  return mesh;
}
function sheath(id = "phageSheath") {
  const g = new T.Group();
  for (let j = 0; j < 23; j++)
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * TAU + j * 0.23,
        p = [0.205 * Math.cos(a), -0.96 + j * 0.087, 0.205 * Math.sin(a)];
      const m = proteinBody(
        g,
        p,
        [0.105, 0.057, 0.07],
        j % 2 ? "#91aba8" : "#a8bfba",
        id,
      );
      m.rotation.y = -a;
      if (p[2] > 0.025) m.userData.cap = true;
    }
  for (const y of [-1.03, 1.03]) {
    const geo = new T.TorusGeometry(0.21, 0.035, 12, 72);
    geo.rotateX(Math.PI / 2);
    geo.translate(0, y, 0);
    const [back, front] = splitSection(geo, (p) => p[2] - 0.025);
    addMesh(g, back, "#a8bdb8", id);
    addMesh(g, front, "#a8bdb8", id).userData.cap = true;
  }
  return g;
}
function tailTube() {
  const g = new T.Group();
  hollowTube(g, "phageTube", 0.105, 2.2, "#c9b78e", 0.067);
  return g;
}
function tail() {
  const g = sheath();
  g.add(tailTube());
  g.userData.partAnchors = {
    phageSheath: [0.21, 0.35, 0.1],
    phageTube: [0, -1.1, 0],
  };
  return g;
}
function plate() {
  const g = new T.Group();
  hollowTube(g, "phageBaseplate", 0.21, 0.21, "#a5aac0", 0.08);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    proteinBody(
      g,
      [0.3 * Math.cos(a), 0, 0.3 * Math.sin(a)],
      [0.2, 0.1, 0.13],
      "#adb0c5",
      "phageBaseplate",
    ).rotation.y = -a;
    tube(
      g,
      [
        [0.29 * Math.cos(a), -0.06, 0.29 * Math.sin(a)],
        [0.44 * Math.cos(a), -0.3, 0.44 * Math.sin(a)],
      ],
      0.038,
      "#adb0c5",
      "phageBaseplate",
    );
  }
  return g;
}
function fibers() {
  const g = new T.Group();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU;
    const points = [
      V(0.32 * Math.cos(a), 0, 0.32 * Math.sin(a)),
      V(0.75 * Math.cos(a), -0.18, 0.75 * Math.sin(a)),
      V(1.22 * Math.cos(a), -0.28, 1.22 * Math.sin(a)),
      V(1.49 * Math.cos(a), -1.02, 1.49 * Math.sin(a)),
    ];
    for (let j = 0; j < 3; j++)
      strut(
        g,
        points[j],
        points[j + 1],
        j === 2 ? 0.027 : 0.032,
        "#a4afc2",
        "phageFibers",
      );
    ball(
      g,
      points[0].toArray(),
      [0.065, 0.06, 0.065],
      "#929fb5",
      "phageFibers",
    );
    ball(
      g,
      points[2].toArray(),
      [0.045, 0.045, 0.045],
      "#949fb4",
      "phageFibers",
    );
    ball(
      g,
      points[3].toArray(),
      [0.055, 0.08, 0.055],
      "#b4a5bb",
      "phageFibers",
    );
  }
  return g;
}
// A connected, curved protein lattice: relief suggests folded domains without
// asserting T2 atomic coordinates, individual protein stoichiometry or pore size.
function capsomerRelief(cx, cy, phase) {
  const positions = [],
    indices = [],
    uv = [],
    segments = 60,
    rings = 10;
  function vertex(x, y, height, u, v) {
    positions.push(
      cx + x,
      cy + y,
      height - 0.14 * ((cx + x) ** 2 + (cy + y) ** 2),
    );
    uv.push(u, v);
  }
  vertex(0, 0, 0.021, 0.5, 0.5);
  for (let row = 1; row <= rings; row++) {
    const r = row / rings;
    for (let i = 0; i < segments; i++) {
      const a = (i / segments) * TAU,
        edge = 0.125 + 0.007 * Math.cos(a * 6),
        x = edge * r * Math.cos(a),
        y = edge * r * Math.sin(a),
        shoulder = Math.sin(Math.PI * r),
        relief =
          0.014 +
          0.036 * shoulder +
          0.009 * Math.cos(6 * a + r * 1.2) * shoulder +
          0.0025 * Math.sin(11 * a + phase + r * 4) * shoulder * shoulder;
      vertex(x, y, relief, 0.5 + x / 0.28, 0.5 + y / 0.28);
    }
  }
  for (let i = 0; i < segments; i++)
    indices.push(0, 1 + i, 1 + ((i + 1) % segments));
  for (let row = 0; row < rings - 1; row++)
    for (let i = 0; i < segments; i++) {
      const a = 1 + row * segments + i,
        b = 1 + row * segments + ((i + 1) % segments),
        c = a + segments,
        d = b + segments;
      indices.push(a, c, b, b, c, d);
    }
  const bottomCenter = positions.length / 3;
  vertex(0, 0, -0.024, 0.5, 0.5);
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * TAU,
      r = 0.125 + 0.007 * Math.cos(a * 6);
    vertex(
      r * Math.cos(a),
      r * Math.sin(a),
      -0.024,
      0.5 + Math.cos(a) / 2,
      0.5 + Math.sin(a) / 2,
    );
  }
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments,
      a = 1 + (rings - 1) * segments + i,
      b = 1 + (rings - 1) * segments + next,
      c = bottomCenter + 1 + i,
      d = bottomCenter + 1 + next;
    indices.push(a, c, b, b, c, d, bottomCenter, d, c);
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}
function capsomers() {
  const g = new T.Group(),
    sites = [];
  for (let j = 0; j < 6; j++)
    for (let k = 0; k < 7; k++) {
      const x = (k - 3) * 0.27 + (j % 2) * 0.135,
        y = (j - 2.5) * 0.235;
      sites.push(V(x, y, 0));
      addMesh(
        g,
        capsomerRelief(x, y, j * 0.5 + k * 0.3),
        ["#a8bacb", "#adbed0", "#a5b6c8"][(j + k) % 3],
        "phageCapsomers",
        { roughness: 0.57, clearcoat: 0.1 },
      );
    }
  for (let i = 0; i < sites.length; i++)
    for (let j = i + 1; j < sites.length; j++) {
      if (sites[i].distanceTo(sites[j]) > 0.274) continue;
      const a = sites[i].clone().lerp(sites[j], 0.39),
        b = sites[i].clone().lerp(sites[j], 0.61);
      for (const p of [a, b]) p.z = -0.14 * (p.x * p.x + p.y * p.y) + 0.006;
      strut(g, a, b, 0.019, "#93a8bd", "phageCapsomers");
    }
  return g;
}
function phage() {
  const g = new T.Group();
  place(g, head(), "phageHead", [0, 1.55, 0], 1);
  place(g, genome(), "phageGenome", [0, 1.55, 0], 0.95);
  place(g, tail(), "phageTail", [0, -0.75, 0], 1);
  place(g, plate(), "phageBaseplate", [0, -1.88, 0], 1);
  place(g, fibers(), "phageFibers", [0, -1.88, 0], 1);
  for (const y of [0.28, 0.36, 0.44]) {
    const m = ring(g, [0, y, 0], 0.16, 0.03, "#c1bba7", "phageTail");
    m.rotation.x = Math.PI / 2;
  }
  g.rotation.set(0.05, -0.15, 0.12);
  g.userData.partAnchors = {
    phageHead: [-0.72, 1.6, 0.1],
    phageGenome: [0.4, 1.6, 0.4],
    phageTail: [0.22, -0.6, 0.15],
    phageBaseplate: [0.4, -1.9, 0.1],
    phageFibers: [1.36, -2.5, 0.3],
  };
  return g;
}
export function phageDetail(id) {
  switch (id) {
    case "phage":
      return phage();
    case "phageHead": {
      const g = head("phageCapsomers");
      g.userData.partAnchors = { phageCapsomers: [0.5, 0.6, 0.2] };
      return g;
    }
    case "phageCapsomers":
      return capsomers();
    case "phageGenome":
      return genome();
    case "phageTail":
      return tail();
    case "phageSheath":
      return sheath();
    case "phageTube":
      return tailTube();
    case "phageBaseplate":
      return plate();
    case "phageFibers":
      return fibers();
    default:
      return null;
  }
}
