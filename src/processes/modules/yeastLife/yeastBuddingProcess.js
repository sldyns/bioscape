import {
  layeredCutaway,
  nuclearAnatomy,
  surfacePores,
  cytoplasmicAnatomy,
  materialInventory,
} from "./anatomy.js";
import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";

// Open-neck surfaces meet at x=.15. Their terminal disks close only at cytokinesis.
function surface(kit, material, rings = 40) {
  const sides = 48,
    geometry = new THREE.BufferGeometry();
  const positions = new Float32Array((rings + 1) * (sides + 1) * 3),
    indices = [];
  for (let i = 0; i < rings; i++)
    for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j,
        b = a + sides + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  const mesh = kit.mesh(geometry, material);
  return {
    mesh,
    shape(profile) {
      for (let i = 0; i <= rings; i++) {
        const [x, r] = profile(i / rings);
        for (let j = 0; j <= sides; j++) {
          const a = (2 * Math.PI * j) / sides,
            n = (i * (sides + 1) + j) * 3;
          positions[n] = x;
          positions[n + 1] = r * Math.cos(a);
          positions[n + 2] = r * Math.sin(a);
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
  const wall = k.material("#b9ad8d", {
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const envelope = k.material("#8c95bd", {
    transparent: true,
    opacity: 0.36,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const purple = k.material("#777da3"),
    teal = k.material("#57988e"),
    gold = k.material("#c99c61"),
    pink = k.material("#bb8b88");
  const mother = surface(k, wall),
    bud = surface(k, wall);
  const nucleus = surface(k, envelope);
  mother.mesh.name = "budding-mother-envelope";
  bud.mesh.name = "budding-daughter-envelope";
  nucleus.mesh.name = "budding-continuous-nuclear-envelope";
  const nMother = k.ball([-1.1, 0, 0], [0.58, 0.55, 0.55], envelope),
    nBud = k.ball([1.15, 0, 0], [0.5, 0.49, 0.49], envelope);
  const motherLayers = layeredCutaway(k, mother.mesh),
    budLayers = layeredCutaway(k, bud.mesh);
  const nuclearLayers = layeredCutaway(k, nucleus.mesh, 40, 48, true),
    pores = surfacePores(k, nucleus.mesh);
  nuclearAnatomy(k, nMother);
  nuclearAnatomy(k, nBud);
  const motherInterior = cytoplasmicAnatomy(k, group, 0.94);
  motherInterior.position.x = -1.22;
  const budInterior = cytoplasmicAnatomy(k, group, 0.63);
  const chromatin = new THREE.Group();
  group.add(chromatin);
  for (let i = 0; i < 3; i++)
    k.tube(
      Array.from({ length: 48 }, (_, j) => {
        const t = j / 47;
        return [
          -0.73 + 1.46 * t,
          0.17 * Math.sin(t * Math.PI * 6 + i),
          0.12 + 0.055 * Math.cos(t * Math.PI * 8 + i),
        ];
      }),
      0.016,
      purple,
      chromatin,
      72,
    );
  const collarA = k.ring([0.1, 0, 0], 0.44, 0.045, teal),
    collarB = k.ring([0.2, 0, 0], 0.44, 0.045, teal);
  collarA.rotation.y = collarB.rotation.y = Math.PI / 2;
  const contractile = k.ring([0.15, 0, 0], 0.41, 0.04, pink);
  contractile.rotation.y = Math.PI / 2;
  const diskGeometry = new THREE.RingGeometry(0.43, 0.43, 48, 1);
  const septumMat = k.material("#d1ba90", { side: THREE.DoubleSide });
  const septumA = k.mesh(diskGeometry, septumMat, [0.15, 0, 0]),
    septumB = k.mesh(diskGeometry, septumMat, [0.15, 0, 0]);
  septumA.rotation.y = septumB.rotation.y = Math.PI / 2;
  septumA.name = "budding-centripetal-septum-mother";
  septumB.name = "budding-centripetal-septum-daughter";
  const spindle = k.segment([-1.4, 0, 0.04], [1.3, 0, 0.04], 0.025, gold);
  const poles = [
    k.ball([-1.4, 0, 0.04], 0.08, gold),
    k.ball([1.3, 0, 0.04], 0.08, gold),
  ];
  poles.forEach((pole, i) => {
    pole.name = `budding-spb-${i}`;
    pole.scale.set(0.028, 0.08, 0.08);
  });
  spindle.name = "budding-intranuclear-spindle";
  const dna = Array.from({ length: 8 }, (_, i) =>
    k.ball([0, 0, 0], [0.075, 0.13, 0.065], purple),
  );
  const secretion = Array.from({ length: 8 }, () =>
    k.ball([0, 0, 0], 0.065, teal),
  );
  const cables = [-1, 1].map((s) =>
    k.tube(
      [
        [-2, s * 0.6, -0.12],
        [-0.9, s * 0.65, -0.12],
        [0.05, s * 0.2, -0.12],
        [1.4, s * 0.45, -0.12],
      ],
      0.016,
      teal,
    ),
  );
  const scar = k.ring([-1.95, -1.04, 0.5], 0.21, 0.045, gold);
  scar.rotation.x = 0.9;
  const labels = [
    k.label([-1.5, -1.85, 0], "母细胞", "Mother cell", 10),
    k.label([1.3, 1.5, 0], "芽体：极性生长", "Bud: polarized growth", 10),
    k.label([0.15, -0.8, 0.6], "芽颈 / 隔膜", "Bud neck / septum", 10),
    k.label([-1.1, 0.8, 0.6], "完整核膜", "Intact nuclear envelope", 9),
    k.label(
      [-1.5, 1.75, 0],
      "酿酒酵母 · 营养生殖",
      "S. cerevisiae · vegetative division",
      8,
    ),
  ];
  function update(raw) {
    const p = clamp(raw),
      growth = ease(p, 0.05, 0.4),
      separation = ease(p, 0.88, 1),
      shift = 0.78 * separation;
    const closing = ease(p, 0.76, 0.85);
    const neck = 0.025 + 0.405 * Math.sqrt(growth),
      budLength = 0.025 + 2.25 * growth;
    const motherEndAngle = Math.asin(neck / 1.48);
    const motherCenter = 0.15 - 1.5 * Math.cos(motherEndAngle);
    mother.shape((t) => {
      // Keep the outer neck in place; grow a membrane-lined septal annulus inward.
      if (t > 0.9) return [0.15, neck * (1 - (closing * (t - 0.9)) / 0.1)];
      const angle = Math.PI + ((motherEndAngle - Math.PI) * t) / 0.9;
      return [motherCenter + 1.5 * Math.cos(angle), 1.48 * Math.sin(angle)];
    });
    const budRadius = Math.max(neck * 1.04, 0.04 + 1.03 * growth);
    const budStartAngle = Math.asin(neck / budRadius);
    const budAxis = budLength / (1 + Math.cos(budStartAngle));
    bud.shape((t) => {
      if (t < 0.1) return [0.15 + shift, neck * (1 - closing * (1 - t / 0.1))];
      const angle =
        budStartAngle + ((Math.PI - budStartAngle) * (t - 0.1)) / 0.9;
      return [
        0.15 + shift + budAxis * (Math.cos(budStartAngle) - Math.cos(angle)),
        budRadius * Math.sin(angle),
      ];
    });
    collarA.scale.setScalar(neck / 0.44);
    collarB.scale.setScalar(neck / 0.44);
    collarB.position.x = 0.2 + shift;
    collarA.visible = collarB.visible = p > 0.025;
    contractile.visible = p > 0.64 && p < 0.87;
    contractile.scale.setScalar(Math.max(0.015, 1 - closing));
    septumA.visible = septumB.visible = p > 0.76;
    const septumPositions = diskGeometry.attributes.position;
    for (let i = 0; i < septumPositions.count; i++) {
      const angle = ((i % 49) / 48) * Math.PI * 2;
      const radius = i < 49 ? neck * (1 - closing) : neck;
      septumPositions.setXYZ(
        i,
        radius * Math.cos(angle),
        radius * Math.sin(angle),
        0,
      );
    }
    septumPositions.needsUpdate = true;
    diskGeometry.computeBoundingSphere();
    diskGeometry.computeBoundingBox();
    septumB.position.x = 0.15 + shift;
    const move = ease(p, 0.34, 0.5),
      segregation = ease(p, 0.48, 0.68),
      split = ease(p, 0.68, 0.76);
    const left = -1.55 + 0.36 * move,
      right = -0.65 + 0.35 * move + 1.66 * segregation;
    nucleus.mesh.visible = p < 0.75;
    nucleus.shape((t) => {
      const x =
        (left + right) / 2 -
        ((right - left + 0.72) / 2) * Math.cos(Math.PI * t);
      const base = 0.53 * Math.sin(Math.PI * t);
      const neckDip =
        1 - 0.74 * segregation * Math.exp(-Math.pow((x - 0.15) / 0.33, 2));
      return [
        x,
        Math.max(
          0,
          base *
            neckDip *
            (1 - 0.97 * split * Math.exp(-Math.pow((x - 0.15) / 0.25, 2))),
        ),
      ];
    });
    nMother.visible = nBud.visible = p >= 0.75;
    nBud.position.x = 1.07 + shift;
    spindle.visible = p > 0.34 && p < 0.73;
    spindle.position.set((left + right) / 2, 0, 0);
    spindle.scale.set(0.025, Math.max(0.01, right - left + 0.72), 0.025);
    for (let i = 0; i < 2; i++) {
      poles[i].visible = spindle.visible;
      // The polar vertices belong to the actual deforming envelope.
      poles[i].position.set(i ? right + 0.36 : left - 0.36, 0, 0);
    }
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? 0 : 1,
        j = i % 4;
      dna[i].visible = i < 4 || p > 0.24;
      dna[i].position.set(
        p >= 0.75
          ? (side ? 1.07 + shift : -1.1) + (j - 1.5) * 0.09
          : (side ? right : left) + (j - 1.5) * 0.075,
        0.18 * Math.sin(j * 1.7),
        0.17,
      );
    }
    for (let i = 0; i < 8; i++) {
      const u = (p * 3 + i / 8) % 1;
      secretion[i].visible = p > 0.07 && p < 0.68;
      secretion[i].position.set(
        -1.9 + (2.05 + budLength * 0.75) * u,
        0.35 * Math.sin(u * Math.PI),
        0.36,
      );
    }
    cables.forEach((c) => {
      c.visible = p > 0.12 && p < 0.65;
      c.scale.x = 0.55 + 0.45 * growth;
    });
    motherLayers.update();
    budLayers.update();
    nuclearLayers.update();
    pores.update();
    budInterior.visible = growth > 0.25;
    budInterior.position.set(0.15 + shift + budLength * 0.56, 0, -0.12);
    budInterior.scale.setScalar(0.63 * growth);
    chromatin.visible = p < 0.75;
    chromatin.position.x = (left + right) / 2;
    chromatin.scale.x = (right - left + 0.35) / 1.46;
    labels[1].active = p > 0.08;
    labels[1].position[0] = 0.9 + shift;
    labels[3].active = p < 0.78;
    group.userData = {
      species: "Saccharomyces cerevisiae",
      process: "budding",
      progress: p,
      budGrowth: growth,
      neckConnected: closing < 1,
      nuclearEnvelopeIntact: true,
      closedMitosis: true,
      genomeSegregated: p >= 0.68,
      septumComplete: p >= 0.85,
      daughterSeparated: p >= 0.99,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    materials: materialInventory(group, [
      wall,
      envelope,
      purple,
      teal,
      gold,
      pink,
    ]),
    camera: { position: [0, 1.8, 10.5], target: [-0.1, 0, 0] },
  };
}
export default {
  id: "yeastBudding",
  title: B("酵母出芽", "Yeast budding"),
  duration: 32,
  intro: B(
    "酿酒酵母的营养生殖：芽体始终经芽颈与母细胞相连，直到胞质分裂后分离。细胞壁、质膜和核膜以分层切面呈现，核孔、染色质、液泡与线粒体用于空间定位；染色体数量、形状与时间经过简化。",
    "Vegetative division in S. cerevisiae. The bud stays connected to its mother through the neck until cytokinesis and separation. Layered cutaways expose cell walls, plasma membrane and nuclear envelope, with pores, chromatin, vacuoles and mitochondria providing spatial context; chromosome number, shapes and timing are schematic.",
  ),
  stages: [
    {
      at: 0,
      title: B("建立出芽位点", "Establish a bud site"),
      description: B(
        "母细胞在皮层形成极性位点，芽颈附近组装隔膜蛋白环。细胞壁局部生长将产生与母细胞相通的芽体。",
        "A cortical polarity site forms, with septins assembling around the future neck. Local wall growth produces a bud continuous with the mother cytoplasm.",
      ),
    },
    {
      at: 0.14,
      title: B("芽体极性生长", "Polarized bud growth"),
      description: B(
        "沿肌动蛋白索运输的分泌囊泡向芽体供给膜和细胞壁材料；芽体逐渐增大，芽颈保持连接。",
        "Secretory vesicles travel along actin cables to supply membrane and wall material to the expanding bud; its neck remains connected.",
      ),
    },
    {
      at: 0.34,
      title: B("复制后的细胞核定位", "Position the replicated nucleus"),
      description: B(
        "DNA 已复制，细胞核移向芽颈。嵌于核膜的纺锤体极体组织核内纺锤体，并使其沿母芽轴排列。",
        "After DNA replication, the nucleus moves toward the neck. Spindle pole bodies embedded in the envelope organize an intranuclear spindle aligned with the mother–bud axis.",
      ),
    },
    {
      at: 0.5,
      title: B("闭合式有丝分裂", "Closed mitosis"),
      description: B(
        "核内纺锤体伸长，两个染色体组移向母细胞和芽体。核膜不整体解体，而是伸长并穿过芽颈。",
        "The intranuclear spindle elongates and segregates chromosome sets toward mother and bud. The nuclear envelope stretches through the neck without global breakdown.",
      ),
    },
    {
      at: 0.73,
      title: B("收缩与隔膜形成", "Constriction and septation"),
      description: B(
        "细胞核分开后，芽颈的肌动蛋白–肌球蛋白环收缩，质膜与隔膜从芽颈周缘向中心推进，直到中央通道闭合并分隔两侧胞质。",
        "After nuclear partition, the actomyosin ring constricts. Plasma membrane and septum advance inward from the neck circumference until the central opening closes and partitions the two cytoplasms.",
      ),
    },
    {
      at: 0.89,
      title: B("母女细胞分离", "Mother–daughter separation"),
      description: B(
        "隔膜局部降解使女细胞分离，母细胞留下芽痕。女细胞通常较小；这不是两个等大的细胞从一开始彼此独立。",
        "Local septum digestion permits separation and leaves a bud scar on the mother. The daughter is usually smaller and arose as a connected outgrowth.",
      ),
    },
  ],
  legend: [
    { color: "#b9ad8d", text: B("细胞壁 / 膜轮廓", "Wall / membrane outline") },
    { color: "#8c95bd", text: B("保留的核膜", "Persistent nuclear envelope") },
    {
      color: "#57988e",
      text: B("极性运输 / 芽颈隔膜蛋白", "Polarized traffic / neck septins"),
    },
    { color: "#c99c61", text: B("核内纺锤体", "Intranuclear spindle") },
  ],
  sources: [
    {
      title:
        "Timely Endocytosis of Cytokinetic Enzymes Prevents Premature Spindle Breakage during Mitotic Exit",
      url: "https://journals.plos.org/plosgenetics/article?id=10.1371/journal.pgen.1006195",
    },
    {
      title:
        "Nuclear envelope morphology constrains diffusion and promotes asymmetric protein segregation in closed mitosis",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3384416/",
    },
    {
      title: "Mitotic Exit and Separation of Mother and Daughter Cells",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3512134/",
    },
  ],
  create,
};
