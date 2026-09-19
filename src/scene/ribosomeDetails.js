import * as THREE from "three";
const TAU = Math.PI * 2,
  V = (x, y, z) => new THREE.Vector3(x, y, z);
const palette = {
  large: "#c2ae84",
  small: "#9dacaa",
  rna: "#7195a8",
  trna: "#9b87aa",
  peptide: "#a5b88c",
};
function mesh(g, geo, color, id) {
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.54,
      clearcoat: 0.12,
      side: THREE.DoubleSide,
    }),
  );
  m.userData.hitId = id;
  g.add(m);
  return m;
}
function tube(g, points, r, color, id, segments = 120) {
  return mesh(
    g,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        points.map((p) => (Array.isArray(p) ? V(...p) : p)),
      ),
      segments,
      r,
      10,
      false,
    ),
    color,
    id,
  );
}
function ball(g, p, r, color, id) {
  const m = mesh(g, new THREE.SphereGeometry(r, 24, 16), color, id);
  m.position.set(...p);
  return m;
}
function surface(fn, nu = 112, nv = 72) {
  const p = [],
    uv = [],
    idx = [];
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      p.push(...fn(i / nu, j / nv));
      uv.push(i / nu, j / nv);
    }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i,
        b = a + nu + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
const cutoff = 0.2;
function largePoint(u, v) {
  const a = u * TAU,
    t = cutoff + v * (Math.PI - 2 * cutoff),
    s = Math.sin(t),
    c = Math.cos(t);
  const lobes =
    1 +
    0.12 * s * s * Math.sin(3 * a + 0.7) +
    0.075 * s * s * Math.cos(5 * a - t * 3);
  return [
    0.78 * s * Math.cos(a) * lobes,
    -0.49 + 0.55 * c,
    0.57 * s * Math.sin(a) * lobes,
  ];
}
function smallPoint(u, v) {
  const a = u * TAU,
    t = v * Math.PI,
    s = Math.sin(t),
    c = Math.cos(t),
    head = Math.exp(-(((c - 0.55) / 0.36) ** 2));
  const platform =
    Math.max(0, Math.sin(a)) ** 4 * Math.exp(-(((c + 0.5) / 0.4) ** 2));
  const x = 0.76 * s * Math.cos(a) * (1 + 0.08 * Math.cos(3 * a) * s),
    y =
      0.36 +
      0.32 * c +
      0.22 * head * (0.5 + 0.5 * Math.cos(a)) -
      0.12 * platform,
    z = 0.42 * s * Math.sin(a) * (1 - 0.15 * head) + 0.13 * platform;
  return [x + 0.11 * head, y, z];
}
export function ribosomeBody({ detail = true, only = null } = {}) {
  const g = new THREE.Group(),
    nu = detail ? 112 : 28,
    nv = detail ? 72 : 20;
  if (!only || only === "largeSubunit") {
    mesh(g, surface(largePoint, nu, nv), palette.large, "largeSubunit");
    // Both polar openings meet this continuous, elliptical peptide exit tunnel.
    mesh(
      g,
      surface(
        (u, v) => {
          // Match both lobed shell rims exactly; a fixed ellipse leaves a slit.
          const top = largePoint(u, 0),
            bottom = largePoint(u, 1);
          return top.map((value, axis) =>
            THREE.MathUtils.lerp(value, bottom[axis], v),
          );
        },
        nu,
        12,
      ),
      "#aa9778",
      "largeSubunit",
    );
    if (detail)
      for (let k = 0; k < 9; k++) {
        const points = [];
        for (let i = 0; i <= 48; i++) {
          const u = (k * 0.117 + (i / 48) * 0.095) % 1,
            v = 0.23 + 0.055 * k + 0.012 * Math.sin(i * 0.26),
            p = largePoint(u, v);
          const n = V(p[0], (p[1] + 0.49) * 1.1, p[2]).normalize();
          points.push(V(...p).addScaledVector(n, 0.012));
        }
        tube(
          g,
          points,
          0.017,
          k % 2 ? "#dbc49c" : "#b19c79",
          "largeSubunit",
          72,
        );
      }
  }
  if (!only || only === "smallSubunit") {
    mesh(g, surface(smallPoint, nu, nv), palette.small, "smallSubunit");
    if (detail)
      for (let k = 0; k < 6; k++) {
        const points = [];
        for (let i = 0; i <= 40; i++) {
          const u = (k * 0.163 + (i / 40) * 0.11) % 1,
            v = 0.33 + k * 0.065 + 0.018 * Math.sin(i * 0.2),
            p = smallPoint(u, v);
          points.push(
            V(...p).addScaledVector(
              V(p[0], p[1] - 0.36, p[2]).normalize(),
              0.012,
            ),
          );
        }
        tube(g, points, 0.014, "#bdc9bf", "smallSubunit", 72);
      }
  }
  return g;
}
function messenger(g, leaf = false) {
  const points = [];
  for (let i = 0; i <= 100; i++) {
    const x = -1.65 + (i / 100) * 3.3;
    points.push(
      V(
        x,
        0.205 + 0.075 * (Math.abs(x) / 1.65) ** 3,
        0.4 + 0.12 * Math.sin(x * 1.7),
      ),
    );
  }
  tube(g, points, 0.025, palette.rna, "mrna", 180);
  if (leaf)
    for (let i = 0; i < 27; i++) {
      const x = -1.52 + (i / 26) * 3.04,
        y = 0.205 + 0.075 * (Math.abs(x) / 1.65) ** 3,
        z = 0.4 + 0.12 * Math.sin(x * 1.7);
      const b = mesh(
        g,
        new THREE.BoxGeometry(0.072, 0.11, 0.029),
        Math.floor(i / 3) % 2 ? "#b7c9d4" : "#d8c7a6",
        "mrna",
      );
      b.position.set(x, y + 0.065, z);
      b.rotation.z = 0.14 * Math.sin(i * 0.7);
    }
}
function transferRNA(
  g,
  { scale = 1, position = [0, 0, 0], charged = false } = {},
) {
  const unit = new THREE.Group();
  unit.position.set(...position);
  unit.scale.setScalar(scale);
  g.add(unit);
  // A folded L-shaped tRNA cartoon, not the planar cloverleaf secondary structure.
  const a = [
      [-0.04, -0.57, 0],
      [-0.17, -0.45, 0.02],
      [-0.14, -0.2, 0],
      [-0.21, 0.03, 0.04],
      [-0.12, 0.3, 0],
      [0.04, 0.43, 0.02],
      [0.23, 0.37, 0.04],
      [0.48, 0.26, 0.02],
      [0.7, 0.27, 0.01],
    ],
    b = [
      [0.66, 0.39, 0.01],
      [0.45, 0.4, 0.03],
      [0.22, 0.49, 0.05],
      [0.04, 0.56, 0.02],
      [-0.24, 0.45, 0],
      [-0.34, 0.18, 0.04],
      [-0.26, -0.1, 0],
      [-0.27, -0.35, 0.02],
      [-0.18, -0.57, 0],
      [-0.04, -0.57, 0],
    ];
  tube(
    unit,
    [...b, ...a.slice(1), [0.79, 0.25, 0.02], [0.84, 0.31, 0.03]],
    0.035,
    palette.trna,
    "trna",
    240,
  );
  for (let i = 0; i < 7; i++) {
    const y = -0.3 + i * 0.083;
    tube(
      unit,
      [
        [-0.15 - 0.055 * Math.sin(i * 0.45), y, 0.018],
        [-0.27 - 0.045 * Math.sin(i * 0.45), y + 0.012, 0.018],
      ],
      0.014,
      "#d4c6d9",
      "trna",
      6,
    );
  }
  for (let i = 0; i < 5; i++) {
    const x = 0.24 + i * 0.075;
    tube(
      unit,
      [
        [x, 0.38 - i * 0.028, 0.028],
        [x, 0.49 - i * 0.02, 0.038],
      ],
      0.013,
      "#d4c6d9",
      "trna",
      6,
    );
  }

  if (charged) ball(unit, [0.86, 0.36, 0.03], 0.065, palette.peptide, "trna");
  return unit;
}
export function ribosomeAssembly({ bound = false, only = null } = {}) {
  const g = ribosomeBody({
    only: only === "largeSubunit" || only === "smallSubunit" ? only : null,
  });
  if (only) return g;
  messenger(g);
  // One illustrative elongation state: P and E occupied, A available.
  for (const [x, tip] of [
    [-0.22, [0, 0.055, 0]],
    [-0.55, [-0.32, 0.055, 0.02]],
  ]) {
    const anticodon = V(x, 0.205, 0.4 + 0.12 * Math.sin(x * 1.7)),
      acceptor = V(...tip),
      sourceA = V(-0.1, -0.57, 0),
      sourceB = V(0.84, 0.31, 0.03),
      direction = acceptor.clone().sub(anticodon),
      sourceDirection = sourceB.clone().sub(sourceA),
      scale = direction.length() / sourceDirection.length();
    const t = transferRNA(g, { scale });
    t.quaternion.setFromUnitVectors(
      sourceDirection.normalize(),
      direction.normalize(),
    );
    t.position
      .copy(anticodon)
      .sub(sourceA.multiplyScalar(scale).applyQuaternion(t.quaternion));
  }
  const chain = [
    [0, 0.055, 0],
    [0, -0.22, 0.012],
    [0.015, -0.55, 0.01],
    [0, -0.9, 0],
    [0.015, -1.08, 0.02],
  ];
  if (bound) {
    const shape = new THREE.Shape();
    shape.moveTo(-1.15, -0.66);
    shape.lineTo(1.15, -0.66);
    shape.lineTo(1.15, 0.66);
    shape.lineTo(-1.15, 0.66);
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, 0.17, 0, TAU, true);
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.065,
      bevelEnabled: true,
      bevelSize: 0.01,
      bevelThickness: 0.008,
      bevelSegments: 2,
      curveSegments: 48,
    });
    geo.rotateX(Math.PI / 2);
    geo.translate(0, -1.13, 0);
    mesh(g, geo, "#b8a9c9", "boundRibosomes");
    const channel = mesh(
      g,
      new THREE.TorusGeometry(0.145, 0.035, 12, 64),
      "#839aa0",
      "boundRibosomes",
    );
    channel.rotation.x = Math.PI / 2;
    channel.position.y = -1.165;
    chain.push(
      [0, -1.2, 0],
      [0.1, -1.36, 0.02],
      [-0.02, -1.55, 0.05],
      [0.17, -1.65, 0.08],
    );
  } else
    chain.push([0.06, -1.2, 0.06], [-0.07, -1.33, 0.09], [0.1, -1.44, 0.14]);
  tube(g, chain, 0.025, palette.peptide, "largeSubunit", 144);
  g.userData.landmarks = bound
    ? [
        { zh: "内质网腔", en: "ER lumen", position: [0.55, -1.45, 0] },
        { zh: "新生多肽", en: "Nascent chain", position: [0.03, -1.52, 0.05] },
      ]
    : [{ zh: "新生多肽", en: "Nascent chain", position: [0.015, -1.3, 0.1] }];
  g.userData.partAnchors = {
    largeSubunit: [-0.6, -0.5, 0.28],
    smallSubunit: [0.55, 0.4, 0.25],
    mrna: [1.22, 0.25, 0.5],
    trna: [-0.19, 0.15, 0.4],
  };
  return g;
}
export function ribosomeDetail(id) {
  if (
    ![
      "ribosomes",
      "boundRibosomes",
      "largeSubunit",
      "smallSubunit",
      "mrna",
      "trna",
    ].includes(id)
  )
    return null;
  let g;
  if (id === "mrna") {
    g = new THREE.Group();
    messenger(g, true);
    g.userData.landmarks = [
      { zh: "5′ 端", en: "5′ end", position: [-1.65, 0.28, 0.36] },
      { zh: "3′ 端", en: "3′ end", position: [1.65, 0.28, 0.44] },
      {
        zh: "三个碱基 · 一个密码子",
        en: "Three bases · One codon",
        position: [0, 0.34, 0.4],
      },
    ];
  } else if (id === "trna") {
    g = new THREE.Group();
    transferRNA(g, { charged: true });
    g.userData.landmarks = [
      { zh: "反密码子环", en: "Anticodon loop", position: [-0.1, -0.57, 0] },
      { zh: "3′ CCA 末端", en: "3′ CCA end", position: [0.83, 0.3, 0.03] },
      {
        zh: "携带的氨基酸",
        en: "Attached amino acid",
        position: [0.86, 0.4, 0.03],
      },
    ];
  } else {
    g = ribosomeAssembly({
      bound: id === "boundRibosomes",
      only: ["largeSubunit", "smallSubunit"].includes(id) ? id : null,
    });
    if (id === "largeSubunit")
      g.userData.landmarks = [
        {
          zh: "肽酰转移酶中心所在侧",
          en: "Peptidyl transferase center side",
          position: [0, 0.05, 0.02],
        },
        { zh: "多肽出口", en: "Peptide exit", position: [0, -1.03, 0] },
      ];
    if (id === "smallSubunit")
      g.userData.landmarks = [
        { zh: "头部", en: "Head", position: [0.42, 0.96, 0.08] },
        { zh: "mRNA 结合侧", en: "mRNA-binding side", position: [0, 0.3, 0.3] },
      ];
  }
  g.rotation.set(id === "largeSubunit" ? 0.46 : 0.18, -0.2, -0.06);
  return g;
}
