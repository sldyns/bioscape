export const entries = [
  {
    id: "plantTransport",
    module: "./modules/plantConnections/plantTransportProcess.js",
    roots: ["plant"],
    title: { zh: "质子梯度驱动蔗糖摄取", en: "Proton-driven sucrose uptake" },
    summary: {
      zh: "伴胞质膜质子泵先储能，SUC2 耦合摄入蔗糖。",
      en: "A companion-cell proton pump establishes the gradient used by SUC2 for sucrose uptake.",
    },
    color: "#789c91",
    category: "transport",
    thumbnail: "/process-thumbnails/plantTransport.svg",
  },
  {
    id: "plasmodesmata",
    module: "./modules/plantConnections/plasmodesmataProcess.js",
    roots: ["plant"],
    title: {
      zh: "胞间连丝的选择性通行",
      en: "Selective traffic through plasmodesmata",
    },
    summary: {
      zh: "穿过细胞壁的胞质套筒，以及胼胝质对孔径的调节。",
      en: "A membrane-lined cytoplasmic sleeve crosses the wall, with a callose-regulated neck.",
    },
    color: "#a991ae",
    category: "transport",
    thumbnail: "/process-thumbnails/plasmodesmata.svg",
  },
  {
    id: "photorespiration",
    module: "./modules/plantConnections/photorespirationProcess.js",
    roots: ["plant"],
    title: {
      zh: "光呼吸的三细胞器碳回收",
      en: "Photorespiratory carbon recovery",
    },
    summary: {
      zh: "跟踪四个碳跨越三种细胞器，回收三个碳并释放一个 CO₂。",
      en: "Track four carbons through three organelles: recover three and release one as CO₂.",
    },
    color: "#a7b48b",
    category: "energy",
    thumbnail: "/process-thumbnails/photorespiration.svg",
  },
  {
    id: "c4cam",
    module: "./modules/plantConnections/c4camProcess.js",
    roots: ["plant"],
    title: {
      zh: "C₄ 与 CAM 的二氧化碳浓缩",
      en: "CO₂ concentration in C₄ and CAM",
    },
    summary: {
      zh: "比较玉米的细胞间分工与伽蓝菜的昼夜储酸机制。",
      en: "Compare maize cell-to-cell partitioning with day/night acid storage in Kalanchoë.",
    },
    color: "#95aba1",
    category: "energy",
    thumbnail: "/process-thumbnails/c4cam.svg",
  },
];
