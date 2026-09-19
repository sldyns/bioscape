import { THREE, sceneKit } from "../../kit.js";

export function membraneScene(gap = 0.95, centre = 0, extraHoles = []) {
  const k = sceneKit();
  const heads = k.material("#a9c1b2");
  const innerHeads = k.material("#8fae9f");
  const tails = k.material("#cfc19d");
  const glycerol = k.material("#bba987");
  // Instanced paired leaflets; the visible cut edge exposes separate glycerol
  // necks and two fatty-acid tails, one with a schematic unsaturated kink.
  const sites = [];
  for (let x = -4.2; x <= 4.21; x += 0.235) {
    if (
      Math.abs(x - centre) < gap ||
      extraHoles.some((h) => Math.abs(x - h.centre) < h.radius)
    )
      continue;
    for (let j = 0; j < 6; j++)
      sites.push([x + (j % 2) * 0.045, -0.68 + j * 0.255]);
  }
  const temp = new THREE.Object3D();
  function lipidInstances(geometry, material, side, offset, scale, name) {
    const mesh = new THREE.InstancedMesh(geometry, material, sites.length);
    mesh.name = name;
    sites.forEach(([x, z], i) => {
      temp.position.set(x, side * offset, z);
      temp.rotation.set(0, 0, 0);
      temp.scale.set(...scale);
      temp.updateMatrix();
      mesh.setMatrixAt(i, temp.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    k.group.add(mesh);
  }
  for (const side of [-1, 1]) {
    lipidInstances(
      k.sphere,
      side === 1 ? heads : innerHeads,
      side,
      0.65,
      [0.107, 0.11, 0.107],
      `phospholipid-heads-${side}`,
    );
    lipidInstances(
      k.sphere,
      glycerol,
      side,
      0.49,
      [0.055, 0.075, 0.065],
      `glycerol-necks-${side}`,
    );
    for (const tail of [-1, 1]) {
      const points = [
        [tail * 0.049, side * 0.48, 0],
        [tail * 0.053, side * 0.36, 0.012],
        [tail * 0.05, side * 0.25, 0.022],
        [tail * (tail === 1 ? 0.1 : 0.052), side * 0.17, 0.03],
        [tail * (tail === 1 ? 0.11 : 0.05), side * 0.045, 0.038],
      ];
      const geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))),
        18,
        0.025,
        7,
        false,
      );
      lipidInstances(
        geometry,
        tails,
        side,
        0,
        [1, 1, 1],
        `fatty-acid-tail-${side}-${tail}`,
      );
    }
  }
  const outside = k.material("#dce8e7", {
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
  });
  const inside = k.material("#e8ddc8", {
    transparent: true,
    opacity: 0.13,
    depthWrite: false,
  });
  k.mesh(new THREE.BoxGeometry(8.9, 2.35, 0.025), outside, [0, 1.93, -0.8]);
  k.mesh(new THREE.BoxGeometry(8.9, 2.65, 0.025), inside, [0, -2.08, -0.8]);
  return k;
}

export const mix = (a, b, p) => a + (b - a) * p;
export function seeded(index, salt = 1) {
  const q = Math.sin((index + 1) * 127.1 + salt * 311.7) * 43758.5453;
  return q - Math.floor(q);
}
export function wander(index, t, salt) {
  const step = t * 23;
  const n = Math.floor(step);
  const f = step - n;
  return (
    mix(seeded(index * 29 + n, salt), seeded(index * 29 + n + 1, salt), f) - 0.5
  );
}

const secondaryResources = new WeakMap();
export function alphaHelix(k, position, height, material, parent = k.group) {
  if (!secondaryResources.has(k)) {
    const points = [];
    for (let i = 0; i <= 112; i++) {
      const t = i / 112;
      points.push(
        new THREE.Vector3(
          0.084 * Math.cos(t * Math.PI * 14),
          t * 2 - 1,
          0.084 * Math.sin(t * Math.PI * 14),
        ),
      );
    }
    secondaryResources.set(
      k,
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        112,
        0.033,
        8,
        false,
      ),
    );
  }
  const helix = k.mesh(secondaryResources.get(k), material, position, parent);
  helix.scale.y = height / 2;
  return helix;
}

export function foldedDomain(
  k,
  position,
  scale,
  material,
  name,
  parent = k.group,
) {
  const domain = new THREE.Group();
  domain.name = name;
  domain.position.set(...position);
  domain.scale.set(...scale);
  parent.add(domain);
  // Open-front cleft with two distinct lobes and a folded rear sheet.
  k.ball([-0.3, 0, -0.1], [0.28, 0.48, 0.3], material, domain);
  k.ball([0.32, 0.03, -0.08], [0.26, 0.42, 0.29], material, domain);
  k.ball([0, -0.33, -0.15], [0.36, 0.19, 0.27], material, domain);
  for (const x of [-0.43, 0.43]) {
    const h = alphaHelix(k, [x, 0.04, 0.1], 0.74, material, domain);
    h.rotation.z = x * 0.45;
  }
  for (let row = 0; row < 4; row++) {
    const points = [];
    for (let j = 0; j < 6; j++)
      points.push([
        -0.22 + row * 0.14,
        -0.25 + j * 0.11,
        -0.19 + (j % 2) * 0.04,
      ]);
    k.tube(points, 0.028, material, domain, 18);
    if (row < 3)
      k.tube(
        [
          [points[5][0], 0.3, -0.19],
          [points[5][0] + 0.07, 0.37, -0.12],
          [points[5][0] + 0.14, 0.3, -0.19],
        ],
        0.025,
        material,
        domain,
        12,
      );
  }
  return domain;
}

export function sugarRing(k, position, material, parent = k.group) {
  const ring = new THREE.Group();
  ring.position.set(...position);
  parent.add(ring);
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (i * Math.PI) / 3;
    return [Math.cos(a) * 0.145, Math.sin(a) * 0.145, i % 2 ? 0.033 : -0.033];
  });
  for (let i = 0; i < 6; i++) {
    k.segment(pts[i], pts[(i + 1) % 6], 0.029, material, ring);
    k.ball(pts[i], 0.038, material, ring);
  }
  k.segment([-0.07, 0.125, 0.033], [-0.09, 0.22, 0.08], 0.022, material, ring);
  return ring;
}

export function materialInventory(group, extras = []) {
  const set = new Set(extras);
  group.traverse((o) => {
    if (o.material)
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        set.add(m);
  });
  return [...set];
}
