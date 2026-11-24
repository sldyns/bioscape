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
// Opaque faces, cut edges and lipid relief share one vertex-colored material
// signature. The detail loader batches them independently of the protein parts.
function membranePiece(g, geometry, color, id, flags) {
  if (color) {
    const tint = new THREE.Color(color);
    const shades = new Float32Array(geometry.attributes.position.count * 3);
    for (let i = 0; i < shades.length; i += 3) tint.toArray(shades, i);
    geometry.setAttribute("color", new THREE.BufferAttribute(shades, 3));
  }
  const piece = mesh(g, geometry, "#ffffff", id, flags);
  piece.material.vertexColors = true;
  return piece;
}
// A cut through one lipid bilayer exposes its hydrophobic interior between two
// polar faces. The edge is shared by the membrane fragment and crista crops.
function bilayerEdge(g, sample, steps, id, flags) {
  const geometry = surface((u, v) => sample(u, v * 2 - 1), steps, 4);
  const bands = ["#e0b997", "#b3876b", "#886855", "#b08868", "#e9c79a"].map(
    (color) => new THREE.Color(color),
  );
  const shades = [];
  for (let i = 0; i <= steps; i++)
    for (const color of bands) shades.push(color.r, color.g, color.b);
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(shades, 3));
  return membranePiece(g, geometry, null, id, flags);
}

function synthaseMembrane(g) {
  const id = "atpSynthase";
  // The footprint includes the stationary membrane domain beside the rotor.
  function inside(a) {
    // Intersect a radial line with the stationary domain at the upper leaflet.
    // Where that domain is absent, the bilayer meets the rotor envelope.
    const dx = Math.cos(a + 0.44) / 0.142,
      dy = Math.sin(a + 0.44) / 0.1;
    const cx = (0.084 * Math.cos(0.44) - 0.18 * Math.sin(0.44)) / 0.142;
    const cy = (0.084 * Math.sin(0.44) + 0.18 * Math.cos(0.44)) / 0.1;
    const d2 = dx * dx + dy * dy,
      dot = dx * cx + dy * cy;
    const discriminant = dot * dot - d2 * (cx * cx + cy * cy - 0.68);
    return Math.max(
      0.155,
      discriminant > 0 ? (dot + Math.sqrt(discriminant)) / d2 : 0,
    );
  }
  function outside(a) {
    const square = (Math.cos(a) / 0.47) ** 4 + (Math.sin(a) / 0.5) ** 4;
    return (
      square ** -0.25 +
      0.029 * Math.sin(2 * a - 0.8) +
      0.017 * Math.cos(3 * a + 0.6)
    );
  }
  function level(x, y, side) {
    return 0.24 * y * y - 0.16 * x * x + 0.055 * x * y + side * 0.065;
  }
  function point(a, v, side) {
    const r = THREE.MathUtils.lerp(inside(a), outside(a), v);
    const x = r * Math.cos(a),
      y = r * Math.sin(a);
    return [x, y, level(x, y, side)];
  }
  const left = -1.12,
    right = 1.0;
  for (const [start, end, cap, steps] of [
    [right, left + TAU, false, 49],
    [left, right, true, 26],
  ]) {
    const angle = (u) => THREE.MathUtils.lerp(start, end, u);
    for (const side of [-1, 1])
      membranePiece(
        g,
        surface((u, v) => point(angle(u), v, side), steps, 7),
        side > 0 ? "#c6a17a" : "#ad876d",
        id,
        { cap },
      );
    for (const radius of [0, 1])
      bilayerEdge(g, (u, side) => point(angle(u), radius, side), steps, id, {
        cap,
      });
  }
  // Small, shallow headgroups follow both aqueous interfaces. Bake each
  // set into one mesh so the enlarged surface does not add one draw per lipid.
  const dome = new THREE.CircleGeometry(1, 8);
  dome.attributes.position.setZ(0, 1);
  for (let i = 1; i < dome.attributes.position.count; i++)
    dome.attributes.normal.setXYZ(
      i,
      dome.attributes.position.getX(i) * 0.84,
      dome.attributes.position.getY(i) * 0.84,
      0.55,
    );
  const headgroups = [[], []];
  const orientation = new THREE.Quaternion(),
    transform = new THREE.Matrix4();
  const axis = V(0, 0, 1),
    scale = V(1, 1, 1),
    location = V(0, 0, 0);
  for (let row = -9; row <= 9; row++)
    for (let column = -9; column <= 9; column++) {
      const phase = column * 2.8 + row * 1.9;
      const x = 0.069 * (column + 0.5 * (row & 1)) + 0.008 * Math.sin(phase);
      const y = 0.06 * row + 0.007 * Math.cos(1.8 * phase);
      const a = Math.atan2(y, x),
        r = Math.hypot(x, y);
      if (r < inside(a) + 0.025 || r > outside(a) - 0.024) continue;
      const bin = headgroups[Number(a >= left && a <= right)];
      for (const side of [-1, 1]) {
        const normal = V(0.32 * x - 0.055 * y, -0.48 * y - 0.055 * x, 1)
          .normalize()
          .multiplyScalar(side);
        orientation.setFromUnitVectors(axis, normal);
        scale.set(0.02 + 0.003 * Math.cos(phase), 0.019, 0.01);
        location.set(x, y, level(x, y, side) - 0.002 * side);
        bin.push(
          dome
            .clone()
            .applyMatrix4(transform.compose(location, orientation, scale)),
        );
      }
    }
  for (const [cap, pieces] of headgroups.entries()) {
    membranePiece(g, mergeGeometries(pieces), "#ccb08c", id, {
      cap: Boolean(cap),
    });
    pieces.forEach((piece) => piece.dispose());
  }
  dome.dispose();
  // Section omits only the sector in front of F₀. Whole restores the same leaflets.
  for (const angle of [left, right]) {
    bilayerEdge(g, (u, side) => point(angle, u, side), 18, id, {
      cutOnly: true,
    });
    for (let i = 0; i < 11; i++) {
      const v = (i + 0.5) / 11;
      for (const side of [-1, 1]) {
        const lipid = membranePiece(
          g,
          new THREE.SphereGeometry(1, 7, 4),
          "#dec4a0",
          id,
          { cutOnly: true },
        );
        lipid.position.set(...point(angle, v, side * 0.96));
        lipid.scale.set(0.015, 0.013, 0.01);
      }
    }
  }
}

// A UV seam duplicates positions. Smooth their discrete face normals together
// so the side light crosses a closed molecular envelope continuously.
function smoothCoincidentNormals(geometry, indices) {
  const normals = geometry.attributes.normal;
  const sum = V(0, 0, 0);
  for (const i of indices)
    sum.set(
      sum.x + normals.getX(i),
      sum.y + normals.getY(i),
      sum.z + normals.getZ(i),
    );
  sum.normalize();
  for (const i of indices) normals.setXYZ(i, sum.x, sum.y, sum.z);
}
function wrappedSurface(fn, nu, nv, closedProfile = false) {
  const geometry = surface(fn, nu, nv);
  for (let j = 0; j <= nv; j++)
    smoothCoincidentNormals(geometry, [j, nu * (nv + 1) + j]);
  if (closedProfile)
    for (let i = 0; i <= nu; i++)
      smoothCoincidentNormals(geometry, [i * (nv + 1), i * (nv + 1) + nv]);
  return geometry;
}
function catalyticDomain(i) {
  const geometry = new THREE.SphereGeometry(1, 26, 16);
  const position = geometry.attributes.position;
  const center = (i * TAU) / 6;
  for (let j = 0; j < position.count; j++) {
    const x = position.getX(j),
      y = position.getY(j),
      z = position.getZ(j);
    // Domains meet along an oblique groove and taper into the crown of F₁.
    const groove =
      1 -
      0.13 * Math.exp(-(((z + 0.25 + 0.25 * y) / 0.16) ** 2)) -
      0.07 * Math.exp(-(((z - 0.42 - 0.18 * x) / 0.18) ** 2));
    const relief =
      1 +
      0.042 * Math.sin(4.1 * x + 2.2 * z + center) * Math.cos(4.3 * y - z) +
      0.022 * Math.sin(5.2 * z - 2.1 * y + x);
    const radial = 0.147 - 0.026 * z + 0.141 * x * groove * relief;
    const tangent = 0.139 * y * groove * relief * (1 + 0.12 * x);
    const a = center + 0.27 * z + (i % 2 ? 0.05 : -0.035);
    position.setXYZ(
      j,
      radial * Math.cos(a) - tangent * Math.sin(a),
      radial * Math.sin(a) + tangent * Math.cos(a),
      0.472 + z * (i % 2 ? 0.18 : 0.199) + 0.016 * x - 0.008 * y,
    );
  }
  geometry.computeVertexNormals();
  const { widthSegments, heightSegments } = geometry.parameters;
  for (let row = 1; row < heightSegments; row++) {
    const first = row * (widthSegments + 1);
    smoothCoincidentNormals(geometry, [first, first + widthSegments]);
  }
  for (const row of [0, heightSegments]) {
    const first = row * (widthSegments + 1);
    smoothCoincidentNormals(
      geometry,
      Array.from({ length: widthSegments + 1 }, (_, i) => first + i),
    );
  }
  return geometry;
}

function enlargedSynthase(g) {
  const id = "atpSynthase";
  synthaseMembrane(g);
  // A continuous, grooved annulus represents the membrane rotor. Its relief
  // does not enumerate c subunits of any particular organism.
  const ring = new THREE.CatmullRomCurve3(
    [
      V(0.068, 0, -0.093),
      V(0.125, 0, -0.106),
      V(0.168, 0, -0.083),
      V(0.175, 0, 0.055),
      V(0.156, 0, 0.09),
      V(0.085, 0, 0.105),
      V(0.063, 0, 0.072),
      V(0.058, 0, -0.06),
    ],
    true,
  );
  mesh(
    g,
    wrappedSurface(
      (u, v) => {
        const p = ring.getPoint(v),
          a = TAU * u,
          slant = a - 1.9 * p.z;
        const phase = Math.atan2(Math.sin(slant), Math.cos(slant));
        let grooves = 0;
        for (const groove of [-0.84, -0.45, -0.04, 0.39, 0.77])
          grooves += Math.exp(-(((phase - groove) / 0.095) ** 2));
        const r =
          p.x *
            (1 +
              0.04 * Math.sin(3 * slant + 0.3) +
              0.025 * Math.cos(5 * slant)) -
          0.015 * grooves * THREE.MathUtils.smoothstep(p.x, 0.125, 0.163);
        return [r * Math.cos(a), r * Math.sin(a), p.z];
      },
      64,
      18,
      true,
    ),
    "#779a97",
    id,
  ).name = "membrane-rotor";
  ball(g, V(0, 0, -0.011), [0.081, 0.08, 0.105], "#779a97", id);
  const fixed = ball(
    g,
    V(0.084, 0.18, -0.007),
    [0.142, 0.1, 0.117],
    "#a49376",
    id,
  );
  fixed.name = "stationary-membrane-domain";
  fixed.rotation.z = -0.44;
  mesh(
    g,
    wrappedSurface(
      (u, v) => {
        const a = TAU * u,
          z = 0.063 + 0.405 * v;
        const r =
          (0.035 +
            0.029 * Math.exp(-(((z - 0.11) / 0.062) ** 2)) +
            0.019 * Math.exp(-(((z - 0.31) / 0.066) ** 2))) *
          (1 + 0.16 * Math.cos(2 * a - 6 * v));
        return [r * Math.cos(a) + 0.014 * Math.sin(v * 3), r * Math.sin(a), z];
      },
      18,
      15,
    ),
    "#85778e",
    id,
  ).name = "central-shaft";
  for (let i = 0; i < 6; i++)
    mesh(g, catalyticDomain(i), i % 2 ? "#a28daf" : "#d0af8e", id).name =
      "catalytic-domain";
  const stalk = line(
    g,
    [
      V(0.1, 0.214, 0.012),
      V(0.132, 0.256, 0.16),
      V(0.117, 0.276, 0.34),
      V(0.108, 0.266, 0.49),
      V(0.075, 0.2, 0.602),
      V(0.028, 0.075, 0.65),
    ],
    0.028,
    "#978569",
    id,
  );
  stalk.name = "peripheral-stalk";
  const cap = ball(
    g,
    V(0.026, 0.062, 0.632),
    [0.061, 0.077, 0.042],
    "#978569",
    id,
  );
  cap.name = "stator-crown";
  cap.rotation.z = -0.42;
}

function enlargedCristae(g) {
  const id = "cristae";
  // Traverse the cross-section of each lamella from one foot, over the crest,
  // and back through the other foot to the shared inner boundary membrane.
  const lobe = [
    [-0.19, 0.018],
    [-0.085, 0.072],
    [-0.061, 0.154],
    [-0.112, 0.337],
    [-0.118, 0.501],
    [-0.076, 0.61],
    [0, 0.653],
    [0.075, 0.624],
    [0.117, 0.525],
    [0.114, 0.343],
    [0.064, 0.154],
    [0.088, 0.07],
    [0.19, 0.018],
  ];
  const fold = (center) => lobe.map(([dy, depth]) => V(0, center + dy, depth));
  const curve = new THREE.CatmullRomCurve3([
    V(0, -0.85, 0),
    ...fold(-0.28),
    V(0, 0.035, 0),
    ...fold(0.35),
    V(0, 0.85, 0),
  ]);
  // Each longitudinal row reuses its cross-section samples on both leaflets.
  const profile = new Map();
  function point(x, v) {
    if (!profile.has(v)) profile.set(v, curve.getPoint(v));
    const p = profile.get(v);
    const upper = v > 0.5;
    // The uncut ends of both lamellae rejoin the same boundary membrane.
    const envelope =
      1 -
      THREE.MathUtils.smootherstep(
        x,
        upper ? 0.12 : -0.12,
        upper ? 0.88 : 0.66,
      );
    const flatY = upper
      ? THREE.MathUtils.lerp(0.035, 0.85, (v - 0.5) * 2)
      : THREE.MathUtils.lerp(-0.85, 0.035, v * 2);
    const y = THREE.MathUtils.lerp(flatY, p.y, envelope);
    const relief = envelope * (0.87 + 0.13 * Math.cos(2.55 * x + 2.8 * p.y));
    const bend =
      0.033 * Math.sin(2.7 * x + 3.1 * y) + 0.021 * x * p.z * envelope;
    const roundedEnd =
      0.125 *
      THREE.MathUtils.smoothstep(x, 0.49, 0.89) *
      (Math.abs(y) / 0.85) ** 4;
    return V(
      x - roundedEnd,
      y + bend,
      -0.25 +
        p.z * relief +
        0.048 * Math.sin(2.1 * x + y) +
        0.026 * y * y +
        0.02 * x * y,
    );
  }
  function frame(x, v) {
    const along = point(x + 0.001, v).sub(point(x - 0.001, v));
    const across = point(x, Math.min(1, v + 0.0003)).sub(
      point(x, Math.max(0, v - 0.0003)),
    );
    return { center: point(x, v), normal: along.cross(across).normalize() };
  }
  function leaflet(x, v, side) {
    const { center, normal } = frame(x, v);
    return center.addScaledVector(normal, side * 0.015).toArray();
  }
  const front = -1.05,
    cut = -0.81,
    back = 0.89,
    across = 112;
  for (const [start, end, cap, steps] of [
    [front, cut, true, 5],
    [cut, back, false, 28],
  ]) {
    const x = (u) => THREE.MathUtils.lerp(start, end, u);
    for (const side of [-1, 1])
      membranePiece(
        g,
        surface((u, v) => leaflet(x(u), v, side), steps, across),
        side > 0 ? "#c79c75" : "#ab826f",
        id,
        { cap },
      ).name = side > 0 ? "matrix-face" : "luminal-face";
    for (const edge of [0, 1])
      bilayerEdge(g, (u, side) => leaflet(x(u), edge, side), steps, id, {
        cap,
      });
  }
  for (const [x, flags] of [
    [back, {}],
    [front, { cap: true }],
    [cut, { cutOnly: true }],
  ])
    bilayerEdge(g, (v, side) => leaflet(x, v, side), across, id, flags);
  // Schematic ATP synthase pairs sit on the matrix side of curved crests.
  // Primary cryotomography: Strauss et al., doi:10.1038/emboj.2008.35.
  for (const crest of [7, 21])
    for (const x of [-0.63, -0.39, -0.15, 0.09])
      for (const flank of [-0.48, 0.48]) {
        const { center, normal } = frame(
          x,
          (crest + flank) / (curve.points.length - 1),
        );
        const stem = mesh(
          g,
          new THREE.CylinderGeometry(0.011, 0.018, 0.066, 8),
          "#90816c",
          id,
        );
        stem.name = "crest-stem";
        stem.position.copy(center).addScaledVector(normal, 0.011);
        stem.quaternion.setFromUnitVectors(V(0, 1, 0), normal);
        const head = mesh(g, new THREE.SphereGeometry(1, 12, 7), "#a899ac", id);
        head.name = "crest-head";
        head.scale.set(0.034, 0.032, 0.029);
        head.position.copy(center).addScaledVector(normal, 0.061);
        head.quaternion.setFromUnitVectors(V(0, 0, 1), normal);
      }
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
    bins
      .get(key)
      .geos.push(
        new THREE.BufferGeometry().copy(o.geometry).applyMatrix4(o.matrixWorld),
      );
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
    enlargedCristae(g);
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
    enlargedSynthase(g);
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
