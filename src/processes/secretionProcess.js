import * as THREE from "three";
import {
  lipidSurface,
  foldedProtein,
  continuousNeck,
} from "./secretoryDetails.js";

const clamp = (v) => Math.max(0, Math.min(1, v));
const phase = (p, a, b) => clamp((p - a) / (b - a));
const ease = (v) => v * v * (3 - 2 * v);
const mix = (a, b, t) => a + (b - a) * t;
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const colors = {
  er: "#8f9cad",
  cis: new THREE.Color("#a4b9b2"),
  trans: new THREE.Color("#cf9c85"),
  membrane: "#90b4aa",
  cargo: "#cb792b",
};

function material(color, opacity = 1) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.56,
    metalness: 0,
    clearcoat: 0.08,
    side: THREE.DoubleSide,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity === 1,
  });
}
function mesh(parent, geometry, mat) {
  const item = new THREE.Mesh(geometry, mat);
  parent.add(item);
  return item;
}
function tube(parent, points, radius, mat, segments = 32) {
  return mesh(
    parent,
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      segments,
      radius,
      8,
      false,
    ),
    mat,
  );
}

// A flattened, curved membrane sac, with a genuine opening at its lower rim.
// The separately closable cap makes budding/fusion a lumen-to-lumen transfer.
function cisterna(parent, color, radii, bend = 0.36) {
  const root = new THREE.Group();
  parent.add(root);
  root.name = "secretory-cisterna";
  const [rx, ry, rz] = radii;
  const opening = 2.76;
  const mat = material(color, 0.68);
  function surface(start, end) {
    const positions = [],
      indices = [];
    const u = 48,
      v = 22;
    for (let j = 0; j <= v; j++) {
      const theta = mix(start, end, j / v);
      const h = Math.cos(theta);
      const width = Math.sin(theta) ** 0.48;
      for (let i = 0; i <= u; i++) {
        const phi = Math.PI + (i / u) * Math.PI;
        positions.push(
          rx * width * Math.cos(phi) + bend * h * h,
          ry * h,
          rz * width * Math.sin(phi),
        );
        if (i < u && j < v) {
          const a = j * (u + 1) + i;
          indices.push(a, a + 1, a + u + 1, a + 1, a + u + 2, a + u + 1);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return mesh(root, geometry, mat);
  }
  const body = surface(0, opening);
  body.name = "cisterna-body";
  const cap = surface(opening, Math.PI);
  cap.name = "cisterna-cap";
  const lip = [];
  for (let i = 0; i <= 48; i++) {
    const phi = (i / 48) * Math.PI * 2;
    const width = Math.sin(opening) ** 0.48;
    lip.push(
      V(
        rx * width * Math.cos(phi) + bend * Math.cos(opening) ** 2,
        ry * Math.cos(opening),
        rz * width * Math.sin(phi),
      ),
    );
  }
  const rim = tube(root, lip, 0.014, material(color, 0.62), 48);
  const sites = [];
  // Dense lipid pairs reveal two leaflets and a hydrophobic middle at the rim.
  // The lower cap stays separate so the existing budding opening remains real.
  for (let j = 1; j < 23; j++) {
    const theta = (opening * j) / 23,
      h = Math.cos(theta),
      w = Math.sin(theta) ** 0.48;
    for (let i = 0; i < 42; i++) {
      const phi = (i / 42) * Math.PI * 2;
      if (Math.sin(phi) > 0.001) continue;
      sites.push({
        position: [
          rx * w * Math.cos(phi) + bend * h * h,
          ry * h,
          rz * w * Math.sin(phi),
        ],
        normal: [Math.cos(phi) / rx, h * 0.15, Math.sin(phi) / rz],
      });
    }
  }
  for (const phi of [Math.PI, Math.PI * 2]) {
    const edge = [];
    for (let i = 0; i <= 48; i++) {
      const t = (Math.PI * i) / 48,
        h = Math.cos(t),
        w = Math.sin(t) ** 0.48;
      edge.push(
        V(
          rx * w * Math.cos(phi) + bend * h * h,
          ry * h,
          rz * w * Math.sin(phi),
        ),
      );
    }
    tube(root, edge, 0.025, material(color, 0.94), 64);
  }
  const lipids = lipidSurface(root, sites, color, 0.018);
  lipids.heads.material.transparent = true;
  lipids.heads.material.opacity = 0.76;
  // A curled chain is a glycosylation-enzyme schematic, with lumen facing domains.
  for (let i = 0; i < 4; i++)
    foldedProtein(root, 0.043, color, [
      bend * 0.15,
      ry * (-0.52 + i * 0.32),
      -rz * 0.55,
    ]);
  const materials = [
    ...new Set(
      (() => {
        const all = [];
        root.traverse((node) => {
          if (node.material) all.push(node.material);
        });
        return all;
      })(),
    ),
  ];
  for (const m of materials) {
    m.userData.baseOpacity = m.opacity;
    m.userData.tintWithCisterna = m !== lipids.tails.material;
    m.transparent = true;
    m.depthWrite = false;
  }
  return { root, cap, rim, materials, mouthY: ry * Math.cos(opening) };
}

function vesicle(parent, color) {
  const root = new THREE.Group();
  parent.add(root);
  const mat = material(color, 0.39);
  const full = mesh(root, new THREE.SphereGeometry(0.31, 36, 24), mat);
  // SphereGeometry uses the y axis; omit the lower cap at a membrane junction.
  const open = mesh(
    root,
    new THREE.SphereGeometry(0.31, 36, 24, 0, Math.PI * 2, 0, 2.4),
    mat,
  );
  const lip = mesh(
    root,
    new THREE.TorusGeometry(0.31 * Math.sin(2.4), 0.016, 8, 40),
    material(color, 0.85),
  );
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.31 * Math.cos(2.4);
  open.name = "open-carrier-membrane";
  full.name = "closed-carrier-membrane";
  const sites = [];
  for (let j = 1; j < 15; j++)
    for (let i = 0; i < 30; i++) {
      const theta = (2.35 * j) / 15,
        phi = (i / 30) * Math.PI * 2;
      const n = [
        Math.sin(theta) * Math.cos(phi),
        Math.cos(theta),
        Math.sin(theta) * Math.sin(phi),
      ];
      sites.push({ position: n.map((v) => v * 0.31), normal: n });
    }
  const lipidGroup = new THREE.Group();
  root.add(lipidGroup);
  const lipids = lipidSurface(lipidGroup, sites, color, 0.012);
  function setOpen(value) {
    full.visible = !value;
    open.visible = value;
    lip.visible = value;
  }
  setOpen(false);
  return { root, setOpen, lipidGroup, lipids, sites };
}

function create() {
  const group = new THREE.Group();
  group.name = "Secretory pathway — compartment-preserving teaching model";
  const er = new THREE.Group();
  group.add(er);
  const sacs = [];
  for (let i = 0; i < 3; i++) {
    const sac = cisterna(er, colors.er, [0.14, 0.95, 0.55], 0);
    sac.root.rotation.z = Math.PI / 2;
    sac.root.position.set(-2.92 + i * 0.06, 0.68 - i * 0.57, -i * 0.05);
    sacs.push(sac);
  }
  // Ribosomes are on the cytosolic face, outside the ER lumen.
  const ribosomeMat = material("#938173");
  const ribosomeSmallMat = material("#b4a185");
  const ribosomeGeometry = new THREE.IcosahedronGeometry(0.055, 1);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 13; i++) {
      const x = -3.56 + (i % 7) * 0.19 + row * 0.06;
      const z = i < 7 ? -0.18 : -0.36;
      const ribosome = mesh(er, ribosomeGeometry, ribosomeMat);
      ribosome.position.set(x, 0.89 - row * 0.57, z - row * 0.05);
      ribosome.scale.set(1.1, 0.72, 1);
      const small = mesh(er, ribosomeGeometry, ribosomeSmallMat);
      small.position.copy(ribosome.position);
      small.position.y += 0.065;
      small.position.x += 0.035;
      ribosome.name = "ER-ribosome-large-subunit";
      small.name = "ER-ribosome-small-subunit";
      small.scale.set(0.72, 0.42, 0.72);
      const contact = mesh(
        er,
        new THREE.CylinderGeometry(0.022, 0.025, 0.035, 12),
        ribosomeMat,
      );
      contact.name = "large-subunit-ER-contact";
      contact.position.copy(ribosome.position);
      contact.position.y -= 0.053;
    }
  }
  // Small tubules establish that the ER cisternae are a connected compartment.
  for (let i = 0; i < 2; i++) {
    tube(
      er,
      [
        V(-3.55, 0.59 - i * 0.57, -0.18),
        V(-3.68, 0.37 - i * 0.57, -0.24),
        V(-3.52, 0.16 - i * 0.57, -0.23),
      ],
      0.075,
      material(colors.er, 0.6),
    );
  }

  const golgi = [];
  const cisX = -0.42,
    transX = 0.94,
    spacing = 0.34;
  for (let i = 0; i < 5; i++) {
    const tint = colors.cis.clone().lerp(colors.trans, i / 4);
    const sac = cisterna(group, tint, [0.15, 1.06, 0.68]);
    sac.root.position.x = cisX + i * spacing;
    golgi.push(sac);
  }
  const active = golgi[0];
  const openingX = 0.36 * Math.cos(2.76) ** 2;
  const incoming = vesicle(group, colors.er);
  const outgoing = vesicle(group, colors.trans);
  incoming.root.name = "ER-carrier";
  outgoing.root.name = "secretory-carrier";
  const neckMat = material("#a9bdb5", 0.52);
  const erConnection = continuousNeck(
    group,
    neckMat,
    "continuous-ER-carrier-neck",
  );
  const golgiConnection = continuousNeck(
    group,
    neckMat,
    "continuous-Golgi-carrier-neck",
  );
  const erNeck = erConnection.mesh,
    golgiNeck = golgiConnection.mesh;
  // Carrier-derived lipid identities survive fusion and spread onto the surface.
  group.add(outgoing.lipidGroup);
  outgoing.lipidGroup.name = "persistent-carrier-membrane-lipids";
  const contributionSites = outgoing.sites.map((s) => ({
    position: [...s.position],
    normal: [...s.normal],
  }));

  // The plasma membrane has a real opening. Its closure is hidden during fusion.
  const membraneX = 2.98;
  const holeRadius = 0.3;
  const shape = new THREE.Shape();
  shape.moveTo(-1.68, -0.85);
  shape.lineTo(1.68, -0.85);
  shape.quadraticCurveTo(1.86, -0.85, 1.86, -0.67);
  shape.lineTo(1.86, 0.67);
  shape.quadraticCurveTo(1.86, 0.85, 1.68, 0.85);
  shape.lineTo(-1.68, 0.85);
  shape.quadraticCurveTo(-1.86, 0.85, -1.86, 0.67);
  shape.lineTo(-1.86, -0.67);
  shape.quadraticCurveTo(-1.86, -0.85, -1.68, -0.85);
  const hole = new THREE.Path();
  hole.absarc(0, 0, holeRadius, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const membraneMat = material(colors.membrane, 0.68);
  for (const offset of [-0.035, 0.035]) {
    const sheet = mesh(group, new THREE.ShapeGeometry(shape, 48), membraneMat);
    // Shape's local xy become world yz.
    sheet.rotation.set(Math.PI / 2, Math.PI / 2, 0);
    sheet.position.x = membraneX + offset;
  }
  const closure = mesh(
    group,
    new THREE.CircleGeometry(holeRadius, 48),
    material(colors.membrane, 0.68),
  );
  closure.rotation.y = Math.PI / 2;
  closure.position.x = membraneX;
  const poreRim = mesh(
    group,
    new THREE.TorusGeometry(holeRadius, 0.036, 10, 48),
    material(colors.membrane),
  );
  poreRim.rotation.y = Math.PI / 2;
  poreRim.position.x = membraneX;

  // Lipid head groups give the membrane a readable bilayer without an opaque wall.
  const lipidGeometry = new THREE.SphereGeometry(0.043, 10, 8);
  const lipidMat = material("#a2bdb0");
  for (let y = -1.65; y <= 1.65; y += 0.22) {
    for (const z of [-0.81, 0.81]) {
      for (const side of [-1, 1]) {
        const head = mesh(group, lipidGeometry, lipidMat);
        head.position.set(membraneX + side * 0.043, y, z);
      }
    }
  }

  const membraneSites = [];
  for (let yi = 0; yi < 49; yi++)
    for (let zi = 0; zi < 25; zi++) {
      const y = -1.68 + yi * 0.069,
        z = -0.8 + zi * 0.066;
      if (Math.hypot(y, z) < holeRadius + 0.04) continue;
      membraneSites.push({ position: [membraneX, y, z], normal: [1, 0, 0] });
    }
  lipidSurface(group, membraneSites, colors.membrane, 0.024);
  // An omega-shaped vesicle remains continuous with the cell-surface pore.
  // Its circular mouth is exactly the plasma-membrane aperture (radius 0.30).
  const fusion = new THREE.Group();
  group.add(fusion);
  const fusionRadius = 0.4;
  const fusionCut = Math.asin(holeRadius / fusionRadius);
  const fusionShell = mesh(
    fusion,
    new THREE.SphereGeometry(
      fusionRadius,
      40,
      28,
      0,
      Math.PI * 2,
      fusionCut,
      Math.PI - fusionCut,
    ),
    material(colors.trans, 0.4),
  );
  fusionShell.name = "continuous-fusion-shell";
  const fusionCenter = membraneX - fusionRadius * Math.cos(fusionCut);
  const fusionPosition = fusionShell.geometry.attributes.position;
  const fusionIndices = [];
  for (let r = 0; r < 28; r++)
    for (let j = 0; j < 40; j++) {
      const a = r * 41 + j,
        b = a + 41,
        c = a + 1,
        d = b + 1;
      fusionIndices.push(a, b, c, b, d, c);
    }
  fusionShell.geometry.setIndex(fusionIndices);
  const fusionA = new THREE.Vector3(),
    fusionB = new THREE.Vector3(),
    fusionC = new THREE.Vector3();
  function updateFusionSurface(flatten) {
    for (let r = 0; r <= 28; r++)
      for (let j = 0; j <= 40; j++) {
        const u = r / 28,
          angle = fusionCut + (Math.PI - fusionCut) * u,
          phi = (j / 40) * Math.PI * 2;
        const rho =
          fusionRadius * Math.sin(angle) * (1 - flatten) +
          holeRadius * Math.sqrt(1 - u) * flatten;
        fusionPosition.setXYZ(
          r * 41 + j,
          (fusionCenter + fusionRadius * Math.cos(angle)) * (1 - flatten) +
            membraneX * flatten,
          rho * Math.cos(phi),
          rho * Math.sin(phi),
        );
      }
    fusionPosition.needsUpdate = true;
    fusionShell.geometry.computeVertexNormals();
    fusionShell.geometry.computeBoundingBox();
    fusionShell.geometry.computeBoundingSphere();
  }
  // Evaluate the same rendered triangle, so lipid midplanes stay on the shell
  // during every intermediate flattening frame, not merely at both endpoints.
  function fusionLipidSite(u, phi, site) {
    const rr = Math.min(u * 28, 27.999999),
      cc = ((((phi / (2 * Math.PI)) % 1) + 1) % 1) * 40;
    const r = Math.floor(rr),
      j = Math.floor(cc),
      fr = rr - r,
      fc = cc - j;
    const a = r * 41 + j,
      b = a + 41,
      c = a + 1,
      d = b + 1;
    let wa, wb, wc;
    if (fr + fc <= 1) {
      fusionA.fromBufferAttribute(fusionPosition, a);
      fusionB.fromBufferAttribute(fusionPosition, b);
      fusionC.fromBufferAttribute(fusionPosition, c);
      wa = 1 - fr - fc;
      wb = fr;
      wc = fc;
    } else {
      fusionA.fromBufferAttribute(fusionPosition, b);
      fusionB.fromBufferAttribute(fusionPosition, d);
      fusionC.fromBufferAttribute(fusionPosition, c);
      wa = 1 - fc;
      wb = fr + fc - 1;
      wc = 1 - fr;
    }
    for (let k = 0; k < 3; k++)
      site.position[k] =
        fusionA.getComponent(k) * wa +
        fusionB.getComponent(k) * wb +
        fusionC.getComponent(k) * wc;
    fusionB.sub(fusionA);
    fusionC.sub(fusionA);
    fusionA.crossVectors(fusionB, fusionC).normalize();
    site.normal[0] = fusionA.x;
    site.normal[1] = fusionA.y;
    site.normal[2] = fusionA.z;
  }

  // One selected soluble secretory protein; its folded chain remains in the lumen.
  const cargo = new THREE.Group();
  group.add(cargo);
  const cargoMat = material(colors.cargo);
  cargoMat.emissive.set("#7a3c0f");
  cargoMat.emissiveIntensity = 0.26;
  const chain = [];
  for (let i = 0; i <= 34; i++) {
    const t = (i / 34) * Math.PI * 4;
    chain.push(
      V(
        0.051 * Math.sin(t),
        0.052 * Math.cos(t * 0.7),
        0.05 * Math.sin(t * 1.4),
      ),
    );
  }
  tube(cargo, chain, 0.018, cargoMat, 72);
  const cargoCore = mesh(
    cargo,
    new THREE.IcosahedronGeometry(0.041, 1),
    cargoMat,
  );
  cargoCore.scale.set(1, 0.8, 0.9);
  const glycan = new THREE.Group();
  cargo.add(glycan);
  const sugarMat = material("#e5be6f");
  for (let i = 0; i < 3; i++) {
    const sugar = mesh(
      glycan,
      new THREE.SphereGeometry(0.017, 12, 8),
      sugarMat,
    );
    sugar.position.set(0.025 + i * 0.014, 0.05 + i * 0.027, 0.01);
  }
  foldedProtein(cargo, 0.07, colors.cargo);
  // A thin locator halo is an annotation, not an extra biological structure.
  const halo = mesh(
    cargo,
    new THREE.TorusGeometry(0.13, 0.009, 8, 40),
    material("#bd7c3d", 0.66),
  );
  halo.rotation.x = 0.14;

  const inPath = new THREE.CatmullRomCurve3([
    V(-1.68, 0.68),
    V(-1.3, 0.4, 0.05),
    V(-1.17, -0.92, 0.08),
    V(cisX + openingX, -1.42),
  ]);
  const outPath = new THREE.CatmullRomCurve3([
    V(transX + openingX, -1.42),
    V(1.66, -1.25, 0.06),
    V(2.19, -0.64, 0.08),
    V(membraneX - 0.31, 0),
  ]);
  const pointer = new THREE.Group();
  group.add(pointer);
  const pointerStem = tube(
    pointer,
    [V(0, 0.2), V(0, 0.39)],
    0.011,
    material("#b07942"),
    8,
  );
  pointerStem.name = "Selected protein indicator";
  const pointerTip = mesh(
    pointer,
    new THREE.ConeGeometry(0.033, 0.07, 12),
    material("#b07942"),
  );
  pointerTip.rotation.z = Math.PI;
  pointerTip.position.y = 0.18;

  function update(progress) {
    const p = Number.isFinite(progress) ? clamp(progress) : 0;
    const maturation = ease(phase(p, 0.42, 0.67));
    const activeX = mix(cisX, transX, maturation);
    for (let i = 0; i < golgi.length; i++) {
      const sac = golgi[i];
      let offset = i * spacing + maturation * (transX - cisX);
      if (i > 0 && offset > spacing * 4.5) offset -= spacing * 5;
      sac.root.position.x = cisX + offset;
      const age = clamp(offset / (spacing * 4));
      const fade =
        i === 0
          ? 1
          : Math.min(
              1,
              Math.max(0, offset / 0.14 + 1),
              Math.max(0, (spacing * 4.5 - offset) / 0.14),
            );
      for (let j = 0; j < sac.materials.length; j++) {
        const m = sac.materials[j];
        if (m.userData.tintWithCisterna)
          m.color.lerpColors(colors.cis, colors.trans, age);
        m.opacity = fade * m.userData.baseOpacity;
      }
      sac.root.visible = fade > 0.001;
      sac.cap.visible = true;
    }
    sacs[0].cap.visible = !(p >= 0.12 && p < 0.2);
    erNeck.visible = p >= 0.12 && p < 0.2;
    active.cap.visible = !((p >= 0.34 && p < 0.42) || (p >= 0.67 && p < 0.78));
    golgiNeck.visible = (p >= 0.34 && p < 0.42) || (p >= 0.67 && p < 0.78);

    incoming.root.position.set(-1.68, 0.68, 0);
    outgoing.root.position.set(transX + openingX, -1.42, 0);
    incoming.root.visible = p >= 0.12 && p < 0.42;
    incoming.setOpen(p < 0.2 || p >= 0.34);
    incoming.root.rotation.z = p < 0.2 ? -Math.PI / 2 : Math.PI;
    incoming.root.scale.setScalar(
      p >= 0.39 ? mix(1, 0.01, phase(p, 0.39, 0.42)) : 1,
    );
    outgoing.root.visible = p >= 0.67 && p < 0.9;
    outgoing.setOpen(p < 0.78);
    outgoing.root.rotation.z = Math.PI;
    outgoing.root.scale.setScalar(1);
    // Weld each connection to the exact cisterna ellipse and transformed
    // carrier circle; donor/carrier boundary coordinates are shared.
    const mouthWidth = Math.sin(2.76) ** 0.48;
    erConnection.set(
      (phi, out) =>
        out.set(
          -2.92 - 0.95 * Math.cos(2.76),
          0.68 + 0.14 * mouthWidth * Math.cos(phi),
          0.55 * mouthWidth * Math.sin(phi),
        ),
      (phi, out) =>
        out.set(
          -1.68 + 0.31 * Math.cos(2.4),
          0.68 + 0.31 * Math.sin(2.4) * Math.cos(phi),
          0.31 * Math.sin(2.4) * Math.sin(phi),
        ),
    );
    const incomingDock = p >= 0.34 && p < 0.42;
    const bridgeScale = incomingDock ? incoming.root.scale.x : 1;
    golgiConnection.set(
      (phi, out) =>
        out.set(
          activeX + openingX + 0.15 * mouthWidth * Math.cos(phi),
          active.mouthY,
          0.68 * mouthWidth * Math.sin(phi),
        ),
      (phi, out) =>
        out.set(
          activeX +
            openingX +
            bridgeScale * 0.31 * Math.sin(2.4) * Math.cos(phi),
          -1.42 - bridgeScale * 0.31 * Math.cos(2.4),
          bridgeScale * 0.31 * Math.sin(2.4) * Math.sin(phi),
        ),
    );

    fusion.visible = p >= 0.9 && p < 0.992;
    poreRim.visible = p >= 0.9 && p < 0.992;
    closure.visible = !fusion.visible;
    const flatten = ease(phase(p, 0.963, 0.992));
    updateFusionSurface(flatten);
    glycan.visible = p >= 0.56;

    if (p < 0.12) {
      cargo.position.set(mix(-3.35, -2.47, ease(phase(p, 0, 0.12))), 0.68, 0);
    } else if (p < 0.2) {
      incoming.root.position.set(-1.68, 0.68, 0);
      cargo.position.set(mix(-2.47, -1.68, ease(phase(p, 0.12, 0.2))), 0.68, 0);
    } else if (p < 0.34) {
      inPath.getPoint(ease(phase(p, 0.2, 0.34)), incoming.root.position);
      cargo.position.copy(incoming.root.position);
    } else if (p < 0.42) {
      incoming.root.position.set(cisX + openingX, -1.42, 0);
      const y = mix(-1.42, 0, ease(phase(p, 0.34, 0.42)));
      cargo.position.set(
        cisX + (y < active.mouthY ? openingX : 0.36 * (y / 1.06) ** 2),
        y,
        0,
      );
    } else if (p < 0.7) {
      const y = mix(0, active.mouthY, ease(phase(p, 0.67, 0.7)));
      cargo.position.set(activeX + 0.36 * (y / 1.06) ** 2, y, 0);
    } else if (p < 0.78) {
      outgoing.root.position.set(transX + openingX, -1.42, 0);
      cargo.position.set(
        transX + openingX,
        mix(active.mouthY, -1.42, ease(phase(p, 0.7, 0.78))),
        0,
      );
    } else if (p < 0.9) {
      outPath.getPoint(ease(phase(p, 0.78, 0.9)), outgoing.root.position);
      cargo.position.copy(outgoing.root.position);
    } else {
      cargo.position.set(
        mix(membraneX - 0.31, 3.91, ease(phase(p, 0.925, 1))),
        0,
        0,
      );
    }
    cargo.rotation.set(p * 0.7, p * 2.1, p * 0.3);
    pointer.position.copy(cargo.position);
    outgoing.lipidGroup.visible = p >= 0.67;
    if (p < 0.9) {
      outgoing.lipidGroup.position.copy(outgoing.root.position);
      outgoing.lipidGroup.rotation.copy(outgoing.root.rotation);
      outgoing.lipids.update(outgoing.sites);
    } else {
      outgoing.lipidGroup.position.set(0, 0, 0);
      outgoing.lipidGroup.rotation.set(0, 0, 0);
      for (let i = 0; i < contributionSites.length; i++) {
        const old = outgoing.sites[i].normal;
        fusionLipidSite(
          Math.acos(old[1]) / 2.4,
          Math.atan2(old[2], old[0]),
          contributionSites[i],
        );
      }
      outgoing.lipids.update(contributionSites);
    }
    closure.material.color.set(p >= 0.992 ? colors.trans : colors.membrane);

    group.updateMatrixWorld(true);
  }
  update(0);
  return {
    group,
    update,
    camera: { position: [1.6, 2.6, 13], target: [0, 0.05, 0] },
    labels: [
      {
        position: [-2.88, 1.49, 0],
        text: { zh: "粗面内质网", en: "Rough ER" },
      },
      { position: [-0.49, 1.55, 0], text: { zh: "顺面", en: "Cis face" } },
      { position: [1.05, 1.55, 0], text: { zh: "反面", en: "Trans face" } },
      {
        position: [2.98, 2.03, 0],
        text: { zh: "细胞膜", en: "Plasma membrane" },
      },
      {
        position: [3.66, -0.88, 0],
        text: { zh: "细胞外", en: "Extracellular space" },
      },
      {
        position: [-1.78, -1.89, 0],
        text: { zh: "胞质侧", en: "Cytosolic side" },
      },
    ],
  };
}

export default {
  id: "secretion",
  title: { zh: "蛋白质分泌", en: "Protein secretion" },
  intro: {
    zh: "前侧局部剖开以观察膜腔。跟随橙色蛋白，观察膜区室如何接力运输。这里示意经典分泌途径中的可溶性蛋白，并非所有蛋白都经过这条路线；大小、形态与时间经过简化。",
    en: "Membrane compartments are cut away at the front for viewing. Follow the orange protein through membrane-enclosed compartments. This illustrates a soluble protein in the conventional secretory pathway, not the route of every protein. Sizes, shapes and timing are simplified.",
  },
  duration: 24,
  stages: [
    {
      at: 0,
      title: { zh: "进入内质网腔", en: "Inside the ER lumen" },
      description: {
        zh: "核糖体位于内质网膜的胞质侧；这类分泌蛋白合成时经转位通道进入内质网腔。橙色蛋白已在腔内折叠，准备输出。",
        en: "Ribosomes sit on the cytosolic face of the ER. This class of secretory protein enters its lumen through a translocation channel during synthesis. The orange protein is already folded inside, ready for export.",
      },
    },
    {
      at: 0.12,
      title: { zh: "出芽并装载", en: "Budding and loading" },
      description: {
        zh: "内质网膜出芽，把腔内货物包入运输载体。蛋白始终留在膜包围的空间里，不穿过脂质双层。包被蛋白与完整的分选机制在此省略。",
        en: "The ER membrane buds around luminal cargo. The protein remains in a membrane-enclosed space rather than crossing the lipid bilayer. Coat proteins and detailed sorting machinery are omitted.",
      },
    },
    {
      at: 0.2,
      title: { zh: "抵达高尔基体", en: "Delivery to the Golgi" },
      description: {
        zh: "运输载体到达高尔基体顺面并融合，载体腔与受体膜囊腔连通，货物得以进入。内质网到高尔基体之间的中间区室在此简化。",
        en: "A carrier reaches the cis face and fuses, connecting its lumen to the receiving compartment. The ER–Golgi intermediate compartments are simplified here.",
      },
    },
    {
      at: 0.42,
      title: { zh: "由顺面到反面", en: "From cis to trans" },
      description: {
        zh: "本段用池成熟模型示意加工：蛋白留在膜囊腔内，膜囊逐渐获得反面特征，糖链继续加工。酶的回收运输未画出；实际高尔基体运输并非只有一种机制。",
        en: "Cisternal maturation illustrates processing: cargo stays in the lumen while its cisterna acquires trans characteristics and glycans are processed. Enzyme recycling is omitted; real Golgi traffic uses multiple mechanisms.",
      },
    },
    {
      at: 0.67,
      title: { zh: "分选并再次出芽", en: "Sorting and packaging" },
      description: {
        zh: "在反面高尔基网络，货物按去向分选。这里跟随的是走向细胞表面的可溶性分泌蛋白，随后进入分泌载体。",
        en: "The trans-Golgi network sorts cargo by destination. Here, a soluble secretory protein bound for the cell surface is packaged into a secretory carrier.",
      },
    },
    {
      at: 0.78,
      title: { zh: "运向细胞膜", en: "Approaching the cell surface" },
      description: {
        zh: "分泌载体包裹着货物抵达细胞膜。细胞会调控运输、识别与融合；图中的运动路线是教学示意。",
        en: "A secretory carrier brings enclosed cargo to the plasma membrane. Transport, recognition and fusion are regulated; the motion shown is schematic.",
      },
    },
    {
      at: 0.9,
      title: { zh: "融合与胞吐", en: "Fusion and exocytosis" },
      description: {
        zh: "载体膜与细胞膜融合并打开融合孔，载体腔与细胞外连通。蛋白经孔释放，载体膜并入细胞膜；蛋白没有穿过脂质双层。",
        en: "The carrier membrane fuses with the plasma membrane and opens a fusion pore. Its lumen becomes continuous with the extracellular space. Cargo exits through the pore as the carrier membrane joins the cell surface.",
      },
    },
  ],
  sources: [
    {
      title: "The Cell — The Endoplasmic Reticulum",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9889/",
    },
    {
      title:
        "Molecular Biology of the Cell — Transport from the ER through the Golgi Apparatus",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26941/",
    },
    {
      title: "Molecular Biology of the Cell — Intracellular Vesicular Traffic",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK21045/",
    },
  ],
  create,
};
