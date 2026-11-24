import { THREE, sceneKit, bilingual as b, clamp } from "../../kit.js";
import { anatomy } from "./rodRibbonAnatomy.js";
import { signals, EVENTS, normalizeLight } from "./rodRibbonSignals.js";

const title = b("视杆带状突触传递", "Transmission at a rod ribbon synapse");
const stage = (at, zh, en, zhBody, enBody, alternatives = []) => ({
  at,
  title: b(zh, en),
  description: b(zhBody, enBody),
  conditionCopy: alternatives.map(([illumination, z, e, zb, eb]) => ({
    when: { illumination },
    title: b(z, e),
    description: b(zb, eb),
  })),
});
const darkStable = [
  "dark",
  "持续黑暗中的释放",
  "Release in sustained darkness",
  "视杆仍相对去极化。活性区持续有钙离子进入，系在突触带上的小泡间歇地与膜融合。",
  "The rod stays relatively depolarized. Calcium continues to enter at the active zone, and ribbon-associated vesicles fuse intermittently.",
];
const stages = [
  stage(
    0,
    "看清突触小球的内陷",
    "Inside the spherule invagination",
    "沿视杆轴突末端的剖口向里看。突触带立在内陷顶壁，两侧系着小泡。灰紫色的水平细胞突起伸入两侧，中央蓝灰色树突尖端属于一条 ON 型视杆双极细胞。",
    "The ribbon stands above the roof of an invagination in the rod terminal, with vesicles tethered to both faces. Two gray lateral processes belong to horizontal cells. The central blue-gray dendritic tip belongs to a rod ON bipolar cell.",
  ),
  stage(
    0.065,
    "暗中，小泡在活性区融合",
    "Darkness supports vesicle fusion",
    "暗中的视杆相对去极化，突触前膜上的 CaV1.4 通道让 Ca²⁺ 进入。金色小泡先贴靠活性区，再打开融合孔，已有的谷氨酸从小泡腔经孔进入突触间隙。",
    "The relatively depolarized dark rod admits Ca²⁺ through presynaptic CaV1.4 channels. A loaded vesicle docks at the active zone. Its fusion pore opens and glutamate passes from the vesicle lumen into the cleft.",
  ),
  stage(
    0.205,
    "谷氨酸维持暗态信号",
    "Glutamate sustains the dark signal",
    "谷氨酸扩散到树突尖端，与 mGluR6 结合。受体激活膜内侧的 Gₒ 信号，使 TRPM1 通道的开放概率较低。双极细胞的内向阳离子电流因而较小。",
    "Glutamate diffuses to mGluR6 on the dendritic tip. The receptor activates Gₒ signaling on the cytoplasmic side, keeping TRPM1 opening unlikely. The bipolar cell therefore carries little inward cation current.",
  ),
  stage(
    0.29,
    "光使视杆膜电位变负",
    "Light hyperpolarizes the rod",
    "光照使外节暗电流减小，膜电位的渐变传到轴突末端。活性区的 CaV1.4 通道较少开放，进入的 Ca²⁺ 减少。突触前膜内侧的短横线随相对负电位增加而增多。",
    "Light reduces the outer-segment dark current. The graded voltage change reaches the rod terminal, where CaV1.4 channels open less often and calcium entry falls. Minus marks on the rod side indicate increasing relative negativity.",
    [darkStable],
  ),
  stage(
    0.405,
    "间隙中的谷氨酸减少",
    "Cleft glutamate falls",
    "较少的钙离子进入，小泡的融合频率下降。谷氨酸逐渐扩散离开间隙，树突尖端的 mGluR6 活性随之下降。许多装着谷氨酸的小泡仍然系在突触带上。",
    "With less calcium entry, vesicles fuse less often. Glutamate disperses from the cleft and mGluR6 activity falls. Many loaded vesicles remain tethered to the ribbon.",
    [
      [
        "dark",
        "谷氨酸持续到达树突",
        "Glutamate continues to reach the dendrite",
        "黑暗中仍可见新的融合事件。间隙保持较高的谷氨酸水平，mGluR6 继续驱动 Gₒ 信号。",
        "Additional vesicles fuse in darkness. Cleft glutamate stays comparatively high, and mGluR6 continues to drive Gₒ signaling.",
      ],
    ],
  ),
  stage(
    0.535,
    "双极细胞出现相反的电位变化",
    "The bipolar cell responds with the opposite sign",
    "mGluR6–Gₒ 信号减弱，TRPM1 更容易开放。阳离子从细胞外进入树突，使 ON 型视杆双极细胞去极化。光照期间仍可偶见小泡融合。",
    "As mGluR6–Gₒ signaling subsides, TRPM1 opens more readily. Cations enter the dendrite and depolarize the rod ON bipolar cell. Occasional vesicle fusion can still occur during illumination.",
    [
      [
        "dark",
        "暗中的 TRPM1 较少开放",
        "TRPM1 opening stays low in darkness",
        "mGluR6–Gₒ 信号持续，TRPM1 的内向电流较小。双极细胞维持较负的暗态膜电位。",
        "Persistent mGluR6–Gₒ signaling keeps the inward TRPM1 current low. The bipolar cell remains at its relatively negative dark potential.",
      ],
    ],
  ),
  stage(
    0.745,
    "关灯后，钙流逐渐回升",
    "Calcium entry returns after light offset",
    "光照结束，视杆膜电位逐渐回到暗态。CaV1.4 通道的开放增加，小泡再次在活性区融合，间隙中的谷氨酸回升。",
    "After light offset, rod voltage moves back toward its dark level. CaV1.4 opening increases, vesicles again fuse at the active zone and cleft glutamate rises.",
    [
      darkStable,
      [
        "light",
        "光照持续，钙流保持较低",
        "Calcium entry remains low in sustained light",
        "光照仍在继续。视杆的膜电位比暗态更负，CaV1.4 通道开放较少，小泡释放仍处于较低水平。",
        "Illumination continues. The rod stays more negative than in darkness, with less CaV1.4 opening and a lower rate of release.",
      ],
    ],
  ),
  stage(
    0.89,
    "两侧膜电位回向暗态",
    "Both cells return toward their dark response",
    "重新释放的谷氨酸到达 mGluR6，Gₒ 信号回升，TRPM1 开放再次减少。双极细胞的膜电位随之回向较负的暗态水平。",
    "Freshly released glutamate reaches mGluR6. Gₒ signaling rises, TRPM1 opens less often and the bipolar cell moves back toward its more negative dark potential.",
    [
      [
        "dark",
        "持续黑暗下的突触",
        "The synapse remains in darkness",
        "视杆保持相对去极化，持续释放谷氨酸。ON 型视杆双极细胞保持相对超极化。",
        "The rod remains relatively depolarized and continues to release glutamate. The rod ON bipolar cell remains relatively hyperpolarized.",
      ],
      [
        "light",
        "持续光照下的突触",
        "The synapse remains illuminated",
        "视杆释放的谷氨酸较少。与暗态相比，树突尖端的 TRPM1 更容易开放，双极细胞的膜电位较正。",
        "Rod glutamate output stays comparatively low. Relative to darkness, dendritic TRPM1 is more likely to open and the bipolar cell is more depolarized.",
      ],
    ],
  ),
];
const labelCopy = {
  ribbon: b("突触带与系留小泡", "Ribbon and tethered vesicles"),
  tip: b("视杆双极细胞树突", "Rod bipolar dendrite"),
  calcium: b("CaV1.4 · 钙离子入口", "CaV1.4 · calcium entry"),
  fusion: b("活性区的融合孔", "Fusion pore at the active zone"),
  receptor: b("谷氨酸受体 mGluR6", "Glutamate receptor mGluR6"),
  go: b("树突膜内侧的 Gₒ", "Gₒ on the cytoplasmic side"),
  trpm: b("TRPM1 阳离子通道", "TRPM1 cation channel"),
  pre: b("视杆内侧相对电位", "Relative rod voltage"),
  post: b("双极细胞内侧相对电位", "Relative bipolar voltage"),
  lateral: b("水平细胞侧突", "Horizontal cell process"),
};
function create() {
  const k = sceneKit(),
    parts = anatomy(k),
    s = signals(k, parts.mats);
  const { group } = k;
  group.name = "Adult mouse rod spherule to a rod ON bipolar dendrite";
  const point = new THREE.Vector3(),
    target = new THREE.Vector3();
  const labels = [],
    anchors = [];
  function add(key, object, hint, priority) {
    const label = k.label(
      [0, 0, 0],
      labelCopy[key].zh,
      labelCopy[key].en,
      priority,
    );
    labels.push(label);
    const vertices = object.geometry.getAttribute("position");
    target.fromArray(hint);
    let best = 0,
      bestD = Infinity;
    for (let i = 0; i < vertices.count; i++) {
      const d = point
        .fromBufferAttribute(vertices, i)
        .distanceToSquared(target);
      if (d < bestD) {
        best = i;
        bestD = d;
      }
    }
    anchors.push({ key, object, vertex: best, label });
    label.anchorName = object.name;
    label.anchorVertex = best;
    return label;
  }
  const mark = {
    ribbon: add("ribbon", parts.plate, [0.48, 1.25, -0.62], 9),
    tip: add("tip", parts.tip, [-0.54, -1.5, 0.45], 8),
    lateral: add("lateral", parts.laterals[0], [-1.21, -0.36, -0.16], 6),
    calcium: add("calcium", s.cav.gate, [0.105, 0.099, 0.016], 9),
    fusion: add("fusion", s.release.collars[0], [-0.15, 0.036, 0.01], 10),
    receptor: add("receptor", s.receptor.binding, [0.018, 0.02, 0.06], 10),
    go: add("go", s.receptor.alpha, [0.75, 0.2, 0.4], 8),
    trpm: add("trpm", s.trpm.gate, [0.108, 0.09, 0.014], 10),
    pre: add("pre", s.voltage.sets[0][0], [0, 0.05, 0], 8),
    post: add("post", s.voltage.sets[1][0], [0, 0.05, 0], 8),
  };
  let p = 0,
    condition = "step";
  const state = group.userData;
  Object.assign(state, {
    species: "Mus musculus",
    lifeStage: "adult",
    rootId: "rodPhotoreceptor",
    structureId: "rodSpherule",
    responseType: "graded",
    trackedVesicles: EVENTS.length,
    calciumDirection: "cleft-to-rod",
    trpmDirection: "cleft-to-dendrite",
    cargo: s.release.ledger,
  });
  function update(raw, parameters = {}) {
    p = clamp(raw);
    condition = normalizeLight(parameters.illumination);
    Object.assign(state, s.update(p, condition), { illumination: condition });
    for (const l of labels) l.active = false;
    if (p < 0.065) {
      mark.ribbon.active = true;
      mark.tip.active = true;
      mark.lateral.active = true;
    } else if (p < 0.205) {
      mark.fusion.active = true;
      mark.calcium.active = true;
    } else if (p < 0.29) {
      mark.receptor.active = true;
      mark.go.active = true;
    } else if (p < 0.405) {
      mark.pre.active = true;
      mark.calcium.active = true;
    } else if (p < 0.535) {
      mark.receptor.active = true;
      mark.ribbon.active = true;
    } else if (p < 0.745) {
      mark.trpm.active = true;
      mark.post.active = true;
    } else if (p < 0.89) {
      mark.calcium.active = true;
      mark.pre.active = true;
    } else {
      mark.trpm.active = true;
      mark.receptor.active = true;
    }
    for (const { object, vertex, label } of anchors) {
      object.getVertexPosition(vertex, point);
      object.localToWorld(point).toArray(label.position);
    }
  }
  update(0);
  const materials = new Set();
  group.traverse((o) => {
    if (o.material) for (const m of [].concat(o.material)) materials.add(m);
  });
  return {
    group,
    labels,
    materials: [...materials],
    camera: { position: [2.63, 2.15, 9.3], target: [0, 0.015, -0.34] },
    update,
    setParameters(parameters) {
      update(p, parameters);
    },
    setProgress(value) {
      update(value, { illumination: condition });
    },
  };
}
export default {
  id: "rodRibbonTransmission",
  title,
  duration: 38,
  intro: b(
    "成年小鼠视杆突触小球的局部剖面。观察视杆的渐变电位如何改变谷氨酸释放，并在一条 ON 型视杆双极细胞树突上引起相反方向的电位变化。小鼠的突触小球通常容纳多个双极细胞树突尖端。本图跟踪其中一条，两侧可见水平细胞突起。间隙、融合孔和分子均已放大，金色标记追踪部分小泡的内容物，时序与电位横线只表示相对变化。",
    "A cutaway of an adult mouse rod spherule. Follow a graded rod voltage change through glutamate release to an opposite voltage change in one rod ON bipolar dendrite. Mouse rod spherules commonly receive multiple bipolar dendritic tips. This view follows one, flanked by horizontal-cell processes. The cleft, fusion pores and molecules are enlarged. Gold markers track the contents of selected vesicles. Timing and voltage ticks show relative changes.",
  ),
  controls: [
    {
      id: "illumination",
      label: b("光照条件", "Illumination"),
      default: "step",
      options: [
        { value: "step", label: b("暗 → 光 → 暗", "Dark → light → dark") },
        { value: "dark", label: b("持续黑暗", "Hold darkness") },
        {
          value: "light",
          label: b("开灯后持续光照", "Keep light on after onset"),
        },
      ],
    },
  ],
  stages,
  legend: [
    { color: "#655665", text: b("突触带", "Synaptic ribbon") },
    { color: "#c67d22", text: b("谷氨酸标记", "Glutamate markers") },
    { color: "#5597bf", text: b("CaV1.4 与 Ca²⁺", "CaV1.4 and Ca²⁺") },
    { color: "#936953", text: b("mGluR6", "mGluR6") },
    { color: "#68718e", text: b("TRPM1", "TRPM1") },
    {
      color: "#53596b",
      text: b(
        "横线 · 胞内相对负电位",
        "Minus marks · relative intracellular negativity",
      ),
    },
  ],
  sources: [
    {
      title:
        "Ishibashi et al. (2022) · Three-dimensional reconstruction of mouse rod spherules, ribbons and invaginating processes",
      url: "https://doi.org/10.7554/eLife.73039",
    },
    {
      title:
        "Hays et al. (2020) · Resting and stimulated mouse rods show distinct patterns of vesicle release at ribbon synapses",
      url: "https://pubmed.ncbi.nlm.nih.gov/33175961/",
    },
    {
      title:
        "Grabner et al. (2015) · RIM1/2, CaV1.4 opening and calcium-stimulated release in mouse rods",
      url: "https://pubmed.ncbi.nlm.nih.gov/26400943/",
    },
    {
      title:
        "Dhingra et al. (2000) · The light response of ON bipolar neurons requires Gαₒ",
      url: "https://pubmed.ncbi.nlm.nih.gov/11124982/",
    },
    {
      title:
        "Morgans et al. (2009) · TRPM1 is required for the depolarizing light response in retinal ON-bipolar cells",
      url: "https://pubmed.ncbi.nlm.nih.gov/19861548/",
    },
  ],
  create,
};
