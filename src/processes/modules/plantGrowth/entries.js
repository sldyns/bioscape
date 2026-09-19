export const entries = [
  {
    id: "plantDivision",
    module: "./modules/plantGrowth/plantDivisionProcess.js",
    roots: ["plant"],
    title: { zh: "植物细胞分裂", en: "Plant cell division" },
    summary: {
      zh: "成膜体引导囊泡融合，细胞板从中央向亲代壁扩展。",
      en: "Phragmoplast-guided vesicle fusion builds a cell plate from the center outward.",
    },
    color: "#90a98d",
    category: "division",
    thumbnail: "/process-thumbnails/plantDivision.svg",
  },
  {
    id: "cellWallGrowth",
    module: "./modules/plantGrowth/cellWallGrowthProcess.js",
    roots: ["plant"],
    title: {
      zh: "纤维素沉积与细胞壁伸展",
      en: "Cellulose deposition and wall expansion",
    },
    summary: {
      zh: "膜内合酶沉积胞外微纤丝，比较壁合成与膨压驱动的伸展。",
      en: "Membrane synthases deposit extracellular microfibrils; compare synthesis with turgor-driven extension.",
    },
    color: "#bba775",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/cellWallGrowth.svg",
  },
  {
    id: "doubleFertilization",
    module: "./modules/plantGrowth/doubleFertilizationProcess.js",
    roots: ["plant"],
    title: { zh: "被子植物双受精", en: "Angiosperm double fertilization" },
    summary: {
      zh: "胚珠组织中的两个精细胞分别建立 2n 胚与 3n 胚乳谱系。",
      en: "Two sperm establish the 2n embryo and 3n endosperm lineages within an ovule.",
    },
    color: "#b7b590",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/doubleFertilization.svg",
  },
  {
    id: "fungalHyphae",
    module: "./modules/plantGrowth/fungalHyphaeProcess.js",
    roots: ["yeast"],
    title: {
      zh: "丝状真菌的菌丝顶端生长",
      en: "Filamentous fungal tip growth",
    },
    summary: {
      zh: "粗糙脉孢菌的顶体组织囊泡递送，支持顶端膜融合和壁合成。",
      en: "Neurospora crassa Spitzenkörper organizes delivery for apical fusion and wall synthesis.",
    },
    color: "#b6a082",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/fungalHyphae.svg",
  },
];
