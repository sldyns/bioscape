const bi = (zh, en) => ({ zh, en });
export const neuronRefinementMetadata = {
  scope: bi(
    "代表性有髓多极神经元，非特定脑区或单细胞重建。轴突纵向缩短，郎飞结与膜层厚度放大；局部视图分别调整尺度。髓鞘由胶质细胞形成，省略胶质胞体和突触后靶细胞；颜色、分支数和膜层数为教学示意。",
    "Representative myelinated multipolar neuron, not a reconstruction of a named region or individual cell. Axon length is compressed; nodes and membrane thickness are enlarged. Each detail view uses its own scale. Glial somata and postsynaptic targets are omitted; colours, branching and lamellar counts are schematic.",
  ),
  parts: {
    neuronSoma: bi(
      "不规则胞体与多条树突、轴丘相接。剖面显示核周尼氏体（粗面内质网及核糖体）和线粒体；轴丘不含尼氏体。局部结构以教学尺度展示。",
      "An irregular soma connects to multiple dendrites and the axon hillock. The section exposes perinuclear Nissl substance (rough ER and ribosomes) and mitochondria; the hillock lacks Nissl substance. Detail sizes are adjusted for teaching.",
    ),
    neuronNucleus: bi(
      "带核孔的核膜包围含染色质和核仁的核质。剖面揭示内部组织；核孔数量与染色质路径为示意，不代表基因组序列或固定排列。",
      "A porous nuclear envelope encloses chromatin and a nucleolus. The section reveals internal organization; pore counts and chromatin paths are schematic and do not represent a genome sequence or fixed arrangement.",
    ),
    neuronDendrites: bi(
      "六条初级树突从胞体连续伸出，沿三个空间方向逐渐变细并形成二、三级分支。这里不指定神经元亚型，也不把分支数或树突棘作为所有多极神经元的共同特征。",
      "Six primary dendrites extend continuously from the soma, tapering into secondary and tertiary branches in three dimensions. No neuronal subtype is assigned; this branch count and the presence of dendritic spines are not universal multipolar-neuron features.",
    ),
    neuronAxon: bi(
      "轴丘经未髓鞘化的初始段连接一条连续轴突。局部剖面示意膜下支架及纵行微管束，远端可见髓鞘。膜下支架、微管和轴突粗细并非统一物理比例。",
      "The hillock leads through an unmyelinated initial segment into one continuous axon. The detail shows a submembrane scaffold, longitudinal microtubule bundles and distal myelin. These structures are not drawn at one physical scale.",
    ),
    neuronMyelin: bi(
      "胶质膜反复包绕形成压紧髓鞘；剖面显示选取的膜层与切缘，端部旁结袢逐层接近轴膜。局部放大一段髓鞘；层数和层间距离均为示意，不是膜层计数。",
      "Repeated glial-membrane wrapping forms compact myelin. The section shows selected lamellae and cut edges, with terminal paranodal loops approaching the axolemma. One internode is enlarged; layer count and spacing are schematic.",
    ),
    neuronNodes: bi(
      "相邻髓鞘之间的短裸露轴突区。两侧旁结袢与结区通道簇分开显示，轴突在髓鞘和结区始终连续。结间隙、通道和旁结袢已放大，不代表分子数量。",
      "A short exposed axonal domain between adjacent sheaths. Flanking paranodal loops are distinct from nodal channel clusters, while the axon remains continuous. The nodal gap, channels and loops are enlarged and do not imply molecular counts.",
    ),
    neuronTerminals: bi(
      "轴突末端分支形成突触前膨大。局部剖面放大一个终扣，显示突触小泡、线粒体及突触前活性区；省略突触后靶细胞，不将游离终扣视为完整突触。",
      "Terminal axonal branches form presynaptic boutons. A single enlarged section shows synaptic vesicles, a mitochondrion and the presynaptic active zone. The postsynaptic target is omitted; an isolated bouton is not a complete synapse.",
    ),
  },
  sources: [
    {
      title:
        "Siksou et al. (2007) · Three-dimensional architecture of presynaptic terminal cytomatrix",
      url: "https://pubmed.ncbi.nlm.nih.gov/17596435/",
    },
    {
      title: "Palay et al. (1968) · The axon hillock and the initial segment",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2107452/",
    },
    {
      title:
        "Dutta et al. (2018) · Regulation of myelin structure and conduction velocity by perinodal astrocytes",
      url: "https://www.nichd.nih.gov/sites/default/files/inline-files/Dutta_et_al-2018-PNAS-Regulation_myelin_structure.pdf",
    },
  ],
};
