export const entries = [
  {
    id: "diffusion",
    module: "./modules/membrane/diffusionProcess.js",
    roots: ["cell", "plant", "bacterium", "yeast"],
    title: { zh: "跨膜扩散", en: "Diffusion across a membrane" },
    summary: {
      zh: "氧经脂双层、水经通道；比较双向交换与浓度差产生的净通量。",
      en: "Oxygen crosses the bilayer; water crosses a channel. Compare bidirectional exchange and gradient-driven net flux.",
    },
    color: "#789caa",
    category: "transport",
    thumbnail: "/process-thumbnails/diffusion.svg",
  },
  {
    id: "activeTransport",
    module: "./modules/membrane/activeTransportProcess.js",
    roots: ["cell"],
    title: {
      zh: "钠钾泵的主动运输",
      en: "Active transport by the sodium–potassium pump",
    },
    summary: {
      zh: "动物细胞的钠钾泵交替开放，每个 ATP 驱动 3 Na⁺ 向外、2 K⁺ 向内。",
      en: "An animal sodium–potassium pump alternates access: one ATP drives 3 Na⁺ out and 2 K⁺ in.",
    },
    color: "#819b93",
    category: "transport",
    thumbnail: "/process-thumbnails/activeTransport.svg",
  },
  {
    id: "osmoticBalance",
    module: "./modules/membrane/osmoticBalanceProcess.js",
    roots: ["cell"],
    title: {
      zh: "红细胞的渗透响应",
      en: "Osmotic response of a red blood cell",
    },
    summary: {
      zh: "比较低渗、等渗与高渗外液下，红细胞的水流方向和膜形态变化。",
      en: "Compare water movement and red-cell membrane shape in hypotonic, isotonic, and hypertonic media.",
    },
    color: "#bc8184",
    category: "transport",
    thumbnail: "/process-thumbnails/osmoticBalance.svg",
  },
  {
    id: "bacterialCellWall",
    module: "./modules/membrane/bacterialCellWallProcess.js",
    roots: ["bacterium"],
    title: {
      zh: "大肠杆菌肽聚糖装配",
      en: "Peptidoglycan assembly in E. coli",
    },
    summary: {
      zh: "RodA 延长糖链，PBP2 交联肽干；比较 β-内酰胺占位后的转肽阻断。",
      en: "RodA extends glycan and PBP2 crosslinks stems; compare transpeptidation blocked by β-lactam occupancy.",
    },
    color: "#a2ae8e",
    category: "division",
    thumbnail: "/process-thumbnails/bacterialCellWall.svg",
  },
];
