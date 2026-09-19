import { extensionEntries } from "./extensions.js";
// Lightweight metadata shared by navigation and the process picker.
// Geometry is loaded only after a process is selected.
export const processCatalog = {
  secretion: {
    id: "secretion",
    category: "transport",
    thumbnail: "/process-thumbnails/secretion.svg",
    title: { zh: "蛋白质分泌", en: "Protein secretion" },
    color: "#bc9b88",
    summary: {
      zh: "跟随分泌蛋白，从内质网经过高尔基体，抵达细胞外。",
      en: "Follow a secretory protein from the ER through the Golgi to the cell exterior.",
    },
  },
  transcription: {
    id: "transcription",
    category: "genetics",
    thumbnail: "/process-thumbnails/transcription.svg",
    title: { zh: "转录", en: "Transcription" },
    color: "#91a9b6",
    summary: {
      zh: "进入细胞核，观察 DNA 如何被读取并合成 RNA。",
      en: "Enter the nucleus to see how DNA is read to synthesize RNA.",
    },
  },
  photosynthesis: {
    id: "photosynthesis",
    category: "energy",
    thumbnail: "/process-thumbnails/photosynthesis.svg",
    title: { zh: "光合作用", en: "Photosynthesis" },
    color: "#9eae85",
    summary: {
      zh: "在叶绿体中追踪光能，理解光反应与碳固定的协作。",
      en: "Trace light energy in the chloroplast and connect light reactions with carbon fixation.",
    },
  },
  infection: {
    id: "infection",
    category: "lifeCycle",
    thumbnail: "/process-thumbnails/infection.svg",
    title: { zh: "噬菌体侵染", en: "Phage infection" },
    color: "#aba1bb",
    summary: {
      zh: "以 T4 的起始机制为例，观察吸附、尾鞘收缩与 DNA 递送。",
      en: "Explore attachment, sheath contraction and DNA delivery using the T4 initiation mechanism.",
    },
  },
};
export const processesByRoot = {
  cell: ["secretion", "transcription"],
  plant: ["photosynthesis", "transcription"],
  phage: ["infection"],
  bacterium: [],
  yeast: [],
  paramecium: [],
};
for (const entry of extensionEntries) {
  if (processCatalog[entry.id])
    throw new Error(`Duplicate process: ${entry.id}`);
  processCatalog[entry.id] = entry;
  for (const root of entry.roots) {
    if (!processesByRoot[root])
      throw new Error(`Unknown process root: ${root}`);
    processesByRoot[root].push(entry.id);
  }
}
// Static previews of the actual reviewed 3D models; no WebGL contexts in cards.
for (const entry of Object.values(processCatalog)) {
  entry.renderedThumbnail = `/process-thumbnails/rendered/${entry.id}.webp`;
}
export const processCategories = {
  genetics: { zh: "遗传与调控", en: "Genes & regulation" },
  energy: { zh: "能量与代谢", en: "Energy & metabolism" },
  transport: { zh: "运输与稳态", en: "Transport & balance" },
  division: { zh: "生长与分裂", en: "Growth & division" },
  signaling: { zh: "信号与响应", en: "Signals & responses" },
  lifeCycle: { zh: "生命活动", en: "Life activities" },
};
export const resolveProcess = (root, id) =>
  processesByRoot[root]?.includes(id) ? id : null;

export const relatedStructures = {
  infection: { phage: [["phageHead"], ["phageTail"]] },
  secretion: { cell: [["roughER"], ["golgi"], ["membrane"]] },
  photosynthesis: {
    plant: [
      ["chloroplast"],
      ["chloroplast", "thylakoids"],
      ["chloroplast", "stroma"],
    ],
  },
  transcription: {
    cell: [["nucleus"], ["nucleus", "chromatin"]],
    plant: [["plantNucleus"], ["plantNucleus", "chromatin"]],
  },
};
