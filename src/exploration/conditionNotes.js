/** Condition-specific reading aids audited against all process update branches.
 * Pure metadata: no scene imports, mutations, browser globals or geometry allocation.
 * Chapters remain the normal-mechanism reference when a selected condition blocks it.
 */
export const CONDITION_CONTROL_AUDIT = {
  secretion: {},
  transcription: {},
  photosynthesis: {},
  infection: {},
  replication: {
    ligase: {
      default: "active",
      options: ["active", "absent"],
    },
  },
  dnaRepair: {
    incision: {
      default: "active",
      options: ["active", "blocked"],
    },
  },
  transduction: {
    route: {
      default: "p1",
      options: ["p1", "lambda"],
    },
  },
  bacterialSporulation: {
    engulfment: {
      default: "normal",
      options: ["normal", "blocked"],
    },
  },
  promoterRegulation: {
    bindingSite: {
      default: "intact",
      options: ["intact", "altered"],
    },
  },
  enhancerRegulation: {
    coactivator: {
      default: "competent",
      options: ["competent", "impaired"],
    },
  },
  chromatinAccess: {
    hydrolysis: {
      default: "active",
      options: ["active", "disabled"],
    },
  },
  tad: {
    condition: {
      default: "normal",
      options: ["normal", "boundaryDeleted", "cohesinDepleted"],
    },
  },
  plantGenome: {
    targeting: {
      default: "intact",
      options: ["intact", "removed"],
    },
  },
  plantRdDM: {
    drm2: {
      default: "active",
      options: ["active", "inactive"],
    },
  },
  rnaProcessing: {},
  nuclearTransport: {
    nls: {
      default: "exposed",
      options: ["exposed", "masked"],
    },
  },
  motorTransport: {
    motor: {
      default: "kinesin",
      options: ["kinesin", "dynein"],
    },
    atp: {
      default: "available",
      options: ["available", "depleted"],
    },
  },
  organelleImport: {
    transit: {
      default: "present",
      options: ["present", "absent"],
    },
  },
  translation: {},
  proteinFolding: {
    cycle: {
      default: "complete",
      options: ["complete", "hold"],
    },
  },
  alternativeSplicing: {
    isoform: {
      default: "include",
      options: ["include", "skip"],
    },
  },
  nitrogenFixation: {
    oxygen: {
      default: "protected",
      options: ["protected", "exposed"],
    },
  },
  rnaSilencing: {
    pairing: {
      default: "seed",
      options: ["seed", "slice", "mismatch"],
    },
  },
  proteasome: {
    tag: {
      default: "ubiquitin",
      options: ["ubiquitin", "untagged"],
    },
    shell: {
      default: "cutaway",
      options: ["cutaway", "whole"],
    },
  },
  crispr: {
    target: {
      default: "matched",
      options: ["matched", "noPam", "mismatch"],
    },
  },
  bacterialRepair: {
    lexA: {
      default: "wildtype",
      options: ["wildtype", "noncleavable"],
    },
  },
  respiration: {
    coupling: {
      default: "coupled",
      options: ["coupled", "leak"],
    },
  },
  glycolysis: {},
  bacterialEnergetics: {
    route: {
      default: "ndh1-bo",
      options: ["ndh1-bo", "ndh2-bd"],
    },
  },
  bacterialPhotosynthesis: {
    light: {
      default: "light",
      options: ["light", "dark"],
    },
  },
  diffusion: {
    route: {
      default: "water",
      options: ["water", "oxygen"],
    },
    gradient: {
      default: "outside",
      options: ["outside", "equal"],
    },
  },
  activeTransport: {
    energy: {
      default: "atp",
      options: ["atp", "none"],
    },
  },
  osmoticBalance: {
    tonicity: {
      default: "hypotonic",
      options: ["hypotonic", "isotonic", "hypertonic"],
    },
  },
  bacterialCellWall: {
    antibiotic: {
      default: "none",
      options: ["none", "betaLactam"],
    },
  },
  endocytosis: {},
  autophagy: {},
  mitosis: {
    attachment: {
      default: "normal",
      options: ["normal", "unattached"],
    },
  },
  meiosis: {},
  signalTransduction: {
    condition: {
      default: "ligand",
      options: ["ligand", "noLigand", "kinaseInactive"],
    },
  },
  apoptosis: {
    condition: {
      default: "stress",
      options: ["stress", "noStress"],
    },
  },
  differentiation: {
    program: {
      default: "competent",
      options: ["competent", "impaired"],
    },
  },
  immuneResponse: {
    epitope: {
      default: "matched",
      options: ["matched", "unmatched"],
    },
  },
  actionPotential: {
    stimulus: {
      default: "on",
      options: ["on", "off"],
    },
  },
  synapse: {
    calcium: {
      default: "available",
      options: ["available", "blocked"],
    },
  },
  muscle: {
    calcium: {
      default: "released",
      options: ["released", "low"],
    },
  },
  ciliaryMotion: {
    atp: {
      default: "available",
      options: ["available", "absent"],
    },
  },
  plasmolysis: {
    bath: {
      default: "recover",
      options: ["recover", "hold"],
    },
  },
  stomata: {
    signal: {
      default: "aba",
      options: ["aba", "light"],
    },
  },
  plantLongDistanceTransport: {
    stomata: {
      default: "close",
      options: ["close", "open"],
    },
  },
  chloroplastMovement: {
    genotype: {
      default: "wild",
      options: ["wild", "phot2"],
    },
  },
  plantDivision: {},
  cellWallGrowth: {
    extensibility: {
      default: "yielding",
      options: ["yielding", "restrained"],
    },
  },
  doubleFertilization: {
    assignment: {
      default: "frontEgg",
      options: ["frontEgg", "frontCentral"],
    },
  },
  fungalHyphae: {
    delivery: {
      default: "normal",
      options: ["normal", "reduced"],
    },
  },
  auxin: {
    auxin: {
      default: "present",
      options: ["present", "low"],
    },
  },
  plantDefense: {
    ligand: {
      default: "flg22",
      options: ["flg22", "absent"],
    },
  },
  plantTransport: {
    energy: {
      default: "available",
      options: ["available", "depleted"],
    },
  },
  plasmodesmata: {
    gate: {
      default: "open",
      options: ["open", "callose"],
    },
  },
  photorespiration: {
    glyk: {
      default: "active",
      options: ["active", "absent"],
    },
  },
  c4cam: {
    strategy: {
      default: "c4",
      options: ["c4", "cam"],
    },
  },
  lacOperon: {
    lactose: {
      default: "present",
      options: ["present", "absent"],
    },
    glucose: {
      default: "low",
      options: ["low", "high"],
    },
  },
  trpOperon: {
    tryptophan: {
      default: "low",
      options: ["low", "high"],
    },
    charging: {
      default: "normal",
      options: ["normal", "limited"],
    },
  },
  yeastGal: {
    galactose: {
      default: "present",
      options: ["present", "absent"],
    },
    glucose: {
      default: "low",
      options: ["low", "high"],
    },
  },
  yeastOsmoregulation: {
    osmolarity: {
      default: "high",
      options: ["high", "unchanged"],
    },
    hog1: {
      default: "active",
      options: ["active", "inhibited"],
    },
  },
  bacterialExpression: {
    sigma: {
      default: "present",
      options: ["present", "absent"],
    },
  },
  bacterialDivision: {
    septalSynthesis: {
      default: "active",
      options: ["active", "blocked"],
    },
  },
  conjugation: {
    oriT: {
      default: "intact",
      options: ["intact", "blocked"],
    },
  },
  transformation: {
    homology: {
      default: "matched",
      options: ["matched", "absent"],
    },
  },
  chemotaxis: {
    environment: {
      default: "gradient",
      options: ["gradient", "uniform"],
    },
  },
  twoComponent: {
    nitrate: {
      default: "present",
      options: ["present", "absent"],
    },
  },
  quorumSensing: {
    exchange: {
      default: "retained",
      options: ["retained", "diluted"],
    },
  },
  biofilm: {
    cue: {
      default: "NO",
      options: ["NO", "none"],
    },
  },
  yeastBudding: {},
  yeastFermentation: {
    condition: {
      default: "anaerobic",
      options: ["anaerobic", "aerobic"],
    },
  },
  yeastMating: {
    partner: {
      default: "compatible",
      options: ["compatible", "same"],
    },
  },
  yeastSporulation: {
    nutrients: {
      default: "starved",
      options: ["starved", "rich"],
    },
  },
  parameciumFeeding: {},
  contractileVacuole: {
    osmotic: {
      default: "freshwater",
      options: ["freshwater", "mild"],
    },
  },
  parameciumDivision: {},
  parameciumConjugation: {},
  phageLytic: {},
  phageLysogenic: {
    fate: {
      default: "induce",
      options: ["induce", "maintain"],
    },
  },
  phageAssembly: {
    protease: {
      default: "active",
      options: ["active", "inactive"],
    },
  },
  phagePackaging: {
    atp: {
      default: "present",
      options: ["present", "absent"],
    },
  },
};

const rules = [
  {
    processId: "replication",
    when: {
      ligase: "absent",
    },
    kind: "reference",
    body: {
      zh: "复制叉和新链合成继续推进，但冈崎片段之间的切口不能封闭。",
      en: "The fork and strand synthesis continue, but nicks between Okazaki fragments remain unsealed.",
    },
    title: {
      zh: "复制继续，切口保留",
      en: "Replication continues; nicks remain",
    },
  },
  {
    processId: "dnaRepair",
    when: {
      incision: "blocked",
    },
    kind: "reference",
    body: {
      zh: "损伤识别与局部解链仍发生；双侧切割受阻，含损伤片段不能移除，后续补链和封口不发生。",
      en: "Recognition and local opening occur; blocked dual incision prevents lesion removal, gap filling and sealing.",
    },
    title: {
      zh: "切割受阻，损伤保留",
      en: "Incision blocked; lesion retained",
    },
  },
  {
    processId: "transduction",
    when: {
      route: "lambda",
    },
    kind: "condition",
    body: {
      zh: "当前展示 λ 的专一性转导：异常切除携带整合位点邻近的宿主基因，不是 P1 的广义包装路径。",
      en: "Lambda specialized transduction carries host genes beside the integration site after aberrant excision; it follows a different route from generalized P1 packaging.",
    },
    title: {
      zh: "λ 专一性转导",
      en: "Lambda specialized transduction",
    },
  },
  {
    processId: "bacterialSporulation",
    when: {
      engulfment: "blocked",
    },
    kind: "reference",
    body: {
      zh: "前孢子形成后，母细胞膜的吞噬推进受阻，不能完成后续成熟与释放。",
      en: "After forespore formation, mother-cell membrane engulfment stalls, preventing later maturation and release.",
    },
    title: {
      zh: "吞噬停滞，前孢子未成熟",
      en: "Engulfment stalled; forespore immature",
    },
  },
  {
    processId: "promoterRegulation",
    when: {
      bindingSite: "altered",
    },
    kind: "reference",
    body: {
      zh: "调控蛋白不能稳定占据改变后的位点，本模型不形成有效的起始复合体，也不产生诱导的 RNA。",
      en: "The altered site does not support stable regulator binding; this model does not establish productive initiation or induced RNA synthesis.",
    },
    title: {
      zh: "结合不稳定，转录未启动",
      en: "Unstable binding; transcription not initiated",
    },
  },
  {
    processId: "enhancerRegulation",
    when: {
      coactivator: "impaired",
    },
    kind: "reference",
    body: {
      zh: "增强子与启动子仍可接近，但协同激活受损，不出现模型中的转录爆发。",
      en: "Enhancer and promoter can still approach, but impaired coactivation prevents the modeled transcription bursts.",
    },
    title: {
      zh: "接近仍发生，转录爆发受阻",
      en: "Proximity retained; transcription bursts blocked",
    },
  },
  {
    processId: "chromatinAccess",
    when: {
      hydrolysis: "disabled",
    },
    kind: "reference",
    body: {
      zh: "重塑复合体仍可结合；缺少 ATP 水解驱动时，核小体不完成滑移，靶位点不被有效暴露。",
      en: "The remodeler can bind, but without ATP hydrolysis the nucleosome does not slide to expose the target site.",
    },
    title: {
      zh: "重塑器结合，但核小体不滑移",
      en: "Remodeler binds; nucleosome sliding blocked",
    },
  },
  {
    processId: "tad",
    when: {
      condition: "boundaryDeleted",
    },
    kind: "condition",
    body: {
      zh: "删除边界后，挤出形成的环可越过原有边界；这里展示改变后的接触范围。",
      en: "With a boundary deleted, loop extrusion can extend beyond the former boundary, changing the contact range.",
    },
    title: {
      zh: "边界删除，挤出环延伸",
      en: "Boundary deleted; extrusion loop extends",
    },
  },
  {
    processId: "tad",
    when: {
      condition: "cohesinDepleted",
    },
    kind: "reference",
    body: {
      zh: "缺少 cohesin 时，本模型不形成挤出环；这不表示所有染色质接触都消失。",
      en: "Without cohesin, the modeled extrusion loop does not form; this does not remove every type of chromatin contact.",
    },
    title: {
      zh: "cohesin 缺失，不形成挤出环",
      en: "Cohesin absent; extrusion loop absent",
    },
  },
  {
    processId: "plantGenome",
    when: {
      targeting: "removed",
    },
    kind: "reference",
    body: {
      zh: "核内表达、RNA 输出和胞质翻译仍继续；去掉靶向信息后，产物不能完成图示的细胞器导入。",
      en: "Nuclear expression, RNA export and cytosolic translation continue; removing targeting information prevents the illustrated organelle import.",
    },
    title: {
      zh: "表达继续，细胞器导入受阻",
      en: "Expression continues; organelle import blocked",
    },
  },
  {
    processId: "plantRdDM",
    when: {
      drm2: "inactive",
    },
    kind: "reference",
    body: {
      zh: "上游小 RNA 引导、DRM2 招募和碱基翻出仍可展示，但不能写入本轮新的甲基化标记。",
      en: "Upstream small-RNA guidance, DRM2 recruitment and base flipping can occur, but new methylation marks are not written in this cycle.",
    },
    title: {
      zh: "上游引导继续，新甲基化受阻",
      en: "Guidance continues; new methylation blocked",
    },
  },
  {
    processId: "nuclearTransport",
    when: {
      nls: "masked",
    },
    kind: "reference",
    body: {
      zh: "核定位信号被遮蔽，货物不能完成该导入受体介导的核输入；并非所有核孔运输都停止。",
      en: "The masked nuclear localization signal prevents this receptor-mediated cargo import; other nuclear-pore traffic is not represented as stopped.",
    },
    title: {
      zh: "NLS 遮蔽，货物核输入受阻",
      en: "Masked NLS; cargo import blocked",
    },
  },
  {
    processId: "motorTransport",
    when: {
      motor: "dynein",
    },
    kind: "condition",
    body: {
      zh: "当前由动力蛋白沿微管向负端运输；路线方向与默认的驱动蛋白分支相反。",
      en: "Dynein carries the cargo toward the microtubule minus end, reversing the default kinesin route.",
    },
    title: {
      zh: "动力蛋白向微管负端运输",
      en: "Dynein transport toward the minus end",
    },
  },
  {
    processId: "motorTransport",
    when: {
      atp: "depleted",
    },
    kind: "reference",
    body: {
      zh: "所选马达缺少可用 ATP，货物不完成沿微管的步进运输。",
      en: "The selected motor lacks available ATP, so the cargo does not undergo microtubule stepping transport.",
    },
    title: {
      zh: "ATP 耗尽，马达步进停止",
      en: "ATP depleted; motor stepping halted",
    },
  },
  {
    processId: "organelleImport",
    when: {
      transit: "absent",
    },
    kind: "reference",
    body: {
      zh: "缺少转运肽时，前体不能按本模型对接并穿过叶绿体包膜的导入通道。",
      en: "Without a transit peptide, the precursor does not dock and thread through the modeled chloroplast envelope import machinery.",
    },
    title: {
      zh: "转运肽缺失，导入受阻",
      en: "Transit peptide absent; import blocked",
    },
  },
  {
    processId: "proteinFolding",
    when: {
      cycle: "hold",
    },
    kind: "reference",
    body: {
      zh: "多肽合成和局部折叠仍继续，但 Hsp70 保持 ADP 结合态，不能完成核苷酸交换、释放及最终折叠。",
      en: "Synthesis and local folding continue, but Hsp70 remains ADP-bound without nucleotide exchange, release or final folding.",
    },
    title: {
      zh: "Hsp70 保持结合，释放受阻",
      en: "Hsp70 retained; release blocked",
    },
  },
  {
    processId: "alternativeSplicing",
    when: {
      isoform: "skip",
    },
    kind: "condition",
    body: {
      zh: "当前选择外显子跳跃，成熟 RNA 的连接关系和产物随之改变；这不是剪接失败。",
      en: "Exon skipping changes the mature RNA junctions and product; this is an alternative splice outcome.",
    },
    title: {
      zh: "外显子跳跃分支",
      en: "Exon-skipping branch",
    },
  },
  {
    processId: "nitrogenFixation",
    when: {
      oxygen: "exposed",
    },
    kind: "reference",
    body: {
      zh: "氧暴露使图示固氮酶途径受阻，后续还原与氨产物不出现。",
      en: "Oxygen exposure blocks the illustrated nitrogenase pathway, preventing subsequent reduction and ammonia production.",
    },
    title: {
      zh: "氧暴露，固氮受阻",
      en: "Oxygen exposure blocks nitrogen fixation",
    },
  },
  {
    processId: "rnaSilencing",
    when: {
      pairing: "slice",
    },
    kind: "condition",
    body: {
      zh: "当前为高度互补的 AGO2 切割分支，靶 RNA 被切开；默认分支主要展示 miRNA 的翻译抑制与降解调控。",
      en: "Extensive complementarity supports AGO2 cleavage of the target RNA; the default branch illustrates miRNA repression and decay regulation.",
    },
    title: {
      zh: "AGO2 切割分支",
      en: "AGO2 cleavage branch",
    },
  },
  {
    processId: "rnaSilencing",
    when: {
      pairing: "mismatch",
    },
    kind: "reference",
    body: {
      zh: "配对不匹配时不能形成模型中的稳定靶向结合，不发生该靶 RNA 的抑制或切割。",
      en: "Mismatched pairing does not establish stable targeting, so the modeled target repression or cleavage does not occur.",
    },
    title: {
      zh: "配对不匹配，靶向抑制受阻",
      en: "Mismatch prevents target repression",
    },
  },
  {
    processId: "proteasome",
    when: {
      tag: "untagged",
    },
    kind: "reference",
    body: {
      zh: "当前底物缺少模型所需的泛素标签，不进入展开、转位和降解流程。",
      en: "This substrate lacks the ubiquitin tag required by the model and does not enter unfolding, translocation or degradation.",
    },
    title: {
      zh: "无泛素标签，底物不降解",
      en: "Untagged substrate is not degraded",
    },
  },
  {
    processId: "crispr",
    when: {
      target: "noPam",
    },
    kind: "reference",
    body: {
      zh: "缺少适配 PAM 时，Cas9 不建立有效的 DNA 打开与后续切割。",
      en: "Without a suitable PAM, Cas9 does not establish productive DNA opening or subsequent cleavage.",
    },
    title: {
      zh: "无适配 PAM，DNA 不切割",
      en: "No suitable PAM; no DNA cleavage",
    },
  },
  {
    processId: "crispr",
    when: {
      target: "mismatch",
    },
    kind: "reference",
    body: {
      zh: "不匹配靶点可短暂局部打开，但不能形成有效的切割复合体。",
      en: "The mismatched target can open partially and transiently but does not form a productive cleavage complex.",
    },
    title: {
      zh: "短暂打开，但不切割",
      en: "Transient opening without cleavage",
    },
  },
  {
    processId: "bacterialRepair",
    when: {
      lexA: "noncleavable",
    },
    kind: "reference",
    body: {
      zh: "RecA 丝状结构仍可组装，但 LexA 不能自切割，模型中的 SOS 转录诱导受阻。",
      en: "RecA filaments can assemble, but noncleavable LexA prevents the modeled induction of SOS transcription.",
    },
    title: {
      zh: "RecA 组装，SOS 诱导受阻",
      en: "RecA assembles; SOS induction blocked",
    },
  },
  {
    processId: "respiration",
    when: {
      coupling: "leak",
    },
    kind: "reference",
    body: {
      zh: "电子传递仍继续；质子泄漏削弱梯度，使图示 ATP 合成受抑，不能把这一分支理解为呼吸完全停止。",
      en: "Electron transfer continues; proton leakage weakens the gradient and suppresses the illustrated ATP synthesis.",
    },
    title: {
      zh: "电子传递继续，ATP 合成受抑",
      en: "Electron transfer continues; ATP synthesis suppressed",
    },
  },
  {
    processId: "bacterialEnergetics",
    when: {
      route: "ndh2-bd",
    },
    kind: "condition",
    body: {
      zh: "当前为 NDH-2–bd 支路，质子泵贡献与默认 NDH-1–bo 支路不同；仍可建立驱动 ATP 合成的电化学梯度。",
      en: "The NDH-2–bd branch has different proton-pumping contributions from NDH-1–bo, while still supporting an electrochemical gradient for ATP synthesis.",
    },
    title: {
      zh: "NDH-2–bd 替代支路",
      en: "Alternative NDH-2–bd branch",
    },
  },
  {
    processId: "bacterialPhotosynthesis",
    when: {
      light: "dark",
    },
    kind: "reference",
    body: {
      zh: "无光时不发生图示光驱动的电子流与产物形成；这里没有模拟细菌的其他代谢供能。",
      en: "Without light, the illustrated light-driven electron flow and product formation do not occur; other bacterial energy pathways are outside this model.",
    },
    title: {
      zh: "黑暗条件，光驱动过程停止",
      en: "Darkness halts the light-driven pathway",
    },
  },
  {
    processId: "diffusion",
    when: {
      route: "oxygen",
    },
    kind: "condition",
    body: {
      zh: "当前跟踪 O₂ 直接穿过脂质双层的扩散；水通道路线不用于解释这一分支。",
      en: "Oxygen diffuses directly through the lipid bilayer; the water-channel route does not describe this branch.",
    },
    title: {
      zh: "O₂ 经脂质双层扩散",
      en: "Oxygen diffusion through the bilayer",
    },
  },
  {
    processId: "diffusion",
    when: {
      gradient: "equal",
    },
    kind: "condition",
    body: {
      zh: "两侧浓度相等时仍有双向随机交换，但没有由浓度差驱动的净通量。",
      en: "Equal concentrations retain bidirectional random exchange, with no concentration-driven net flux.",
    },
    title: {
      zh: "双向交换，无净扩散",
      en: "Bidirectional exchange without net diffusion",
    },
  },
  {
    processId: "activeTransport",
    when: {
      energy: "none",
    },
    kind: "reference",
    body: {
      zh: "泵可保持面向胞内的 Na⁺ 结合状态，但缺少 ATP 时不能完成磷酸化驱动的 Na⁺/K⁺ 运输循环。",
      en: "The pump can remain inward-facing with sodium bound, but without ATP it cannot complete the phosphorylation-driven sodium/potassium transport cycle.",
    },
    title: {
      zh: "Na⁺ 仍可结合，泵循环受阻",
      en: "Sodium binding retained; pump cycle blocked",
    },
  },
  {
    processId: "osmoticBalance",
    when: {
      tonicity: "isotonic",
    },
    kind: "condition",
    body: {
      zh: "等渗条件下水仍交换，模型不出现持续的净吸水或失水导致的体积改变。",
      en: "Water still exchanges in an isotonic bath, without sustained volume change from net gain or loss.",
    },
    title: {
      zh: "等渗交换，体积稳定",
      en: "Isotonic exchange; stable volume",
    },
  },
  {
    processId: "osmoticBalance",
    when: {
      tonicity: "hypertonic",
    },
    kind: "condition",
    body: {
      zh: "高渗外液驱动净失水，细胞缩小；当前结果与默认低渗吸水不同。",
      en: "A hypertonic bath drives net water loss and cell shrinkage, unlike the default hypotonic response.",
    },
    title: {
      zh: "高渗失水，细胞缩小",
      en: "Hypertonic water loss; cell shrinks",
    },
  },
  {
    processId: "bacterialCellWall",
    when: {
      antibiotic: "betaLactam",
    },
    kind: "reference",
    body: {
      zh: "糖链延长仍可进行，但 β-内酰胺抑制转肽交联，不能形成正常的新交联结构。",
      en: "Glycan elongation can continue, but beta-lactam inhibition of transpeptidation prevents normal new crosslinks.",
    },
    title: {
      zh: "糖链延长，交联受阻",
      en: "Glycan elongation retained; crosslinking blocked",
    },
  },
  {
    processId: "mitosis",
    when: {
      attachment: "unattached",
    },
    kind: "reference",
    body: {
      zh: "一个动粒保持未附着，检查点阻止后期分离和后续完成分裂。",
      en: "One kinetochore remains unattached; the checkpoint prevents anaphase separation and completion of division.",
    },
    title: {
      zh: "动粒未附着，后期分离受阻",
      en: "Unattached kinetochore blocks anaphase",
    },
  },
  {
    processId: "signalTransduction",
    when: {
      condition: "noLigand",
    },
    kind: "reference",
    body: {
      zh: "无配体时不启动图示的 PDGF 受体激活和下游级联。",
      en: "Without ligand, the illustrated PDGF receptor activation and downstream cascade are not initiated.",
    },
    title: {
      zh: "无配体，级联未启动",
      en: "No ligand; cascade not initiated",
    },
  },
  {
    processId: "signalTransduction",
    when: {
      condition: "kinaseInactive",
    },
    kind: "reference",
    body: {
      zh: "配体仍能结合受体，但失活的受体激酶不能推动图示的下游信号级联。",
      en: "Ligand can bind the receptor, but inactive receptor kinase cannot drive the illustrated downstream cascade.",
    },
    title: {
      zh: "配体结合，受体激酶失活",
      en: "Ligand binds; receptor kinase inactive",
    },
  },
  {
    processId: "apoptosis",
    when: {
      condition: "noStress",
    },
    kind: "reference",
    body: {
      zh: "无应激对照保持细胞结构完整，不执行图示的线粒体通透化和凋亡程序。",
      en: "The unstressed control retains cell integrity without the illustrated mitochondrial permeabilization and apoptotic program.",
    },
    title: {
      zh: "无应激，凋亡未启动",
      en: "No stress; apoptosis not initiated",
    },
  },
  {
    processId: "differentiation",
    when: {
      program: "impaired",
    },
    kind: "reference",
    body: {
      zh: "红系成熟程序受损时，血红蛋白积累和排核不能按正常分支完成。",
      en: "With the erythroid maturation program impaired, hemoglobin accumulation and enucleation do not complete as in the normal branch.",
    },
    title: {
      zh: "红系成熟受损，排核未完成",
      en: "Erythroid maturation impaired; enucleation incomplete",
    },
  },
  {
    processId: "immuneResponse",
    when: {
      epitope: "unmatched",
    },
    kind: "reference",
    body: {
      zh: "肽仍可装载并由 MHC-I 呈递，但不能被当前 TCR 特异识别，不形成有效的 T 细胞激活。",
      en: "The peptide is still loaded and presented by MHC-I, but this TCR does not recognize it and productive T-cell activation is not established.",
    },
    title: {
      zh: "呈递继续，TCR 不识别",
      en: "Presentation continues; TCR does not recognize",
    },
  },
  {
    processId: "actionPotential",
    when: {
      stimulus: "off",
    },
    kind: "reference",
    body: {
      zh: "未施加触发刺激时，轴突保持静息，不出现图示的动作电位传播。",
      en: "Without the triggering stimulus, the axon remains at rest and the illustrated action potential does not propagate.",
    },
    title: {
      zh: "无刺激，轴突保持静息",
      en: "No stimulus; axon remains at rest",
    },
  },
  {
    processId: "synapse",
    when: {
      calcium: "blocked",
    },
    kind: "reference",
    body: {
      zh: "阻断 Ca²⁺ 内流后，图示的钙依赖囊泡融合和突触后响应不能完成。",
      en: "Blocking calcium influx prevents the illustrated calcium-dependent vesicle fusion and postsynaptic response.",
    },
    title: {
      zh: "Ca²⁺ 内流受阻，释放不发生",
      en: "Calcium influx blocked; release absent",
    },
  },
  {
    processId: "muscle",
    when: {
      calcium: "low",
    },
    kind: "reference",
    body: {
      zh: "低 Ca²⁺ 时细肌丝保持抑制，不完成图示横桥循环与肌节缩短。",
      en: "Low calcium maintains thin-filament inhibition, preventing the illustrated crossbridge cycle and sarcomere shortening.",
    },
    title: {
      zh: "低 Ca²⁺，肌节不缩短",
      en: "Low calcium; sarcomere does not shorten",
    },
  },
  {
    processId: "ciliaryMotion",
    when: {
      atp: "absent",
    },
    kind: "reference",
    body: {
      zh: "缺少 ATP 时动力蛋白不能驱动图示的受约束微管滑动，纤毛不拍动。",
      en: "Without ATP, dynein cannot drive the illustrated constrained microtubule sliding and the cilium does not beat.",
    },
    title: {
      zh: "无 ATP，纤毛不拍动",
      en: "No ATP; cilium does not beat",
    },
  },
  {
    processId: "plasmolysis",
    when: {
      bath: "hold",
    },
    kind: "reference",
    body: {
      zh: "持续保持高渗外液，原生质体维持收缩，不执行后半程换液后的质壁分离复原。",
      en: "The sustained hypertonic bath keeps the protoplast contracted; the later recovery after bath dilution is not performed.",
    },
    title: {
      zh: "持续高渗，不发生复原",
      en: "Sustained hypertonicity; no recovery",
    },
  },
  {
    processId: "stomata",
    when: {
      signal: "light",
    },
    kind: "condition",
    body: {
      zh: "后半程继续光照，保卫细胞保持较高膨压和开放孔隙，不切换到 ABA 关闭分支。",
      en: "Continued light maintains guard-cell turgor and the open pore instead of switching to the ABA closure branch.",
    },
    title: {
      zh: "持续光照，气孔保持开放",
      en: "Continued light; stomata remain open",
    },
  },
  {
    processId: "plantLongDistanceTransport",
    when: {
      stomata: "open",
    },
    kind: "condition",
    body: {
      zh: "气孔持续开放，蒸腾拉力和图示水流继续，不出现默认分支的闭孔减流。",
      en: "Open stomata sustain transpiration pull and modeled water flow without the reduction caused by closure in the default branch.",
    },
    title: {
      zh: "气孔持续开放，水流继续",
      en: "Stomata stay open; water flow continues",
    },
  },
  {
    processId: "chloroplastMovement",
    when: {
      genotype: "phot2",
    },
    kind: "reference",
    body: {
      zh: "phot2 缺失仍保留弱光积聚，但强光避让响应受损，不能按野生型移向垂周壁。",
      en: "Loss of phot2 retains weak-light accumulation but impairs strong-light avoidance toward the anticlinal walls.",
    },
    title: {
      zh: "弱光积聚保留，强光避让受损",
      en: "Accumulation retained; avoidance impaired",
    },
  },
  {
    processId: "cellWallGrowth",
    when: {
      extensibility: "restrained",
    },
    kind: "reference",
    body: {
      zh: "新壁材料仍可沉积，但壁伸展受限，不能把材料合成等同于细胞伸长。",
      en: "New wall material can still be deposited, but restrained wall yielding limits extension; synthesis alone does not imply cell elongation.",
    },
    title: {
      zh: "壁材料仍合成，伸展受限",
      en: "Wall synthesis retained; extension restrained",
    },
  },
  {
    processId: "doubleFertilization",
    when: {
      assignment: "frontCentral",
    },
    kind: "condition",
    body: {
      zh: "交换两精细胞的目标分配后，仍分别与卵细胞和中央细胞融合，形成 2n 胚和 3n 胚乳谱系。",
      en: "Swapping sperm assignments still produces one fusion with the egg and one with the central cell, establishing 2n embryo and 3n endosperm lineages.",
    },
    title: {
      zh: "精细胞目标互换，双受精仍完成",
      en: "Sperm targets swapped; double fertilization retained",
    },
  },
  {
    processId: "fungalHyphae",
    when: {
      delivery: "reduced",
    },
    kind: "condition",
    body: {
      zh: "囊泡供应减少使顶端材料输送和伸长减弱；模型展示减速而非完全停长。",
      en: "Reduced vesicle supply weakens tip delivery and extension; the model slows growth rather than stopping it completely.",
    },
    title: {
      zh: "囊泡供应减少，菌丝伸长减弱",
      en: "Reduced vesicle supply slows hyphal extension",
    },
  },
  {
    processId: "auxin",
    when: {
      auxin: "low",
    },
    kind: "reference",
    body: {
      zh: "低生长素条件下 Aux/IAA 抑制保持，不能按诱导分支完成降解和 ARF 靶基因激活。",
      en: "At low auxin, Aux/IAA repression persists without the induced degradation and ARF target activation.",
    },
    title: {
      zh: "低生长素，Aux/IAA 抑制保持",
      en: "Low auxin; Aux/IAA repression retained",
    },
  },
  {
    processId: "plantDefense",
    when: {
      ligand: "absent",
    },
    kind: "reference",
    body: {
      zh: "缺少 flg22 时，不启动本模型的 FLS2–BAK1 组装及下游活性氧响应；其他免疫通路未展开。",
      en: "Without flg22, this model does not initiate FLS2–BAK1 assembly or the downstream reactive-oxygen response; other immune pathways are outside its scope.",
    },
    title: {
      zh: "无 flg22，该免疫分支未启动",
      en: "No flg22; immune branch not initiated",
    },
  },
  {
    processId: "plantTransport",
    when: {
      energy: "depleted",
    },
    kind: "reference",
    body: {
      zh: "对照从无初始质子梯度开始；缺少 ATP 时质子泵不建立梯度，SUC2 也不能完成图示蔗糖摄入。",
      en: "This control starts without a proton gradient. Without ATP the pump does not establish one, so SUC2 cannot complete the illustrated sucrose uptake.",
    },
    title: {
      zh: "无 ATP 和初始梯度，蔗糖摄入受阻",
      en: "No ATP or initial gradient; sucrose uptake blocked",
    },
  },
  {
    processId: "plasmodesmata",
    when: {
      gate: "callose",
    },
    kind: "reference",
    body: {
      zh: "胼胝质使颈部收窄，限制图示小溶质的通过；这不是所有蛋白或 RNA 的统一通透阈值。",
      en: "Callose narrows the neck and restricts the illustrated small-solute passage; it does not define a universal permeability threshold for proteins or RNA.",
    },
    title: {
      zh: "胼胝质收窄通道，溶质通过受限",
      en: "Callose narrows the channel; passage restricted",
    },
  },
  {
    processId: "photorespiration",
    when: {
      glyk: "absent",
    },
    kind: "reference",
    body: {
      zh: "上游 C₂ 回收反应仍进行，但缺少 GLYK 时甘油酸不能完成最后的磷酸化回到 3-PGA。",
      en: "Upstream C2 salvage proceeds, but without GLYK glycerate cannot complete the final phosphorylation back to 3-PGA.",
    },
    title: {
      zh: "回收继续，甘油酸磷酸化受阻",
      en: "Salvage continues; glycerate phosphorylation blocked",
    },
  },
  {
    processId: "c4cam",
    when: {
      strategy: "cam",
    },
    kind: "condition",
    body: {
      zh: "当前是 CAM 的时间分隔：夜间摄碳储酸，白天脱羧供 Rubisco 同化；不应套用 C₄ 的叶肉—维管束鞘空间路线。",
      en: "CAM separates carbon uptake and acid storage at night from daytime decarboxylation for Rubisco; the C4 mesophyll–bundle-sheath spatial route does not apply.",
    },
    title: {
      zh: "CAM：夜间储酸，白天脱羧",
      en: "CAM: night acid storage, daytime decarboxylation",
    },
  },
  {
    processId: "lacOperon",
    when: {
      lactose: "absent",
    },
    kind: "reference",
    body: {
      zh: "缺少乳糖时 LacI 保持抑制，不能形成诱导状态；这不把基础泄漏表达解释为绝对为零。",
      en: "Without lactose, LacI repression persists and induction is not established; basal leaky expression is not claimed to be absolutely zero.",
    },
    title: {
      zh: "无乳糖，LacI 抑制保持",
      en: "No lactose; LacI repression retained",
    },
  },
  {
    processId: "lacOperon",
    when: {
      glucose: "high",
      lactose: "present",
    },
    kind: "condition",
    body: {
      zh: "有乳糖但葡萄糖高时可解除 LacI 抑制，却缺少低糖时的 CAP–cAMP 促进，表达较弱而非完全关闭。",
      en: "With lactose present and high glucose, LacI can be relieved but CAP–cAMP stimulation is reduced, giving weaker rather than fully absent expression.",
    },
    title: {
      zh: "有乳糖、高葡萄糖：较弱表达",
      en: "Lactose with high glucose: weaker expression",
    },
  },
  {
    processId: "trpOperon",
    when: {
      tryptophan: "high",
      charging: "normal",
    },
    kind: "condition",
    body: {
      zh: "高游离色氨酸激活 TrpR，抑制起始；充电正常时，已起始的前导 RNA 还可形成终止结构。",
      en: "High free tryptophan activates TrpR to repress initiation; normal tRNA charging also allows termination in the separately shown initiated leader RNA.",
    },
    title: {
      zh: "高色氨酸：起始抑制与前导终止",
      en: "High tryptophan: initiation repression and leader termination",
    },
  },
  {
    processId: "trpOperon",
    when: {
      charging: "limited",
    },
    kind: "condition",
    body: {
      zh: "tRNAᵀʳᵖ 充电受限使前导区核糖体停滞，有利于反终止；若游离色氨酸高，TrpR 对起始的抑制仍在。",
      en: "Limited tRNA-Trp charging stalls the leader ribosome and favors antitermination; when free tryptophan is high, TrpR still represses initiation.",
    },
    title: {
      zh: "tRNA 充电受限，前导反终止",
      en: "Limited tRNA charging; leader antitermination",
    },
  },
  {
    processId: "yeastGal",
    when: {
      galactose: "absent",
    },
    kind: "reference",
    body: {
      zh: "缺少半乳糖时 Gal80 保持对 Gal4 的抑制，不形成图示的 GAL 转录诱导。",
      en: "Without galactose, Gal80 continues to repress Gal4 and the illustrated GAL transcriptional induction is not established.",
    },
    title: {
      zh: "无半乳糖，Gal80 抑制保持",
      en: "No galactose; Gal80 repression retained",
    },
  },
  {
    processId: "yeastGal",
    when: {
      glucose: "high",
      galactose: "present",
    },
    kind: "reference",
    body: {
      zh: "有半乳糖时 Gal80 可解除抑制，但高葡萄糖下 Mig1 相关抑制仍阻止图示的 GAL 转录诱导。",
      en: "With galactose, Gal80 repression can be relieved, but high-glucose Mig1-associated repression still prevents the modeled GAL induction.",
    },
    title: {
      zh: "Gal80 释放，Mig1 抑制仍在",
      en: "Gal80 released; Mig1 repression persists",
    },
  },
  {
    processId: "yeastOsmoregulation",
    when: {
      osmolarity: "unchanged",
    },
    kind: "reference",
    body: {
      zh: "没有高渗冲击时，不启动图示的失水—Hog1 激活—适应性甘油积累流程。",
      en: "Without a hyperosmotic shock, the illustrated water-loss, Hog1 activation and adaptive glycerol accumulation sequence is not initiated.",
    },
    title: {
      zh: "无高渗冲击，适应流程未启动",
      en: "No hyperosmotic shock; adaptation not initiated",
    },
  },
  {
    processId: "yeastOsmoregulation",
    when: {
      hog1: "inhibited",
      osmolarity: "high",
    },
    kind: "reference",
    body: {
      zh: "高渗失水与 Fps1 早期关闭仍发生，并保留基础甘油；Hog1 不可被磷酸化时，适应性甘油积累和体积恢复受阻。",
      en: "Hyperosmotic water loss and early Fps1 closure still occur, with basal glycerol retained; nonphosphorylatable Hog1 blocks adaptive glycerol accumulation and volume recovery.",
    },
    title: {
      zh: "失水仍发生，Hog1 适应受阻",
      en: "Water loss retained; Hog1 adaptation blocked",
    },
  },
  {
    processId: "bacterialExpression",
    when: {
      sigma: "absent",
    },
    kind: "reference",
    body: {
      zh: "缺少 σ 因子时不能建立图示的启动子特异起始，后续 mRNA 合成与偶联翻译不发生。",
      en: "Without sigma factor, the modeled promoter-specific initiation does not establish subsequent mRNA synthesis and coupled translation.",
    },
    title: {
      zh: "无 σ 因子，特异起始受阻",
      en: "No sigma factor; specific initiation blocked",
    },
  },
  {
    processId: "bacterialDivision",
    when: {
      septalSynthesis: "blocked",
    },
    kind: "reference",
    body: {
      zh: "染色体复制分离和分裂体前期装配仍可推进，但隔膜合成受阻，包膜不能完成内陷和分裂。",
      en: "Chromosome replication, segregation and early divisome assembly can proceed, but blocked septal synthesis prevents completion of envelope constriction and division.",
    },
    title: {
      zh: "染色体过程继续，隔膜合成受阻",
      en: "Chromosome processes continue; septal synthesis blocked",
    },
  },
  {
    processId: "conjugation",
    when: {
      oriT: "blocked",
    },
    kind: "reference",
    body: {
      zh: "细胞接触仍可建立，但 oriT 加工受阻，不能启动图示的单链 DNA 转移。",
      en: "Cell contact can form, but blocked oriT processing prevents initiation of the illustrated single-stranded DNA transfer.",
    },
    title: {
      zh: "细胞接触保持，DNA 转移未启动",
      en: "Cell contact retained; DNA transfer not initiated",
    },
  },
  {
    processId: "transformation",
    when: {
      homology: "absent",
    },
    kind: "reference",
    body: {
      zh: "环境 DNA 仍可被摄取，但缺少同源序列时不能按本模型稳定整合到染色体。",
      en: "Environmental DNA can still be taken up, but without homology it does not integrate stably into the modeled chromosome.",
    },
    title: {
      zh: "DNA 摄取继续，同源整合受阻",
      en: "DNA uptake continues; homologous integration blocked",
    },
  },
  {
    processId: "chemotaxis",
    when: {
      environment: "uniform",
    },
    kind: "condition",
    body: {
      zh: "均一环境下仍会游动和翻滚，但没有梯度提供的定向偏置；轨迹是示意实例。",
      en: "Cells still run and tumble in a uniform environment, without a gradient-directed bias; the path is schematic.",
    },
    title: {
      zh: "均一环境：游动翻滚，无梯度偏置",
      en: "Uniform environment: runs and tumbles without gradient bias",
    },
  },
  {
    processId: "twoComponent",
    when: {
      nitrate: "absent",
    },
    kind: "reference",
    body: {
      zh: "无硝酸盐时不建立图示的 NarX–NarL 诱导磷酸转移与靶转录。",
      en: "Without nitrate, the illustrated induced NarX–NarL phosphotransfer and target transcription are not established.",
    },
    title: {
      zh: "无硝酸盐，NarX–NarL 诱导未启动",
      en: "No nitrate; NarX–NarL induction not initiated",
    },
  },
  {
    processId: "quorumSensing",
    when: {
      exchange: "diluted",
    },
    kind: "reference",
    body: {
      zh: "信号仍可产生和扩散，但持续稀释阻止其局部积累到图示的 LuxR 激活和发光状态。",
      en: "Signal can still be produced and diffuse, but continued dilution prevents the illustrated local accumulation, LuxR activation and luminescence.",
    },
    title: {
      zh: "信号持续稀释，群体响应未启动",
      en: "Signal diluted; quorum response not initiated",
    },
  },
  {
    processId: "biofilm",
    when: {
      cue: "none",
    },
    kind: "reference",
    body: {
      zh: "附着和聚集体形成仍继续；无 NO 分散信号时不执行图示的后期局部分散。",
      en: "Attachment and aggregate formation continue; without the NO cue, the illustrated later local dispersal does not occur.",
    },
    title: {
      zh: "聚集体形成，无 NO 诱导分散",
      en: "Aggregates form; no NO-induced dispersal",
    },
  },
  {
    processId: "yeastFermentation",
    when: {
      condition: "aerobic",
    },
    kind: "condition",
    body: {
      zh: "当前仍供应高糖：有氧条件下酵母也可继续发酵（Crabtree 效应）；本图没有展开并行呼吸支路。",
      en: "High sugar is still supplied: yeast can ferment aerobically through the Crabtree effect; the parallel respiration branch is not expanded here.",
    },
    title: {
      zh: "高糖有氧条件仍可发酵",
      en: "Fermentation persists with high sugar and oxygen",
    },
  },
  {
    processId: "yeastMating",
    when: {
      partner: "same",
    },
    kind: "reference",
    body: {
      zh: "同型 a/a 对照不建立互补交配型的识别和融合；本模型不含交配型转换。",
      en: "The same-type a/a control does not establish complementary mating recognition or fusion; mating-type switching is outside this model.",
    },
    title: {
      zh: "同型交配对照，不发生融合",
      en: "Same mating type; no fusion",
    },
  },
  {
    processId: "yeastSporulation",
    when: {
      nutrients: "rich",
    },
    kind: "reference",
    body: {
      zh: "营养丰富的对照不进入本模型的饥饿诱导减数分裂和子囊孢子形成路线。",
      en: "The nutrient-rich control does not enter this model’s starvation-induced meiosis and ascospore formation pathway.",
    },
    title: {
      zh: "营养丰富，不进入孢子形成",
      en: "Rich nutrients; sporulation not initiated",
    },
  },
  {
    processId: "contractileVacuole",
    when: {
      osmotic: "mild",
    },
    kind: "condition",
    body: {
      zh: "低渗程度减轻时进水负担下降，伸缩泡循环变慢；章节时点用于机制讲解，不代表实测排水频率。",
      en: "A milder hypotonic load reduces water entry and slows the contractile-vacuole cycle; chapter timing explains the mechanism rather than measuring discharge frequency.",
    },
    title: {
      zh: "低渗负担减轻，伸缩泡循环变慢",
      en: "Milder hypotonic load; slower vacuole cycle",
    },
  },
  {
    processId: "phageLysogenic",
    when: {
      fate: "maintain",
    },
    kind: "reference",
    body: {
      zh: "前噬菌体随宿主复制和分裂传递，但无诱导时保持溶原，不执行切除、子代装配和裂解。",
      en: "The prophage is inherited through host replication and division, but without induction lysogeny persists without excision, progeny assembly or lysis.",
    },
    title: {
      zh: "保持溶原，不诱导裂解",
      en: "Lysogeny maintained; lysis not induced",
    },
  },
  {
    processId: "phageAssembly",
    when: {
      protease: "inactive",
    },
    kind: "reference",
    body: {
      zh: "前头支架保留，头部成熟与包装受阻；独立的尾部仍可装配，但不能形成完整子代。",
      en: "The prohead scaffold remains and head maturation and packaging stall; independent tail assembly can continue, but complete progeny do not form.",
    },
    title: {
      zh: "头部成熟受阻，尾部仍装配",
      en: "Head maturation blocked; tail assembly continues",
    },
  },
  {
    processId: "phagePackaging",
    when: {
      atp: "absent",
    },
    kind: "reference",
    body: {
      zh: "DNA 与包装装置仍可对接，但没有 ATP 驱动的转位、头满切割和后续封口。",
      en: "DNA and packaging machinery can dock, but ATP-driven translocation, headful cleavage and subsequent sealing do not occur.",
    },
    title: {
      zh: "包装装置对接，DNA 转位受阻",
      en: "Packaging machinery docked; DNA translocation blocked",
    },
  },
];

/** Return a localized condition note, or null for a default/display-only branch. */
export function getConditionNote(processId, parameters = {}, lang = "zh") {
  const controls = CONDITION_CONTROL_AUDIT[processId];
  if (!controls) return null;
  const normalized = {};
  for (const [key, control] of Object.entries(controls)) {
    const value = parameters?.[key];
    normalized[key] = control.options.includes(value) ? value : control.default;
  }
  const matches = rules.filter(
    (rule) =>
      rule.processId === processId &&
      Object.entries(rule.when).every(
        ([key, value]) => normalized[key] === value,
      ),
  );
  if (!matches.length) return null;
  const locale = lang === "en" ? "en" : "zh";
  const kind = matches.some((rule) => rule.kind === "reference")
    ? "reference"
    : "condition";
  // ATP depletion takes precedence over a motor-direction explanation.
  const visible =
    processId === "motorTransport" && normalized.atp === "depleted"
      ? matches.filter((rule) => rule.kind === "reference")
      : matches;
  const body = visible
    .map((rule) => rule.body[locale])
    .join(locale === "en" ? " " : "");
  const suffix =
    kind === "reference"
      ? locale === "en"
        ? " Chapters describe the normal mechanism for comparison; later chapter labels do not mean these events occur under the selected condition."
        : "章节保留正常机制作为对照；后续章节标题不代表当前条件下这些事件实际发生。"
      : "";
  return {
    kind,
    title: visible
      .map((rule) => rule.title[locale])
      .join(locale === "en" ? "; " : "；"),
    body: body + suffix,
  };
}
