export const entries = [
  {
    id: "endocytosis",
    module: "./modules/traffic/endocytosisProcess.js",
    roots: ["cell"],
    title: { zh: "受体介导内吞", en: "Receptor-mediated endocytosis" },
    summary: {
      zh: "LDL 结合、网格蛋白窝、囊泡脱包被与内体分选",
      en: "LDL binding, coated pits, uncoating and endosomal sorting",
    },
    color: "#83a9a1",
    category: "transport",
    thumbnail: "/process-thumbnails/endocytosis.svg",
  },
  {
    id: "autophagy",
    module: "./modules/traffic/autophagyProcess.js",
    roots: ["cell"],
    title: { zh: "宏自噬", en: "Macroautophagy" },
    summary: {
      zh: "隔离膜闭合、双膜自噬体与溶酶体降解",
      en: "Phagophore closure, double membranes and lysosomal degradation",
    },
    color: "#a49bb6",
    category: "transport",
    thumbnail: "/process-thumbnails/autophagy.svg",
  },
];
