import * as T from "three";
import {
  V,
  TAU,
  ball,
  tube,
  ring,
  shell,
  surfacePoint,
  nucleus,
  vesicle,
  addMesh,
} from "./microbeGeometry";
import { place } from "./specimenGeometry";
import { poreComplex } from "./nuclearBodies";
import { chromatinDetail } from "./chromatinDetails";
import { splitSection } from "./implicitMembrane";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import {
  ellipticalPoint,
  loftRings,
  membraneOtherFace,
  parametricNormal,
  perforatedSurface,
} from "./parameciumMembranes";

const bodyRadii = [1.18, 2.55, 0.78];
const bodyCutZ = bodyRadii[2] * Math.cos(1.18);
const bodyHoles = [
  { id: "oral", center: [1.39, 0.79], radii: [0.25, 0.24] },
  ...[-1.48, 1.5].map((y, i) => ({
    id: `contractile${i}`,
    center: [Math.acos(y / bodyRadii[1]), Math.PI * 1.5],
    radii: [0.026, 0.063],
    minimumPatch: [4, 12],
  })),
];
function deformBody(p) {
  p.x *= 1 + (0.17 * p.y) / 2.55;
  p.x += 0.13 * Math.sin(p.y * 1.1);
  return p;
}
function bodyPoint(t, a) {
  return deformBody(surfacePoint(t, a, bodyRadii));
}
function longitudinalBodyPoint(u, v) {
  return deformBody(ellipticalPoint(bodyRadii, u, v));
}
function inBodyOpening(u, v, margin = 1) {
  return bodyHoles.some(
    ({ center, radii }) =>
      Math.hypot((u - center[0]) / radii[0], (v - center[1]) / radii[1]) <
      margin,
  );
}
function membraneFaces(
  g,
  geometry,
  color,
  id,
  role,
  {
    thickness = 0.04,
    opacity = 0.52,
    cut = null,
    openingId = null,
    faceNames = ["lumen", "cytoplasm"],
  } = {},
) {
  const other = membraneOtherFace(geometry, thickness);
  for (const [face, source] of [
    [faceNames[0], geometry],
    [faceNames[1], other],
  ]) {
    let sections = [[false, source]];
    if (cut) {
      const p = source.attributes.position;
      let back = false,
        front = false;
      for (let i = 0; i < p.count && !(back && front); i++) {
        if (cut([p.getX(i), p.getY(i), p.getZ(i)]) > 0) front = true;
        else back = true;
      }
      if (back && front) {
        sections = splitSection(source, cut).map((part, i) => {
          const indexed = mergeVertices(part, 1e-7);
          part.dispose();
          return [Boolean(i), indexed];
        });
        source.dispose();
      } else sections = [[front, source]];
    }
    for (const [cap, section] of sections) {
      const m = addMesh(g, section, color, id, {
        transparent: opacity < 1,
        opacity: cap ? opacity * 0.52 : opacity,
        depthWrite: opacity === 1,
      });
      Object.assign(m.userData, {
        topologyRole: role,
        membraneFace: face,
        openingId,
      });
      if (cap) m.userData.cap = true;
    }
  }
}
function openingRecord(opening) {
  return {
    id: opening.id,
    center: opening.center.toArray(),
    normal: opening.normal.toArray(),
    rim: opening.rim.map((p) => p.toArray()),
    rimNormals: opening.normals.map((p) => p.toArray()),
  };
}
function surface() {
  const g = new T.Group();
  const { geometry, openings } = perforatedSurface(
    longitudinalBodyPoint,
    bodyHoles,
  );
  membraneFaces(g, geometry, "#a7c1b9", "paraSurface", "bodyMembrane", {
    opacity: 0.36,
    cut: (p) => p[2] - bodyCutZ,
  });
  const cutRim = tube(
    g,
    Array.from({ length: 113 }, (_, i) => bodyPoint(1.18, (i / 112) * TAU)),
    0.0208,
    "#a7c1b9",
    "paraSurface",
  );
  Object.assign(cutRim.userData, {
    cutOnly: true,
    topologyRole: "corticalCutRim",
  });
  // Kineties follow the long y axis. The viewing cut is an independent z plane.
  for (let k = 0; k < 26; k++) {
    const v = (k / 26) * TAU;
    let points = [];
    const flush = () => {
      if (points.length > 1) {
        const m = tube(g, points, 0.008, "#8daca7", "paraSurface");
        const [back, front] = splitSection(m.geometry, (p) => p[2] - bodyCutZ);
        m.geometry.dispose();
        m.geometry = back;
        Object.assign(m.userData, {
          topologyRole: "longitudinalKinety",
          kinety: k,
        });
        const cap = addMesh(g, front, "#8daca7", "paraSurface");
        Object.assign(cap.userData, {
          cap: true,
          topologyRole: "longitudinalKinety",
          kinety: k,
        });
      }
      points = [];
    };
    for (let j = 0; j <= 128; j++) {
      const u = 0.1 + (j / 128) * (Math.PI - 0.2);
      if (inBodyOpening(u, v, 1.14)) flush();
      else
        points.push(
          longitudinalBodyPoint(u, v).addScaledVector(
            parametricNormal(longitudinalBodyPoint, u, v),
            0.007,
          ),
        );
    }
    flush();
  }
  g.userData.membraneOpenings = openings;
  g.userData.scienceTopology = {
    openings: [...openings.values()].map(openingRecord),
    kinetyAxis: "y",
  };
  return g;
}
function ciliaOnBody(g) {
  for (let row = 0; row < 30; row++)
    for (let k = 0; k < 26; k++) {
      const u = 0.16 + (row / 29) * (Math.PI - 0.32),
        v = (k / 26) * TAU,
        p = longitudinalBodyPoint(u, v);
      if (inBodyOpening(u, v, 1.2)) continue;
      const normal = parametricNormal(longitudinalBodyPoint, u, v);
      const pts = [
        p,
        p.clone().addScaledVector(normal, 0.065),
        p
          .clone()
          .addScaledVector(normal, 0.15)
          .add(V(0.035, -0.055, 0)),
        p
          .clone()
          .addScaledVector(normal, 0.22)
          .add(V(0.06, -0.11, 0.02)),
      ];
      const m = tube(g, pts, 0.009, "#92b0ac", "paraCilia");
      m.userData.kinety = k;
      if (p.z > bodyCutZ) m.userData.cap = true;
    }
}
function axonemeTubeShape(radius) {
  const shape = new T.Shape(),
    hole = new T.Path();
  shape.absarc(0, 0, radius, 0, TAU, false);
  hole.absarc(0, 0, radius * 0.65, 0, TAU, true);
  shape.holes.push(hole);
  return shape;
}
function doubletShapes(aRadius, spacing) {
  const outer = aRadius * (0.08 / 0.082),
    inner = outer * 0.65;
  const intersection = (r) => {
    const angle = Math.acos(
      (aRadius ** 2 - spacing ** 2 - r ** 2) / (2 * spacing * r),
    );
    const x = spacing + r * Math.cos(angle),
      y = r * Math.sin(angle);
    return { angle, aAngle: Math.atan2(y, x) };
  };
  const top = intersection(outer),
    bottom = intersection(inner),
    points = [];
  const angles = Array.from({ length: 128 }, (_, i) => (i / 128) * TAU);
  for (const side of [-1, 1])
    for (let i = 0; i <= 20; i++) {
      const a = side * T.MathUtils.lerp(top.aAngle, bottom.aAngle, i / 20);
      angles.push((a + TAU) % TAU);
    }
  angles.sort((a, b) => a - b);
  const outerAngles = angles.filter(
    (a, i) => i === 0 || a - angles[i - 1] > 1e-10,
  );
  const aShape = new T.Shape(
    outerAngles.map(
      (a) => new T.Vector2(aRadius * Math.cos(a), aRadius * Math.sin(a)),
    ),
  );
  const aLumen = new T.Path();
  aLumen.absarc(0, 0, aRadius * 0.65, 0, TAU, true);
  aShape.holes.push(aLumen);
  const arc = (cx, radius, from, to, count = 96) => {
    for (let i = 0; i <= count; i++) {
      const a = T.MathUtils.lerp(from, to, i / count);
      points.push(
        new T.Vector2(cx + radius * Math.cos(a), radius * Math.sin(a)),
      );
    }
  };
  const sharedAArc = (from, to) => {
    const values = outerAngles
      .map((a) => (a > Math.PI ? a - TAU : a))
      .filter(
        (a) =>
          a >= Math.min(from, to) - 1e-10 && a <= Math.max(from, to) + 1e-10,
      )
      .sort((a, b) => (to > from ? a - b : b - a));
    for (const a of values)
      points.push(new T.Vector2(aRadius * Math.cos(a), aRadius * Math.sin(a)));
  };
  // The B wall ends on A's exterior. Its missing sector is supplied by A's
  // existing wall; there is no second complete annulus crossing A's lumen.
  arc(spacing, outer, -top.angle, top.angle);
  sharedAArc(top.aAngle, bottom.aAngle);
  arc(spacing, inner, bottom.angle, -bottom.angle);
  sharedAArc(-bottom.aAngle, -top.aAngle);
  return { A: aShape, B: new T.Shape(points) };
}
function axonemeMembers(
  g,
  { radius = 0.65, tubeRadius = 0.082, length = 2.2, bend = null } = {},
) {
  const spacing = tubeRadius * (0.115 / 0.082),
    members = [];
  const addMember = (
    shape,
    color,
    center,
    angle,
    member,
    doubletIndex = null,
  ) => {
    const geometry = new T.ExtrudeGeometry(shape, {
      depth: length,
      steps: bend ? 64 : 1,
      bevelEnabled: false,
      curveSegments: 64,
    });
    geometry.translate(0, 0, -length / 2);
    geometry.rotateX(Math.PI / 2);
    geometry.rotateY(angle);
    geometry.translate(...center.toArray());
    if (bend) {
      const p = geometry.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const t = (p.getY(i) + length / 2) / length;
        const centerline = bend(t);
        p.setXYZ(
          i,
          p.getX(i) + centerline.x,
          centerline.y,
          p.getZ(i) + centerline.z,
        );
      }
      geometry.computeVertexNormals();
    }
    geometry.deleteAttribute("normal");
    geometry.deleteAttribute("uv");
    const indexed = mergeVertices(geometry, 1e-7);
    indexed.computeVertexNormals();
    geometry.dispose();
    const m = addMesh(g, indexed, color, "paraAxoneme");
    Object.assign(m.userData, { axonemeMember: member, doubletIndex });
    members.push(m);
  };
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU,
      p = V(radius * Math.cos(a), 0, radius * Math.sin(a));
    const shapes = doubletShapes(tubeRadius, spacing),
      angle = -a - Math.PI / 2;
    addMember(shapes.A, "#98aec0", p, angle, "A", i);
    addMember(shapes.B, "#afc4bf", p, angle, "B", i);
  }
  for (const x of [-tubeRadius * (0.115 / 0.082), tubeRadius * (0.115 / 0.082)])
    addMember(
      axonemeTubeShape(tubeRadius * (0.075 / 0.082)),
      "#bcb393",
      V(x, 0, 0),
      0,
      "central",
    );
  return members;
}
function axoneme() {
  const g = new T.Group(),
    r = 0.65;
  axonemeMembers(g);
  const connections = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU,
      p = V(r * Math.cos(a), 0, r * Math.sin(a));
    const target = (i + 8) % 9,
      targetAngle = (target / 9) * TAU;
    const b = V(
      r * Math.cos(targetAngle) - 0.115 * Math.sin(targetAngle),
      0,
      r * Math.sin(targetAngle) + 0.115 * Math.cos(targetAngle),
    );
    const direction = b.clone().sub(p).normalize();
    for (let y = -0.8; y <= 0.8; y += 0.4) {
      tube(
        g,
        [
          V(p.x, y, p.z),
          V(p.x * 0.65, y, p.z * 0.65),
          V(p.x * 0.35, y, p.z * 0.35),
        ],
        0.022,
        "#c2ae8f",
        "paraAxoneme",
      );
      for (const offset of [-0.045, 0.045]) {
        const start = p
          .clone()
          .addScaledVector(direction, 0.082)
          .setY(y + offset);
        const end = b
          .clone()
          .addScaledVector(direction, -0.08)
          .setY(y + offset);
        const middle = start
          .clone()
          .lerp(end, 0.5)
          .add(V(0, 0.024, 0));
        const arm = tube(
          g,
          [start, middle, end],
          0.017,
          "#aa98b5",
          "paraAxoneme",
        );
        Object.assign(arm.userData, {
          topologyRole: "interdoubletDynein",
          sourceDoublet: i,
          targetDoublet: target,
          sourceMember: "A",
          targetMember: "B",
        });
        connections.push({
          from: i,
          to: target,
          start: start.toArray(),
          end: end.toArray(),
        });
      }
    }
    for (const y of [-0.6, 0.2, 0.6]) {
      const start = p.clone().addScaledVector(direction, 0.082).setY(y);
      const end = b.clone().addScaledVector(direction, -0.08).setY(y);
      const link = tube(
        g,
        [
          start,
          start
            .clone()
            .lerp(end, 0.5)
            .add(V(0, -0.04, 0)),
          end,
        ],
        0.013,
        "#a7b9a5",
        "paraAxoneme",
      );
      Object.assign(link.userData, {
        topologyRole: "interdoubletLink",
        sourceDoublet: i,
        targetDoublet: target,
      });
    }
  }
  for (const y of [-0.95, 0.95]) {
    const m = ring(g, [0, y, 0], 0.9, 0.022, "#a3bcb3", "paraAxoneme");
    m.rotation.x = Math.PI / 2;
  }
  g.rotation.set(0.55, 0, 0.12);
  g.userData.scienceTopology = {
    doublets: 9,
    centralMicrotubules: 2,
    connections,
  };
  g.userData.landmarks = [
    {
      zh: "9组外周二联体",
      en: "Nine outer doublets",
      position: [0.65, 0.8, 0],
    },
    {
      zh: "2根中央微管",
      en: "Two central microtubules",
      position: [0, 0.8, 0],
    },
    {
      zh: "动力蛋白与连接结构（示意）",
      en: "Dynein and links (schematic)",
      position: [-0.4, 0, 0.45],
    },
  ];
  return g;
}
function cilia() {
  const g = new T.Group();
  for (let j = 0; j < 5; j++) {
    const x = (j - 2) * 0.4;
    const pts = Array.from({ length: 34 }, (_, i) => {
      const t = i / 33;
      return V(x + 0.32 * t * t, 1.8 * t - 0.65, 0.075 * Math.sin(t * Math.PI));
    });
    const membrane = tube(g, pts, 0.075, "#a9c0b8", "paraCilia");
    // One enlarged translucent cilium reveals the same 9 + 2 plan as its detail.
    // The other cilia retain their membrane silhouette so the row stays legible.
    if (j === 2) {
      membrane.material.transparent = true;
      membrane.material.opacity = 0.23;
      membrane.material.depthWrite = false;
      axonemeMembers(g, {
        radius: 0.047,
        tubeRadius: 0.0055,
        length: 1.8,
        bend: (t) =>
          V(x + 0.32 * t * t, 1.8 * t - 0.65, 0.075 * Math.sin(t * Math.PI)),
      });
    }
    ball(g, [x, -0.71, 0], [0.09, 0.14, 0.09], "#aeb5bf", "paraCilia");
    const collar = ring(g, [x, -0.63, 0], 0.087, 0.014, "#9caaa9", "paraCilia");
    collar.rotation.x = Math.PI / 2;
  }
  g.userData.partAnchors = { paraAxoneme: [0.16, 0.55, 0.06] };
  g.userData.landmarks = [
    { zh: "纤毛膜", en: "Ciliary membrane", position: [-0.62, 0.65, 0] },
    {
      zh: "基体（示意）",
      en: "Basal body (schematic)",
      position: [-0.4, -0.72, 0],
    },
  ];
  return g;
}
function bodyOpening(id) {
  const { geometry, openings } = perforatedSurface(
    longitudinalBodyPoint,
    bodyHoles,
  );
  geometry.dispose();
  return openings.get(id);
}
function oral(opening = bodyOpening("oral"), assembled = false) {
  const g = new T.Group(),
    rings = [],
    [u0, v0] = opening.definition.center;
  const normal = opening.normal,
    center = opening.center;
  // An invaginating membrane leaves the cell surface tangentially and bends
  // into the buccal cavity. Both membrane faces share its exact cortical rim.
  for (let k = 0; k <= 32; k++) {
    const a = ((k / 32) * Math.PI) / 2;
    const scale = 1 - 0.83 * Math.sin(a),
      depth = 1 - Math.cos(a);
    rings.push(
      opening.uv.map(([u, v]) =>
        longitudinalBodyPoint(u0 + (u - u0) * scale, v0 + (v - v0) * scale)
          .addScaledVector(normal, -0.21 * depth)
          .add(V(0, -0.2 * depth, 0)),
      ),
    );
  }
  const throatStart = center
    .clone()
    .addScaledVector(normal, -0.21)
    .add(V(0, -0.2, 0));
  const throatEnd = V(0.64, -0.36, 0.28);
  // Match the first throat section's axis, then bend with one smooth curve.
  // An initially oblique tangent would flip the first narrow wall facets.
  const curve = new T.CubicBezierCurve3(
    throatStart,
    throatStart.clone().addScaledVector(normal, -0.22),
    throatEnd.clone().add(V(0.025, 0.26, 0.025)),
    throatEnd,
  );
  const firstOffsets = rings.at(-1).map((p) => p.clone().sub(throatStart));
  const firstAxis = normal.clone().negate();
  const firstU = longitudinalBodyPoint(u0 + 0.001, v0)
    .sub(longitudinalBodyPoint(u0 - 0.001, v0))
    .normalize();
  const firstV = firstAxis.clone().cross(firstU).normalize();
  const path = [
    center.clone().addScaledVector(normal, 0.05),
    center.clone(),
    center.clone().addScaledVector(normal, -0.03),
    throatStart,
  ];
  for (let k = 1; k <= 40; k++) {
    const t = k / 40,
      c = curve.getPoint(t),
      q = new T.Quaternion().setFromUnitVectors(firstAxis, curve.getTangent(t));
    const blend = T.MathUtils.smoothstep(t, 0, 0.35);
    rings.push(
      opening.angles.map((a, i) => {
        const circle = firstU
          .clone()
          .multiplyScalar(Math.cos(a) * 0.065)
          .addScaledVector(firstV, Math.sin(a) * 0.065);
        return firstOffsets[i]
          .clone()
          .lerp(circle, blend)
          .applyQuaternion(q)
          .add(c);
      }),
    );
    path.push(c);
  }
  const geometry = loftRings(rings, opening.normals);
  const lastStart = geometry.attributes.position.count - opening.rim.length;
  const endNormals = opening.rim.map((_, i) =>
    V().fromBufferAttribute(geometry.attributes.normal, lastStart + i),
  );
  const endOther = rings
    .at(-1)
    .map((p, i) => p.clone().addScaledVector(endNormals[i], -0.04));
  membraneFaces(g, geometry, "#b8a5bc", "paraOral", "oralMembrane", {
    opacity: 0.68,
    openingId: opening.id,
  });
  const cutRim = addMesh(
    g,
    loftRings([rings.at(-1), endOther]),
    "#b69cb7",
    "paraOral",
  );
  cutRim.userData.topologyRole = "cytopharynxDistalCut";
  for (let j = 0; j < 15; j++)
    for (const side of [-1, 1]) {
      const t = (j + 1) / 16,
        u = u0 + (t * 2 - 1) * opening.definition.radii[0] * 0.88;
      const v =
        v0 +
        side *
          opening.definition.radii[1] *
          Math.sqrt(1 - ((u - u0) / opening.definition.radii[0]) ** 2);
      const p = longitudinalBodyPoint(u, v),
        n = parametricNormal(longitudinalBodyPoint, u, v);
      tube(
        g,
        [
          p,
          p
            .clone()
            .addScaledVector(n, -0.055)
            .add(V(0, -0.025, 0)),
          p
            .clone()
            .addScaledVector(n, -0.08)
            .add(V(0, -0.08, 0)),
        ],
        0.009,
        "#96b4ac",
        "paraOral",
      );
    }
  g.userData.scienceTopology = {
    junction: openingRecord(opening),
    lumenPath: path.map((p) => p.toArray()),
    distalRadius: 0.065,
  };
  g.userData.landmarks = [
    {
      zh: "口沟",
      en: "Oral groove",
      position: center.clone().addScaledVector(normal, 0.015).toArray(),
    },
    {
      zh: "胞口与胞咽",
      en: "Cytostome and cytopharynx",
      position: throatStart.clone().lerp(throatEnd, 0.6).toArray(),
    },
  ];
  if (!assembled) {
    const middle = center.clone().lerp(throatEnd, 0.5);
    g.scale.setScalar(1.75);
    g.position.copy(middle).multiplyScalar(-1.75);
  }
  return g;
}
function radial(id = "paraRadial") {
  const g = new T.Group();
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU,
      p = V(Math.cos(a), Math.sin(a), 0);
    tube(
      g,
      [
        p.clone().multiplyScalar(0.25),
        p.clone().multiplyScalar(0.65),
        p
          .clone()
          .multiplyScalar(1.13)
          .add(V(0.025, -0.035, 0)),
      ],
      0.046,
      "#9fc4d0",
      id,
    );
    const m = ball(
      g,
      p.clone().multiplyScalar(0.53).toArray(),
      [0.15, 0.065, 0.065],
      "#a9cdd5",
      id,
    );
    m.rotation.z = a;
    const tangent = V(-Math.sin(a), Math.cos(a), 0);
    // Simplified spongiome: connected membrane tubules surrounding each canal.
    // The displayed branch count is illustrative, not a species-specific count.
    for (let branch = 0; branch < 4; branch++)
      for (const side of [-1, 1]) {
        const origin = p.clone().multiplyScalar(0.76 + branch * 0.09);
        tube(
          g,
          [
            origin,
            origin
              .clone()
              .addScaledVector(tangent, side * 0.075)
              .add(V(0, 0, 0.035)),
            origin
              .clone()
              .addScaledVector(tangent, side * 0.12)
              .addScaledVector(p, 0.055),
          ],
          0.012,
          "#b0cdd1",
          id,
        );
      }
  }
  g.userData.landmarks = [
    { zh: "收集管", en: "Collecting canal", position: [0.94, 0, 0] },
    { zh: "膨大部", en: "Ampulla", position: [0.53, 0, 0.065] },
    {
      zh: "海绵状管网（示意）",
      en: "Spongiome (schematic)",
      position: [0.9, 0.14, 0.035],
    },
  ];
  return g;
}
function contractile(corticalOpening = null) {
  const g = new T.Group(),
    assembled = Boolean(corticalOpening),
    scale = assembled ? 0.48 : 1;
  const opening = corticalOpening || {
    id: "contractileDetail",
    center: V(0, 0, 0.68),
    normal: V(0, 0, 1),
    angles: Array.from({ length: 96 }, (_, i) => (i / 96) * TAU),
  };
  const normal = opening.normal;
  const axisU = assembled
    ? longitudinalBodyPoint(
        opening.definition.center[0] + 0.001,
        opening.definition.center[1],
      )
        .sub(
          longitudinalBodyPoint(
            opening.definition.center[0] - 0.001,
            opening.definition.center[1],
          ),
        )
        .normalize()
    : V(0, -1, 0);
  const axisV = normal.clone().negate().cross(axisU).normalize();
  if (!assembled) {
    opening.rim = opening.angles.map((a) =>
      opening.center
        .clone()
        .addScaledVector(axisU, 0.07 * Math.cos(a))
        .addScaledVector(axisV, 0.07 * Math.sin(a)),
    );
    opening.normals = opening.rim.map(() => normal.clone());
    const patch = new T.RingGeometry(0.07, 0.43, 96, 8);
    patch.translate(0, 0, 0.68);
    membraneFaces(g, patch, "#a7c1b9", "paraContractile", "corticalPorePatch", {
      opacity: 0.36,
    });
  }
  const center = assembled
    ? opening.center.clone().addScaledVector(normal, -0.3)
    : V(0, 0, 0);
  const collection = radial();
  collection.position.copy(center);
  collection.scale.setScalar(scale);
  g.add(collection);
  const rx = 0.34 * scale,
    rz = 0.22 * scale,
    alpha = 0.24;
  const sphereRing = opening.angles.map((a) =>
    center
      .clone()
      .addScaledVector(normal, rz * Math.cos(alpha))
      .addScaledVector(axisU, rx * Math.sin(alpha) * Math.cos(a))
      .addScaledVector(axisV, rx * Math.sin(alpha) * Math.sin(a)),
  );
  const rings = [];
  for (let k = 0; k <= 24; k++) {
    const t = k / 24,
      bend = (t * Math.PI) / 2;
    const narrow = 1 - 0.3 * Math.sin(bend),
      depth = 0.035 * (1 - Math.cos(bend));
    rings.push(
      opening.rim.map((p) =>
        p
          .clone()
          .sub(opening.center)
          .multiplyScalar(narrow)
          .add(opening.center)
          .addScaledVector(normal, -depth),
      ),
    );
  }
  const neckStart = rings.at(-1);
  for (let k = 1; k <= 24; k++) {
    const t = k / 24;
    rings.push(neckStart.map((p, i) => p.clone().lerp(sphereRing[i], t)));
  }
  for (let k = 1; k < 64; k++) {
    const a = alpha + (k / 64) * (Math.PI - alpha);
    rings.push(
      opening.angles.map((angle) =>
        center
          .clone()
          .addScaledVector(normal, rz * Math.cos(a))
          .addScaledVector(axisU, rx * Math.sin(a) * Math.cos(angle))
          .addScaledVector(axisV, rx * Math.sin(a) * Math.sin(angle)),
      ),
    );
  }
  rings.push([center.clone().addScaledVector(normal, -rz)]);
  const thickness = (i) => {
    const row = Math.floor(i / opening.rim.length);
    return T.MathUtils.lerp(
      0.04,
      0.018 * scale,
      T.MathUtils.smoothstep(row, 0, 24),
    );
  };
  membraneFaces(
    g,
    loftRings(rings, opening.normals),
    "#a1c6d0",
    "paraContractile",
    "contractileMembrane",
    { thickness, opacity: 0.7, openingId: opening.id },
  );
  g.userData.scienceTopology = {
    junction: openingRecord(opening),
    vacuoleCenter: center.toArray(),
    lumenAxis: [opening.center.toArray(), center.toArray()],
  };
  g.userData.partAnchors = {
    paraRadial: center
      .clone()
      .add(V(0.75 * scale, 0.55 * scale, 0))
      .toArray(),
  };
  g.userData.landmarks = [
    {
      zh: "皮层排水口",
      en: "Cortical discharge pore",
      position: opening.center.toArray(),
    },
    { zh: "中央伸缩泡", en: "Central vacuole", position: center.toArray() },
  ];
  return g;
}
function trichocyst() {
  const g = new T.Group();
  ball(g, [0, 0, 0], [0.22, 1, 0.19], "#b8bca3", "paraTrichocysts", {
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
  });
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU;
    tube(
      g,
      Array.from({ length: 26 }, (_, i) => {
        const t = i / 25;
        return V(
          0.11 * Math.sin(t * Math.PI) * Math.cos(a),
          -1 + 2 * t,
          0.09 * Math.sin(t * Math.PI) * Math.sin(a),
        );
      }),
      0.012,
      "#a4ad92",
      "paraTrichocysts",
    );
  }
  tube(
    g,
    [
      [0, 0.93, 0],
      [0, 1.1, 0],
      [0, 1.2, 0],
    ],
    0.03,
    "#adb399",
    "paraTrichocysts",
  );
  return g;
}
function mitochondrion() {
  const g = new T.Group();
  shell(g, [0.66, 1.15, 0.48], 0.04, "#c1a48f", "paraMito", { opacity: 0.65 });
  const radii = [0.58, 1.06, 0.4],
    pointAt = (u, v) => ellipticalPoint(radii, u, v, Math.PI / 2);
  const holes = Array.from({ length: 11 }, (_, j) => {
    const y = -0.84 + j * 0.165,
      side = j % 2 ? 1 : -1;
    const u = Math.acos(y / radii[1]);
    const x =
      side * Math.sqrt(1 - (y / radii[1]) ** 2 - (0.08 / radii[2]) ** 2);
    const v = (Math.atan2(-0.08 / radii[2], x) - Math.PI / 2 + TAU) % TAU;
    const du = pointAt(u + 0.001, v).distanceTo(pointAt(u - 0.001, v)) / 0.002;
    const dv = pointAt(u, v + 0.001).distanceTo(pointAt(u, v - 0.001)) / 0.002;
    return {
      id: `crista${j}`,
      center: [u, v],
      radii: [0.07 / du, 0.07 / dv],
      y,
      side,
    };
  });
  const { geometry, openings } = perforatedSurface(pointAt, holes, {
    uSegments: 144,
    vSegments: 160,
  });
  const cut = (p) => p[2] - radii[2] * Math.cos(1.15);
  const faces = ["intermembraneSpace", "matrix"];
  membraneFaces(g, geometry, "#d0b38a", "paraMito", "innerBoundaryMembrane", {
    opacity: 0.45,
    thickness: 0.025,
    cut,
    faceNames: faces,
  });
  const cutRim = tube(
    g,
    Array.from({ length: 113 }, (_, i) =>
      surfacePoint(1.15, (i / 112) * TAU, radii),
    ),
    0.013,
    "#d0b38a",
    "paraMito",
  );
  Object.assign(cutRim.userData, {
    cutOnly: true,
    topologyRole: "innerMembraneCutRim",
  });
  const junctions = [];
  for (const opening of openings.values()) {
    const rings = [],
      [u0, v0] = opening.definition.center;
    const { y, side } = opening.definition,
      normal = opening.normal;
    const lumenRadius = 0.027,
      lipDepth = 0.07 - lumenRadius;
    for (let k = 0; k <= 24; k++) {
      const a = ((k / 24) * Math.PI) / 2;
      const scale = 1 - (1 - lumenRadius / 0.07) * Math.sin(a);
      const depth = lipDepth * (1 - Math.cos(a));
      rings.push(
        opening.uv.map(([u, v]) =>
          pointAt(u0 + (u - u0) * scale, v0 + (v - v0) * scale).addScaledVector(
            normal,
            -depth,
          ),
        ),
      );
    }
    const start = opening.center.clone().addScaledVector(normal, -lipDepth);
    const end = V(-side * 0.13, y + 0.1, 0.07);
    const curve = new T.CatmullRomCurve3([
      start,
      start.clone().addScaledVector(normal, -0.09),
      V(opening.center.x * 0.48, y + 0.028, 0),
      V(0, y + 0.063, 0.04),
      end,
    ]);
    const axis = normal.clone().negate();
    const axisU = pointAt(u0 + 0.001, v0)
      .sub(pointAt(u0 - 0.001, v0))
      .normalize();
    const axisV = axis.clone().cross(axisU).normalize();
    const initial = rings.at(-1).map((p) => p.clone().sub(start));
    const path = [
      opening.center.clone().addScaledVector(normal, 0.015),
      opening.center.clone(),
      start,
    ];
    for (let k = 1; k <= 64; k++) {
      const t = k / 64,
        center = curve.getPoint(t),
        q = new T.Quaternion().setFromUnitVectors(axis, curve.getTangent(t));
      const blend = T.MathUtils.smoothstep(t, 0, 0.16);
      rings.push(
        opening.angles.map((a, i) =>
          initial[i]
            .clone()
            .lerp(
              axisU
                .clone()
                .multiplyScalar(lumenRadius * Math.cos(a))
                .addScaledVector(axisV, lumenRadius * Math.sin(a)),
              blend,
            )
            .applyQuaternion(q)
            .add(center),
        ),
      );
      path.push(center);
    }
    const endAxis = curve.getTangent(1),
      q = new T.Quaternion().setFromUnitVectors(axis, endAxis);
    for (let k = 1; k < 16; k++) {
      const a = ((k / 16) * Math.PI) / 2;
      rings.push(
        opening.angles.map((angle) =>
          axisU
            .clone()
            .multiplyScalar(lumenRadius * Math.cos(a) * Math.cos(angle))
            .addScaledVector(axisV, lumenRadius * Math.cos(a) * Math.sin(angle))
            .applyQuaternion(q)
            .add(end)
            .addScaledVector(endAxis, lumenRadius * Math.sin(a)),
        ),
      );
    }
    rings.push([end.clone().addScaledVector(endAxis, lumenRadius)]);
    const thickness = (i) =>
      T.MathUtils.lerp(
        0.025,
        0.018,
        T.MathUtils.smoothstep(Math.floor(i / opening.rim.length), 0, 24),
      );
    membraneFaces(
      g,
      loftRings(rings, opening.normals),
      "#c8aa7d",
      "paraMito",
      "tubularCristaMembrane",
      {
        thickness,
        opacity: 0.86,
        cut,
        openingId: opening.id,
        faceNames: faces,
      },
    );
    junctions.push({
      ...openingRecord(opening),
      lumenRadius,
      lumenPath: path.map((p) => p.toArray()),
    });
  }
  g.userData.scienceTopology = {
    cristaJunctions: junctions,
    cristaLumen: "continuous with intermembrane space",
  };
  g.userData.landmarks = [
    {
      zh: "管状嵴（示意）",
      en: "Tubular cristae (schematic)",
      position: [0.15, 0.4, 0.04],
    },
  ];
  return g;
}
function paramecium() {
  const g = surface();
  const openings = g.userData.membraneOpenings;
  ciliaOnBody(g);
  place(
    g,
    nucleus("paraMacro", { elongated: true, nucleoli: 4 }),
    "paraMacro",
    [-0.2, 0.08, 0.14],
    0.57,
    [0, 0, -0.55],
  );
  place(
    g,
    nucleus("paraMicro", { nucleoli: 0 }),
    "paraMicro",
    [0.3, 0.6, 0.25],
    0.2,
  );
  place(g, oral(openings.get("oral"), true), "paraOral", [0, 0, 0], 1);
  for (const id of ["contractile0", "contractile1"])
    place(g, contractile(openings.get(id)), "paraContractile", [0, 0, 0], 1);
  for (const [x, y, z, s] of [
    [-0.5, 0.89, 0.21, 0.22],
    [0.46, -0.68, 0.21, 0.3],
    [-0.56, -0.6, 0.21, 0.25],
    [0.28, 1.05, -0.26, 0.18],
  ])
    place(
      g,
      vesicle("paraFood", "#c6b498", { cargo: true }),
      "paraFood",
      [x, y, z],
      s,
    );
  // Copies share immutable membrane geometry; every copy still has the same
  // complete set of eleven connected cristae at the full detail resolution.
  const mitochondrialTemplate = mitochondrion();
  for (let i = 0; i < 12; i++) {
    const y = -1.7 + i * 0.29,
      x =
        (i % 2 ? 1 : -1) *
        (i === 1 ? 0.66 : 0.82) *
        Math.sqrt(1 - (y / 2.6) ** 2);
    place(g, mitochondrialTemplate.clone(), "paraMito", [x, y, -0.16], 0.13, [
      0,
      0,
      i,
    ]);
  }
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * TAU,
      p = bodyPoint(1.8, a).multiplyScalar(0.8);
    const m = place(g, trichocyst(), "paraTrichocysts", p.toArray(), 0.14);
    m.quaternion.setFromUnitVectors(
      V(0, 1, 0),
      V(p.x / 1.18 ** 2, p.y / 2.55 ** 2, p.z / 0.78 ** 2).normalize(),
    );
  }
  g.userData.partAnchors = {
    paraSurface: [-1, 1, 0],
    paraCilia: [1.24, 0.1, 0.04],
    paraOral: openings.get("oral").center.toArray(),
    paraFood: [0.46, -0.68, 0.4],
    paraContractile: openings
      .get("contractile1")
      .center.clone()
      .addScaledVector(openings.get("contractile1").normal, -0.3)
      .toArray(),
    paraMacro: [-0.3, 0.13, 0.4],
    paraMicro: [0.3, 0.6, 0.4],
    paraTrichocysts: [-0.9, -0.4, 0],
    paraMito: [0.6, -1.4, 0.1],
  };
  return g;
}
// Paramecium nuclear-envelope evidence and the schematic limits are recorded in
// parameciumNuclearSources in catalog/microbes.js. No animal lamina is added.
function nuclearAssembly(id) {
  const macro = id === "paraMacro";
  return nucleus(id, {
    elongated: macro,
    nucleoli: macro ? 4 : 0,
    parts: {
      envelope: `${id}Envelope`,
      pores: `${id}Pores`,
      chromatin: `${id}Chromatin`,
      ...(macro ? { nucleoli: `${id}Nucleoli` } : {}),
    },
  });
}
function nuclearEnvelopePatch(id) {
  const g = new T.Group(),
    shape = new T.Shape();
  shape.moveTo(-1.32, -0.8);
  shape.lineTo(1.32, -0.8);
  shape.quadraticCurveTo(1.45, -0.8, 1.45, -0.67);
  shape.lineTo(1.45, 0.67);
  shape.quadraticCurveTo(1.45, 0.8, 1.32, 0.8);
  shape.lineTo(-1.32, 0.8);
  shape.quadraticCurveTo(-1.45, 0.8, -1.45, 0.67);
  shape.lineTo(-1.45, -0.67);
  shape.quadraticCurveTo(-1.45, -0.8, -1.32, -0.8);
  const hole = new T.Path();
  hole.absarc(0, 0, 0.3, 0, TAU, true);
  shape.holes.push(hole);
  for (const [z, color] of [
    [0.135, "#ac97bd"],
    [-0.135, "#c5b1d4"],
  ]) {
    const geo = new T.ExtrudeGeometry(shape, {
      depth: 0.025,
      bevelEnabled: false,
      curveSegments: 64,
    });
    geo.translate(0, 0, z - 0.0125);
    addMesh(g, geo, color, id);
  }
  // A curved annulus joins the two membranes while retaining an open channel.
  const profile = Array.from({ length: 33 }, (_, i) => {
    const a = (i / 32) * Math.PI;
    return new T.Vector2(0.3 - 0.055 * Math.sin(a), 0.135 * Math.cos(a));
  });
  const join = new T.LatheGeometry(profile, 80);
  join.rotateX(Math.PI / 2);
  addMesh(g, join, "#b69dc7", id);
  g.rotation.set(-0.34, -0.42, 0.06);
  g.userData.landmarks = [
    { zh: "外核膜", en: "Outer nuclear membrane", position: [-0.9, 0.4, 0.15] },
    {
      zh: "内核膜",
      en: "Inner nuclear membrane",
      position: [0.9, -0.4, -0.15],
    },
    { zh: "核周隙", en: "Perinuclear space", position: [1.3, 0, 0] },
    {
      zh: "核孔处膜连续",
      en: "Membrane continuity at a pore",
      position: [0.29, 0, 0],
    },
  ];
  return g;
}
function nuclearPoreDetail(id) {
  // Conserved architectural schematic, not species-specific nucleoporin coordinates.
  const g = poreComplex();
  g.traverse((m) => {
    if (m.isMesh) m.userData.hitId = id;
  });
  return g;
}
function nuclearChromatinDetail(id) {
  const g = chromatinDetail("chromatin");
  g.traverse((m) => {
    if (m.isMesh) m.userData.hitId = id;
  });
  g.userData.landmarks = [
    { zh: "DNA与组蛋白", en: "DNA and histones", position: [-0.55, 1.12, 0.2] },
    { zh: "连接DNA", en: "Linker DNA", position: [0.1, 1.04, 0.1] },
  ];
  return g;
}
function nucleolarCondensate(id) {
  const g = new T.Group();
  // Magnified fibrogranular condensate; no membrane or mammalian tripartite
  // compartments are implied. Texture densities and individual counts are illustrative.
  for (let k = 0; k < 18; k++) {
    const center = V(
        Math.cos(k * 2.399) * 0.43,
        Math.sin(k * 2.399) * 0.35,
        ((k % 5) - 2) * 0.14,
      ),
      points = Array.from({ length: 55 }, (_, i) => {
        const t = i / 54;
        return center
          .clone()
          .add(
            V(
              0.3 * Math.sin(t * 7.4 + k * 0.7),
              0.24 * Math.cos(t * 9.3 + k * 0.4),
              0.23 * Math.sin(t * 6.2 + k),
            ),
          );
      });
    tube(g, points, 0.018, k % 2 ? "#ac91b9" : "#967aa9", id);
  }
  for (let i = 0; i < 260; i++) {
    const z = 1 - (2 * (i + 0.5)) / 260,
      angle = i * 2.399963,
      radius = 0.28 + 0.58 * Math.cbrt((((i * 73) % 260) + 0.5) / 260),
      radial = Math.sqrt(1 - z * z),
      p = V(
        Math.cos(angle) * radial * radius,
        Math.sin(angle) * radial * radius * 0.83,
        z * radius * 0.73,
      ),
      size = 0.023 + (0.008 * (i % 5)) / 4,
      m = addMesh(
        g,
        new T.SphereGeometry(size, 14, 10),
        i % 3 ? "#bda6c9" : "#a98cba",
        id,
      );
    m.position.copy(p);
  }
  g.rotation.set(0.14, -0.18, 0);
  g.userData.landmarks = [
    {
      zh: "纤维状成分（示意）",
      en: "Fibrillar material (schematic)",
      position: [-0.35, 0.25, 0.18],
    },
    {
      zh: "颗粒状成分（示意）",
      en: "Granular material (schematic)",
      position: [0.5, -0.12, 0.3],
    },
  ];
  return g;
}
// Shared schematic components retain taxon-specific IDs and descriptions.
export function microbeNucleusPart(id, kind) {
  if (kind === "envelope") return nuclearEnvelopePatch(id);
  if (kind === "pores") return nuclearPoreDetail(id);
  if (kind === "chromatin") return nuclearChromatinDetail(id);
  if (kind === "nucleolus") {
    const g = nucleolarCondensate(id);
    if (id === "yeastNucleolus") {
      // Yeast EM identifies an envelope-associated crescent; bending the same
      // fibrogranular aggregate preserves detail without adding a false shell.
      const crescent = (p) => {
        const angle = p.y * 1.7,
          radius = 0.67 + p.x * 0.33;
        return V(
          radius * Math.cos(angle) - 0.48,
          radius * Math.sin(angle),
          p.z * 0.78,
        );
      };
      for (const m of g.children) {
        m.updateMatrix();
        const positions = m.geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const p = crescent(
            V().fromBufferAttribute(positions, i).applyMatrix4(m.matrix),
          );
          positions.setXYZ(i, p.x, p.y, p.z);
        }
        m.position.set(0, 0, 0);
        m.quaternion.identity();
        m.scale.set(1, 1, 1);
        m.geometry.computeVertexNormals();
      }
      g.userData.landmarks = g.userData.landmarks.map((mark) => ({
        ...mark,
        position: crescent(V(...mark.position)).toArray(),
      }));
    }
    return g;
  }
  return null;
}
export function parameciumDetail(id) {
  switch (id) {
    case "paramecium":
      return paramecium();
    case "paraSurface":
      return surface();
    case "paraCilia":
      return cilia();
    case "paraAxoneme":
      return axoneme();
    case "paraOral":
      return oral();
    case "paraFood":
      return vesicle(id, "#c7af90", { cargo: true });
    case "paraContractile":
      return contractile();
    case "paraRadial":
      return radial();
    case "paraMacro":
    case "paraMicro":
      return nuclearAssembly(id);
    case "paraMacroEnvelope":
    case "paraMicroEnvelope":
      return nuclearEnvelopePatch(id);
    case "paraMacroPores":
    case "paraMicroPores":
      return nuclearPoreDetail(id);
    case "paraMacroChromatin":
    case "paraMicroChromatin":
      return nuclearChromatinDetail(id);
    case "paraMacroNucleoli":
      return microbeNucleusPart(id, "nucleolus");
    case "paraTrichocysts":
      return trichocyst();
    case "paraMito":
      return mitochondrion();
    default:
      return null;
  }
}
