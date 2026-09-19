import { centrosomeAssembly } from "./centrosomeDetails";
import { skeletonNetwork } from "./cytoskeletonDetails";
import { peroxisomeAssembly } from "./peroxisomeDetails";
import { lysosomeAssembly } from "./lysosomeDetails";
import { ribosomeBody } from "./ribosomeDetails";
import { golgiAssembly } from "./golgiDetails";
import { roughAssembly, smoothAssembly, mergeER } from "./erDetails";
import { rawMitochondrion, mergeMitochondrion } from "./mitochondriaDetails";
import { nucleusAssembly } from "./nucleusAssembly";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { SimplexNoise } from "three/addons/math/SimplexNoise.js";

// Illustrative mesoscopic model. Molecular details are enlarged, not to scale.
const TAU = Math.PI * 2;
function randomSource(seed = 3481) {
  return {
    random: () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    },
  };
}

export function buildCell() {
  const rng = randomSource(),
    random = () => rng.random();
  const randomUnit = () => {
    const z = 2 * random() - 1,
      a = random() * TAU,
      r = Math.sqrt(1 - z * z);
    return new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), z);
  };
  const simplex = new SimplexNoise(randomSource(75));
  const noise = (x, y, z) => simplex.noise3d(x, y, z);
  const cell = new THREE.Group(),
    groups = {},
    anchors = {},
    full = [],
    resources = [];
  const temp = new THREE.Object3D();
  const grainData = new Uint8Array(256 * 256 * 4);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 256; x++) {
      const value =
        125 +
        35 * noise(x / 19, y / 19, 0) +
        45 * noise(x / 3.8, y / 3.8, 3) +
        18 * random();
      const i = (y * 256 + x) * 4;
      grainData[i] = grainData[i + 1] = grainData[i + 2] = value;
      grainData[i + 3] = 255;
    }
  const grain = new THREE.DataTexture(grainData, 256, 256);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.magFilter = THREE.LinearFilter;
  grain.minFilter = THREE.LinearMipmapLinearFilter;
  grain.generateMipmaps = true;
  grain.needsUpdate = true;
  resources.push(grain);

  function mat(color, options = {}) {
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.56,
      metalness: 0.02,
      clearcoat: 0.1,
      clearcoatRoughness: 0.55,
      bumpMap: grain,
      bumpScale: 0.022,
      ...options,
    });
  }
  function group(id, position) {
    const result = new THREE.Group();
    result.position.set(...position);
    result.userData = { id, home: result.position.clone() };
    groups[id] = result;
    anchors[id] = new THREE.Vector3();
    cell.add(result);
    return result;
  }
  function mesh(parent, geo, material, shadows = true) {
    if (geo.attributes.color) {
      material = material.clone();
      material.vertexColors = true;
    }
    const m = new THREE.Mesh(geo, material);
    m.castShadow = shadows;
    m.receiveShadow = shadows;
    parent.add(m);
    return m;
  }
  function ball(
    parent,
    radius,
    position,
    material,
    scale = [1, 1, 1],
    irregular = 0,
  ) {
    const geometry = new THREE.SphereGeometry(radius, 36, 26);
    if (irregular)
      deform(geometry, (p) =>
        p.multiplyScalar(1 + noise(p.x * 13, p.y * 13, p.z * 13) * irregular),
      );
    const m = mesh(parent, geometry, material);
    m.position.set(...position);
    m.scale.set(...scale);
    return m;
  }
  function deform(geometry, fn) {
    const a = geometry.attributes.position,
      p = new THREE.Vector3();
    for (let i = 0; i < a.count; i++) {
      p.fromBufferAttribute(a, i);
      fn(p);
      a.setXYZ(i, p.x, p.y, p.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }
  function curve(points, radius, segments = 160, radial = 7) {
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(
        points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))),
      ),
      segments,
      radius,
      radial,
      false,
    );
  }
  function tubes(parent, paths, radius, material, segments = 90, radial = 7) {
    const pieces = paths.map((path) => curve(path, radius, segments, radial));
    const joined = mergeGeometries(pieces);
    pieces.forEach((g) => g.dispose());
    return mesh(parent, joined, material);
  }
  function beads(parent, samples, material, detail = 1) {
    const m = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(1, detail),
      material,
      samples.length,
    );
    samples.forEach((s, i) => {
      temp.position.set(...s.p);
      temp.scale.set(...(s.scale || [s.r, s.r, s.r]));
      temp.rotation.set(random() * 3, random() * 3, random() * 3);
      temp.updateMatrix();
      m.setMatrixAt(i, temp.matrix);
      const color = new THREE.Color(material.color).multiplyScalar(
        0.78 + random() * 0.42,
      );
      m.setColorAt(i, color);
    });
    m.instanceMatrix.needsUpdate = true;
    m.castShadow = false;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  function surface(fn, uCount = 96, vCount = 32) {
    const positions = [],
      uv = [],
      indices = [],
      colors = [];
    for (let i = 0; i <= uCount; i++)
      for (let j = 0; j <= vCount; j++) {
        const p = fn(i / uCount, j / vCount);
        positions.push(...p);
        uv.push(i / uCount, j / vCount);
        const tone =
          0.84 +
          0.1 * noise(p[0] * 18, p[1] * 18, p[2] * 18) +
          0.08 * noise(p[0] * 45, p[1] * 45, p[2] * 45);
        colors.push(tone, tone, tone);
      }
    for (let i = 0; i < uCount; i++)
      for (let j = 0; j < vCount; j++) {
        const a = i * (vCount + 1) + j,
          b = a + vCount + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }
  function membranePoint(theta, phi, radius = 3.03) {
    const x = Math.sin(theta) * Math.cos(phi),
      y = Math.sin(theta) * Math.sin(phi),
      z = Math.cos(theta);
    const bulge =
      1 +
      0.04 * noise(x * 2.3, y * 2.3, z * 2.3) +
      0.009 * noise(x * 17, y * 17, z * 17);
    return new THREE.Vector3(
      x * radius * bulge,
      y * radius * 1.04 * bulge,
      z * radius * 0.83 * bulge,
    );
  }
  const cut = (phi) =>
    1.045 + 0.045 * Math.sin(phi * 5) + 0.026 * Math.cos(phi * 9);
  const membrane = group("membrane", [0, 0, 0]);
  const membraneMat = mat("#96b999", {
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    side: THREE.DoubleSide,
    roughness: 0.24,
    metalness: 0.1,
    bumpScale: 0.055,
  });
  for (const radius of [3.03, 2.98]) {
    mesh(
      membrane,
      surface(
        (u, v) =>
          membranePoint(
            cut(u * TAU) + v * (Math.PI - cut(u * TAU)),
            u * TAU,
            radius,
          ).toArray(),
        160,
        90,
      ),
      membraneMat,
      false,
    );
  }
  const whole = mesh(
    membrane,
    surface(
      (u, v) => membranePoint(v * cut(u * TAU), u * TAU).toArray(),
      128,
      56,
    ),
    mat("#9dc3a4", {
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      side: THREE.DoubleSide,
      bumpScale: 0.04,
    }),
    false,
  );
  full.push(whole);
  const lipids = [],
    frontLipids = [],
    cutLipids = [],
    tails = [];
  // Dense but instanced: thousands of phospholipid heads in two leaflets.
  for (let i = 0; i < 8800; i++) {
    const phi = i * Math.PI * (3 - Math.sqrt(5)),
      theta = Math.acos(1 - (2 * (i + 0.5)) / 8800);
    if (theta < cut(phi)) {
      frontLipids.push({ p: membranePoint(theta, phi).toArray(), r: 0.0125 });
      continue;
    }
    const p = membranePoint(theta, phi);
    lipids.push({ p: p.toArray(), r: 0.0125 });
    if (i % 3 === 0)
      lipids.push({ p: membranePoint(theta, phi, 2.975).toArray(), r: 0.0125 });
  }
  for (let i = 0; i < 740; i++) {
    const phi = (i / 740) * TAU,
      theta = cut(phi);
    for (const radius of [3.035, 2.978])
      cutLipids.push({
        p: membranePoint(theta, phi, radius).toArray(),
        r: 0.024,
      });
    if (i % 2 === 0)
      tails.push([
        membranePoint(theta, phi, 3.018),
        membranePoint(theta + 0.003, phi + 0.001, 2.992),
      ]);
  }
  beads(
    membrane,
    lipids,
    mat("#98b5a2", { transparent: true, opacity: 0.53, roughness: 0.57 }),
    1,
  );
  beads(membrane, cutLipids, mat("#adc8ac", { roughness: 0.45 }), 1);
  tubes(membrane, tails, 0.008, mat("#72937a"), 2, 4);
  const proteinSamples = [];
  for (let i = 0; i < 85; i++) {
    const phi = random() * TAU,
      theta = 1.13 + random() * 1.55,
      p = membranePoint(theta, phi, 3.04);
    proteinSamples.push({ p: p.toArray(), scale: [0.043, 0.059, 0.042] });
  }
  beads(membrane, proteinSamples, mat("#82bdb0", { roughness: 0.36 }), 2);
  const glycans = [];
  for (let i = 0; i < 35; i++) {
    const phi = random() * TAU,
      theta = 1.15 + random() * 0.7;
    const p = membranePoint(theta, phi, 3.06),
      normal = p.clone().normalize();
    const points = [];
    for (let j = 0; j < 5; j++)
      points.push(
        p
          .clone()
          .addScaledVector(normal, j * 0.035)
          .add(
            new THREE.Vector3(
              Math.sin(j * 2 + i) * 0.016,
              Math.cos(j * 2 + i) * 0.014,
              0,
            ),
          ),
      );
    glycans.push(points);
  }
  tubes(
    membrane,
    glycans,
    0.009,
    mat("#d6d5a1", { transparent: true, opacity: 0.6 }),
    16,
    5,
  );
  const lipidCap = beads(
    membrane,
    frontLipids,
    mat("#98b5a2", { transparent: true, opacity: 0.42, roughness: 0.57 }),
    1,
  );
  full.push(lipidCap);
  anchors.membrane.set(-2.6, 1.4, 0.8);

  const cytoplasm = group("cytoplasm", [0, 0, 0]);
  anchors.cytoplasm.set(2.05, 1.5, 0.6);

  const nucleus = group("nucleus", [-0.45, 0.36, 0.5]);
  const nuclearModel = nucleusAssembly();
  for (const child of [...nuclearModel.children]) nucleus.add(child);
  nucleus.traverse((o) => {
    if (o.userData.cap) full.push(o);
  });
  anchors.nucleus.set(0.35, 0.5, 0.63);

  const rough = group("roughER", [-0.45, 0.36, 0.18]);
  const roughModel = mergeER(roughAssembly());
  for (const child of [...roughModel.children]) rough.add(child);
  rough.traverse((o) => {
    if (o.userData.cap) full.push(o);
  });
  anchors.roughER.set(-1.22, -0.58, 0.37);
  const smooth = group("smoothER", [-1.54, 1.45, -0.03]);
  const smoothModel = mergeER(smoothAssembly());
  smoothModel.scale.setScalar(0.43);
  smooth.add(smoothModel);
  smooth.traverse((o) => {
    if (o.userData.cap) full.push(o);
  });
  anchors.smoothER.set(-0.12, 0.4, 0.16);

  const mitochondria = group("mitochondria", [0, 0, 0]);
  function makeMito(position, angle, size) {
    const g = mergeMitochondrion(rawMitochondrion());
    g.position.set(...position);
    g.rotation.set(-0.14, 0.18, angle);
    g.scale.setScalar(size);
    mitochondria.add(g);
    g.traverse((o) => {
      if (o.userData.cap) full.push(o);
    });
  }
  makeMito([-1.86, -0.94, 0.7], 0.45, 1.02);
  makeMito([1.26, 1.65, 0.4], 0.6, 0.88);
  makeMito([1.02, -1.8, 0.69], -0.8, 0.9);
  anchors.mitochondria.set(-1.84, -0.9, 0.9);

  const golgi = group("golgi", [1.58, -0.15, 0.61]);
  const golgiModel = mergeER(golgiAssembly());
  golgiModel.scale.setScalar(0.45);
  golgi.add(golgiModel);
  golgiModel.traverse((o) => {
    if (o.userData.cap) full.push(o);
  });
  anchors.golgi.set(0.12, 0.2, 0.34);

  const ribosomes = group("ribosomes", [-0.43, -1.73, 0.78]);
  const ribosomeTemplate = ribosomeBody({ detail: false }),
    polysome = [],
    ribosomeMatrices = [];
  for (let i = 0; i < 23; i++) {
    const a = (i / 22) * 7,
      p = [
        Math.cos(a) * (0.12 + i * 0.009) + 0.09 * Math.sin(a * 2.3),
        Math.sin(a) * 0.19 + 0.06 * Math.cos(a * 3.7),
        (i / 22 - 0.5) * 0.23,
      ];
    const unit = new THREE.Object3D();
    unit.scale.setScalar(0.055);
    unit.position.set(...p);
    unit.rotation.set(0.08 * Math.sin(a), 0.1 * Math.cos(a), 0);
    unit.updateMatrix();
    ribosomeMatrices.push(unit.matrix.clone());
    polysome.push(
      new THREE.Vector3(0, 0.205, 0.4).applyMatrix4(unit.matrix).toArray(),
    );
  }
  for (const source of ribosomeTemplate.children) {
    const instances = new THREE.InstancedMesh(
      source.geometry,
      source.material,
      ribosomeMatrices.length,
    );
    instances.userData = { ...source.userData };
    instances.castShadow = true;
    instances.receiveShadow = true;
    ribosomeMatrices.forEach((matrix, i) => instances.setMatrixAt(i, matrix));
    instances.instanceMatrix.needsUpdate = true;
    ribosomes.add(instances);
  }
  tubes(ribosomes, [polysome], 0.007, mat("#b3ba92"), 180, 5);
  anchors.ribosomes.set(0, 0.08, 0.2);

  const lysosome = group("lysosome", [-1.25, -2.0, 0.28]),
    lysosomeModel = mergeER(lysosomeAssembly());
  lysosomeModel.scale.setScalar(0.28);
  lysosome.add(lysosomeModel);
  lysosomeModel.traverse((o) => {
    if (o.userData.cap) full.push(o);
  });
  const peroxisome = group("peroxisome", [1.99, 0.87, 0.64]),
    peroxisomeModel = mergeER(peroxisomeAssembly());
  peroxisomeModel.scale.setScalar(0.215);
  peroxisome.add(peroxisomeModel);
  peroxisomeModel.traverse((o) => {
    if (o.userData.cap) full.push(o);
  });

  const centro = group("centrosome", [0.12, -0.98, 1.08]),
    centroModel = mergeER(centrosomeAssembly());
  centroModel.scale.setScalar(0.18);
  centroModel.rotation.set(0.48, -0.3, -0.12);
  centro.add(centroModel);
  const skeleton = group("cytoskeleton", [0, 0, 0]),
    network = mergeER(skeletonNetwork());
  network.children.forEach((o) => {
    o.material.transparent = true;
    o.material.opacity = 0.24;
    o.material.depthWrite = false;
  });
  skeleton.add(network);
  anchors.cytoskeleton.set(0.85, -2.18, -0.25);

  // Keep contextual solute markers outside organelles, including the omitted nucleus.
  // Conservative bounds avoid implying that cytosol occupies membrane-enclosed lumens.
  cell.updateMatrixWorld(true);
  const occupied = Object.entries(groups)
    .filter(([id]) => !["membrane", "cytoplasm", "cytoskeleton"].includes(id))
    .flatMap(([id, g]) => (id === "mitochondria" ? g.children : [g]))
    .map((g) => new THREE.Box3().setFromObject(g).expandByScalar(0.025));
  const particles = [];
  for (let i = 0; i < 12000 && particles.length < 650; i++) {
    const p = new THREE.Vector3(
      (random() - 0.5) * 5.6,
      (random() - 0.5) * 5.8,
      (random() - 0.5) * 4.4,
    );
    if (
      (p.x / 2.8) ** 2 + (p.y / 2.9) ** 2 + (p.z / 2.2) ** 2 > 1 ||
      occupied.some((box) => box.containsPoint(p))
    )
      continue;
    particles.push({ p: p.toArray(), r: 0.008 + random() * 0.012 });
  }
  beads(
    cytoplasm,
    particles,
    mat("#c3b88b", { transparent: true, opacity: 0.58 }),
    0,
  );

  for (const [id, g] of Object.entries(groups))
    g.traverse((o) => {
      if (o.isMesh) {
        o.userData.id = id;
        o.userData.baseEmissive = o.material.emissive?.clone();
      }
    });
  // Named anatomical subsets. They retain their original placements for contextual views.
  // Deep-level builders replace molecular assemblies with enlarged schematic models.
  const parts = {};
  const register = (id, objects) => {
    parts[id] = objects;
  };
  const nc = nucleus.children,
    mc = membrane.children,
    rc = rough.children,
    gc = golgi.children;
  register("bilayer", [...mc.slice(0, 6), mc[8]]);
  register("membraneProteins", [mc[6]]);
  register("glycans", [mc[7]]);
  register("cytosol", cytoplasm.children);
  for (const id of ["envelope", "nuclearPores", "chromatin", "nucleolus"])
    register(
      id,
      nc.filter((o) => o.userData.hitId === id),
    );
  register(
    "erCisternae",
    rc.filter((o) => o.userData.hitId === "erCisternae"),
  );
  register(
    "boundRibosomes",
    rc.filter((o) => o.userData.hitId === "boundRibosomes"),
  );
  register("erTubules", smooth.children);
  const mm = mitochondria.children[0].children;
  for (const id of ["mitoOuter", "cristae", "atpSynthase", "matrix", "mitoDNA"])
    register(
      id,
      mm.filter((o) => o.userData.hitId === id),
    );
  register(
    "mitoInner",
    mm.filter((o) => ["cristae", "atpSynthase"].includes(o.userData.hitId)),
  );
  register(
    "golgiCisternae",
    gc[0].children.filter((o) => o.userData.hitId === "golgiCisternae"),
  );
  register(
    "vesicles",
    gc[0].children.filter((o) => o.userData.hitId === "vesicles"),
  );
  for (const id of ["largeSubunit", "smallSubunit"]) {
    const items = [];
    ribosomes.traverse((o) => {
      if (o.isMesh && o.userData.hitId === id) items.push(o);
    });
    register(id, items);
  }
  register("mrna", [ribosomes.children.at(-1)]);
  for (const id of ["lysosomalMembrane", "hydrolases", "recycling"])
    register(
      id,
      lysosomeModel.children.filter((o) => o.userData.hitId === id),
    );
  for (const id of ["peroxisomalMembrane", "oxidativeEnzymes"])
    register(
      id,
      peroxisomeModel.children.filter((o) => o.userData.hitId === id),
    );
  for (const id of ["centrioles", "pcm"])
    register(
      id,
      centroModel.children.filter((o) => o.userData.hitId === id),
    );
  for (const id of ["microtubules", "actin", "intermediate"])
    register(
      id,
      network.children.filter((o) => o.userData.hitId === id),
    );
  full.forEach((o) => {
    o.userData.cap = true;
  });
  [mc[4], mc[5]].forEach((o) => {
    o.userData.cutOnly = true;
  });
  return { cell, groups, full, anchors, resources, parts };
}
