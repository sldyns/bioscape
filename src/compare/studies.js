import { normalizeComparisonPath } from "./ids.js";

const overviewPartners = {
  cell: "plant",
  plant: "cell",
  bacterium: "cell",
  yeast: "plant",
  paramecium: "cell",
  phage: "bacterium",
  erythrocyte: "neuron",
  neuron: "muscleFibre",
  muscleFibre: "neuron",
  rodPhotoreceptor: "neuron",
};

function pair(left, right, zh, en, observationZh, observationEn) {
  return {
    id: left + "|" + right,
    paths: [left.split("/"), right.split("/")],
    title: { zh, en },
    observation: observationZh && { zh: observationZh, en: observationEn },
  };
}

export const overviewStudies = [
  pair("cell", "plant", "动物与植物", "Animal and plant cells"),
  pair("cell", "bacterium", "真核与原核", "Eukaryote and prokaryote"),
  pair("erythrocyte", "neuron", "运输与信号", "Transport and signaling"),
  pair("neuron", "muscleFibre", "信号与收缩", "Signaling and contraction"),
  pair("plant", "yeast", "植物与真菌", "Plant and fungus"),
  pair("bacterium", "phage", "细菌与噬菌体", "Bacterium and phage"),
];

export const detailStudies = [
  pair(
    "cell/nucleus/nuclearPores",
    "yeast/yeastNucleus/yeastNuclearPores",
    "核孔的支架",
    "Nuclear pore scaffolds",
    "从中央通道向外看八个重复单元，再转到侧面看支架如何围住通道。",
    "Follow the eight repeating sectors around the central channel, then turn the scaffolds sideways to see their depth.",
  ),
  pair(
    "cell/nucleus/chromatin/nucleosome",
    "cell/nucleus/chromatin/dna",
    "缠绕与游离的 DNA",
    "Wrapped and free DNA",
    "分别沿两条 DNA 骨架走一圈。核小体中的双螺旋还绕着组蛋白核心弯曲。",
    "Trace both DNA backbones in each view. In the nucleosome, the duplex itself bends around the histone core.",
  ),
  pair(
    "cell/nucleus/chromatin/nucleosome/histones",
    "cell/nucleus/chromatin/nucleosome",
    "组蛋白核心与核小体",
    "Histone core and nucleosome",
    "在单独的核心上定位组蛋白，再在完整核小体上追踪绕过同一核心的 DNA。",
    "Locate a histone in the isolated core, then trace the DNA around the same core in the complete particle.",
  ),
  pair(
    "rodPhotoreceptor/rodConnectingCilium",
    "paramecium/paraCilia/paraAxoneme",
    "连接纤毛与运动纤毛",
    "Connecting and motile cilia",
    "两种纤毛的外围都有九组微管双联体。观察横截面的中央，草履虫运动纤毛还有一对中央微管。",
    "Both axonemes have nine outer doublets. Look at the centre of each cross-section for the extra central pair in the motile cilium.",
  ),
  pair(
    "rodPhotoreceptor/rodSpherule",
    "neuron/neuronTerminals",
    "视杆突触与神经元终末",
    "Rod and neuronal terminals",
    "沿突触小泡观察释放面。视杆终末的突触带贴近内陷的突触区。",
    "Follow the vesicles toward their release surfaces. In the rod terminal the ribbon sits beside an invaginating synapse.",
  ),
  pair(
    "paramecium/paraMacro/paraMacroChromatin",
    "paramecium/paraMicro/paraMicroChromatin",
    "大核与小核的染色质",
    "Macro- and micronuclear chromatin",
    "在大核中寻找分散的小体，在小核中定位致密主体和透明极区。两处各自放大。",
    "Find the dispersed bodies in the macronucleus, then locate the dense region and clear pole in the independently magnified micronucleus.",
  ),
  pair(
    "paramecium/paraMacro/paraMacroEnvelope",
    "paramecium/paraMicro/paraMicroEnvelope",
    "大核与小核的核被膜",
    "Macro- and micronuclear envelopes",
    "在两片核被膜上找到内外膜会合的孔缘，再看核质侧邻近的染色质。",
    "Find where the two membranes meet at a pore rim, then inspect the material adjoining the nuclear face of each envelope.",
  ),
  pair(
    "cell/mitochondria/mitoInner/cristae/cristaJunction",
    "cell/mitochondria/mitoInner/cristae/cristaRim",
    "嵴连接部与嵴缘",
    "Crista junction and rim",
    "沿连接部看嵴腔与膜间隙的通路，再到弯曲嵴缘定位 ATP 合酶催化头。",
    "Trace the passage between the crista lumen and intermembrane space, then find the ATP synthase heads at the curved rim.",
  ),
  pair(
    "paramecium/paraMacro/paraMacroPores",
    "paramecium/paraMacro/paraMacroEnvelope",
    "大核的核孔与核被膜",
    "Macronuclear pore and envelope",
    "先看核孔的通用支架，再在大核膜片上找到内外膜汇合的开口以及核质侧的染色质小体。",
    "Inspect the shared pore scaffold, then find the opening where the two macronuclear membranes meet and the chromatin bodies on the nuclear side.",
  ),
  pair(
    "paramecium/paraMicro/paraMicroPores",
    "paramecium/paraMicro/paraMicroEnvelope",
    "小核的核孔与核被膜",
    "Micronuclear pore and envelope",
    "沿核孔的通道看向核质侧，再到小核膜片上找出曲率更大的核被膜与孔缘。",
    "Look through the pore toward its nuclear face, then find the pore rim on the more strongly curved micronuclear envelope patch.",
  ),
  pair(
    "plant/plantRibosome",
    "bacterium/bacterialRibosome",
    "胞质 80S 与细菌 70S",
    "Cytosolic 80S and bacterial 70S",
    "分别定位大小亚基，再看两者相接的区域。烟草 80S 的模型还保留了 mRNA 和两条 tRNA。",
    "Locate the large and small subunits and inspect their interface. The tobacco 80S model also contains mRNA and two tRNAs.",
  ),
  pair(
    "plant/plantER",
    "yeast/yeastER",
    "植物与酵母的内质网",
    "Plant and yeast ER",
    "观察膜囊和膜管之间的连接，再转到酵母膜囊的正面寻找窗孔。",
    "Follow the connections between sheets and tubules, then look face-on at the openings in the yeast sheets.",
  ),
  pair(
    "plant/chloroplast/thylakoids/granum",
    "plant/chloroplast/thylakoids/stromaLamella",
    "基粒与基质片层",
    "Grana and stroma lamellae",
    "沿膜面观察层层堆叠的基粒，以及伸向相邻基粒的基质片层。",
    "Follow the stacked membranes of a granum and the stroma lamellae extending toward neighbouring grana.",
  ),
];

export const comparisonStudies = [...overviewStudies, ...detailStudies];

function partnerPath(study, path) {
  const id = path.at(-1);
  const index = study.paths.findIndex((end) => end.at(-1) === id);
  if (index < 0) return null;
  const source = study.paths[index];
  const target = study.paths[1 - index];
  if (source[0] === target[0]) {
    // Reuse the visitor's actual ancestry for shared chromatin and crista
    // models, including plant leaves and the animal cytoplasm alias.
    let shared = 0;
    while (
      shared < Math.min(source.length, target.length) &&
      source[shared] === target[shared]
    )
      shared++;
    const suffix = source.slice(shared);
    if (
      suffix.every((node, i) => node === path[path.length - suffix.length + i])
    ) {
      const candidate = [
        ...path.slice(0, path.length - suffix.length),
        ...target.slice(shared),
      ];
      if (normalizeComparisonPath(target.at(-1), candidate)) return candidate;
    }
  }
  return source[0] === path[0] ? target : null;
}

export function defaultComparisonPartner(path) {
  if (path.length === 1)
    return {
      id: overviewPartners[path[0]] || "plant",
      mode: "whole",
      labels: false,
    };
  for (const study of detailStudies) {
    const partner = partnerPath(study, path);
    if (partner)
      return {
        id: partner.at(-1),
        path: [...partner],
        mode: "section",
        labels: false,
      };
  }
  const parent = path.slice(0, -1);
  return { id: parent.at(-1), path: parent, mode: "section", labels: false };
}

export function studyForPanes(leftPath, rightPath) {
  return comparisonStudies.find((study) => {
    const other = partnerPath(study, leftPath);
    return other?.[0] === rightPath[0] && other.at(-1) === rightPath.at(-1);
  });
}
