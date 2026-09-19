import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { phageDetail } from "../scene/phageDetails.js";
import { splitSection } from "../scene/implicitMembrane.js";

const TAU = Math.PI * 2;
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => {
  const t = clamp(v);
  return t * t * (3 - 2 * t);
};
const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);
const material = (color, options = {}) =>
  new T.MeshPhysicalMaterial({
    color,
    roughness: 0.57,
    clearcoat: 0.1,
    ...options,
  });

// Merge only static pieces with identical material properties. Moving assemblies
// stay separate; caps marked by the atlas factory become a real cutaway window.
function detail(id, cut = false) {
  const source = phageDetail(id),
    result = new T.Group(),
    bins = new Map();
  source.updateMatrixWorld(true);
  source.traverse((o) => {
    if (!o.isMesh || (cut && o.userData.cap)) return;
    const m = o.material;
    const key = [
      m.color.getHex(),
      m.roughness,
      m.opacity,
      m.transparent,
      m.side,
    ].join(":");
    if (!bins.has(key)) bins.set(key, { material: m.clone(), geometry: [] });
    let geometry = o.geometry.clone().applyMatrix4(o.matrixWorld);
    if (cut && id === "phageTube") {
      const [back, front] = splitSection(geometry, (p) => p[2] - 0.025);
      geometry.dispose();
      front.dispose();
      geometry = back;
    }
    bins.get(key).geometry.push(geometry);
  });
  for (const b of bins.values()) {
    result.add(new T.Mesh(mergeGeometries(b.geometry), b.material));
    b.geometry.forEach((g) => g.dispose());
  }
  source.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });
  return result;
}
function cylinderBetween(a, b, radius, mat) {
  const d = b.clone().sub(a),
    mesh = new T.Mesh(new T.CylinderGeometry(radius, radius, 1, 12), mat);
  mesh.position.copy(a).lerp(b, 0.5);
  mesh.quaternion.setFromUnitVectors(V(0, 1, 0), d.clone().normalize());
  mesh.scale.y = d.length();
  return mesh;
}
function duplex(curve, segments = 1100) {
  // Two continuous strands; thickness and coiling are exaggerated for teaching.
  const frames = curve.computeFrenetFrames(segments, false),
    lines = [[], []];
  for (let i = 0; i <= segments; i++) {
    const p = curve.getPointAt(i / segments),
      a = (i / segments) * TAU * 85;
    for (let j = 0; j < 2; j++)
      lines[j].push(
        p
          .clone()
          .addScaledVector(frames.normals[i], 0.018 * Math.cos(a + j * Math.PI))
          .addScaledVector(
            frames.binormals[i],
            0.018 * Math.sin(a + j * Math.PI),
          ),
      );
  }
  const group = new T.Group();
  lines.forEach((points, i) =>
    group.add(
      new T.Mesh(
        new T.TubeGeometry(
          new T.CatmullRomCurve3(points),
          segments,
          0.013,
          6,
          false,
        ),
        material(i ? "#ce9971" : "#aa724b"),
      ),
    ),
  );
  const stride = 8,
    baseCount = Math.floor(segments / stride) + 1;
  const bases = new T.InstancedMesh(
    new T.CylinderGeometry(1, 1, 1, 8),
    material("#dac3a0"),
    baseCount,
  );
  bases.name = "DNA-base-pair-rungs";
  bases.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const baseMatrices = new Float32Array(baseCount * 16),
    o = new T.Object3D(),
    up = V(0, 1, 0),
    direction = V();
  for (let i = 0; i < baseCount; i++) {
    const n = Math.min(segments, i * stride),
      a = lines[0][n],
      b = lines[1][n];
    o.position.copy(a).lerp(b, 0.5);
    direction.copy(b).sub(a);
    o.scale.set(0.008, direction.length(), 0.008);
    o.quaternion.setFromUnitVectors(up, direction.normalize());
    o.updateMatrix();
    o.matrix.toArray(baseMatrices, i * 16);
    bases.setMatrixAt(i, o.matrix);
  }
  bases.instanceMatrix.needsUpdate = true;
  bases.computeBoundingBox();
  bases.computeBoundingSphere();
  group.add(bases);
  group.setInterval = (start, end) => {
    group.children.forEach((m) => {
      if (!m.isInstancedMesh)
        m.geometry.setDrawRange(start * 36, (end - start) * 36);
    });
    const lo = Math.ceil(start / stride),
      hi = Math.min(baseCount, Math.floor(end / stride) + 1);
    bases.count = Math.max(0, hi - lo);
    for (let i = 0; i < bases.count * 16; i++)
      bases.instanceMatrix.array[i] = baseMatrices[lo * 16 + i];
    bases.instanceMatrix.needsUpdate = true;
    bases.computeBoundingBox();
    bases.computeBoundingSphere();
  };
  return group;
}
function create() {
  const group = new T.Group();
  group.position.y = -0.24;
  const host = new T.Group();
  group.add(host);
  const lipid = new T.SphereGeometry(1, 12, 8),
    dummy = new T.Object3D();
  const membrane = (y, color) => {
    const coordinates = [];
    for (let x = -3.2; x <= 3.21; x += 0.16)
      for (let z = -1.25; z <= 1.26; z += 0.16) {
        if (Math.hypot(x, z) < 0.23) continue;
        for (const side of [-1, 1]) coordinates.push([x, y + side * 0.075, z]);
      }
    const beads = new T.InstancedMesh(
      lipid,
      material(color),
      coordinates.length,
    );
    coordinates.forEach((p, i) => {
      dummy.position.set(...p);
      dummy.scale.set(0.075, 0.062, 0.075);
      dummy.updateMatrix();
      beads.setMatrixAt(i, dummy.matrix);
    });
    beads.instanceMatrix.needsUpdate = true;
    beads.computeBoundingBox();
    beads.computeBoundingSphere();
    host.add(beads);
    const tails = new T.InstancedMesh(
      new T.CylinderGeometry(0.012, 0.012, 0.102, 7),
      material("#c5b58f"),
      coordinates.length * 2,
    );
    coordinates.forEach((p, i) => {
      for (let branch = 0; branch < 2; branch++) {
        dummy.position.set(
          p[0] + (branch ? 1 : -1) * 0.027,
          y + (p[1] > y ? 0.017 : -0.017),
          p[2],
        );
        dummy.scale.set(1, 1, 1);
        dummy.rotation.set(0, 0, (branch ? 1 : -1) * 0.14);
        dummy.updateMatrix();
        tails.setMatrixAt(i * 2 + branch, dummy.matrix);
      }
    });
    tails.instanceMatrix.needsUpdate = true;
    tails.computeBoundingBox();
    tails.computeBoundingSphere();
    host.add(tails);
    dummy.rotation.set(0, 0, 0);
    // A lipid interior slab connects the headgroup leaflets; its central opening
    // is only revealed once the entry machinery reaches this patch.
    const shape = new T.Shape();
    shape.moveTo(-3.3, -1.35);
    shape.lineTo(3.3, -1.35);
    shape.lineTo(3.3, 1.35);
    shape.lineTo(-3.3, 1.35);
    shape.closePath();
    const hole = new T.Path();
    hole.absarc(0, 0, 0.23, 0, TAU, true);
    shape.holes.push(hole);
    const slab = new T.Mesh(
      new T.ExtrudeGeometry(shape, {
        depth: 0.07,
        bevelEnabled: false,
        curveSegments: 32,
      }),
      material(color),
    );
    slab.rotation.x = -Math.PI / 2;
    slab.position.y = y - 0.035;
    host.add(slab);
    return y;
  };
  membrane(-0.88, "#a8c2b7");
  membrane(-1.78, "#8fafab");
  // A restrained cross-linked peptidoglycan net in the periplasm.
  const wallMat = material("#c4b593"),
    wallParts = [];
  for (let i = 0; i < 19; i++) {
    const x = -3.15 + i * 0.35;
    for (let j = 0; j < 8; j++) {
      const z = -1.24 + j * 0.35;
      if (Math.hypot(x, z) < 0.3) continue;
      const a = V(x, -1.32, z),
        b = V(x + 0.29, -1.32 + 0.025 * Math.sin(i), z + 0.06);
      wallParts.push(cylinderBetween(a, b, 0.022, wallMat));
      if (j < 7)
        wallParts.push(
          cylinderBetween(a, V(x - 0.045, -1.32, z + 0.35), 0.015, wallMat),
        );
    }
  }
  wallParts.forEach((m) => m.updateMatrix());
  const wallGeometries = wallParts.map((m) =>
    m.geometry.clone().applyMatrix4(m.matrix),
  );
  const wallGeo = mergeGeometries(wallGeometries);
  wallGeometries.forEach((geometry) => geometry.dispose());
  host.add(new T.Mesh(wallGeo, wallMat));
  wallParts.forEach((m) => m.geometry.dispose());
  // Cytoplasmic background sits behind the visible delivery path.
  const cytosol = new T.Mesh(
    new T.BoxGeometry(6.5, 1.0, 0.13),
    material("#dce8e2", { transparent: true, opacity: 0.5, depthWrite: false }),
  );
  cytosol.position.set(0, -2.35, -1.3);
  host.add(cytosol);
  const poreSeal = new T.Mesh(
    new T.CylinderGeometry(0.235, 0.235, 0.14, 40),
    material("#a8c2b7"),
  );
  poreSeal.position.y = -0.88;
  host.add(poreSeal);
  const membraneSeal = new T.Mesh(
    new T.CylinderGeometry(0.235, 0.235, 0.14, 40),
    material("#8fafab"),
  );
  membraneSeal.position.y = -1.78;
  host.add(membraneSeal);
  // A fixed-topology annulus bulges to meet the tail tube; it never depicts a
  // rigid needle directly puncturing the cytoplasmic membrane (T4 cryo-ET).
  const bulgeGeo = new T.PlaneGeometry(0.72, 0.72, 32, 32),
    bp = bulgeGeo.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const x = bp.getX(i),
      z = bp.getY(i);
    bp.setXYZ(i, x, -1.78, z);
  }
  const bulge = new T.Mesh(
    bulgeGeo,
    material("#8fafab", { side: T.DoubleSide }),
  );
  host.add(bulge);
  // Cut a true central outlet from the annulus.
  const oldIndices = bulgeGeo.index.array,
    filtered = [];
  for (let i = 0; i < oldIndices.length; i += 3) {
    let r = 0;
    for (let j = 0; j < 3; j++) {
      const k = oldIndices[i + j];
      r += Math.hypot(bp.getX(k), bp.getZ(k));
    }
    if (r / 3 > 0.082)
      filtered.push(oldIndices[i], oldIndices[i + 1], oldIndices[i + 2]);
  }
  bulgeGeo.setIndex(filtered);

  const phage = new T.Group();
  group.add(phage);
  const head = detail("phageHead", true);
  head.scale.setScalar(0.7);
  phage.add(head);
  const sheath = detail("phageSheath", true);
  phage.add(sheath);
  const tail = detail("phageTube", true);
  tail.scale.set(1, 0.82, 1);
  phage.add(tail);
  const plate = detail("phageBaseplate");
  plate.position.y = -0.46;
  phage.add(plate);
  const fiberMat = material("#8e9bae"),
    fiberJointGeo = new T.SphereGeometry(1, 16, 12),
    fiberJointMat = material("#a0acbd"),
    fibers = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.28,
      unit = V(Math.cos(a), 0, Math.sin(a));
    const root = unit.clone().multiplyScalar(0.32);
    root.y = -0.43;
    const hinge = unit.clone().multiplyScalar(0.87);
    hinge.y = -0.33;
    const tip = unit.clone().multiplyScalar(1.37);
    tip.y = -0.78;
    phage.add(cylinderBetween(root, hinge, 0.026, fiberMat));
    const distal = cylinderBetween(hinge, tip, 0.023, fiberMat);
    phage.add(distal);
    const hingeJoint = new T.Mesh(fiberJointGeo, fiberJointMat);
    hingeJoint.position.copy(hinge);
    hingeJoint.scale.set(0.062, 0.064, 0.06);
    phage.add(hingeJoint);
    const bindingTip = new T.Mesh(fiberJointGeo, material("#b3a3bb"));
    bindingTip.scale.set(0.05, 0.08, 0.05);
    phage.add(bindingTip);
    fibers.push({ distal, hinge, tip, bindingTip });
    const receptor = new T.Mesh(
      new T.SphereGeometry(0.075, 16, 12),
      material("#a79bb3"),
    );
    receptor.position.copy(tip);
    receptor.position.y = -0.78;
    host.add(receptor);
    const receptorStem = new T.Mesh(
      new T.CylinderGeometry(0.045, 0.053, 0.16, 12),
      material("#919c9f"),
    );
    receptorStem.position.copy(tip);
    receptorStem.position.y = -0.9;
    host.add(receptorStem);
    const receptorLip = new T.Mesh(
      new T.TorusGeometry(0.065, 0.018, 8, 20),
      material("#b9aabe"),
    );
    receptorLip.rotation.x = Math.PI / 2;
    receptorLip.position.copy(tip);
    receptorLip.position.y = -0.733;
    host.add(receptorLip);
  }
  const coilPoints = [];
  for (let i = 0; i <= 280; i++) {
    const t = i / 280,
      a = t * TAU * 8.5,
      r = 0.39 * Math.sin(Math.PI * (0.1 + 0.8 * t));
    coilPoints.push(
      V(r * Math.cos(a), 2.15 + 0.56 - 1.13 * t, r * Math.sin(a)),
    );
  }
  coilPoints.push(V(0.12, 1.44, 0), V(0, 1.29, 0));
  const packedCurve = new T.CatmullRomCurve3(coilPoints),
    packed = duplex(packedCurve, 720);
  phage.add(packed);
  const finalHeadPoints = coilPoints.map((p) => p.clone().add(V(0, -0.85, 0)));
  const allPoints = [
    ...finalHeadPoints,
    V(0, 0.15, 0),
    V(0, -0.5, 0),
    V(0, -1.4, 0),
    V(0, -1.88, 0.015),
  ];
  for (let i = 0; i <= 480; i++) {
    const t = i / 480,
      a = t * TAU * 7;
    // The incoming genome relaxes into a folded path, not a new virus particle.
    allPoints.push(
      V(
        1.75 * Math.sin(a) * Math.min(1, t * 9),
        -2.28 + 0.27 * Math.cos(a * 0.71),
        0.1 + 0.2 * Math.sin(a * 0.53),
      ),
    );
  }
  const deliveryCurve = new T.CatmullRomCurve3(allPoints),
    delivery = duplex(deliveryCurve, 2600);
  group.add(delivery);
  const fraction = Math.min(
    0.6,
    packedCurve.getLength() / deliveryCurve.getLength(),
  );
  // Convert centerline arclength to indexed tube segments; a moving contiguous
  // interval conserves the displayed DNA length during arbitrarily reversed seek.
  const totalSegments = 2600,
    lengthSegments = Math.round(totalSegments * fraction);
  const labels = [
    {
      position: [-0.9, 2.2, 0.4],
      text: { zh: "衣壳留在细胞外", en: "Capsid stays outside" },
    },
    { position: [2.9, -0.88, 0.6], text: { zh: "外膜", en: "Outer membrane" } },
    {
      position: [2.9, -1.78, 0.6],
      text: { zh: "细胞膜", en: "Cytoplasmic membrane" },
    },
    {
      position: [1.7, -2.5, 0.5],
      text: { zh: "细菌细胞质", en: "Bacterial cytoplasm" },
    },
  ];
  const axis = V(0, 1, 0),
    direction = V();
  let previousContraction = -1;
  function update(progress) {
    const p = clamp(Number.isFinite(progress) ? progress : 0),
      attachment = ease(p / 0.28),
      contraction = ease((p - 0.32) / 0.24),
      transfer = clamp((p - 0.6) / 0.4);
    phage.position.y = 0.65 * (1 - attachment);
    head.position.y = 2.15 - 0.85 * contraction;
    tail.position.y = 0.35 - 0.85 * contraction;
    // Anchored baseplate; sheath shortens and widens while tube length is fixed.
    const length = 1.7 - 0.85 * contraction;
    sheath.scale.set(
      1 + 0.35 * contraction,
      length / 2.06,
      1 + 0.35 * contraction,
    );
    sheath.position.y = -0.45 + length / 2;
    packed.position.y = -0.85 * contraction;
    packed.visible = p < 0.6;
    delivery.visible = p >= 0.6;
    const start = Math.round(transfer * (totalSegments - lengthSegments));
    delivery.setInterval(start, start + lengthSegments);
    poreSeal.visible = contraction < 0.38;
    membraneSeal.visible = contraction < 0.9;
    if (contraction !== previousContraction) {
      for (let i = 0; i < bp.count; i++) {
        const r = Math.hypot(bp.getX(i), bp.getZ(i));
        bp.setY(i, -1.78 + 0.46 * contraction * Math.exp((-r * r) / 0.037));
      }
      bp.needsUpdate = true;
      bulgeGeo.computeVertexNormals();
      bulgeGeo.computeBoundingBox();
      bulgeGeo.computeBoundingSphere();
      previousContraction = contraction;
    }
    for (const f of fibers) {
      // Fibers flex at the hinge during receptor engagement.
      direction.copy(f.tip).sub(f.hinge);
      direction.y += 0.1 * (1 - attachment);
      f.distal.position.copy(f.hinge).addScaledVector(direction, 0.5);
      f.distal.scale.y = direction.length();
      f.bindingTip.position.copy(f.tip);
      f.bindingTip.position.y += 0.1 * (1 - attachment);
      f.distal.quaternion.setFromUnitVectors(axis, direction.normalize());
    }
    group.userData = {
      phage: "T4",
      phase: p < 0.32 ? "attachment" : p < 0.6 ? "contraction" : "DNA-transfer",
      attachment,
      contraction,
      transfer,
      capsidStaysOutside: true,
      tailTubeLengthConstant: true,
      innerMembraneBulges: true,
      DNAIsDuplex: true,
    };
    group.updateMatrixWorld(true);
  }
  update(0);
  return {
    group,
    update,
    camera: { position: [5.1, 3.3, 12.8], target: [0, 0.1, 0] },
    labels,
  };
}

export default {
  id: "infection",
  title: { zh: "噬菌体如何递送 DNA", en: "How a phage delivers DNA" },
  intro: {
    zh: "以 T4 噬菌体为机制示例，观察感染的起始阶段。形态与时间为教学示意，不代表 T₂ 的精确分子结构；不含后续复制、组装与裂解。",
    en: "Initial infection illustrated with the T4 mechanism. Shapes and timing are schematic, not a molecular reconstruction of T₂. Replication, assembly and lysis follow later.",
  },
  duration: 24,
  stages: [
    {
      at: 0,
      title: { zh: "识别与吸附", en: "Recognition and attachment" },
      description: {
        zh: "尾纤维识别细菌表面的受体，随后基板固定在细胞表面。只有合适的宿主才能被有效识别。",
        en: "Tail fibers recognize receptors on a compatible bacterium. The baseplate then anchors the phage to the surface.",
      },
    },
    {
      at: 0.32,
      title: { zh: "尾鞘收缩", en: "Sheath contraction" },
      description: {
        zh: "尾鞘缩短、变宽，推动长度不变的尾管进入周质。T4 研究显示，内侧细胞膜会局部隆起，与递送装置接通。",
        en: "The sheath shortens and widens, driving the rigid tail tube into the periplasm. T4 studies show the cytoplasmic membrane bulging outward to meet the delivery apparatus.",
      },
    },
    {
      at: 0.6,
      title: { zh: "DNA 进入细胞", en: "DNA enters the cell" },
      description: {
        zh: "DNA 从头部经尾管与接通的膜通道进入细菌细胞质；衣壳留在细胞外。动画只展示递送路径，不模拟全部驱动力。",
        en: "DNA passes from the head through the tail and connected membrane channel into the cytoplasm. The capsid remains outside. The animation shows the route, not all forces driving transfer.",
      },
    },
  ],
  sources: [
    {
      title:
        "Hu et al. (2015) · T4 infection initiation, cryo-electron tomography",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4568249/",
    },
    {
      title: "OpenStax Microbiology · The Viral Life Cycle",
      url: "https://openstax.org/books/microbiology/pages/6-2-the-viral-life-cycle",
    },
  ],
  create,
};
