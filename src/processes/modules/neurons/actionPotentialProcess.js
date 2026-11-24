import { bilayer } from "./structural.js";
import { anchorObject } from "./labelAnchors.js";
import { THREE, sceneKit, clamp, phase, bilingual as b } from "../../kit.js";

import {
  axonPores,
  cationMark,
  localMembraneTime,
  sodiumState,
  potassiumOpen,
  sodiumInactivation,
  spatialVoltage,
} from "./axonMembrane.js";

// The second sample lies just upstream of nominal zone 1, so the 0.24 Na
// stage opens on a measured pore together with the wavefront. All samples,
// including the voltage trace, use the same distance-dependent delay.
const samples = [0, 0.9, 2, 3, 4, 5];
const axonX = (zone) => -3.15 + zone * 1.26;

const sodiumCaptions = {
  closed: b("Na⁺ 通道 · 关闭", "Na⁺ channel · closed"),
  open: b("Na⁺ 通道 · 开放内流", "Na⁺ channel · open, influx"),
  inactivated: b("Na⁺ 通道 · 失活", "Na⁺ channel · inactivated"),
  recovered: b(
    "Na⁺ 通道 · 关闭，恢复可激活",
    "Na⁺ channel · closed, excitable again",
  ),
};
const potassiumCaptions = {
  closed: b("K⁺ 通道 · 关闭", "K⁺ channel · closed"),
  open: b("K⁺ 通道 · 开放外流", "K⁺ channel · open, efflux"),
};

const stages = [
  [
    0,
    "静息膜",
    "Resting membrane",
    "放大区上方是细胞外液，Na⁺ 较多；下方是细胞质，K⁺ 较多。蓝色和铜色小球分别表示这两种正离子，颗数仅作示意。",
    "The enlarged patch faces Na⁺-rich extracellular fluid above and K⁺-rich cytoplasm below. Blue and copper spheres represent these positive ions. Counts are illustrative.",
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
    "电压门控 Na⁺ 通道短暂开放，Na⁺ 在局部跨膜内流。青绿色膜区表示去极化。放大窗固定观察金色圈出的膜段；波到达该段之前，放大通道仍关闭。",
    "Voltage-gated Na⁺ channels briefly open and Na⁺ enters locally across the membrane. Teal membrane marks depolarization. The enlarged window follows the fixed gold-circled region; its channels remain closed until the wave reaches it.",
  ],
  [
    0.42,
    "邻近膜依次激活",
    "Neighboring membrane activates",
    "局部电流使前方膜达到阈值。轴突下方的曲线表示同一时刻各处的膜电位，曲线隆起随波向右移动。放大区的离子只在当地跨膜。",
    "Local current brings the membrane ahead to threshold. The curve below the axon shows membrane potential by position at one instant. Its crest travels to the right while ions cross locally.",
  ],
  [
    0.64,
    "钾外流与不应期",
    "Potassium efflux and refractoriness",
    "延迟开放的 K⁺ 通道让 K⁺ 外流，膜电位回落。Na⁺ 通道失活时，胞质侧的紫色连接环扣在孔侧。波后方的膜要等通道恢复才能再次兴奋。",
    "Delayed K⁺ opening allows outward current and repolarization. During Na⁺ channel inactivation, the purple intracellular linker docks beside the pore. The channel must recover before it can open again.",
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
  contexts: {
    neuron: {
      intro: b(
        "从有髓神经元结构转入一个无髓轴突的膜机制示例，观察电压门控钠、钾通道如何逐段再生电信号。此过程展示连续传导；髓鞘、郎飞结与跳跃式传导未模拟。膜与离子均为示意比例。",
        "From the myelinated neuron structure, explore membrane mechanisms in an unmyelinated axon example: voltage-gated sodium and potassium channels regenerate the signal along the membrane. This process shows continuous conduction; myelin, nodes of Ranvier and saltatory conduction are not modeled. Membrane and ions are schematic.",
      ),
    },
  },
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
      title:
        "Alle, Roth & Geiger (2009) — Energy-efficient action potentials in hippocampal mossy fibers",
      url: "https://pubmed.ncbi.nlm.nih.gov/19745156/",
    },
    {
      title:
        "Hodgkin & Huxley (1952) — A quantitative description of membrane current and its application to conduction and excitation in nerve",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1392413/",
    },
    {
      title:
        "Fan et al. (2023) — Cryo-EM structure of human voltage-gated sodium channel Naᵥ1.6",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9945969/",
    },
    {
      title:
        "Long, Campbell & MacKinnon (2005) — Crystal structure of a mammalian voltage-dependent Shaker family K⁺ channel",
      url: "https://pubmed.ncbi.nlm.nih.gov/16002581/",
    },
    {
      title:
        "Jiang et al. (2021) — Open-state structure and pore gating mechanism of the cardiac sodium channel",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8673466/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const pore = axonPores(k);
    const markCation = cationMark(k);
    const rest = k.material("#81968b", { side: THREE.DoubleSide }),
      na = k.material("#346b9c"),
      potassium = k.material("#b96632"),
      field = k.material("#59697a"),
      locatorGold = k.material("#b48f53");
    function membrane(options) {
      const { heads, tails } = bilayer(k, options);
      heads.material.color.set("#c2bdb0");
      tails.material.color.set("#baab91");
      return heads;
    }
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
    for (const sample of samples)
      for (const dx of [-0.28, 0.28])
        holes.push({ x: axonX(sample) + dx, z: 0.25, r: 0.26 });
    membrane({ x0: -4.25, x1: 4.25, y: 0.86, z0: -0.6, z1: 0.72, holes });
    membrane({ x0: -4.25, x1: 4.25, y: -0.86, z0: -0.6, z1: 0.72 });
    const zones = [];
    for (let i = 0; i < samples.length; i++) {
      const x = axonX(samples[i]);
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
      patch.name = `axon state band ${i}`;
      const parts = [];
      for (const type of ["na", "k"]) {
        const cx = x + (type === "na" ? -0.28 : 0.28),
          mat = type === "na" ? na : potassium;
        const channel = pore(group, [cx, 0.86, 0.25], type);
        const ion = k.ball(
          [cx, type === "na" ? 1.6 : 0.1, 0.25],
          type === "na" ? 0.052 : 0.058,
          mat,
        );
        ion.name = type + " overview crossing ion";
        parts.push({ type, cx, channel, ion });
      }
      zones.push({ x, patch, parts });
    }
    const current = k.segment([-3.5, 0, 0.6], [-2.8, 0, 0.6], 0.035, field);
    const tip = k.mesh(
      new THREE.ConeGeometry(0.12, 0.26, 16),
      field,
      [-2.65, 0, 0.6],
    );
    tip.rotation.z = -Math.PI / 2;
    const stimulus = new THREE.Group();
    group.add(stimulus);
    k.ring([-4, 0.86, 0.5], 0.34, 0.04, locatorGold, stimulus);
    k.segment([-4, 1.82, 0.46], [-4, 1.39, 0.46], 0.047, field, stimulus);
    const stimulusTip = k.mesh(
      new THREE.ConeGeometry(0.13, 0.25, 16),
      field,
      [-4, 1.29, 0.46],
      stimulus,
    );
    stimulusTip.rotation.z = Math.PI;
    // Molecular detail and propagation are deliberately different scales.
    const overview = new THREE.Group();
    overview.name = "unmyelinated axon propagation overview";
    for (const child of [...group.children]) overview.add(child);
    group.add(overview);
    overview.position.set(2.65, 0.25, 0);
    overview.scale.set(0.46, 0.88, 0.7);
    const selectedIndex = 3,
      selectedX = axonX(samples[selectedIndex]);
    const locator = k.ring(
      [selectedX, 0.86, 0.34],
      0.4,
      0.035,
      locatorGold,
      overview,
    );
    locator.name = "fixed overview membrane sample";
    locator.scale.set(1.0, 1.05, 1);
    const detail = new THREE.Group();
    detail.name = "stationary selected membrane region enlarged";
    detail.position.set(-2.45, 0.2, 0.15);
    detail.scale.setScalar(2.6);
    group.add(detail);
    const detailLipids = new THREE.Group();
    detail.add(detailLipids);
    detailLipids.scale.y = 1.8;
    const exposedHeads = membrane({
      x0: -0.91,
      x1: 0.91,
      y: 0,
      z0: -0.42,
      // Remove the camera-facing half of this enlarged cutaway so the
      // gate, central lumen and local ion transit remain visible.
      z1: 0,
      holes: [
        { x: -0.43, z: 0, r: 0.264 },
        { x: 0.43, z: 0, r: 0.264 },
      ],
      parent: detailLipids,
      spacing: 0.095,
    });
    // Land the magnification leader on an actual outer-leaflet head and on
    // the overview ring. The intervening space contains mobile ions.
    const headMatrix = new THREE.Matrix4();
    exposedHeads.getMatrixAt(exposedHeads.count - 1, headMatrix);
    const corner = exposedHeads.localToWorld(
      new THREE.Vector3().setFromMatrixPosition(headMatrix),
    );
    const ringTop = locator.localToWorld(new THREE.Vector3(0, 0.4, 0));
    const ridge = 1.94;
    const leader = k.tube(
      [
        ringTop.toArray(),
        [ringTop.x, ridge - 0.14, ringTop.z],
        [ringTop.x - 0.12, ridge, ringTop.z],
        [ringTop.x - 0.35, ridge, ringTop.z],
        [corner.x + 0.35, ridge, corner.z],
        [corner.x + 0.12, ridge, corner.z],
        [corner.x, ridge - 0.14, corner.z],
        corner.toArray(),
      ],
      0.013,
      k.material("#a39783"),
      group,
      54,
    );
    leader.name = "fixed membrane magnification leader";
    const detailChannels = [];
    for (const type of ["na", "k"]) {
      const x = type === "na" ? -0.43 : 0.43,
        mat = type === "na" ? na : potassium;
      const channel = pore(detail, [x, 0, 0], type, true);
      const mouth = k.ring(
        [x, 0.335, 0],
        0.112,
        0.024,
        k.material(type === "na" ? "#8299ac" : "#c9ac82"),
        detail,
      );
      mouth.name = `enlarged ${type} extracellular collar`;
      mouth.rotation.x = Math.PI / 2;
      const exit = k.ring([x, -0.335, 0], 0.105, 0.021, mat, detail);
      exit.name = `enlarged ${type} cytoplasmic collar`;
      exit.rotation.x = Math.PI / 2;
      const ions = Array.from({ length: 3 }, (_, j) => {
        const ion = k.ball(
          [x, 0.65, 0],
          type === "na" ? 0.055 : 0.061,
          mat,
          detail,
        );
        ion.name = type + " crossing ion " + j;
        markCation(ion);
        return ion;
      });
      const side = type === "na" ? -1 : 1;
      const flowArrow = new THREE.Group();
      flowArrow.name = type + " flux direction beyond exit";
      detail.add(flowArrow);
      k.segment(
        [x, side * 0.69, 0],
        [x, side * 0.81, 0],
        0.014,
        mat,
        flowArrow,
      );
      const head = k.mesh(
        new THREE.ConeGeometry(0.052, 0.11, 20),
        mat,
        [x, side * 0.845, 0],
        flowArrow,
      );
      head.rotation.z = side < 0 ? Math.PI : 0;
      let latch;
      if (type === "na") {
        const cytoplasmic = new THREE.Group();
        channel.group.add(cytoplasmic);
        latch = sodiumInactivation(k, cytoplasmic, channel);
      }
      detailChannels.push({
        type,
        x,
        channel,
        ions,
        mouth,
        exit,
        flowArrow,
        latch,
      });
    }
    // Representative stationary ions show that gradients exist even at rest.
    // Sparse samples deliberately avoid the tubes along which the marked ions move.
    const compartments = new THREE.Group();
    detail.add(compartments);
    for (const [species, coords, color] of [
      [
        "Na+",
        [
          [-0.8, 0.53, -0.19],
          [-0.66, 0.66, -0.27],
          [-0.19, 0.47, -0.15],
          [0.08, 0.65, -0.23],
          [0.73, 0.52, -0.17],
          [0.22, -0.59, -0.24],
        ],
        "#6a8aa4",
      ],
      [
        "K+",
        [
          [-0.75, -0.6, -0.2],
          [-0.23, -0.53, -0.18],
          [0.01, -0.69, -0.14],
          [0.75, -0.54, -0.14],
          [0.65, -0.69, -0.32],
          [0.23, 0.52, -0.24],
        ],
        "#bb895f",
      ],
    ]) {
      const pool = new THREE.InstancedMesh(
        k.sphere,
        k.material(color),
        coords.length,
      );
      pool.name = species + " compartment samples";
      const obj = new THREE.Object3D();
      obj.scale.setScalar(species === "Na+" ? 0.031 : 0.036);
      coords.forEach((xyz, i) => {
        obj.position.fromArray(xyz);
        obj.updateMatrix();
        pool.setMatrixAt(i, obj.matrix);
      });
      compartments.add(pool);
    }
    const voltage = spatialVoltage(
      k,
      (zone) => 2.65 + axonX(zone) * 0.46,
      selectedIndex,
      samples,
    );
    const labels = [
      k.label(
        [-2.45, 2.61, 0.1],
        "局部放大 · 同一段膜",
        "Enlarged view · the same membrane region",
        2,
      ),
      k.label([-3.57, 1.52, 0.3], "Na⁺ 通道 · 关闭", "Na⁺ channel · closed", 2),
      k.label([-1.33, 1.52, 0.3], "K⁺ 通道 · 关闭", "K⁺ channel · closed", 2),
      k.label(
        [-2.45, -1.53, 0.3],
        "细胞质侧 · K⁺ 较多",
        "Cytoplasm · K⁺ enriched",
        1,
      ),
      k.label(
        [-2.45, 0.85, 1.02],
        "细胞外侧 · Na⁺ 较多",
        "Outside · Na⁺ enriched",
        1,
      ),
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
      k.label(
        [0, 0, 0],
        "膜电位 · 内相对外，向上为去极化",
        "Membrane potential · inside relative to outside, upward is depolarized",
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
          t = localMembraneTime(p, samples[i], enabled);
        const state = sodiumState(t),
          n = state === "open",
          q = potassiumOpen(t),
          r = state === "inactivated";
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
      const localT = localMembraneTime(p, samples[selectedIndex], enabled);
      const sodium = sodiumState(localT),
        potassiumConducting = potassiumOpen(localT);
      labels[1].text = sodiumCaptions[sodium];
      labels[2].text = potassiumConducting
        ? potassiumCaptions.open
        : potassiumCaptions.closed;
      for (const d of detailChannels) {
        const isNa = d.type === "na",
          opened = isNa ? sodium === "open" : potassiumConducting;
        d.latch?.(sodium === "inactivated");
        d.flowArrow.visible = opened;
        const localFlow = isNa
          ? phase(localT, 0, 0.25)
          : phase(localT, 0.22, 0.69);
        d.channel.setOpen(opened);
        d.ions.forEach((ion, j) => {
          const f = localFlow * 1.72 - j * 0.36;
          ion.visible = opened && f >= 0 && f <= 1;
          ion.position.set(d.x, isNa ? 0.68 - 1.36 * f : -0.68 + 1.36 * f, 0);
        });
      }
      voltage.update(p, enabled);
      const front = -3.65 + 8 * phase(p, 0.14, 0.72);
      current.visible = tip.visible = enabled && p >= 0.14 && p < 0.72;
      current.position.x = front + 0.35;
      tip.position.x = front + 0.83;
      stimulus.visible = enabled && p >= 0.1 && p < 0.2;
      anchorObject(labels[0], detailLipids);
      anchorObject(labels[1], detailChannels[0].mouth);
      anchorObject(labels[2], detailChannels[1].mouth);
      anchorObject(labels[3], detailChannels[0].exit);
      // Compartment labels deliberately identify the extracellular region.
      anchorObject(labels[4], detail, 0, 0.5, 0.15);
      anchorObject(labels[5], axoplasm);
      anchorObject(labels[6], zones[selectedIndex].patch);
      anchorObject(labels[7], locator);
      anchorObject(labels[8], voltage.probe);
      Object.assign(group.userData, {
        process: "actionPotential",
        specimen: "mammalian unmyelinated neuronal axon",
        stimulus: enabled ? "on" : "off",
        sodiumOpen: openNa,
        potassiumOpen: openK,
        refractoryZones: refractory,
        propagation: "regenerated depolarization left to right",
        ionMotion: "local transmembrane only",
        recovered: enabled && p >= 0.9,
        magnifiedRegion: selectedIndex,
        magnification: 2.6,
        detailSodiumOpen: sodium === "open",
        detailSodiumState: sodium,
        detailPotassiumOpen: potassiumConducting,
        detailTracksFixedMembraneRegion: true,
      });
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
