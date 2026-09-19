export const entries = [
  {
    id: "replication",
    module: "./modules/genome/replicationProcess.js",
    roots: ["cell", "plant", "yeast"],
    title: { zh: "DNA 复制叉", en: "DNA replication fork" },
    summary: {
      zh: "在反向平行模板上，比较前导链连续合成与后随链冈崎片段的成熟和连接。",
      en: "Follow continuous leading-strand synthesis and Okazaki-fragment maturation on antiparallel templates.",
    },
    color: "#63aa98",
    category: "genetics",
    thumbnail: "/process-thumbnails/replication.svg",
  },
  {
    id: "dnaRepair",
    module: "./modules/genome/dnaRepairProcess.js",
    roots: ["cell", "plant", "yeast"],
    title: { zh: "核苷酸切除修复", en: "Nucleotide excision repair" },
    summary: {
      zh: "切开损伤两侧，移除短链，再以完整互补链为模板填补并封口。",
      en: "Excise a lesion-containing segment, copy the intact complementary template, then seal the nick.",
    },
    color: "#a58aa8",
    category: "genetics",
    thumbnail: "/process-thumbnails/dnaRepair.svg",
  },
  {
    id: "transduction",
    module: "./modules/genome/transductionProcess.js",
    roots: ["bacterium", "phage"],
    title: { zh: "噬菌体介导的转导", en: "Phage-mediated transduction" },
    summary: {
      zh: "分别以 P1 和 λ 展示广义误包装与邻近基因的局限性转移。",
      en: "Contrast P1 bacterial-DNA mispackaging with λ transfer of prophage-adjacent genes.",
    },
    color: "#a18cae",
    category: "genetics",
    thumbnail: "/process-thumbnails/transduction.svg",
  },
  {
    id: "bacterialSporulation",
    module: "./modules/genome/bacterialSporulationProcess.js",
    roots: ["bacterium"],
    title: {
      zh: "枯草芽孢杆菌内生孢子形成",
      en: "B. subtilis endospore formation",
    },
    summary: {
      zh: "不对称分隔、膜包裹与分层成熟，将一个细胞转为一枚休眠孢子。",
      en: "Asymmetric septation, engulfment and maturation convert one cell into one dormant spore.",
    },
    color: "#a38ea7",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/bacterialSporulation.svg",
  },
];
