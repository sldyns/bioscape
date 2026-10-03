import { cellTypes } from "../catalog/cellTypes.js";
import { children, getNode } from "../hierarchy.js";
import { experienceHash } from "../navigation.js";
import {
  processCatalog,
  processCategories,
  processesByRoot,
} from "../processes/catalog.js";

const bilingual = (zh, en) => ({ zh, en });

// Editorial introductions describe the actual specimen represented by each root.
// Names, colours, totals and process descriptions remain catalog-derived.
const modelIntroductions = {
  cell: {
    description: bilingual(
      "从细胞膜到细胞核，逐层探索内部结构",
      "Explore the structures within, from the membrane to the nucleus.",
    ),
    eyebrow: bilingual("动物 · 真核生物", "Animal · Eukaryote"),
  },
  plant: {
    description: bilingual(
      "走进光合叶肉细胞，观察叶绿体与中央液泡",
      "Explore a photosynthetic mesophyll cell, its chloroplasts and central vacuole.",
    ),
    eyebrow: bilingual("植物 · 真核生物", "Plant · Eukaryote"),
  },
  bacterium: {
    description: bilingual(
      "以革兰阴性杆菌为例，观察包被、拟核与鞭毛",
      "Explore the envelope, nucleoid and flagellum of a Gram-negative rod.",
    ),
    eyebrow: bilingual("细菌 · 原核生物", "Bacterium · Prokaryote"),
  },
  yeast: {
    description: bilingual(
      "观察出芽的酿酒酵母及其细胞壁、细胞核与液泡",
      "Explore budding yeast, its cell wall, nucleus and vacuole.",
    ),
    eyebrow: bilingual("真菌 · 单细胞", "Fungus · Unicellular"),
  },
  paramecium: {
    description: bilingual(
      "沿纤毛进入单细胞世界，观察取食与排水结构",
      "Explore a ciliated single cell and its feeding and water-balance structures.",
    ),
    eyebrow: bilingual("原生生物 · 单细胞", "Protist · Unicellular"),
  },
  phage: {
    description: bilingual(
      "探索感染细菌的病毒：头部、尾部与尾纤维",
      "Explore a bacterial virus: its head, contractile tail and tail fibres.",
    ),
    eyebrow: bilingual("病毒 · 非细胞结构", "Virus · Non-cellular"),
  },
  erythrocyte: {
    description: bilingual(
      "观察富含血红蛋白、成熟后无核的双凹细胞",
      "Explore a haemoglobin-rich biconcave cell with no nucleus at maturity.",
    ),
    eyebrow: bilingual("人体 · 血细胞", "Human · Blood cell"),
  },
  neuron: {
    description: bilingual(
      "从树突与胞体，沿有髓轴突走向末端分支",
      "Follow dendrites and the soma along a myelinated axon to its branches.",
    ),
    eyebrow: bilingual("动物 · 神经细胞", "Animal · Nerve cell"),
  },
  muscleFibre: {
    description: bilingual(
      "进入一根多核肌细胞，观察肌原纤维与重复肌节",
      "Explore a multinucleate muscle cell, its myofibrils and repeating sarcomeres.",
    ),
    eyebrow: bilingual("人体 · 骨骼肌细胞", "Human · Skeletal muscle cell"),
  },
};

export const homeModels = cellTypes.map(({ id }) => ({
  id,
  title: bilingual(getNode(id, "zh").name, getNode(id, "en").name),
  ...modelIntroductions[id],
  accent: getNode(id).color,
  image: `home/models/${id}.webp`,
  href: `#/${id}`,
}));

export const homepageMetrics = {
  modelCount: cellTypes.length,
  structureCount: new Set([
    ...cellTypes.map(({ id }) => id),
    ...Object.keys(children),
    ...Object.values(children).flat(),
  ]).size,
  processCount: Object.keys(processCatalog).length,
};

export const homeProcessCategories = Object.entries(processCategories).map(
  ([id, title]) => ({ id, title }),
);

export const featuredProcessIds = [
  "transcription",
  "mitosis",
  "photosynthesis",
  "actionPotential",
  "respiration",
  "phageLytic",
];

const dedicatedProcessRoots = {
  actionPotential: "neuron",
  synapse: "neuron",
  muscle: "muscleFibre",
  osmoticBalance: "erythrocyte",
};

export const homeProcesses = Object.values(processCatalog).map((entry) => {
  const supportedRoots = Object.keys(processesByRoot).filter((root) =>
    processesByRoot[root].includes(entry.id),
  );
  const rootId = [
    dedicatedProcessRoots[entry.id],
    ...(entry.roots || []),
    ...supportedRoots,
  ].find((root) => supportedRoots.includes(root));
  if (!rootId) throw new Error(`No homepage route for process: ${entry.id}`);
  return {
    id: entry.id,
    title: entry.title,
    summary: entry.summary,
    category: entry.category,
    image: entry.renderedThumbnail.replace(/^\//, ""),
    rootId,
    href: experienceHash([rootId], "process", entry.id),
  };
});
