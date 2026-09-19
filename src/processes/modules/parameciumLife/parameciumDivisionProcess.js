import { macronuclearBridge } from "./scientificGeometry.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { nuclearCell } from "./nuclearCell.js";
import { nuclearDetail } from "./fineStructure.js";

export default {
  id: "parameciumDivision",
  title: b(
    "草履虫横裂：两类核的分配",
    "Paramecium fission: partitioning two nuclear types",
  ),
  duration: 32,
  intro: b(
    "以尾草履虫为例：一个二倍体小核进行封闭式有丝分裂，多倍体大核伸长并分配，细胞沿横向分裂。核与染色质放大示意，不表示真实染色体数。",
    "P. caudatum has one diploid micronucleus, which undergoes closed mitosis, and a polyploid macronucleus that elongates and partitions during transverse fission. Enlarged chromatin symbols do not represent chromosome counts.",
  ),
  stages: [
    {
      at: 0,
      title: b("两类核，一套细胞", "Two nuclear types in one cell"),
      description: b(
        "小核保存生殖系基因组，大核支持营养期的基因表达。横裂后，每个子细胞都需要这两类核。",
        "The micronucleus stores the germline genome; the macronucleus supports vegetative gene expression. Each daughter requires both nuclear types.",
      ),
    },
    {
      at: 0.16,
      title: b("复制与口器重建", "Replication and oral development"),
      description: b(
        "核DNA在分配前复制，细胞生长并形成后部子细胞的口器。膜与纤毛结构也需随分裂重新组织。",
        "Nuclear DNA replicates before partition. The cell grows and develops the posterior daughter’s oral apparatus while its cortex and cilia reorganize.",
      ),
    },
    {
      at: 0.33,
      title: b("小核的封闭式有丝分裂", "Closed mitosis of the micronucleus"),
      description: b(
        "小核核膜保持完整，核内纺锤体分离复制后的染色体；两个小核随后分配到细胞的前后两部分。",
        "The micronuclear envelope remains intact while an intranuclear spindle segregates replicated chromosomes. The two micronuclei move into opposite cell halves.",
      ),
    },
    {
      at: 0.53,
      title: b("大核伸长与分配", "Macronuclear elongation and partition"),
      description: b(
        "大核经通常称为无丝分裂的过程伸长、分开，不经历典型的染色体中期排列。无丝分裂不等于不存在微管或调控。",
        "The macronucleus elongates and separates in a process usually called amitosis, without a conventional chromosome metaphase plate. Amitosis does not imply an absence of microtubules or regulation.",
      ),
    },
    {
      at: 0.73,
      title: b("横向分裂沟", "Transverse cleavage furrow"),
      description: b(
        "分裂沟位于长轴的横向中部，皮层和细胞膜向内收拢，分开前后两个细胞区域。",
        "A cleavage furrow across the long axis constricts the cortex and membrane, separating anterior and posterior cell regions.",
      ),
    },
    {
      at: 0.91,
      title: b("两个营养期子细胞", "Two vegetative daughter cells"),
      description: b(
        "分离的两个子细胞各具有一个小核、一个大核和口器，随后继续生长。此过程增加细胞数，没有配偶间的核交换。",
        "Each daughter contains one micronucleus, one macronucleus and an oral apparatus, and can resume growth. This process increases cell number without exchange of nuclei between partners.",
      ),
    },
  ],
  sources: [
    {
      title: "Oral development (1997) during vegetative division of Paramecium",
      url: "https://doi.org/10.1016/S0932-4739(97)80032-6",
    },
    {
      title:
        "University of Hawaii: P. caudatum micronuclear division within an intact envelope",
      url: "https://www6.pbrc.hawaii.edu/allen/ch10a/48-pca740125-46.html",
    },
    {
      title: "University of Hawaii: single micronucleus of P. caudatum",
      url: "https://www6.pbrc.hawaii.edu/allen/ch10a/47-pca730323-15.html",
    },
    {
      title:
        "Tucker et al. (1980): Comparative P. tetraurelia study of macronuclear amitosis",
      url: "https://pubmed.ncbi.nlm.nih.gov/7440651/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const mother = nuclearCell(k, group, { length: 3.05, width: 1.3 });
    const daughters = [
      nuclearCell(k, group, { length: 1.62, width: 1.05 }),
      nuclearCell(k, group, { length: 1.62, width: 1.05 }),
    ];
    const macroMat = k.material("#aa96b3", {
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
      }),
      microMat = k.material("#c79d69", {
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      });
    const macro = k.ball([0.25, 0.25, 0.3], [0.4, 0.73, 0.26], macroMat);
    const macroDaughters = [
      k.ball([0, 0, 0], [0.34, 0.54, 0.26], macroMat),
      k.ball([0, 0, 0], [0.34, 0.54, 0.26], macroMat),
    ];
    const bridge = macronuclearBridge(
      k,
      group,
      k.material("#aa96b3", { side: THREE.DoubleSide }),
    );
    const granules = [];
    for (let i = 0; i < 18; i++)
      granules.push(k.ball([0, 0, 0], 0.045, k.material("#8a7197")));
    const micro = k.ball([-0.58, 0.25, 0.56], [0.26, 0.27, 0.24], microMat);
    const micros = [
      k.ball([0, 0, 0], 0.2, microMat),
      k.ball([0, 0, 0], 0.2, microMat),
    ];
    micro.name = "dividing-micronucleus";
    const spindle = new THREE.Group();
    spindle.name = "micronuclear-spindle";
    group.add(spindle);
    spindle.position.set(-0.58, 0, 0.56);
    for (let i = 0; i < 7; i++) {
      const x = (i - 3) * 0.055;
      k.tube(
        [
          [0, -0.7, 0],
          [x, -0.23, 0.03],
          [x, 0.23, 0.03],
          [0, 0.7, 0],
        ],
        0.009,
        k.material("#c9b991"),
        spindle,
      );
    }
    const chromatids = [];
    for (let side of [-1, 1])
      for (let i = 0; i < 4; i++) {
        const o = k.segment(
          [-0.58 + (i - 1.5) * 0.09, -0.08, 0.72],
          [-0.58 + (i - 1.5) * 0.09, 0.08, 0.72],
          0.025,
          k.material(i % 2 ? "#9b7b5c" : "#ba9264"),
        );
        o.name = `segregating-chromatid-${side}-${i}`;
        chromatids.push({ o, side, i });
      }
    const oral = [];
    for (let i = 0; i < 2; i++) {
      const g = new THREE.Group();
      group.add(g);
      k.tube(
        [
          [0.72, 0.48, 0.52],
          [0.53, 0, 0.58],
          [0.5, -0.35, 0.57],
        ],
        0.085,
        k.material("#b29a75"),
        g,
      );
      for (let j = 0; j < 6; j++)
        k.segment(
          [0.72 - j * 0.025, 0.37 - j * 0.1, 0.61],
          [0.92 - j * 0.025, 0.3 - j * 0.1, 0.61],
          0.012,
          k.material("#c6b795"),
          g,
        );
      oral.push(g);
    }
    const furrow = k.ring([0, 0, 0], 1.05, 0.028, k.material("#7f9e8c"));
    furrow.rotation.x = Math.PI / 2;
    furrow.scale.y = 0.4;
    nuclearDetail(k, macro, true);
    macroDaughters.forEach((o, i) => {
      o.name = `daughter-macronucleus-${i}`;
      nuclearDetail(k, o, true);
    });
    nuclearDetail(k, micro, false);
    micros.forEach((o) => nuclearDetail(k, o, false));
    const labels = [
      k.label(
        [-0.75, 0.65, 0.75],
        "小核 · 有丝分裂",
        "Micronucleus · mitosis",
        3,
      ),
      k.label([0.2, 1.1, 0.7], "大核 · 无丝分裂", "Macronucleus · amitosis", 3),
      k.label([1.15, -0.3, 0.6], "口器", "Oral apparatus", 2),
      k.label([-1.15, 0, 0.4], "横向分裂沟", "Transverse cleavage furrow", 3),
      k.label([-0.9, -1.8, 0.5], "后部子细胞", "Posterior daughter", 2),
    ];
    function update(progress) {
      const p = clamp(progress),
        mitosis = ease(p, 0.31, 0.53),
        partition = ease(p, 0.5, 0.75),
        pinch = ease(p, 0.71, 0.9),
        separation = ease(p, 0.89, 1),
        offset = 1.5 + 0.55 * separation;
      mother.group.visible = p < 0.91;
      mother.deform(pinch * 0.985, 1 + 0.11 * ease(p, 0.1, 0.6));
      daughters.forEach((d, i) => {
        d.group.visible = p >= 0.91;
        d.group.position.set(i ? 0.07 : 0, (i ? 1 : -1) * offset, 0);
      });
      micro.visible = p < 0.54;
      micro.position.y = 0.25 * (1 - ease(p, 0.15, 0.31));
      const elongation = ease(p, 0.25, 0.36);
      micro.scale.set(
        0.26 + 0.09 * elongation,
        0.27 + 0.78 * elongation,
        0.24 + 0.1 * elongation,
      );
      spindle.scale.y = 0.25 + 0.75 * ease(p, 0.3, 0.36);
      spindle.visible = p >= 0.3 && p < 0.54;
      micros.forEach((o, i) => {
        o.visible = p >= 0.54;
        o.position.set(
          -0.5,
          (i ? 1 : -1) * (0.7 + ease(p, 0.54, 0.88) * 0.8 + separation * 0.55),
          0.56,
        );
      });
      chromatids.forEach(({ o, side, i }) => {
        o.visible = p >= 0.3 && p < 0.54;
        o.position.y = side * (0.04 + mitosis * 0.55);
      });
      macro.visible = p < 0.59;
      macro.position.y = 0.25 * (1 - ease(p, 0.48, 0.58));
      macro.scale.set(
        0.4 - 0.06 * partition,
        0.73 + ease(p, 0.49, 0.59) * 0.36,
        0.26,
      );
      macroDaughters.forEach((o, i) => {
        o.visible = p >= 0.76;
        o.position.set(
          0.25,
          (i ? 1 : -1) * (0.44 + partition * 1.06 + separation * 0.55),
          0.3,
        );
      });
      bridge.group.visible = p >= 0.59 && p < 0.76;
      bridge.update(
        0.44 + partition * 1.06 + separation * 0.55,
        0.26 * (1 - ease(p, 0.61, 0.76)),
      );
      granules.forEach((o, i) => {
        const side = i < 9 ? -1 : 1,
          a = i * 2.4;
        o.position.set(
          0.25 + Math.cos(a) * 0.22,
          p < 0.59
            ? 0.25 + Math.sin(a) * 0.48
            : side * (0.44 + partition * 1.06 + separation * 0.55) +
                Math.sin(a) * 0.31,
          0.49,
        );
      });
      oral[0].position.y = 0.4 + ease(p, 0.35, 0.89) * 1.1 + separation * 0.55;
      oral[1].position.y = 0.05 - 1.55 * ease(p, 0.22, 0.7) - separation * 0.55;
      oral[1].scale.setScalar(ease(p, 0.16, 0.38));
      furrow.visible = p >= 0.7 && p < 0.91;
      furrow.scale.set(1 - pinch * 0.94, 0.43 * (1 - pinch * 0.94), 1);
      labels[0].position[1] = p < 0.54 ? 0.65 : offset + 0.1;
      labels[1].position[1] = p < 0.59 ? 1.1 : offset + 0.55;
      labels[3].active = p >= 0.7 && p < 0.91;
      labels[4].active = p >= 0.91;
      group.userData = {
        species: "Paramecium caudatum",
        divisionPlane: "transverse",
        micronuclearDivision: "closed mitosis",
        macronuclearDivision: "amitosis; no conventional metaphase plate",
        micronuclearEnvelopeIntact: true,
        cellCount: p >= 0.91 ? 2 : 1,
        micronucleusCount: p >= 0.54 ? 2 : 1,
        macronucleusCount: p >= 0.76 ? 2 : 1,
        cleavage: pinch,
        progress: p,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0, 1, 12], target: [0, 0, 0] },
    };
  },
};
