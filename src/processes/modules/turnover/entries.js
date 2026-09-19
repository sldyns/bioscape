export const entries = [
  {
    id: "rnaSilencing",
    module: "./modules/turnover/rnaSilencingProcess.js",
    roots: ["cell"],
    title: { zh: "miRNA 引导的沉默", en: "miRNA-guided silencing" },
    summary: {
      zh: "比较种子区识别、效应因子介导的沉默与活性 AGO2 的切割分支。",
      en: "Compare seed recognition, effector-mediated repression, and the slicing branch of active AGO2.",
    },
    color: "#a0829b",
    category: "genetics",
    thumbnail: "/process-thumbnails/rnaSilencing.svg",
  },
  {
    id: "proteasome",
    module: "./modules/turnover/proteasomeProcess.js",
    roots: ["cell", "plant", "yeast"],
    title: { zh: "泛素–蛋白酶体降解", en: "Ubiquitin–proteasome degradation" },
    summary: {
      zh: "沿 19S 马达到 20S 催化腔追踪底物展开、转运、短肽释放与泛素回收。",
      en: "Follow substrate unfolding, translocation, peptide release, and ubiquitin recycling from the 19S motor into the 20S chamber.",
    },
    color: "#8ba69a",
    category: "genetics",
    thumbnail: "/process-thumbnails/proteasome.svg",
  },
  {
    id: "crispr",
    module: "./modules/turnover/crisprProcess.js",
    roots: ["bacterium"],
    title: { zh: "Cas9 · CRISPR 干扰", en: "Cas9 · CRISPR interference" },
    summary: {
      zh: "在化脓性链球菌 II-A 型系统中比较 PAM、引导配对、R-loop 与双链切割。",
      en: "Compare PAM recognition, guide pairing, R-loop formation, and cleavage in S. pyogenes type II-A interference.",
    },
    color: "#91a6b7",
    category: "genetics",
    thumbnail: "/process-thumbnails/crispr.svg",
  },
  {
    id: "bacterialRepair",
    module: "./modules/turnover/bacterialRepairProcess.js",
    roots: ["bacterium"],
    title: {
      zh: "细菌 DNA 损伤 · SOS 响应",
      en: "Bacterial DNA damage · SOS response",
    },
    summary: {
      zh: "观察大肠杆菌的 RecA* 促进 LexA 自切割，解除 SOS 基因抑制。",
      en: "See how E. coli RecA* promotes LexA autocleavage and derepresses SOS genes.",
    },
    color: "#829e91",
    category: "genetics",
    thumbnail: "/process-thumbnails/bacterialRepair.svg",
  },
];
