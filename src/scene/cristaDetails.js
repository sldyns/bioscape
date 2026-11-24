import * as THREE from "three";
import {
  TAU,
  V,
  mesh,
  ball,
  line,
  membranePiece,
  bilayerEdge,
} from "./mitochondrialGeometry.js";

// Repartition existing indexed triangles by their anatomical owner. Copy only
// referenced vertices, including their original normals, UVs and face colors.
export function assignCristaRegion(mesh, classify) {
  const source = mesh.geometry;
  const uv = source.attributes.uv,
    ids = source.index,
    bins = new Map();
  for (let i = 0; i < ids.count; i += 3) {
    const tri = [ids.getX(i), ids.getX(i + 1), ids.getX(i + 2)];
    const u = (uv.getX(tri[0]) + uv.getX(tri[1]) + uv.getX(tri[2])) / 3;
    const v = (uv.getY(tri[0]) + uv.getY(tri[1]) + uv.getY(tri[2])) / 3;
    const owner = classify(u, v);
    if (!bins.has(owner)) bins.set(owner, []);
    bins.get(owner).push(...tri);
  }
  if (bins.size === 1) {
    mesh.userData.hitId = bins.keys().next().value;
    return;
  }
  for (const [owner, faces] of bins) {
    const original = [...new Set(faces)];
    const remap = new Map(original.map((i, j) => [i, j]));
    const geometry = new THREE.BufferGeometry();
    for (const [key, attr] of Object.entries(source.attributes)) {
      const size = attr.itemSize,
        buffer = new attr.array.constructor(original.length * size);
      for (let j = 0; j < original.length; j++)
        for (let k = 0; k < size; k++)
          buffer[j * size + k] = attr.array[original[j] * size + k];
      geometry.setAttribute(
        key,
        new THREE.BufferAttribute(buffer, size, attr.normalized),
      );
    }
    geometry.setIndex(faces.map((i) => remap.get(i)));
    const part = new THREE.Mesh(geometry, mesh.material);
    part.name = mesh.name;
    part.userData = { ...mesh.userData, hitId: owner };
    mesh.parent.add(part);
  }
  mesh.removeFromParent();
  source.dispose();
}

const thickness = 0.016;
const matrixColor = "#c49975",
  lumenColor = "#a57d71";
function offset(frame, side) {
  return frame.center.clone().addScaledVector(frame.normal, side * thickness);
}
function edge(g, id, frame, steps, flags) {
  return bilayerEdge(
    g,
    (u, side) => offset(frame(u), side).toArray(),
    steps,
    id,
    flags,
  );
}

// A pair of offset surfaces with the same vertices and cell mask. Exposed
// edges around protein footprints join the two aqueous faces through the core.
function bilayerPanel(g, id, frameAt, nu, nv, flags, footprint = null) {
  const positions = [[], []],
    normals = [[], []],
    uv = [];
  let faces = [];
  const distance = [],
    intersections = new Map();
  let contact = [];
  const stride = nv + 1,
    vertexCount = (nu + 1) * stride;
  function vertex(u, v) {
    const index = uv.length / 2,
      f = frameAt(u, v);
    uv.push(u, v);
    for (let side = 0; side < 2; side++) {
      const sign = side ? 1 : -1;
      positions[side].push(...offset(f, sign).toArray());
      normals[side].push(
        sign * f.normal.x,
        sign * f.normal.y,
        sign * f.normal.z,
      );
    }
    if (footprint) distance.push(footprint(f.center));
    return index;
  }
  for (let i = 0; i <= nu; i++)
    for (let j = 0; j <= nv; j++) vertex(i / nu, j / nv);
  function crossing(a, b) {
    const key = Math.min(a, b) * vertexCount + Math.max(a, b);
    if (!intersections.has(key)) {
      const t = distance[a] / (distance[a] - distance[b]);
      intersections.set(
        key,
        vertex(
          THREE.MathUtils.lerp(uv[a * 2], uv[b * 2], t),
          THREE.MathUtils.lerp(uv[a * 2 + 1], uv[b * 2 + 1], t),
        ),
      );
    }
    return intersections.get(key);
  }
  function triangle(a, b, c) {
    if (
      !footprint ||
      (distance[a] >= 0 && distance[b] >= 0 && distance[c] >= 0)
    ) {
      faces.push(a, b, c);
      return;
    }
    const polygon = [],
      edge = [],
      source = [a, b, c];
    for (let k = 0; k < 3; k++) {
      const left = source[k],
        right = source[(k + 1) % 3],
        outside = distance[left] >= 0;
      if (outside) polygon.push(left);
      if (outside !== distance[right] >= 0) {
        const at = crossing(left, right);
        polygon.push(at);
        edge.push(at);
      }
    }
    for (let j = 1; j < polygon.length - 1; j++)
      faces.push(polygon[0], polygon[j], polygon[j + 1]);
    if (edge.length === 2) contact.push(edge);
  }
  for (let i = 0; i < nu; i++)
    for (let j = 0; j < nv; j++) {
      const a = i * stride + j,
        b = a + stride;
      triangle(a, a + 1, b);
      triangle(a + 1, b + 1, b);
    }
  if (contact.length) {
    // Apposed F₀ footprints can surround a tiny patch on the sampling grid.
    // Keep the bilayer continuous with the edges of this cropped membrane.
    const parent = Int32Array.from({ length: uv.length / 2 }, (_, i) => i);
    function root(i) {
      while (parent[i] !== i) {
        parent[i] = parent[parent[i]];
        i = parent[i];
      }
      return i;
    }
    for (let i = 0; i < faces.length; i += 3) {
      const first = root(faces[i]);
      parent[root(faces[i + 1])] = first;
      parent[root(faces[i + 2])] = first;
    }
    const outside = root(0);
    faces = faces.filter((i) => root(i) === outside);
    contact = contact.filter(([i]) => root(i) === outside);
  }
  for (let side = 0; side < 2; side++) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions[side], 3),
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(normals[side], 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geometry.setIndex(side ? faces : [...faces].reverse());
    membranePiece(
      g,
      geometry,
      side ? matrixColor : lumenColor,
      id,
      flags,
    ).name = side ? "matrix-face" : "luminal-face";
  }
  if (!contact.length) return;
  const walls = [],
    indices = [];
  for (const [a, b] of contact) {
    const base = walls.length / 3;
    for (const [index, side] of [
      [a, 0],
      [a, 1],
      [b, 0],
      [b, 1],
    ])
      walls.push(...positions[side].slice(index * 3, index * 3 + 3));
    indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(walls, 3));
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      new Float32Array((walls.length / 3) * 2),
      2,
    ),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  membranePiece(g, geometry, "#a58067", id, flags).name =
    "protein-contact-edge";
}

export function addCristaJunction(g) {
  const id = "cristaJunction";
  // Each cross section runs continuously from boundary membrane through the
  // narrow throat into a laterally expanding lamella. The far pole is closed.
  const stations = [
    [0.9, 0.77, -0.36],
    [0.67, 0.56, -0.37],
    [0.44, 0.36, -0.36],
    [0.27, 0.22, -0.34],
    [0.17, 0.132, -0.3],
    [0.126, 0.1, -0.23],
    [0.114, 0.09, -0.13],
    [0.131, 0.103, -0.047],
    [0.193, 0.123, 0.04],
    [0.342, 0.157, 0.109],
    [0.479, 0.181, 0.189],
    [0.536, 0.19, 0.286],
    [0.514, 0.183, 0.368],
    [0.421, 0.155, 0.427],
    [0.27, 0.11, 0.472],
    [0.125, 0.057, 0.491],
    [0, 0, 0.498],
  ];
  const profile = new THREE.CatmullRomCurve3(stations.map((p) => V(...p)));
  const cache = new Map();
  function point(a, t) {
    if (!cache.has(t)) cache.set(t, profile.getPoint(t));
    const { x: rx, y: rz, z: h } = cache.get(t);
    const expanded = THREE.MathUtils.smootherstep(t, 0.35, 0.78);
    // A curved crop from the boundary membrane gradually becomes a circular
    // neck. Its distal compartment extends to one side of the junction.
    const boundary = 1 - THREE.MathUtils.smoothstep(t, 0.13, 0.37);
    const ca = Math.cos(a),
      sa = Math.sin(a);
    const shape =
      1 +
      boundary * ((ca ** 4 + sa ** 4) ** -0.25 - 1 + 0.038 * Math.sin(3 * a));
    const x = rx * ca * shape,
      z = rz * sa * shape;
    return V(
      x - 0.17 + 0.44 * expanded,
      h +
        boundary *
          (0.185 * x * x +
            0.105 * z * z -
            0.113 * x * z +
            0.036 * Math.sin(3 * x + z)) +
        expanded * (0.11 * x - 0.035 * z),
      z + 0.036 * expanded,
    );
  }
  function frame(a, t) {
    const tangent = point(a + 0.001, t).sub(point(a - 0.001, t));
    const along = point(a, Math.min(1, t + 0.0003)).sub(
      point(a, Math.max(0, t - 0.0003)),
    );
    const normal =
      t < 1 ? along.cross(tangent).normalize() : V(-0.11, 1, 0.035).normalize();
    return { center: point(a, t), normal };
  }
  const lower = 0.47,
    upper = 2.57,
    across = 64;
  for (const [start, end, steps, cap] of [
    [upper, lower + TAU, 48, false],
    [lower, upper, 24, true],
  ]) {
    const angle = (u) => THREE.MathUtils.lerp(start, end, u);
    bilayerPanel(g, id, (u, v) => frame(angle(u), v), steps, across, { cap });
    edge(g, id, (u) => frame(angle(u), 0), steps, { cap });
  }
  for (const angle of [lower, upper])
    edge(g, id, (t) => frame(angle, t), across, { cutOnly: true });
  // A representative Mic60 span and IMS-exposed domain follow the concave
  // wall at the junction. The other MICOS components and copy number are omitted.
  const root = frame(4.65, 0.354);
  const micColor = "#759895";
  const span = mesh(
    g,
    new THREE.CylinderGeometry(0.013, 0.013, 0.045, 10),
    micColor,
    id,
  );
  span.name = "Mic60 membrane span";
  span.position.copy(root.center);
  span.quaternion.setFromUnitVectors(V(0, 1, 0), root.normal);
  const armSites = [
    [4.65, 0.354, 0.02],
    [4.77, 0.378, 0.04],
    [4.85, 0.41, 0.047],
    [4.84, 0.44, 0.036],
  ];
  const arm = armSites.map(([angle, t, d]) => {
    const f = frame(angle, t);
    return f.center.addScaledVector(f.normal, -d);
  });
  line(g, arm, 0.01, micColor, id).name = "Mic60 IMS arm";
  const terminal = ball(
    g,
    arm.at(-1),
    [0.028, 0.031, 0.02],
    micColor,
    id,
    14,
    10,
  );
  terminal.name = "Mic60 IMS domain";
  g.userData.landmarks = [
    {
      zh: "内边界膜",
      en: "Inner boundary membrane",
      position: offset(frame(-0.18, 0.044), 1).toArray(),
    },
    {
      zh: "嵴连接狭口 · 通向膜间隙",
      en: "Junction throat to intermembrane space",
      position: offset(frame(lower, 6 / 16), 1).toArray(),
    },
    {
      zh: "嵴腔",
      en: "Crista lumen",
      position: [0.26, 0.244, 0.043],
      visibleModes: ["section"],
    },
    {
      zh: "Mic60 膜间隙侧结构域（示意）",
      en: "Mic60 IMS domain (schematic)",
      position: arm
        .at(-1)
        .clone()
        .add(V(-0.005, 0.004, 0.019))
        .toArray(),
      visibleModes: ["section"],
    },
  ];
}

export function addCristaRim(g, monomer) {
  const id = "cristaRim";
  const cross = new THREE.CatmullRomCurve3([
    V(0, -0.51, -0.173),
    V(0, -0.32, -0.15),
    V(0, -0.1, -0.143),
    V(0, 0.09, -0.145),
    V(0, 0.183, -0.122),
    V(0, 0.236, -0.076),
    V(0, 0.257, 0),
    V(0, 0.236, 0.076),
    V(0, 0.182, 0.122),
    V(0, 0.087, 0.148),
    V(0, -0.106, 0.153),
    V(0, -0.32, 0.16),
    V(0, -0.51, 0.181),
  ]);
  const cache = new Map();
  function point(x, v) {
    if (!cache.has(v)) cache.set(v, cross.getPoint(v));
    const p = cache.get(v);
    return V(
      x,
      p.y + 0.043 * Math.sin(2.6 * x) + 0.023 * x * p.z,
      p.z + 0.077 * Math.sin(1.95 * x - 0.3) + 0.024 * x * p.y,
    );
  }
  function frame(x, v) {
    const tangent = point(x + 0.001, v)
      .sub(point(x - 0.001, v))
      .normalize();
    const across = point(x, Math.min(1, v + 0.0004)).sub(
      point(x, Math.max(0, v - 0.0004)),
    );
    return {
      center: point(x, v),
      normal: across.cross(tangent).normalize(),
      tangent,
    };
  }
  const start = -0.95,
    cut = -0.64,
    end = 0.94;
  const sites = [],
    scale = 0.39;
  for (const x of [-0.79, -0.4, 0.04, 0.48])
    for (const flank of [-1, 1]) {
      const f = frame(x + 0.009 * flank, (6 + flank * 0.95) / 12);
      const tangent = f.tangent.multiplyScalar(flank);
      const orientation = new THREE.Matrix4().makeBasis(
        tangent,
        f.normal.clone().cross(tangent),
        f.normal,
      );
      const protein = sites.length ? monomer.clone(true) : monomer;
      protein.name = "ATP synthase monomer";
      protein.position.copy(f.center);
      protein.quaternion.setFromRotationMatrix(orientation);
      protein.scale.setScalar(scale);
      // A clone made from the first (sectioned) monomer must restore its own
      // visibility before batching. Each enzyme follows its membrane patch.
      protein.traverse((o) => {
        if (o.isMesh) o.userData.cap = x < cut;
      });
      protein.updateMatrix();
      sites.push({
        center: f.center,
        inverse: protein.matrix.clone().invert(),
        protein,
        x,
        flank,
      });
      g.add(protein);
    }
  const local = V(0, 0, 0);
  function footprint(p) {
    let distance = 1;
    for (const site of sites) {
      if (Math.abs(p.x - site.center.x) > 0.19) continue;
      local.copy(p).applyMatrix4(site.inverse);
      const x = local.x - 0.084,
        y = local.y - 0.18;
      const xr = x * Math.cos(0.44) - y * Math.sin(0.44),
        yr = x * Math.sin(0.44) + y * Math.cos(0.44);
      const rotor = Math.hypot(local.x, local.y) - 0.131;
      const fixed = (Math.hypot(xr / 0.113, yr / 0.073) - 1) * 0.092;
      distance = Math.min(
        distance,
        scale * Math.max(Math.min(rotor, fixed), Math.abs(local.z) - 0.115),
      );
    }
    return distance;
  }
  for (const [a, b, steps, cap] of [
    [start, cut, 12, true],
    [cut, end, 62, false],
  ]) {
    const x = (u) => THREE.MathUtils.lerp(a, b, u);
    bilayerPanel(
      g,
      id,
      (u, v) => frame(x(u), v),
      steps,
      54,
      { cap },
      footprint,
    );
    for (const v of [0, 1]) edge(g, id, (u) => frame(x(u), v), steps, { cap });
  }
  for (const [x, flags] of [
    [start, { cap: true }],
    [cut, { cutOnly: true }],
    [end, {}],
  ])
    edge(g, id, (v) => frame(x, v), 54, flags);
  const labelSite = sites.find((site) => site.x === 0.04 && site.flank === 1);
  // Surface points on the F₁ crown and the Fo envelope of two visible pairs.
  const head = V(-0.1183992, 0.0232584, 0.6315986).applyMatrix4(
    labelSite.protein.matrix,
  );
  const frontPair = sites.find((site) => site.x === -0.4 && site.flank === 1);
  const rotor = V(0.0403571, -0.0539264, 0.0806025).applyMatrix4(
    frontPair.protein.matrix,
  );
  g.userData.landmarks = [
    {
      zh: "成对的 ATP 合酶 · 基质侧 F₁",
      en: "ATP synthase dimer · matrix F₁",
      position: head.toArray(),
    },
    {
      zh: "膜内 F₀ 转子",
      en: "Membrane-embedded F₀ rotor",
      position: rotor.toArray(),
    },
    {
      zh: "嵴缘膜弯曲",
      en: "Curved rim membrane",
      position: offset(frame(0.72, 0.6), 1).toArray(),
    },
    {
      zh: "嵴腔",
      en: "Crista lumen",
      position: point(cut + 0.008, 0.5)
        .add(V(0, -0.18, 0))
        .toArray(),
      visibleModes: ["section"],
    },
  ];
}
