export const entries = [
  {
    id: "parameciumFeeding",
    module: "./modules/parameciumLife/parameciumFeedingProcess.js",
    roots: ["paramecium"],
    title: { zh: "草履虫：摄食与消化", en: "Paramecium feeding and digestion" },
    summary: {
      zh: "口沟摄入、食物泡成熟与胞肛排渣",
      en: "Oral uptake, food-vacuole maturation and cytoproct egestion",
    },
    color: "#b69770",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/parameciumFeeding.svg",
  },
  {
    id: "contractileVacuole",
    module: "./modules/parameciumLife/contractileVacuoleProcess.js",
    roots: ["paramecium"],
    title: { zh: "伸缩泡：集水与排水", en: "Contractile-vacuole cycle" },
    summary: {
      zh: "放射状集水管与低渗环境下的排水循环",
      en: "Radial collecting canals and discharge in a hypotonic medium",
    },
    color: "#7caaad",
    category: "transport",
    thumbnail: "/process-thumbnails/contractileVacuole.svg",
  },
  {
    id: "parameciumDivision",
    module: "./modules/parameciumLife/parameciumDivisionProcess.js",
    roots: ["paramecium"],
    title: { zh: "草履虫横裂", en: "Paramecium transverse fission" },
    summary: {
      zh: "小核有丝分裂、大核分配与横向分裂沟",
      en: "Micronuclear mitosis, macronuclear partition and transverse cleavage",
    },
    color: "#a694b1",
    category: "division",
    thumbnail: "/process-thumbnails/parameciumDivision.svg",
  },
  {
    id: "parameciumConjugation",
    module: "./modules/parameciumLife/parameciumConjugationProcess.js",
    roots: ["paramecium"],
    title: {
      zh: "草履虫接合与核更新",
      en: "Paramecium conjugation and nuclear renewal",
    },
    summary: {
      zh: "减数分裂、原核交换与新大核分化",
      en: "Meiosis, pronuclear exchange and new macronuclear development",
    },
    color: "#8caeaa",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/parameciumConjugation.svg",
  },
];
