export const entries = [
  {
    id: "lacOperon",
    module: "./modules/operons/lacOperonProcess.js",
    roots: ["bacterium"],
    title: { zh: "乳糖操纵子：双重控制", en: "Lac operon: two inputs" },
    summary: {
      zh: "分别改变乳糖与葡萄糖，观察 LacI 抑制与 CAP–cAMP 激活。",
      en: "Vary lactose and glucose to compare LacI repression with CAP–cAMP activation.",
    },
    color: "#a588a7",
    category: "genetics",
    thumbnail: "/process-thumbnails/lacOperon.svg",
  },
  {
    id: "trpOperon",
    module: "./modules/operons/trpOperonProcess.js",
    roots: ["bacterium"],
    title: {
      zh: "色氨酸操纵子：抑制与衰减",
      en: "Trp operon: repression and attenuation",
    },
    summary: {
      zh: "区分 TrpR 起始抑制与带色氨酸 tRNA 决定的先导 RNA 折叠。",
      en: "Separate TrpR repression from charged-tRNA-dependent leader RNA folding.",
    },
    color: "#89a696",
    category: "genetics",
    thumbnail: "/process-thumbnails/trpOperon.svg",
  },
  {
    id: "yeastGal",
    module: "./modules/operons/yeastGalProcess.js",
    roots: ["yeast"],
    title: {
      zh: "酵母 GAL：解除激活域抑制",
      en: "Yeast GAL: release the activation domain",
    },
    summary: {
      zh: "Gal3 感知半乳糖，解除 Gal80 对 Gal4 的抑制，并与葡萄糖信号整合。",
      en: "Gal3 senses galactose to relieve Gal80 inhibition of Gal4 alongside glucose repression.",
    },
    color: "#ad89a5",
    category: "genetics",
    thumbnail: "/process-thumbnails/yeastGal.svg",
  },
  {
    id: "yeastOsmoregulation",
    module: "./modules/operons/yeastOsmoregulationProcess.js",
    roots: ["yeast"],
    title: {
      zh: "酵母渗透调节：HOG 与甘油",
      en: "Yeast osmoregulation: HOG and glycerol",
    },
    summary: {
      zh: "从 Sln1 磷酸接力到 Hog1 核转位、甘油积累与体积恢复。",
      en: "From the Sln1 phosphorelay to Hog1 nuclear localization, glycerol accumulation and volume recovery.",
    },
    color: "#8bada0",
    category: "signaling",
    thumbnail: "/process-thumbnails/yeastOsmoregulation.svg",
  },
];
