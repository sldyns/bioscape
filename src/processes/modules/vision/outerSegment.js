import { THREE } from "../../kit.js";

const TAU = Math.PI * 2;

function indexedGeometry(points, faces) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(points, 3),
  );
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

// Both profiles turn around the retained curved rim. Only the front viewing
// plane intersects the enclosed lumen of a mature disk.
export function rodDisks(k) {
  const layers = [
    [
      [0, 0.145],
      [0.92, 0.145],
      [0.961, 0.135],
      [0.986, 0.103],
      [0.998, 0.053],
      [1, 0],
      [0.998, -0.053],
      [0.986, -0.103],
      [0.961, -0.135],
      [0.92, -0.145],
      [0, -0.145],
    ],
    [
      [0, 0.091],
      [0.92, 0.091],
      [0.948, 0.084],
      [0.965, 0.06],
      [0.974, 0.031],
      [0.976, 0],
      [0.974, -0.031],
      [0.965, -0.06],
      [0.948, -0.084],
      [0.92, -0.091],
      [0, -0.091],
    ],
  ];
  const sections = 64,
    width = 2.08,
    depth = 1.37;
  const surfaces = layers.map((profile, layer) => {
    const points = [],
      faces = [];
    for (let row = 0; row < profile.length; row++) {
      const [r, y] = profile[row];
      for (let col = 0; col <= sections; col++) {
        const a = (col * Math.PI) / sections;
        points.push(
          r * width * Math.cos(a),
          y,
          col === 0 || col === sections ? 0 : -r * depth * Math.sin(a),
        );
        if (row === profile.length - 1 || col === sections) continue;
        const u = row * (sections + 1) + col,
          v = u + sections + 1;
        if (r !== 0) faces.push(u, v + 1, u + 1);
        if (profile[row + 1][0] !== 0) faces.push(u, v, v + 1);
      }
    }
    if (layer)
      for (let i = 0; i < faces.length; i += 3)
        [faces[i], faces[i + 1]] = [faces[i + 1], faces[i]];
    return indexedGeometry(points, faces);
  });
  const cutPoints = [],
    cutFaces = [];
  for (const side of [-1, 1]) {
    const start = cutPoints.length / 3;
    for (let j = 0; j < layers[0].length; j++) {
      for (const profile of layers)
        cutPoints.push(side * width * profile[j][0], profile[j][1], 0);
      if (j === layers[0].length - 1) continue;
      const n = start + j * 2;
      cutFaces.push(n, n + 1, n + 2, n + 2, n + 1, n + 3);
    }
  }
  const cut = indexedGeometry(cutPoints, cutFaces);
  const outer = k.material("#9b93a9", { side: THREE.DoubleSide }),
    inner = k.material("#cec4c8", { side: THREE.DoubleSide }),
    edge = k.material("#d3c59e", { side: THREE.DoubleSide });
  let active;
  for (const [i, y] of [-1.17, -0.53, 0.11].entries()) {
    const disk = new THREE.Group();
    disk.name = `rod-mature-disk-${i}`;
    disk.position.set(-0.69, y, 0);
    k.group.add(disk);
    k.mesh(surfaces[0], outer, [0, 0, 0], disk).name =
      "disk-cytoplasmic-surface";
    k.mesh(surfaces[1], inner, [0, 0, 0], disk).name = "disk-luminal-surface";
    k.mesh(cut, edge, [0, 0, 0], disk).name = "disk-membrane-section";
    if (i === 2) active = disk;
  }
  return active;
}

export function rodChannel(k) {
  const plasma = new THREE.Group();
  plasma.name = "outer-segment-plasma-membrane";
  plasma.position.set(2.2, 0.04, -0.04);
  plasma.rotation.y = 0.99;
  k.group.add(plasma);
  const channelY = 0.29,
    aperture = 0.4,
    half = 0.065;
  const outline = new THREE.Shape();
  outline.moveTo(-1.12, -1.38);
  outline.lineTo(0.95, -1.38);
  outline.quadraticCurveTo(1.1, -1.38, 1.1, -1.23);
  outline.lineTo(1.1, 1.29);
  outline.quadraticCurveTo(1.1, 1.44, 0.95, 1.44);
  outline.lineTo(-1.12, 1.44);
  outline.lineTo(-1.12, -1.38);
  const hole = new THREE.Path();
  hole.absarc(0, channelY, aperture, 0, TAU, true);
  outline.holes.push(hole);
  const membrane = new THREE.ExtrudeGeometry(outline, {
    depth: half * 2,
    bevelEnabled: false,
    curveSegments: 32,
  });
  const wall = k.mesh(
    membrane,
    [
      k.material("#a6b7ba", { side: THREE.DoubleSide }),
      k.material("#d5bb91", { side: THREE.DoubleSide }),
    ],
    [0, 0, -half],
    plasma,
  );
  wall.name = "plasma-membrane-with-cng-aperture";
  const headMaterial = k.material("#c4c8ba");
  const heads = new THREE.InstancedMesh(k.sphere, headMaterial, 68);
  const node = new THREE.Object3D();
  let index = 0;
  for (const z of [-half, half])
    for (let j = 0; j < 17; j++)
      for (const [x, y] of [
        [-1.12, -1.33 + j * 0.165],
        [-1.04 + j * 0.126, -1.38],
      ]) {
        node.position.set(x, y, z);
        node.scale.setScalar(0.029);
        node.updateMatrix();
        heads.setMatrixAt(index++, node.matrix);
      }
  heads.computeBoundingBox();
  heads.computeBoundingSphere();
  plasma.add(heads);
  heads.name = "plasma-leaflets-at-cut-edge";

  const channel = new THREE.Group();
  channel.name = "rod-cng-channel";
  channel.position.y = channelY;
  plasma.add(channel);
  const units = [k.material("#797c9f"), k.material("#9785a2")],
    domains = k.material("#b1a5b6"),
    gateMaterial = k.material("#655a78");
  const barrel = new THREE.CylinderGeometry(0.11, 0.12, 0.45, 13);
  const blade = new THREE.Shape();
  blade.moveTo(0, 0);
  blade.lineTo(0.23, 0);
  blade.absarc(0, 0, 0.23, 0, Math.PI / 2, false);
  blade.lineTo(0, 0);
  const bladeGeometry = new THREE.ExtrudeGeometry(blade, {
    depth: 0.075,
    bevelEnabled: false,
    curveSegments: 14,
  });
  const gates = [];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU,
      ca = Math.cos(a),
      sa = Math.sin(a),
      donor = units[i === 3 ? 1 : 0];
    const subunit = new THREE.Group();
    subunit.name = i === 3 ? "CNGB1-subunit" : "CNGA1-subunit";
    subunit.position.set(0.33 * ca, 0.33 * sa, 0);
    subunit.rotation.z = a;
    channel.add(subunit);
    for (const offset of [-0.087, 0.087]) {
      const helix = k.mesh(barrel, donor, [0.022, offset, 0.007], subunit);
      helix.rotation.x = Math.PI / 2 + offset;
      helix.rotation.z = -offset;
    }
    k.ball([0.105, 0, -0.27], [0.16, 0.14, 0.095], domains, subunit);
    k.ball([-0.026, 0, 0.16], [0.13, 0.14, 0.075], donor, subunit).name =
      "cng-extracellular-domain";
    const tongue = k.mesh(bladeGeometry, gateMaterial, [0, 0, -0.032], channel);
    tongue.name = "cng-gate-sector";
    tongue.rotation.z = a;
    gates.push({
      tongue,
      x: Math.cos(a + Math.PI / 4),
      y: Math.sin(a + Math.PI / 4),
    });
  }
  // The cleft is an actual aperture through the plasma membrane. Only the
  // four channel gates occupy its axis when cGMP dissociates.
  function setOpen(open) {
    for (const { tongue, x, y } of gates)
      tongue.position.set(0.185 * open * x, 0.185 * open * y, -0.032);
  }
  return { plasma, wall, channel, channelY, setOpen };
}

export function diskProteins(k) {
  const plum = k.material("#826285"),
    lightPlum = k.material("#a686a4"),
    teal = k.material("#5e948a"),
    sage = k.material("#86aa95"),
    violet = k.material("#8b7995"),
    gold = k.material("#c69255"),
    anchorMat = k.material("#93865f");
  const rhodopsin = new THREE.Group();
  rhodopsin.name = "disk-rhodopsin";
  rhodopsin.position.set(-1.99, 0.255, -0.32);
  k.group.add(rhodopsin);
  for (let i = 0; i < 7; i++) {
    const az = (i * TAU) / 7,
      pts = [];
    for (let j = 0; j < 21; j++) {
      const u = j / 20,
        a = u * TAU * 2.5 + az;
      pts.push([
        0.17 * Math.cos(az) +
          0.018 * Math.cos(a) +
          0.035 * (u - 0.5) * Math.sin(az),
        -0.095 + 0.3 * u,
        0.14 * Math.sin(az) + 0.018 * Math.sin(a),
      ]);
    }
    const helix = k.tube(pts, 0.042, i % 2 ? lightPlum : plum, rhodopsin, 27);
    helix.name = "opsin-transmembrane-helix";
  }
  const retinal = k.tube(
    [
      [-0.126, 0.115, 0.07],
      [-0.063, 0.143, 0.095],
      [0, 0.09, 0.12],
      [0.066, 0.099, 0.13],
      [0.12, 0.113, 0.13],
    ],
    0.022,
    gold,
    rhodopsin,
    14,
  );
  retinal.name = "retinal-cis-bend";
  const straight = k.tube(
    [
      [-0.126, 0.112, 0.075],
      [-0.066, 0.121, 0.1],
      [0, 0.127, 0.118],
      [0.068, 0.139, 0.127],
      [0.135, 0.147, 0.136],
    ],
    0.022,
    gold,
    rhodopsin,
    14,
  );
  straight.name = "retinal-after-photoisomerization";
  const beta = new THREE.Group();
  beta.name = "transducin-beta-gamma";
  beta.position.set(-1.33, 0.39, -0.6);
  k.group.add(beta);
  for (let i = 0; i < 7; i++) {
    const a = (i * TAU) / 7;
    const l = k.ball(
      [0.14 * Math.cos(a), 0.02, 0.14 * Math.sin(a)],
      [0.082, 0.052, 0.048],
      sage,
      beta,
    );
    l.rotation.y = -a;
  }
  k.tube(
    [
      [-0.1, 0.02, -0.09],
      [-0.17, -0.05, -0.12],
      [-0.2, -0.13, -0.07],
    ],
    0.03,
    anchorMat,
    beta,
    12,
  );
  const alpha = new THREE.Group();
  alpha.name = "transducin-alpha";
  k.group.add(alpha);
  k.ball([0, 0.02, 0], [0.155, 0.123, 0.13], teal, alpha);
  k.ball([0.13, 0.059, 0.05], [0.12, 0.093, 0.09], sage, alpha);
  k.tube(
    [
      [-0.09, -0.02, 0.03],
      [-0.18, -0.07, 0.02],
      [-0.21, -0.128, 0],
    ],
    0.018,
    anchorMat,
    alpha,
    12,
  );
  const nucleotide = k.ball(
    [0.069, 0.137, 0.025],
    [0.041, 0.035, 0.043],
    gold,
    alpha,
  );
  nucleotide.name = "transducin-guanine-nucleotide";
  const gammaPhosphate = k.ball([0.102, 0.162, 0.041], 0.023, gold, alpha);
  gammaPhosphate.name = "GTP-terminal-phosphate";

  const pde = new THREE.Group();
  pde.name = "disk-cytosolic-PDE6";
  pde.position.set(0.31, 0.255, -0.38);
  k.group.add(pde);
  const inhibitors = [];
  for (let i = 0; i < 2; i++) {
    const side = i ? 1 : -1;
    k.ball([side * 0.142, 0.14, -0.012], [0.124, 0.15, 0.103], violet, pde);
    k.ball([side * 0.135, 0.295, -0.04], [0.14, 0.13, 0.112], lightPlum, pde);
    k.ball([side * 0.15, 0.45, 0], [0.155, 0.144, 0.144], violet, pde);
    k.ball([side * 0.078, 0.504, 0.105], [0.079, 0.09, 0.075], lightPlum, pde);
    k.tube(
      [
        [side * 0.15, 0.125, -0.026],
        [side * 0.21, 0.064, -0.09],
        [side * 0.235, -0.015, -0.076],
      ],
      0.025,
      anchorMat,
      pde,
      12,
    );
    const mask = new THREE.Group();
    mask.name = "PDE6-inhibitory-gamma-tip";
    mask.position.set(side * 0.225, 0.34, 0.09);
    pde.add(mask);
    k.tube(
      [
        [0, 0, 0],
        [-side * 0.01, 0.089, 0.054],
        [-side * 0.105, 0.153, 0.084],
      ],
      0.027,
      gold,
      mask,
      13,
    );
    inhibitors.push(mask);
  }
  return {
    rhodopsin,
    retinal,
    straight,
    beta,
    alpha,
    nucleotide,
    gammaPhosphate,
    pde,
    inhibitors,
  };
}

export function nucleotidePool(k) {
  const baseMat = k.material("#58978e"),
    sugarMat = k.material("#9ab694"),
    phosphateMat = k.material("#c79255");
  const base = new THREE.IcosahedronGeometry(1, 0);
  // The 5′ linkage and purine persist in both molecules. Only the return
  // linkage to the sugar disappears when PDE6 opens the cyclic phosphate.
  function molecule(parent, name) {
    const m = new THREE.Group();
    m.name = name;
    parent.add(m);
    const b = k.mesh(base, baseMat, [-0.045, 0, 0], m);
    b.scale.set(0.066, 0.04, 0.026);
    k.ball([0.015, 0.024, 0], [0.048, 0.038, 0.025], sugarMat, m);
    const phosphate = k.ball([0.078, -0.026, 0], 0.027, phosphateMat, m);
    k.segment([0.027, 0.047, 0], [0.078, -0.026, 0], 0.012, sugarMat, m);
    const returnBond = k.segment(
      [0.078, -0.026, 0],
      [0.003, -0.007, 0],
      0.012,
      phosphateMat,
      m,
    );
    return { m, returnBond, phosphate, baseMesh: b };
  }
  return molecule;
}
