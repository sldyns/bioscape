import { erythrocyteRefinementMetadata } from "./models/erythrocyteMetadata.js";
import { neuronRefinementMetadata } from "./models/neuronMetadata.js";
import { muscleMetadata } from "./models/muscleMetadata.js";

// These are scoped teaching specimens, not reconstructions of named patients.
const bilingual = (zh, en) => ({ zh, en });
const part = (id, zh, en, color, descZh, descEn) => ({
  id,
  zh,
  en,
  color,
  desc: bilingual(descZh, descEn),
});

export const specializedSpecimens = [
  {
    id: "erythrocyte",
    zh: "成熟人红细胞",
    en: "Mature human erythrocyte",
    color: "#c75b65",
    summary: bilingual(
      "柔韧的双凹圆盘，富含血红蛋白；正常成熟状态没有细胞核和线粒体。",
      "A flexible biconcave disc filled with haemoglobin; normally lacks a nucleus and mitochondria at maturity.",
    ),
    size: bilingual("直径约 7–8 µm", "Approximately 7–8 µm across"),
    scope: bilingual(
      "健康成熟人红细胞的静息双凹外形。膜厚、颜色及剖面作教学处理；展开视图仅分离膜与内容物，不表示可拆卸的细胞器。",
      "A resting, healthy mature human erythrocyte. Membrane thickness, colour and sectioning are illustrative; the exploded view separates membrane from contents, not detachable organelles.",
    ),
    facts: {
      boundary: bilingual("细胞膜，无细胞壁", "Plasma membrane; no cell wall"),
      genome: bilingual(
        "成熟后无细胞核；正常无残留线粒体",
        "No nucleus at maturity; normally no retained mitochondria",
      ),
      organization: bilingual(
        "单个双凹细胞；中央变薄但并不穿孔",
        "One biconcave cell; a thin centre, not a hole",
      ),
      function: bilingual("血红蛋白参与氧运输", "Haemoglobin carries oxygen"),
    },
    parts: [
      part(
        "erythrocyteMembrane",
        "红细胞膜",
        "Erythrocyte membrane",
        "#c75b65",
        "连续的细胞边界；双凹形状不是环形孔洞。",
        "A continuous boundary; biconcavity does not create a central hole.",
      ),
      part(
        "erythrocyteCytosol",
        "富含血红蛋白的胞质",
        "Haemoglobin-rich cytosol",
        "#a74353",
        "血红蛋白溶于胞质，不是膜包裹的细胞器。",
        "Haemoglobin is dissolved in the cytosol, not enclosed in an organelle.",
      ),
    ],
    sources: [
      {
        title:
          "Evans & Fung (1972) · Improved measurements of the erythrocyte geometry",
        url: "https://pubmed.ncbi.nlm.nih.gov/4635577/",
      },
      {
        title: "NCBI · Blood and the cells it contains",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK2263/",
      },
      {
        title:
          "NHLBI · Mitochondrial removal during normal erythrocyte maturation",
        url: "https://www.nhlbi.nih.gov/news/2021/nih-scientists-discover-how-dna-fragments-can-trigger-inflammation-sickle-cell-disease",
      },
    ],
  },
  {
    id: "neuron",
    zh: "有髓多极神经元",
    en: "Myelinated multipolar neuron",
    color: "#77a6b4",
    summary: bilingual(
      "树突汇入含核胞体，连续轴突由分段髓鞘包绕，末端再分支。",
      "Dendrites meet a nucleated soma; a continuous axon passes through myelin internodes and ends in terminal branches.",
    ),
    size: bilingual(
      "胞体常为数十 µm；轴突长度差异极大",
      "Soma commonly tens of µm; axon length varies widely",
    ),
    scope: bilingual(
      "代表性的有髓多极神经元，不对应某一脑区或单个细胞重建。轴突纵向缩短，郎飞结间隙放大；髓鞘由胶质细胞形成，这里省略其胞体。",
      "A representative myelinated multipolar neuron, not a reconstruction from a named brain region. Axon length is compressed and nodal gaps enlarged; myelin is made by glia, whose cell bodies are omitted.",
    ),
    facts: {
      boundary: bilingual(
        "神经元细胞膜；轴突外另有胶质来源髓鞘",
        "Neuronal membrane; glial myelin around the axon",
      ),
      genome: bilingual("胞体内有细胞核", "A nucleus inside the soma"),
      organization: bilingual(
        "多条树突、一个轴突及其末端分支",
        "Multiple dendrites, one axon and its terminal branches",
      ),
      function: bilingual(
        "整合输入并向靶细胞传递信号",
        "Integrates inputs and signals to target cells",
      ),
    },
    parts: [
      part(
        "neuronSoma",
        "胞体",
        "Soma",
        "#78a5b0",
        "含细胞核的胞体，与树突及轴突连续。",
        "The nucleated cell body is continuous with dendrites and the axon.",
      ),
      part(
        "neuronNucleus",
        "细胞核",
        "Nucleus",
        "#9a87af",
        "位于胞体内部；剖切后可见。",
        "Inside the soma; visible in the cutaway.",
      ),
      part(
        "neuronDendrites",
        "树突",
        "Dendrites",
        "#8cb8be",
        "逐渐变细的分支，用于接收许多输入。",
        "Tapering branches that receive many inputs.",
      ),
      part(
        "neuronAxon",
        "连续轴突",
        "Continuous axon",
        "#d3ae75",
        "穿过髓鞘各节段，结间也没有断开。",
        "Runs through every myelin segment without breaking at the nodes.",
      ),
      part(
        "neuronMyelin",
        "髓鞘节段",
        "Myelin internodes",
        "#91b4a4",
        "胶质细胞膜反复包绕轴突形成；不包裹树突。",
        "Repeated wrapping of glial membrane around the axon, not the dendrites.",
      ),
      part(
        "neuronNodes",
        "郎飞结",
        "Nodes of Ranvier",
        "#f1c88d",
        "相邻髓鞘节段之间裸露的短轴突区。",
        "Short exposed axonal regions between adjacent myelin internodes.",
      ),
      part(
        "neuronTerminals",
        "轴突末端",
        "Axon terminals",
        "#78a5b0",
        "分支末端的突触前膨大；图中未放置靶细胞。",
        "Presynaptic swellings on terminal branches; target cells are not shown.",
      ),
    ],
    sources: [
      {
        title: "NINDS · Brain Basics: Life and Death of a Neuron",
        url: "https://www.ninds.nih.gov/sites/default/files/2025-05/NINDS_Life_and_Death_of_a_Neuron_Booklet_073024_B_FOR_ONLINE_0.pdf",
      },
      {
        title: "NCBI · Neuroscience: Nerve Cells",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK11103/",
      },
      {
        title:
          "National Academies · Major Structures and Functions of the Brain",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK234157/",
      },
    ],
  },
  {
    id: "muscleFibre",
    zh: "人骨骼肌纤维",
    en: "Human skeletal muscle fibre",
    color: "#bd8292",
    summary: bilingual(
      "一根长的多核细胞；周边肌核围绕成束、平行排列的肌原纤维，重复肌节产生横纹。",
      "One long multinucleate cell: peripheral myonuclei surround parallel myofibrils, whose repeating sarcomeres produce striations.",
    ),
    size: bilingual(
      "图示为直径约 25 µm 的纤维片段",
      "An illustrative fibre segment about 25 µm across",
    ),
    scope: bilingual(
      "一根骨骼肌细胞的截取片段，不是整块肌肉或肌束。端面人为截断；肌膜透明度、条纹色彩及局部肌节强调属于教学处理。仅展示代表性肌原纤维与周边肌核，未穷尽细胞器。",
      "A cropped segment of one skeletal muscle cell, not a whole muscle or fascicle. Ends are artificial sections; membrane transparency, band colours and local sarcomere emphasis are educational. Representative myofibrils and peripheral nuclei are shown, not every organelle.",
    ),
    facts: {
      boundary: bilingual(
        "一个连续肌膜包围整根肌纤维",
        "One continuous sarcolemma encloses the fibre",
      ),
      genome: bilingual(
        "多个肌核位于肌膜内侧周边",
        "Multiple myonuclei beneath the sarcolemma",
      ),
      organization: bilingual(
        "平行肌原纤维；肌节从 Z 盘延伸至下一 Z 盘",
        "Parallel myofibrils; each sarcomere spans Z disc to Z disc",
      ),
      function: bilingual(
        "肌节协同缩短，产生收缩力",
        "Sarcomeres shorten together to generate force",
      ),
    },
    parts: [
      part(
        "muscleFibreSarcolemma",
        "肌膜",
        "Sarcolemma",
        "#bd8292",
        "单个肌细胞的细胞膜；透明展示以便观察内部。",
        "The plasma membrane of this single muscle cell, made transparent to reveal the interior.",
      ),
      part(
        "muscleFibreNuclei",
        "周边肌核",
        "Peripheral myonuclei",
        "#8d7ca8",
        "多个细胞核位于肌膜内侧；不是多个肌细胞的核。",
        "Multiple nuclei beneath the membrane of the same cell.",
      ),
      part(
        "muscleFibreMyofibrils",
        "肌原纤维",
        "Myofibrils",
        "#c99391",
        "平行的收缩结构；A 带、I 带及 Z 盘沿相邻肌原纤维对齐。",
        "Parallel contractile structures with aligned A bands, I bands and Z discs.",
      ),
      part(
        "muscleFibreSarcomere",
        "示例肌节",
        "Example sarcomere",
        "#a7667c",
        "高亮一段 Z 盘到 Z 盘的肌节；其余肌原纤维上也重复同样结构。",
        "One highlighted Z-to-Z repeat; the same organization repeats along every myofibril.",
      ),
    ],
    sources: [
      {
        title: "University of Minnesota · Human skeletal muscle, MH 055ahr",
        url: "https://www.histologyguide.org/slideview/MH-055ahr-skeletal-muscle/04-slide-1.html",
      },
      {
        title: "University of Genoa · Atlas of Histology: Muscle tissue",
        url: "https://istologia.unige.it/en/muscle_tissue",
      },
      {
        title: "NCBI · Anatomy, Skeletal Muscle",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK537236/",
      },
    ],
  },
];

const refinements = {
  erythrocyte: erythrocyteRefinementMetadata,
  neuron: neuronRefinementMetadata,
  muscleFibre: muscleMetadata,
};
for (const specimen of specializedSpecimens) {
  const refinement = refinements[specimen.id];
  specimen.scope = refinement.scope;
  specimen.parts = Array.isArray(refinement.parts)
    ? refinement.parts
    : specimen.parts.map((part) => ({
        ...part,
        desc: refinement.parts[part.id] || part.desc,
      }));
  specimen.sources = [...specimen.sources, ...refinement.sources].filter(
    (source, index, sources) =>
      sources.findIndex((item) => item.url === source.url) === index,
  );
}

export const specializedSpecimenIds = new Set(
  specializedSpecimens.map(({ id }) => id),
);
export const specializedPartIds = new Set(
  specializedSpecimens.flatMap(({ parts }) => parts.map(({ id }) => id)),
);
export function getSpecimen(id) {
  return specializedSpecimens.find((specimen) => specimen.id === id) || null;
}
