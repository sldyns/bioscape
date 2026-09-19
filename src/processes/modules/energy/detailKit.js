import { THREE } from "../../kit.js";

// Schematic folds, not fitted atomic coordinates. Resolved c-ring repeats use an
// explicitly supplied, source-backed count; null preserves an unresolved contour.
export function energyDetails(k) {
  const { group, material, mesh, ball, segment, tube } = k;
  const helixPoints = Array.from({ length: 73 }, (_, i) => {
    const t = i / 72,
      a = t * Math.PI * 12;
    return new THREE.Vector3(0.042 * Math.cos(a), t - 0.5, 0.042 * Math.sin(a));
  });
  const helixGeometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(helixPoints),
    72,
    0.019,
    6,
    false,
  );
  const sheetGeometry = new THREE.BoxGeometry(0.07, 0.38, 0.025);
  const phosphateO = material("#c29173"),
    bond = material("#b2b9aa");
  const tmA = material("#779992"),
    tmB = material("#a6b8a3");
  function helix(parent, position, length, mat, rotation = 0) {
    const o = mesh(helixGeometry, mat, position, parent);
    o.scale.y = length;
    o.rotation.z = rotation;
    return o;
  }
  function bundle(parent, position, scale, mat, count = 6) {
    const g = new THREE.Group();
    g.position.set(...position);
    g.scale.set(...scale);
    parent.add(g);
    g.name = "schematic-transmembrane-helix-bundle";
    for (let i = 0; i < count; i++) {
      const a = (i * Math.PI * 2) / count;
      helix(
        g,
        [0.22 * Math.cos(a), 0, 0.22 * Math.sin(a)],
        0.85 + (i % 2) * 0.1,
        mat,
        0.07 * Math.sin(a),
      );
    }
    for (const s of [-1, 1])
      tube(
        [
          [-0.2, s * 0.48, 0],
          [0, s * 0.55, 0.13],
          [0.2, s * 0.45, 0],
        ],
        0.025,
        mat,
        g,
        14,
      );
    return g;
  }
  function fold(parent, position, scale, mat, face = 1) {
    const g = new THREE.Group();
    g.position.set(...position);
    g.scale.set(...scale);
    parent.add(g);
    g.name = "schematic-protein-domain-cleft";
    // Asymmetric domains leave a front-facing cleft, with sheet/helix motifs.
    for (const [x, y, z, sx, sy, sz] of [
      [-0.25, 0, -0.08, 0.28, 0.48, 0.31],
      [0.22, 0.13, -0.1, 0.27, 0.37, 0.3],
      [0, -0.3, -0.17, 0.35, 0.2, 0.24],
      [-0.16, 0.36, -0.12, 0.27, 0.2, 0.25],
    ])
      ball([x, y, z], [sx, sy, sz], mat, g);
    for (let i = 0; i < 4; i++) {
      const s = mesh(
        sheetGeometry,
        tmB,
        [-0.14 + i * 0.085, -0.02, face * 0.25],
        g,
      );
      s.rotation.z = -0.17 + i * 0.07;
    }
    helix(g, [-0.35, 0.07, face * 0.19], 0.64, mat, -0.19);
    helix(g, [0.35, 0.03, face * 0.17], 0.55, mat, 0.23);
    tube(
      [
        [-0.35, 0.4, 0.14],
        [-0.18, 0.56, 0.16],
        [0.05, 0.47, 0.2],
        [0.31, 0.37, 0.18],
      ],
      0.022,
      tmB,
      g,
      22,
    );
    return g;
  }
  function bilayer({
    length = 9,
    depth = 1.5,
    y = 0,
    curve = () => 0,
    holes = [],
    include = () => true,
  } = {}) {
    const coords = [];
    for (let ix = 0; ix <= Math.round(length / 0.16); ix++)
      for (let iz = 0; iz <= Math.round(depth / 0.16); iz++) {
        const x = -length / 2 + ix * 0.16 + (iz % 2) * 0.08,
          z = -depth / 2 + iz * 0.16;
        if (
          !include(x, z) ||
          holes.some(
            (h) => ((x - h[0]) / h[2]) ** 2 + ((z - h[1]) / h[3]) ** 2 < 1,
          )
        )
          continue;
        coords.push([x, y + curve(x), z]);
      }
    const heads = [material("#a2bbaa"), material("#87a89c")],
      tailMat = material("#cbc5a3");
    const temp = new THREE.Object3D();
    const parent = new THREE.Group();
    parent.name = "paired-leaflets-with-twin-acyl-tails";
    group.add(parent);
    for (const [side, index] of [
      [1, 0],
      [-1, 1],
    ]) {
      const head = new THREE.InstancedMesh(
        k.sphere,
        heads[index],
        coords.length,
      );
      head.name = side > 0 ? "upper-leaflet-heads" : "lower-leaflet-heads";
      parent.add(head);
      const geometries = [0, 1].map(
        (t) =>
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(
              [
                [t ? 0.025 : -0.025, side * 0.17, 0],
                [t ? 0.03 : -0.025, side * 0.12, 0.006],
                [t ? 0.06 : -0.03, side * 0.055, 0.007],
                [t ? 0.04 : -0.025, side * 0.015, 0.01],
              ].map((p) => new THREE.Vector3(...p)),
            ),
            12,
            0.013,
            5,
            false,
          ),
      );
      const tails = geometries.map((geo) => {
        const o = new THREE.InstancedMesh(geo, tailMat, coords.length);
        o.name = side > 0 ? "upper-leaflet-tails" : "lower-leaflet-tails";
        parent.add(o);
        return o;
      });
      coords.forEach(([x, cy, z], i) => {
        temp.position.set(x, cy + side * 0.205, z);
        temp.scale.set(0.064, 0.057, 0.064);
        temp.updateMatrix();
        head.setMatrixAt(i, temp.matrix);
        temp.position.set(x, cy, z);
        temp.scale.setScalar(1);
        temp.updateMatrix();
        for (const o of tails) o.setMatrixAt(i, temp.matrix);
      });
      for (const o of [head, ...tails]) {
        o.instanceMatrix.needsUpdate = true;
        o.computeBoundingBox();
        o.computeBoundingSphere();
      }
    }
    return parent;
  }
  function phosphate(parent = group, position = [0, 0, 0], size = 1) {
    const g = new THREE.Group();
    g.position.set(...position);
    g.scale.setScalar(size);
    parent.add(g);
    g.name = "tetrahedral-phosphate-schematic";
    ball([0, 0, 0], 0.09, material("#d5ad67"), g);
    for (const p of [
      [0.15, 0.09, 0.03],
      [-0.13, 0.1, -0.02],
      [0.01, -0.09, 0.14],
      [-0.02, -0.1, -0.12],
    ]) {
      segment([0, 0, 0], p, 0.022, bond, g);
      ball(p, 0.045, phosphateO, g);
    }
    return g;
  }
  function nucleotide(parent = group, position = [0, 0, 0], size = 1) {
    const g = new THREE.Group();
    g.position.set(...position);
    g.scale.setScalar(size);
    parent.add(g);
    g.name = "adenosine-ring-scaffold";
    const mat = material("#ae97bd");
    function polygon(cx, cy, r, n, angle) {
      const pts = Array.from({ length: n }, (_, i) => [
        cx + r * Math.cos(angle + (i * Math.PI * 2) / n),
        cy + r * Math.sin(angle + (i * Math.PI * 2) / n),
        0,
      ]);
      for (let i = 0; i < n; i++) {
        segment(pts[i], pts[(i + 1) % n], 0.025, mat, g);
        ball(pts[i], 0.04, i % 2 ? mat : phosphateO, g);
      }
    }
    polygon(0.07, 0.08, 0.18, 6, Math.PI / 6);
    polygon(0.3, 0.08, 0.145, 5, 0.65);
    polygon(-0.22, -0.15, 0.14, 5, 0.4);
    segment([-0.08, 0.02, 0], [-0.14, -0.07, 0], 0.028, mat, g);
    segment([-0.33, -0.19, 0], [-0.45, -0.22, 0], 0.024, mat, g);
    return g;
  }
  function adenylate(parent = group, position = [0, 0, 0], size = 0.5) {
    const g = nucleotide(parent, position, size);
    g.name = "ATP-triphosphate-scaffold";
    for (let i = 0; i < 3; i++) {
      phosphate(g, [-0.52 - i * 0.17, -0.22, 0], 0.45);
      if (i)
        segment(
          [-0.52 - (i - 1) * 0.17, -0.22, 0],
          [-0.52 - i * 0.17, -0.22, 0],
          0.021,
          bond,
          g,
        );
    }
    return g;
  }
  function synthase(parent, rotor, origin, headOffset, cCount) {
    if (cCount !== null && (!Number.isInteger(cCount) || cCount < 8))
      throw new Error(
        "ATP synthase needs an explicit supported c-ring count or null",
      );
    rotor.name = "ATP-synthase-rotor";
    // Rotor is the caller's animated group. a-subunit and peripheral stalk stay fixed.
    rotor.children.forEach((o) => {
      if (o.isMesh) o.visible = false;
    });
    if (cCount === null) {
      // Continuous protein-density contour: no invented subunit seams. The
      // membrane motor, shaft and stator remain present and functional.
      const profile = [
        [0.13, -0.3],
        [0.25, -0.3],
        [0.32, -0.24],
        [0.3, 0],
        [0.32, 0.24],
        [0.25, 0.3],
        [0.13, 0.3],
        [0.13, -0.3],
      ].map(([r, y]) => new THREE.Vector2(r, y));
      const contour = mesh(
        new THREE.LatheGeometry(profile, 64),
        tmA,
        [0, 0, 0],
        rotor,
      );
      contour.name = "unresolved-c-ring-contour";
    }
    for (let i = 0; i < (cCount ?? 0); i++) {
      const a = (i * Math.PI * 2) / cCount;
      const g = new THREE.Group();
      g.name = "c-ring-subunit";
      g.position.set(0.28 * Math.cos(a), 0, 0.28 * Math.sin(a));
      g.rotation.y = -a;
      // The polar hairpin loop faces F1 (matrix/cytoplasm). A proper rigid
      // half-turn preserves alpha-helix handedness; do not mirror the mesh.
      g.rotation.x = headOffset < 0 ? Math.PI : 0;
      rotor.add(g);
      helix(g, [-0.036, 0, 0], 0.58, tmA);
      helix(g, [0.036, 0, 0], 0.58, tmB);
      tube(
        [
          [-0.036, 0.29, 0],
          [0, 0.33, 0.02],
          [0.036, 0.29, 0],
        ],
        0.018,
        tmA,
        g,
        10,
      );
    }
    for (const phase of [0, Math.PI]) {
      const points = Array.from({ length: 30 }, (_, i) => {
        const t = i / 29,
          a = t * Math.PI * 2 + phase;
        return [0.055 * Math.cos(a), headOffset * t, 0.055 * Math.sin(a)];
      });
      tube(points, 0.033, material("#b3a086"), rotor, 40);
    }
    const fixed = new THREE.Group();
    fixed.position.set(...origin);
    parent.add(fixed);
    fixed.name = "stationary-a-subunit-and-peripheral-stator";
    bundle(fixed, [0.5, 0, -0.02], [0.7, 0.85, 0.8], tmA, 5);
    for (const z of [-0.12, 0.06])
      tube(
        [
          [0.5, 0.1, z],
          [0.61, headOffset * 0.4, z],
          [0.58, headOffset * 0.87, z],
          [0.25, headOffset * 1.08, z],
        ],
        0.029,
        tmB,
        fixed,
        30,
      );
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const g = fold(
        fixed,
        [0.33 * Math.cos(a), headOffset, 0.33 * Math.sin(a)],
        [0.53, 0.63, 0.6],
        i % 2 ? tmA : material("#91a2b5"),
      );
      g.rotation.y = -a;
    }
    for (let i = 0; i < 3; i++) {
      const a = ((i * 2 + 0.5) * Math.PI) / 3;
      const n = nucleotide(
        fixed,
        [0.45 * Math.cos(a), headOffset, 0.45 * Math.sin(a)],
        0.3,
      );
      n.rotation.y = -a;
    }
    return fixed;
  }
  return {
    helix,
    bundle,
    fold,
    bilayer,
    phosphate,
    nucleotide,
    adenylate,
    synthase,
  };
}
