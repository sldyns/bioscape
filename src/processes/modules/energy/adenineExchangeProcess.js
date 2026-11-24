import { THREE, bilingual as b, clamp, ease, sceneKit } from "../../kit.js";

const tau = Math.PI * 2;
const stages = [
  {
    at: 0,
    title: b("膜间隙侧迎接 ADP", "ADP approaches from the intermembrane space"),
    description: b(
      "初始视角中，上方是膜间隙，下方是线粒体基质。蓝色 ADP 靠近 ANT 朝膜间隙开放的凹腔，基质端仍然闭合。",
      "In the opening view the intermembrane space is above the inner membrane and the matrix below. Blue ADP approaches the outward-facing cavity while the matrix end is closed.",
    ),
  },
  {
    at: 0.15,
    title: b("ADP 进入中央结合区", "ADP reaches the central site"),
    description: b(
      "跟随带两个磷酸基团的 ADP 进入凹腔。它停在中央结合区，之后周围的螺旋向内收拢，关闭膜间隙端。",
      "Follow the two-phosphate ADP into the cavity. It stays at the central binding region as the surrounding helices draw together on the intermembrane-space side.",
    ),
  },
  {
    at: 0.34,
    title: b("朝基质开放，释放 ADP", "The matrix side opens and ADP leaves"),
    description: b(
      "膜间隙端已经闭合。基质端张开，蓝色 ADP 从同一结合区进入基质，在左下方离开载体。",
      "With the intermembrane-space end closed, the matrix side opens. Blue ADP leaves the shared site and moves away into the matrix at lower left.",
    ),
  },
  {
    at: 0.55,
    title: b("另一分子 ATP 从基质结合", "A separate ATP binds from the matrix"),
    description: b(
      "右下方橙色 ATP 已在基质中，带有三个磷酸基团。ADP 腾出结合区后，这个 ATP 从基质端进入并占据同一位置。",
      "Orange ATP is already present in the matrix at lower right. Its three phosphate groups distinguish it from ADP. Once ADP has left, ATP enters from the matrix and occupies the same site.",
    ),
  },
  {
    at: 0.7,
    title: b("载体带着 ATP 转向", "Access switches with ATP bound"),
    description: b(
      "橙色 ATP 暂留中央，基质端先收拢。经历两端均闭合的过渡后，结合区重新通向膜间隙。",
      "Orange ATP remains near the middle as the matrix end closes. A closed intermediate separates this state from the one that exposes the site to the intermembrane space.",
    ),
  },
  {
    at: 0.88,
    title: b(
      "ATP 释放到膜间隙",
      "ATP is released into the intermembrane space",
    ),
    description: b(
      "沿上方开口追踪离开的 ATP。一次交换把一个 ADP 送进基质、把另一个 ATP 送出基质，ANT 回到向膜间隙开放的状态。",
      "Follow ATP out through the upper opening. One ADP has entered the matrix and a separate ATP has left it. ANT ends this exchange facing the intermembrane space again.",
    ),
  },
];

// The x–z sheet has a frontal cutaway and an opening occupied by the protein.
function bilayer(k) {
  const heads = [],
    tails = [];
  const transform = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0);
  const direction = new THREE.Vector3();
  const faceAnchors = [];
  const surface = (x, z) => 0.045 * Math.sin(x * 0.8) * Math.cos(z * 1.1);
  function tail(a, b) {
    direction.subVectors(b, a);
    transform.position.addVectors(a, b).multiplyScalar(0.5);
    transform.scale.set(0.046, direction.length(), 0.046);
    transform.quaternion.setFromUnitVectors(up, direction.normalize());
    transform.updateMatrix();
    tails.push(transform.matrix.clone());
  }
  for (const side of [-1, 1])
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 19; col++) {
        const x =
          (col - 9) * 0.36 +
          (row % 2) * 0.15 +
          0.025 * Math.sin(row * 2.7 + col * 1.71 + side);
        const z =
          (row - 4) * 0.34 +
          (side < 0 ? 0.035 : 0) +
          0.023 * Math.cos(row * 1.19 - col * 2.31 + side);
        if (Math.hypot(x, z) < 1.32 || (z > 0.04 && Math.abs(x) < 1.48))
          continue;
        const middle = surface(x, z),
          y = middle + side * 0.77;
        if (row === 4 && col === (side > 0 ? 2 : 16))
          faceAnchors[side > 0 ? 0 : 1] = [x, y, z];
        transform.position.set(x, y, z);
        transform.quaternion.identity();
        transform.scale.set(0.137, 0.12, 0.133);
        transform.updateMatrix();
        heads.push(transform.matrix.clone());
        for (const offset of [-1, 1]) {
          const start = new THREE.Vector3(
            x + offset * 0.038,
            y - side * 0.075,
            z,
          );
          const knee = new THREE.Vector3(
            x + offset * 0.077,
            middle + side * 0.37,
            z + 0.045 * Math.sin(col * 1.2 + row),
          );
          const end = new THREE.Vector3(
            knee.x + offset * 0.039,
            middle - side * (0.014 + 0.023 * Math.sin(row + col + offset)),
            z - 0.045,
          );
          tail(start, knee);
          tail(knee, end);
        }
      }
  for (const [name, geometry, color, matrices] of [
    ["inner-membrane-heads", k.sphere, "#baa48d", heads],
    ["inner-membrane-tails", k.cylinder, "#c89e76", tails],
  ]) {
    const object = new THREE.InstancedMesh(
      geometry,
      k.material(color),
      matrices.length,
    );
    object.name = name;
    matrices.forEach((matrix, index) => object.setMatrixAt(index, matrix));
    object.instanceMatrix.needsUpdate = true;
    object.computeBoundingSphere();
    k.group.add(object);
  }
  return faceAnchors;
}

// Three endpoint surfaces share a mesh topology. Only one opening weight can
// be positive, so the transition always passes through the occluded shape.
function helixPoint(index, cytosolic, matrix, t) {
  const pole = 2 * t - 1,
    height = Math.abs(pole);
  const aperture = pole >= 0 ? cytosolic : matrix;
  const shoulder = height * height * (3 - 2 * height);
  const radius = 0.84 + shoulder * (0.47 + aperture * 0.72 - 0.84);
  const angle =
    (index * tau) / 6 +
    Math.PI / 6 +
    0.25 * pole +
    (index % 2 ? -0.065 : 0.065) * Math.sin(t * Math.PI);
  return new THREE.Vector3(
    radius * Math.cos(angle),
    pole * 1.28,
    radius * Math.sin(angle),
  );
}
function helixGeometry(index, cytosolic, matrix, ribbon) {
  const phi = (index * tau) / 6 + Math.PI / 6;
  const point = (t) => helixPoint(index, cytosolic, matrix, t);
  if (!ribbon) {
    const axis = new THREE.CatmullRomCurve3(
      Array.from({ length: 19 }, (_, i) => point(i / 18)),
    );
    return new THREE.TubeGeometry(axis, 28, 0.143, 12, false);
  }
  const vertices = [],
    indices = [],
    steps = 112;
  const cross = [
    [-0.016, -0.082],
    [0.016, -0.082],
    [0.016, 0.082],
    [-0.016, 0.082],
  ];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps,
      axis = point(t),
      turn = phi - tau * 5.75 * t;
    for (const [dr, dy] of cross) {
      const radius = 0.183 + dr;
      vertices.push(
        axis.x + Math.cos(turn) * radius,
        axis.y + dy,
        axis.z + Math.sin(turn) * radius,
      );
    }
    if (!i) continue;
    for (let side = 0; side < 4; side++) {
      const a = (i - 1) * 4 + side,
        b = (i - 1) * 4 + ((side + 1) % 4);
      indices.push(a, b, b + 4, a, b + 4, a + 4);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Five connecting loops join the six transmembrane spans of one polypeptide.
// Successive loops alternate between the two surfaces of the membrane.
function connectingLoop(index, cytosolic, matrix) {
  const t = index % 2,
    pole = t ? 1 : -1;
  const start = helixPoint(index, cytosolic, matrix, t),
    end = helixPoint(index + 1, cytosolic, matrix, t);
  const pts = Array.from({ length: 11 }, (_, i) => {
    const a = i / 10,
      bulge = Math.sin(Math.PI * a),
      p = start.clone().lerp(end, a);
    const radius = Math.hypot(p.x, p.z),
      extra = (t ? 0.15 : 0.25) * bulge;
    p.x *= (radius + extra) / radius;
    p.z *= (radius + extra) / radius;
    p.y += pole * (0.17 * bulge + 0.038 * Math.sin(3 * Math.PI * a));
    return p;
  });
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts),
    28,
    0.072,
    8,
    false,
  );
}
function conformations(build) {
  const geometry = build(0, 0),
    open = [build(1, 0), build(0, 1)];
  geometry.morphAttributes.position = open.map((g) => g.attributes.position);
  geometry.morphAttributes.normal = open.map((g) => g.attributes.normal);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function carrier(k) {
  const helices = [],
    lips = [[], []];
  const domainColors = ["#746683", "#92869c", "#806e8f"];
  for (let i = 0; i < 6; i++) {
    const front = i === 1;
    for (const ribbon of [false, true]) {
      const geometry = conformations((c, m) => helixGeometry(i, c, m, ribbon));
      const color = new THREE.Color(domainColors[Math.floor(i / 2)]);
      if (!ribbon) color.multiplyScalar(0.69);
      const object = k.mesh(
        geometry,
        k.material(color.getHex(), {
          side: THREE.DoubleSide,
          roughness: 0.53,
          ...(front
            ? {
                transparent: true,
                depthWrite: false,
                opacity: ribbon ? 0.34 : 0.16,
              }
            : {}),
        }),
      );
      object.name = `ANT-H${i + 1}-${ribbon ? "ribbon" : "core"}`;
      helices.push(object);
    }
  }
  for (let i = 0; i < 5; i++) {
    const geometry = conformations((c, m) => connectingLoop(i, c, m));
    const loop = k.mesh(geometry, k.material(domainColors[Math.floor(i / 2)]));
    loop.name = `ANT-loop-${i + 1}-${i + 2}`;
    helices.push(loop);
  }
  const contactMat = k.material("#dcc590", { roughness: 0.58 });
  const contacts = [];
  for (let i = 0; i < 3; i++) {
    const angle = (i * tau) / 3 - Math.PI / 2;
    const x = Math.cos(angle),
      z = Math.sin(angle);
    k.segment(
      [x * 0.83, 0.1, z * 0.83],
      [x * 0.48, 0.06, z * 0.48],
      0.045,
      contactMat,
    );
    const contact = k.ball(
      [x * 0.47, 0.055, z * 0.47],
      [0.081, 0.064, 0.079],
      contactMat,
    );
    contact.name = `central-site-contact-${i}`;
    contacts.push(contact);
    for (const [side, sign] of [
      [0, 1],
      [1, -1],
    ]) {
      const pole = (sign * 0.87) / 1.28;
      const a =
          angle + 0.25 * pole + 0.065 * Math.sin(((pole + 1) * Math.PI) / 2),
        lip = k.ball(
          [0, sign * 0.87, 0],
          [0.415, 0.191, 0.275],
          k.material(domainColors[i]),
        );
      lip.name = `ANT-${side ? "matrix" : "IMS"}-closure-${i}`;
      lip.rotation.y = -a;
      lips[side].push({ lip, x: Math.cos(a), z: Math.sin(a) });
    }
  }
  function pose(c, m) {
    for (const mesh of helices) {
      mesh.morphTargetInfluences[0] = c;
      mesh.morphTargetInfluences[1] = m;
    }
    for (const [side, openness] of [c, m].entries()) {
      const radius = 0.37 + 0.68 * openness;
      for (const { lip, x, z } of lips[side]) {
        lip.scale.x = 0.415 - 0.085 * openness;
        lip.position.x = radius * x;
        lip.position.z = radius * z;
      }
    }
  }
  return {
    pose,
    contact: contacts[1],
    cytosolicLip: lips[0][1].lip,
    matrixLip: lips[1][1].lip,
  };
}

function nucleotide(k, name, color, phosphateCount) {
  const root = new THREE.Group();
  root.name = name;
  root.scale.setScalar(1.07);
  k.group.add(root);
  const mat = k.material(color, { roughness: 0.48 });
  const bright = k.material(name === "ADP" ? "#498fd4" : "#e99635", {
    roughness: 0.45,
  });
  const edge = k.material(name === "ADP" ? "#254f83" : "#a75219");
  const hex = [
    [-0.34, 0.08],
    [-0.29, 0.17],
    [-0.18, 0.17],
    [-0.12, 0.078],
    [-0.18, -0.015],
    [-0.29, -0.014],
  ];
  const fused = [hex[2], hex[3], [-0.02, 0.05], [0.025, 0.145], [-0.08, 0.211]];
  const ribose = [
    [0.005, -0.045],
    [0.105, -0.038],
    [0.15, -0.132],
    [0.072, -0.199],
    [-0.019, -0.15],
  ];
  function ring(points) {
    const shape = new THREE.Shape(
      points.map(([x, y]) => new THREE.Vector2(x, y)),
    );
    const ringShape = k.mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.044,
        bevelEnabled: true,
        bevelSegments: 1,
        steps: 1,
        bevelSize: 0.008,
        bevelThickness: 0.009,
      }),
      mat,
      [0, 0, -0.022],
      root,
    );
    for (let i = 0; i < points.length; i++) {
      const [x, y] = points[i],
        [xx, yy] = points[(i + 1) % points.length];
      k.segment([x, y, 0.032], [xx, yy, 0.032], 0.014, edge, root);
    }
    return ringShape;
  }
  ring(hex);
  ring(fused);
  ring(ribose);
  k.segment([-0.02, 0.05, 0], [0.005, -0.045, 0], 0.027, mat, root);
  const positions = [
    [0.168, -0.255, 0.025],
    [0.303, -0.18, 0.01],
    [0.389, -0.042, -0.006],
  ];
  let previous = [0.072, -0.199, 0],
    anchor;
  for (let i = 0; i < phosphateCount; i++) {
    const here = positions[i];
    k.segment(previous, here, 0.034, mat, root);
    anchor = k.ball(here, 0.071, bright, root);
    anchor.name = `${name}-phosphate-${i + 1}`;
    previous = here;
  }
  return { root, anchor };
}

const adpJourney = [
  [0, -1.68, 2.32, 0.18],
  [0.13, 0, 1.59, 0.02],
  [0.235, 0, 0, 0],
  [0.451, 0, 0, 0],
  [0.532, 0, -1.55, 0.015],
  [0.6, -1.58, -2.27, 0.16],
  [1, -1.58, -2.27, 0.16],
];
const atpJourney = [
  [0, 1.68, -2.32, 0.16],
  [0.545, 1.68, -2.32, 0.16],
  [0.607, 0, -1.55, 0.015],
  [0.683, 0, 0, 0],
  [0.885, 0, 0, 0],
  [0.954, 0, 1.59, 0.02],
  [1, 1.58, 2.27, 0.16],
];
function move(object, p, journey) {
  const next = journey.findIndex((point, i) => i > 0 && p <= point[0]);
  const a = journey[next - 1],
    b = journey[next],
    q = ease(p, a[0], b[0]);
  object.position.set(
    a[1] + (b[1] - a[1]) * q,
    a[2] + (b[2] - a[2]) * q,
    a[3] + (b[3] - a[3]) * q,
  );
  object.rotation.set(
    -0.1,
    0.12 + object.position.x * 0.11,
    object.position.x * 0.14,
  );
}
function create() {
  const k = sceneKit(),
    faces = bilayer(k),
    protein = carrier(k);
  const adp = nucleotide(k, "ADP", "#4585bf", 2),
    atp = nucleotide(k, "ATP", "#d87e2d", 3);
  const labels = [
    k.label(
      faces[0],
      "内膜 · 膜间隙侧",
      "Inner membrane · intermembrane-space face",
      2,
    ),
    k.label(faces[1], "内膜 · 基质侧", "Inner membrane · matrix face", 2),
    k.label([0, 0, 0], "ADP · 两个磷酸基团", "ADP · two phosphate groups", 5),
    k.label([0, 0, 0], "ATP · 三个磷酸基团", "ATP · three phosphate groups", 5),
    k.label([0, 0, 0], "共用的中央结合区", "Shared central binding region", 4),
    k.label([0, 0, 0], "载体的膜间隙端", "Intermembrane-space end of ANT", 3),
    k.label([0, 0, 0], "载体的基质端", "Matrix end of ANT", 3),
  ];
  const vector = new THREE.Vector3();
  const anchors = [
    adp.anchor,
    atp.anchor,
    protein.contact,
    protein.cytosolicLip,
    protein.matrixLip,
  ];
  function update(value) {
    const p = clamp(value);
    const c = 1 - ease(p, 0.235, 0.329) + ease(p, 0.786, 0.875);
    const m = ease(p, 0.342, 0.441) * (1 - ease(p, 0.687, 0.764));
    protein.pose(c, m);
    move(adp.root, p, adpJourney);
    move(atp.root, p, atpJourney);
    for (let i = 0; i < anchors.length; i++)
      anchors[i].getWorldPosition(vector).toArray(labels[i + 2].position);
    labels[4].active = (p >= 0.14 && p <= 0.52) || (p >= 0.595 && p <= 0.95);
    labels[5].active = p < 0.342 || p >= 0.76;
    labels[6].active = p >= 0.329 && p < 0.786;
  }
  update(0);
  return {
    group: k.group,
    labels,
    camera: { position: [1.18, 1.42, 10.8], target: [0, 0, 0] },
    update,
  };
}

export default {
  id: "adenineExchange",
  title: b("线粒体 ADP / ATP 交换", "Mitochondrial ADP / ATP exchange"),
  intro: b(
    "跟随两个独立核苷酸穿过动物线粒体内膜的 ADP/ATP 载体 ANT。前缘剖开，便于观察结合区。文中的方位沿用初始视角。六条跨膜螺旋的两端状态参考牛与真菌的结构研究，中间构象、配体尺寸和播放时长为教学示意。",
    "Follow two separate nucleotides through ANT in the inner membrane of an animal mitochondrion. A frontal cutaway exposes the pocket. Directions refer to the opening view. Bovine and fungal structures inform the two open states of the six-helix carrier. Intermediate shapes, ligand sizes and elapsed time are illustrative.",
  ),
  duration: 32,
  stages,
  legend: [
    { color: "#746683", text: b("ADP/ATP 载体 ANT", "ADP/ATP carrier · ANT") },
    { color: "#4585bf", text: b("进入基质的 ADP", "ADP entering the matrix") },
    { color: "#d87e2d", text: b("离开基质的 ATP", "ATP leaving the matrix") },
  ],
  sources: [
    {
      title: "Pébay-Peyroula et al. · Bovine carrier structure, Nature (2003)",
      url: "https://doi.org/10.1038/nature02056",
    },
    {
      title:
        "Ruprecht et al. · The molecular mechanism of transport by the mitochondrial ADP/ATP carrier, Cell (2019)",
      url: "https://pubmed.ncbi.nlm.nih.gov/30611538/",
    },
    {
      title:
        "Mavridou et al. · Substrate binding in the mitochondrial ADP/ATP carrier, Nature Communications (2022)",
      url: "https://doi.org/10.1038/s41467-022-31366-5",
    },
  ],
  create,
};
