export const entries = [
  {
    id: "promoterRegulation",
    module: "./modules/regulation/promoterRegulationProcess.js",
    roots: ["cell"],
    title: { zh: "启动子与转录装配", en: "Promoter regulation" },
    summary: {
      zh: "从 TATA 位点识别、DNA 弯曲到 Pol II 装配，比较完整与改变的结合位点。",
      en: "Follow TATA recognition, DNA bending and Pol II assembly; compare intact and altered binding sites.",
    },
    color: "#76a49b",
    category: "genetics",
    thumbnail: "/process-thumbnails/promoterRegulation.svg",
  },
  {
    id: "enhancerRegulation",
    module: "./modules/regulation/enhancerRegulationProcess.js",
    roots: ["cell"],
    title: { zh: "增强子与远程调控", en: "Enhancer regulation" },
    summary: {
      zh: "在动态染色质中观察激活因子、共激活因子与转录脉冲：靠近不等于表达。",
      en: "Explore activators, coactivators and transcription bursts on dynamic chromatin: proximity is not expression.",
    },
    color: "#b4a06f",
    category: "genetics",
    thumbnail: "/process-thumbnails/enhancerRegulation.svg",
  },
];
