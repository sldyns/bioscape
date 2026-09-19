export const entries = [
  {
    id: "respiration",
    module: "./modules/energy/respirationProcess.js",
    roots: ["cell", "plant", "yeast", "paramecium"],
    title: { zh: "呼吸链与 ATP 合成", en: "Respiratory chain & ATP synthesis" },
    summary: {
      zh: "跨内膜的电子传递、质子梯度与旋转催化",
      en: "Inner-membrane electron transfer, proton gradients and rotary catalysis",
    },
    color: "#819c98",
    category: "energy",
    thumbnail: "/process-thumbnails/respiration.svg",
  },
  {
    id: "glycolysis",
    module: "./modules/energy/glycolysisProcess.js",
    roots: ["cell", "plant", "yeast"],
    title: {
      zh: "糖酵解：碳与磷酸的去向",
      en: "Glycolysis: carbon & phosphate",
    },
    summary: {
      zh: "六碳裂分、磷酸转移与两个 ATP 的净收益",
      en: "Carbon cleavage, phosphate transfer and a net yield of two ATP",
    },
    color: "#a795b7",
    category: "energy",
    thumbnail: "/process-thumbnails/glycolysis.svg",
  },
  {
    id: "bacterialEnergetics",
    module: "./modules/energy/bacterialEnergeticsProcess.js",
    roots: ["bacterium"],
    title: {
      zh: "细菌质膜上的呼吸",
      en: "Respiration at the bacterial membrane",
    },
    summary: {
      zh: "大肠杆菌两种有氧支路与胞质侧 ATP 合成",
      en: "Two E. coli aerobic branches and cytoplasmic ATP synthesis",
    },
    color: "#859b8b",
    category: "energy",
    thumbnail: "/process-thumbnails/bacterialEnergetics.svg",
  },
  {
    id: "bacterialPhotosynthesis",
    module: "./modules/energy/bacterialPhotosynthesisProcess.js",
    roots: ["bacterium"],
    title: {
      zh: "蓝细菌的产氧光合作用",
      en: "Oxygenic photosynthesis in cyanobacteria",
    },
    summary: {
      zh: "类囊体中的光系统、水氧化和质子回流",
      en: "Thylakoid photosystems, water oxidation and proton return",
    },
    color: "#7ca396",
    category: "energy",
    thumbnail: "/process-thumbnails/bacterialPhotosynthesis.svg",
  },
];
