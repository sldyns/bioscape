import { THREE } from "../../kit.js";
import { molecularKit } from "./molecularDetail.js";

export function rodCutaway(parent, length, radius, color = "#86a49a") {
  const k = molecularKit(parent),
    wall = k.mat(color, { side: THREE.DoubleSide }),
    inner = k.mat("#b6c8bc", { side: THREE.DoubleSide }),
    lipid = k.mat("#d4d4bb");
  const original = new THREE.CapsuleGeometry(
      radius,
      length,
      12,
      48,
    ).toNonIndexed(),
    pos = original.getAttribute("position"),
    vertices = [];
  for (let i = 0; i < pos.count; i += 3) {
    const z = (pos.getZ(i) + pos.getZ(i + 1) + pos.getZ(i + 2)) / 3;
    if (z < 0.06)
      for (let j = 0; j < 3; j++)
        vertices.push(pos.getX(i + j), pos.getY(i + j), pos.getZ(i + j));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geo.computeVertexNormals();
  original.dispose();
  for (const [scale, mat] of [
    [1, wall],
    [0.925, inner],
  ]) {
    const m = new THREE.Mesh(geo, mat);
    m.rotation.z = Math.PI / 2;
    m.scale.setScalar(scale);
    parent.add(m);
  }
  // Paired leaflet cross sections at the open edge expose a genuine wall thickness.
  const heads = k.instances(
      k.sphere,
      lipid,
      192,
      "bilayer-cut-edge-headgroups",
    ),
    tails = k.instances(
      k.cylinder,
      wall,
      192,
      "bilayer-cut-edge-hydrophobic-tails",
    );
  const a = new THREE.Vector3(),
    z = new THREE.Vector3();
  for (let i = 0; i < 96; i++) {
    const t = (i * Math.PI * 2) / 96,
      x = (length / 2) * Math.sign(Math.cos(t)) + radius * Math.cos(t),
      y = radius * Math.sin(t);
    for (let side = 0; side < 2; side++) {
      const q = side ? 0.925 : 1;
      a.set(x * q, y * q, 0.065);
      k.bead(heads, i * 2 + side, a, 0.034);
      z.set(x * (side ? 0.958 : 0.972), y * (side ? 0.958 : 0.972), 0.055);
      k.segment(tails, i * 2 + side, a, z, 0.016);
    }
  }
  k.finish(heads, tails);
  return { materials: k.materials };
}

export function phageSurface(parent) {
  const k = molecularKit(parent),
    caps = k.mat("#a08aae", { side: THREE.DoubleSide }),
    pore = k.mat("#796b89"),
    collar = k.mat("#b9a8c2");
  const geom = new THREE.IcosahedronGeometry(0.448, 1),
    a = geom.getAttribute("position"),
    verts = [],
    centers = new Map();
  for (let i = 0; i < a.count; i += 3) {
    const cz = (a.getZ(i) + a.getZ(i + 1) + a.getZ(i + 2)) / 3;
    if (cz < 0.16)
      for (let j = 0; j < 3; j++)
        verts.push(a.getX(i + j), a.getY(i + j), a.getZ(i + j));
  }
  for (let i = 0; i < a.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(a, i),
      key = v
        .toArray()
        .map((x) => x.toFixed(4))
        .join(",");
    centers.set(key, v);
  }
  const cut = new THREE.BufferGeometry();
  cut.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  cut.computeVertexNormals();
  const body = new THREE.Mesh(cut, caps);
  parent.add(body);
  geom.dispose();
  const hex = new THREE.CylinderGeometry(0.078, 0.068, 0.04, 6),
    dummy = new THREE.Object3D(),
    up = new THREE.Vector3(0, 1, 0),
    positions = [...centers.values()].filter((v) => v.z < 0.19),
    tiles = k.instances(
      hex,
      collar,
      positions.length,
      "capsid-capsomere-lattice",
    );
  positions.forEach((v, i) => {
    dummy.position.copy(v).multiplyScalar(1.025);
    dummy.quaternion.setFromUnitVectors(up, v.clone().normalize());
    dummy.updateMatrix();
    tiles.setMatrixAt(i, dummy.matrix);
  });
  k.finish(tiles);
  const collarMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.045, 8, 24),
    pore,
  );
  collarMesh.rotation.x = Math.PI / 2;
  collarMesh.position.y = -0.43;
  parent.add(collarMesh);
  const sleeve = new THREE.Group();
  parent.add(sleeve);
  for (let i = 0; i < 10; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.025, 6, 18),
      i % 2 ? caps : collar,
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.45 - i * 0.052;
    sleeve.add(ring);
  }
  return { materials: k.materials, sleeve };
}

export function nucleoidDuplex(parent, centerX) {
  const k = molecularKit(parent),
    material = k.mat("#82999c"),
    baseMat = k.mat("#bccbc3"),
    N = 192;
  const rails = [0, 1].map((i) =>
    k.instances(k.cylinder, material, N, `nucleoid-duplex-backbone-${i}`),
  );
  const phosphates = [0, 1].map((i) =>
    k.instances(k.sphere, material, 64, `nucleoid-phosphates-${i}`),
  );
  const bases = k.instances(k.base, baseMat, 64, "nucleoid-base-pairs"),
    a = new THREE.Vector3(),
    z = new THREE.Vector3();
  const colors = [
    new THREE.Color("#7d9698"),
    new THREE.Color("#c3a265"),
    new THREE.Color("#a18cae"),
  ];
  function point(t, strand, out) {
    const ang = t * Math.PI * 2,
      twist = ang * 12 + strand * Math.PI,
      r = 0.067 * Math.cos(twist);
    return out.set(
      centerX + (1.08 + r) * Math.cos(ang),
      (0.45 + r) * Math.sin(ang),
      0.12 + 0.067 * Math.sin(twist),
    );
  }
  function update(p, special, donor = true) {
    function present(t) {
      const i = Math.floor(t * 48);
      return (
        !donor ||
        (p < 0.54 &&
          !(
            p > 0.23 &&
            ((special && i >= 4 && i < 22) || (!special && i >= 16 && i < 22))
          ))
      );
    }
    function color(t) {
      const i = Math.floor(t * 48);
      return donor && i >= 16 && i < 22
        ? colors[1]
        : donor && special && i >= 4 && i < 16
          ? colors[2]
          : colors[0];
    }
    for (let strand = 0; strand < 2; strand++) {
      for (let i = 0; i < N; i++) {
        point(i / N, strand, a);
        point((i + 1) / N, strand, z);
        k.segment(rails[strand], i, a, z, present(i / N) ? 0.019 : 0);
        rails[strand].setColorAt(i, color(i / N));
      }
      for (let i = 0; i < 64; i++) {
        point(i / 64, strand, a);
        k.bead(phosphates[strand], i, a, present(i / 64) ? 0.025 : 0);
        phosphates[strand].setColorAt(i, color(i / 64));
      }
    }
    for (let i = 0; i < 64; i++) {
      point(i / 64, 0, a);
      point(i / 64, 1, z);
      k.segment(
        bases,
        i,
        a,
        z,
        present(i / 64) ? 0.016 : 0,
        present(i / 64) ? 0.033 : 0,
      );
    }
    for (const m of [...rails, ...phosphates])
      m.instanceColor.needsUpdate = true;
    k.finish(rails, phosphates, bases);
  }
  update(0, false, false);
  return { update, materials: k.materials };
}

export function sporeLayers(parent) {
  const k = molecularKit(parent),
    lipid = k.mat("#8ca99c"),
    headsMat = k.mat("#c7d2ba"),
    cortexMat = k.mat("#b9a16d"),
    coatMat = k.mat("#826d91");
  const innerHeads = k.instances(
      k.sphere,
      headsMat,
      192,
      "forespore-inner-membrane-paired-headgroups",
    ),
    innerTails = k.instances(
      k.cylinder,
      lipid,
      96,
      "forespore-inner-membrane-hydrophobic-core",
    ),
    a = new THREE.Vector3(),
    z = new THREE.Vector3();
  for (let i = 0; i < 96; i++) {
    const t = (i * Math.PI * 2) / 96;
    for (let j = 0; j < 2; j++) {
      a.set(
        (0.7 + j * 0.047) * Math.cos(t),
        (0.7 + j * 0.047) * Math.sin(t),
        0.07,
      );
      k.bead(innerHeads, i * 2 + j, a, 0.025);
    }
    a.set(0.708 * Math.cos(t), 0.708 * Math.sin(t), 0.065);
    z.set(0.739 * Math.cos(t), 0.739 * Math.sin(t), 0.065);
    k.segment(innerTails, i, a, z, 0.013);
  }
  k.finish(innerHeads, innerTails);
  const engulfment = [];
  for (let i = 0; i < 48; i++) {
    const vertices = [],
      theta0 = (i * Math.PI) / 48,
      theta1 = ((i + 1) * Math.PI) / 48;
    for (let j = 0; j < 20; j++) {
      const p0 = Math.PI + (j * Math.PI) / 20,
        p1 = Math.PI + ((j + 1) * Math.PI) / 20;
      const point = (t, p) => [
        0.91 * Math.cos(t),
        0.87 * Math.sin(t) * Math.cos(p),
        0.73 * Math.sin(t) * Math.sin(p),
      ];
      const q = [
        point(theta0, p0),
        point(theta1, p0),
        point(theta1, p1),
        point(theta0, p1),
      ];
      for (const index of [0, 1, 2, 0, 2, 3]) vertices.push(...q[index]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, lipid);
    m.material.side = THREE.DoubleSide;
    parent.add(m);
    engulfment.push(m);
  }
  const cortexWeave = new THREE.Group();
  parent.add(cortexWeave);
  const fibers = k.instances(
    k.cylinder,
    cortexMat,
    192,
    "cortex-crosslinked-peptidoglycan",
    cortexWeave,
  );
  for (let i = 0; i < 96; i++) {
    const t = (i * Math.PI * 2) / 96;
    for (let j = 0; j < 2; j++) {
      const t2 = t + 0.055;
      a.set(
        (0.767 + j * 0.047) * Math.cos(t),
        (0.767 + j * 0.047) * Math.sin(t),
        0.082,
      );
      z.set(
        (0.767 + (1 - j) * 0.047) * Math.cos(t2),
        (0.767 + (1 - j) * 0.047) * Math.sin(t2),
        0.082,
      );
      k.segment(fibers, i * 2 + j, a, z, 0.012);
    }
  }
  k.finish(fibers);
  const coatRidges = new THREE.Group();
  parent.add(coatRidges);
  for (let i = 0; i < 11; i++) {
    const theta = 0.2 + (i * (Math.PI - 0.4)) / 10,
      pts = [];
    for (let j = 0; j <= 48; j++) {
      const phi = Math.PI + (j * Math.PI) / 48,
        r = 1 + 0.017 * Math.cos(phi * 14 + theta * 4);
      pts.push(
        new THREE.Vector3(
          1.035 * r * Math.cos(theta),
          0.995 * r * Math.sin(theta) * Math.cos(phi),
          0.828 * r * Math.sin(theta) * Math.sin(phi),
        ),
      );
    }
    coatRidges.add(
      new THREE.Mesh(
        new THREE.TubeGeometry(
          new THREE.CatmullRomCurve3(pts),
          60,
          0.018,
          6,
          false,
        ),
        coatMat,
      ),
    );
  }
  function update(p, wrap, layer) {
    innerHeads.visible = innerTails.visible = p > 0.26;
    engulfment.forEach((m, i) => {
      m.visible = p >= 0.32 && (i + 0.5) / 48 < wrap;
    });
    cortexWeave.visible = p > 0.57;
    coatRidges.visible = p > 0.63;
    coatRidges.scale.setScalar(0.88 + 0.12 * layer);
  }
  return { update, materials: k.materials };
}
