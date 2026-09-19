export const entries = [
  {
    id: "chemotaxis",
    module: "./modules/bacterialSignals/chemotaxisProcess.js",
    roots: ["bacterium"],
    title: { zh: "细菌趋化", en: "Bacterial chemotaxis" },
    summary: {
      zh: "大肠杆菌通过 Che 信号改变翻滚概率，使周生鞭毛的有利游程延长。",
      en: "E. coli uses Che signaling to bias tumbling and extend favorable runs powered by peritrichous flagella.",
    },
    color: "#719c92",
    category: "signaling",
    thumbnail: "/process-thumbnails/chemotaxis.svg",
  },
  {
    id: "twoComponent",
    module: "./modules/bacterialSignals/twoComponentProcess.js",
    roots: ["bacterium"],
    title: { zh: "双组分信号传导", en: "Two-component signaling" },
    summary: {
      zh: "厌氧大肠杆菌的 NarX–NarL：从周质硝酸盐感知到 His→Asp 磷酸转移与转录调控。",
      en: "Anaerobic E. coli NarX–NarL: periplasmic nitrate sensing, His-to-Asp phosphotransfer, and transcriptional regulation.",
    },
    color: "#a28b9d",
    category: "signaling",
    thumbnail: "/process-thumbnails/twoComponent.svg",
  },
  {
    id: "quorumSensing",
    module: "./modules/bacterialSignals/quorumSensingProcess.js",
    roots: ["bacterium"],
    title: { zh: "群体感应", en: "Quorum sensing" },
    summary: {
      zh: "费氏弧菌的 AHL 信号积累、LuxR 激活与 lux 正反馈；比较保留和稀释。",
      en: "V. fischeri AHL accumulation, LuxR activation and lux positive feedback; compare retention with dilution.",
    },
    color: "#a7ad78",
    category: "signaling",
    thumbnail: "/process-thumbnails/quorumSensing.svg",
  },
  {
    id: "biofilm",
    module: "./modules/bacterialSignals/biofilmProcess.js",
    roots: ["bacterium"],
    title: { zh: "生物膜形成与分散", en: "Biofilm formation and dispersal" },
    summary: {
      zh: "铜绿假单胞菌 PAO1 的表面附着、Psl 基质网络与条件性活细胞释放。",
      en: "Surface attachment, a Psl matrix network and conditional release of viable P. aeruginosa PAO1 cells.",
    },
    color: "#91a388",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/biofilm.svg",
  },
];
