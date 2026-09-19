export const entries = [
  {
    id: "auxin",
    module: "./modules/plantSignals/auxinProcess.js",
    roots: ["plant"],
    title: {
      zh: "生长素：解除转录抑制",
      en: "Auxin: releasing transcriptional repression",
    },
    summary: {
      zh: "TIR1 识别、Aux/IAA 降解与 ARF 靶基因转录",
      en: "TIR1 recognition, Aux/IAA degradation and ARF-dependent transcription",
    },
    color: "#76998a",
    category: "signaling",
    thumbnail: "/process-thumbnails/auxin.svg",
  },
  {
    id: "plantDefense",
    module: "./modules/plantSignals/plantDefenseProcess.js",
    roots: ["plant"],
    title: { zh: "植物防御：识别 flg22", en: "Plant defense: sensing flg22" },
    summary: {
      zh: "FLS2–BAK1 识别配体，BIK1 调节 RBOHD 活性氧输出",
      en: "FLS2–BAK1 recognition and BIK1 regulation of RBOHD ROS output",
    },
    color: "#819b91",
    category: "signaling",
    thumbnail: "/process-thumbnails/plantDefense.svg",
  },
];
