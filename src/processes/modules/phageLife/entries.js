export const entries = [
  {
    id: "phageLytic",
    module: "./modules/phageLife/phageLyticProcess.js",
    roots: ["phage"],
    title: { zh: "T4 噬菌体裂解周期", en: "T4 phage lytic cycle" },
    summary: {
      zh: "在大肠杆菌胞质中表达、复制、装配并裂解释放。",
      en: "Expression, replication and assembly in E. coli, followed by lytic release.",
    },
    color: "#8eabba",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/phageLytic.svg",
  },
  {
    id: "phageLysogenic",
    module: "./modules/phageLife/phageLysogenicProcess.js",
    roots: ["phage"],
    title: { zh: "λ 噬菌体溶原与诱导", en: "Lambda lysogeny and induction" },
    summary: {
      zh: "λ 前噬菌体整合、随细胞分裂传递，并可被诱导切除。",
      en: "Lambda prophage integration, inheritance and inducible excision.",
    },
    color: "#ad82a9",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/phageLysogenic.svg",
  },
  {
    id: "phageAssembly",
    module: "./modules/phageLife/phageAssemblyProcess.js",
    roots: ["phage"],
    title: {
      zh: "T4 头尾装配与成熟",
      en: "T4 head–tail assembly and maturation",
    },
    summary: {
      zh: "支架清除、头尾独立装配、DNA 包装与成熟结合。",
      en: "Scaffold clearance, separate head and tail assembly, packaging and maturation.",
    },
    color: "#91a9b6",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/phageAssembly.svg",
  },
  {
    id: "phagePackaging",
    module: "./modules/phageLife/phagePackagingProcess.js",
    roots: ["phage"],
    title: { zh: "T4 DNA 包装马达", en: "T4 DNA packaging motor" },
    summary: {
      zh: "gp17 消耗 ATP，通过 gp20 门户把 DNA 装入前头。",
      en: "ATP-powered gp17 loads DNA into the prohead through the gp20 portal.",
    },
    color: "#b5a080",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/phagePackaging.svg",
  },
];
