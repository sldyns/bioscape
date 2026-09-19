export const entries = [
  {
    id: "chromatinAccess",
    module: "./modules/chromatin/chromatinAccessProcess.js",
    roots: ["cell", "plant", "yeast"],
    title: { zh: "染色质可及性", en: "Chromatin accessibility" },
    summary: {
      zh: "追踪核小体滑移如何暴露同一 DNA 位点",
      en: "Follow how nucleosome sliding exposes the same DNA site",
    },
    color: "#9c89a7",
    category: "genetics",
    thumbnail: "/process-thumbnails/chromatinAccess.svg",
  },
  {
    id: "tad",
    module: "./modules/chromatin/tadProcess.js",
    roots: ["cell"],
    title: { zh: "染色质环与 TAD", en: "Chromatin loops & TADs" },
    summary: {
      zh: "比较相向 CTCF 边界、边界删除与黏连蛋白耗竭",
      en: "Compare convergent CTCF boundaries, boundary deletion, and cohesin depletion",
    },
    color: "#839f95",
    category: "genetics",
    thumbnail: "/process-thumbnails/tad.svg",
  },
  {
    id: "plantGenome",
    module: "./modules/chromatin/plantGenomeProcess.js",
    roots: ["plant"],
    title: { zh: "植物的三套基因组", en: "Three plant genomes" },
    summary: {
      zh: "核、叶绿体与线粒体的信息分工，以及核编码蛋白导入",
      en: "Nuclear, plastid and mitochondrial genetic roles and protein import",
    },
    color: "#8fa68b",
    category: "genetics",
    thumbnail: "/process-thumbnails/plantGenome.svg",
  },
  {
    id: "plantRdDM",
    module: "./modules/chromatin/plantRdDMProcess.js",
    roots: ["plant"],
    title: { zh: "RNA 引导的 DNA 甲基化", en: "RNA-directed DNA methylation" },
    summary: {
      zh: "从 Pol IV/RDR2 小 RNA 到 AGO4/Pol V 定位 DRM2",
      en: "From Pol IV/RDR2 small RNAs to AGO4/Pol V targeting of DRM2",
    },
    color: "#a294ac",
    category: "genetics",
    thumbnail: "/process-thumbnails/plantRdDM.svg",
  },
];
