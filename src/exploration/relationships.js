import { children } from "../hierarchy";
import { processesByRoot } from "../processes/catalog";

// This is a location catalogue, not a list inferred from names or categories.
// Times are normalized stage boundaries in the corresponding *Process.js.
// Only metadata is imported here: opening the structure view never loads scenes.
const label = (zh, en) => ({ zh, en });
const links = (root, entries, scope) => [
  ...entries.map(([path, at = 0, text, when]) => ({
    path: [root, ...path.split("/")],
    at,
    ...(text ? { label: text } : {}),
    ...(when ? { when } : {}),
  })),
  { path: [root], at: 0, ...(scope ? { label: scope } : {}) },
];

// These shared paths explicitly name the three nuclear contexts. In particular,
// nuclear DNA mechanisms must not be attached to mitochondrial/plastid DNA.
const nuclearDNA = () => ({
  cell: links("cell", [
    ["nucleus"],
    ["nucleus/chromatin"],
    ["nucleus/chromatin/dna"],
    ["nucleus/chromatin/nucleosome/dna"],
  ]),
  plant: links("plant", [
    ["plantNucleus"],
    ["plantNucleus/chromatin"],
    ["plantNucleus/chromatin/dna"],
    ["plantNucleus/chromatin/nucleosome/dna"],
  ]),
  yeast: links("yeast", [["yeastNucleus"], ["yeastNucleus/yeastChromatin"]]),
});

const cytosolicYeast = label(
  "酵母细胞质中的过程；结构目录暂无独立的细胞质节点",
  "A yeast cytosolic process; no separate cytosol view is available",
);
const cytosolicParamecium = label(
  "草履虫细胞质中的翻译；结构目录暂无独立的核糖体节点",
  "Cytosolic translation in Paramecium; no separate ribosome view is available",
);

const relationships = {
  secretion: {
    cell: links("cell", [
      ["roughER", 0],
      ["roughER/erCisternae", 0],
      ["golgi", 0.2],
      ["golgi/golgiCisternae", 0.42],
      ["golgi/vesicles", 0.67],
      ["golgi/vesicles/cargo", 0.67],
      ["golgi/vesicles/vesicleMembrane", 0.78],
      ["membrane", 0.9],
    ]),
  },
  transcription: {
    cell: nuclearDNA().cell,
    plant: nuclearDNA().plant,
  },
  photosynthesis: {
    plant: links("plant", [
      ["chloroplast", 0],
      ["chloroplast/thylakoids", 0.14],
      ["chloroplast/stroma", 0.66],
      ["chloroplast/stroma/rubisco", 0.66],
    ]),
  },
  infection: {
    phage: links("phage", [
      ["phageFibers", 0],
      ["phageBaseplate", 0],
      ["phageTail", 0.32],
      ["phageTail/phageSheath", 0.32],
      ["phageTail/phageTube", 0.6],
      ["phageHead", 0.6],
      ["phageGenome", 0.6],
    ]),
  },
  replication: nuclearDNA(),
  dnaRepair: nuclearDNA(),
  transduction: {
    bacterium: links("bacterium", [
      ["nucleoid", 0.16],
      ["nucleoid/bacterialDNA", 0.16],
      ["bacterialCytoplasm", 0.71],
    ]),
    phage: links(
      "phage",
      [],
      label(
        "P1 与 λ 转导示例；本结构页的收缩尾噬菌体不是这两种模型",
        "P1 and lambda transduction; the structural specimen is a different contractile-tailed phage",
      ),
    ),
  },
  bacterialSporulation: {
    bacterium: links(
      "bacterium",
      [],
      label(
        "枯草芽孢杆菌内生孢子；大肠杆菌结构范例不形成内生孢子",
        "B. subtilis endospores; the E. coli structural specimen does not form endospores",
      ),
    ),
  },
  promoterRegulation: {
    cell: nuclearDNA().cell,
  },
  enhancerRegulation: {
    cell: nuclearDNA().cell,
  },
  chromatinAccess: {
    cell: links("cell", [
      ["nucleus/chromatin", 0],
      ["nucleus/chromatin/nucleosome", 0],
      ["nucleus/chromatin/nucleosome/histones", 0],
      ["nucleus/chromatin/nucleosome/dna", 0.34],
      ["nucleus/chromatin/dna", 0.64],
    ]),
    plant: links("plant", [
      ["plantNucleus/chromatin", 0],
      ["plantNucleus/chromatin/nucleosome", 0],
      ["plantNucleus/chromatin/nucleosome/histones", 0],
      ["plantNucleus/chromatin/nucleosome/dna", 0.34],
      ["plantNucleus/chromatin/dna", 0.64],
    ]),
    yeast: links("yeast", [["yeastNucleus/yeastChromatin", 0]]),
  },
  tad: {
    cell: links("cell", [
      ["nucleus/chromatin", 0],
      ["nucleus/chromatin/dna", 0.36],
    ]),
  },
  plantGenome: {
    plant: links("plant", [
      ["plantNucleus", 0.12],
      ["plantNucleus/chromatin", 0.12],
      ["plantNucleus/nuclearPores", 0.12],
      ["plantRibosome", 0.34],
      ["plantCytoplasm", 0.34],
      ["chloroplast/chloroplastEnvelope", 0.57],
      ["plantMitochondria", 0.57],
      ["chloroplast/stroma/plastidDNA", 0.77],
      ["plantMitochondria/plantMatrix", 0.77],
    ]),
  },
  plantRdDM: {
    plant: links("plant", [
      ["plantNucleus", 0],
      ["plantNucleus/chromatin", 0],
      ["plantNucleus/chromatin/dna", 0.82],
    ]),
  },
  rnaProcessing: {
    cell: links("cell", [["nucleus", 0]]),
    plant: links("plant", [["plantNucleus", 0]]),
  },
  nuclearTransport: {
    cell: links("cell", [
      ["nucleus/envelope", 0],
      ["nucleus/nuclearPores", 0.34],
      ["cytoplasm/cytosol", 0.16],
    ]),
    plant: links("plant", [
      ["plantNucleus/envelope", 0],
      ["plantNucleus/nuclearPores", 0.34],
      ["plantCytoplasm", 0.16],
    ]),
    yeast: links("yeast", [
      ["yeastNucleus/yeastNuclearEnvelope", 0],
      ["yeastNucleus/yeastNuclearPores", 0.34],
    ]),
  },
  motorTransport: {
    cell: links("cell", [
      ["cytoskeleton/microtubules", 0],
      ["cytoskeleton/microtubules/tubulinDimer", 0],
      ["golgi/vesicles", 0.15],
      ["cytoplasm/cytosol", 0.48],
    ]),
  },
  organelleImport: {
    plant: links("plant", [
      ["plantCytoplasm", 0],
      ["chloroplast", 0.16],
      ["chloroplast/chloroplastEnvelope", 0.16],
      ["chloroplast/stroma", 0.55],
    ]),
  },
  translation: {
    cell: links("cell", [
      ["ribosomes", 0],
      ["ribosomes/smallSubunit", 0.13],
      ["ribosomes/largeSubunit", 0.33],
      ["ribosomes/mrna", 0.13],
      ["ribosomes/trna", 0.13],
      [
        "roughER/boundRibosomes",
        0,
        label(
          "附着与游离核糖体共有的翻译机制",
          "Translation mechanism shared by bound and free ribosomes",
        ),
      ],
      ["roughER/boundRibosomes/smallSubunit", 0.13],
      ["roughER/boundRibosomes/largeSubunit", 0.33],
      ["roughER/boundRibosomes/mrna", 0.13],
      ["roughER/boundRibosomes/trna", 0.13],
      ["cytoplasm/cytosol", 0],
    ]),
    plant: links("plant", [
      ["plantRibosome", 0],
      ["plantRibosome/plant40S", 0.13],
      ["plantRibosome/plant60S", 0.33],
      ["plantRibosome/mrna", 0.13],
      ["plantRibosome/trna", 0.13],
      [
        "plantER/plantRibosome",
        0,
        label(
          "附着与游离核糖体共有的翻译机制",
          "Translation mechanism shared by bound and free ribosomes",
        ),
      ],
      ["plantER/plantRibosome/plant40S", 0.13],
      ["plantER/plantRibosome/plant60S", 0.33],
      ["plantER/plantRibosome/mrna", 0.13],
      ["plantER/plantRibosome/trna", 0.13],
      ["plantCytoplasm", 0],
    ]),
    yeast: links("yeast", [], cytosolicYeast),
    paramecium: links("paramecium", [], cytosolicParamecium),
  },
  proteinFolding: {
    cell: links("cell", [
      ["ribosomes", 0],
      ["ribosomes/largeSubunit", 0],
      ["cytoplasm/cytosol", 0.15],
    ]),
    plant: links("plant", [
      ["plantRibosome", 0],
      ["plantRibosome/plant60S", 0],
      ["plantCytoplasm", 0.15],
    ]),
    yeast: links("yeast", [], cytosolicYeast),
  },
  alternativeSplicing: {
    cell: links("cell", [["nucleus", 0]]),
  },
  nitrogenFixation: {
    bacterium: links("bacterium", [
      [
        "bacterialCytoplasm",
        0,
        label(
          "棕色固氮菌细胞质中的固氮酶",
          "Nitrogenase in A. vinelandii cytosol",
        ),
      ],
    ]),
  },
  rnaSilencing: {
    cell: links("cell", [
      ["cytoplasm/cytosol", 0],
      ["ribosomes/mrna", 0.18],
    ]),
  },
  proteasome: {
    cell: links("cell", [["cytoplasm/cytosol", 0]]),
    plant: links("plant", [["plantCytoplasm", 0]]),
    yeast: links("yeast", [], cytosolicYeast),
  },
  crispr: {
    bacterium: links("bacterium", [
      [
        "bacterialCytoplasm",
        0,
        label(
          "化脓性链球菌 Cas9 干扰示例",
          "S. pyogenes Cas9 interference example",
        ),
      ],
    ]),
  },
  bacterialRepair: {
    bacterium: links("bacterium", [
      ["nucleoid", 0],
      ["nucleoid/bacterialDNA", 0],
      ["bacterialCytoplasm", 0.38],
    ]),
  },
  respiration: {
    cell: links("cell", [
      ["mitochondria", 0],
      ["mitochondria/mitoInner", 0],
      ["mitochondria/mitoInner/cristae", 0.33],
      ["mitochondria/mitoInner/atpSynthase", 0.67],
    ]),
    plant: links("plant", [
      ["plantMitochondria", 0],
      ["plantMitochondria/mitoInner", 0],
      ["plantMitochondria/mitoInner/cristae", 0.33],
      ["plantMitochondria/mitoInner/atpSynthase", 0.67],
    ]),
    yeast: links("yeast", [["yeastMito", 0]]),
    paramecium: links("paramecium", [["paraMito", 0]]),
  },
  glycolysis: {
    cell: links("cell", [
      ["cytoplasm/cytosol", 0],
      ["cytoplasm/cytosol/cytosolicEnzyme", 0.27],
    ]),
    plant: links("plant", [["plantCytoplasm", 0]]),
    yeast: links("yeast", [], cytosolicYeast),
  },
  bacterialEnergetics: {
    bacterium: links("bacterium", [
      ["bacterialEnvelope/bacterialMembrane", 0],
      ["bacterialEnvelope/bacterialMembrane/bacterialATPase", 0.66],
    ]),
  },
  bacterialPhotosynthesis: {
    bacterium: links(
      "bacterium",
      [],
      label(
        "集胞藻 PCC 6803 类囊体；结构范例暂无蓝细菌类囊体",
        "Synechocystis PCC 6803 thylakoid; no cyanobacterial thylakoid structure view is available",
      ),
    ),
  },
  diffusion: {
    cell: links("cell", [
      ["membrane", 0],
      ["membrane/bilayer", 0.38, undefined, { route: "oxygen" }],
      ["membrane/membraneProteins", 0.38, undefined, { route: "water" }],
    ]),
    plant: links("plant", [
      ["plantMembrane", 0],
      ["plantMembrane/plantAquaporin", 0.38, undefined, { route: "water" }],
    ]),
    bacterium: links("bacterium", [["bacterialEnvelope/bacterialMembrane", 0]]),
    yeast: links("yeast", [["yeastMembrane", 0]]),
  },
  activeTransport: {
    cell: links("cell", [
      ["membrane", 0],
      ["membrane/membraneProteins", 0.2],
      ["cytoplasm/cytosol/waterIons", 0],
    ]),
  },
  osmoticBalance: {
    cell: links(
      "cell",
      [["membrane", 0.38]],
      label(
        "成熟哺乳动物红细胞的渗透响应示例",
        "Osmotic response of a mature mammalian erythrocyte",
      ),
    ),
    erythrocyte: links(
      "erythrocyte",
      [
        ["erythrocyteMembrane", 0.38],
        [
          "erythrocyteCytosol",
          0.18,
          label(
            "水与细胞内溶液的渗透交换",
            "Osmotic water exchange with the intracellular solution",
          ),
        ],
      ],
      label(
        "成熟红细胞的短时渗透形态响应；不模拟溶血。",
        "Short-term osmotic shape response of a mature erythrocyte; hemolysis is not simulated.",
      ),
    ),
  },
  bacterialCellWall: {
    bacterium: links("bacterium", [
      ["bacterialEnvelope/peptidoglycan", 0.35],
      ["bacterialEnvelope/bacterialMembrane", 0.17],
    ]),
  },
  endocytosis: {
    cell: links("cell", [
      ["membrane", 0],
      ["membrane/membraneProteins", 0],
    ]),
  },
  autophagy: {
    cell: links("cell", [
      ["cytoplasm/cytosol", 0],
      ["lysosome", 0.54],
      ["lysosome/lysosomalMembrane", 0.65],
      ["lysosome/hydrolases", 0.9],
      ["lysosome/recycling", 0.9],
    ]),
  },
  mitosis: {
    cell: links("cell", [
      ["nucleus/chromatin", 0],
      ["centrosome", 0.19],
      ["cytoskeleton/microtubules", 0.19],
      ["cytoskeleton/actin", 0.71],
      ["membrane", 0.71],
    ]),
  },
  meiosis: {
    cell: links("cell", [
      ["nucleus/chromatin", 0],
      ["nucleus/chromatin/dna", 0.14],
      ["cytoskeleton/microtubules", 0.28],
    ]),
  },
  signalTransduction: {
    cell: links("cell", [
      ["membrane", 0],
      ["membrane/membraneProteins", 0.23],
      ["cytoplasm/cytosol", 0.51],
      ["nucleus/nuclearPores", 0.78],
      ["nucleus/chromatin", 0.93],
    ]),
  },
  apoptosis: {
    cell: links("cell", [
      ["mitochondria", 0],
      ["mitochondria/mitoOuter", 0.16],
      ["cytoplasm/cytosol", 0.43],
      ["nucleus/envelope", 0.59],
      ["nucleus/chromatin", 0.59],
      ["membrane", 0.81],
    ]),
  },
  differentiation: {
    cell: links(
      "cell",
      [
        ["nucleus", 0.17],
        ["ribosomes", 0.32],
        ["nucleus/chromatin", 0.5],
        ["cytoskeleton", 0.68],
        ["membrane", 0.68],
      ],
      label(
        "小鼠已定向红系细胞的终末分化",
        "Terminal differentiation of a committed mouse erythroblast",
      ),
    ),
  },
  immuneResponse: {
    cell: links("cell", [
      ["cytoplasm/cytosol", 0],
      ["roughER", 0.19],
      ["roughER/erCisternae", 0.35],
      ["golgi", 0.5],
      ["golgi/vesicles", 0.5],
      ["membrane", 0.81],
      ["membrane/membraneProteins", 0.81],
    ]),
  },
  actionPotential: {
    cell: links(
      "cell",
      [
        ["membrane", 0],
        ["membrane/membraneProteins", 0.24],
        ["cytoplasm/cytosol/waterIons", 0.24],
      ],
      label(
        "哺乳动物无髓鞘轴突的动作电位",
        "Action potential in a mammalian unmyelinated axon",
      ),
    ),
    neuron: links(
      "neuron",
      [
        [
          "neuronAxon",
          0.42,
          label(
            "用无髓轴突示例观察膜电信号再生",
            "Membrane-signal regeneration illustrated with an unmyelinated axon",
          ),
        ],
      ],
      label(
        "结构页为有髓神经元；过程展示无髓轴突连续传导，不模拟跳跃式传导",
        "The structural neuron is myelinated; the process shows continuous conduction in an unmyelinated axon, not saltatory conduction",
      ),
    ),
  },
  synapse: {
    cell: links(
      "cell",
      [
        ["membrane", 0.38],
        ["membrane/membraneProteins", 0.56],
        ["cytoplasm/cytosol/waterIons", 0.26],
      ],
      label(
        "哺乳动物谷氨酸突触；涉及多个细胞",
        "Mammalian glutamatergic synapse involving multiple cells",
      ),
    ),
    neuron: links(
      "neuron",
      [
        ["neuronTerminals", 0.38],
        [
          "neuronDendrites",
          0.56,
          label(
            "谷氨酸突触后树突的 AMPA 受体响应",
            "AMPA-receptor response in a glutamatergic postsynaptic dendrite",
          ),
        ],
      ],
      label(
        "谷氨酸突触示例同时包含突触前神经元、突触后神经元及星形胶质细胞",
        "The glutamatergic example includes presynaptic and postsynaptic neurons plus an astrocyte",
      ),
    ),
  },
  muscle: {
    cell: links(
      "cell",
      [["cytoskeleton/actin", 0.31]],
      label(
        "哺乳动物骨骼肌肌小节示例",
        "Mammalian skeletal-muscle sarcomere example",
      ),
    ),
    muscleFibre: links(
      "muscleFibre",
      [
        ["muscleFibreSarcomere", 0],
        ["muscleFibreMyofibrils", 0.43],
      ],
      label(
        "放大一个骨骼肌肌小节的横桥循环；不展示完整的兴奋—收缩耦联。",
        "Cross-bridge cycling in one enlarged skeletal-muscle sarcomere; the full excitation–contraction sequence is not shown.",
      ),
    ),
  },
  ciliaryMotion: {
    paramecium: links("paramecium", [
      ["paraCilia", 0],
      ["paraCilia/paraAxoneme", 0.17],
    ]),
  },
  plasmolysis: {
    plant: links("plant", [
      ["vacuole", 0.3],
      ["vacuole/tonoplast", 0.3],
      ["plantMembrane", 0.49],
      ["cellWall", 0.49],
    ]),
  },
  stomata: {
    plant: links(
      "plant",
      [
        ["plantMembrane/plasmaPump", 0.12],
        ["plantMembrane", 0.26],
        ["vacuole", 0.26],
        ["cellWall", 0.46],
      ],
      label(
        "拟南芥保卫细胞对；不是叶肉细胞",
        "A pair of Arabidopsis guard cells, distinct from mesophyll",
      ),
    ),
  },
  plantLongDistanceTransport: {
    plant: links(
      "plant",
      [["cellWall", 0.15]],
      label(
        "根—茎—叶组织中的木质部运输",
        "Xylem transport across root, stem and leaf tissues",
      ),
    ),
  },
  chloroplastMovement: {
    plant: links("plant", [
      ["chloroplast", 0.13],
      ["plantCytoplasm", 0.69],
      ["vacuole", 0],
    ]),
  },
  plantDivision: {
    plant: links("plant", [
      ["plantNucleus/chromatin", 0.16],
      ["plantGolgi/vesicles", 0.43],
      ["cellWall", 0.9],
      ["plantMembrane", 0.9],
    ]),
  },
  cellWallGrowth: {
    plant: links("plant", [
      ["cellWall", 0],
      ["plantMembrane", 0.15],
      ["cellWall/cellulose", 0.32],
      ["cellWall/cellulose/glucanChain", 0.32],
      ["cellWall/wallMatrix", 0.68],
    ]),
  },
  doubleFertilization: {
    plant: links(
      "plant",
      [],
      label(
        "被子植物胚珠与雌雄配子；叶肉细胞结构页没有这些细胞类型",
        "Angiosperm ovule and gametes; these cell types are absent from the mesophyll structure view",
      ),
    ),
  },
  fungalHyphae: {
    yeast: links(
      "yeast",
      [],
      label(
        "粗糙脉孢菌菌丝顶端生长；不是酿酒酵母出芽",
        "Neurospora crassa hyphal-tip growth, distinct from S. cerevisiae budding",
      ),
    ),
  },
  auxin: {
    plant: links("plant", [
      ["plantNucleus", 0],
      ["plantNucleus/chromatin", 0.71],
    ]),
  },
  plantDefense: {
    plant: links("plant", [
      ["plantMembrane", 0],
      [
        "cellWall",
        0.87,
        label("细胞壁侧的活性氧输出", "ROS output on the cell-wall side"),
      ],
    ]),
  },
  plantTransport: {
    plant: links("plant", [
      ["plantMembrane", 0],
      ["plantMembrane/plasmaPump", 0.13],
    ]),
  },
  plasmodesmata: {
    plant: links("plant", [
      ["cellWall/plasmodesmata", 0],
      ["cellWall/plasmodesmata/pdMembrane", 0.16],
      ["cellWall/plasmodesmata/pdDesmotubule", 0.74],
      ["plantER", 0.74],
      ["plantCytoplasm", 0.16],
    ]),
  },
  photorespiration: {
    plant: links("plant", [
      ["chloroplast/stroma/rubisco", 0],
      ["plantMitochondria", 0.36],
      ["plantMitochondria/plantMatrix", 0.51],
      ["chloroplast/stroma", 0.8],
    ]),
  },
  c4cam: {
    plant: links(
      "plant",
      [
        ["plantCytoplasm", 0.1],
        [
          "cellWall/plasmodesmata",
          0.26,
          label(
            "C₄ 分支的细胞间运输",
            "Intercellular transport in the C4 branch",
          ),
          { strategy: "c4" },
        ],
        [
          "vacuole",
          0.26,
          label(
            "CAM 分支的夜间酸储存",
            "Nocturnal acid storage in the CAM branch",
          ),
          { strategy: "cam" },
        ],
        ["chloroplast/stroma", 0.51],
        ["chloroplast/stroma/rubisco", 0.71],
      ],
      label(
        "玉米 C₄ 与伽蓝菜 CAM 的特化示例",
        "Specialized maize C4 and Kalanchoe CAM examples",
      ),
    ),
  },
  lacOperon: {
    bacterium: links("bacterium", [
      ["nucleoid", 0.53],
      ["nucleoid/bacterialDNA", 0.53],
      ["bacterialCytoplasm", 0.16],
    ]),
  },
  trpOperon: {
    bacterium: links("bacterium", [
      ["nucleoid", 0.14],
      ["nucleoid/bacterialDNA", 0.14],
      ["bacterialRibosome", 0.31],
      ["bacterialCytoplasm", 0.66],
    ]),
  },
  yeastGal: {
    yeast: links("yeast", [
      ["yeastNucleus", 0],
      ["yeastNucleus/yeastChromatin", 0],
    ]),
  },
  yeastOsmoregulation: {
    yeast: links("yeast", [
      ["yeastMembrane", 0.15],
      ["yeastNucleus", 0.49],
    ]),
  },
  bacterialExpression: {
    bacterium: links("bacterium", [
      ["nucleoid", 0.18],
      ["nucleoid/bacterialDNA", 0.18],
      ["bacterialRibosome", 0.65],
      ["bacterialRibosome/bacterial30S", 0.65],
      ["bacterialRibosome/bacterial50S", 0.84],
      ["bacterialCytoplasm", 0.84],
    ]),
  },
  bacterialDivision: {
    bacterium: links("bacterium", [
      ["nucleoid", 0.17],
      ["nucleoid/bacterialDNA", 0.17],
      ["bacterialEnvelope", 0.68],
      ["bacterialEnvelope/peptidoglycan", 0.68],
      ["bacterialEnvelope/bacterialMembrane", 0.68],
    ]),
  },
  conjugation: {
    // The structural pili children are FimA/FimH type-1 adhesion pili, not
    // the F-plasmid conjugative pilus shown in this process.
    bacterium: links("bacterium", [
      ["plasmids", 0.34],
      ["plasmids/bacterialDNA", 0.49],
    ]),
  },
  transformation: {
    bacterium: links(
      "bacterium",
      [
        [
          "bacterialCytoplasm",
          0.51,
          label(
            "枯草芽孢杆菌的胞质 DNA 处理",
            "Cytoplasmic DNA processing in B. subtilis",
          ),
        ],
      ],
      label(
        "枯草芽孢杆菌自然转化；单层细胞质膜的革兰阳性菌",
        "Natural transformation in Gram-positive B. subtilis with one cytoplasmic membrane",
      ),
    ),
  },
  chemotaxis: {
    bacterium: links("bacterium", [
      ["flagellum", 0],
      ["flagellum/flagellarFilament", 0],
      ["bacterialEnvelope/bacterialMembrane", 0.18],
      ["flagellum/flagellarMotor", 0.38],
      ["flagellum/flagellarMotor/motorRotor", 0.38],
    ]),
  },
  twoComponent: {
    bacterium: links("bacterium", [
      ["bacterialEnvelope/bacterialMembrane", 0],
      ["bacterialCytoplasm", 0.51],
      ["nucleoid", 0.7],
      ["nucleoid/bacterialDNA", 0.7],
    ]),
  },
  quorumSensing: {
    bacterium: links(
      "bacterium",
      [
        [
          "bacterialCytoplasm",
          0.51,
          label(
            "费氏弧菌的 LuxR–AHL 信号",
            "LuxR–AHL signaling in V. fischeri",
          ),
        ],
      ],
      label(
        "费氏弧菌 LuxI–LuxR 群体感应示例",
        "V. fischeri LuxI–LuxR quorum-sensing example",
      ),
    ),
  },
  biofilm: {
    bacterium: links(
      "bacterium",
      [],
      label(
        "铜绿假单胞菌 PAO1 生物膜；结构目录暂无细胞外基质",
        "P. aeruginosa PAO1 biofilm; extracellular matrix is not represented in the structure catalogue",
      ),
    ),
  },
  yeastBudding: {
    yeast: links("yeast", [
      ["yeastBud", 0.14],
      ["yeastNucleus", 0.34],
      ["yeastNucleus/yeastNuclearEnvelope", 0.5],
      ["yeastNucleus/yeastChromatin", 0.5],
      ["yeastBud/yeastSeptum", 0.73],
      ["yeastWall", 0.89],
    ]),
  },
  yeastFermentation: {
    yeast: links("yeast", [], cytosolicYeast),
  },
  yeastMating: {
    yeast: links("yeast", [
      ["yeastWall", 0.43],
      ["yeastMembrane", 0.55],
      ["yeastNucleus", 0.69],
      ["yeastNucleus/yeastNuclearEnvelope", 0.69],
    ]),
  },
  yeastSporulation: {
    yeast: links(
      "yeast",
      [
        ["yeastNucleus", 0.14],
        ["yeastNucleus/yeastChromatin", 0.14],
        ["yeastNucleus/yeastNuclearEnvelope", 0.31],
      ],
      label(
        "二倍体酿酒酵母的减数分裂与产孢",
        "Meiosis and sporulation in diploid S. cerevisiae",
      ),
    ),
  },
  parameciumFeeding: {
    paramecium: links("paramecium", [
      ["paraCilia", 0],
      ["paraOral", 0.18],
      ["paraFood", 0.34],
    ]),
  },
  contractileVacuole: {
    paramecium: links("paramecium", [
      ["paraContractile/paraRadial", 0.18],
      ["paraContractile", 0.42],
      ["paraSurface", 0.8],
    ]),
  },
  parameciumDivision: {
    paramecium: links("paramecium", [
      ["paraOral", 0.16],
      ["paraMicro", 0.33],
      ["paraMicro/paraMicroEnvelope", 0.33],
      ["paraMicro/paraMicroChromatin", 0.33],
      ["paraMacro", 0.53],
      ["paraMacro/paraMacroChromatin", 0.53],
      ["paraSurface", 0.73],
    ]),
  },
  parameciumConjugation: {
    paramecium: links("paramecium", [
      ["paraSurface", 0],
      ["paraMicro", 0.14],
      ["paraMicro/paraMicroChromatin", 0.14],
      ["paraMacro", 0.8],
      ["paraMacro/paraMacroChromatin", 0.8],
    ]),
  },
  phageLytic: {
    phage: links("phage", [
      ["phageFibers", 0],
      ["phageTail", 0],
      ["phageGenome", 0.34],
      ["phageHead", 0.52],
    ]),
  },
  phageLysogenic: {
    phage: links(
      "phage",
      [],
      label(
        "λ 噬菌体溶原示例；λ 的长尾不收缩，区别于结构页的收缩尾",
        "Lambda lysogeny; its long noncontractile tail differs from the contractile-tailed structural specimen",
      ),
    ),
  },
  phageAssembly: {
    phage: links("phage", [
      ["phageHead", 0.15],
      ["phageHead/phageCapsomers", 0.15],
      ["phageGenome", 0.5],
      ["phageTail", 0.69],
      ["phageBaseplate", 0.69],
      ["phageFibers", 0.83],
    ]),
  },
  phagePackaging: {
    phage: links("phage", [
      ["phageGenome", 0.3],
      ["phageHead", 0.51],
      ["phageHead/phageCapsomers", 0.51],
    ]),
  },
};

const validPath = (path) =>
  Array.isArray(path) &&
  path.length > 0 &&
  Object.hasOwn(processesByRoot, path[0]) &&
  path.every(
    (id, index) =>
      typeof id === "string" &&
      (index === 0 || children[path[index - 1]]?.includes(id)),
  );

// Animal organelles have both cell/X and cell/cytoplasm/X entry points.
// Remove this alias only after validating the actual user path. Do not collapse
// generic node IDs across species, ribosome contexts, or nuclear compartments.
const canonicalPath = (path) =>
  path[0] === "cell" &&
  path[1] === "cytoplasm" &&
  path.length > 2 &&
  children.cell.includes(path[2])
    ? ["cell", ...path.slice(2)]
    : path;

const prefix = (ancestor, descendant) =>
  ancestor.length <= descendant.length &&
  ancestor.every((id, index) => id === descendant[index]);

/**
 * Full root-prefixed destinations for a supported process. Specific locations
 * precede the root fallback. Labels, when present, qualify the biological scope.
 * Returned paths/labels are independent copies safe for navigation consumers.
 */
export function getStructuresForProcess(rootId, processId) {
  if (
    !Object.hasOwn(processesByRoot, rootId) ||
    !processesByRoot[rootId].includes(processId) ||
    !Object.hasOwn(relationships, processId)
  )
    return [];
  return (relationships[processId][rootId] || []).map((entry) => ({
    ...entry,
    path: [...entry.path],
    ...(entry.when ? { when: { ...entry.when } } : {}),
    ...(entry.label ? { label: { ...entry.label } } : {}),
  }));
}

/**
 * Unique process cards: exact location, then an explicitly mapped descendant.
 * A compartment never implies that all its components participate. A root-only fallback appears only on its root, never every child.
 * structurePath always preserves the user's actual path for exact return.
 * relation is one of "exact", "ancestor", "descendant", or "root".
 */
export function getProcessesForStructure(path) {
  if (!validPath(path)) return [];
  const root = path[0];
  const selected = canonicalPath(path);
  const matches = [];
  for (const [order, id] of processesByRoot[root].entries()) {
    const destinations = relationships[id]?.[root] || [];
    if (path.length === 1) {
      if (destinations.length)
        matches.push({
          id,
          structurePath: [...path],
          entryProgress: 0,
          relation: "root",
          rank: 0,
          distance: 0,
          order,
        });
      continue;
    }
    let best;
    for (const entry of destinations) {
      if (entry.path.length === 1) continue;
      let location = canonicalPath(entry.path);
      // The cytoplasm overview also contains organelles whose canonical route
      // starts directly at cell. Keep nuclear locations outside this subtree.
      if (
        selected.length === 2 &&
        selected[0] === "cell" &&
        selected[1] === "cytoplasm" &&
        children.cytoplasm.includes(location[1])
      )
        location = ["cell", "cytoplasm", ...location.slice(1)];
      let rank;
      if (location.length === selected.length && prefix(location, selected))
        rank = 0;
      else if (prefix(selected, location)) rank = 2;
      else continue;
      const distance = Math.abs(location.length - selected.length);
      if (
        !best ||
        rank < best.rank ||
        (rank === best.rank && distance < best.distance)
      )
        best = { entry, rank, distance };
    }
    if (best)
      matches.push({
        id,
        structurePath: [...path],
        entryProgress: best.entry.at,
        relation: ["exact", "ancestor", "descendant"][best.rank],
        relatedPath: [...best.entry.path],
        ...(best.entry.when ? { entryParameters: { ...best.entry.when } } : {}),
        ...(best.entry.label ? { label: { ...best.entry.label } } : {}),
        rank: best.rank,
        distance: best.distance,
        order,
      });
  }
  return matches
    .sort(
      (a, b) => a.rank - b.rank || a.distance - b.distance || a.order - b.order,
    )
    .map(({ rank, distance, order, ...entry }) => entry);
}

/** Stage links identify documented entry points, not continuous residence. */
export function groupProcessStructures(
  rootId,
  processId,
  stages,
  progress = 0,
  parameters,
) {
  const locations = getStructuresForProcess(rootId, processId);
  const index = Math.max(
    0,
    stages.findLastIndex((stage) => stage.at <= progress + 0.00001),
  );
  const stage = stages[index];
  const specific = locations.filter(
    (item) =>
      item.path.length > 1 &&
      (!parameters ||
        !item.when ||
        Object.entries(item.when).every(
          ([key, value]) => parameters[key] === value,
        )),
  );
  return {
    scope: locations.find((item) => item.path.length === 1),
    current: specific.filter((item) => item.at === stage?.at),
    other: stages.flatMap((item, stageIndex) => {
      const entries = specific.filter((location) => location.at === item.at);
      return entries.length && stageIndex !== index
        ? [{ stage: item, stageIndex, entries }]
        : [];
    }),
  };
}
