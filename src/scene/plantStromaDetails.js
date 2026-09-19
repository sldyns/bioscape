import * as T from "three";
import { V, TAU, ball, tube, addMesh } from "./specimenGeometry";

// Backbone-scale DNA, with a transported frame so coils do not flatten in depth.
export function duplex(g, points, id, radius = 0.027, closed = false) {
  const curve = new T.CatmullRomCurve3(
    points.map((p) => (Array.isArray(p) ? V(...p) : p)),
    closed,
  );
  const n = Math.max(96, Math.ceil((curve.getLength() / radius) * 3)),
    frames = curve.computeFrenetFrames(n, closed);
  const strands = [[], []];
  for (let i = 0; i <= n; i++) {
    const p = curve.getPointAt(i / n),
      a =
        (i / n) *
        (closed
          ? Math.round(((curve.getLength() / radius) * 1.6) / TAU) * TAU
          : (curve.getLength() / radius) * 1.6);
    const offset = frames.normals[i]
      .clone()
      .multiplyScalar(Math.cos(a) * radius)
      .addScaledVector(frames.binormals[i], Math.sin(a) * radius);
    strands[0].push(p.clone().add(offset));
    strands[1].push(p.clone().sub(offset));
    if (i % 5 === 0) {
      const d = offset.clone().multiplyScalar(2),
        m = addMesh(
          g,
          new T.CylinderGeometry(radius * 0.12, radius * 0.12, d.length(), 6),
          "#bfbbc7",
          id,
        );
      m.position.copy(p);
      m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize());
    }
  }
  for (let s = 0; s < 2; s++)
    tube(
      g,
      closed ? strands[s].slice(0, -1) : strands[s],
      radius * 0.24,
      s ? "#aaa0bc" : "#8c9daa",
      id,
      closed,
    );
}
export function plastidNucleoid() {
  const g = new T.Group();
  let proteinAnchor;
  for (let j = 0; j < 3; j++) {
    const p = [];
    for (let i = 0; i <= 90; i++) {
      const t = (i / 90) * TAU * 1.9,
        a = t + j * 2;
      p.push(
        V(
          Math.sin(a) * (0.37 + 0.1 * Math.sin(t * 2.1)) + 0.25 * (j - 1),
          Math.cos(a) * 0.39 + 0.16 * Math.sin(t * 0.7),
          0.2 * Math.sin(t * 1.73 + j) + 0.035 * j,
        ),
      );
    }
    duplex(g, p, "plastidDNA", 0.024);
    // Bind the schematic proteins to actual points on the duplex backbone,
    // rather than distributing unrelated floating beads around the nucleoid.
    for (const i of [12, 32, 56, 77]) {
      const position = p[i].toArray();
      proteinAnchor ??= position;
      ball(g, position, [0.051, 0.043, 0.037], "#b9b69c", "plastidDNA");
    }
  }
  g.userData.landmarks = [
    {
      zh: "压缩的双链DNA片段",
      en: "Compacted double-stranded DNA segments",
      position: [0.48, 0.17, 0.2],
    },
    {
      zh: "DNA结合蛋白（示意）",
      en: "DNA-associated proteins (schematic)",
      position: proteinAnchor,
    },
  ];
  g.rotation.set(0.12, -0.2, 0.08);
  return g;
}
function subunit(g, p, scale, color, id, seed) {
  const body = ball(g, p, scale, color, id);
  const a = body.geometry.attributes.position;
  for (let i = 0; i < a.count; i++) {
    const r =
      1 + 0.07 * Math.sin(a.getX(i) * 9 + seed) * Math.cos(a.getY(i) * 7);
    a.setXYZ(i, a.getX(i) * r, a.getY(i) * r, a.getZ(i) * r);
  }
  body.geometry.computeVertexNormals();
  for (let j = 0; j < 4; j++)
    tube(
      g,
      Array.from({ length: 22 }, (_, i) => {
        const t = (i / 21) * Math.PI * 1.6 - 1.2;
        return V(
          p[0] + scale[0] * Math.sin(t) * 0.91,
          p[1] + scale[1] * Math.cos(t) * 0.8,
          p[2] + scale[2] * (0.6 + (j - 1.5) * 0.16),
        );
      }),
      0.008,
      "#a5aa83",
      id,
    );
}
export function rubiscoAssembly() {
  const g = new T.Group();
  for (const side of [-1, 1])
    for (let k = 0; k < 4; k++) {
      const a = (k * TAU) / 4 + Math.PI / 4;
      subunit(
        g,
        [Math.cos(a) * 0.37, side * 0.19, Math.sin(a) * 0.37],
        [0.26, 0.27, 0.24],
        side > 0 ? "#a2b18a" : "#8f9f7d",
        "rubisco",
        k + side,
      );
      subunit(
        g,
        [Math.cos(a + 0.22) * 0.32, side * 0.52, Math.sin(a + 0.22) * 0.32],
        [0.155, 0.12, 0.145],
        "#c5b69c",
        "rubisco",
        k,
      );
    }
  g.userData.landmarks = [
    {
      zh: "8个大亚基 · 催化核心",
      en: "8 large subunits · Catalytic core",
      position: [0.46, 0.18, 0.3],
    },
    {
      zh: "8个小亚基 · 两端分布",
      en: "8 small subunits · Two end caps",
      position: [0.32, 0.54, 0.1],
    },
  ];
  g.rotation.set(0.35, -0.3, 0.08);
  return g;
}
export function stromaAssembly() {
  const g = new T.Group();
  const dna = plastidNucleoid();
  dna.position.set(-0.57, 0.02, 0.15);
  dna.scale.setScalar(0.65);
  g.add(dna);
  for (const [p, s, a] of [
    [[0.54, 0.27, 0.04], 0.55, 0.2],
    [[0.51, -0.44, -0.12], 0.31, -0.4],
    [[-0.42, -0.57, -0.24], 0.23, 0.6],
  ]) {
    const r = rubiscoAssembly();
    r.position.set(...p);
    r.scale.setScalar(s);
    r.rotation.z = a;
    g.add(r);
  }
  g.userData.partAnchors = {
    plastidDNA: [-0.57, 0.09, 0.24],
    rubisco: [0.55, 0.3, 0.1],
  };
  g.userData.landmarks = [
    {
      zh: "水相基质 · 并非类囊体腔",
      en: "Aqueous stroma · Not thylakoid lumen",
      position: [0, 0.65, 0],
    },
  ];
  return g;
}
