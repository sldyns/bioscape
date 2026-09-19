import { THREE } from "../../kit.js";

const TAU = Math.PI * 2;
export function materialInventory(group, extras = []) {
  const all = new Set(extras);
  group.traverse((o) => {
    if (o.material)
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        all.add(m);
  });
  return [...all];
}

// Paired cut surfaces follow the exact evolving longitudinal mesh; no independent
// sphere can occlude a connected neck. The front wedge is a viewing cutaway.
export function layeredCutaway(
  k,
  source,
  rows = 40,
  columns = 48,
  nuclear = false,
  axis = "x",
) {
  const geometry = source.geometry,
    original = [...geometry.index.array];
  const cutA = 5,
    cutB = 19;
  const kept = original.filter((_, i) => {
    const triangle = Math.floor(i / 3) * 3;
    const col = Math.min(
      ...original.slice(triangle, triangle + 3).map((v) => v % (columns + 1)),
    );
    return col < cutA || col >= cutB;
  });
  geometry.setIndex(kept);
  source.material = k.material(nuclear ? "#a2a9c3" : "#c1b18c", {
    side: THREE.DoubleSide,
    roughness: 0.8,
  });
  const layerSpecs = nuclear
    ? [
        [0.966, "#d3d6e4"],
        [0.938, "#a1a9c4"],
      ]
    : [
        [0.964, "#dfd3b2"],
        [0.931, "#83aaa0"],
        [0.909, "#c2d6c6"],
      ];
  const layers = layerSpecs.map(([factor, color], index) => {
    const g = geometry.clone();
    const layer = {
      factor,
      mesh: k.mesh(
        g,
        k.material(color, { side: THREE.DoubleSide, roughness: 0.7 }),
      ),
    };
    layer.mesh.name = `${source.name}:envelope-layer-${index}`;
    return layer;
  });
  const edgeGeometry = new THREE.BufferGeometry();
  const edgePositions = new Float32Array((rows + 1) * 2 * 2 * 3),
    edges = [];
  for (let side = 0; side < 2; side++)
    for (let i = 0; i < rows; i++) {
      const a = side * (rows + 1) * 2 + i * 2;
      edges.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  edgeGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(edgePositions, 3),
  );
  edgeGeometry.setIndex(edges);
  const edge = k.mesh(
    edgeGeometry,
    k.material(nuclear ? "#b9bdd4" : "#ccb98d", { side: THREE.DoubleSide }),
  );
  const count = Math.floor(rows / 2) * 4;
  const heads = new THREE.InstancedMesh(
    k.sphere,
    k.material(nuclear ? "#8f99b8" : "#779e91"),
    count,
  );
  heads.name = nuclear
    ? "nuclear-envelope-cut-leaflets"
    : "paired-plasma-membrane-cut-leaflets";
  heads.frustumCulled = false;
  k.group.add(heads);
  const temp = new THREE.Object3D();
  function update() {
    const src = geometry.attributes.position.array;
    for (const layer of layers) {
      const dst = layer.mesh.geometry.attributes.position.array;
      for (let i = 0; i < src.length; i += 3) {
        dst[i] = src[i] * (axis === "x" ? 1 : layer.factor);
        dst[i + 1] = src[i + 1] * (axis === "y" ? 1 : layer.factor);
        dst[i + 2] = src[i + 2] * layer.factor;
      }
      layer.mesh.geometry.attributes.position.needsUpdate = true;
      layer.mesh.geometry.computeVertexNormals();
      layer.mesh.geometry.computeBoundingSphere();
      layer.mesh.geometry.computeBoundingBox();
      layer.mesh.visible = source.visible;
      layer.mesh.position.copy(source.position);
      layer.mesh.quaternion.copy(source.quaternion);
      layer.mesh.scale.copy(source.scale);
    }
    let bead = 0;
    for (let side = 0; side < 2; side++)
      for (let i = 0; i <= rows; i++) {
        const index = (i * (columns + 1) + (side ? cutB : cutA)) * 3;
        for (let face = 0; face < 2; face++) {
          const offset = (side * (rows + 1) * 2 + i * 2 + face) * 3,
            f = face ? layerSpecs.at(-1)[0] : 1;
          edgePositions[offset] = src[index] * (axis === "x" ? 1 : f);
          edgePositions[offset + 1] = src[index + 1] * (axis === "y" ? 1 : f);
          edgePositions[offset + 2] = src[index + 2] * f;
        }
        if (i % 2 === 1)
          for (const f of [layerSpecs.at(-1)[0], layerSpecs.at(-2)[0]]) {
            temp.position.set(
              src[index] * (axis === "x" ? 1 : f),
              src[index + 1] * (axis === "y" ? 1 : f),
              src[index + 2] * f,
            );
            temp.scale.setScalar(nuclear ? 0.015 : 0.021);
            temp.updateMatrix();
            heads.setMatrixAt(bead++, temp.matrix);
          }
      }
    edge.geometry.attributes.position.needsUpdate = true;
    edge.geometry.computeVertexNormals();
    edge.geometry.computeBoundingSphere();
    edge.geometry.computeBoundingBox();
    for (const item of [edge, heads]) {
      item.visible = source.visible;
      item.position.copy(source.position);
      item.quaternion.copy(source.quaternion);
      item.scale.copy(source.scale);
    }
    heads.instanceMatrix.needsUpdate = true;
    heads.computeBoundingBox();
    heads.computeBoundingSphere();
  }
  return { update };
}

export function cutSphere() {
  const g = new THREE.SphereGeometry(1, 40, 28);
  const a = g.attributes.position,
    indices = [];
  for (let i = 0; i < g.index.count; i += 3) {
    const ids = [g.index.array[i], g.index.array[i + 1], g.index.array[i + 2]];
    if (ids.reduce((v, id) => v + a.getZ(id), 0) / 3 < 0.32)
      indices.push(...ids);
  }
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}
export function nuclearAnatomy(k, shell, includeChromatin = true) {
  const detail = new THREE.Group();
  shell.add(detail);
  shell.geometry = cutSphere();
  shell.material = k.material("#9fa7c0", { side: THREE.DoubleSide });
  const inner = k.mesh(
    shell.geometry,
    k.material("#d1d5e3", { side: THREE.DoubleSide }),
    [0, 0, 0],
    detail,
  );
  inner.scale.setScalar(0.94);
  const chromatinMat = k.material("#a08ba9"),
    histoneMat = k.material("#b7a4bd");
  for (let strand = 0; includeChromatin && strand < 3; strand++) {
    const points = Array.from({ length: 54 }, (_, i) => {
      const t = (i / 53) * TAU;
      return [
        0.48 * Math.cos(t + strand * 0.6),
        0.34 * Math.sin(t * 2 + strand),
        0.12 + 0.12 * Math.sin(t * 3 + strand),
      ];
    });
    k.tube(points, 0.017, chromatinMat, detail, 80);
    for (let i = 0; i < points.length; i += 6)
      k.ball(points[i], [0.048, 0.035, 0.045], histoneMat, detail);
  }
  const poreGeometry = new THREE.TorusGeometry(0.082, 0.019, 8, 24),
    poreMat = k.material("#7b86a9");
  const node = new THREE.Object3D(),
    pores = new THREE.InstancedMesh(poreGeometry, poreMat, 10),
    subunits = new THREE.InstancedMesh(k.sphere, poreMat, 80);
  detail.add(pores, subunits);
  const normal = new THREE.Vector3(),
    z = new THREE.Vector3(0, 0, 1),
    local = new THREE.Vector3();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    normal.set(0.95 * Math.cos(a), 0.95 * Math.sin(a), 0.28).normalize();
    node.position.copy(normal).multiplyScalar(0.985);
    node.quaternion.setFromUnitVectors(z, normal);
    node.scale.setScalar(1);
    node.updateMatrix();
    pores.setMatrixAt(i, node.matrix);
    for (let j = 0; j < 8; j++) {
      local
        .set(
          0.083 * Math.cos((j / 8) * TAU),
          0.083 * Math.sin((j / 8) * TAU),
          0.016,
        )
        .applyQuaternion(node.quaternion)
        .add(node.position);
      const p = node.position.clone();
      node.position.copy(local);
      node.scale.setScalar(0.022);
      node.updateMatrix();
      subunits.setMatrixAt(i * 8 + j, node.matrix);
      node.position.copy(p);
      node.scale.setScalar(1);
    }
  }
  pores.computeBoundingSphere();
  subunits.computeBoundingSphere();
  k.ball(
    [-0.33, -0.3, -0.07],
    [0.23, 0.18, 0.19],
    k.material("#a693a6"),
    detail,
  );
  return detail;
}
export function cytoplasmicAnatomy(k, parent, scale = 1) {
  const g = new THREE.Group();
  parent.add(g);
  g.scale.setScalar(scale);
  const vac = k.mesh(
    cutSphere(),
    k.material("#a8c4c4", { side: THREE.DoubleSide }),
    [-0.45, -0.58, -0.1],
    g,
  );
  vac.scale.set(0.4, 0.35, 0.35);
  const vacInner = k.mesh(
    vac.geometry,
    k.material("#d2e1de", { side: THREE.DoubleSide }),
    [0, 0, 0],
    vac,
  );
  vacInner.scale.setScalar(0.94);
  const mito = new THREE.Group();
  g.add(mito);
  mito.position.set(-0.18, 0.76, -0.08);
  mito.rotation.z = -0.2;
  const m = k.mesh(
    cutSphere(),
    k.material("#aa9476", { side: THREE.DoubleSide }),
    [0, 0, 0],
    mito,
  );
  m.scale.set(0.58, 0.21, 0.2);
  for (let i = 0; i < 6; i++) {
    const x = -0.37 + i * 0.145;
    k.tube(
      [
        [x, -0.12, 0.05],
        [x + 0.055, 0.02, 0.11],
        [x, 0.14, 0.02],
      ],
      0.019,
      k.material("#c3ac8c"),
      mito,
      18,
    );
  }
  const er = k.material("#b6aaa5");
  for (let i = 0; i < 3; i++)
    k.tube(
      [
        [-0.73, 0.22 + i * 0.13, -0.18],
        [-0.44, 0.35 + i * 0.11, -0.23],
        [0.0, 0.27 + i * 0.12, -0.18],
        [0.35, 0.43 + i * 0.09, -0.2],
      ],
      0.027,
      er,
      g,
      32,
    );
  const ribosomes = new THREE.InstancedMesh(
      k.sphere,
      k.material("#8e9fa3"),
      30,
    ),
    temp = new THREE.Object3D();
  g.add(ribosomes);
  for (let i = 0; i < 30; i++) {
    const a = i * 2.399;
    temp.position.set(
      0.89 * Math.cos(a),
      0.95 * Math.sin(a),
      -0.12 + 0.08 * Math.cos(i),
    );
    temp.scale.set(0.033, 0.025, 0.026);
    temp.updateMatrix();
    ribosomes.setMatrixAt(i, temp.matrix);
  }
  ribosomes.computeBoundingSphere();
  return g;
}
export function proteinPocket(k, parent, tint = "#bda989") {
  const domainMats = [
    k.material(tint),
    k.material("#ccbfa8"),
    k.material("#aa987e"),
  ];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU,
      x = 0.47 * Math.cos(a),
      y = 0.76 * Math.sin(a);
    const l = k.ball(
      [x, y, -0.28],
      [0.25 + (i % 3) * 0.035, 0.21, 0.21],
      domainMats[i % 3],
      parent,
    );
    l.rotation.z = a;
  }
  const foldMat = k.material("#dfd1b4");
  for (let i = 0; i < 5; i++) {
    const y = -0.61 + i * 0.3;
    const pts = Array.from({ length: 40 }, (_, j) => {
      const t = j / 39;
      return [
        -0.51 + 0.24 * t,
        y + 0.055 * Math.sin(t * TAU * 4),
        -0.08 + 0.055 * Math.cos(t * TAU * 4),
      ];
    });
    k.tube(pts, 0.014, foldMat, parent, 60);
  }
  for (let i = 0; i < 3; i++) {
    const sheet = new THREE.Shape();
    sheet.moveTo(0, 0);
    sheet.lineTo(0.18, 0);
    sheet.lineTo(0.18, 0.31);
    sheet.lineTo(0.23, 0.31);
    sheet.lineTo(0.09, 0.45);
    sheet.lineTo(-0.05, 0.31);
    sheet.lineTo(0, 0.31);
    sheet.closePath();
    const mesh = k.mesh(
      new THREE.ExtrudeGeometry(sheet, { depth: 0.018, bevelEnabled: false }),
      foldMat,
      [0.18 + i * 0.09, -0.55 + i * 0.16, -0.04],
      parent,
    );
    mesh.rotation.z = -0.22;
  }
  const rim = k.ring([0, 0, -0.11], 0.3, 0.035, k.material("#8f806b"), parent);
  rim.scale.set(0.8, 1.5, 1);
  k.ball([0.06, 0.12, -0.04], 0.07, k.material("#c0a265"), parent);
}
export function surfacePores(k, source, rows = 40, columns = 48) {
  const pores = new THREE.InstancedMesh(
    new THREE.TorusGeometry(0.057, 0.015, 8, 24),
    k.material("#7583a6"),
    12,
  );
  const subunits = new THREE.InstancedMesh(k.sphere, k.material("#9ca9c2"), 96);
  pores.frustumCulled = subunits.frustumCulled = false;
  k.group.add(pores, subunits);
  const temp = new THREE.Object3D(),
    normal = new THREE.Vector3(),
    z = new THREE.Vector3(0, 0, 1),
    point = new THREE.Vector3(),
    local = new THREE.Vector3(),
    quat = new THREE.Quaternion();
  function update() {
    const a = source.geometry.attributes.position,
      n = source.geometry.attributes.normal;
    for (let i = 0; i < 12; i++) {
      const row = Math.round(rows * (0.22 + (i % 6) * 0.105)),
        col = i < 6 ? 3 : 21,
        index = row * (columns + 1) + col;
      point.fromBufferAttribute(a, index);
      normal.fromBufferAttribute(n, index).normalize();
      quat.setFromUnitVectors(z, normal);
      temp.position.copy(point);
      temp.quaternion.copy(quat);
      temp.scale.setScalar(1);
      temp.updateMatrix();
      pores.setMatrixAt(i, temp.matrix);
      for (let j = 0; j < 8; j++) {
        local
          .set(
            0.06 * Math.cos((j / 8) * TAU),
            0.06 * Math.sin((j / 8) * TAU),
            0.01,
          )
          .applyQuaternion(quat)
          .add(point);
        temp.position.copy(local);
        temp.scale.setScalar(0.018);
        temp.updateMatrix();
        subunits.setMatrixAt(i * 8 + j, temp.matrix);
      }
    }
    for (const m of [pores, subunits]) {
      m.visible = source.visible;
      m.position.copy(source.position);
      m.quaternion.copy(source.quaternion);
      m.scale.copy(source.scale);
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingBox();
      m.computeBoundingSphere();
    }
  }
  return { update };
}
export function wallAnatomy(k, shell, spore = false) {
  shell.geometry = cutSphere();
  shell.material = k.material(spore ? "#aa856a" : "#c9b998", {
    side: THREE.DoubleSide,
    roughness: 0.8,
  });
  const layers = spore
    ? [
        [0.965, "#d3bea0"],
        [0.922, "#e1d4b5"],
        [0.873, "#b1c3a1"],
        [0.84, "#83a99b"],
      ]
    : [
        [0.966, "#dfd0ad"],
        [0.932, "#8eaea0"],
        [0.91, "#c2d5c2"],
      ];
  for (const [scale, color] of layers) {
    const s = k.mesh(
      shell.geometry,
      k.material(color, { side: THREE.DoubleSide }),
      [0, 0, 0],
      shell,
    );
    s.scale.setScalar(scale);
  }
  for (const [scale, color] of layers) {
    const r = k.ring(
      [0, 0, 0.32 * scale],
      0.947 * scale,
      0.014,
      k.material(color),
      shell,
    );
    r.name = spore ? "spore-wall-layer-cut-edge" : "wall-membrane-cut-edge";
  }
  const fiberMat = k.material(spore ? "#b99a7f" : "#b6a17c");
  for (let i = 0; i < 5; i++) {
    const a = 0.8 + i * 0.22;
    const pts = Array.from({ length: 24 }, (_, j) => {
      const t = (j / 23) * Math.PI * 0.64;
      return [
        0.99 * Math.sin(a) * Math.cos(t),
        0.99 * Math.cos(a),
        -0.99 * Math.sin(a) * Math.sin(t),
      ];
    });
    k.tube(pts, 0.009, fiberMat, shell, 40);
  }
}
