export const entries = [
  {
    id: "actionPotential",
    module: "./modules/neurons/actionPotentialProcess.js",
    roots: ["cell"],
    title: { zh: "动作电位传播", en: "Action potential propagation" },
    summary: {
      zh: "无髓神经元轴突：钠、钾通道逐段再生电信号。",
      en: "Unmyelinated neuronal axon: sodium and potassium channels regenerate an electrical signal.",
    },
    color: "#699b92",
    category: "signaling",
    thumbnail: "/process-thumbnails/actionPotential.svg",
  },
  {
    id: "synapse",
    module: "./modules/neurons/synapseProcess.js",
    roots: ["cell"],
    title: { zh: "谷氨酸突触传递", en: "Glutamatergic synaptic transmission" },
    summary: {
      zh: "中枢兴奋性突触：钙触发膜融合、受体响应与递质清除。",
      en: "Central excitatory synapse: calcium-triggered fusion, receptor response and transmitter clearance.",
    },
    color: "#ad8b74",
    category: "signaling",
    thumbnail: "/process-thumbnails/synapse.svg",
  },
  {
    id: "muscle",
    module: "./modules/neurons/muscleProcess.js",
    roots: ["cell"],
    title: { zh: "骨骼肌滑动肌丝", en: "Skeletal muscle sliding filaments" },
    summary: {
      zh: "专门化骨骼肌：Ca²⁺ 调控横桥，ATP 驱动肌节缩短。",
      en: "Specialized skeletal muscle: calcium regulates cross-bridges and ATP drives sarcomere shortening.",
    },
    color: "#aa8693",
    category: "signaling",
    thumbnail: "/process-thumbnails/muscle.svg",
  },
  {
    id: "ciliaryMotion",
    module: "./modules/neurons/ciliaryMotionProcess.js",
    roots: ["paramecium"],
    title: { zh: "纤毛的滑动与弯曲", en: "Ciliary sliding and bending" },
    summary: {
      zh: "草履虫 9+2 轴丝：动力蛋白使受约束的滑动转为弯曲。",
      en: "Paramecium 9+2 axoneme: dynein turns constrained sliding into bending.",
    },
    color: "#7b9f94",
    category: "transport",
    thumbnail: "/process-thumbnails/ciliaryMotion.svg",
  },
];
