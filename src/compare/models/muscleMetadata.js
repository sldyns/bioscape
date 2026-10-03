const b = (zh, en) => ({ zh, en });
const part = (id, zh, en, color, descZh, descEn) => ({
  id,
  zh,
  en,
  color,
  desc: b(descZh, descEn),
});
export const muscleMetadata = {
  scope: b(
    "一根多核骨骼肌细胞的截取片段；端面是人工截口，纤维在两端继续延伸。剖面去除前侧肌膜；条带颜色、膜厚及代表性细胞器数量作教学处理。肌节、膜与细胞器的独立视图分别放大，不能跨视图直接比较比例。",
    "A cropped segment of one multinucleate skeletal muscle cell; the fibre continues beyond both artificial ends. Section view removes the front sarcolemma. Band colours, membrane thickness and organelle sampling are schematic. Isolated sarcomere, membrane and organelle views are independently magnified; their scales cannot be compared directly.",
  ),
  parts: [
    part(
      "muscleFibreSarcolemma",
      "肌膜",
      "Sarcolemma",
      "#bf8e99",
      "一个连续的细胞膜包围整根肌纤维。放大视图展示弯曲脂质双层及代表性膜蛋白；膜厚和分子数量不按真实比例。",
      "One continuous plasma membrane encloses the fibre. The magnified curved patch shows two lipid leaflets and representative membrane proteins; thickness and molecular counts are schematic.",
    ),
    part(
      "muscleFibreNuclei",
      "周边肌核",
      "Peripheral myonuclei",
      "#9986b4",
      "多个肌核位于同一细胞的肌膜内侧。独立视图放大一个长椭圆肌核，显示双层核被膜、核孔、染色质与核仁；不是多个细胞的集合。",
      "Multiple myonuclei lie beneath the sarcolemma of the same cell. The isolated view enlarges one elongated nucleus with a double envelope, pores, chromatin and nucleolus.",
    ),
    part(
      "muscleFibreMyofibrils",
      "肌原纤维",
      "Myofibrils",
      "#bd8b98",
      "平行的收缩结构由相接肌节组成，邻接肌原纤维的 Z 盘对齐。放大视图揭开一个末端肌节的肌丝排列；条带色彩用于区分区域。",
      "Parallel contractile structures contain serial sarcomeres, with Z discs aligned across neighbours. A local filament-level exposure reveals one terminal repeat; band colours identify regions.",
    ),
    part(
      "muscleFibreSarcomere",
      "示例肌节",
      "Example sarcomere",
      "#af7085",
      "Z 盘至 Z 盘的放大肌节：细肌丝从两端向内延伸，与中央双极粗肌丝交错；I 带只有细肌丝，A 带对应粗肌丝全长，H 区无细肌丝重叠。M 线与肌联蛋白稳定粗肌丝位置。肌丝数量和蛋白外形为简化示意，静态视图不表达收缩状态循环。",
      "An enlarged Z-to-Z sarcomere: thin filaments extend inward from both ends and interdigitate with central bipolar thick filaments. I bands contain thin filaments only; the A band spans the thick filament; the H zone lacks thin-filament overlap. M-line links and titin support alignment. Counts and protein shapes are schematic; this static view does not depict a contraction cycle.",
    ),
    part(
      "muscleFibreSR",
      "肌浆网",
      "Sarcoplasmic reticulum",
      "#91ada8",
      "围绕肌原纤维的开窗管网储存和回收 Ca²⁺。独立视图展示一段纵行管网及靠近 A/I 交界的终池；省略其内部肌原纤维以保持管网清晰。",
      "A fenestrated membrane network around myofibrils stores and retrieves Ca²⁺. The isolated view shows longitudinal tubules and terminal cisternae near A/I boundaries; the enclosed myofibril is omitted for clarity.",
    ),
    part(
      "muscleFibreTriads",
      "三联体",
      "Triads",
      "#c99b68",
      "一个 T 小管夹在两个肌浆网终池之间；小管腔与胞外空间连通，终池腔与其分隔。放大截段显示各自管腔和连接间隙中的释放通道示意；两端为人工截口，终池与 T 小管不是互通的一根管。",
      "A T tubule lies between two terminal SR cisternae. Its lumen communicates with extracellular space; cisternal lumina remain separate. The enlarged cropped junction shows independent lumina and schematic release channels across the junctional gap. The open ends are artificial sections, not biological termini.",
    ),
    part(
      "muscleFibreMitochondria",
      "肌纤维线粒体",
      "Muscle-fibre mitochondria",
      "#b49372",
      "代表性的肌原纤维间线粒体提供能量；数量和形态随纤维类型变化。独立视图放大双层膜、嵴及基质，沿用已精修的线粒体结构模型，不代表特定肌纤维类型的实测形态。",
      "Representative intermyofibrillar mitochondria support energy metabolism; abundance and shape vary with fibre type. The isolated view enlarges outer/inner membranes, cristae and matrix using the refined mitochondrial model, without claiming a measured fibre-type-specific morphology.",
    ),
  ],
  sources: [
    {
      title: "Dulhunty (1989) · Ultrastructure of mammalian triad junctions",
      url: "https://pubmed.ncbi.nlm.nih.gov/2769737/",
    },
    {
      title: "1998 study · Sarcomere length and triad location",
      url: "https://pubmed.ncbi.nlm.nih.gov/9682134/",
    },
    {
      title:
        "Traeger et al. (1983) · Thin-filament arrangement in rat skeletal muscle",
      url: "https://pubmed.ncbi.nlm.nih.gov/6683726/",
    },
    {
      title: "NCBI · Molecular Motors",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26888/",
    },
  ],
};
