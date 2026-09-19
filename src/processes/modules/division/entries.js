export const entries = [
  {
    id: "mitosis",
    module: "./modules/division/mitosisProcess.js",
    roots: ["cell"],
    title: { zh: "有丝分裂", en: "Mitosis" },
    summary: {
      zh: "动粒双向附着、检查点与姐妹染色单体分离",
      en: "Biorientation, the spindle checkpoint and sister segregation",
    },
    color: "#709895",
    category: "division",
    thumbnail: "/process-thumbnails/mitosis.svg",
  },
  {
    id: "meiosis",
    module: "./modules/division/meiosisProcess.js",
    roots: ["cell"],
    title: { zh: "减数分裂", en: "Meiosis" },
    summary: {
      zh: "小鼠精母细胞的同源交换与两次染色体分离",
      en: "Homolog crossover and two segregation events in a mouse spermatocyte",
    },
    color: "#a293b5",
    category: "division",
    thumbnail: "/process-thumbnails/meiosis.svg",
  },
];
