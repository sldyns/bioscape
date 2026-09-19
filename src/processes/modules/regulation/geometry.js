import { THREE } from "../../kit.js";

// Fixed topology tubes: updates only rewrite buffers; molecular silhouettes are schematic.
export function dynamicTube(kit, count, radius, material, parent = kit.group) {
  const sides = 8,
    positions = new Float32Array((count + 1) * sides * 3);
  const indices = [];
  for (let i = 0; i < count; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * sides + j,
        b = i * sides + ((j + 1) % sides);
      indices.push(a, b, a + sides, b, b + sides, a + sides);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
  );
  geometry.setIndex(indices);
  const mesh = kit.mesh(geometry, material, [0, 0, 0], parent);
  const samples = Array.from({ length: count + 1 }, () => new THREE.Vector3());
  const tangent = new THREE.Vector3(),
    normal = new THREE.Vector3(),
    binormal = new THREE.Vector3();
  const axis = new THREE.Vector3(0, 0, 1);
  return {
    mesh,
    update(point) {
      for (let i = 0; i <= count; i++) point(i / count, samples[i]);
      for (let i = 0; i <= count; i++) {
        tangent
          .subVectors(
            samples[Math.min(count, i + 1)],
            samples[Math.max(0, i - 1)],
          )
          .normalize();
        axis.set(
          0,
          Math.abs(tangent.z) > 0.9 ? 1 : 0,
          Math.abs(tangent.z) > 0.9 ? 0 : 1,
        );
        normal.crossVectors(tangent, axis).normalize();
        binormal.crossVectors(tangent, normal).normalize();
        for (let j = 0; j < sides; j++) {
          const c = radius * Math.cos((j / sides) * Math.PI * 2),
            s = radius * Math.sin((j / sides) * Math.PI * 2);
          const index = (i * sides + j) * 3;
          positions[index] = samples[i].x + c * normal.x + s * binormal.x;
          positions[index + 1] = samples[i].y + c * normal.y + s * binormal.y;
          positions[index + 2] = samples[i].z + c * normal.z + s * binormal.z;
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    },
  };
}
export function protein(kit, name, lobes, material, parent = kit.group) {
  const group = new THREE.Group();
  group.name = name;
  parent.add(group);
  lobes.forEach(([x, y, z, sx, sy, sz], i) => {
    const lobe = domain(
      kit,
      group,
      `${name} domain ${i + 1}`,
      [x, y, z],
      [sx, sy, sz],
      material,
      i * 0.4,
    );
    lobe.rotation.set(i * 0.17, i * 0.23, Math.sin(i) * 0.3);
  });
  return group;
}
export function polymerase(kit, material) {
  const g = new THREE.Group();
  g.name = "Pol II — RPB1 clamp, RPB2 lobe, stalk and exposed active cleft";
  kit.group.add(g);
  const light = kit.material("#a5b6c7"),
    dark = kit.material("#637f96"),
    pale = kit.material("#c2ced5");
  const domains = [
    ["RPB1 clamp", [-0.5, 0.16, -0.31], [0.35, 0.59, 0.36], material],
    ["RPB2 protrusion", [0.5, 0.18, -0.32], [0.34, 0.52, 0.34], light],
    ["RPB1 wall", [0.02, 0.58, -0.5], [0.56, 0.25, 0.28], material],
    ["RPB2 jaw", [0.28, -0.48, -0.3], [0.38, 0.22, 0.28], light],
    ["RPB1 foot", [-0.32, -0.49, -0.32], [0.34, 0.23, 0.28], material],
    ["RPB3/RPB11 platform", [0.03, -0.25, -0.63], [0.41, 0.39, 0.21], dark],
    ["RPB4 stalk", [-0.83, 0.4, -0.3], [0.19, 0.3, 0.2], light],
    ["RPB7 stalk tip", [-0.97, 0.64, -0.18], [0.16, 0.2, 0.15], pale],
    ["RPB5 lower jaw", [0.7, -0.2, -0.2], [0.2, 0.3, 0.24], dark],
    ["RPB9 upper jaw", [0.69, 0.48, -0.32], [0.2, 0.24, 0.22], pale],
  ];
  domains.forEach(([name, p, scale, m], i) =>
    domain(kit, g, name, p, scale, m, i * 0.4),
  );
  // Active cleft is open toward +z. The bridge helix sits behind the DNA/RNA hybrid.
  helix(
    kit,
    g,
    [-0.35, -0.18, -0.25],
    [0.39, -0.18, -0.25],
    0.045,
    7,
    pale,
    0.021,
  );
  kit.tube(
    [
      [-0.35, -0.38, 0.02],
      [-0.49, -0.48, 0.14],
      [-0.52, -0.67, 0.18],
    ],
    0.047,
    dark,
    g,
    32,
  ).name = "RNA exit lip";
  kit.tube(
    [
      [0.32, 0.39, -0.02],
      [0.12, 0.47, 0.1],
      [-0.08, 0.37, 0.1],
    ],
    0.03,
    pale,
    g,
    32,
  ).name = "Clamp rim";
  for (let i = 0; i < 3; i++) {
    helix(
      kit,
      g,
      [-0.64 + i * 0.085, 0.1, 0.02],
      [-0.59 + i * 0.085, 0.42, 0.01],
      0.027,
      4,
      light,
      0.012,
    );
    helix(
      kit,
      g,
      [0.41 + i * 0.083, -0.14, 0.02],
      [0.44 + i * 0.083, 0.16, 0.02],
      0.026,
      3.5,
      pale,
      0.012,
    );
  }
  const active = kit.ball(
    [0.03, -0.18, 0.015],
    0.055,
    kit.material("#c5a364"),
    g,
  );
  active.name = "Catalytic center schematic";
  // A flexible CTD is shown only as a short exiting protein chain, without residue claims.
  kit.tube(
    [
      [-0.27, 0.67, -0.53],
      [-0.43, 0.89, -0.55],
      [-0.2, 1.02, -0.5],
      [0.02, 0.92, -0.44],
    ],
    0.022,
    light,
    g,
    48,
  ).name = "RPB1 CTD schematic";
  return g;
}
export function move(object, from, to, t) {
  object.position.set(
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
    from[2] + (to[2] - from[2]) * t,
  );
}

// Schematic molecular domains: a shaped, continuous surface rather than a stack of balls.
// Cross-section asymmetry forms recognisable jaws, feet and lobes; this is not atomic data.
export function domain(
  kit,
  parent,
  name,
  position,
  scale,
  material,
  profile = 0,
) {
  const g = new THREE.SphereGeometry(1, 32, 20);
  const attr = g.attributes.position;
  for (let i = 0; i < attr.count; i++) {
    const x = attr.getX(i),
      y = attr.getY(i),
      z = attr.getZ(i);
    const waist = 1 - 0.12 * Math.exp(-Math.pow((y - 0.15) / 0.3, 2));
    attr.setXYZ(
      i,
      x * waist + 0.12 * (1 - y * y) * Math.sin(profile + y * 2),
      y,
      z * (1 + 0.1 * Math.cos(y * 3 + profile)) + 0.06 * x * y,
    );
  }
  g.computeVertexNormals();
  const mesh = kit.mesh(g, material, position, parent);
  mesh.scale.set(...scale);
  mesh.name = name;
  return mesh;
}

export function helix(
  kit,
  parent,
  from,
  to,
  radius,
  turns,
  material,
  thickness = 0.018,
) {
  const start = new THREE.Vector3(...from),
    direction = new THREE.Vector3(...to).sub(start);
  const axis = direction.clone().normalize(),
    reference = new THREE.Vector3(0, 0, 1);
  if (Math.abs(axis.z) > 0.9) reference.set(0, 1, 0);
  const normal = new THREE.Vector3().crossVectors(axis, reference).normalize();
  const binormal = new THREE.Vector3().crossVectors(axis, normal).normalize();
  const points = [];
  for (let i = 0; i <= Math.ceil(turns * 16); i++) {
    const t = i / Math.ceil(turns * 16),
      angle = t * turns * Math.PI * 2;
    points.push(
      start
        .clone()
        .addScaledVector(direction, t)
        .addScaledVector(normal, radius * Math.cos(angle))
        .addScaledVector(binormal, radius * Math.sin(angle))
        .toArray(),
    );
  }
  return kit.tube(points, thickness, material, parent, Math.ceil(turns * 20));
}

export function molecularDNA(
  kit,
  {
    pairs = 100,
    segments = 480,
    radius = 0.035,
    phosphate = 0.049,
    baseWidth = 0.065,
    materials,
    parent = kit.group,
  } = {},
) {
  const rails = materials
    .slice(0, 2)
    .map((mat) => dynamicTube(kit, segments, radius, mat, parent));
  const make = (geometry, mat, count, name) => {
    const mesh = new THREE.InstancedMesh(geometry, mat, count);
    mesh.name = name;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    parent.add(mesh);
    return mesh;
  };
  const plate = new THREE.BoxGeometry(1, 1, 1);
  const sugars = materials
    .slice(0, 2)
    .map((mat, s) =>
      make(
        kit.sphere,
        mat,
        pairs,
        `DNA strand ${s + 1} sugar-phosphate repeat`,
      ),
    );
  const bases = materials
    .slice(2, 4)
    .map((mat, s) =>
      make(plate, mat, pairs, `DNA strand ${s + 1} complementary base plates`),
    );
  const bonds = make(
    kit.cylinder,
    materials[4],
    pairs,
    "DNA paired-base central hydrogen-bond schematic",
  );
  const matrix = new THREE.Object3D(),
    a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    mid = new THREE.Vector3(),
    end = new THREE.Vector3(),
    delta = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  const put = (mesh, index, from, to, width, depth) => {
    matrix.position.copy(from).add(to).multiplyScalar(0.5);
    delta.subVectors(to, from);
    const len = delta.length();
    matrix.quaternion.setFromUnitVectors(up, delta.divideScalar(len || 1));
    matrix.scale.set(width, Math.max(0.00001, len), depth);
    matrix.updateMatrix();
    mesh.setMatrixAt(index, matrix.matrix);
  };
  return {
    rails,
    sugars,
    bases,
    bonds,
    update(point, paired = () => 1) {
      rails.forEach((rail, s) => rail.update((t, out) => point(t, s, out)));
      for (let i = 0; i < pairs; i++) {
        const t = (i + 0.5) / pairs;
        point(t, 0, a);
        point(t, 1, b);
        mid.copy(a).add(b).multiplyScalar(0.5);
        const binding = paired(t);
        for (let s = 0; s < 2; s++) {
          const start = s ? b : a;
          matrix.position.copy(start);
          matrix.quaternion.identity();
          matrix.scale.setScalar(phosphate);
          matrix.updateMatrix();
          sugars[s].setMatrixAt(i, matrix.matrix);
          // Melted bases remain attached to their own sugar-phosphate backbone.
          end.copy(start).lerp(mid, 0.76 * binding + 0.22 * (1 - binding));
          put(bases[s], i, start, end, radius * 0.75, baseWidth);
        }
        const visible = binding > 0.8;
        end.copy(a).lerp(b, 0.46);
        delta.copy(a).lerp(b, 0.54);
        // Avoid passing the scratch direction as an endpoint to put().
        matrix.position.copy(mid);
        matrix.quaternion.setFromUnitVectors(up, newDirection(a, b));
        matrix.scale.set(
          visible ? radius * 0.35 : 0.00001,
          Math.max(0.00001, a.distanceTo(b) * 0.08),
          visible ? radius * 0.35 : 0.00001,
        );
        matrix.updateMatrix();
        bonds.setMatrixAt(i, matrix.matrix);
      }
      for (const mesh of [...sugars, ...bases, bonds]) {
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingBox();
        mesh.computeBoundingSphere();
      }
    },
  };
  function newDirection(from, to) {
    delta.subVectors(to, from);
    return delta.normalize();
  }
}

export function histoneOctamer(kit, parent) {
  const group = new THREE.Group();
  group.name = "Histone octamer — H2A/H2B/H3/H4 pairs";
  parent.add(group);
  const palette = ["#b29aaf", "#bdaf8c", "#819daa", "#9b91b0"].map((c) =>
    kit.material(c),
  );
  const ribbon = kit.material("#d0c2cb");
  for (let i = 0; i < 8; i++) {
    const a = ((i % 4) * Math.PI) / 2 + (i >= 4 ? 0.35 : 0),
      z = i < 4 ? -0.085 : 0.085;
    const x = Math.cos(a) * 0.14,
      y = Math.sin(a) * 0.14;
    const sub = domain(
      kit,
      group,
      ["H2A", "H2B", "H3", "H4"][i % 4] + (i < 4 ? " A" : " B"),
      [x, y, z],
      [0.145, 0.13, 0.14],
      palette[i % 4],
      i,
    );
    sub.rotation.z = a;
    // Visible histone-fold helices plus flexible tails on the exposed disk faces.
    helix(
      kit,
      group,
      [x - 0.065, y - 0.075, z + (i < 4 ? -0.095 : 0.095)],
      [x + 0.07, y + 0.08, z + (i < 4 ? -0.095 : 0.095)],
      0.025,
      2.6,
      ribbon,
      0.009,
    );
    if (i % 2 === 0)
      kit.tube(
        [
          [x, y, z],
          [x * 1.4, y * 1.4, z + (i < 4 ? -0.14 : 0.14)],
          [x * 2.1 + 0.05, y * 1.8 - 0.05, z + (i < 4 ? -0.22 : 0.22)],
        ],
        0.012,
        palette[i % 4],
        group,
        24,
      );
  }
  return group;
}

export function tfiidComplex(kit, material, gold) {
  const g = new THREE.Group();
  g.name = "TFIID — three-lobed TAF architecture and TBP saddle";
  kit.group.add(g);
  const light = kit.material("#a0bdb1"),
    dark = kit.material("#567f76"),
    ribbon = kit.material("#bdcdc2");
  const lobes = [
    [-0.7, 0.28, -0.25, 0.34, 0.42, 0.29],
    [-0.35, 0.72, -0.34, 0.46, 0.29, 0.28],
    [0.28, 0.69, -0.36, 0.43, 0.29, 0.31],
    [0.76, 0.35, -0.23, 0.3, 0.38, 0.28],
  ];
  lobes.forEach((l, i) =>
    domain(
      kit,
      g,
      ["TAF lobe A1", "TAF lobe B", "TAF lobe C", "TAF lobe A2"][i],
      l.slice(0, 3),
      l.slice(3),
      i % 2 ? light : material,
      i,
    ),
  );
  kit.tube(
    [
      [-0.7, 0.2, -0.45],
      [-0.45, 0.56, -0.55],
      [0.2, 0.66, -0.53],
      [0.7, 0.24, -0.45],
    ],
    0.065,
    dark,
    g,
    64,
  );
  for (let i = 0; i < 4; i++)
    helix(
      kit,
      g,
      [-0.63 + i * 0.35, 0.56, -0.07],
      [-0.5 + i * 0.35, 0.79, -0.1],
      0.045,
      3,
      ribbon,
      0.013,
    );
  // Curved beta-sheet saddle: eight strand ribs, open underneath for bent DNA.
  const saddle = new THREE.Group();
  saddle.name = "TBP concave beta-sheet saddle";
  g.add(saddle);
  saddle.position.set(-0.55, -0.15, 0.12);
  for (let i = 0; i < 8; i++) {
    const u = (i - 3.5) / 7,
      points = [];
    for (let j = 0; j <= 12; j++) {
      const t = j / 12;
      points.push([u * 0.53, -0.19 * Math.sin(t * Math.PI), -0.28 + t * 0.56]);
    }
    kit.tube(points, 0.032, gold, saddle, 24);
  }
  helix(
    kit,
    saddle,
    [-0.24, 0.07, -0.18],
    [0.24, 0.07, -0.18],
    0.046,
    4,
    gold,
    0.018,
  );
  helix(
    kit,
    saddle,
    [-0.24, 0.07, 0.19],
    [0.24, 0.07, 0.19],
    0.046,
    4,
    gold,
    0.018,
  );
  return g;
}

export function molecularRNA(
  kit,
  material,
  { count = 56, parent = kit.group, radius = 0.031 } = {},
) {
  const group = new THREE.Group();
  group.name = "Nascent RNA — backbone and nucleotides";
  parent.add(group);
  const tube = dynamicTube(kit, count * 3, radius, material, group);
  const phosphates = new THREE.InstancedMesh(kit.sphere, material, count);
  const bases = new THREE.InstancedMesh(
    kit.cylinder,
    kit.material("#e0b48b"),
    count,
  );
  phosphates.name = "RNA sugar-phosphate repeats";
  bases.name = "RNA exposed bases";
  group.add(phosphates, bases);
  const temp = new THREE.Object3D(),
    a = new THREE.Vector3(),
    c = new THREE.Vector3(),
    direction = new THREE.Vector3(),
    up = new THREE.Vector3(0, 1, 0);
  for (const mesh of [phosphates, bases]) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
  }
  return {
    group,
    update(point, length = 1, baseDirection) {
      tube.update(point);
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        point(t, a);
        temp.position.copy(a);
        temp.quaternion.identity();
        temp.scale.setScalar(radius * 1.4 * Math.min(1, length));
        temp.updateMatrix();
        phosphates.setMatrixAt(i, temp.matrix);
        c.set(0.03 * Math.cos(t * 18), 0.065, 0.045 * Math.sin(t * 18));
        if (baseDirection) baseDirection(t, c);
        temp.position.copy(a).addScaledVector(c, 0.5);
        temp.quaternion.setFromUnitVectors(up, direction.copy(c).normalize());
        temp.scale.set(
          radius * 0.45,
          c.length() * Math.min(1, length),
          radius * 0.45,
        );
        temp.updateMatrix();
        bases.setMatrixAt(i, temp.matrix);
      }
      for (const mesh of [phosphates, bases]) {
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingBox();
        mesh.computeBoundingSphere();
      }
    },
  };
}
