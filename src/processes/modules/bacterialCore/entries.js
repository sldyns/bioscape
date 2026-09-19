export const entries = [
  {
    id: "bacterialExpression",
    module: "./modules/bacterialCore/bacterialExpressionProcess.js",
    roots: ["bacterium"],
    title: {
      zh: "细菌的转录与翻译偶联",
      en: "Coupled bacterial gene expression",
    },
    summary: {
      zh: "从 σ70 启动子识别到 70S 核糖体读取新生 mRNA。",
      en: "From σ70 promoter recognition to a 70S ribosome translating nascent mRNA.",
    },
    color: "#b89468",
    category: "genetics",
    thumbnail: "/process-thumbnails/bacterialExpression.svg",
  },
  {
    id: "bacterialDivision",
    module: "./modules/bacterialCore/bacterialDivisionProcess.js",
    roots: ["bacterium"],
    title: { zh: "大肠杆菌的二分裂", en: "E. coli binary fission" },
    summary: {
      zh: "染色体复制分离，分裂体组织隔膜合成与包膜内陷。",
      en: "Chromosome replication and segregation, followed by divisome-guided septal growth and envelope invagination.",
    },
    color: "#7d9e91",
    category: "division",
    thumbnail: "/process-thumbnails/bacterialDivision.svg",
  },
  {
    id: "conjugation",
    module: "./modules/bacterialCore/conjugationProcess.js",
    roots: ["bacterium"],
    title: { zh: "F 质粒接合转移", en: "F-plasmid conjugation" },
    summary: {
      zh: "菌毛建立接触，F 质粒单链转移，双方补链。",
      en: "Pilus-mediated contact, F-plasmid single-strand transfer, and complementary synthesis in both cells.",
    },
    color: "#a28ea6",
    category: "genetics",
    thumbnail: "/process-thumbnails/conjugation.svg",
  },
  {
    id: "transformation",
    module: "./modules/bacterialCore/transformationProcess.js",
    roots: ["bacterium"],
    title: {
      zh: "枯草芽孢杆菌的自然转化",
      en: "Natural transformation in B. subtilis",
    },
    summary: {
      zh: "感受态细胞经 ComEC 摄取单链 DNA，由 RecA 介导同源重组。",
      en: "Competent cells take up ssDNA through ComEC and integrate homologous DNA through RecA.",
    },
    color: "#86a08b",
    category: "genetics",
    thumbnail: "/process-thumbnails/transformation.svg",
  },
];
