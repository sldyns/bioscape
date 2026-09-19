import { THREE } from "../../kit.js";

// Mechanistic schematics, not fitted atomic coordinates. All GPU resources are
// constructed once. Repeated phosphate/base elements share instanced geometry.
export function duplex(
  k,
  {
    x0 = -4.5,
    x1 = 4.5,
    y = 0,
    radius = 0.2,
    count = 72,
    parent = k.group,
  } = {},
) {
  const colors = ["#719797", "#9ca7bd"].map((c) => k.material(c));
  const baseColors = ["#c1d2c5", "#d5c4ac"].map((c) => k.material(c));
  const group = new THREE.Group();
  group.name = "DNA: paired bases and sugar-phosphate backbones";
  parent.add(group);
  const box = new THREE.BoxGeometry(1, 1, 1),
    unit = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0),
    d = new THREE.Vector3();
  const rails = colors.map(
    (m) => new THREE.InstancedMesh(k.cylinder, m, count * 2),
  );
  const phosphates = colors.map(
    (m) => new THREE.InstancedMesh(k.sphere, m, count + 1),
  );
  const sugars = colors.map((m) => new THREE.InstancedMesh(box, m, count + 1));
  const bases = baseColors.map(
    (m) => new THREE.InstancedMesh(box, m, count + 1),
  );
  rails.forEach((m, i) => (m.name = `DNA backbone ${i}`));
  phosphates.forEach((m, i) => (m.name = `DNA phosphates ${i}`));
  bases.forEach((m, i) => (m.name = `DNA bases ${i}`));
  const all = [...rails, ...phosphates, ...sugars, ...bases];
  all.forEach((m) => {
    group.add(m);
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.frustumCulled = false;
  });
  const pts = [
    Array.from({ length: count * 2 + 1 }, () => new THREE.Vector3()),
    Array.from({ length: count * 2 + 1 }, () => new THREE.Vector3()),
  ];
  function place(m, i, x, y, z, sx, sy, sz) {
    unit.position.set(x, y, z);
    unit.quaternion.identity();
    unit.scale.set(sx, sy, sz);
    unit.updateMatrix();
    m.setMatrixAt(i, unit.matrix);
  }
  function segment(m, i, a, b, w, depth = w) {
    d.subVectors(b, a);
    unit.position.copy(a).add(b).multiplyScalar(0.5);
    const length = d.length();
    unit.quaternion.setFromUnitVectors(up, d.normalize());
    unit.scale.set(w, Math.max(length, 0.0001), depth);
    unit.updateMatrix();
    m.setMatrixAt(i, unit.matrix);
  }
  const center = new THREE.Vector3(),
    baseEnd = new THREE.Vector3();
  // Multiple elongating complexes each retain their own locally open duplex.
  // Maximum (not sum) keeps overlapping schematic bubbles bounded.
  function openingAt(x, centers, opening) {
    if (!Array.isArray(centers))
      return opening * Math.exp(-Math.pow((x - centers) / 0.43, 2));
    let spread = 0;
    for (const bubble of centers)
      spread = Math.max(
        spread,
        bubble.opening * Math.exp(-Math.pow((x - bubble.x) / 0.43, 2)),
      );
    return spread;
  }
  function update(bubbleX = 99, opening = 0) {
    // Both material strands use one x-axis centerline and its orthogonal y/z
    // frame. Melting reduces local twist density and increases positive radii;
    // it never blends one helical strand through the axis toward a fixed side.
    // Integrating the nonnegative twist density also prevents a narrow shoulder
    // from acquiring arbitrarily fast winding as a moving bubble changes phase.
    // Downstream rotation represents schematic torsional relaxation, not a
    // clamped-end/torque simulation. Closing restores the original helix.
    let phase = 0,
      previousSpread = openingAt(x0, bubbleX, opening);
    for (let i = 0; i <= count * 2; i++) {
      const x = x0 + ((x1 - x0) * i) / (count * 2),
        spread = openingAt(x, bubbleX, opening),
        ry = radius * (1 - spread) + 0.34 * spread,
        rz = radius * 0.72 * (1 - spread) + 0.34 * spread;
      if (i) phase += 0.29 * (1 - (previousSpread + spread) * 0.5);
      previousSpread = spread;
      for (let s = 0; s < 2; s++) {
        const sign = s ? -1 : 1;
        pts[s][i].set(
          x,
          y + sign * ry * Math.cos(phase),
          sign * rz * Math.sin(phase),
        );
      }
    }
    for (let s = 0; s < 2; s++)
      for (let i = 0; i <= count; i++) {
        const p = pts[s][i * 2];
        place(phosphates[s], i, p.x, p.y, p.z, 0.056, 0.056, 0.056);
        place(sugars[s], i, p.x + 0.037, p.y, p.z, 0.052, 0.072, 0.061);
        center
          .copy(pts[0][i * 2])
          .add(pts[1][i * 2])
          .multiplyScalar(0.5);
        baseEnd.copy(center).lerp(p, 0.1);
        const spread = openingAt(p.x, bubbleX, opening);
        baseEnd.lerp(p, spread * 0.72);
        segment(bases[s], i, p, baseEnd, 0.071, 0.026);
      }
    for (let s = 0; s < 2; s++)
      for (let i = 0; i < count * 2; i++)
        segment(rails[s], i, pts[s][i], pts[s][i + 1], 0.026);
    all.forEach((m) => {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingSphere();
      m.computeBoundingBox();
    });
  }
  update();
  return { group, update };
}
export function nucleotideDetail(
  k,
  mesh,
  { spacing = 0.13, radius = 0.038 } = {},
) {
  const path = mesh.geometry.parameters.path,
    n = Math.max(5, Math.ceil(path.getLength() / spacing));
  const bases = new THREE.InstancedMesh(
      new THREE.BoxGeometry(1, 1, 1),
      k.material("#dbc59e"),
      n,
    ),
    phosphate = new THREE.InstancedMesh(k.sphere, k.material("#e0b892"), n),
    pose = new THREE.Object3D();
  bases.name = "RNA exposed nucleotide bases";
  phosphate.name = "RNA phosphate repeat";
  mesh.add(bases, phosphate);
  for (let i = 0; i < n; i++) {
    const p = path.getPointAt(i / (n - 1)),
      t = path.getTangentAt(i / (n - 1));
    pose.position.copy(p);
    pose.scale.setScalar(radius);
    pose.quaternion.identity();
    pose.updateMatrix();
    phosphate.setMatrixAt(i, pose.matrix);
    pose.position.set(p.x - t.y * 0.075, p.y + t.x * 0.075, p.z + 0.025);
    pose.rotation.z = Math.atan2(t.y, t.x);
    pose.scale.set(0.045, 0.12, 0.023);
    pose.updateMatrix();
    bases.setMatrixAt(i, pose.matrix);
  }
  for (const m of [bases, phosphate]) {
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
    m.computeBoundingBox();
  }
  function update() {
    const f = Math.min(
      1,
      mesh.geometry.drawRange.count / mesh.geometry.index.count,
    );
    bases.count = phosphate.count = Math.max(0, Math.floor(n * f));
  }
  update();
  return { update };
}
export function helix(
  k,
  parent,
  position,
  material,
  { length = 0.4, radius = 0.055, turns = 3, rotation = 0 } = {},
) {
  const g = new THREE.Group();
  parent.add(g);
  g.position.set(...position);
  g.rotation.z = rotation;
  const pts = Array.from({ length: 41 }, (_, i) => {
    const a = (i / 40) * turns * Math.PI * 2;
    return [
      radius * Math.cos(a),
      length * (i / 40 - 0.5),
      radius * Math.sin(a),
    ];
  });
  k.tube(pts, 0.022, material, g, 48);
  return g;
}
export function polymeraseBody(
  k,
  parent,
  material,
  scale = 0.65,
  type = "bacterial",
) {
  const g = new THREE.Group();
  g.name =
    type === "polII"
      ? "Pol II: clamp, lobe, jaw and stalk"
      : "Bacterial RNAP: beta/beta-prime cleft and alpha domains";
  parent.add(g);
  g.scale.setScalar(scale);
  const light = k.material("#aebecb"),
    dark = k.material("#687f99");
  for (const [p, s, m] of [
    [[-0.45, 0.1, -0.19], [0.26, 0.5, 0.29], material],
    [[0.45, 0.09, -0.2], [0.27, 0.44, 0.3], light],
    [[0, 0.52, -0.22], [0.46, 0.19, 0.3], material],
    [[0, -0.38, -0.28], [0.4, 0.14, 0.22], dark],
    [[-0.55, -0.3, -0.19], [0.18, 0.23, 0.22], light],
    [[0.53, -0.3, -0.18], [0.18, 0.23, 0.22], material],
  ])
    k.ball(p, s, m, g);
  k.segment([-0.26, -0.13, -0.02], [0.25, -0.13, -0.02], 0.04, dark, g);
  k.ball([0, -0.09, 0.025], 0.055, k.material("#cda86d"), g);
  for (const x of [-0.45, 0.45])
    for (let j = 0; j < 3; j++)
      helix(k, g, [x + (j - 1) * 0.07, 0.15, 0.085], j % 2 ? light : dark, {
        length: 0.37,
        radius: 0.034,
        turns: 3,
        rotation: x > 0 ? -0.25 : 0.25,
      });
  if (type === "polII") {
    k.segment([0.58, 0.2, -0.2], [0.83, 0.43, -0.2], 0.075, material, g);
    k.ball([0.83, 0.43, -0.2], [0.16, 0.25, 0.14], light, g);
  } else {
    k.ball([-0.38, 0.61, -0.19], 0.16, light, g);
    k.ball([0.03, 0.7, -0.2], 0.15, light, g);
  }
  return g;
}
export function regulatorDomains(k, parent, material, type) {
  const light = k.material(type === "cap" ? "#a8bc98" : "#c1a9bc"),
    pocket = k.material("#776681");
  const signCount = type === "lacI" ? 4 : 2;
  for (let i = 0; i < signCount; i++) {
    const x = ((i % 2) - 0.5) * 0.46,
      y = Math.floor(i / 2) * 0.33;
    helix(k, parent, [x, y + 0.03, 0.23], light, {
      length: 0.3,
      radius: 0.045,
      rotation: i % 2 ? -0.25 : 0.25,
    });
    const head = k.ball([x, y - 0.26, 0.02], [0.15, 0.17, 0.14], light, parent);
    helix(k, head, [0, 0, 0.1], material, {
      length: 0.18,
      radius: 0.03,
      turns: 2,
      rotation: 1.1,
    });
    const p = k.ring([x, y + 0.13, 0.26], 0.1, 0.028, pocket, parent);
    p.scale.set(1, 0.7, 1);
  }
  if (type === "lacI")
    k.segment([-0.23, 0.2, -0.05], [0.23, 0.2, -0.05], 0.07, light, parent);
}
export function ribosomeDetail(k, parent, material) {
  parent.name = "70S ribosome with mRNA channel, small-subunit head and rRNA";
  const large = k.material("#baa980"),
    rrna = k.material("#6c8f99");
  k.ball([0.25, 0.32, 0.02], [0.2, 0.21, 0.23], material, parent);
  k.ball([-0.34, 0.2, -0.05], [0.18, 0.18, 0.23], large, parent);
  k.ball([-0.29, -0.16, -0.03], [0.21, 0.19, 0.21], large, parent);
  k.segment([0.3, -0.14, -0.03], [0.5, -0.07, -0.03], 0.046, large, parent);
  for (let row = 0; row < 4; row++) {
    const pts = Array.from({ length: 22 }, (_, i) => {
      const t = (i / 21) * Math.PI;
      return [
        Math.cos(t) * (0.37 - row * 0.035),
        Math.sin(t) * 0.13 + (row < 2 ? 0.14 : -0.19) + (row % 2) * 0.045,
        0.28,
      ];
    });
    k.tube(pts, 0.022, rrna, parent, 28);
  }
  const mouth = k.ring([-0.13, 0.38, 0.06], 0.082, 0.025, large, parent);
  mouth.rotation.x = 0.4;
}
export function nuclearRim(
  k,
  {
    center = [0, 0, -0.3],
    rx = 4.45,
    ry = 3.12,
    pores = 10,
    transportPore = null,
  } = {},
) {
  const g = new THREE.Group();
  g.name = "Cut nuclear envelope: two membranes, lumen and eightfold pores";
  k.group.add(g);
  g.position.set(...center);
  const membrane = k.material("#b6c4b6", { side: THREE.DoubleSide }),
    inner = k.material("#d3d9c7"),
    poreMat = k.material("#a7b4c1");
  // A broad annular cut surface leaves an unobstructed nuclear interior.
  const poreAngle = (i) =>
    transportPore?.index === i
      ? transportPore.angle
      : ((i + 0.3) / pores) * Math.PI * 2;
  const annulus = new THREE.RingGeometry(1, 1.055, 480),
    cut = k.mesh(annulus, inner, [0, 0, -0.055], g);
  cut.scale.set(rx, ry, 1);
  cut.name = "Nuclear envelope cut surface";
  const indices = [],
    position = annulus.attributes.position,
    index = annulus.index.array;
  for (let j = 0; j < index.length; j += 3) {
    let x = 0,
      y = 0;
    for (let q = 0; q < 3; q++) {
      x += position.getX(index[j + q]);
      y += position.getY(index[j + q]);
    }
    const a = Math.atan2(y, x);
    let throughPore = false;
    for (let n = 0; n < pores; n++) {
      const pa = poreAngle(n);
      const delta = Math.atan2(Math.sin(a - pa), Math.cos(a - pa));
      if (
        Math.abs(delta) <
        (transportPore?.index === n
          ? transportPore.halfAngle
          : 0.11 / Math.max(rx, ry))
      )
        throughPore = true;
    }
    if (!throughPore) indices.push(index[j], index[j + 1], index[j + 2]);
  }
  annulus.setIndex(indices);
  for (const f of [1, 1.055])
    for (const z of [-0.13, 0.03]) {
      const start = transportPore
        ? transportPore.angle + transportPore.halfAngle
        : 0;
      const length = transportPore
        ? Math.PI * 2 - 2 * transportPore.halfAngle
        : Math.PI * 2;
      const m = k.mesh(
        new THREE.TorusGeometry(1, 0.012, 10, 112, length),
        membrane,
        [0, 0, z],
        g,
      );
      m.rotation.z = start;
      m.scale.set(rx * f, ry * f, 1);
      m.name = "Nuclear membrane cut edge";
      // Ellipse scaling must act before arc rotation, so bake the arc angle.
      if (transportPore) {
        m.geometry.rotateZ(start);
        m.rotation.z = 0;
      }
    }
  for (let i = 0; i < pores; i++) {
    const a = poreAngle(i),
      cx = rx * 1.026 * Math.cos(a),
      cy = ry * 1.026 * Math.sin(a);
    const pg = new THREE.Group();
    g.add(pg);
    pg.name = `Nuclear pore ${i}`;
    pg.position.set(
      cx,
      cy,
      transportPore?.index === i ? transportPore.z : 0.045,
    );
    pg.rotation.z = a;
    if (transportPore?.index === i) {
      // The channel axis is radial; its transverse aperture is the YZ circle.
      const ring = k.ring(
        [0, 0, 0],
        transportPore.radius,
        transportPore.tube,
        poreMat,
        pg,
      );
      ring.rotation.y = Math.PI / 2;
      ring.name = "Hog1 transport pore aperture";
      for (let j = 0; j < 8; j++) {
        const t = (j * Math.PI) / 4;
        k.ball(
          [
            0,
            transportPore.radius * Math.cos(t),
            transportPore.radius * Math.sin(t),
          ],
          0.032,
          poreMat,
          pg,
        );
      }
      for (const x of [-0.065, 0.065]) {
        const r = k.ring([x, 0, 0], transportPore.radius, 0.016, inner, pg);
        r.rotation.y = Math.PI / 2;
      }
    } else {
      const ring = k.ring([0, 0, 0], 0.16, 0.035, poreMat, pg);
      ring.scale.set(0.75, 1, 1);
      for (let j = 0; j < 8; j++) {
        const t = (j * Math.PI) / 4;
        k.ball(
          [0.12 * Math.cos(t), 0.16 * Math.sin(t), 0.035],
          0.037,
          poreMat,
          pg,
        );
      }
      for (const z of [-0.08, 0.09]) {
        const r = k.ring([0, 0, z], 0.115, 0.016, inner, pg);
        r.scale.set(0.75, 1, 1);
      }
    }
  }
  return g;
}
export function kinaseDetail(k, parent, material, { scale = 1 } = {}) {
  const g = new THREE.Group();
  parent.add(g);
  g.scale.setScalar(scale);
  g.name = "Kinase N/C lobes and ATP cleft";
  const light = k.material("#b9bcc9"),
    dark = k.material("#7c7490");
  k.ball([-0.21, 0.06, -0.07], [0.16, 0.21, 0.17], material, g);
  k.ball([0.2, -0.08, -0.07], [0.2, 0.24, 0.18], light, g);
  k.segment([-0.06, 0.17, -0.08], [0.05, 0.17, -0.08], 0.04, dark, g);
  for (const x of [-0.2, 0.2])
    for (let i = 0; i < 2; i++)
      helix(k, g, [x + (i - 0.5) * 0.07, 0, 0.12], dark, {
        length: 0.23,
        radius: 0.026,
        turns: 2,
        rotation: x,
      });
  return g;
}
export function materialInventory(group) {
  const materials = new Set();
  group.traverse((o) => {
    if (Array.isArray(o.material)) o.material.forEach((m) => materials.add(m));
    else if (o.material) materials.add(o.material);
  });
  return [...materials];
}

export function lipidRim(k, parent, { rx = 3.9, ry = 2.7, count = 160 } = {}) {
  const heads = new THREE.InstancedMesh(
      k.sphere,
      k.material("#a7c1b1"),
      count * 2,
    ),
    tails = new THREE.InstancedMesh(
      k.cylinder,
      k.material("#c9c6a5"),
      count * 4,
    ),
    pose = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    d = new THREE.Vector3();
  heads.name = "Paired membrane phosphate leaflets";
  tails.name = "Two acyl tails per lipid";
  parent.add(heads, tails);
  let h = 0,
    t = 0;
  for (let i = 0; i < count; i++) {
    const angle = 0.085 + ((Math.PI * 2 - 0.17) * i) / (count - 1);
    for (let side = 0; side < 2; side++) {
      const f = side ? 1 : 0.947,
        x = rx * f * Math.cos(angle),
        y = ry * f * Math.sin(angle);
      pose.position.set(x, y, 0);
      pose.scale.setScalar(0.042);
      pose.quaternion.identity();
      pose.updateMatrix();
      heads.setMatrixAt(h++, pose.matrix);
      for (const offset of [-0.025, 0.025]) {
        a.set(x - Math.sin(angle) * offset, y + Math.cos(angle) * offset, 0);
        b.set(
          rx * (side ? 0.976 : 0.972) * Math.cos(angle) -
            Math.sin(angle) * offset,
          ry * (side ? 0.976 : 0.972) * Math.sin(angle) +
            Math.cos(angle) * offset,
          -0.035,
        );
        d.subVectors(b, a);
        const len = d.length();
        pose.position.copy(a).add(b).multiplyScalar(0.5);
        pose.quaternion.setFromUnitVectors(up, d.normalize());
        pose.scale.set(0.013, len, 0.013);
        pose.updateMatrix();
        tails.setMatrixAt(t++, pose.matrix);
      }
    }
  }
  for (const m of [heads, tails]) {
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingBox();
    m.computeBoundingSphere();
  }
  return { heads, tails };
}

export function nascentBridge(k, material) {
  const group = new THREE.Group();
  group.name = "Continuous nascent RNA exit from polymerase";
  k.group.add(group);
  const segments = 16,
    backbone = new THREE.InstancedMesh(k.cylinder, material, segments),
    phosphates = new THREE.InstancedMesh(
      k.sphere,
      k.material("#e0b892"),
      segments + 1,
    );
  group.add(backbone, phosphates);
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    d = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0),
    pose = new THREE.Object3D();
  backbone.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  phosphates.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  backbone.frustumCulled = phosphates.frustumCulled = false;
  const points = Array.from(
    { length: segments + 1 },
    () => new THREE.Vector3(),
  );
  function update(curve, t, polymerase, visible) {
    group.visible = visible;
    curve.getPointAt(Math.max(0, Math.min(1, t)), a);
    b.copy(polymerase.position);
    b.y -= 0.13;
    b.z += 0.07;
    for (let i = 0; i <= segments; i++) {
      const f = i / segments,
        q = points[i];
      q.copy(a).lerp(b, f);
      q.x += 0.18 * Math.sin(Math.PI * f);
      q.z += 0.06 * Math.sin(Math.PI * f);
      pose.position.copy(q);
      pose.quaternion.identity();
      pose.scale.setScalar(0.033);
      pose.updateMatrix();
      phosphates.setMatrixAt(i, pose.matrix);
      if (i) {
        d.subVectors(q, points[i - 1]);
        const len = d.length();
        pose.position
          .copy(q)
          .add(points[i - 1])
          .multiplyScalar(0.5);
        pose.quaternion.setFromUnitVectors(up, d.normalize());
        pose.scale.set(0.024, Math.max(len, 0.0001), 0.024);
        pose.updateMatrix();
        backbone.setMatrixAt(i - 1, pose.matrix);
      }
    }
    for (const m of [backbone, phosphates]) {
      m.instanceMatrix.needsUpdate = true;
      m.computeBoundingBox();
      m.computeBoundingSphere();
    }
  }
  return { group, update };
}

export function trackMaterials(k) {
  const allocate = k.material,
    materials = new Set();
  k.material = (...args) => {
    const m = allocate(...args);
    materials.add(m);
    return m;
  };
  k.materialInventory = () => [...materials];
  return k;
}
