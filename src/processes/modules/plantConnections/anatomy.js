import { THREE } from "../../kit.js";

// Educational envelopes and secondary structures, not atomic reconstructions.
export function anatomy(k) {
  const { material, mesh, ball, tube, segment } = k;
  const half = new THREE.SphereGeometry(1, 40, 24, Math.PI, Math.PI);
  const annulus = new THREE.RingGeometry(0.94, 1, 64);
  const thinAnnulus = new THREE.RingGeometry(0.975, 1, 64);
  const scaleMesh = (geo, mat, position, scale, parent, name) => {
    const o = mesh(geo, mat, position, parent);
    o.scale.set(...scale);
    o.name = name;
    return o;
  };
  const instance = (geometry, mat, transforms, parent, name) => {
    const o = new THREE.InstancedMesh(geometry, mat, transforms.length),
      tmp = new THREE.Object3D();
    o.name = name;
    parent.add(o);
    transforms.forEach((t, i) => {
      tmp.position.set(...t.p);
      tmp.scale.set(...t.s);
      tmp.rotation.set(...(t.r || [0, 0, 0]));
      tmp.updateMatrix();
      o.setMatrixAt(i, tmp.matrix);
    });
    o.instanceMatrix.needsUpdate = true;
    o.computeBoundingBox();
    o.computeBoundingSphere();
    return o;
  };
  function envelope(
    parent,
    center,
    scale,
    color,
    { double = true, name = "organelle", gap = 0.085 } = {},
  ) {
    const g = new THREE.Group();
    g.name = `${name}-sectioned-envelope`;
    g.position.set(...center);
    g.scale.set(...scale);
    parent.add(g);
    const outer = material(color, { side: THREE.DoubleSide }),
      inner = material(color, { side: THREE.DoubleSide, roughness: 0.65 });
    scaleMesh(half, outer, [0, 0, 0], [1, 1, 1], g, "outer-membrane-back");
    scaleMesh(
      thinAnnulus,
      material("#e1dcc0", { side: THREE.DoubleSide }),
      [0, 0, 0.004],
      [1, 1, 1],
      g,
      "outer-membrane-cut-edge",
    );
    if (double) {
      scaleMesh(
        half,
        inner,
        [0, 0, 0.014],
        [1 - gap, 1 - gap, 1 - gap],
        g,
        "inner-membrane-back",
      );
      scaleMesh(
        thinAnnulus,
        material("#92a080", { side: THREE.DoubleSide }),
        [0, 0, 0.017],
        [1 - gap, 1 - gap, 1],
        g,
        "inner-membrane-cut-edge",
      );
    } else
      scaleMesh(
        thinAnnulus,
        material("#ddd8bd", { side: THREE.DoubleSide }),
        [0, 0, 0.013],
        [0.962, 0.962, 1],
        g,
        "second-leaflet-cut-edge",
      );
    return g;
  }
  function protein(parent, center, size, color, name = "enzyme", subunits = 3) {
    const g = new THREE.Group();
    g.position.set(...center);
    g.scale.setScalar(size);
    g.name = name;
    parent.add(g);
    const base = material(color),
      light = material(color, { roughness: 0.42 });
    for (let i = 0; i < subunits; i++) {
      const a = (i / subunits) * Math.PI * 2,
        x = Math.cos(a) * 0.34,
        y = Math.sin(a) * 0.25;
      const l = ball([x, y, -0.07], [0.31, 0.25, 0.23], base, g);
      l.rotation.z = a * 0.25;
      const coil = [];
      for (let j = 0; j <= 36; j++) {
        const t = j / 36;
        coil.push([
          x - 0.17 + t * 0.34,
          y + 0.09 * Math.sin(t * 5 * Math.PI),
          0.135 + 0.034 * Math.cos(t * 5 * Math.PI),
        ]);
      }
      tube(coil, 0.024, light, g, 40);
      for (let j = 0; j < 3; j++)
        segment(
          [x - 0.13 + j * 0.095, y - 0.14, 0.1],
          [x - 0.08 + j * 0.095, y + 0.08, 0.16],
          0.024,
          light,
          g,
        );
    }
    return g;
  }
  function helix(
    parent,
    center,
    height,
    radius,
    mat,
    name = "transmembrane-helix",
  ) {
    const g = new THREE.Group();
    g.position.set(...center);
    g.name = name;
    parent.add(g);
    ball([0, 0, 0], [radius, height / 2, radius], mat, g);
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const t = i / 64,
        a = t * Math.PI * 14;
      points.push([
        Math.cos(a) * radius * 0.92,
        (t - 0.5) * height,
        Math.sin(a) * radius * 0.92,
      ]);
    }
    tube(
      points,
      radius * 0.18,
      material(mat.color.getHex(), { roughness: 0.4 }),
      g,
      64,
    );
    return g;
  }
  function chloroplast(parent, center, scale, { stacked = true } = {}) {
    const g = new THREE.Group();
    g.name = stacked ? "granate-chloroplast" : "bundle-sheath-reduced-grana";
    g.position.set(...center);
    g.scale.set(...scale);
    parent.add(g);
    envelope(g, [0, 0, 0], [1, 1, 1], "#acbd92", { name: "chloroplast" });
    const thyl = material("#76915f", { side: THREE.DoubleSide }),
      lumen = material("#d1d4a4", { side: THREE.DoubleSide });
    const sacTransforms = [],
      lumenTransforms = [],
      rimTransforms = [];
    for (let stack = 0; stack < 3; stack++)
      for (let level = 0; level < (stacked ? 5 : 2); level++) {
        const x = -0.53 + stack * 0.53,
          y = -0.4 + level * 0.095,
          z = -0.03;
        sacTransforms.push({ p: [x, y, z], s: [0.255, 0.043, 0.34] });
        lumenTransforms.push({
          p: [x, y, z + 0.006],
          s: [0.232, 0.026, 0.008],
        });
        rimTransforms.push({ p: [x, y, z + 0.013], s: [0.255, 0.043, 1] });
      }
    instance(half, thyl, sacTransforms, g, "stacked-thylakoid-membranes");
    instance(k.sphere, lumen, lumenTransforms, g, "exposed-thylakoid-lumina");
    instance(annulus, thyl, rimTransforms, g, "thylakoid-cut-rims");
    for (let row = 0; row < (stacked ? 3 : 2); row++) {
      const y = -0.4 + row * 0.18;
      tube(
        [
          [-0.68, y, -0.2],
          [-0.3, y + 0.028, -0.24],
          [0.2, y + 0.01, -0.2],
          [0.71, y + 0.04, -0.21],
        ],
        0.026,
        thyl,
        g,
      );
      tube(
        [
          [-0.68, y + 0.052, -0.2],
          [-0.3, y + 0.08, -0.24],
          [0.2, y + 0.062, -0.2],
          [0.71, y + 0.092, -0.21],
        ],
        0.026,
        thyl,
        g,
      );
    }
    for (const x of [-0.53, 0, 0.53])
      tube(
        [
          [x - 0.17, -0.41, -0.23],
          [x - 0.22, -0.15, -0.29],
          [x - 0.15, 0.04, -0.24],
        ],
        0.032,
        thyl,
        g,
      );
    // Stromal starch and a plastid DNA loop are separated from the active carbon pool.
    ball([-0.48, 0.34, -0.18], [0.23, 0.13, 0.15], material("#d7d5b2"), g);
    const dna = [];
    for (let i = 0; i <= 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      dna.push([
        0.47 + 0.19 * Math.cos(a),
        0.38 + 0.1 * Math.sin(a),
        -0.14 + 0.025 * Math.sin(a * 3),
      ]);
    }
    tube(dna, 0.012, material("#b2a373"), g, 48);
    return g;
  }
  function mitochondrion(parent, center, scale) {
    const g = new THREE.Group();
    g.name = "mitochondrion-double-envelope-and-cristae";
    g.position.set(...center);
    g.scale.set(...scale);
    parent.add(g);
    envelope(g, [0, 0, 0], [1, 1, 1], "#c6a39b", {
      name: "mitochondrion",
      gap: 0.1,
    });
    const membrane = material("#b4857e"),
      rim = material("#dfc3ae");
    for (let i = 0; i < 5; i++) {
      const x = -0.66 + i * 0.31,
        base = -0.62 * Math.sqrt(1 - x * x),
        height = 0.83 * (1 - Math.abs(x) * 0.32);
      const outer = [
        [x - 0.085, base, -0.1],
        [x - 0.065, base + height, -0.14],
        [x + 0.06, base + height + 0.04, -0.16],
        [x + 0.095, base, -0.12],
      ];
      tube(outer, 0.068, membrane, g, 40);
      const inner = outer.map((p) => [p[0], p[1] - 0.016, p[2] + 0.047]);
      tube(inner, 0.027, rim, g, 40);
      // Two connecting necks anchor every crista to the inner boundary.
      segment(
        [x - 0.085, base, -0.1],
        [x - 0.085, base - 0.12, -0.13],
        0.065,
        membrane,
        g,
      );
      segment(
        [x + 0.095, base, -0.12],
        [x + 0.095, base - 0.12, -0.13],
        0.065,
        membrane,
        g,
      );
      for (let j = 0; j < 3; j++) {
        const y = base + 0.18 + j * 0.16;
        segment([x + 0.12, y, -0.1], [x + 0.22, y, -0.06], 0.015, membrane, g);
        ball([x + 0.24, y, -0.05], 0.045, rim, g);
      }
    }
    return g;
  }
  function cellulose(parent, from, to, width = 0.05, strands = 4) {
    const g = new THREE.Group();
    g.name = "cellulose-microfibril-bundle";
    parent.add(g);
    for (let strand = 0; strand < strands; strand++) {
      const a = (strand / strands) * Math.PI * 2,
        points = [];
      for (let i = 0; i <= 20; i++) {
        const t = i / 20;
        points.push([
          from[0] + (to[0] - from[0]) * t,
          from[1] + (to[1] - from[1]) * t + Math.cos(a) * width,
          from[2] + (to[2] - from[2]) * t + Math.sin(a) * width,
        ]);
      }
      tube(points, 0.009, material(strand % 2 ? "#b5ad81" : "#dbd1a7"), g, 24);
    }
    return g;
  }
  return {
    instance,
    envelope,
    protein,
    helix,
    chloroplast,
    mitochondrion,
    cellulose,
  };
}
