import { getNode } from "./hierarchy";

// Keep a visible link between the magnified object and the cell it belongs to.
const contexts = {
  yeastWall: ["酵母细胞壁的一小块", "A patch of the yeast cell wall"],
  yeastMembrane: [
    "酵母细胞壁内侧的膜 · 局部放大",
    "Membrane inside the yeast wall · Magnified patch",
  ],
  yeastGlucan: [
    "真菌细胞壁中的多糖网络",
    "A polysaccharide network in the fungal wall",
  ],
  yeastMannan: [
    "酵母壁表面的一类糖蛋白",
    "A class of surface glycoproteins in the yeast wall",
  ],
  yeastSeptum: [
    "母细胞与芽体之间 · 隔膜形成阶段",
    "Between mother and bud · Septum formation",
  ],
  paraCilia: ["草履虫表面的一小束纤毛", "A small group of cilia on Paramecium"],
  paraAxoneme: [
    "一根运动纤毛内部 · 横切与纵向结构",
    "Inside one motile cilium · Cross-section and length",
  ],
  paraContractile: [
    "草履虫前后两个伸缩泡中的一个",
    "One of the two contractile vacuole complexes",
  ],
  paraTrichocysts: [
    "草履虫皮层下的一枚刺丝泡",
    "One trichocyst beneath the cortex",
  ],
  phageHead: [
    "病毒的蛋白质外壳 · 不是细胞核",
    "A viral protein shell · Not a cell nucleus",
  ],
  phageCapsomers: ["头部衣壳表面的一小块", "A small patch of the head capsid"],
  phageGenome: [
    "装载于噬菌体头部的线性双链DNA",
    "Linear double-stranded DNA packed in the phage head",
  ],
  cytosol: ["细胞质水相中的分子样本", "A molecular sample from the cytosol"],
  bacterialCytoplasm: [
    "细菌细胞质中的分子样本",
    "A molecular sample from bacterial cytoplasm",
  ],
  plantCytoplasm: [
    "植物细胞质水相中的分子样本",
    "A molecular sample from plant cytosol",
  ],
  cellSap: [
    "液泡中的水与溶质 · 分子样本",
    "Water and solutes in a vacuole · Molecular sample",
  ],
  stroma: [
    "叶绿体基质中的DNA与蛋白质样本",
    "Selected DNA and proteins from chloroplast stroma",
  ],
  matrix: [
    "线粒体基质中的分子样本",
    "A molecular sample from mitochondrial matrix",
  ],
  plantMatrix: [
    "植物线粒体基质中的分子样本",
    "A molecular sample from plant mitochondrial matrix",
  ],
  chromatin: [
    "染色质的一小段 · 展开示意",
    "A short chromatin segment · Spread-out schematic",
  ],
  lysosomalPump: [
    "溶酶体膜上的一个质子泵",
    "One proton pump in the lysosomal membrane",
  ],
  recycling: [
    "溶酶体内待降解物与产物 · 过程示意",
    "Lysosomal cargo and products · Process schematic",
  ],
  bacterialEnvelope: ["细菌表面的一小块", "A patch of the bacterial surface"],
  bacterialOuter: [
    "细菌最外侧的膜 · 局部放大",
    "Outermost bacterial membrane · Magnified patch",
  ],
  bacterialMembrane: [
    "细菌细胞质外的膜 · 局部放大",
    "Membrane surrounding bacterial cytoplasm · Magnified patch",
  ],
  peptidoglycan: [
    "细菌细胞壁中的网状材料",
    "The mesh material of the bacterial wall",
  ],
  pili: [
    "细菌表面的一根黏附菌毛",
    "One adhesive pilus on the bacterial surface",
  ],
  flagellum: [
    "细菌表面的一根运动鞭毛",
    "One motile flagellum on the bacterial surface",
  ],
  nucleoid: [
    "细菌内部 · 没有核膜的DNA区域",
    "Inside a bacterium · DNA region without a nuclear envelope",
  ],
  plasmids: [
    "细菌内部 · 染色体以外的DNA",
    "Inside a bacterium · DNA outside the chromosome",
  ],
  cellWall: [
    "植物细胞最外侧的壁 · 局部放大",
    "Plant cell wall · Magnified patch",
  ],
  plantMembrane: [
    "植物细胞壁内侧的膜 · 局部放大",
    "Membrane inside the plant cell wall · Magnified patch",
  ],
  plasmodesmata: [
    "相邻植物细胞间的一条通道",
    "One channel between adjacent plant cells",
  ],
  tonoplast: [
    "包围液泡的膜 · 局部放大",
    "Membrane surrounding the vacuole · Magnified patch",
  ],
  chloroplast: [
    "植物细胞内部的一个叶绿体",
    "One chloroplast inside the plant cell",
  ],
  thylakoids: [
    "叶绿体内部相互连通的膜囊",
    "Connected membrane sacs inside a chloroplast",
  ],
  granum: ["类囊体系统中的一处堆叠", "One stack within the thylakoid system"],
  stromaLamella: [
    "连接基粒的片层 · 保留两侧基粒作参照",
    "Connecting lamellae · Grana retained for context",
  ],
  membrane: [
    "动物细胞表面的膜 · 局部放大",
    "Animal-cell surface membrane · Magnified patch",
  ],
  envelope: [
    "细胞核表面的双膜 · 局部放大",
    "Double membrane of the nucleus · Magnified patch",
  ],
  cristae: [
    "线粒体内膜的一处折叠",
    "One fold of the mitochondrial inner membrane",
  ],
};

export function describeView(path, lang = "zh") {
  if (path.length < 2) return "";
  const specific = contexts[path.at(-1)];
  if (specific) return specific[lang === "en" ? 1 : 0];
  const parent = getNode(path.at(-2), lang).name;
  return lang === "en"
    ? `Part of ${parent} · Magnified view`
    : `${parent}的一部分 · 放大观察`;
}
