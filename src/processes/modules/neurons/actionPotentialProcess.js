import { bilayer, pore } from "./structural.js";
import { THREE, sceneKit, clamp, phase, bilingual as b } from "../../kit.js";

const stages = [
  [
    0,
    "静息膜",
    "Resting membrane",
    "示例为哺乳动物无髓轴突的纵向剖面。离子梯度已存在；本图不显示所有维持梯度的机制。",
    "Longitudinal cutaway of a mammalian unmyelinated axon. Ion gradients already exist; not all mechanisms maintaining them are shown.",
  ],
  [
    0.12,
    "局部刺激",
    "Local stimulus",
    "足够强的起始刺激使左侧膜去极化；关闭刺激可比较静息状态。",
    "A sufficient initiating stimulus depolarizes the left membrane; remove the stimulus to compare with rest.",
  ],
  [
    0.24,
    "钠通道开放",
    "Sodium channels open",
    "电压门控 Na⁺ 通道短暂开放，Na⁺ 在局部跨膜内流。青绿色膜区表示去极化。",
    "Voltage-gated Na⁺ channels briefly open and Na⁺ enters locally across the membrane. Teal membrane marks depolarization.",
  ],
  [
    0.42,
    "邻近膜依次激活",
    "Neighboring membrane activates",
    "局部电流使前方膜达到阈值，动作电位被逐段再生；不是同一批离子沿轴突奔跑。",
    "Local current brings the membrane ahead to threshold, regenerating the action potential along the axon; the same ions do not race along its length.",
  ],
  [
    0.64,
    "钾外流与不应期",
    "Potassium efflux and refractoriness",
    "Na⁺ 通道失活，延迟开放的 K⁺ 通道使 K⁺ 外流、膜复极化。后方短暂不应期限制再次激发。",
    "Na⁺ channels inactivate; delayed K⁺ channel opening lets K⁺ leave and repolarizes the membrane. The region behind is temporarily refractory.",
  ],
  [
    0.9,
    "恢复可兴奋状态",
    "Excitability recovers",
    "K⁺ 通道随后关闭，Na⁺ 通道从失活中恢复。示意动画放慢并拉开各阶段，不代表真实时间或电压。",
    "K⁺ channels then close and Na⁺ channels recover from inactivation. Phases are slowed and separated schematically, without quantitative time or voltage.",
  ],
].map(([at, zh, en, dz, de]) => ({
  at,
  title: b(zh, en),
  description: b(dz, de),
}));

export default {
  id: "actionPotential",
  title: b("动作电位传播", "Action potential propagation"),
  intro: b(
    "哺乳动物无髓神经元轴突：观察电压门控钠、钾通道如何逐段再生电信号。膜与离子均为示意比例。",
    "Mammalian unmyelinated neuronal axon: see how voltage-gated sodium and potassium channels regenerate an electrical signal along the membrane. Membrane and ions are schematic.",
  ),
  duration: 32,
  stages,
  controls: [
    {
      id: "stimulus",
      label: b("起始刺激", "Initiating stimulus"),
      default: "on",
      options: [
        { value: "on", label: b("足够强的刺激", "Sufficient stimulus") },
        { value: "off", label: b("无刺激", "No stimulus") },
      ],
    },
  ],
  sources: [
    {
      title: "NCBI Bookshelf — Neuroanatomy, Neuron Action Potential",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK546639/",
    },
    {
      title:
        "Action potential initiation and propagation: upstream influences on neurotransmission",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2661755/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const lipid = k.material("#b5b9af"),
      rest = k.material("#81968b"),
      na = k.material("#4b9694"),
      potassium = k.material("#c49b5d");
    const box = new THREE.BoxGeometry(1, 1, 1);
    const axonWall = k.mesh(
      new THREE.CylinderGeometry(
        0.86,
        0.86,
        8.5,
        40,
        1,
        true,
        Math.PI / 2,
        Math.PI,
      ),
      k.material("#9caf9f", { side: THREE.DoubleSide }),
      [0, 0, -0.03],
    );
    axonWall.rotation.z = Math.PI / 2;
    const axoplasm = k.mesh(
      new THREE.CylinderGeometry(
        0.78,
        0.78,
        8.45,
        32,
        1,
        true,
        Math.PI / 2,
        Math.PI,
      ),
      k.material("#c1cebf", { side: THREE.DoubleSide }),
      [0, 0, 0.015],
    );
    axonWall.name = "axon cutaway wall";
    axoplasm.rotation.z = Math.PI / 2;
    const holes = [];
    for (let i = 0; i < 6; i++)
      for (const dx of [-0.28, 0.28])
        holes.push({ x: -3.15 + i * 1.26 + dx, z: 0.25, r: 0.245 });
    bilayer(k, { x0: -4.25, x1: 4.25, y: 0.86, z0: -0.6, z1: 0.72, holes });
    bilayer(k, { x0: -4.25, x1: 4.25, y: -0.86, z0: -0.6, z1: 0.72 });
    const zones = [];
    for (let i = 0; i < 6; i++) {
      const x = -3.15 + i * 1.26;
      const patch = k.mesh(
        new THREE.CylinderGeometry(
          0.8,
          0.8,
          1.12,
          28,
          1,
          true,
          Math.PI / 2,
          Math.PI,
        ),
        rest.clone(),
        [x, 0, 0.04],
      );
      patch.rotation.z = Math.PI / 2;
      const parts = [];
      for (const type of ["na", "k"]) {
        const cx = x + (type === "na" ? -0.28 : 0.28),
          mat = type === "na" ? na : potassium;
        const channel = pore(k, {
          position: [cx, 0.86, 0.25],
          color: type === "na" ? "#4b9694" : "#bd985d",
          radius: 0.135,
          height: 0.62,
        });
        const ion = k.ball([cx, type === "na" ? 1.6 : 0.1, 0.25], 0.061, mat);
        parts.push({ type, cx, channel, ion });
      }
      zones.push({ x, patch, parts });
    }
    const current = k.segment([-3.5, 0, 0.6], [-2.8, 0, 0.6], 0.035, na);
    const tip = k.mesh(
      new THREE.ConeGeometry(0.12, 0.26, 16),
      na,
      [-2.65, 0, 0.6],
    );
    tip.rotation.z = -Math.PI / 2;
    const stimulus = k.ring([-4, 0.86, 0.5], 0.34, 0.04, potassium);
    // Molecular detail and propagation are deliberately different scales.
    const overview = new THREE.Group();
    overview.name = "unmyelinated axon propagation overview";
    for (const child of [...group.children]) overview.add(child);
    group.add(overview);
    overview.position.set(2.65, 0.25, 0);
    overview.scale.set(0.46, 0.88, 0.7);
    const selectedIndex = 3,
      selectedX = -3.15 + selectedIndex * 1.26;
    const locator = k.ring(
      [selectedX, 0.86, 0.34],
      0.4,
      0.035,
      potassium,
      overview,
    );
    locator.scale.set(1.0, 1.05, 1);
    // Explicit stationary connector marks which membrane region is magnified.
    k.tube(
      [
        [2.65 + selectedX * 0.46, 1.3, 0.05],
        [2.65 + selectedX * 0.46, 2.1, 0.05],
        [-1.75, 2.1, 0.05],
        [-1.75, 1.56, 0.05],
      ],
      0.015,
      k.material("#a3aba2"),
      group,
      64,
    );
    const detail = new THREE.Group();
    detail.name = "stationary selected membrane region enlarged";
    detail.position.set(-2.45, 0.2, 0.15);
    detail.scale.setScalar(2.6);
    group.add(detail);
    const detailLipids = new THREE.Group();
    detail.add(detailLipids);
    detailLipids.scale.y = 1.8;
    bilayer(k, {
      x0: -0.91,
      x1: 0.91,
      y: 0,
      z0: -0.42,
      z1: 0.45,
      holes: [
        { x: -0.43, z: 0, r: 0.235 },
        { x: 0.43, z: 0, r: 0.235 },
      ],
      parent: detailLipids,
      spacing: 0.095,
    });
    const detailChannels = [];
    for (const type of ["na", "k"]) {
      const x = type === "na" ? -0.43 : 0.43,
        mat = type === "na" ? na : potassium;
      const channel = pore(k, {
        position: [x, 0, 0],
        color: type === "na" ? "#467f81" : "#b18b50",
        radius: 0.135,
        height: 0.62,
        parent: detail,
      });
      const mouth = k.ring(
        [x, 0.335, 0],
        0.112,
        0.024,
        k.material(type === "na" ? "#8ab5b1" : "#d0b789"),
        detail,
      );
      mouth.rotation.x = Math.PI / 2;
      const exit = k.ring([x, -0.335, 0], 0.105, 0.021, mat, detail);
      exit.rotation.x = Math.PI / 2;
      const ions = Array.from({ length: 3 }, () =>
        k.ball([x, 0.65, 0], 0.047, mat, detail),
      );
      detailChannels.push({ type, x, channel, ions });
    }
    const labels = [
      k.label(
        [-2.45, 2.61, 0.1],
        "局部放大 · 同一段膜",
        "Enlarged view · the same membrane region",
        2,
      ),
      k.label(
        [-3.57, 1.52, 0.3],
        "Na⁺ 通道 · 局部内流",
        "Na⁺ channel · local influx",
        2,
      ),
      k.label(
        [-1.33, 1.52, 0.3],
        "K⁺ 通道 · 局部外流",
        "K⁺ channel · local efflux",
        2,
      ),
      k.label(
        [-2.45, -1.53, 0.3],
        "细胞质侧 · 通道门控",
        "Cytoplasmic side · channel gates",
        1,
      ),
      k.label([-2.45, 0.85, 1.02], "细胞外侧", "Extracellular side", 1),
      k.label(
        [2.65, -1.25, 0.25],
        "无髓轴突 · 去极化依次再生",
        "Unmyelinated axon · sequential depolarization",
        2,
      ),
      k.label(
        [2.65, -1.85, 0.25],
        "青绿：去极化 · 金色：复极化 · 灰紫：不应期",
        "Teal: depolarization · gold: repolarization · gray: refractory",
        1,
      ),
      k.label(
        [2.65 + selectedX * 0.46, 1.5, 0.4],
        "此处放大",
        "Magnified region",
        1,
      ),
    ];
    const baseColor = new THREE.Color("#81968b"),
      depColor = new THREE.Color("#4b9694"),
      repColor = new THREE.Color("#c49b5d"),
      refrColor = new THREE.Color("#928c9d");
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        enabled = parameters.stimulus !== "off";
      let openNa = 0,
        openK = 0,
        refractory = 0;
      for (let i = 0; i < zones.length; i++) {
        const z = zones[i],
          t = enabled ? (p - (0.14 + i * 0.105)) / 0.21 : -1;
        const n = t >= 0 && t < 0.25,
          q = t >= 0.22 && t < 0.69,
          r = t >= 0.25 && t < 0.9;
        openNa += n ? 1 : 0;
        openK += q ? 1 : 0;
        refractory += r ? 1 : 0;
        z.patch.material.color.copy(
          n ? depColor : q ? repColor : r ? refrColor : baseColor,
        );
        z.patch.material.emissive.copy(n ? depColor : baseColor);
        z.patch.material.emissiveIntensity = n ? 0.22 : 0;
        for (const a of z.parts) {
          const opened = a.type === "na" ? n : q;
          const f = a.type === "na" ? phase(t, 0, 0.25) : phase(t, 0.22, 0.69);
          a.channel.setOpen(opened);
          a.ion.visible = opened;
          a.ion.position.y = a.type === "na" ? 1.55 - 1.4 * f : 0.15 + 1.4 * f;
        }
      }
      const localT = enabled ? (p - (0.14 + selectedIndex * 0.105)) / 0.21 : -1;
      for (const d of detailChannels) {
        const isNa = d.type === "na",
          opened = isNa
            ? localT >= 0 && localT < 0.25
            : localT >= 0.22 && localT < 0.69;
        const localFlow = isNa
          ? phase(localT, 0, 0.25)
          : phase(localT, 0.22, 0.69);
        d.channel.setOpen(opened);
        d.ions.forEach((ion, j) => {
          const f = localFlow * 1.45 - j * 0.22;
          ion.visible = opened && f >= 0 && f <= 1;
          ion.position.set(d.x, isNa ? 0.68 - 1.36 * f : -0.68 + 1.36 * f, 0);
        });
      }
      const front = -3.65 + 8 * phase(p, 0.14, 0.72);
      current.visible = tip.visible = enabled && p >= 0.14 && p < 0.72;
      current.position.x = front + 0.35;
      tip.position.x = front + 0.83;
      stimulus.visible = enabled && p >= 0.1 && p < 0.2;
      group.userData = {
        process: "actionPotential",
        specimen: "mammalian unmyelinated neuronal axon",
        stimulus: enabled ? "on" : "off",
        sodiumOpen: openNa,
        potassiumOpen: openK,
        refractoryZones: refractory,
        propagation: "regenerated depolarization left to right",
        ionMotion: "local transmembrane only",
        recovered: p >= 0.9,
        magnifiedRegion: selectedIndex,
        magnification: 2.6,
        detailSodiumOpen: enabled && localT >= 0 && localT < 0.25,
        detailPotassiumOpen: enabled && localT >= 0.22 && localT < 0.69,
        detailTracksFixedMembraneRegion: true,
      };
    }
    update(0);
    return {
      group,
      update,
      camera: { position: [0, 3.6, 12.5], target: [0, 0.25, 0] },
      labels,
    };
  },
};
