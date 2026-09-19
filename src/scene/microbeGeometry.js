import * as T from "three";
import { splitSection } from "./implicitMembrane";
import {
  V,
  TAU,
  ball,
  tube,
  ring,
  shell,
  surfacePoint,
  addMesh,
} from "./specimenGeometry";
export { V, TAU, ball, tube, ring, shell, surfacePoint, addMesh };
export function texturedShell(
  g,
  r,
  thickness,
  color,
  id,
  { opacity = 0.62, rows = 20 } = {},
) {
  shell(g, r, thickness, color, id, { opacity, cut: 1.18 });
  for (let j = 0; j < rows; j++)
    for (let k = 0; k < 28; k++) {
      const theta = 0.18 + (j / (rows - 1)) * (Math.PI - 0.36),
        a = (TAU * (k + 0.5 * (j % 2))) / 28;
      const p = surfacePoint(
        theta,
        a,
        r.map((x) => x + 0.012),
      );
      const m = ball(g, p.toArray(), [0.027, 0.021, 0.018], color, id);
      if (theta < 1.18) m.userData.cap = true;
    }
}
export function nucleus(
  id,
  { elongated = false, nucleoli = 1, parts = {} } = {},
) {
  const envelopeId = parts.envelope || id,
    poresId = parts.pores || id,
    chromatinId = parts.chromatin || id,
    nucleoliId = parts.nucleoli || id;
  const g = new T.Group(),
    r = elongated ? [1.15, 0.67, 0.57] : [0.9, 0.94, 0.75],
    cut = 1.18,
    inner = 0.94,
    poreAngle = 0.06,
    pores = Array.from({ length: 34 }, (_, i) => {
      const theta = Math.acos(1 - (2 * (i + 0.5)) / 34);
      return { theta, direction: surfacePoint(theta, i * 2.39996, [1, 1, 1]) };
    });
  // Perforate both envelope surfaces in the same spherical coordinates, then
  // apply one ellipsoidal transform to the membranes and their connecting rims.
  for (const radius of [1, inner])
    for (const cap of [false, true]) {
      const start = cap ? 0 : cut,
        end = cap ? cut : Math.PI,
        geo = new T.SphereGeometry(
          radius,
          256,
          Math.ceil((128 * (end - start)) / Math.PI),
          0,
          TAU,
          start,
          end - start,
        );
      geo.rotateX(Math.PI / 2);
      const positions = geo.attributes.position,
        source = geo.index.array,
        indices = [],
        center = V(),
        a = V(),
        b = V(),
        c = V();
      for (let i = 0; i < source.length; i += 3) {
        a.fromBufferAttribute(positions, source[i]);
        b.fromBufferAttribute(positions, source[i + 1]);
        c.fromBufferAttribute(positions, source[i + 2]);
        center.copy(a).add(b).add(c).normalize();
        if (
          !pores.some(
            ({ direction }) =>
              center.distanceToSquared(direction) < poreAngle ** 2,
          )
        )
          indices.push(source[i], source[i + 1], source[i + 2]);
      }
      geo.setIndex(indices);
      geo.scale(...r);
      geo.computeVertexNormals();
      const m = addMesh(g, geo, "#b5a0c4", envelopeId, {
        transparent: true,
        opacity: cap ? 0.64 * 0.52 : 0.64,
        depthWrite: false,
      });
      m.userData.cap = cap;
    }
  const edge = tube(
    g,
    Array.from({ length: 113 }, (_, i) =>
      surfacePoint(
        cut,
        (i / 112) * TAU,
        r.map((v) => (v * (1 + inner)) / 2),
      ),
    ),
    0.026,
    "#b5a0c4",
    envelopeId,
  );
  edge.userData.cutOnly = true;
  for (const { theta, direction } of pores) {
    const q = new T.Quaternion().setFromUnitVectors(V(0, 0, 1), direction),
      origin = direction
        .clone()
        .multiplyScalar(((1 + inner) / 2) * Math.cos(poreAngle));
    const conform = (geo, color, hit = envelopeId) => {
      geo.applyQuaternion(q);
      geo.translate(...origin.toArray());
      geo.scale(...r);
      if (Math.abs(theta - cut) < poreAngle + 0.025) {
        const [back, front] = splitSection(geo, (p) => {
          const x = p[0] / r[0],
            y = p[1] / r[1],
            z = p[2] / r[2];
          return z / Math.hypot(x, y, z) - Math.cos(cut);
        });
        addMesh(g, back, color, hit);
        addMesh(g, front, color, hit).userData.cap = true;
      } else {
        const m = addMesh(g, geo, color, hit);
        m.userData.cap = theta < cut;
      }
    };
    const collar = new T.CylinderGeometry(
      Math.sin(poreAngle),
      inner * Math.sin(poreAngle),
      (1 - inner) * Math.cos(poreAngle),
      32,
      1,
      true,
    );
    collar.rotateX(Math.PI / 2);
    conform(collar, "#b5a0c4");
    for (const radius of [1, inner]) {
      const ringGeo = new T.TorusGeometry(
        radius * Math.sin(poreAngle),
        0.014,
        12,
        48,
      );
      ringGeo.translate(0, 0, (radius - (1 + inner) / 2) * Math.cos(poreAngle));
      conform(ringGeo, "#9f87b3", poresId);
    }
  }
  const bodies =
    nucleoli === 1
      ? [{ center: V(-0.2, -0.22, 0.1), size: V(0.23, 0.2, 0.19) }]
      : Array.from({ length: nucleoli }, (_, i) => {
          const a = (i / nucleoli) * TAU;
          return {
            center: V(
              Math.cos(a) * r[0] * 0.43,
              Math.sin(a) * r[1] * 0.38,
              0.09,
            ),
            size: V(0.085, 0.073, 0.068),
          };
        });
  // Seven schematic chromatin paths express variable local packing, not seven
  // chromosomes. A seeded persistent walk avoids repeated sine-wave hoops.
  let seed = 0x73a5f19;
  const sample = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const direction = () =>
    V(sample() * 2 - 1, sample() * 2 - 1, sample() * 2 - 1).normalize();
  const confine = (point) => {
    // Keep centerlines away from nucleolar condensates and the inner membrane.
    for (const body of bodies) {
      const delta = point.clone().sub(body.center),
        clearance = body.size.clone().addScalar(0.045),
        distance = delta.clone().divide(clearance).length();
      if (distance < 1)
        point
          .copy(body.center)
          .add(delta.multiplyScalar(1 / Math.max(distance, 0.001)));
    }
    const normalized = V(point.x / r[0], point.y / r[1], point.z / r[2]);
    if (normalized.length() > 0.83)
      point.multiplyScalar(0.83 / normalized.length());
    return point;
  };
  for (let j = 0; j < 7; j++) {
    const walk = [],
      point = direction().multiplyScalar(0.38 + sample() * 0.27),
      velocity = direction(),
      bend = direction();
    for (let i = 0; i < 70; i++) {
      if (i % 6 === 0) bend.copy(direction());
      velocity.multiplyScalar(0.88).addScaledVector(bend, 0.29);
      if (point.length() > 0.62) velocity.addScaledVector(point, -0.34);
      velocity.normalize();
      point.addScaledVector(velocity, 0.069 + sample() * 0.025);
      if (point.length() > 0.81) point.setLength(0.81);
      walk.push(confine(V(point.x * r[0], point.y * r[1], point.z * r[2])));
    }
    // Project the smoothed path too, so turns do not cut through a nucleolus.
    const smooth = new T.CatmullRomCurve3(walk).getPoints(210).map(confine),
      curve = new T.CatmullRomCurve3(smooth),
      geometry = new T.TubeGeometry(curve, 210, 0.013, 10, false),
      positions = geometry.attributes.position;
    for (let i = 0; i <= 210; i++) {
      const t = i / 210,
        center = curve.getPointAt(t),
        endTaper = Math.min(1, 0.66 + Math.min(t, 1 - t) * 9),
        width = endTaper * (1 + 0.12 * Math.sin(t * 9.7 + j * 1.31));
      for (let k = 0; k <= 10; k++) {
        const index = i * 11 + k,
          p = V()
            .fromBufferAttribute(positions, index)
            .sub(center)
            .multiplyScalar(width)
            .add(center);
        positions.setXYZ(index, p.x, p.y, p.z);
      }
    }
    geometry.computeVertexNormals();
    addMesh(
      g,
      geometry,
      ["#a28db4", "#aa96bc", "#9782ab"][j % 3],
      chromatinId,
      {
        roughness: 0.64,
      },
    );
  }
  for (const [i, body] of bodies.entries()) {
    const m = ball(
        g,
        body.center.toArray(),
        body.size.toArray(),
        "#9c7da9",
        nucleoliId,
      ),
      positions = m.geometry.attributes.position;
    // Broad, smooth asymmetry suggests a condensate boundary without inventing
    // a membrane, shell, granular substructure, or molecular surface features.
    for (let k = 0; k < positions.count; k++) {
      const x = positions.getX(k),
        y = positions.getY(k),
        z = positions.getZ(k),
        scale = 1 + 0.07 * y + 0.065 * x * y + 0.04 * (z * z - 1 / 3);
      positions.setXYZ(k, x * scale, y * scale, z * scale);
    }
    m.geometry.computeVertexNormals();
    m.rotation.set(0.12 + i * 0.27, -0.23 + i * 0.41, 0.16);
    m.material.roughness = 0.67;
    m.material.clearcoat = 0.08;
  }
  g.userData.landmarks = [
    { zh: "核被膜", en: "Nuclear envelope", position: [r[0], 0, 0] },
    { zh: "染色质", en: "Chromatin", position: [0.25, 0.24, 0.2] },
  ];
  if (Object.keys(parts).length)
    g.userData.partAnchors = {
      [envelopeId]: [r[0] * 0.78, r[1] * 0.42, 0],
      [poresId]: pores[13].direction
        .clone()
        .multiply(V(...r))
        .toArray(),
      [chromatinId]: [-r[0] * 0.32, r[1] * 0.24, 0.14],
      ...(nucleoli ? { [nucleoliId]: bodies[0].center.toArray() } : {}),
    };
  return g;
}
export function vesicle(id, color, { cargo = false } = {}) {
  const g = new T.Group();
  shell(g, [1, 0.92, 0.8], 0.035, color, id, { opacity: 0.52 });
  if (cargo)
    for (let i = 0; i < 12; i++) {
      const a = i * 2.399,
        r = 0.17 + 0.035 * i;
      ball(
        g,
        [r * Math.cos(a), r * Math.sin(a), 0.15 * Math.sin(3 * a)],
        [0.09, 0.075, 0.07],
        i % 2 ? "#b9ad82" : "#c3a08d",
        id,
      );
    }
  return g;
}
export function hollowTube(g, id, r, length, color, inner = r * 0.65) {
  const shape = new T.Shape();
  shape.absarc(0, 0, r, 0, TAU, false);
  const hole = new T.Path();
  hole.absarc(0, 0, inner, 0, TAU, true);
  shape.holes.push(hole);
  const geo = new T.ExtrudeGeometry(shape, {
    depth: length,
    steps: 1,
    bevelEnabled: false,
    curveSegments: 48,
  });
  geo.translate(0, 0, -length / 2);
  geo.rotateX(Math.PI / 2);
  return addMesh(g, geo, color, id);
}
