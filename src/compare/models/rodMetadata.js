const bi = (zh, en) => ({ zh, en });
const part = (id, zh, en, color, cn, english) => ({
  id,
  zh,
  en,
  color,
  desc: bi(cn, english),
});

export const rodSpecimen = {
  id: "rodPhotoreceptor",
  zh: "视杆细胞",
  en: "Rod photoreceptor",
  color: "#788696",
  summary: bi(
    "成年小鼠视杆细胞在外节感受微弱光线，经内节、含核胞体和轴突，把信号传至突触小球。",
    "An adult mouse rod detects dim light in its outer segment. Its inner segment, nucleated soma and axon lead to the synaptic spherule.",
  ),
  size: bi(
    "小鼠外节长约 24 µm，直径约 1.4 µm",
    "Mouse outer segment about 24 µm long and 1.4 µm across",
  ),
  scope: bi(
    "整体沿细胞长轴缩短，以 29 个成熟膜盘代表盘堆。膜厚、盘间距、纤毛和标记的色素位点均放大。剖面移走前侧膜，保留可辨认的轴丝；独立近景各自放大。示意图省略基部新生盘、突触后细胞及相邻感光细胞。分子近景采用牛源视紫红质的实验暗态结构。",
    "The cell axis is shortened and 29 mature discs represent the stack. Membrane thickness, interdiscal gaps, the connecting cilium and the pigment marker are enlarged. Cutaways remove the facing membrane and retain the axoneme. Each detail has its own scale. New basal discs, postsynaptic processes and neighbouring cells are omitted. The molecular view uses an experimental dark-state bovine rhodopsin structure.",
  ),
  facts: {
    boundary: bi(
      "连续质膜包围一个神经感觉细胞；成熟外节膜盘各有独立盘腔。",
      "One plasma membrane encloses the sensory neuron. Each mature outer-segment disc encloses its own lumen.",
    ),
    genome: bi(
      "胞体含一个细胞核。成年小鼠视杆细胞的致密异染色质集中于核中央。",
      "The soma contains one nucleus. Dense heterochromatin is concentrated centrally in an adult mouse rod.",
    ),
    organization: bi(
      "外节和内节经连接纤毛相连，内节椭球部富含线粒体，轴突末端形成突触小球。",
      "A connecting cilium joins the outer and inner segments. Mitochondria occupy the ellipsoid of the inner segment, and the axon ends in a spherule.",
    ),
    function: bi(
      "视紫红质吸收光子，引发光转导；突触小球向下游视网膜神经元传递信号。",
      "Photon absorption by rhodopsin initiates phototransduction. The spherule conveys the signal to downstream retinal neurons.",
    ),
  },
  parts: [
    part(
      "rodOuterSegment",
      "外节",
      "Outer segment",
      "#788696",
      "外节是一段特化的感觉纤毛。质膜包围横向堆叠的膜盘。剖面可见盘缘和质膜之间狭窄的胞质空间。",
      "The outer segment is a specialized sensory cilium. Its plasma membrane encloses the transverse disc stack. The section exposes the cytoplasmic space between disc rims and plasma membrane.",
    ),
    part(
      "rodDiscs",
      "成熟膜盘",
      "Mature discs",
      "#b69567",
      "每个成熟膜盘的两面经弯曲盘缘相接，围成独立腔室。小鼠盘缘有一处向内延伸的切迹。近景拉开三个膜盘，以辨认盘内腔及盘间胞质。",
      "The two faces of each mature disc join around a curved rim and enclose a separate lumen. A single incisure enters from the mouse disc rim. Three spaced discs distinguish intradiscal lumen from interdiscal cytosol.",
    ),
    part(
      "rodConnectingCilium",
      "连接纤毛",
      "Connecting cilium",
      "#a2a5b0",
      "连接纤毛内有九组微管双联体，中央无微管对。每组的 A 管为完整管，B 管与其共壁。截口以深赭色标出 A 管、浅赭色标出 B 管，侧面可见通向纤毛膜的 Y 形连接。",
      "Nine microtubule doublets form a ring without a central microtubule pair. Each complete A tubule shares part of its wall with an incomplete B tubule. Dark ochre marks A tubules and pale ochre marks B tubules at the crop. Y-links connect the doublets to the ciliary membrane.",
    ),
    part(
      "rodInnerSegment",
      "内节与含核胞体",
      "Inner segment and soma",
      "#a3a4aa",
      "内节远端的椭球部排列着纵向线粒体，胞体内有一个核。剖面展示线粒体嵴、肌样部的高尔基体，以及成年小鼠视杆细胞核中央的致密异染色质。",
      "Longitudinal mitochondria occupy the distal ellipsoid of the inner segment. The adjacent soma contains one nucleus. Sectioning reveals mitochondrial crista profiles, the Golgi complex in the myoid, and central heterochromatin characteristic of adult mouse rods.",
    ),
    part(
      "rodSpherule",
      "突触小球",
      "Synaptic spherule",
      "#9292a1",
      "轴突末端质膜向内凹陷。弯曲的突触带位于内陷顶部，基部靠近弓形致密区，两侧系有突触小泡。图中只显示突触前结构。",
      "The axon terminal has a plasma-membrane invagination. A curved ribbon above its roof faces an arciform density at its base. Tethered synaptic vesicles line its sides. The view shows the presynaptic terminal.",
    ),
    part(
      "rodRhodopsin",
      "视紫红质",
      "Rhodopsin",
      "#92566d",
      "视紫红质位于外节膜盘的膜内。整体模型标出一个放大的位点。分子近景采用牛源暗态晶体结构 1U19，显示七条跨膜螺旋与结合的 11-顺式视黄醛。",
      "Rhodopsin occupies the disc membrane. One enlarged site locates it in the whole cell. The molecular view uses dark-state bovine structure 1U19, showing seven transmembrane helices and bound 11-cis-retinal.",
    ),
  ],
  sources: [
    {
      title:
        "Carter-Dawson & LaVail · Mouse rods and cones by light and electron microscopy",
      url: "https://pubmed.ncbi.nlm.nih.gov/500858/",
    },
    {
      title:
        "Pöge et al. · Nanoscale architecture of the mouse rod outer segment",
      url: "https://elifesciences.org/articles/72817",
    },
    {
      title:
        "Centriole and transition-zone structures in mouse photoreceptor cilia by cryo-electron tomography",
      url: "https://pubmed.ncbi.nlm.nih.gov/38182160/",
    },
    {
      title:
        "Super-resolution localization of the Golgi in mouse rod inner segments",
      url: "https://doi.org/10.1371/journal.pbio.3002467",
    },
    {
      title: "Mitochondrial arrangement in photoreceptor inner segments",
      url: "https://pubmed.ncbi.nlm.nih.gov/32571921/",
    },
    {
      title:
        "Solovei et al. · Nuclear architecture of mammalian rod photoreceptors",
      url: "https://pubmed.ncbi.nlm.nih.gov/19379699/",
    },
    {
      title:
        "Serial electron microscopy of mouse and primate rod synaptic terminals",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9287620/",
    },
    {
      title: "Experimental bovine rhodopsin structure · PDB 1U19",
      url: "https://www.rcsb.org/structure/1U19",
    },
  ],
};
