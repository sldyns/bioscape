export const entries = [
  {
    id: "rnaProcessing",
    module: "./modules/rna/rnaProcessingProcess.js",
    roots: ["cell", "plant"],
    title: { zh: "RNA 加工", en: "RNA processing" },
    summary: {
      zh: "观察 5′ 加帽、剪接体去除内含子、外显子连接与 poly(A) 加尾。",
      en: "Follow 5′ capping, spliceosome-mediated intron removal, exon joining and poly(A) addition.",
    },
    color: "#9480a5",
    category: "genetics",
    thumbnail: "/process-thumbnails/rnaProcessing.svg",
  },
  {
    id: "nuclearTransport",
    module: "./modules/rna/nuclearTransportProcess.js",
    roots: ["cell", "plant", "yeast"],
    title: { zh: "核孔运输", en: "Nuclear transport" },
    summary: {
      zh: "切换 NLS 暴露状态，观察 importin 识别、选择性入核与 Ran 调控的受体回收。",
      en: "Expose or mask an NLS to explore importin recognition, selective nuclear import and Ran-regulated receptor recycling.",
    },
    color: "#7f9994",
    category: "transport",
    thumbnail: "/process-thumbnails/nuclearTransport.svg",
  },
  {
    id: "motorTransport",
    module: "./modules/rna/motorTransportProcess.js",
    roots: ["cell"],
    title: { zh: "微管马达运输", en: "Microtubule motor transport" },
    summary: {
      zh: "比较 kinesin-1 与胞质 dynein 的不同构型、运输方向和 ATP 依赖性。",
      en: "Compare kinesin-1 and cytoplasmic dynein architectures, transport directions and ATP dependence.",
    },
    color: "#9684ab",
    category: "transport",
    thumbnail: "/process-thumbnails/motorTransport.svg",
  },
  {
    id: "organelleImport",
    module: "./modules/rna/organelleImportProcess.js",
    roots: ["plant"],
    title: { zh: "叶绿体蛋白导入", en: "Chloroplast protein import" },
    summary: {
      zh: "追踪核编码前体跨 TOC / TIC 导入、转运肽切除与基质折叠。",
      en: "Track a nuclear-encoded precursor through TOC / TIC, transit-peptide cleavage and stromal folding.",
    },
    color: "#7f9f93",
    category: "transport",
    thumbnail: "/process-thumbnails/organelleImport.svg",
  },
];
