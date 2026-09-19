import { clamp, ease, bilingual as b } from "../../kit.js";
import {
  membraneScene,
  materialInventory,
  alphaHelix,
  mix,
  seeded,
  wander,
} from "./membraneGeometry.js";

const definition = {
  id: "diffusion",
  title: b("跨膜扩散", "Diffusion across a membrane"),
  intro: b(
    "质膜局部剖面：氧可溶入脂双层；水主要经水通道蛋白通过。随机运动始终双向，浓度差产生净通量。水的选项表示由水活度差驱动的渗透；未绘出造成该差异的不透膜溶质。示意轨迹不代表真实速率。",
    "Plasma-membrane cutaway: oxygen can dissolve in the bilayer; water mainly passes through aquaporins. Random motion is bidirectional, with a gradient producing net flux. The water option represents osmosis driven by water activity; the impermeant solutes producing this difference are omitted. Paths are schematic, not measured rates.",
  ),
  duration: 30,
  stages: [
    {
      at: 0,
      title: b("两侧水相", "Two aqueous compartments"),
      description: b(
        "亲水头朝向水，疏水尾在膜内相对。选择氧或水，观察不同通路。",
        "Polar lipid heads face water; hydrophobic tails meet inside the membrane. Choose oxygen or water to compare routes.",
      ),
    },
    {
      at: 0.16,
      title: b("随机碰撞", "Random encounters"),
      description: b(
        "分子从两侧接近膜。氧穿过脂质区；水通道选项只突出经蛋白的水流。",
        "Molecules approach from both sides. Oxygen crosses the lipid region; the aquaporin option highlights only protein-mediated water flow.",
      ),
    },
    {
      at: 0.38,
      title: b("沿通路穿膜", "Crossing the selected route"),
      description: b(
        "水沿水通道蛋白孔道通过，氧通过脂双层；两种扩散都不直接消耗 ATP。",
        "Water traverses aquaporin pores; oxygen crosses the lipid bilayer. Neither route directly consumes ATP.",
      ),
    },
    {
      at: 0.6,
      title: b("双向运动与净通量", "Bidirectional motion and net flux"),
      description: b(
        "氧浓度或水活度存在差异时，双向穿膜仍持续，但净流动指向氧浓度或水活度较低的一侧。水活度不等同于溶质浓度。",
        "With an oxygen-concentration or water-activity difference, crossings remain bidirectional, but net movement is toward lower oxygen concentration or water activity. Water activity is not solute concentration.",
      ),
    },
    {
      at: 0.86,
      title: b("趋向动态平衡", "Approaching dynamic equilibrium"),
      description: b(
        "浓度差缩小；平衡条件仍有双向交换，净通量为零。此有限示意不模拟体积、压力或真实动力学。",
        "The gradient diminishes. At equilibrium, exchange persists in both directions with zero net flux. This finite illustration does not simulate volume, pressure, or real kinetics.",
      ),
    },
  ],
  sources: [
    {
      title: "Molecular Biology of the Cell — Principles of Membrane Transport",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26815/",
    },
    {
      title:
        "Structural basis of water-specific transport through the AQP1 water channel",
      url: "https://www.nature.com/articles/414872a",
    },
  ],
  legend: [
    { color: "#699aaf", text: b("水", "Water") },
    { color: "#ba826e", text: b("氧", "Oxygen") },
    { color: "#788f9c", text: b("水通道蛋白", "Aquaporin") },
  ],
  controls: [
    {
      id: "route",
      label: b("分子与通路", "Molecule and route"),
      default: "water",
      options: [
        { value: "water", label: b("水 · 水通道蛋白", "Water · aquaporin") },
        { value: "oxygen", label: b("氧 · 脂双层", "Oxygen · lipid bilayer") },
      ],
    },
    {
      id: "gradient",
      label: b(
        "初始梯度 · 水选项指水活度",
        "Initial gradient · water option uses water activity",
      ),
      default: "outside",
      options: [
        { value: "outside", label: b("外侧较高", "Higher outside") },
        { value: "equal", label: b("两侧相等", "Equal on both sides") },
      ],
    },
  ],
  create({ rootId = "cell" } = {}) {
    const k = membraneScene(1.0);
    const channel = k.material("#788f9c");
    const channelAlt = k.material("#94adaf");
    const poreLining = k.material("#c8b88d");
    const poreCenters = [
      [-0.46, -0.46],
      [0.46, -0.46],
      [-0.46, 0.46],
      [0.46, 0.46],
    ];
    // Four aquaporin monomers, each with its OWN water pore. The center of
    // the tetramer is not used as the channel. Helices are schematic ribbons.
    for (const [cx, cz] of poreCenters) {
      for (let j = 0; j < 6; j++) {
        const a = (j * Math.PI) / 3;
        const h = alphaHelix(
          k,
          [cx + Math.cos(a) * 0.29, 0, cz + Math.sin(a) * 0.29],
          1.88,
          j % 2 ? channel : channelAlt,
        );
        h.rotation.z = Math.cos(a) * 0.045;
        const a2 = ((j + 1) * Math.PI) / 3;
        const y = j % 2 ? 0.94 : -0.94;
        k.tube(
          [
            [cx + Math.cos(a) * 0.29, y, cz + Math.sin(a) * 0.29],
            [
              cx + Math.cos(a + 0.25) * 0.34,
              y + (y > 0 ? 0.12 : -0.12),
              cz + Math.sin(a + 0.25) * 0.34,
            ],
            [cx + Math.cos(a2) * 0.29, y, cz + Math.sin(a2) * 0.29],
          ],
          0.035,
          channel,
          k.group,
          18,
        );
      }
      for (const sign of [-1, 1]) {
        const half = alphaHelix(
          k,
          [cx + sign * 0.19, sign * 0.3, cz - 0.055],
          0.55,
          poreLining,
        );
        half.rotation.z = sign * 0.19;
        k.ball([cx + sign * 0.15, sign * 0.05, cz - 0.025], 0.047, poreLining);
      }
    }
    const waterMaterial = k.material("#699aaf");
    const oxygenMaterial = k.material("#ba826e");
    const hydrogen = k.material("#edf0e8");
    const moleculeParts = [];
    const particles = Array.from({ length: 32 }, (_, i) => {
      const part = k.ball([0, 0, 0], 0.11, waterMaterial);
      part.name = `diffusing-molecule-${i}`;
      const h1 = k.ball([0.82, 0.62, 0], 0.43, hydrogen, part),
        h2 = k.ball([-0.82, 0.62, 0], 0.43, hydrogen, part);
      const partner = k.ball([1.1, 0, 0], 0.85, oxygenMaterial, part);
      moleculeParts.push({ h1, h2, partner });
      return part;
    });
    const outsideLabel =
      rootId === "bacterium"
        ? b("膜外水相 · 外层包被省略", "Outside membrane · envelope omitted")
        : ["plant", "yeast"].includes(rootId)
          ? b("细胞外水相 · 细胞壁省略", "Extracellular water · wall omitted")
          : b("细胞外水相", "Extracellular water");
    const labels = [
      { position: [-3.25, 2.94, 0], text: outsideLabel, priority: 2 },
      k.label([-3.3, -2.86, 0], "细胞质", "Cytoplasm", 2),
      k.label(
        [1.26, 0.97, 0.6],
        "水通道四聚体 · 每亚基一孔",
        "Aquaporin tetramer · one pore per subunit",
        2,
      ),
      k.label([-2.65, 0.8, 0.5], "亲水头", "Polar heads"),
      k.label([-2.65, -0.1, 0.65], "疏水尾", "Hydrophobic tails"),
      k.label([2.7, 2.92, 0], "水 · 通道扩散", "Water · channel diffusion", 2),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress);
      const water = parameters.route !== "oxygen";
      const equal = parameters.gradient === "equal";
      let inward = 0,
        outward = 0;
      particles.forEach((part, i) => {
        const initialSide = i < (equal ? 16 : 24) ? 1 : -1;
        const local = initialSide === 1 ? i : i - (equal ? 16 : 24);
        const transferCount = equal ? 8 : initialSide === 1 ? 12 : 4;
        const crosses = local < transferCount;
        const a = 0.08 + local * 0.034;
        const firstTransit = ease(p, a, a + 0.37);
        // The final teaching interval includes four balanced return pairs.
        // A paused endpoint is a snapshot, not a claim that equilibrium stops motion.
        const returns = crosses && local < 4 && p >= 0.85;
        const t = returns ? ease(p, 0.85, 0.995) : firstTransit;
        const travelSide = returns ? -initialSide : initialSide;
        if (crosses && firstTransit > 0.5) {
          if (initialSide === 1) inward++;
          else outward++;
        }
        if (returns && t > 0.5) {
          if (travelSide === 1) inward++;
          else outward++;
        }
        let initialX = (seeded(i, 4) - 0.5) * 7.6;
        const y = 1.45 + seeded(i, 5) * 1.08;
        const routeX = water
          ? poreCenters[i % 4][0]
          : (initialX < 0 ? -1 : 1) * (1.15 + seeded(i, 8) * 2.6);
        let x = initialX,
          yy = travelSide * y;
        let jitter = 1;
        if (crosses) {
          // Approach on the original side, cross ONLY at the selected route, then disperse.
          if (t < 0.3) {
            const f = t / 0.3;
            x = mix(initialX, routeX, f);
            yy = travelSide * mix(y, 1.14, f);
            jitter = 1 - f;
          } else if (t < 0.7) {
            x = routeX;
            yy = travelSide * mix(1.14, -1.14, (t - 0.3) / 0.4);
            jitter = 0;
          } else {
            const f = (t - 0.7) / 0.3;
            x = mix(routeX, initialX, f);
            yy = -travelSide * mix(1.14, y, f);
            jitter = f;
          }
        }
        part.position.set(
          x + wander(i, p, 3) * 0.32 * jitter,
          yy + wander(i, p, 9) * 0.3 * jitter,
          (water ? poreCenters[i % 4][1] : 0.05) * (1 - jitter) +
            0.25 * jitter +
            wander(i, p, 7) * 0.12 * jitter,
        );
        part.material = water ? waterMaterial : oxygenMaterial;
        moleculeParts[i].h1.visible = water;
        moleculeParts[i].h2.visible = water;
        moleculeParts[i].partner.visible = !water;
      });
      labels[5].text = water
        ? b("水 · 通道扩散", "Water · channel diffusion")
        : b("氧 · 简单扩散", "Oxygen · simple diffusion");
      k.group.userData = {
        process: "diffusion",
        rootId,
        route: water ? "aquaporin" : "bilayer",
        initialGradient: equal ? "equal" : "outside-high",
        inward,
        outward,
        netInward: inward - outward,
        moleculeCount: 32,
        atpUsed: 0,
        membranePlane: "y=0",
        deterministicSeed: 1271,
        aquaporinSubunits: 4,
        waterPores: 4,
        structuralDetail: "schematic-secondary-structure",
      };
    }
    update(0);
    return {
      group: k.group,
      materials: materialInventory(k.group, [waterMaterial, oxygenMaterial]),
      update,
      labels,
      camera: { position: [0, 2.4, 11.7], target: [0, 0, 0] },
    };
  },
};
export default definition;
