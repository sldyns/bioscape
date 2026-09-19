import { sporulationTopology } from "./sporulationTopology.js";
import { rodCutaway, sporeLayers } from "./envelopeDetail.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";

export default {
  id: "bacterialSporulation",
  title: b("枯草芽孢杆菌内生孢子形成", "B. subtilis endospore formation"),
  duration: 38,
  intro: b(
    "营养限制下，枯草芽孢杆菌可把一个细胞转变为一枚耐受性内生孢子。剖面突出不对称隔膜、母细胞膜包裹和孢子分层。母细胞最终裂解，因此这不是增加个体数的繁殖；并非所有细菌都能形成内生孢子。",
    "Under nutrient limitation, Bacillus subtilis can convert one cell into one resistant endospore. The cutaway highlights asymmetric septation, engulfment and layered construction. The mother cell eventually lyses: this is not reproduction that increases cell number, and many bacteria cannot form endospores.",
  ),
  controls: [
    {
      id: "engulfment",
      label: b("膜包裹", "Membrane engulfment"),
      default: "normal",
      options: [
        { value: "normal", label: b("正常推进", "Normal") },
        { value: "blocked", label: b("包裹受阻", "Blocked") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("营养限制与发育启动", "Nutrient limitation and commitment"),
      description: b(
        "从已复制的两份染色体开始，染色体沿长轴重排；其中一份连续通过隔膜上的 DNA 转运孔进入前孢子。",
        "Begin with two replicated chromosomes reorganizing along the long axis. One continuous copy is partitioned through septal DNA-translocation pores into the forespore.",
      ),
    },
    {
      at: 0.15,
      title: b("不对称隔膜", "Asymmetric septum"),
      description: b(
        "靠近一端形成隔膜，划出较小的前孢子和较大的母细胞。染色体随后完成进入前孢子的分配。",
        "A polar septum partitions a small forespore from a larger mother cell. Chromosome partitioning into the forespore is then completed.",
      ),
    },
    {
      at: 0.32,
      title: b(
        "母细胞膜包裹前孢子",
        "Mother-cell membrane engulfs the forespore",
      ),
      description: b(
        "隔膜重塑，母细胞膜沿前孢子表面推进，末端膜颈闭合并裂断。包裹完成后，前孢子被内外两层膜包围；受阻分支停在包裹阶段。",
        "Septal remodeling allows mother-cell membrane to advance around the forespore; the final neck closes and undergoes fission. Completed engulfment leaves two membranes around it; the blocked branch arrests during engulfment.",
      ),
    },
    {
      at: 0.56,
      title: b("皮层与蛋白外壳", "Cortex and protein coat"),
      description: b(
        "两层膜之间形成特殊肽聚糖皮层，外侧装配蛋白质孢子衣。外壳装配与包裹部分重叠，动画为便于辨认依次突出。",
        "A specialized peptidoglycan cortex develops between the membranes, with a protein coat outside. Coat assembly overlaps engulfment; the animation emphasizes the layers sequentially for clarity.",
      ),
    },
    {
      at: 0.73,
      title: b("孢子核心成熟", "Spore-core maturation"),
      description: b(
        "核心脱水并形成保护性状态，DNA 获得保护。显示的嵌套结构从内到外为核心、内膜、皮层、外膜与孢子衣。",
        "Core dehydration and protective changes safeguard DNA. Nested structures show core, inner membrane, cortex, outer membrane and coat from inside outward.",
      ),
    },
    {
      at: 0.9,
      title: b("释放一枚休眠孢子", "Release one dormant spore"),
      description: b(
        "母细胞裂解释放一枚成熟孢子。孢子可在适宜条件下萌发恢复生长，本动画不展示萌发，也不把形成孢子画成繁殖。",
        "Mother-cell lysis releases one mature spore. Suitable conditions can later trigger germination and growth; germination is outside this animation.",
      ),
    },
  ],
  sources: [
    {
      title:
        "FisB mediates membrane fission during sporulation in Bacillus subtilis",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3576517/",
    },
    {
      title: "Spore formation in Bacillus subtilis",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4078662/",
    },
    {
      title:
        "The molecular architecture of engulfment during Bacillus subtilis sporulation",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6684271/",
    },
    {
      title:
        "The Bacillus subtilis endospore: assembly and functions of the multilayered coat",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9910062/",
    },
  ],
  create({ rootId = "bacterium" } = {}) {
    const k = sceneKit(),
      { group } = k;
    const envelope = k.material("#8eaaa1", {
        transparent: true,
        opacity: 0.17,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      membrane = k.material("#739d98"),
      outer = k.material("#587e80"),
      cortex = k.material("#cbb47a"),
      coat = k.material("#a38ea7"),
      coremat = k.material("#a7babe", {
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
      }),
      dnaMat = k.material("#826d95");
    const mother = new THREE.Group();
    group.add(mother);
    const body = k.mesh(
      new THREE.CapsuleGeometry(1.12, 4.1, 12, 48),
      envelope,
      [0, 0, 0],
      mother,
    );
    body.rotation.z = Math.PI / 2;
    body.visible = false;
    const motherDetail = rodCutaway(mother, 4.1, 1.12);
    const edgePoints = [];
    for (let i = 0; i <= 96; i++) {
      const a = (i * Math.PI * 2) / 96;
      edgePoints.push([
        2.05 * Math.sign(Math.cos(a)) + 1.12 * Math.cos(a),
        1.12 * Math.sin(a),
        0,
      ]);
    }
    k.tube(edgePoints, 0.045, membrane, mother, 128);
    const spore = new THREE.Group();
    group.add(spore);
    spore.position.set(-1.85, 0, 0);
    spore.scale.x = 1.12;
    const layeredDetail = sporeLayers(spore);
    const core = k.ball([0, 0, 0], [0.68, 0.68, 0.57], coremat, spore);
    const inner = k.ring([0, 0, 0.03], 0.72, 0.05, membrane, spore);
    inner.scale.set(1.06, 1, 1);
    const cortexShell = k.mesh(
      new THREE.SphereGeometry(1, 40, 24, Math.PI, Math.PI),
      cortex,
      [0, 0, -0.01],
      spore,
    );
    cortexShell.scale.set(0.85, 0.81, 0.69);
    const cortexRim = k.ring([0, 0, 0.05], 0.79, 0.065, cortex, spore);
    cortexRim.scale.x = 1.06;
    const outerShell = k.mesh(
      new THREE.SphereGeometry(1, 40, 24, Math.PI, Math.PI),
      outer,
      [0, 0, -0.02],
      spore,
    );
    outerShell.scale.set(0.91, 0.87, 0.73);
    const coatShell = k.mesh(
      new THREE.SphereGeometry(1, 40, 24, Math.PI, Math.PI),
      coat,
      [0, 0, -0.03],
      spore,
    );
    coatShell.scale.set(1.03, 0.99, 0.82);
    const coatRim = k.ring([0, 0, 0.05], 0.96, 0.09, coat, spore);
    coatRim.scale.x = 1.04;
    const topology = sporulationTopology(group);
    const debris = [];
    for (let i = 0; i < 14; i++) {
      const a = (i * Math.PI * 2) / 14;
      const m = k.segment(
        [3 * Math.cos(a), 1.15 * Math.sin(a), -0.1],
        [3 * Math.cos(a + 0.11), 1.15 * Math.sin(a + 0.11), -0.1],
        0.055,
        membrane,
      );
      m.userData.original = m.position.toArray();
      debris.push(m);
    }
    const labels = [
      k.label([0.6, -1.65, 0], "母细胞", "Mother cell", 2),
      k.label([-1.95, -1.65, 0], "前孢子", "Forespore", 3),
      k.label([-1.3, 1.55, 0], "极性隔膜", "Polar septum", 3),
      k.label(
        [-1.95, 1.55, 0],
        "母细胞膜包裹",
        "Mother-membrane engulfment",
        3,
      ),
      k.label([-1.85, 1.65, 0], "蛋白质孢子衣", "Protein coat", 2),
      k.label(
        [-0.65, 0.3, 0.1],
        "膜间肽聚糖皮层",
        "Intermembrane peptidoglycan cortex",
        2,
      ),
      k.label([-1.95, -0.1, 0.4], "受保护的核心 DNA", "Protected core DNA", 2),
      k.label(
        [0, 1.7, 0],
        "一枚成熟孢子 · 非繁殖",
        "One mature spore · not reproduction",
        3,
      ),
      k.label(
        [0, 1.75, 0],
        "包裹受阻 · 未成熟",
        "Engulfment blocked · immature",
        3,
      ),
    ];
    function update(progress, parameters = {}) {
      const raw = clamp(progress),
        blocked = parameters.engulfment === "blocked",
        p = blocked ? Math.min(raw, 0.43) : raw,
        partition = ease(p, 0.1, 0.31),
        wrap = ease(p, 0.32, 0.56),
        layer = ease(p, 0.56, 0.73),
        mature = ease(p, 0.73, 0.88),
        release = ease(p, 0.89, 0.99);
      mother.visible = p < 0.93;
      spore.position.x = -1.85 + 1.45 * release;
      spore.visible = p >= 0.56;
      topology.update(p, partition, wrap, release, mature);
      core.scale.set(
        0.68 - 0.1 * mature,
        0.68 - 0.1 * mature,
        0.57 - 0.07 * mature,
      );
      layeredDetail.update(p, 0, layer);
      inner.visible = false;
      cortexShell.visible = p > 0.57;
      cortexRim.visible = p > 0.57;
      outerShell.visible = false;
      coatShell.visible = p > 0.63;
      coatRim.visible = p > 0.63;
      cortexShell.scale.set(
        0.74 + 0.11 * layer,
        0.7 + 0.11 * layer,
        0.58 + 0.11 * layer,
      );
      cortexRim.scale.set(1.06 * (0.9 + 0.1 * layer), 0.9 + 0.1 * layer, 1);
      coatShell.scale.set(
        1.03 * (0.88 + 0.12 * layer),
        0.99 * (0.88 + 0.12 * layer),
        0.82 * (0.88 + 0.12 * layer),
      );
      coatRim.scale.set(1.04 * (0.88 + 0.12 * layer), 0.88 + 0.12 * layer, 1);
      debris.forEach((m, i) => {
        m.visible = p > 0.91;
        const a = m.userData.original;
        m.position.set(
          a[0] * (1 + 0.15 * release),
          a[1] * (1 + 0.5 * release),
          a[2] - 0.3 * release,
        );
        m.scale.x = m.scale.z = 0.055 * (1 - 0.75 * release);
      });
      labels[0].active = p < 0.93;
      labels[1].active = p > 0.16 && p < 0.57;
      labels[2].active = p > 0.13 && p < 0.33;
      labels[3].active = p >= 0.33 && p < 0.57 && !blocked;
      labels[4].active = p > 0.64 && p < 0.88;
      labels[5].active = p > 0.6 && p < 0.88;
      labels[6].active = p > 0.74 && p < 0.9;
      labels[7].active = p > 0.94;
      labels[8].active = blocked && raw > 0.43;
      group.userData = {
        rootId,
        organism: "Bacillus subtilis",
        mechanism: "endospore-development",
        engulfmentBlocked: blocked,
        asymmetricSeptum: partition > 0,
        engulfmentComplete: wrap === 1,
        foresporeMembraneCount: wrap === 1 ? 2 : 1,
        cortexBetweenMembranes: layer > 0,
        matureSpore: mature === 1,
        motherCellLysed: p > 0.93,
        sporesReleased: p > 0.94 ? 1 : 0,
        reproduction: false,
      };
    }
    update(0);
    return {
      group,
      materials: [
        ...motherDetail.materials,
        ...layeredDetail.materials,
        ...topology.materials,
      ],
      update,
      labels,
      camera: { position: [0, 1.8, 10.6], target: [-0.3, 0, 0] },
    };
  },
};
