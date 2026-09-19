export const entries = [
  {
    id: "plasmolysis",
    module: "./modules/plantWater/plasmolysisProcess.js",
    roots: ["plant"],
    title: { zh: "质壁分离与复原", en: "Plasmolysis and recovery" },
    summary: {
      zh: "固定细胞壁内，液泡与完整原生质体随外液水势收缩或恢复。",
      en: "An intact protoplast and vacuole shrink or recover inside a fixed cell wall as bath water potential changes.",
    },
    color: "#8baab0",
    category: "transport",
    thumbnail: "/process-thumbnails/plasmolysis.svg",
  },
  {
    id: "stomata",
    module: "./modules/plantWater/stomataProcess.js",
    roots: ["plant"],
    title: { zh: "气孔开闭", en: "Stomatal opening and closure" },
    summary: {
      zh: "拟南芥成对保卫细胞通过离子、水与膨压改变孔隙；比较蓝光与 ABA。",
      en: "Paired Arabidopsis guard cells alter pore width through ions, water and turgor; compare blue light with ABA.",
    },
    color: "#8aa172",
    category: "signaling",
    thumbnail: "/process-thumbnails/stomata.svg",
  },
  {
    id: "plantLongDistanceTransport",
    module: "./modules/plantWater/plantLongDistanceTransportProcess.js",
    roots: ["plant"],
    title: { zh: "木质部运输与蒸腾", en: "Xylem transport and transpiration" },
    summary: {
      zh: "跨根、茎、叶组织的连续水柱，由湿叶肉壁蒸发产生张力牵引。",
      en: "Across root, stem and leaf tissues, evaporation at wet mesophyll walls pulls a continuous water column.",
    },
    color: "#8eafba",
    category: "transport",
    thumbnail: "/process-thumbnails/plantLongDistanceTransport.svg",
  },
  {
    id: "chloroplastMovement",
    module: "./modules/plantWater/chloroplastMovementProcess.js",
    roots: ["plant"],
    title: { zh: "叶绿体光定位运动", en: "Chloroplast photorelocation" },
    summary: {
      zh: "拟南芥叶肉细胞的弱蓝光积聚与强蓝光避让，对照 phot2 缺失。",
      en: "Weak-blue-light accumulation and strong-blue-light avoidance in Arabidopsis mesophyll, compared with phot2 loss.",
    },
    color: "#89a575",
    category: "signaling",
    thumbnail: "/process-thumbnails/chloroplastMovement.svg",
  },
];
