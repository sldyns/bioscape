import * as THREE from "three";

const id = "plantCytoplasm";
const tau = 2 * Math.PI;
const lengthSteps = 52,
  outerSteps = 84,
  strandSteps = 36;
const sectionW = 0.5;

// Normalized coordinates across a schematic vacuolated Arabidopsis mesophyll
// cell. The curved end walls, the cortical layer and the two tunnel mouths
// use this same mapping. No particular cell, strand count or size is fitted.
function location(u, v, w, outer = false) {
  const end = u ** 4;
  const lateral = 1 + 0.091 * Math.cos(3.4 * u + 0.2) - 0.22 * end;
  const depth = 1 - 0.2 * end + 0.032 * Math.sin(3.1 * u);
  const cortex = outer ? 1.148 : 1;
  return [
    u * (1.75 + (outer ? 0.17 : 0) + 0.17 * (1 - v * v - w * w)) +
      0.1 * v +
      0.036 * w,
    1.2 * v * lateral * cortex + 0.14 * Math.sin(2.13 * u) + 0.046 * u * w,
    0.91 * w * depth * cortex + 0.07 * u * v - 0.075 * Math.sin(2.56 * u),
  ];
}

function strand(u, which) {
  const t = (u + 1) / 2,
    flare = u ** 8;
  return which === 0
    ? {
        v: -0.5 + 0.94 * t + 0.27 * Math.sin(tau * t),
        w: 0.163 - 0.071 * Math.cos(tau * t),
        a: 0.121 + 0.132 * flare,
        b: 0.142 + 0.112 * flare,
      }
    : {
        v:
          0.49 -
          0.94 * t +
          0.245 * Math.sin(Math.PI * t) -
          0.055 * Math.sin(3 * Math.PI * t),
        w: -0.297 - 0.102 * Math.sin(Math.PI * t),
        a: 0.084 + 0.112 * flare,
        b: 0.105 + 0.114 * flare,
      };
}

function strandSection(u, which, theta, fraction = 1) {
  const { v, w, a, b } = strand(u, which);
  return [
    v + fraction * a * Math.cos(theta),
    w + fraction * b * Math.sin(theta),
  ];
}
const coatSection = (u, theta) => [Math.cos(theta), Math.sin(theta)];
const unitAt = (i) => -1 + (2 * i) / lengthSteps;
const front = (t) => Math.sin(t) > sectionW;
const circular = (i, n) => ((i % n) * tau) / n;

// All faces of a membrane use one normal field. Material and cutaway groups
// can then move through the existing single-material worker format.
function surfaceBuilder(group, materials, outer = false) {
  const positions = [],
    triangles = [],
    keys = [],
    vertices = new Map();
  function point(u, v, w) {
    const key = [u, v, w].map((n) => Math.round(n * 1e7)).join("/");
    if (vertices.has(key)) return vertices.get(key);
    const i = positions.length / 3;
    positions.push(...location(u, v, w, outer));
    vertices.set(key, i);
    return i;
  }
  function face(a, b, c, tag) {
    triangles.push(a, b, c);
    keys.push(tag);
  }
  function finish() {
    const source = new THREE.BufferGeometry();
    source.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    source.setIndex(triangles);
    source.computeVertexNormals();
    const normals = source.getAttribute("normal");
    const bins = new Map();
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (!bins.has(key))
        bins.set(key, { positions: [], normals: [], ix: [], map: new Map() });
      const bin = bins.get(key);
      for (const original of triangles.slice(3 * i, 3 * i + 3)) {
        let local = bin.map.get(original);
        if (local === undefined) {
          local = bin.map.size;
          bin.map.set(original, local);
          bin.positions.push(
            positions[3 * original],
            positions[3 * original + 1],
            positions[3 * original + 2],
          );
          bin.normals.push(
            normals.getX(original),
            normals.getY(original),
            normals.getZ(original),
          );
        }
        bin.ix.push(local);
      }
    }
    for (const [key, bin] of bins) {
      const g = new THREE.BufferGeometry();
      g.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(bin.positions, 3),
      );
      g.setAttribute(
        "normal",
        new THREE.Float32BufferAttribute(bin.normals, 3),
      );
      g.setIndex(bin.ix);
      const [material, mode] = materials[key];
      add(group, g, material, mode);
    }
    source.dispose();
  }
  return { point, face, finish };
}

function add(group, geometry, material, mode) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = material.name;
  mesh.userData.hitId = id;
  if (mode) mesh.userData[mode] = true;
  group.add(mesh);
  return mesh;
}

function shellSide(s, circle, slices, tags, reverse = false) {
  let previous;
  for (let i = 0; i <= lengthSteps; i++) {
    const u = unitAt(i),
      row = [];
    for (let j = 0; j < slices; j++) {
      const [v, w] = circle(u, circular(j, slices));
      row.push(s.point(u, v, w));
    }
    if (previous)
      for (let j = 0; j < slices; j++) {
        const k = (j + 1) % slices,
          tag = tags(front((tau * (j + 0.5)) / slices));
        const a = previous[j],
          b = previous[k],
          c = row[k],
          d = row[j];
        if (reverse) {
          s.face(a, c, b, tag);
          s.face(a, d, c, tag);
        } else {
          s.face(a, b, c, tag);
          s.face(a, c, d, tag);
        }
      }
    previous = row;
  }
}

const boundaryV = Math.sqrt(1 - sectionW ** 2);
const chordCount = 8;
function chord(i) {
  return [-boundaryV + (2 * boundaryV * i) / chordCount, sectionW];
}
function endPolygons() {
  const a = outerSteps / 12,
    b = (5 * outerSteps) / 12;
  const frontRing = [],
    rearRing = [];
  for (let j = a; j <= b; j++)
    frontRing.push(coatSection(0, circular(j, outerSteps)));
  for (let j = b; j <= outerSteps + a; j++)
    rearRing.push(coatSection(0, circular(j, outerSteps)));
  return [rearRing, frontRing];
}
const sections = endPolygons();

function endWall(s, u, hasTunnels, whichFront, tag) {
  const outline = sections[Number(whichFront)].map(
    ([v, w]) => new THREE.Vector2(v, w),
  );
  const holes = [];
  if (hasTunnels && !whichFront)
    for (let z = 0; z < 2; z++) {
      holes.push(
        Array.from({ length: strandSteps }, (_, j) => {
          const [v, w] = strandSection(u, z, circular(j, strandSteps));
          return new THREE.Vector2(v, w);
        }),
      );
    }
  let gridFaces = THREE.ShapeUtils.triangulateShape(outline, holes);
  const vertices = [...outline, ...holes.flat()];
  // Refine the dome across both sides of the window chord. Preserve the
  // circular boundary edges shared with the cell side and the two sleeves.
  const edgeKey = (i, j) => (i < j ? i + "/" + j : j + "/" + i);
  const boundary = new Set();
  for (let i = 1; i < outline.length; i++) boundary.add(edgeKey(i - 1, i));
  let start = outline.length;
  for (const hole of holes) {
    for (let i = 0; i < hole.length; i++)
      boundary.add(edgeKey(start + i, start + ((i + 1) % hole.length)));
    start += hole.length;
  }
  for (let pass = 0; pass < 4; pass++) {
    const mids = new Map();
    for (const face of gridFaces) {
      for (let i = 0; i < 3; i++) {
        const a = face[i],
          b = face[(i + 1) % 3],
          key = edgeKey(a, b);
        if (
          boundary.has(key) ||
          mids.has(key) ||
          vertices[a].distanceTo(vertices[b]) <= 0.275
        )
          continue;
        mids.set(key, vertices.length);
        vertices.push(vertices[a].clone().lerp(vertices[b], 0.5));
      }
    }
    if (mids.size === 0) break;
    const next = [];
    for (const face of gridFaces) {
      const middle = face.map((v, i) =>
        mids.get(edgeKey(v, face[(i + 1) % 3])),
      );
      const cuts = middle.filter((v) => v !== undefined).length;
      if (cuts === 0) {
        next.push(face);
        continue;
      }
      if (cuts === 3) {
        const [a, b, c] = face,
          [ab, bc, ca] = middle;
        next.push([a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]);
        continue;
      }
      // Rotate to split edge AB, and also BC for a pair of split edges.
      const first =
        cuts === 1
          ? middle.findIndex((v) => v !== undefined)
          : (middle.indexOf(undefined) + 1) % 3;
      const a = face[first],
        b = face[(first + 1) % 3],
        c = face[(first + 2) % 3];
      const ab = middle[first];
      next.push([a, ab, c]);
      if (cuts === 1) next.push([ab, b, c]);
      else {
        const bc = middle[(first + 1) % 3];
        next.push([ab, b, bc], [ab, bc, c]);
      }
    }
    gridFaces = next;
  }
  const ids = vertices.map((p) => s.point(u, p.x, p.y));
  for (const [i, j, k] of gridFaces) {
    const a = vertices[i],
      b = vertices[j],
      c = vertices[k];
    const cross = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (u * cross > 0) s.face(ids[i], ids[j], ids[k], tag);
    else s.face(ids[i], ids[k], ids[j], tag);
  }
}

function cutPerimeter() {
  const result = [];
  for (let i = 0; i <= lengthSteps; i++)
    result.push([unitAt(i), boundaryV, sectionW]);
  for (let j = chordCount - 1; j >= 0; j--) result.push([1, ...chord(j)]);
  for (let i = lengthSteps - 1; i >= 0; i--)
    result.push([unitAt(i), -boundaryV, sectionW]);
  for (let j = 1; j < chordCount; j++) result.push([-1, ...chord(j)]);
  return result;
}
function ribbon(group, a, b, material, mode, closed = false) {
  const p = [],
    ix = [];
  for (let i = 0; i < a.length; i++) {
    p.push(...a[i], ...b[i]);
    if (i + 1 < a.length || closed) {
      const j = (i + 1) % a.length;
      ix.push(2 * i, 2 * j, 2 * i + 1, 2 * j, 2 * j + 1, 2 * i + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  return add(group, g, material, mode);
}

function tube(group, points, r, material, steps = 52) {
  const curve = new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
  );
  return add(
    group,
    new THREE.TubeGeometry(curve, steps, r, 6, false),
    material,
  );
}

export function plantCytosol() {
  const g = new THREE.Group();
  g.name = "Leaf mesophyll cortical cytoplasm and transvacuolar strands";
  function paint(name, color, opacity = 1, roughness = 0.56) {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0,
      side: THREE.DoubleSide,
      transparent: opacity < 1,
      opacity,
      depthWrite: opacity === 1,
    });
    m.name = name;
    return m;
  }
  const membrane = paint("tonoplast · vacuolar wall", "#8ea6b3", 0.84);
  const frontWall = paint("tonoplast · anterior window", "#cbd8dd", 0.09);
  const tunnel = paint("tonoplast · strand wall", "#9caeb7", 0.83);
  const tunnelWindow = paint("tonoplast · strand window", "#cedbdf", 0.15);
  const intactWindow = paint(
    "tonoplast · intact strand window",
    "#c4d0d4",
    0.22,
  );
  const cortex = paint(
    "cortical cytoplasm · posterior boundary",
    "#c5b89e",
    0.66,
  );
  const cortexWindow = paint(
    "cortical cytoplasm · anterior window",
    "#dfd4bc",
    0.1,
  );
  const section = paint("cortical cytoplasm · exposed section", "#d0b994");
  const fluid = paint("strand cytoplasm · body", "#c3a377", 0.91);
  const fluidFront = paint(
    "strand cytoplasm · viewing window",
    "#d0b989",
    0.39,
  );
  const fiber = paint("cytoplasmic strands · actin bundles", "#8d7967");
  const rimMaterial = paint("tonoplast · cut edge", "#8299a7");
  const tonoplast = surfaceBuilder(g, {
    wall: [membrane],
    cap: [frontWall, "cap"],
    tunnel: [tunnel],
    window: [tunnelWindow, "cap"],
    intact: [intactWindow],
  });
  shellSide(tonoplast, coatSection, outerSteps, (f) => (f ? "cap" : "wall"));
  for (let i = 0; i < 2; i++)
    shellSide(
      tonoplast,
      (u, t) => strandSection(u, i, t),
      strandSteps,
      (f) => (f ? (i ? "intact" : "window") : "tunnel"),
      true,
    );
  for (const u of [-1, 1])
    for (const f of [false, true])
      endWall(tonoplast, u, true, f, f ? "cap" : "wall");
  tonoplast.finish();

  const skin = surfaceBuilder(
    g,
    { wall: [cortex], cap: [cortexWindow, "cap"] },
    true,
  );
  shellSide(skin, coatSection, outerSteps, (f) => (f ? "cap" : "wall"));
  for (const u of [-1, 1])
    for (const f of [false, true])
      endWall(skin, u, false, f, f ? "cap" : "wall");
  skin.finish();
  const circle = cutPerimeter();
  const inner = circle.map((p) => location(...p)),
    outer = circle.map((p) => location(...p, true));
  // A narrow dark cut edge identifies the membrane on the vacuolar side
  // of the broad sandy cortical section, without sealing a strand mouth.
  const edge = inner.map((p, i) =>
    p.map((v, j) => v + 0.085 * (outer[i][j] - v)),
  );
  ribbon(g, inner, edge, rimMaterial, "cutOnly", true);
  ribbon(g, edge, outer, section, "cutOnly", true);

  for (let i = 0; i < 2; i++) {
    const core = surfaceBuilder(g, {
      body: [fluid],
      window: i ? [fluidFront] : [fluidFront, "cap"],
    });
    shellSide(
      core,
      (u, t) => strandSection(u, i, t, 0.966),
      strandSteps,
      (f) => (f ? "window" : "body"),
    );
    core.finish();
    const lo = [],
      hi = [];
    for (let j = 0; j <= lengthSteps; j++) {
      const u = unitAt(j),
        p = strand(u, i),
        w = p.w + 0.966 * sectionW * p.b;
      lo.push(location(u, p.v - 0.966 * boundaryV * p.a, w));
      hi.push(location(u, p.v + 0.966 * boundaryV * p.a, w));
    }
    if (i === 0) ribbon(g, lo, hi, section, "cutOnly");
    // Representative actin cables stay within the cytoplasmic passage.
    // They continue into the cortex at both expanded mouths.
    for (const offset of [-0.31, 0.25]) {
      const points = [];
      const samples = Array.from({ length: 25 }, (_, j) => -1 + j / 12);
      for (const u of samples) {
        const p = strand(u, i),
          v = p.v + p.a * (offset + 0.063 * Math.sin(u * 6.1 + i)),
          w = p.w + 0.465 * p.b;
        points.push(location(u, v, w));
      }
      for (const end of [-1, 1]) {
        const p = strand(end, i),
          v = p.v + p.a * (offset + 0.063 * Math.sin(end * 6.1 + i)),
          w = p.w + 0.465 * p.b;
        const inside = location(end, v, w),
          outside = location(end, v, w, true);
        const join = inside.map((x, k) => x + 0.49 * (outside[k] - x));
        if (end < 0) points.unshift(join);
        else points.push(join);
      }
      tube(g, points, i ? 0.009 : 0.012, fiber, 64);
    }
  }

  // Three flattened chloroplast profiles mark the leaf-mesophyll cortex.
  // Their long axes follow the cell flank and their short axes fit in the
  // illustrated cortical depth. Their internal lamellae are schematic.
  const plastid = paint("cortical chloroplast · envelope", "#999d88", 0.7);
  const grana = paint("cortical chloroplast · lamellae", "#777e73");
  const sph = new THREE.SphereGeometry(1, 22, 14);
  const lamella = new THREE.SphereGeometry(1, 14, 8);
  for (const [u, theta] of [
    [-0.62, 0.17],
    [-0.24, 3.02],
    [0.52, 1.2],
  ]) {
    const v = Math.cos(theta),
      w = Math.sin(theta);
    const a = location(u, v, w),
      b = location(u, v, w, true),
      center = a.map((x, i) => (x + b[i]) / 2);
    const asVector = (p) => new THREE.Vector3(...p);
    const t = asVector(location(u + 0.001, v, w))
      .sub(asVector(location(u - 0.001, v, w)))
      .normalize();
    const thetaPoint = (delta) =>
      asVector(location(u, Math.cos(theta + delta), Math.sin(theta + delta)));
    const n = thetaPoint(0.001).sub(thetaPoint(-0.001)).cross(t).normalize();
    const side = new THREE.Vector3().crossVectors(t, n).normalize();
    const orientation = new THREE.Matrix4().makeBasis(t, n, side);
    const mode = w > sectionW ? "cap" : undefined;
    const body = add(g, sph, plastid, mode);
    body.position.fromArray(center);
    body.quaternion.setFromRotationMatrix(orientation);
    body.scale.set(0.232, 0.036, 0.105);
    for (let j = -1; j <= 1; j++) {
      const m = add(g, lamella, grana, mode);
      m.position
        .fromArray(center)
        .addScaledVector(t, j * 0.079)
        .addScaledVector(n, 0.023 * (1 - Math.abs(j) * 0.1));
      m.quaternion.copy(body.quaternion);
      m.scale.set(0.025, 0.006, 0.052);
    }
  }

  const cortexIndex = 10;
  const landmarkCortex = inner[cortexIndex].map(
    (x, i) => (x + outer[cortexIndex][i]) / 2,
  );
  const u = unitAt(18),
    c = strand(u, 0);
  g.userData.landmarks = [
    { zh: "周边细胞质层", en: "Cortical cytoplasm", position: landmarkCortex },
    {
      zh: "跨液泡细胞质索",
      en: "Transvacuolar cytoplasmic strand",
      position: location(u, c.v, c.w + 0.966 * sectionW * c.b),
    },
    {
      zh: "索根部的连续液泡膜",
      en: "Continuous tonoplast at a strand mouth",
      position: location(1, ...strandSection(1, 1, Math.PI / 3)),
    },
    {
      zh: "液泡腔（细胞液）",
      en: "Vacuolar lumen (cell sap)",
      position: location(-0.06, 0.47, -0.05),
      annotationKind: "context",
    },
  ];
  return g;
}
