export const entries = [
  {
    id: "translation",
    module: "./modules/translation/translationProcess.js",
    roots: ["cell", "plant", "yeast", "paramecium"],
    title: { zh: "核糖体翻译", en: "Ribosomal translation" },
    summary: {
      zh: "在 80S 核糖体内追踪 A、P、E 位点、肽链转移与终止。",
      en: "Follow A, P and E sites, peptide transfer and termination inside an 80S ribosome.",
    },
    color: "#a192b2",
    category: "genetics",
    thumbnail: "/process-thumbnails/translation.svg",
  },
  {
    id: "proteinFolding",
    module: "./modules/translation/proteinFoldingProcess.js",
    roots: ["cell", "plant", "yeast"],
    title: { zh: "新生蛋白质折叠", en: "Nascent protein folding" },
    summary: {
      zh: "观察新生链局部折叠与 Hsp70 的 ATP/ADP 夹持和释放循环。",
      en: "Explore local nascent-chain folding and the ATP/ADP capture-and-release cycle of Hsp70.",
    },
    color: "#779e92",
    category: "genetics",
    thumbnail: "/process-thumbnails/proteinFolding.svg",
  },
  {
    id: "alternativeSplicing",
    module: "./modules/translation/alternativeSplicingProcess.js",
    roots: ["cell"],
    title: { zh: "可变剪接：SMN2", en: "Alternative splicing: SMN2" },
    summary: {
      zh: "比较人类 SMN2 外显子 7 的保留与跳跃，观察套索和成熟 RNA 的变化。",
      en: "Compare human SMN2 exon-7 inclusion and skipping, with distinct lariats and mature RNA junctions.",
    },
    color: "#92a9bb",
    category: "genetics",
    thumbnail: "/process-thumbnails/alternativeSplicing.svg",
  },
  {
    id: "nitrogenFixation",
    module: "./modules/translation/nitrogenFixationProcess.js",
    roots: ["bacterium"],
    title: { zh: "氮酶固氮", en: "Nitrogenase fixation" },
    summary: {
      zh: "追踪维涅兰德固氮菌氮酶的 ATP 与电子循环，比较氧保护和氧暴露。",
      en: "Follow ATP and electron cycling in Azotobacter nitrogenase and compare oxygen protection with exposure.",
    },
    color: "#859e9d",
    category: "energy",
    thumbnail: "/process-thumbnails/nitrogenFixation.svg",
  },
];
