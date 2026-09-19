import { THREE, clamp, ease, bilingual as b } from "../../kit.js";
import { molecularKit } from "./molecularDetail.js";
const label = (position, zh, en, priority = 2) => ({
  position,
  text: b(zh, en),
  priority,
});
const N = 240,
  STEP = 8 / N;
export function createReplication({ rootId = "cell" } = {}) {
  const group = new THREE.Group(),
    k = molecularKit(group);
  const parent = k.mat("#708fa6"),
    fresh = k.mat("#579e8c"),
    rna = k.mat("#ca9b58");
  const strands = [
    k.strand(N, parent, "leading-parent"),
    k.strand(N, parent, "lagging-parent"),
    k.strand(N, fresh, "leading-daughter"),
    k.strand(N, fresh, "lagging-daughter"),
  ];
  const primer = k.strand(N, rna, "RNA-primers");
  const helicase = new THREE.Group();
  group.add(helicase);
  helicase.name = "CMG-helicase-schematic-central-channel";
  const hm = k.mat("#9c85a4"),
    hl = k.mat("#b3a0b9");
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    const sub = new THREE.Group();
    helicase.add(sub);
    sub.position.set(0, 0.41 * Math.cos(a), 0.41 * Math.sin(a));
    k.blob(sub, i % 2 ? hl : hm, [0, 0, 0], [0.26, 0.18, 0.19]);
    k.blob(sub, hm, [-0.19, 0.025, 0], [0.14, 0.13, 0.15]);
  }
  k.blob(helicase, hl, [-0.1, 0.72, -0.13], [0.34, 0.17, 0.23]);
  k.blob(helicase, hl, [-0.1, -0.61, -0.25], [0.3, 0.18, 0.23]);
  const lead = k.protein("DNA-polymerase", "#a78aa4", 0.83),
    lag = k.protein("DNA-polymerase", "#a78aa4", 0.83),
    primase = k.protein("primase", "#c2a274", 0.57),
    ligase = k.protein("ligase", "#bca06e", 0.64);
  const clamps = [];
  for (const enzyme of [lead, lag]) {
    const g = new THREE.Group();
    enzyme.add(g);
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(0.31, 0.06, 8, 20, (Math.PI * 2) / 3 - 0.1),
        k.mat("#a0b4ad"),
      );
      m.rotation.y = Math.PI / 2;
      m.rotation.x = (i * Math.PI * 2) / 3;
      g.add(m);
    }
    g.position.set(-0.3, 0, -0.03);
    clamps.push(g);
  }
  const labels = [
    label([-4.2, 1.65, 0], "亲本 3′", "Parental 3′"),
    label([4.2, 0.75, 0], "5′", "5′"),
    label([-4.2, -1.65, 0], "亲本 5′", "Parental 5′"),
    label([4.2, -0.75, 0], "3′", "3′"),
    label(
      [-2.2, 2.05, 0],
      "前导链 · 连续 5′ → 3′",
      "Leading · continuous 5′ → 3′",
      3,
    ),
    label(
      [-1.5, -2.05, 0],
      "冈崎片段 · 3′ ← 5′",
      "Okazaki fragments · 3′ ← 5′",
      3,
    ),
    label([0, 1.1, 0.3], "解旋酶中央通道", "Helicase central channel", 3),
    label([0, -1.65, 0.3], "RNA 引物", "RNA primer"),
    label([0, -1.6, 0.3], "连接酶封闭骨架切口", "Ligase seals backbone nick"),
  ];
  const a = new THREE.Vector3(),
    z = new THREE.Vector3(),
    other = new THREE.Vector3(),
    mid = new THREE.Vector3();
  let fork = -3,
    progress = 0,
    ligaseActive = true;
  function point(x, strand, out) {
    const side = strand % 2 === 0 ? 1 : -1,
      isNew = strand >= 2,
      opening = clamp((fork - x) / 0.7),
      // Transport the closed-duplex phase with the fork: its separation
      // points outward when opening begins, rather than cancelling the
      // daughter-axis offset at arbitrary helical phases.
      ang = ((x - fork) * Math.PI * 2) / 1.25;
    const cy = side * 1.03;
    const theta = ang + (side === 1 ? 0 : Math.PI) + (isNew ? Math.PI : 0);
    const motorX = fork - 0.8;
    const closedY = side * 0.34 * Math.cos(ang),
      closedZ = side * 0.34 * Math.sin(ang);
    out.set(
      x,
      isNew
        ? cy + 0.27 * Math.cos(theta)
        : (1 - opening) * closedY + opening * (cy + 0.27 * Math.cos(theta)),
      isNew
        ? 0.27 * Math.sin(theta)
        : (1 - opening) * closedZ + opening * 0.27 * Math.sin(theta),
    );
    // The leading-template ssDNA traverses the motor pore; the lagging
    // template is excluded. A smooth approach joins the parental fork.
    if (strand === 0) {
      const straight = 1 - ease(Math.abs(x - motorX), 0.33, 0.57);
      out.y += (1.03 - out.y) * straight;
      out.z *= 1 - straight;
    }
    return out;
  }
  function availability(x, strand) {
    if (strand < 2) return 1;
    if (strand === 2) return x < Math.min(4, fork - 1.2) ? 1 : 0;
    const j = Math.min(4, Math.max(0, Math.floor((x + 4) / 1.6))),
      right = -2.4 + j * 1.6,
      t = ease(progress, 0.24 + j * 0.12, 0.33 + j * 0.12);
    if (x < right - 1.6 * t) return 0;
    if (!ligaseActive || progress < 0.92) {
      const q = (x + 4) % 1.6;
      if (q < 0.043 || q > 1.557) return 0;
    }
    return 1;
  }
  function isRNA(x) {
    const j = Math.min(4, Math.max(0, Math.floor((x + 4) / 1.6))),
      right = -2.4 + j * 1.6;
    return x > right - 0.25 && progress < 0.91;
  }
  function paint(s, index, rnaOnly = false) {
    for (let i = 0; i < N; i++) {
      const x = -4 + i * STEP,
        visible =
          availability(x + STEP * 0.5, index) &&
          (!rnaOnly || isRNA(x)) &&
          !(index === 3 && !rnaOnly && isRNA(x));
      point(x, index, a);
      point(x + STEP, index, z);
      k.segment(s.rail, i, a, z, visible ? (rnaOnly ? 0.042 : 0.037) : 0);
    }
    for (let i = 0; i < N / 3; i++) {
      const x = -4 + (i * 3 + 1.5) * STEP,
        visible =
          availability(x, index) &&
          (!rnaOnly || isRNA(x)) &&
          !(index === 3 && !rnaOnly && isRNA(x));
      point(x, index, a);
      k.bead(s.phosphates, i, a, visible ? (rnaOnly ? 0.064 : 0.054) : 0);
      const mate = index < 2 ? index + 2 : index - 2;
      point(x, mate, other);
      if (index < 2 && x > fork) {
        point(x, 1 - index, other);
      }
      const paired = index >= 2 || x > fork || availability(x, mate);
      mid.copy(a).lerp(other, paired ? 0.46 : 0.13);
      k.segment(s.bases, i, a, mid, visible ? 0.031 : 0, visible ? 0.072 : 0);
    }
    k.finish(s.rail, s.phosphates, s.bases);
  }
  function update(p, parameters = {}) {
    progress = clamp(p);
    ligaseActive = parameters.ligase !== "absent";
    fork = -3.35 + 8.65 * ease(progress, 0.06, 0.78);
    strands.forEach((s, i) => paint(s, i));
    paint(primer, 3, true);
    helicase.position.set(fork - 0.8, 1.03, 0);
    helicase.visible = progress < 0.84;
    const end = Math.min(4, fork - 1.2);
    point(end, 2, a);
    lead.position.copy(a);
    lead.visible = progress > 0.08 && progress < 0.8;
    let j = Math.min(4, Math.max(0, Math.floor((progress - 0.24) / 0.12)));
    const right = -2.4 + j * 1.6,
      t = ease(progress, 0.24 + j * 0.12, 0.33 + j * 0.12),
      tip = right - 1.6 * t;
    point(tip, 3, a);
    lag.position.copy(a);
    lag.rotation.z = Math.PI;
    lag.visible = progress > 0.24 && progress < 0.82;
    point(fork - 0.45, 1, a);
    primase.position.copy(a).add(new THREE.Vector3(0, -0.18, -0.1));
    primase.visible = progress > 0.13 && progress < 0.75;
    const lx = -2.4 + 4.8 * ease(progress, 0.9, 0.99);
    point(lx, 3, a);
    ligase.position.copy(a);
    ligase.visible = ligaseActive && progress > 0.9 && progress < 0.99;
    labels[6].position[0] = fork - 0.8;
    labels[6].position[1] = 2.0;
    labels[6].active = helicase.visible;
    labels[7].position[0] = right - 0.15;
    labels[7].active = progress > 0.24 && progress < 0.91;
    labels[8].position[0] = lx;
    labels[8].active = ligase.visible;
    group.userData = {
      rootId,
      compartment: "nucleus",
      mechanism: "semiconservative-replication",
      parentalAntiparallel: true,
      synthesisDirection: "5-prime-to-3-prime",
      forkX: fork,
      ligaseActive,
      primerReplaced: progress >= 0.91,
      remainingNicks: progress >= 0.92 && !ligaseActive ? 4 : 0,
      localSegmentComplete: progress >= 0.99 && ligaseActive,
      detail:
        "instanced-helical-duplex-phosphates-base-pairs-open-protein-clefts",
    };
  }
  update(0);
  return {
    group,
    materials: k.materials,
    update,
    labels,
    camera: { position: [0, 1.25, 12.8], target: [0, 0, 0] },
  };
}

export function createRepair({ rootId = "cell" } = {}) {
  const group = new THREE.Group(),
    k = molecularKit(group),
    blue = k.mat("#728ea5"),
    fresh = k.mat("#619f8e"),
    gold = k.mat("#c39a55");
  const top = k.strand(N, blue, "damaged-strand"),
    bottom = k.strand(N, blue, "intact-template"),
    patch = k.strand(N, fresh, "repair-patch");
  const recognition = k.protein("recognition", "#a597b3", 0.9),
    tf = k.protein("TFIIH", "#9d8da8", 1.1),
    cutters = [
      k.protein("nuclease", "#b18777", 0.72),
      k.protein("nuclease", "#b18777", 0.72),
    ],
    polymerase = k.protein("DNA-polymerase", "#9b8ba8", 0.94),
    ligase = k.protein("ligase", "#bda273", 0.72);
  const lesion = new THREE.Mesh(
    new THREE.TorusGeometry(0.14, 0.047, 8, 24),
    gold,
  );
  group.add(lesion);
  lesion.name = "adjacent-base-UV-photoproduct";
  lesion.scale.set(1.65, 0.7, 1);
  const cutEnds = k.instances(
    k.sphere,
    gold,
    4,
    "exposed-phosphodiester-cut-ends",
  );
  const rpa = new THREE.Group();
  group.add(rpa);
  for (let i = 0; i < 3; i++)
    k.protein("ssDNA-binding-domain", "#a8aba0", 0.36, rpa).position.set(
      -0.72 + i * 0.7,
      0,
      0,
    );
  const labels = [
    label([-4.2, 0.6, 0], "受损链 5′", "Damaged strand 5′"),
    label([4.2, 0.6, 0], "3′", "3′"),
    label([-4.2, -0.6, 0], "模板链 3′", "Template 3′"),
    label([4.2, -0.6, 0], "5′", "5′"),
    label([0, 1.3, 0], "相邻碱基光产物", "Adjacent-base photoproduct", 3),
    label(
      [0, -1.6, 0],
      "完整模板与暴露碱基",
      "Intact template and exposed bases",
      3,
    ),
    label(
      [0, 1.65, 0],
      "同一条链上的两处切口",
      "Two incisions on one strand",
      3,
    ),
    label(
      [0, 3.05, 0],
      "切除的损伤寡核苷酸",
      "Excised damaged oligonucleotide",
      3,
    ),
    label(
      [0, 1.3, 0.4],
      "从 3′ 端填补 · 5′ → 3′",
      "Fill from 3′ end · 5′ → 3′",
      3,
    ),
    label([1.35, 1.3, 0], "封闭骨架切口", "Seal backbone nick", 3),
    label(
      [0, 2.1, 0],
      "切开受阻 · 损伤保留",
      "Incision blocked · lesion retained",
      3,
    ),
  ];
  const a = new THREE.Vector3(),
    z = new THREE.Vector3(),
    mate = new THREE.Vector3(),
    mid = new THREE.Vector3();
  let p = 0,
    opened = 0,
    released = 0,
    fill = 0,
    seal = 0;
  const left = -4 / 3,
    right = 4 / 3;
  function point(x, strand, out, detached = false) {
    const opening = detached ? 1 : opened,
      local = 1 - ease(Math.abs(x), 1.36, 2.15),
      amount = opening * local,
      // Unwind an unwrapped phase, while maintaining a nonzero separation.
      // Interpolating opposed Cartesian vectors would make the backbones
      // pass through one another at the bubble boundary.
      theta = ((x * Math.PI * 2) / 1.3) * (1 - amount) + (strand ? Math.PI : 0),
      radius = 0.35 + 0.52 * amount;
    return out.set(
      x,
      radius * Math.cos(theta) + (detached ? 1.85 * released : 0),
      radius * Math.sin(theta) + 0.08 * amount,
    );
  }
  function paint(s, strand, replacement = false) {
    for (let i = 0; i < N; i++) {
      const x = -4 + i * STEP,
        center = x + STEP * 0.5,
        inPatch = center > left && center < right,
        detached = !replacement && strand === 0 && inPatch && p >= 0.48;
      let visible = replacement
        ? inPatch && center < left + (right - left) * fill
        : p < 0.8 || strand === 1 || !inPatch;
      const incision =
        !replacement &&
        strand === 0 &&
        p >= 0.43 &&
        ((Math.abs(center - left) < 0.05 && p < 0.64) ||
          (Math.abs(center - right) < 0.05 && p < 0.97));
      if (replacement && center > right - 0.07 && seal < 1) visible = false;
      point(x, strand, a, detached);
      point(x + STEP, strand, z, detached);
      k.segment(s.rail, i, a, z, visible && !incision ? 0.037 : 0);
    }
    for (let i = 0; i < N / 3; i++) {
      const x = -4 + (i * 3 + 1.5) * STEP,
        inPatch = x > left && x < right,
        detached = !replacement && strand === 0 && inPatch && p >= 0.48;
      let visible = replacement
        ? inPatch && x < left + (right - left) * fill
        : p < 0.8 || strand === 1 || !inPatch;
      point(x, strand, a, detached);
      k.bead(s.phosphates, i, a, visible ? 0.058 : 0);
      point(x, 1 - strand, mate);
      const paired =
        !inPatch ||
        (!detached &&
          (opened < 0.2 || replacement || fill > (x - left) / (right - left)));
      mid.copy(a).lerp(mate, paired ? 0.46 : 0.12);
      if (detached)
        mid.copy(a).addScaledVector(new THREE.Vector3(0, -1, 0), 0.15);
      k.segment(s.bases, i, a, mid, visible ? 0.032 : 0, visible ? 0.075 : 0);
    }
    k.finish(s.rail, s.phosphates, s.bases);
  }
  function update(progress, parameters = {}) {
    const raw = clamp(progress),
      blocked = parameters.incision === "blocked";
    p = blocked ? Math.min(raw, 0.4) : raw;
    opened = ease(p, 0.15, 0.34) * (1 - ease(p, 0.64, 0.88));
    released = ease(p, 0.48, 0.63);
    fill = ease(p, 0.64, 0.87);
    seal = ease(p, 0.89, 0.97);
    paint(top, 0);
    paint(bottom, 1);
    paint(patch, 0, true);
    point(0, 0, a, p >= 0.48);
    lesion.position.copy(a).add(new THREE.Vector3(0, 0.12, 0.1));
    lesion.visible = p < 0.8;
    recognition.position.set(0, 0.54, -0.22);
    recognition.visible = p > 0.06 && p < 0.25;
    tf.position.set(0, 1.14, -0.2);
    tf.visible = p > 0.2 && p < 0.58;
    rpa.position.set(0, -1.08, -0.05);
    rpa.visible = p > 0.28 && p < 0.82;
    cutters.forEach((m, i) => {
      point(i ? right : left, 0, a);
      m.position.copy(a).add(new THREE.Vector3(0, 0.18, -0.13));
      m.rotation.z = i ? -0.35 : 0.35;
      m.visible = p > 0.3 && p < 0.57;
    });
    for (let i = 0; i < 4; i++) {
      const x = (i < 2 ? left : right) + (i % 2 ? 1 : -1) * 0.06;
      point(x, 0, a);
      k.bead(cutEnds, i, a, p >= 0.43 && p < 0.64 ? 0.09 : 0);
    }
    k.finish(cutEnds);
    const tip = left + (right - left) * fill;
    point(tip, 0, a);
    polymerase.position.copy(a);
    polymerase.visible = p > 0.62 && p < 0.9;
    point(right, 0, a);
    ligase.position.copy(a);
    ligase.visible = p >= 0.89 && p < 0.99;
    labels[4].active = p < 0.43;
    labels[6].active = p >= 0.3 && p < 0.54;
    labels[7].active = p >= 0.54 && p < 0.8;
    labels[8].active = polymerase.visible;
    labels[8].position[0] = tip;
    labels[9].active = ligase.visible;
    labels[10].active = blocked && raw > 0.4;
    group.userData = {
      rootId,
      compartment: "nucleus",
      mechanism: "nucleotide-excision-repair",
      damagedStrand: "upper-5prime-to-3prime",
      intactTemplate: true,
      incisionBlocked: blocked,
      incisions: p >= 0.43 ? 2 : 0,
      excised: released === 1,
      replacementFraction: fill,
      synthesisDirection: "5-prime-to-3-prime",
      ligationComplete: seal === 1,
      lesionRemoved: p >= 0.8,
      detail: "double-helix-base-plates-open-repair-bubble-nuclease-clefts",
    };
  }
  update(0);
  return {
    group,
    materials: k.materials,
    update,
    labels,
    camera: { position: [0, 1.8, 12.4], target: [0, 0.55, 0] },
  };
}
