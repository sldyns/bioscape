export const entries = [
  {
    id: "yeastBudding",
    module: "./modules/yeastLife/yeastBuddingProcess.js",
    roots: ["yeast"],
    title: { zh: "酵母出芽", en: "Yeast budding" },
    summary: {
      zh: "芽颈连接、闭合式核分裂与母女细胞分离",
      en: "Neck-connected growth, closed mitosis and mother–daughter separation",
    },
    color: "#9a9dba",
    category: "division",
    thumbnail: "/process-thumbnails/yeastBudding.svg",
  },
  {
    id: "yeastFermentation",
    module: "./modules/yeastLife/yeastFermentationProcess.js",
    roots: ["yeast"],
    title: { zh: "酵母酒精发酵", en: "Yeast alcoholic fermentation" },
    summary: {
      zh: "跟踪碳骨架、脱羧、乙醇形成与 NAD⁺ 再生",
      en: "Track carbon skeletons, decarboxylation, ethanol formation and NAD⁺ recycling",
    },
    color: "#87a99c",
    category: "energy",
    thumbnail: "/process-thumbnails/yeastFermentation.svg",
  },
  {
    id: "yeastMating",
    module: "./modules/yeastLife/yeastMatingProcess.js",
    roots: ["yeast"],
    title: { zh: "酵母配对与融合", en: "Yeast mating and fusion" },
    summary: {
      zh: "a/α 互识、极化、胞质融合与二倍体形成",
      en: "a/α recognition, polarization, plasmogamy and diploid formation",
    },
    color: "#aa9cac",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/yeastMating.svg",
  },
  {
    id: "yeastSporulation",
    module: "./modules/yeastLife/yeastSporulationProcess.js",
    roots: ["yeast"],
    title: { zh: "酵母减数分裂与产孢", en: "Yeast meiosis and sporulation" },
    summary: {
      zh: "二倍体饥饿响应、两轮减数分裂与四孢子子囊",
      en: "Diploid starvation response, two meiotic divisions and a four-spored ascus",
    },
    color: "#ad9d79",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/yeastSporulation.svg",
  },
];
