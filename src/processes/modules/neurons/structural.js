import { THREE } from "../../kit.js";
// Repeated structural motifs are schematic, not fitted atomic coordinates.
export function bilayer(
  k,
  {
    x0,
    x1,
    y,
    z0 = -0.45,
    z1 = 0.55,
    holes = [],
    parent = k.group,
    spacing = 0.115,
  },
) {
  const coords = [];
  for (let x = x0; x <= x1; x += spacing)
    for (let z = z0; z <= z1; z += spacing)
      if (!holes.some((h) => (x - h.x) ** 2 + (z - h.z) ** 2 < h.r ** 2))
        coords.push([x, z]);
  const heads = new THREE.InstancedMesh(
    k.sphere,
    k.material("#afc5b2"),
    coords.length * 2,
  );
  const tails = new THREE.InstancedMesh(
    k.cylinder,
    k.material("#c3b995"),
    coords.length * 4,
  );
  heads.name = "paired lipid headgroup leaflets";
  tails.name = "paired hydrophobic lipid tails";
  parent.add(heads, tails);
  const o = new THREE.Object3D();
  let hi = 0,
    ti = 0;
  for (const [x, z] of coords)
    for (const sign of [-1, 1]) {
      o.position.set(x, y + sign * 0.115, z);
      o.rotation.set(0, 0, 0);
      o.scale.set(0.048, 0.038, 0.048);
      o.updateMatrix();
      heads.setMatrixAt(hi++, o.matrix);
      for (const dx of [-0.019, 0.019]) {
        o.position.set(x + dx, y + sign * 0.052, z);
        o.rotation.z = dx > 0 ? sign * 0.18 : 0;
        o.scale.set(0.011, 0.105, 0.011);
        o.updateMatrix();
        tails.setMatrixAt(ti++, o.matrix);
      }
    }
  heads.instanceMatrix.needsUpdate = tails.instanceMatrix.needsUpdate = true;
  heads.computeBoundingSphere();
  tails.computeBoundingSphere();
  return { heads, tails };
}
export function pore(
  k,
  {
    position,
    color = "#779b98",
    radius = 0.135,
    height = 0.55,
    receptor = false,
    parent = k.group,
  },
) {
  const group = new THREE.Group();
  group.position.set(...position);
  parent.add(group);
  group.name = receptor
    ? "tetrameric receptor with ligand-binding clefts"
    : "four-domain transmembrane pore";
  const material = k.material(color),
    light = material.clone();
  light.color.lerp(new THREE.Color("#e2e6dc"), 0.19);
  const points = [];
  for (let j = 0; j <= 72; j++) {
    const t = j / 72;
    points.push(
      new THREE.Vector3(
        0.014 * Math.cos(t * Math.PI * 12),
        height * (t - 0.5),
        0.014 * Math.sin(t * Math.PI * 12),
      ),
    );
  }
  const helix = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(points),
      72,
      0.013,
      6,
      false,
    ),
    domains = [];
  for (let d = 0; d < 4; d++) {
    const a = Math.PI / 4 + (d * Math.PI) / 2,
      domain = new THREE.Group();
    group.add(domain);
    for (let h = 0; h < 6; h++) {
      const ang = (h * Math.PI) / 3;
      const m = k.mesh(
        helix,
        h % 2 ? light : material,
        [0.036 * Math.cos(ang), 0, 0.036 * Math.sin(ang)],
        domain,
      );
      m.rotation.z = (h % 2 ? 1 : -1) * 0.07;
    }
    k.ball([0, height * 0.49, 0], [0.071, 0.051, 0.064], light, domain);
    if (receptor) {
      // Upper/lower lobes frame the ligand cleft above each transmembrane domain.
      k.ball(
        [0, height * 0.52 + 0.115, -0.015],
        [0.105, 0.09, 0.077],
        material,
        domain,
      );
      k.ball(
        [0, height * 0.52 + 0.24, -0.015],
        [0.095, 0.072, 0.075],
        light,
        domain,
      );
      k.tube(
        [
          [0, height * 0.4, 0],
          [0.025, height * 0.55 + 0.045, 0],
          [0, height * 0.55 + 0.09, 0],
        ],
        0.017,
        material,
        domain,
        20,
      );
    }
    domains.push({ domain, a });
  }
  const gate = k.mesh(
    new THREE.CylinderGeometry(radius * 0.64, radius * 0.64, 0.035, 20),
    k.material("#697e7a"),
    [0, -height * 0.19, 0],
    group,
  );
  function setOpen(open) {
    for (const d of domains)
      d.domain.position.set(
        Math.cos(d.a) * (radius + (open ? 0.025 : 0)),
        0,
        Math.sin(d.a) * (radius + (open ? 0.025 : 0)),
      );
    gate.visible = !open;
  }
  setOpen(false);
  return { group, domains, gate, setOpen };
}
export function motorHead(k, parent, sign, material) {
  const group = new THREE.Group();
  parent.add(group);
  group.name = "myosin motor cleft and lever arm";
  for (const [x, y, z, sx, sy, sz] of [
    [-0.065, 0.57, 0, 0.11, 0.095, 0.1],
    [0.08, 0.6, -0.025, 0.1, 0.1, 0.08],
    [0, 0.7, -0.05, 0.115, 0.055, 0.07],
    [-0.08, 0.69, 0.04, 0.07, 0.055, 0.065],
  ])
    k.ball([x, sign * y, z], [sx, sy, sz], material, group);
  const light = k.material("#c2a8b5");
  for (const y of [0.24, 0.35, 0.45])
    k.ball([0.012, sign * y, 0.01], [0.085, 0.055, 0.066], light, group);
  const helix = [];
  for (let i = 0; i <= 40; i++) {
    let t = i / 40;
    helix.push([
      0.022 * Math.cos(t * Math.PI * 8),
      sign * (0.12 + t * 0.4),
      0.022 * Math.sin(t * Math.PI * 8),
    ]);
  }
  k.tube(helix, 0.019, material, group, 64);
  return group;
}

// Mechanism schematic of an AMPA tetramer: each subunit has M1/M3/M4
// membrane spans and a cytoplasmic M2 re-entrant loop. Not atomic coordinates.
export function ampaReceptor(
  k,
  { position, parent = k.group, height = 0.43, radius = 0.14 },
) {
  const group = new THREE.Group();
  group.position.set(...position);
  group.name = "AMPA tetramer: 3 TM plus M2 per subunit";
  parent.add(group);
  const material = k.material("#7493a5"),
    light = k.material("#a2bac6"),
    domains = [],
    bindingAnchors = [],
    gatingHelices = [];
  const helixPoints = [];
  for (let j = 0; j <= 64; j++) {
    const t = j / 64;
    helixPoints.push(
      new THREE.Vector3(
        0.009 * Math.cos(t * Math.PI * 10),
        height * (t - 0.5),
        0.009 * Math.sin(t * Math.PI * 10),
      ),
    );
  }
  const spanGeometry = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(helixPoints),
    64,
    0.013,
    6,
    false,
  );
  for (let d = 0; d < 4; d++) {
    const a = Math.PI / 4 + (d * Math.PI) / 2,
      domain = new THREE.Group();
    domain.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    domain.rotation.y = -a;
    domain.name = `AMPA subunit ${d}`;
    group.add(domain);
    for (const [name, x, z] of [
      ["M1", 0.022, -0.042],
      ["M3", -0.05, 0],
      ["M4", 0.022, 0.042],
    ]) {
      const m = k.mesh(spanGeometry, material, [x, 0, z], domain);
      m.name = name + " membrane span";
      if (name === "M3") gatingHelices.push({ mesh: m, a });
    }
    const loop = k.tube(
      [
        [-0.035, -height * 0.62, -0.025],
        [-0.07, -height * 0.35, -0.016],
        [-0.075, -0.012, 0],
        [-0.055, -height * 0.31, 0.021],
        [-0.028, -height * 0.62, 0.029],
      ],
      0.012,
      light,
      domain,
      40,
    );
    loop.name = "M2 cytoplasmic re-entrant pore loop";
    // Cytoplasmic continuity from M1 through the re-entrant M2 to M3.
    k.tube(
      [
        [0.031, -height * 0.5, -0.042],
        [0.015, -height * 0.69, -0.036],
        [-0.035, -height * 0.62, -0.025],
      ],
      0.012,
      material,
      domain,
      24,
    );
    k.tube(
      [
        [-0.028, -height * 0.62, 0.029],
        [-0.039, -height * 0.69, 0.02],
        [-0.041, -height * 0.5, 0],
      ],
      0.012,
      material,
      domain,
      24,
    );
    // Extracellular linkers join both M3 and M4 to the ligand-binding domain.
    k.tube(
      [
        [-0.041, height * 0.5, 0],
        [-0.035, height * 0.5 + 0.055, 0],
        [0, height * 0.5 + 0.108, 0],
      ],
      0.014,
      material,
      domain,
      24,
    );
    k.tube(
      [
        [0.031, height * 0.5, 0.042],
        [0.035, height * 0.5 + 0.058, 0.03],
        [0, height * 0.5 + 0.108, 0],
      ],
      0.014,
      material,
      domain,
      24,
    );
    const cleft = new THREE.Object3D();
    cleft.name = "AMPA extracellular ligand cleft";
    cleft.position.set(0, height * 0.5 + 0.18, 0);
    domain.add(cleft);
    bindingAnchors.push(cleft);
    for (const sign of [-1, 1]) {
      const lobe = k.ball(
        [0, cleft.position.y + sign * 0.072, 0],
        [0.088, 0.058, 0.072],
        sign < 0 ? material : light,
        domain,
      );
      lobe.name = "AMPA ligand-binding lobe";
    }
    k.segment(
      [0.015, height * 0.45, 0],
      [0.015, height * 0.5 + 0.08, 0],
      0.022,
      material,
      domain,
    );
    domains.push({ domain, a });
  }
  const gate = k.mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.026, 20),
    k.material("#697e7a"),
    [0, -height * 0.17, 0],
    group,
  );
  gate.name = "AMPA cation gate";
  function setOpen(open) {
    gate.visible = !open;
    for (const { mesh } of gatingHelices) {
      const angle = open ? -0.07 : 0;
      mesh.rotation.z = angle;
      mesh.position.x = -0.05 - Math.sin(angle) * height * 0.5;
      mesh.position.y = (Math.cos(angle) - 1) * height * 0.5;
    }
  }
  setOpen(false);
  return { group, domains, gate, setOpen, bindingAnchors };
}
