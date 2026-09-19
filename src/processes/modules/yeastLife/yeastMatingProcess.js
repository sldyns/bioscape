import {
  layeredCutaway,
  nuclearAnatomy,
  cytoplasmicAnatomy,
  materialInventory,
  surfacePores,
} from "./anatomy.js";
import { longitudinalEnvelope, placeSegment } from "./topology.js";
import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";

// Each half is an open polar surface after fusion; both rims meet at x=0.
function matingSurface(k, material, side) {
  const rings = 40,
    sides = 48,
    geometry = new THREE.BufferGeometry();
  const points = new Float32Array((rings + 1) * (sides + 1) * 3),
    indices = [];
  for (let r = 0; r < rings; r++)
    for (let j = 0; j < sides; j++) {
      const a = r * (sides + 1) + j,
        b = a + sides + 1;
      if (side === 1) indices.push(a, b, a + 1, b, b + 1, a + 1);
      else indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
  geometry.setIndex(indices);
  const mesh = k.mesh(geometry, material);
  return {
    mesh,
    update(projection, opening) {
      for (let r = 0; r <= rings; r++) {
        const theta = (Math.PI * r) / rings,
          tip = Math.exp((-theta * theta) / 0.3);
        const x =
          side * (1.68 - 1.16 * Math.cos(theta) - 0.52 * projection * tip);
        const radius = 1.16 * Math.sin(theta) + 0.84 * opening * tip;
        for (let j = 0; j <= sides; j++) {
          const angle = (2 * Math.PI * j) / sides,
            n = (r * (sides + 1) + j) * 3;
          points[n] = x;
          points[n + 1] = radius * Math.cos(angle);
          points[n + 2] = radius * Math.sin(angle);
        }
      }
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      geometry.computeBoundingSphere();
    },
  };
}
function create() {
  const k = sceneKit(),
    { group } = k;
  const leftMat = k.material("#83aaa0", {
    transparent: true,
    opacity: 0.27,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const rightMat = k.material("#bd9fa8", {
    transparent: true,
    opacity: 0.27,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const left = matingSurface(k, leftMat, -1),
    right = matingSurface(k, rightMat, 1);
  left.mesh.name = "mating-left-cell-envelope";
  right.mesh.name = "mating-right-cell-envelope";
  const teal = k.material("#5a9588"),
    rose = k.material("#b68190"),
    gold = k.material("#c4a467"),
    purple = k.material("#8a8fae");
  const envelopeMat = k.material("#9298ba", {
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const nuclei = [
    k.ball([-1.68, 0, 0], [0.49, 0.5, 0.5], envelopeMat),
    k.ball([1.68, 0, 0], [0.49, 0.5, 0.5], envelopeMat),
  ];
  const fused = longitudinalEnvelope(
    k,
    envelopeMat,
    "mating-fused-nuclear-envelope",
  );
  const wallLayers = [
    layeredCutaway(k, left.mesh),
    layeredCutaway(k, right.mesh),
  ];
  nuclei.forEach((n, i) => {
    n.name = `mating-parent-nuclear-envelope-${i}`;
    nuclearAnatomy(k, n, false);
  });
  const fusedLayers = layeredCutaway(k, fused.mesh, 40, 48, true);
  const fusedPores = surfacePores(k, fused.mesh);
  // The two chromatin populations survive fusion; no third genome appears.
  const inheritedChromatin = [-1, 1].map((sign, side) => {
    const g = new THREE.Group();
    g.name = `mating-inherited-chromatin-${side}`;
    group.add(g);
    for (let strand = 0; strand < 3; strand++) {
      const points = Array.from({ length: 48 }, (_, j) => {
        const a = (j / 47) * Math.PI * 2;
        return [
          0.22 * Math.cos(a + strand),
          0.18 * Math.sin(2 * a + strand),
          0.1 + 0.055 * Math.sin(3 * a + strand),
        ];
      });
      k.tube(points, 0.012, side ? rose : teal, g);
      for (let j = 0; j < points.length; j += 8)
        k.ball(points[j], 0.029, purple, g);
    }
    return g;
  });
  const interiors = [
    cytoplasmicAnatomy(k, group, 0.77),
    cytoplasmicAnatomy(k, group, 0.77),
  ];
  interiors[0].position.x = -1.65;
  interiors[1].position.x = 1.65;
  const junctionFragments = Array.from({ length: 20 }, () =>
    k.ball([0, 0, 0], [0.052, 0.036, 0.034], k.material("#cab68c")),
  );
  const fusionLipids = new THREE.InstancedMesh(
    k.sphere,
    k.material("#84aa9d"),
    64,
  );
  fusionLipids.frustumCulled = false;
  group.add(fusionLipids);
  const lipidTemp = new THREE.Object3D();
  const genome = Array.from({ length: 8 }, (_, i) =>
    k.ball([0, 0, 0], [0.065, 0.19, 0.055], i < 4 ? teal : rose),
  );
  const microtubules = [
    k.segment([-1.5, 0, 0.12], [0, 0, 0.12], 0.025, gold),
    k.segment([0, 0, 0.12], [1.5, 0, 0.12], 0.025, gold),
  ];
  const poles = [
    k.ball([0, 0, 0.12], 0.075, gold),
    k.ball([0, 0, 0.12], 0.075, gold),
  ];
  microtubules.forEach((m, i) => {
    m.name = `mating-cytoplasmic-microtubule-${i}`;
  });
  poles.forEach((m, i) => {
    m.name = `mating-spb-${i}`;
  });
  const receptors = Array.from({ length: 6 }, (_, i) => {
    const ring = k.ring([0, 0, 0], 0.085, 0.025, i < 3 ? teal : rose);
    ring.rotation.y = Math.PI / 2;
    return ring;
  });
  const pheromones = Array.from({ length: 14 }, (_, i) =>
    k.ball([0, 0, 0], 0.055, i < 7 ? teal : rose),
  );
  const contacts = [
    k.ring([0, 0, 0], 0.84, 0.025, teal),
    k.ring([0, 0, 0], 0.84, 0.025, rose),
  ];
  contacts.forEach((c) => {
    c.rotation.y = Math.PI / 2;
  });
  const vesicles = Array.from({ length: 8 }, (_, i) =>
    k.ball([0, 0, 0], 0.06, i < 4 ? teal : rose),
  );
  const labels = [
    k.label([-1.65, -1.6, 0], "a 型 · 单倍体 n", "Type a · haploid n", 10),
    k.label([1.65, -1.6, 0], "α 型 · 单倍体 n", "Type α · haploid n", 10),
    k.label(
      [0, 1.55, 0],
      "互识信息素 → 朝向伴侣极化",
      "Partner pheromones → polarized growth",
      10,
    ),
    k.label(
      [0, -0.95, 0.45],
      "局部细胞壁重塑 / 膜融合",
      "Local wall remodeling / membrane fusion",
      9,
    ),
    k.label(
      [0, 0.9, 0.6],
      "核靠近并融合",
      "Nuclear congression and fusion",
      10,
    ),
    k.label(
      [0, -1.6, 0],
      "a/α 合子 · 二倍体 2n",
      "a/α zygote · diploid 2n",
      10,
    ),
    k.label(
      [0, 1.8, 0],
      "同型 a/a：本模型不发生配对融合",
      "Same-type a/a: no mating fusion here",
      10,
    ),
  ];
  function update(raw, parameters = {}) {
    const p = clamp(raw),
      compatible = parameters.partner !== "same",
      q = compatible ? p : 0;
    const projection = ease(q, 0.15, 0.47),
      opening = ease(q, 0.49, 0.62),
      congression = ease(q, 0.63, 0.77),
      fusion = ease(q, 0.77, 0.9);
    left.update(projection, opening);
    right.update(projection, opening);
    rightMat.color.set(compatible ? "#bd9fa8" : "#83aaa0");
    for (let side = 0; side < 2; side++) {
      const sign = side === 0 ? -1 : 1,
        nx = sign * (1.68 - 1.19 * congression - 0.34 * fusion);
      nuclei[side].position.x = nx;
      nuclei[side].visible = q < 0.77;
      nuclei[side].scale.set(0.49, 0.5, 0.5);
      inheritedChromatin[side].position.x = nx;
      // A dorsal SPB site leaves microtubules on the cytoplasmic NE face.
      const pole = new THREE.Vector3(nx - sign * 0.294, 0, 0.4);
      const tipX =
        opening >= 1 ? -sign * 0.13 : sign * (0.86 - 0.2 * projection);
      const mtTip = new THREE.Vector3(tipX, 0, 0.53);
      microtubules[side].visible = compatible && q > 0.28 && q < 0.77;
      placeSegment(microtubules[side], pole, mtTip);
      poles[side].visible = microtubules[side].visible;
      poles[side].position.copy(pole);
      contacts[side].visible = compatible && q > 0.43 && q < 0.66;
      contacts[side].position.x = sign * (0.52 - 0.52 * projection);
      contacts[side].scale.setScalar(0.3 + 0.7 * opening);
      for (let j = 0; j < 4; j++) {
        const i = side * 4 + j,
          gx = nx;
        genome[i].position.set(
          gx + ((j % 2) - 0.5) * 0.16,
          (Math.floor(j / 2) - 0.5) * 0.36,
          0.19,
        );
        genome[i].material = side === 0 || !compatible ? teal : rose;
        const v = vesicles[i],
          t = (q * 2 + j / 4) % 1;
        v.visible = compatible && q > 0.17 && q < 0.57;
        v.position.set(
          sign * (2.05 - (1.5 + 0.52 * projection) * t),
          0.3 * Math.sin(t * Math.PI),
          0.4,
        );
      }
      for (let j = 0; j < 3; j++) {
        const r = receptors[side * 3 + j];
        r.visible = q < 0.64;
        r.position.set(sign * (0.6 - 0.48 * projection), (j - 1) * 0.19, 0.18);
        r.material = side === 0 || !compatible ? teal : rose;
      }
    }
    fused.mesh.visible = q >= 0.77;
    const center = 0.49 - 0.34 * fusion;
    fused.shape((t) => {
      const x = -(center + 0.49) * Math.cos(Math.PI * t);
      const r =
        0.5 *
        Math.sqrt(Math.max(0, 1 - Math.pow((Math.abs(x) - center) / 0.49, 2)));
      return [x, r];
    });
    fusedLayers.update();
    fusedPores.update();
    for (let i = 0; i < 14; i++) {
      const t = (q * 1.8 + (i % 7) / 7) % 1,
        fromLeft = i < 7;
      pheromones[i].visible = compatible && q < 0.46;
      pheromones[i].position.set(
        (fromLeft ? -1 : 1) * (0.55 - 1.1 * t),
        0.57 + ((i % 3) - 1) * 0.2,
        0.2 + Math.sin(t * Math.PI) * 0.35,
      );
    }
    wallLayers.forEach((l) => l.update());
    junctionFragments.forEach((f, i) => {
      const a = (i / 20) * Math.PI * 2;
      f.visible = compatible && q > 0.43 && q < 0.64;
      f.position.set(
        (i % 2 ? 1 : -1) * (0.06 + 0.2 * opening),
        (0.11 + 0.28 * opening) * Math.cos(a),
        (0.11 + 0.28 * opening) * Math.sin(a),
      );
      f.scale.set(
        0.052 * (1 - opening),
        0.036 * (1 - opening),
        0.034 * (1 - opening),
      );
    });
    for (let i = 0; i < 64; i++) {
      const a = (i / 32) * Math.PI * 2,
        r = 0.84 * opening * 0.93;
      lipidTemp.position.set(
        i < 32 ? -0.045 : 0.045,
        r * Math.cos(a),
        r * Math.sin(a),
      );
      lipidTemp.scale.setScalar(0.023);
      lipidTemp.updateMatrix();
      fusionLipids.setMatrixAt(i, lipidTemp.matrix);
    }
    fusionLipids.visible = compatible && q > 0.52;
    fusionLipids.instanceMatrix.needsUpdate = true;
    fusionLipids.computeBoundingBox();
    fusionLipids.computeBoundingSphere();
    labels[0].active = labels[1].active = q < 0.77;
    labels[1].text = compatible
      ? B("α 型 · 单倍体 n", "Type α · haploid n")
      : B("a 型 · 单倍体 n", "Type a · haploid n");
    labels[2].active = compatible && q < 0.49;
    labels[3].active = compatible && q >= 0.43 && q < 0.67;
    labels[4].active = compatible && q >= 0.64 && q < 0.9;
    labels[5].active = compatible && q >= 0.9;
    labels[6].active = !compatible;
    group.userData = {
      species: "Saccharomyces cerevisiae",
      process: "mating",
      progress: p,
      partner: compatible ? "a-alpha" : "a-a",
      compatibleMatingTypes: compatible,
      polarizedProjection: projection,
      cellWallOpening: opening,
      plasmogamy: q >= 0.62,
      karyogamy: q >= 0.9,
      ploidy: q >= 0.9 ? "2n" : "n + n",
      nuclei: q > 0.77 ? 1 : 2,
      matingTypeSwitchingModeled: false,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    materials: materialInventory(group, [
      leftMat,
      rightMat,
      teal,
      rose,
      gold,
      purple,
      envelopeMat,
    ]),
    camera: { position: [0, 1.5, 10.5], target: [0, 0, 0] },
  };
}
export default {
  id: "yeastMating",
  title: B("酵母配对与融合", "Yeast mating and fusion"),
  duration: 32,
  intro: B(
    "酿酒酵母 a 与 α 单倍体的相互识别、交配突起、胞质融合及核融合。两种交配型不是雄性与雌性。可切换同型 a/a 对照；本模型不包含交配型转换。分层壁与质膜切面突出局部壁移除和膜融合，核孔、染色质及细胞器仅为空间示意；染色体数量与时间经简化。",
    "Recognition, mating projections, cytoplasmic fusion and nuclear fusion between S. cerevisiae a and α haploids. Mating types are not male and female. Select a same-type a/a control; mating-type switching is outside this model. Layered wall and membrane cutaways expose local wall removal and membrane fusion. Pores, chromatin and organelles provide schematic spatial context; chromosome counts and timing are simplified.",
  ),
  controls: [
    {
      id: "partner",
      label: B("交配型组合", "Mating-type pair"),
      default: "compatible",
      options: [
        { value: "compatible", label: B("互补 a + α", "Compatible a + α") },
        { value: "same", label: B("同型 a + a", "Same type a + a") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: B("互补交配型彼此识别", "Recognize compatible partners"),
      description: B(
        "a 细胞分泌 a 信息素，α 细胞分泌 α 信息素，各自的受体识别对方信号。同型 a/a 对照缺少这组互补信号，不启动此处展示的融合流程。",
        "a cells secrete a-factor and α cells secrete α-factor; each has receptors for the partner signal. The a/a control lacks these complementary signals and does not initiate the fusion sequence shown here.",
      ),
    },
    {
      at: 0.17,
      title: B("定向形成交配突起", "Polarize mating projections"),
      description: B(
        "信息素信号使细胞在 G1 停留并朝向伴侣极化，分泌运输集中到交配突起（shmoo）的尖端；两个细胞此时仍彼此分隔。",
        "Pheromone signaling arrests cells in G1 and polarizes growth toward the partner. Secretory traffic is directed to the tip of each shmoo projection; the two cells remain separate.",
      ),
    },
    {
      at: 0.43,
      title: B("接触与细胞壁局部重塑", "Contact and local wall remodeling"),
      description: B(
        "相向的突起接触并黏附，融合位点的细胞壁局部重塑，使两层质膜能够接近。整个细胞壁不会同时消失。",
        "Opposing projections contact and adhere. Local wall remodeling at the junction permits the two plasma membranes to approach; the entire cell wall does not disappear.",
      ),
    },
    {
      at: 0.55,
      title: B("胞质融合", "Plasmogamy"),
      description: B(
        "质膜融合并扩大连接通道，原来分隔的胞质成为连续空间。此时仍保留两个单倍体细胞核，尚未形成一个二倍体细胞核。",
        "Plasma-membrane fusion widens a connecting channel and makes the two cytoplasms continuous. Two haploid nuclei still remain; a single diploid nucleus has not yet formed.",
      ),
    },
    {
      at: 0.69,
      title: B("核靠近并发生核融合", "Nuclear congression and karyogamy"),
      description: B(
        "与纺锤体极体相关的微管帮助两个细胞核靠近。随后核膜融合，使两个亲本染色体组进入同一个细胞核；这不是减数分裂。",
        "Microtubules associated with spindle pole bodies help bring the nuclei together. Nuclear-envelope fusion then combines parental chromosome sets within one nucleus; this is not meiosis.",
      ),
    },
    {
      at: 0.91,
      title: B("形成二倍体合子", "Form a diploid zygote"),
      description: B(
        "互补配对完成后形成 a/α 二倍体合子，具备两个亲本的染色体组。营养合适时它可通过出芽进行营养生殖；产孢需要另一组营养与细胞状态条件。",
        "Compatible mating produces an a/α diploid zygote containing both parental chromosome sets. It can bud during vegetative growth when nutrients permit; sporulation requires additional nutritional and cell-state conditions.",
      ),
    },
  ],
  legend: [
    { color: "#5a9588", text: B("a 亲本 / a 信息素", "a parent / a-factor") },
    { color: "#b68190", text: B("α 亲本 / α 信息素", "α parent / α-factor") },
    { color: "#9298ba", text: B("细胞核", "Nuclear envelope") },
    {
      color: "#c4a467",
      text: B("核迁移相关微管", "Microtubules for nuclear congression"),
    },
  ],
  sources: [
    {
      title:
        "Nuclear fusion during yeast mating occurs by a three-step pathway",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2080914/",
    },
    {
      title:
        "Sexual conjugation in yeast. Cell surface changes in response to the action of mating hormones",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2110336/",
    },
    {
      title: "Mate and fuse: how yeast cells do it",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3718343/",
    },
    {
      title: "When yeast cells meet, karyogamy!",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3720748/",
    },
  ],
  create,
};
