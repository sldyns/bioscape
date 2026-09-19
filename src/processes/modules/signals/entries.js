export const entries = [
  {
    id: "signalTransduction",
    module: "./modules/signals/signalTransductionProcess.js",
    roots: ["cell"],
    title: { zh: "RTK–Ras–MAPK 信号", en: "RTK–Ras–MAPK signaling" },
    summary: {
      zh: "从胞外 PDGF 结合到 ERK 入核，比较配体与受体激酶条件。",
      en: "Follow PDGF binding through ERK nuclear entry; compare ligand and receptor-kinase conditions.",
    },
    color: "#638f98",
    category: "signaling",
    thumbnail: "/process-thumbnails/signalTransduction.svg",
  },
  {
    id: "apoptosis",
    module: "./modules/signals/apoptosisProcess.js",
    roots: ["cell"],
    title: { zh: "线粒体内源性凋亡", en: "Intrinsic mitochondrial apoptosis" },
    summary: {
      zh: "观察外膜通透化、caspase 级联，以及膜包裹的细胞碎片形成。",
      en: "Explore outer-membrane permeabilization, the caspase cascade and membrane-enclosed cell fragments.",
    },
    color: "#a47772",
    category: "signaling",
    thumbnail: "/process-thumbnails/apoptosis.svg",
  },
  {
    id: "differentiation",
    module: "./modules/signals/differentiationProcess.js",
    roots: ["cell"],
    title: { zh: "红系终末分化", en: "Terminal erythroid differentiation" },
    summary: {
      zh: "以小鼠定型红系为例，观察 GATA1 程序、血红蛋白积累和排核。",
      en: "Follow the GATA1 program, hemoglobin accumulation and enucleation in mouse definitive erythroblasts.",
    },
    color: "#b38990",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/differentiation.svg",
  },
  {
    id: "immuneResponse",
    module: "./modules/signals/immuneResponseProcess.js",
    roots: ["cell"],
    title: {
      zh: "MHC-I 呈递与 T 细胞识别",
      en: "MHC-I presentation and T-cell recognition",
    },
    summary: {
      zh: "跟随内源性肽跨越 TAP，到达靶细胞表面并接受效应 CD8 T 细胞识别。",
      en: "Follow an endogenous peptide through TAP to the target-cell surface for recognition by an effector CD8 T cell.",
    },
    color: "#7c9ca8",
    category: "signaling",
    thumbnail: "/process-thumbnails/immuneResponse.svg",
  },
];
