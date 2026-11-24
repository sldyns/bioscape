import { THREE, sceneKit, bilingual as b, clamp, ease } from "../../kit.js";
import {
  rodDisks,
  rodChannel,
  diskProteins,
  nucleotidePool,
} from "./outerSegment.js";

const title = b("杆细胞的光转导", "Rod phototransduction");
function stage(at, title, description, darkTitle, darkDescription) {
  return {
    at,
    title,
    description,
    conditionCopy: [
      {
        when: { illumination: "dark" },
        title: darkTitle,
        description: darkDescription,
      },
    ],
  };
}
const stages = [
  stage(
    0,
    b("暗电流穿过外节质膜", "The dark current crosses the plasma membrane"),
    b(
      "黑暗中，胞质的 cGMP 与环核苷酸门控通道（CNG）结合。开放通道让 Na⁺ 和 Ca²⁺ 从细胞外进入外节，杆细胞相对去极化。",
      "In darkness, cytosolic cGMP binds cyclic nucleotide-gated (CNG) channels. Open channels admit extracellular Na⁺ and Ca²⁺ into the outer segment, keeping the rod relatively depolarized.",
    ),
    b("黑暗中的内向电流", "An inward current in darkness"),
    b(
      "持续黑暗时，质膜上的 CNG 通道有一部分开放。示意离子从细胞外一侧进入胞质。",
      "In sustained darkness a fraction of plasma-membrane CNG channels is open. The illustrated ions move from the extracellular side into the cytosol.",
    ),
  ),
  stage(
    0.13,
    b("视紫红质吸收光子", "Rhodopsin absorbs a photon"),
    b(
      "一次短暂闪光使盘膜内视紫红质的 11-顺式视黄醛转为全反式，受体随之活化。成熟膜盘是外节内独立的扁平囊。",
      "During a brief flash, absorption by rhodopsin changes its 11-cis retinal to all-trans retinal and activates the receptor. A mature disk is a flattened sac inside the outer segment.",
    ),
    b("视紫红质处于暗态", "Rhodopsin stays in its dark state"),
    b(
      "选择持续黑暗，盘膜上的受体保持暗态。图中不出现触发级联反应的光子。",
      "With darkness held, disk rhodopsin stays in its dark state. No flash activates the illustrated receptors.",
    ),
  ),
  stage(
    0.3,
    b("转导蛋白在盘面接力", "Transducin carries the signal along the disk"),
    b(
      "活化的视紫红质促进转导蛋白 α 亚基以 GTP 替换 GDP。带有 GTP 的 α 亚基沿盘膜胞质侧与 PDE6 结合，解除对磷酸二酯酶的抑制。",
      "Activated rhodopsin promotes GDP–GTP exchange on transducin. GTP-bound α engages PDE6 on the cytosolic face of the disk and relieves inhibition of the phosphodiesterase.",
    ),
    b("转导蛋白保持暗态组合", "Transducin remains in its dark-state complex"),
    b(
      "没有闪光激活视紫红质。图中的转导蛋白保持 GDP 结合状态，PDE6 维持基础活性。",
      "Without a flash, the illustrated transducin remains GDP-bound and PDE6 retains its basal activity.",
    ),
  ),
  stage(
    0.49,
    b("PDE6 水解胞质 cGMP", "PDE6 hydrolyzes cytosolic cGMP"),
    b(
      "活化的 PDE6 打开 cGMP 的环磷酸键，释放 5′-GMP。胞质中的可用 cGMP 减少，CNG 通道失去配体。",
      "Activated PDE6 opens the cyclic phosphate of cGMP to produce 5′-GMP. The available cytosolic cGMP falls, and CNG channels lose ligand.",
    ),
    b("cGMP 保持暗态水平", "cGMP stays near its dark level"),
    b(
      "基础水解与合成仍在进行。没有闪光增强 PDE6 的活性，示意的胞质 cGMP 水平和 CNG 通道开放状态得以维持。",
      "Basal hydrolysis and synthesis continue. Without flash-evoked PDE6 activation, the illustrated cGMP level and CNG-channel opening are maintained.",
    ),
  ),
  stage(
    0.67,
    b("内向电流减小，膜电位更负", "Less inward current hyperpolarizes the rod"),
    b(
      "随着 cGMP 减少，CNG 通道开放的比例下降。外节的内向电流减小，内节仍有 K⁺ 外流，膜电位逐渐变负。图中的电荷符号表示相对电位变化。",
      "With less cGMP, fewer CNG channels are open. Inward current in the outer segment falls while K⁺ efflux continues in the inner segment, giving a graded hyperpolarization. The charge symbols indicate the relative voltage change.",
    ),
    b("暗电流持续", "The dark current continues"),
    b(
      "CNG 通道继续允许阳离子向内流动。杆细胞维持相对去极化的暗态膜电位。",
      "CNG channels continue to admit cations. The rod maintains its relatively depolarized dark membrane potential.",
    ),
  ),
  stage(
    0.85,
    b("短闪后，通道重新开放", "The channels reopen after the flash"),
    b(
      "视紫红质信号终止，转导蛋白水解 GTP，PDE6 活性下降。视网膜鸟苷酸环化酶从 GTP 补充 cGMP，通道重新开放，膜电位回向暗态。",
      "Rhodopsin signaling is quenched, transducin hydrolyzes GTP, and PDE6 activity subsides. Retinal guanylyl cyclase replenishes cGMP from GTP. Channels reopen and voltage moves back toward its dark level.",
    ),
    b("黑暗条件保持不变", "The rod remains in darkness"),
    b(
      "没有短闪后的恢复阶段。开放通道的内向暗电流仍在持续。",
      "With darkness held there is no flash response to recover from. Inward dark current continues through open channels.",
    ),
  ),
];

const restingText = b(
  "开放的 CNG 通道 · 暗电流",
  "Open CNG channel · dark current",
);
const closingText = b("CNG 通道闭合", "CNG channel closes");
const reopeningText = b("CNG 通道重新开放", "CNG channel reopens");
const restingVoltage = b("内侧电位 · 暗态", "Inside voltage · dark state");
const peakVoltage = b(
  "膜内侧变得更负",
  "Membrane interior becomes more negative",
);

function channelOpening(p, flash) {
  return flash ? 1 - ease(p, 0.61, 0.77) * (1 - ease(p, 0.86, 0.985)) : 1;
}
function create() {
  const k = sceneKit(),
    { group } = k;
  group.name =
    "Mammalian rod outer segment, disk-to-plasma-membrane phototransduction";
  const disk = rodDisks(k);
  const { plasma, channel, channelY, setOpen } = rodChannel(k);
  const {
    rhodopsin,
    retinal,
    straight,
    alpha,
    nucleotide,
    gammaPhosphate,
    pde,
    inhibitors,
  } = diskProteins(k);
  const channelAnchor = channel.getObjectByName("cng-extracellular-domain");
  const molecule = nucleotidePool(k);
  const darkGuanine = k.material("#a29c8d"),
    activeGuanine = k.material("#e1a65c");
  const cyclase = new THREE.Group();
  cyclase.name = "disk-retinal-guanylyl-cyclase";
  cyclase.position.set(-0.63, 0.255, -0.79);
  group.add(cyclase);
  const cyclaseMat = k.material("#728b98");
  for (const side of [-1, 1]) {
    k.ball([side * 0.082, 0.087, 0], [0.067, 0.16, 0.065], cyclaseMat, cyclase);
    k.ball(
      [side * 0.073, 0.235, 0.012],
      [0.077, 0.093, 0.075],
      cyclaseMat,
      cyclase,
    );
  }

  const light = k.material("#e4aa44", {
    emissive: "#9c641f",
    emissiveIntensity: 0.32,
  });
  const photon = new THREE.Group();
  photon.name = "incoming-photon";
  group.add(photon);
  const wavePoints = Array.from({ length: 30 }, (_, i) => {
    const u = i / 29;
    return [
      -0.39 + 0.39 * u,
      0.066 * Math.sin(u * Math.PI * 4) * Math.sin(u * Math.PI),
      0,
    ];
  });
  k.tube(wavePoints, 0.027, light, photon, 35);
  k.ball([0.005, 0, 0], 0.061, light, photon);
  const flashStart = new THREE.Vector3(-2.77, 1.63, 0.38),
    flashEnd = new THREE.Vector3(-1.99, 0.38, -0.2);
  photon.quaternion.setFromUnitVectors(
    new THREE.Vector3(1, 0, 0),
    flashEnd.clone().sub(flashStart).normalize(),
  );

  const alphaRest = new THREE.Vector3(-1.23, 0.404, -0.475),
    alphaDock = new THREE.Vector3(-1.73, 0.397, -0.37),
    alphaPDE = new THREE.Vector3(0.016, 0.644, -0.265);
  const sites = [
    [-1.03, 0.93, 0.11],
    [-0.49, 1.18, 0.02],
    [0.29, 1.19, -0.15],
    [0.98, 0.96, 0.09],
    [1.38, 0.7, -0.22],
  ];
  const substrates = sites.map((site, i) => {
    const item = molecule(group, "cytosolic-cGMP-substrate");
    const start = new THREE.Vector3(...site),
      product = new THREE.Vector3(
        -0.49 + i * 0.38,
        0.47 + (i % 3) * 0.17,
        0.24 + 0.09 * (i % 2),
      );
    return { ...item, start, product, arrival: 0.515 + i * 0.039 };
  });
  const intactBase = substrates[0].baseMesh.material,
    productBase = k.material("#97958b");
  const pdePocket = new THREE.Vector3(0.275, 0.785, -0.235);
  const replenished = sites.map((site, i) => {
    const item = molecule(group, "cyclase-derived-cGMP");
    return {
      ...item,
      destination: new THREE.Vector3(
        site[0] + 0.035,
        site[1] - 0.05,
        site[2] - 0.03,
      ),
      at: 0.839 + i * 0.014,
    };
  });
  const cyclaseSite = new THREE.Vector3(-0.63, 0.54, -0.765);
  const bound = [-0.52, 0.52].map((x, i) => {
    const item = molecule(channel, "CNG-bound-cGMP");
    const home = new THREE.Vector3(x, 0, -0.3);
    const free = new THREE.Vector3(
      x * (1.18 + i * 0.05),
      0.22 * (i ? 1 : -1),
      -0.61,
    );
    return { ...item, home, free };
  });

  // Symbolic charge pairs refer to the voltage across this local membrane.
  const negative = k.material("#68749a"),
    positive = k.material("#bc795f");
  const chargeMarkers = [];
  for (let i = 0; i < 3; i++) {
    const pair = new THREE.Group();
    pair.name = "relative-voltage-charge-pair";
    pair.position.set(-0.47 + 0.33 * i, -0.79, 0);
    plasma.add(pair);
    k.segment([-0.077, 0, -0.145], [0.077, 0, -0.145], 0.021, negative, pair);
    k.segment([-0.077, 0, 0.145], [0.077, 0, 0.145], 0.021, positive, pair);
    k.segment([0, -0.077, 0.145], [0, 0.077, 0.145], 0.021, positive, pair);
    chargeMarkers.push(pair);
  }
  const sodium = k.material("#5897aa"),
    calcium = k.material("#ca9b61");
  const ions = Array.from({ length: 9 }, (_, i) => {
    const ion = k.ball([0, 0, 0], 1, i % 4 === 0 ? calcium : sodium, channel);
    ion.name = i % 4 === 0 ? "dark-current-calcium" : "dark-current-sodium";
    return ion;
  });

  const labels = [
    k.label([0, 0, 0], "成熟膜盘剖面", "Mature disk, cut face", 5),
    k.label([0, 0, 0], "外节质膜", "Outer-segment plasma membrane", 5),
    k.label([0, 0, 0], "视紫红质与视黄醛", "Rhodopsin and retinal", 10),
    k.label([0, 0, 0], "转导蛋白 α · GTP", "Transducin α · GTP", 10),
    k.label([0, 0, 0], "PDE6 · 盘膜胞质侧", "PDE6 · cytosolic disk face", 9),
    k.label([0, 0, 0], "水解产物 5′-GMP", "Hydrolysis product 5′-GMP", 8),
    k.label([0, 0, 0], restingText.zh, restingText.en, 10),
    k.label([0, 0, 0], restingVoltage.zh, restingVoltage.en, 8),
    k.label([0, 0, 0], "环化酶补充 cGMP", "Cyclase replenishes cGMP", 9),
  ];
  const point = new THREE.Vector3();
  function anchor(index, object, x = 0, y = 0, z = 0) {
    object.localToWorld(point.set(x, y, z)).toArray(labels[index].position);
  }
  function anchorVertex(index, object) {
    const vertices = object.geometry.attributes.position;
    object
      .localToWorld(
        point.fromBufferAttribute(vertices, Math.floor(vertices.count * 0.57)),
      )
      .toArray(labels[index].position);
  }
  let currentProgress = 0;
  const settings = { illumination: "flash" };
  const state = group.userData;
  Object.assign(state, {
    organism: "mammalian rod photoreceptor",
    diskSeparateFromPlasmaMembrane: true,
    signalFace: "cytosolic",
    ionicDirection: "extracellular-to-cytosol",
    responseType: "graded",
    voltageSymbols: "relative, schematic",
  });
  function update(raw, parameters = {}) {
    const p = clamp(raw),
      flash = parameters.illumination !== "dark";
    currentProgress = p;
    settings.illumination = flash ? "flash" : "dark";
    const q = flash ? p : 0,
      open = channelOpening(p, flash),
      closed = 1 - open;
    const activeReceptor = ease(q, 0.231, 0.275) * (1 - ease(q, 0.72, 0.835));
    const receptorVisit = ease(q, 0.235, 0.305),
      transfer = ease(q, 0.33, 0.47),
      returnToBeta = ease(q, 0.8, 0.935);
    const pdeActive = ease(q, 0.42, 0.5) * (1 - ease(q, 0.79, 0.88));
    const hyper = ease(q, 0.64, 0.82) * (1 - ease(q, 0.89, 0.999));
    const absorbed = flash && p >= 0.235;
    photon.position.lerpVectors(flashStart, flashEnd, ease(q, 0.1, 0.235));
    const photonSize = ease(q, 0.085, 0.12) * (1 - ease(q, 0.224, 0.236));
    photon.visible = photonSize > 0;
    photon.scale.setScalar(photonSize);
    retinal.visible = !absorbed;
    straight.visible = absorbed;
    rhodopsin.rotation.z = -0.11 * activeReceptor;
    alpha.position
      .copy(alphaRest)
      .lerp(alphaDock, receptorVisit)
      .lerp(alphaPDE, transfer)
      .lerp(alphaRest, returnToBeta);
    alpha.rotation.y = -0.47 * transfer * (1 - returnToBeta);
    gammaPhosphate.visible = flash && p >= 0.295 && p < 0.845;
    nucleotide.material = gammaPhosphate.visible ? activeGuanine : darkGuanine;
    for (let i = 0; i < inhibitors.length; i++)
      inhibitors[i].rotation.z = (i === 0 ? 1 : -1) * 1.03 * pdeActive;
    let products = 0,
      newCGMP = 0;
    for (const [i, item] of substrates.entries()) {
      const arrived = flash && p >= item.arrival;
      const toPocket = ease(q, item.arrival - 0.084, item.arrival),
        release = ease(q, item.arrival, item.arrival + 0.1);
      item.m.position
        .copy(item.start)
        .lerp(pdePocket, toPocket)
        .lerp(item.product, release);
      item.m.rotation.z = 0.26 * (i - 2) + 0.4 * toPocket;
      item.returnBond.visible = !arrived;
      item.baseMesh.material = arrived ? productBase : intactBase;
      if (arrived) products++;
    }
    for (const item of replenished) {
      const born = ease(q, item.at, item.at + 0.042),
        spread = ease(q, item.at, item.at + 0.095);
      item.m.visible = born > 0;
      item.m.scale.setScalar(born);
      item.m.position.copy(cyclaseSite).lerp(item.destination, spread);
      if (born > 0) newCGMP++;
    }
    for (const item of bound)
      item.m.position.copy(item.home).lerp(item.free, closed);
    setOpen(open);
    for (let i = 0; i < ions.length; i++) {
      const ion = ions[i],
        t = (p * 3.4 + i / ions.length) % 1;
      // Do not launch a packet that would meet a closing gate. A packet
      // already inside can continue into the cytosol while current falls.
      const crossingTime = p + (0.85 / 1.55 - t) / 3.4;
      const passes = channelOpening(crossingTime, flash) > 0.58;
      const taper = ease(t, 0.012, 0.1) * (1 - ease(t, 0.88, 0.985));
      const size = (i % 4 === 0 ? 0.046 : 0.041) * taper;
      const spread = Math.abs(2 * t - 1) ** 1.5;
      ion.visible = passes && size > 0;
      ion.scale.setScalar(size);
      ion.position.set(
        ((i % 3) - 1) * (0.024 + 0.3 * spread),
        (((i * 2) % 5) - 2) * (0.011 + 0.16 * spread),
        0.85 - 1.55 * t,
      );
    }
    for (let i = 0; i < chargeMarkers.length; i++) {
      const amount =
        i === 0 ? 1 : ease(hyper, (i - 1) * 0.37, 0.53 + (i - 1) * 0.37);
      chargeMarkers[i].visible = amount > 0;
      chargeMarkers[i].scale.setScalar(amount);
    }
    labels[0].active = p < 0.17;
    labels[1].active = p < 0.13;
    labels[2].active = flash && p >= 0.13 && p < 0.35;
    labels[3].active = flash && p >= 0.295 && p < 0.495;
    labels[4].active = flash && p >= 0.4 && p < 0.69;
    labels[5].active = flash && p >= substrates[0].arrival && p < 0.705;
    labels[6].active = !flash || p < 0.14 || p >= 0.63;
    labels[6].text =
      !flash || p < 0.63 ? restingText : p < 0.86 ? closingText : reopeningText;
    labels[7].active = (!flash && p >= 0.13) || (flash && p >= 0.71 && p < 0.9);
    labels[7].text = flash ? peakVoltage : restingVoltage;
    labels[8].active = flash && p >= 0.85;
    anchor(0, disk, -1.55, 0.12, 0);
    anchor(1, plasma, -1.12, 0.46, 0);
    anchorVertex(2, absorbed ? straight : retinal);
    anchorVertex(3, nucleotide);
    anchorVertex(4, pde.children[2]);
    anchorVertex(5, substrates[0].phosphate);
    anchorVertex(6, channelAnchor);
    anchor(7, chargeMarkers[0], 0, 0.021, -0.145);
    anchorVertex(8, cyclase.children[1]);
    Object.assign(state, {
      illumination: settings.illumination,
      retinalIsomer: absorbed ? "all-trans" : "11-cis",
      rhodopsinActivity: activeReceptor,
      transducinState: nucleotide.material === activeGuanine ? "GTP" : "GDP",
      pdeActivation: pdeActive,
      hydrolysisProducts: products,
      newlySynthesizedCGMP: newCGMP,
      channelOpening: open,
      gradedHyperpolarization: hyper,
    });
  }
  update(0);
  const materials = new Set([darkGuanine, activeGuanine, productBase]);
  group.traverse((o) => {
    if (o.material)
      for (const material of Array.isArray(o.material)
        ? o.material
        : [o.material])
        materials.add(material);
  });
  return {
    group,
    update,
    labels,
    materials: [...materials],
    camera: { position: [2.25, 2.65, 9.5], target: [0.02, 0.04, -0.18] },
    setProgress(p) {
      update(p, settings);
    },
    setParameters(parameters) {
      update(currentProgress, parameters);
    },
  };
}

export default {
  id: "phototransduction",
  title,
  duration: 34,
  intro: b(
    "哺乳动物视杆细胞外节的局部放大剖面。跟随一次短闪，从盘膜上的视紫红质到外节质膜上的 CNG 通道，再观察暗电流恢复。也可以一直保持黑暗。分子、离子、时间间隔和电位符号均为机制示意。",
    "A magnified cutaway of a mammalian rod outer segment. Follow one brief flash from rhodopsin on a mature disk to a CNG channel in the plasma membrane and the return of dark current, or hold the rod in darkness. Molecule and ion counts, timing, and voltage symbols are schematic.",
  ),
  controls: [
    {
      id: "illumination",
      label: b("光照条件", "Illumination"),
      default: "flash",
      options: [
        { value: "flash", label: b("短暂闪光", "Brief flash") },
        { value: "dark", label: b("持续黑暗", "Sustained darkness") },
      ],
    },
  ],
  stages,
  legend: [
    { color: "#9b93a9", text: b("成熟膜盘", "Mature disk") },
    {
      color: "#797c9f",
      text: b("质膜 CNG 通道", "Plasma-membrane CNG channel"),
    },
    {
      color: "#58978e",
      text: b("cGMP（绿）与 5′-GMP（灰）", "cGMP (green) and 5′-GMP (gray)"),
    },
    {
      color: "#5897aa",
      text: b("Na⁺（蓝）与 Ca²⁺（赭）", "Na⁺ (blue) and Ca²⁺ (ochre)"),
    },
  ],
  sources: [
    {
      title:
        "Structure of the Visual Signaling Complex between Transducin and Phosphodiesterase 6",
      url: "https://pubmed.ncbi.nlm.nih.gov/33007200/",
    },
    {
      title:
        "Induction by cyclic GMP of cationic conductance in plasma membrane of retinal rod outer segment",
      url: "https://doi.org/10.1038/313310a0",
    },
    {
      title:
        "The structure of the native CNGA1/CNGB1 CNG channel from bovine retinal rods",
      url: "https://doi.org/10.1038/s41594-021-00700-8",
    },
    {
      title:
        "Three-dimensional organization of nascent rod outer segment disk membranes",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4672767/",
    },
    {
      title: "Phototransduction in mouse rods and cones",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2877390/",
    },
  ],
  create,
};
