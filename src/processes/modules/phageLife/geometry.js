import { THREE } from "../../kit.js";
import { instances, duplex, hollowCylinder } from "./refinedGeometry.js";
// Local geometry for the two phage life cycles. The front hemisphere is removed
// so the exposed cytoplasm remains a real space inside three envelope layers.
export function hostCutaway(k, parent, scale = 1) {
  const g = new THREE.Group();
  parent.add(g);
  g.scale.setScalar(scale);
  const pieces = [],
    rims = [],
    colors = ["#b9c9c2", "#c7ba99", "#8bab9e"];
  [1, 0.966, 0.925].forEach((s, layer) => {
    for (let i = 0; i < 6; i++) {
      const piece = new THREE.Group();
      g.add(piece);
      const mesh = k.mesh(
        new THREE.SphereGeometry(
          1,
          24,
          24,
          Math.PI + (i * Math.PI) / 6,
          Math.PI / 6,
          0,
          Math.PI,
        ),
        k.material(colors[layer], { side: THREE.DoubleSide, roughness: 0.72 }),
        [0, 0, 0],
        piece,
      );
      mesh.scale.set(3.2 * s, 1.48 * s, 1.12 * s);
      if (layer !== 1) {
        const inner = k.mesh(
          new THREE.SphereGeometry(
            1,
            24,
            24,
            Math.PI + (i * Math.PI) / 6,
            Math.PI / 6,
            0,
            Math.PI,
          ),
          k.material(layer === 0 ? "#bdc9ba" : "#adc3b1", {
            side: THREE.DoubleSide,
          }),
          [0, 0, 0],
          piece,
        );
        inner.scale.set(
          3.2 * (s - 0.014),
          1.48 * (s - 0.014),
          1.12 * (s - 0.014),
        );
      }
      pieces.push({ mesh: piece, index: i, layer });
    }
    for (const offset of layer === 1 ? [0] : [0, -0.014]) {
      const t = s + offset,
        points = Array.from({ length: 129 }, (_, i) => {
          const a = (i * Math.PI * 2) / 128;
          return [3.2 * t * Math.cos(a), 1.48 * t * Math.sin(a), 0.015];
        });
      const rim = k.tube(
        points,
        layer === 1 ? 0.022 : 0.018,
        k.material(colors[layer]),
        g,
        128,
      );
      rims.push(rim);
      if (layer !== 1) {
        const heads = [],
          tails = [];
        for (let i = 0; i < 128; i++) {
          const a = (i * Math.PI * 2) / 128,
            x = 3.2 * t * Math.cos(a),
            y = 1.48 * t * Math.sin(a);
          heads.push({ position: [x, y, 0.025], scale: [0.036, 0.028, 0.025] });
          // Each pair ends at this bilayer's midpoint. Do not normalize the
          // length-bearing vector in the per-tail loop: its second use would
          // otherwise become a unit-length spike instead of a lipid tail.
          const midScale = s - 0.007,
            endX = 3.2 * midScale * Math.cos(a),
            endY = 1.48 * midScale * Math.sin(a),
            direction = new THREE.Vector3(endX - x, endY - y, 0),
            length = direction.length(),
            orientation = new THREE.Quaternion().setFromUnitVectors(
              new THREE.Vector3(0, 1, 0),
              direction.clone().normalize(),
            );
          for (const dz of [-0.009, 0.009])
            tails.push({
              position: [(x + endX) / 2, (y + endY) / 2, 0.025 + dz],
              scale: [0.0045, length, 0.0045],
              quaternion: orientation,
            });
        }
        const lipidHeads = instances(
          k,
          g,
          k.sphere,
          k.material(layer === 0 ? "#a6beb0" : "#8aaa9b"),
          heads,
          "paired-leaflet-headgroups",
        );
        const lipidTails = instances(
          k,
          g,
          k.cylinder,
          k.material("#c8b896"),
          tails,
          "bilayer-hydrophobic-tails",
        );
        lipidTails.userData.bilayerOuterScale = s;
        lipidTails.userData.bilayerInnerScale = s - 0.014;
        rims.push(lipidHeads, lipidTails);
      }
    }
  });
  // Peptidoglycan is exposed only in the cut edge between the two membranes.
  const wall = new THREE.Group();
  g.add(wall);
  for (const t of [0.962, 0.97])
    k.tube(
      Array.from({ length: 129 }, (_, i) => {
        const a = (i * Math.PI * 2) / 128;
        return [3.2 * t * Math.cos(a), 1.48 * t * Math.sin(a), 0.028];
      }),
      0.008,
      k.material("#b9ad8c"),
      wall,
      128,
    );
  const crosslinks = [];
  for (let i = 0; i < 96; i++) {
    const a = (i * Math.PI * 2) / 96,
      p = new THREE.Vector3(
        3.2 * 0.962 * Math.cos(a),
        1.48 * 0.962 * Math.sin(a),
        0.028,
      ),
      q = new THREE.Vector3(
        3.2 * 0.97 * Math.cos(a),
        1.48 * 0.97 * Math.sin(a),
        0.028,
      ),
      d = q.clone().sub(p);
    crosslinks.push({
      position: p.add(q).multiplyScalar(0.5).toArray(),
      scale: [0.007, d.length(), 0.007],
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        d.normalize(),
      ),
    });
  }
  instances(
    k,
    wall,
    k.cylinder,
    k.material("#c3b48c"),
    crosslinks,
    "peptidoglycan-cut-edge-crosslinks",
  );
  function rupture(t) {
    pieces.forEach(({ mesh, index }) => {
      const a = (index * Math.PI) / 3;
      mesh.position.set(
        t * 0.8 * Math.cos(a),
        t * 0.65 * Math.sin(a),
        -t * 0.18,
      );
      mesh.rotation.y = t * 0.15 * Math.sin(a);
      mesh.visible = t < 0.99 || index % 2 === 0;
    });
    rims.forEach((m) => {
      m.visible = t < 0.12;
    });
    wall.visible = t < 0.14;
  }
  return { group: g, rupture };
}
export function phage(k, parent, { lambda = false, scale = 1 } = {}) {
  const g = new THREE.Group();
  parent.add(g);
  g.scale.setScalar(scale);
  const head = new THREE.Group();
  g.add(head);
  const coat = k.material(lambda ? "#ae9bb5" : "#8eabba", {
    transparent: false,
    opacity: 1,
    roughness: 0.45,
    depthWrite: false,
  });
  const raw = new THREE.IcosahedronGeometry(0.36, 1),
    rp = raw.attributes.position,
    vertices = [],
    capsomers = [];
  for (let i = 0; i < rp.count; i += 3) {
    const a = new THREE.Vector3().fromBufferAttribute(rp, i),
      b = new THREE.Vector3().fromBufferAttribute(rp, i + 1),
      c = new THREE.Vector3().fromBufferAttribute(rp, i + 2),
      center = a
        .clone()
        .add(b)
        .add(c)
        .multiplyScalar(1 / 3);
    if (center.z > 0.16) continue;
    // Keep a real open neck in the T4 shell. Clip lower triangular faces
    // instead of drawing DNA through a closed icosahedron floor.
    let face = [a, b, c];
    if (!lambda) {
      const neckPlane = (-0.08 - 0.35) / 1.32;
      const clipped = [];
      for (let j = 0; j < face.length; j++) {
        const u = face[j],
          v = face[(j + 1) % face.length];
        const insideU = u.y >= neckPlane,
          insideV = v.y >= neckPlane;
        if (insideU) clipped.push(u);
        if (insideU !== insideV)
          clipped.push(u.clone().lerp(v, (neckPlane - u.y) / (v.y - u.y)));
      }
      face = clipped;
    }
    for (let j = 1; j + 1 < face.length; j++)
      for (const v of [face[0], face[j], face[j + 1]])
        vertices.push(...v.toArray());
    const normal = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
    if (normal.dot(center) < 0) normal.negate();
    const tangent = b.clone().sub(a).normalize(),
      cross = new THREE.Vector3().crossVectors(normal, tangent);
    for (let j = 0; j < 6; j++) {
      const angle = (j * Math.PI) / 3,
        p = center
          .clone()
          .addScaledVector(normal, 0.008)
          .addScaledVector(tangent, 0.025 * Math.cos(angle))
          .addScaledVector(cross, 0.025 * Math.sin(angle));
      p.y = p.y * (lambda ? 1 : 1.32) + 0.35;
      capsomers.push({
        position: p.toArray(),
        scale: [0.018, 0.014, 0.01],
        quaternion: new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 0, 1),
          normal,
        ),
      });
    }
  }
  raw.dispose();
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geom.computeVertexNormals();
  instances(
    k,
    head,
    k.sphere,
    k.material(lambda ? "#beacc4" : "#b0c3cc"),
    capsomers,
    "capsomer-lattice",
  );
  const shell = k.mesh(geom, coat, [0, 0.35, 0], head);
  shell.scale.y = lambda ? 1 : 1.32;
  shell.name = lambda ? "lambda-capsid-shell" : "T4-open-neck-capsid-shell";
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geom),
    new THREE.LineBasicMaterial({
      color: lambda ? "#786982" : "#577888",
      transparent: true,
      opacity: 0.5,
    }),
  );
  edges.position.copy(shell.position);
  edges.scale.copy(shell.scale);
  head.add(edges);
  const dnaPoints = Array.from({ length: 55 }, (_, i) => {
    const a = i * 0.65;
    return [0.19 * Math.cos(a), 0.1 + i * 0.009, 0.17 * Math.sin(a)];
  });
  const genome = duplex(k, head, dnaPoints, {
    radius: 0.014,
    rail: 0.008,
    turns: 26,
    samples: 200,
    pairs: 75,
    name: "packaged-dsDNA",
  }).group;
  const tail = new THREE.Group();
  g.add(tail);
  if (lambda) {
    k.tube(
      [
        [0, 0, 0],
        [0.025, -0.3, 0],
        [0.08, -0.65, 0.02],
        [0.15, -0.9, 0],
        [0.13, -1.06, 0],
      ],
      0.043,
      k.material("#9d87a9"),
      tail,
      40,
    );
    const ringGeo = new THREE.TorusGeometry(0.047, 0.009, 7, 20),
      ringPoses = [];
    for (let i = 0; i < 23; i++) {
      const y = -i * 0.045,
        t = i / 22;
      ringPoses.push({
        position: [0.14 * t * t, y, 0.012 * Math.sin(t * Math.PI)],
        scale: [1, 1, 1],
        rotation: [Math.PI / 2, 0, 0],
      });
    }
    instances(
      k,
      tail,
      ringGeo,
      k.material("#b39dbb"),
      ringPoses,
      "lambda-noncontractile-tail-tube-subunits",
    );
    k.ball([0.13, -1.08, 0], [0.08, 0.1, 0.07], k.material("#73677e"), tail);
    [-1, 1].forEach((s) =>
      k.tube(
        [
          [0.13, -1.06, 0],
          [0.13 + s * 0.1, -1.17, 0.01],
          [0.13 + s * 0.17, -1.15, 0.02],
        ],
        0.019,
        k.material("#9d87a9"),
        tail,
        16,
      ),
    );
  } else {
    const tube = hollowCylinder(
      k,
      tail,
      0.043,
      0.031,
      0.76,
      k.material("#9ca9b0"),
      [0, -0.38, 0],
    );
    tube.name = "T4-open-tail-tube";
    const neck = hollowCylinder(
      k,
      tail,
      0.075,
      0.035,
      0.15,
      k.material("#b7bcae"),
      [0, -0.02, 0],
    );
    neck.name = "T4-open-neck-connector";
    const sheath = [];
    for (let j = 0; j < 13; j++)
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 + j * 0.24;
        sheath.push({
          position: [
            0.088 * Math.cos(a),
            -0.03 - j * 0.048,
            0.088 * Math.sin(a),
          ],
          scale: [0.046, 0.025, 0.035],
          rotation: [0, -a, 0],
        });
      }
    instances(
      k,
      tail,
      k.sphere,
      k.material("#83a3ad"),
      sheath,
      "T4-six-start-helical-sheath",
    );
    hollowCylinder(
      k,
      tail,
      0.065,
      0.035,
      0.69,
      k.material("#b7bcae"),
      [0, -0.34, 0],
    );
    const plateShape = new THREE.Shape();
    for (let i = 0; i <= 6; i++) {
      const a = (i * Math.PI) / 3,
        x = 0.19 * Math.cos(a),
        y = 0.19 * Math.sin(a);
      if (i === 0) plateShape.moveTo(x, y);
      else plateShape.lineTo(x, y);
    }
    const aperture = new THREE.Path();
    aperture.absarc(0, 0, 0.049, 0, Math.PI * 2, true);
    plateShape.holes.push(aperture);
    const plateGeometry = new THREE.ExtrudeGeometry(plateShape, {
      depth: 0.055,
      bevelEnabled: false,
      curveSegments: 24,
      steps: 1,
    });
    plateGeometry.translate(0, 0, -0.0275);
    plateGeometry.rotateX(Math.PI / 2);
    const plate = k.mesh(
      plateGeometry,
      k.material("#688894"),
      [0, -0.65, 0],
      tail,
    );
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      const x = Math.cos(a),
        z = Math.sin(a);
      const wedge = k.ball(
        [x * 0.17, -0.65, z * 0.17],
        [0.095, 0.048, 0.063],
        k.material("#8396aa"),
        tail,
      );
      wedge.rotation.y = -a;
      k.ball([x * 0.4, -0.78, z * 0.4], 0.034, k.material("#8193a4"), tail);
      k.ball(
        [x * 0.49, -1.03, z * 0.49],
        [0.029, 0.046, 0.029],
        k.material("#aa9bb3"),
        tail,
      );
      k.segment(
        [x * 0.13, -0.67, z * 0.13],
        [x * 0.23, -0.83, z * 0.23],
        0.02,
        k.material("#8895a4"),
        tail,
      );
      k.tube(
        [
          [x * 0.12, -0.65, z * 0.12],
          [x * 0.4, -0.78, z * 0.4],
          [x * 0.49, -1.03, z * 0.49],
        ],
        0.022,
        k.material("#7194a2"),
        tail,
        18,
      );
    }
    plate.name = "T4-baseplate";
  }
  return { group: g, head, tail, genome };
}
export function chromosome(k, parent, mat, { integrated = false } = {}) {
  const g = new THREE.Group();
  parent.add(g);
  const start = 0.34,
    end = Math.PI * 2 - 0.34;
  const points = Array.from({ length: 101 }, (_, i) => {
    const a = start + ((end - start) * i) / 100;
    return [
      1.78 * Math.sin(a),
      0.61 * Math.cos(a),
      0.08 + Math.sin(9 * a) * 0.095,
    ];
  });
  duplex(k, g, points, {
    radius: 0.025,
    rail: 0.017,
    turns: 45,
    samples: 360,
    pairs: 140,
    colors: [mat.color.getStyle(), "#b4c1b6"],
    name: "organized-host-nucleoid-duplex",
  });
  const dnaPath = (points, radius, material, parent, samples) =>
    duplex(k, parent, points, {
      radius: radius * 0.52,
      rail: radius * 0.34,
      turns: samples / 6,
      samples: samples * 3,
      pairs: samples,
      colors: [
        material.color.getStyle(),
        material.color.clone().lerp(new THREE.Color("#efdfcf"), 0.2).getStyle(),
      ],
    }).group;
  const normal = dnaPath(
    Array.from({ length: 21 }, (_, i) => {
      const a = -0.34 + (0.68 * i) / 20;
      return [
        1.78 * Math.sin(a),
        0.61 * Math.cos(a),
        0.08 + Math.sin(9 * a) * 0.095,
      ];
    }),
    0.047,
    mat,
    g,
    24,
  );
  const inserted = dnaPath(
    [
      [
        -1.78 * Math.sin(0.34),
        0.61 * Math.cos(0.34),
        0.08 - Math.sin(9 * 0.34) * 0.095,
      ],
      [-0.64, 0.86, 0.06],
      [-0.4, 1.06, 0.1],
      [0, 1.12, 0.1],
      [0.4, 1.06, 0.1],
      [0.64, 0.86, 0.1],
      [
        1.78 * Math.sin(0.34),
        0.61 * Math.cos(0.34),
        0.08 + Math.sin(9 * 0.34) * 0.095,
      ],
    ],
    0.052,
    k.material("#ad82a9"),
    g,
    52,
  );
  normal.visible = !integrated;
  inserted.visible = integrated;
  return { group: g, normal, inserted };
}
