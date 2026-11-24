import * as THREE from "three";
import { bilingual as b, clamp, ease, sceneKit } from "../../kit.js";

const TAU = Math.PI * 2;
const pitch = 0.215;
const basalY = -1.44;
const retained = 11;
const packetSize = 3;
const starts = [0, 0.18, 0.36];

// A longitudinal profile swept around the rod axis. Shared seam positions
// keep both disc faces on the same hairpin rim; an arc can also stay open.
function membraneSurface(k, parent, name, layers, materials, steps = 64) {
  const g = new THREE.BufferGeometry();
  const positions = new THREE.BufferAttribute(
    new Float32Array((steps + 1) * layers * 3),
    3,
  );
  g.setAttribute("position", positions);
  const indices = [];
  let previous = -1,
    start = 0;
  for (let i = 0; i < steps; i++) {
    const angle = (TAU * (i + 0.5)) / steps;
    const index = Array.isArray(materials) && Math.sin(angle) > 0.28 ? 1 : 0;
    if (index !== previous && i > 0) {
      g.addGroup(start, indices.length - start, previous);
      start = indices.length;
    }
    previous = index;
    for (let j = 0; j < layers - 1; j++) {
      const a = i * layers + j,
        next = a + layers;
      indices.push(a, next, a + 1, next, next + 1, a + 1);
    }
  }
  g.addGroup(start, indices.length - start, previous);
  g.setIndex(indices);
  const mesh = k.mesh(g, materials, [0, 0, 0], parent);
  mesh.name = name;
  const previousProfile = new Float64Array(2 * layers);
  let lastFrom = NaN,
    lastArc = NaN,
    lastNotch = false;
  const surface = (profile, from = 0, arc = TAU, notch = false) => {
    let changed = from !== lastFrom || arc !== lastArc || notch !== lastNotch;
    for (let i = 0; i < layers; i++) {
      const [r, y] = profile[i];
      if (r !== previousProfile[2 * i] || y !== previousProfile[2 * i + 1])
        changed = true;
      previousProfile[2 * i] = r;
      previousProfile[2 * i + 1] = y;
    }
    if (!changed) return;
    lastFrom = from;
    lastArc = arc;
    lastNotch = notch;
    for (let i = 0; i <= steps; i++) {
      const t = from + (arc * i) / steps,
        cs = Math.cos(t),
        sn = Math.sin(t);
      // One shallow incisure indents the entire membrane contour without
      // breaking either surface or opening a mature disc to the exterior.
      const inset = notch
        ? 1 - 0.19 * Math.exp(-48 * (1 - Math.cos(t - 0.78)))
        : 1;
      for (let j = 0; j < layers; j++) {
        const [r, y] = profile[j];
        positions.setXYZ(i * layers + j, r * inset * cs, y, r * inset * sn);
      }
    }
    positions.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingBox();
    g.computeBoundingSphere();
  };
  return { mesh, surface };
}

function create() {
  const k = sceneKit(),
    { group } = k;
  group.name = "Rod outer-segment renewal at the pigment epithelium";
  const solid = (color, extra = {}) =>
    k.material(color, { side: THREE.DoubleSide, roughness: 0.5, ...extra });
  const shell = solid("#778596");
  const shellEdge = solid("#a6b1c1");
  const rodWindow = solid("#acb6c5", {
    transparent: true,
    opacity: 0.075,
    depthWrite: false,
  });
  const cupWall = solid("#ac755e");
  const cupWindow = solid("#c89074", {
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
  });
  const pinkEdge = solid("#d4a489");
  const young = solid("#7e94bb"),
    youngRim = solid("#c0cbe1");
  const pigment = solid("#5e493e");
  const rod = new THREE.Group();
  rod.name = "rod outer segment";
  group.add(rod);
  const rpe = new THREE.Group();
  rpe.name = "retinal pigment epithelium";
  group.add(rpe);

  const inner = membraneSurface(k, rod, "inner-segment apical shoulder", 7, [
    solid("#9c96a3"),
    solid("#b5b2bc", { transparent: true, opacity: 0.105, depthWrite: false }),
  ]);
  inner.surface([
    [0, -2.53],
    [0.3, -2.55],
    [0.57, -2.66],
    [0.74, -2.88],
    [0.8, -3.14],
    [0.8, -3.42],
    [0.74, -3.42],
  ]);
  inner.mesh.position.x = -0.79;
  const mitochondrial = solid("#a78a72"),
    cristae = solid("#dbc5a0");
  for (let i = 0; i < 7; i++) {
    const a = (TAU * i) / 7 + 0.25,
      x = -0.79 + 0.47 * Math.cos(a),
      z = 0.38 * Math.sin(a);
    const m = k.ball(
      [x, -3.1, z],
      [0.115, 0.245 + 0.03 * (i % 2), 0.11],
      mitochondrial,
      rod,
    );
    m.name = "inner-segment ellipsoid mitochondrion";
    for (let j = 0; j < 3; j++) {
      const y = -3.25 + j * 0.13;
      k.tube(
        [
          [x - 0.071, y, z + 0.045],
          [x + 0.012, y + 0.034, z + 0.096],
          [x + 0.078, y + 0.015, z + 0.062],
        ],
        0.012,
        cristae,
        rod,
        8,
      ).name = "schematic mitochondrial crista";
    }
  }
  const cilium = membraneSurface(
    k,
    rod,
    "connecting cilium plasma membrane",
    4,
    [shell, rodWindow],
    48,
  );
  cilium.surface([
    [0.31, -2.54],
    [0.275, -2.42],
    [0.265, -1.84],
    [0.3, -1.68],
  ]);
  cilium.mesh.position.x = -0.93;
  const tubules = new THREE.InstancedMesh(k.cylinder, solid("#dfbc79"), 18);
  tubules.name = "nine peripheral axonemal microtubule doublets";
  const temp = new THREE.Object3D();
  for (let i = 0; i < 9; i++) {
    const a = (TAU * i) / 9;
    for (let j = 0; j < 2; j++) {
      const tangent = j ? 0.037 : 0;
      temp.position.set(
        -0.93 + 0.19 * Math.cos(a) - tangent * Math.sin(a),
        -2.025,
        0.19 * Math.sin(a) + tangent * Math.cos(a),
      );
      temp.scale.set(j ? 0.021 : 0.026, 1.05, j ? 0.021 : 0.026);
      temp.updateMatrix();
      tubules.setMatrixAt(2 * i + j, temp.matrix);
    }
  }
  tubules.instanceMatrix.needsUpdate = true;
  rod.add(tubules);
  const shoulder = membraneSurface(
    k,
    rod,
    "ciliary membrane continuous with basal folds",
    3,
    shellEdge,
  );
  shoulder.surface(
    [
      [1.105, -0.96],
      [1.105, -1.67],
      [1.105, -1.83],
    ],
    Math.PI - 0.33,
    0.66,
  );
  const basalSupport = k.tube(
    [
      [-1.08, -1.81, -0.02],
      [-1.105, -1.7, -0.02],
      [-1.1, -1.45, -0.02],
      [-1.1, -1.17, -0.02],
    ],
    0.035,
    shellEdge,
    rod,
  );
  basalSupport.name = "axonemal side of basal plasma membrane";

  const matureProfile = [
    [0, 0.04],
    [0.58, 0.042],
    [0.91, 0.04],
    [0.97, 0.054],
    [1.005, 0.045],
    [1.027, 0],
    [1.005, -0.045],
    [0.97, -0.054],
    [0.91, -0.04],
    [0.58, -0.042],
    [0, -0.04],
  ];
  const disc = membraneSurface(
    k,
    rod,
    "mature disc geometry",
    matureProfile.length,
    young,
  );
  disc.surface(matureProfile, 0, TAU, true);
  const discGeometry = disc.mesh.geometry;
  rod.remove(disc.mesh);
  function stack(parent, name, count, oldest) {
    const mesh = new THREE.InstancedMesh(discGeometry, solid("#ffffff"), count);
    mesh.name = name;
    const color = new THREE.Color(),
      from = new THREE.Color(oldest ? "#c39568" : "#8296b6"),
      to = new THREE.Color(oldest ? "#e2bb85" : "#b8adab");
    for (let i = 0; i < count; i++) {
      temp.position.set(0, i * pitch, 0);
      temp.scale.set(1, 1, 1);
      temp.updateMatrix();
      mesh.setMatrixAt(i, temp.matrix);
      mesh.setColorAt(i, color.copy(from).lerp(to, i / Math.max(1, count - 1)));
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
    parent.add(mesh);
    return mesh;
  }
  const mature = stack(rod, "pre-existing sealed disc stack", retained, false);
  const packet = new THREE.Group();
  packet.name = "coherent distal tip packet";
  rod.add(packet);
  stack(packet, "old sealed discs in distal packet", packetSize, true);
  const middleShell = membraneSurface(
    k,
    rod,
    "outer-segment plasma membrane cutaway",
    4,
    [shell, rodWindow],
  );
  middleShell.surface([
    [1.105, 0],
    [1.125, 0],
    [1.125, 1],
    [1.105, 1],
  ]);
  const packetShell = membraneSurface(
    k,
    packet,
    "distal tip plasma membrane and cap",
    5,
    [shell, rodWindow],
  );
  packetShell.surface([
    [0, 2 * pitch + 0.14],
    [0.93, 2 * pitch + 0.14],
    [1.11, 2 * pitch + 0.095],
    [1.125, 2 * pitch],
    [1.125, -pitch / 2 + 0.05],
  ]);
  const lowerNeck = membraneSurface(k, rod, "resealing rod tip", 3, [
    shell,
    rodWindow,
  ]);
  const upperNeck = membraneSurface(k, packet, "resealing packet base", 3, [
    shell,
    rodWindow,
  ]);

  // Two adjacent lamellae supply the facing membranes. Their extracellular
  // cleft remains accessible around the free arc until the new rim encloses it.
  function makeFold(i) {
    const parent = new THREE.Group();
    parent.name = `basal disc cohort ${i + 1}`;
    rod.add(parent);
    const top = membraneSurface(k, parent, "upper facing membrane", 3, young);
    const bottom = membraneSurface(
      k,
      parent,
      "lower facing membrane",
      3,
      young,
    );
    const rim = membraneSurface(k, parent, "growing disc rim", 5, youngRim);
    const sheath = membraneSurface(
      k,
      parent,
      "basal outer membrane around the closed rim",
      2,
      solid("#9aa9c0", { transparent: true, opacity: 0.22, depthWrite: false }),
    );
    const lips = [1, -1].map((side) =>
      membraneSurface(
        k,
        parent,
        side > 0 ? "upper free lamellar edge" : "lower free lamellar edge",
        3,
        young,
      ),
    );
    const bridges = [1, -1].map((side) => {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(new Float32Array(18 * 3), 3),
      );
      const indices = [];
      for (let step = 0; step < 8; step++) {
        const a = 2 * step;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      geom.setIndex(indices);
      const mesh = k.mesh(geom, young, [0, 0, 0], parent);
      mesh.name =
        side > 0
          ? "upper membrane connection to cilium"
          : "lower membrane connection to cilium";
      return mesh;
    });
    let lastGrowth = -1,
      lastSeal = -1,
      lastInsert = -1;
    function update(growth, seal, insert, y) {
      parent.position.y = y;
      parent.visible = growth > 0;
      if (growth === lastGrowth && seal === lastSeal && insert === lastInsert)
        return;
      lastGrowth = growth;
      lastSeal = seal;
      lastInsert = insert;
      const radius = 0.008 + 1.019 * growth;
      const cx = radius - 1.027;
      const h = 0.041 + 0.035 * (1 - seal);
      const covered = 0.1 + 0.9 * seal;
      const from = Math.PI * (1 - covered);
      sheath.surface(
        [
          [1.108, pitch / 2],
          [1.108, pitch / 2 - pitch * insert],
        ],
        from,
        TAU * covered,
      );
      top.surface([
        [0, h],
        [radius * 0.88, h * 0.93],
        [radius, h],
      ]);
      bottom.surface([
        [radius, -h],
        [radius * 0.88, -h * 0.93],
        [0, -h],
      ]);
      rim.surface(
        [
          [radius, h],
          [radius + 0.012, h * 0.78],
          [radius + 0.021, 0],
          [radius + 0.012, -h * 0.78],
          [radius, -h],
        ],
        from,
        TAU * covered,
      );
      for (const [index, side] of [1, -1].entries()) {
        lips[index].mesh.visible = seal < 1;
        lips[index].surface(
          [
            [radius, h * side],
            [radius + 0.014, h * side + side * 0.009],
            [radius - 0.008, h * side + side * 0.017],
          ],
          -from,
          2 * from,
        );
        const bridge = bridges[index];
        bridge.visible = seal < 1;
        {
          const a = bridge.geometry.attributes.position;
          for (let j = 0; j <= 8; j++) {
            const th = Math.PI + (j / 8 - 0.5) * 0.45 * (1 - seal);
            const co = Math.cos(th),
              si = Math.sin(th);
            a.setXYZ(2 * j, cx + radius * co, side * h, radius * si);
            a.setXYZ(2 * j + 1, 1.105 * co, side * (h + 0.018), 1.105 * si);
          }
          a.needsUpdate = true;
          bridge.geometry.computeVertexNormals();
          bridge.geometry.computeBoundingSphere();
          bridge.geometry.computeBoundingBox();
        }
      }
      for (const piece of [top, bottom, rim, ...lips])
        piece.mesh.position.x = cx;
      parent.userData = {
        growth,
        seal,
        openArc: TAU * (1 - covered),
        mouthX: cx + radius,
      };
    }
    return { parent, update };
  }
  const folds = starts.map((_, i) => makeFold(i));

  // The apical epithelial sheet has a real central opening. Its outer cuff
  // and the membrane facing the packet share the lip until it closes.
  const flange = membraneSurface(
    k,
    rpe,
    "RPE apical membrane around the phagocytic cup",
    3,
    [cupWall, cupWindow],
  );
  flange.surface([
    [1.4, 2.5],
    [1.62, 2.45],
    [1.82, 2.52],
  ]);
  // The front of the RPE is cut away. Its back and lateral walls bound an
  // intracellular compartment larger than the final phagosome.
  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-2.04, 2.49);
  bodyShape.bezierCurveTo(-1.35, 2.37, -0.58, 2.58, 0, 2.51);
  bodyShape.bezierCurveTo(0.69, 2.4, 1.47, 2.58, 2.02, 2.48);
  bodyShape.quadraticCurveTo(2.14, 3.08, 2.04, 3.68);
  bodyShape.bezierCurveTo(1.45, 3.86, 0.64, 3.77, 0.04, 3.82);
  bodyShape.bezierCurveTo(-0.83, 3.9, -1.49, 3.69, -2.05, 3.78);
  bodyShape.quadraticCurveTo(-2.16, 3.11, -2.04, 2.49);
  const body = k.mesh(
    new THREE.ExtrudeGeometry(bodyShape, {
      depth: 0.18,
      bevelEnabled: true,
      bevelSize: 0.045,
      bevelThickness: 0.045,
      bevelSegments: 3,
      curveSegments: 20,
    }),
    solid("#ba927b"),
    [0, 0, -1.66],
    rpe,
  );
  body.name = "posterior cut surface of RPE cytoplasm";
  for (const side of [-1, 1]) {
    k.tube(
      [
        [2.06 * side, 3.72, -1.46],
        [2.12 * side, 3.18, -1.39],
        [2.03 * side, 2.52, -1.3],
        [1.73 * side, 2.48, -0.51],
      ],
      0.055,
      pinkEdge,
      rpe,
      34,
    ).name = "lateral cut margin of RPE cell";
  }
  for (let i = 0; i < 18; i++) {
    const x = -1.92 + (i % 9) * 0.47 + 0.042 * Math.sin(i),
      y = 2.67 + 0.31 * Math.floor(i / 9) + 0.08 * Math.sin(1.7 * i);
    const granule = k.ball(
      [x, y, -1.4],
      [0.052 + 0.012 * (i % 3), 0.12 + 0.019 * (i % 4), 0.048],
      pigment,
      rpe,
    );
    granule.rotation.z = ((i % 5) - 2) * 0.25;
    granule.name = "RPE melanosome";
  }
  const nucleus = k.ball(
    [1.38, 3.4, -1.42],
    [0.46, 0.21, 0.085],
    solid("#998487"),
    rpe,
  );
  nucleus.name = "sectioned RPE nucleus";
  k.ball([1.5, 3.43, -1.338], [0.081, 0.062, 0.025], solid("#7a6976"), rpe);
  for (let i = 0; i < 17; i++) {
    const a = (TAU * i) / 17 + 0.21,
      cs = Math.cos(a),
      sn = Math.sin(a),
      len = 0.74 + 0.14 * (i % 4);
    if (sn > 0.66 && Math.abs(cs) < 0.73) continue;
    const finger = k.tube(
      [
        [1.68 * cs, 2.5, 1.63 * sn],
        [1.54 * cs, 2.35, 1.53 * sn],
        [1.39 * cs, 2.42 - len * 0.62, 1.4 * sn],
        [1.26 * cs, 2.49 - len, 1.28 * sn],
      ],
      0.055,
      pinkEdge,
      rpe,
      28,
    );
    finger.name = "RPE apical microvillus";
    const gp = finger.geometry.attributes.position,
      path = finger.geometry.parameters.path;
    const center = new THREE.Vector3(),
      vertex = new THREE.Vector3();
    for (let j = 0; j <= 28; j++) {
      const u = j / 28;
      path.getPointAt(u, center);
      for (let v = 0; v <= 8; v++) {
        const idx = j * 9 + v;
        vertex
          .fromBufferAttribute(gp, idx)
          .sub(center)
          .multiplyScalar(1.1 - 0.81 * u)
          .add(center);
        gp.setXYZ(idx, vertex.x, vertex.y, vertex.z);
      }
    }
    gp.needsUpdate = true;
    finger.geometry.computeVertexNormals();
  }
  const cupInner = membraneSurface(
    k,
    rpe,
    "RPE phagocytic cup inner membrane",
    6,
    [cupWall, cupWindow],
  );
  const cupOuter = membraneSurface(
    k,
    rpe,
    "RPE apical cuff outer membrane",
    4,
    [cupWall, cupWindow],
  );
  const lip = membraneSurface(k, rpe, "phagocytic cup leading lip", 3, [
    pinkEdge,
    cupWindow,
  ]);
  // The inset reuses the first cohort's actual membrane buffers, enlarged
  // vertically so the extracellular cleft is visible at normal playback size.
  const inset = new THREE.Group();
  inset.name = "basal fold detail inset";
  group.add(inset);
  inset.position.set(2.54, -1.52, 0.2);
  inset.scale.set(0.94, 3.8, 0.83);
  inset.rotation.x = 0.17;
  const detailParts = folds[0].parent.children
    .filter((m) => m.name !== "basal outer membrane around the closed rim")
    .map((source) => {
      const copy = k.mesh(source.geometry, source.material, [0, 0, 0], inset);
      copy.name = source.name + " (enlarged section)";
      return { source, copy };
    });
  const insetFrame = solid("#b4aca0");
  for (const [a, bp] of [
    [
      [1.44, -0.91, -0.65],
      [1.44, -0.78, -0.65],
    ],
    [
      [1.44, -0.78, -0.65],
      [1.68, -0.78, -0.65],
    ],
    [
      [3.65, -2.13, -0.65],
      [3.65, -2.26, -0.65],
    ],
    [
      [3.65, -2.26, -0.65],
      [3.41, -2.26, -0.65],
    ],
  ])
    k.segment(a, bp, 0.014, insetFrame).name = "enlarged section corner";
  const guide = k.segment(
    [1.05, -1.46, -0.25],
    [1.44, -1.25, -0.44],
    0.011,
    insetFrame,
  );
  guide.name = "basal cutaway detail leader";
  const labels = [
    k.label([-0.96, -2.12, 0.2], "连接纤毛", "Connecting cilium", 2),
    k.label(
      [0.15, -1.46, 0.3],
      "相邻膜褶间的细胞外间隙",
      "Extracellular cleft between lamellae",
      3,
    ),
    k.label([0.8, 0.1, 0.5], "成熟封闭膜盘", "Enclosed mature discs", 2),
    k.label(
      [0.72, 1.32, 0.48],
      "远端旧膜盘组",
      "Distal packet of older discs",
      3,
    ),
    k.label([-1.43, 2.17, 0.36], "色素上皮顶端突起", "RPE apical processes", 2),
    k.label([0.78, 2.72, 0.37], "色素上皮吞噬体", "RPE phagosome", 3),
  ];
  labels.push(
    k.label(
      [2.52, -2.05, 0.3],
      "基部膜褶 · 放大剖面",
      "Basal folds · enlarged section",
      2,
    ),
  );
  const foldOpen = b(
    "相邻膜褶间的细胞外间隙",
    "Extracellular cleft between lamellae",
  );
  const foldClosed = b("新形成的封闭膜盘", "Newly enclosed disc");
  const accumulation = new Float64Array(3);
  let lastProgress = -1;
  function update(value) {
    const p = clamp(value);
    if (p === lastProgress) return;
    lastProgress = p;
    for (let i = 0; i < 3; i++)
      accumulation[i] = ease(p, starts[i], starts[i] + 0.27);
    const shifted = accumulation[0] + accumulation[1] + accumulation[2];
    let later = 0;
    for (let i = 2; i >= 0; i--) {
      const s = starts[i];
      // The first frame already contains the small initiating lamellar protrusion.
      const growth =
        i === 0 ? 0.16 + 0.84 * ease(p, 0, 0.19) : ease(p, s, s + 0.19);
      const seal = ease(p, s + 0.14, s + 0.29);
      const y = basalY - pitch + pitch * (accumulation[i] + later);
      folds[i].update(growth, seal, accumulation[i], y);
      later += accumulation[i];
    }
    mature.position.y = basalY + pitch * shifted;
    const join = mature.position.y + (retained - 0.5) * pitch;
    const pinch = ease(p, 0.66, 0.79),
      internalise = ease(p, 0.79, 1);
    const lift = 1.29 * internalise;
    packet.position.y = mature.position.y + retained * pitch + lift;
    middleShell.mesh.position.y = mature.position.y - pitch / 2;
    middleShell.mesh.scale.y = join - 0.05 - middleShell.mesh.position.y;
    const neckR = 1.125 * (1 - pinch);
    lowerNeck.mesh.position.y = join;
    lowerNeck.surface([
      [neckR, 0],
      [0.5 * (1.125 + neckR), -0.024],
      [1.125, -0.05],
    ]);
    upperNeck.surface([
      [1.125, -pitch / 2 + 0.05],
      [0.5 * (1.125 + neckR), -pitch / 2 + 0.024],
      [neckR, -pitch / 2],
    ]);
    const reach = ease(p, 0.5, 0.66),
      close = ease(p, 0.73, 0.86),
      detach = ease(p, 0.86, 1);
    const lipY = 2.53 + (join - 2.53) * reach;
    const aperture = 1.215 * (1 - close);
    const upperY = Math.max(2.51, packet.position.y + 2 * pitch + 0.255);
    const innerY = lipY + 0.45 * lift + detach * (0.55 * lift - 0.08);
    const outerY =
      detach === 0 ? innerY : Math.min(2.5, innerY - 0.12 * detach);
    cupInner.surface([
      [0, upperY + 0.12],
      [0.89, upperY + 0.1],
      [1.24, upperY - 0.02],
      [1.25, 0.53 * innerY + 0.47 * upperY],
      [1.23, innerY + 0.035],
      [aperture, innerY],
    ]);
    cupOuter.surface([
      [1.4, 2.5],
      [1.42, 2.5 + (outerY - 2.5) * 0.44],
      [1.32, outerY + 0.028],
      [aperture, outerY],
    ]);
    lip.mesh.visible = close < 1;
    lip.surface([
      [aperture + 0.014, innerY + 0.009],
      [aperture, innerY],
      [aperture + 0.014, innerY - 0.009],
    ]);
    const focus = folds[0].parent;
    for (const { source, copy } of detailParts) {
      copy.position.copy(source.position);
      copy.visible = source.visible;
    }
    labels[1].position[0] = focus.userData.mouthX;
    labels[1].position[1] = focus.position.y;
    labels[1].text = focus.userData.seal === 1 ? foldClosed : foldOpen;
    labels[2].position[1] = mature.position.y + 5 * pitch;
    labels[3].position[1] = packet.position.y + pitch;
    labels[3].active = p < 0.94;
    labels[5].active = close === 1;
    labels[5].position[1] = innerY + 0.16;
    group.userData = {
      process: "rodDiscRenewal",
      specimen: "mammalian rod and adjacent retinal pigment epithelium",
      schematic: true,
      basalInsertions: shifted,
      initialOldDiscs: retained + packetSize,
      distalPacketDiscs: packetSize,
      rodNeckRadius: neckR,
      rpeCupAperture: aperture,
      tipDetached: pinch === 1,
      phagosomeClosed: close === 1,
    };
  }
  update(0);
  return {
    group,
    labels,
    update,
    camera: { position: [3.4, 1.55, 13.2], target: [0.58, 0.18, 0] },
  };
}

export default {
  id: "rodDiscRenewal",
  title: b("视杆外节膜盘更新", "Rod outer-segment disc renewal"),
  intro: b(
    "哺乳动物视杆在外节基部形成膜盘，邻近的视网膜色素上皮（RPE）摄取远端旧盘。纵向剖开部分膜面以显示内外空间。动画压缩多个更新周期，盘数、盘距与时长均为示意。右侧放大显示同一处基部膜褶。",
    "Mammalian rods form discs at the outer-segment base. The adjacent retinal pigment epithelium (RPE) takes up older discs at the tip. A longitudinal cutaway exposes the compartments. Several cycles are compressed; disc numbers, spacing and time are schematic. The inset magnifies the same basal membranes.",
  ),
  duration: 40,
  controls: [],
  stages: [
    {
      at: 0,
      title: b("纤毛接入外节基部", "The cilium meets the outer-segment base"),
      description: b(
        "连接纤毛的膜与外节质膜相连。最初的膜褶位于基部的轴丝旁，远端已有成摞的成熟膜盘。",
        "The connecting cilium is continuous with the outer-segment plasma membrane. Basal folds begin beside the axoneme, below the stack of mature discs.",
      ),
    },
    {
      at: 0.1,
      title: b("相邻膜褶向外生长", "Neighboring lamellae grow outward"),
      description: b(
        "两片相邻的质膜褶横向扩展。它们相对膜面间的狭缝仍通向细胞外，图中以灰蓝色显示。",
        "Neighboring plasma-membrane lamellae extend laterally. The cleft between their facing surfaces is still open to extracellular space. The new membranes are slate blue.",
      ),
    },
    {
      at: 0.24,
      title: b("盘缘包围狭缝", "The rim encloses the cleft"),
      description: b(
        "盘缘沿周边延伸，直到封闭原先与外界相通的狭缝。这段细胞外空间成为新膜盘的盘腔。",
        "Rim growth around the perimeter closes the cleft. The formerly extracellular space becomes the lumen of the new disc.",
      ),
    },
    {
      at: 0.43,
      title: b("旧膜盘向远端移位", "Older discs shift toward the tip"),
      description: b(
        "后续膜盘从基部加入，使先形成的膜盘向远端移位。成熟膜盘封闭在外节质膜以内。",
        "Further basal additions displace older discs distally. Mature discs are enclosed separately within the outer-segment plasma membrane.",
      ),
    },
    {
      at: 0.64,
      title: b("顶端突起包绕旧盘组", "RPE processes surround the distal tip"),
      description: b(
        "色素上皮的顶端突起贴近远端，逐渐包绕一小组旧膜盘及其外节质膜。图中以暖褐色标出最老的盘组。",
        "Apical processes of the RPE draw around a small group of old discs and its surrounding outer-segment membrane. The oldest packet is shown in amber.",
      ),
    },
    {
      at: 0.8,
      title: b("远端膜片组分离", "The distal packet separates"),
      description: b(
        "最远端的膜盘组与视杆分开。其余盘片留在外节，视杆远端的质膜重新封闭。",
        "The distal packet separates from the rod. The remaining discs stay in the outer segment as the rod tip reseals.",
      ),
    },
    {
      at: 0.91,
      title: b("盘组进入色素上皮吞噬体", "The packet enters an RPE phagosome"),
      description: b(
        "色素上皮膜在盘组周围闭合，将其纳入细胞内的吞噬体。盘膜此后会被降解。",
        "The RPE membrane closes around the packet and internalizes it in a phagosome. The ingested disc membranes are subsequently degraded.",
      ),
    },
  ],
  legend: [
    { color: "#7e94bb", text: b("新生膜褶与膜盘", "Nascent folds and discs") },
    { color: "#cc9b6f", text: b("远端旧膜盘", "Older distal discs") },
    { color: "#ac755e", text: b("色素上皮膜", "RPE membrane") },
  ],
  sources: [
    {
      title:
        "Young — The renewal of rod and cone outer segments in the rhesus monkey (1971)",
      url: "https://pubmed.ncbi.nlm.nih.gov/19866760/",
    },
    {
      title:
        "Umapathy et al. — Spatiotemporal live-cell analysis of photoreceptor outer segment membrane ingestion by the retinal pigment epithelium reveals actin-regulated scission (2023)",
      url: "https://pubmed.ncbi.nlm.nih.gov/36878726/",
    },
    {
      title:
        "Volland et al. — Three-dimensional organization of nascent rod outer segment disk membranes (2015)",
      url: "https://pubmed.ncbi.nlm.nih.gov/26578801/",
    },
    {
      title:
        "Ding et al. — Discs of mammalian rod photoreceptors form through the membrane evagination mechanism (2015)",
      url: "https://pubmed.ncbi.nlm.nih.gov/26527746/",
    },
    {
      title:
        "LaVail — Rod outer segment disk shedding in rat retina: relationship to cyclic lighting (1976)",
      url: "https://pubmed.ncbi.nlm.nih.gov/982063/",
    },
  ],
  create,
};
