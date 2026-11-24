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
      zh: "胞质中溶解着血红蛋白。模型沿人去氧血红蛋白 2HHB 的实验 Cα 坐标绘制两条 α 链和两条 β 链。带状部分标出原始结构记录中的螺旋。在四个血红素中，卟啉环各有四个氮与中央铁配位。该去氧态没有结合氧。颜色和带宽用于辨认结构，省略侧链、水及游离离子。",
      en: "Haemoglobin is dissolved in the cytosol. Two α and two β chains follow the experimental Cα coordinates of human deoxyhaemoglobin 2HHB. Ribbons mark helices annotated in the deposition. Each of the four hemes shows its central iron coordinated by four porphyrin nitrogens. The deoxy structure has no bound oxygen. Colours and ribbon widths are illustrative. Side chains, water and free ions are omitted.",
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
