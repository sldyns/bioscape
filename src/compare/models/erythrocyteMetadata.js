// Metadata for the existing three routes; no new hierarchy identifiers.
export const erythrocyteRefinementMetadata = {
  scope: {
    zh: "整细胞使用双凹轮廓；膜厚与剖面边缘加粗。展开仅分离膜与胞质。膜局部放大显示脂质双层及胞质侧骨架，间距和蛋白外形为示意。胞质局部以单个去氧血红蛋白展示主要溶质，不表示其在胞质中的数量或浓度。",
    en: "The whole cell uses a biconcave profile with exaggerated membrane thickness and cut edges. Explosion separates membrane and cytosol only. The enlarged membrane patch shows bilayer and cytoplasmic skeleton with schematic spacing and protein shapes. The cytosol detail shows one deoxyhaemoglobin molecule, not its cellular abundance or concentration.",
  },
  parts: {
    erythrocyteMembrane: {
      zh: "连续的脂质双层包围双凹细胞；放大视图显示胞质侧血影蛋白网、短肌动蛋白连接点及带 3–锚蛋白连接示意。仅展示部分连接机制，膜骨架不是规则晶格。",
      en: "A continuous lipid bilayer surrounds the biconcave cell. The enlarged patch shows a schematic cytoplasmic spectrin network, short actin junctions and band 3–ankyrin attachment. Only selected linkages are shown; the skeleton is not a regular crystal lattice.",
    },
    erythrocyteCytosol: {
      zh: "血红蛋白溶于胞质，无膜包裹。局部显示人去氧血红蛋白 2HHB 的实验 Cα 主链：两条 α 链、两条 β 链及四个血红素。保留沉积相对坐标；管径和配色示意，省略侧链、水与离子。去氧态不画结合氧。",
      en: "Haemoglobin is dissolved in cytosol, without a surrounding membrane. Detail uses experimental Cα coordinates of human deoxyhaemoglobin 2HHB: two α chains, two β chains and four hemes in deposited relative positions. Tube radii and colours are illustrative; side chains, water and ions are omitted. No oxygen is drawn in this deoxy state.",
    },
  },
  sources: [
    {
      title: "Fermi et al. (1984) · Human deoxyhaemoglobin 2HHB, 1.74 Å",
      url: "https://www.rcsb.org/structure/2HHB",
    },
    {
      title:
        "Native ultrastructure of the red cell cytoskeleton by cryo-electron tomography (2011)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3218374/",
    },
    {
      title:
        "Structure, dynamics and assembly of the ankyrin complex on human red blood cell membrane (2022)",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9489475/",
    },
  ],
};
