import { THREE, sceneKit, clamp, ease } from "../../kit.js";
import { articulatedChain } from "./mechanics.js";
import { ribosomeAssembly } from "./ribosomeAssembly.js";

function movableBond(k, name, material, parent, radius = 0.045) {
  const mesh = k.segment([0, 0, 0], [0, 1, 0], radius, material, parent);
  mesh.name = name;
  return {
    mesh,
    set(a, b) {
      const d = new THREE.Vector3().subVectors(b, a);
      mesh.position.copy(a).add(b).multiplyScalar(0.5);
      mesh.scale.set(radius, Math.max(1e-6, d.length()), radius);
      mesh.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        d.normalize(),
      );
    },
  };
}

// One continuous folded RNA trace; an L-shaped teaching diagram, not an atomic fit.
function tRNA(k, parent, material, name) {
  const body = new THREE.Group();
  body.name = name;
  parent.add(body);
  const chain = articulatedChain(k, 48, 0.043, material, body);
  chain.beads.forEach((bead, i) => {
    bead.name = `${name}-rna-residue-${i}`;
  });
  chain.links.forEach((link, i) => {
    link.name = `${name}-rna-backbone-${i}`;
  });
  chain.beads.at(-1).name = `${name}-backbone-3prime-end`;
  const tip = k.ball([0, 0, 0], 0.068, material, body);
  tip.name = `${name}-3prime-CCA`;
  const anticodon = k.ball([0, 0, 0], [0.19, 0.07, 0.075], material, body);
  anticodon.name = `${name}-anticodon`;
  function set(x, end, away = 0) {
    const y = -1.03 - away * 0.4,
      elbowX = x - 0.38;
    const path = [
      [end.x - 0.16, end.y - 0.04, end.z - 0.035],
      [elbowX - 0.1, 0.42 - away * 0.3, -0.04],
      [x - 0.15, -0.39 - away * 0.4, 0.01],
      [x - 0.17, y + 0.09, 0.07],
      [x, y, 0.09],
      [x + 0.17, y + 0.09, 0.07],
      [x + 0.14, -0.37 - away * 0.4, 0.04],
      [elbowX + 0.24, 0.39 - away * 0.3, 0.1],
      [elbowX + 0.3, 0.68 - away * 0.3, 0.2],
      [elbowX + 0.07, 0.75 - away * 0.3, 0.15],
      [end.x + 0.08, end.y - 0.1, end.z + 0.04],
      end.toArray(),
    ].map((p) => new THREE.Vector3(...p));
    const curve = new THREE.CatmullRomCurve3(path, false, "centripetal");
    for (let i = 0; i < chain.points.length; i++)
      curve.getPoint(i / (chain.points.length - 1), chain.points[i]);
    chain.commit();
    tip.position.copy(end);
    anticodon.position.set(x, y, 0.09);
  }
  return { body, tip, anticodon, set };
}

export function createTranslation({ rootId = "cell" } = {}) {
  const k = sceneKit(),
    { group } = k;
  const reference = ribosomeAssembly(k, group, 4.15);
  reference.position.set(-3.65, 0.75, -0.15);
  reference.rotation.set(0.18, -0.36, 0.04);
  const schematic = new THREE.Group();
  schematic.name = "magnified-reaction-schematic";
  schematic.position.set(1.3, 0, 0);
  group.add(schematic);
  const mRNA = new THREE.Group();
  mRNA.name = "schematic-mRNA";
  schematic.add(mRNA);
  const rnaMat = k.material("#bd9969"),
    pMat = k.material("#709b94"),
    aMat = k.material("#b78eac"),
    peptideMat = k.material("#d59a6e"),
    factorMat = k.material("#779bb2");
  k.tube(
    [
      [-2.65, -1.29, 0.08],
      [-1.5, -1.22, 0.08],
      [1, -1.22, 0.08],
      [3.45, -1.15, 0.08],
    ],
    0.047,
    rnaMat,
    mRNA,
  );
  for (let codon = -1; codon <= 2; codon++)
    for (let base = 0; base < 3; base++)
      k.ball(
        [codon * 1.35 + (base - 1) * 0.15, -1.15, 0.1],
        [0.05, 0.075, 0.05],
        codon === 2 ? factorMat : rnaMat,
        mRNA,
      );
  const pRNA = tRNA(k, schematic, pMat, "P-tRNA");
  const aRNA = tRNA(k, schematic, aMat, "A-tRNA");
  const peptide = articulatedChain(k, 26, 0.065, peptideMat, schematic);
  peptide.beads.forEach((o, i) => (o.name = `peptide-residue-${i}`));
  peptide.links.forEach((o, i) => (o.name = `peptide-backbone-${i}`));
  const aa = k.ball([0.45, 1.18, 0], 0.097, peptideMat, schematic);
  aa.name = "incoming-residue";
  const pEster = movableBond(k, "P-peptidyl-ester", pMat, schematic);
  const aEster = movableBond(k, "A-aminoacyl-ester", aMat, schematic);
  const newBond = movableBond(k, "new-peptide-bond", peptideMat, schematic);
  // A path guide, not a fabricated protein wall or a channel fitted into 4UG0.
  const guides = new THREE.Group();
  guides.name = "schematic-exit-path";
  schematic.add(guides);
  for (const x of [-0.25, 0.25])
    k.tube(
      [
        [x, 1.43, -0.08],
        [x, 2.02, -0.08],
        [x, 2.63, -0.08],
      ],
      0.024,
      k.material("#adb8bb"),
      guides,
    );
  const ptc = k.ring(
    [0.12, 1.08, -0.1],
    0.56,
    0.017,
    k.material("#879fa6"),
    schematic,
  );
  ptc.name = "PTC-region-guide";
  ptc.rotation.x = 0;
  const factor = new THREE.Group();
  factor.name = "release-factor-symbol";
  schematic.add(factor);
  k.tube(
    [
      [1.35, -1.03, 0.16],
      [1.2, -0.37, 0.18],
      [0.65, 0.38, 0.16],
      [0, 1.0, 0],
    ],
    0.09,
    factorMat,
    factor,
  );
  k.ball([1.26, -0.63, 0.16], [0.18, 0.3, 0.16], factorMat, factor);
  k.ball([0.56, 0.42, 0.14], [0.22, 0.26, 0.16], factorMat, factor);
  const labels = [
    k.label(
      [-3.65, 3.03, 0],
      "人 80S · 4UG0 实验骨架",
      "Human 80S · experimental 4UG0",
      2,
    ),
    k.label(
      [-3.65, -1.53, 0],
      "RNA C4′／蛋白 Cα · 共同坐标",
      "RNA C4′ / protein Cα · registered",
      1,
    ),
    k.label(
      [1.4, 3.83, 0],
      "核糖体内部反应 · 独立放大示意",
      "Inside the ribosome · separate reaction enlargement",
      2,
    ),
    k.label(
      [1.42, 1.05, 0.4],
      "PTC · 大亚基 rRNA 催化",
      "PTC · large-subunit rRNA catalysis",
      1,
    ),
    k.label(
      [2.31, 2.14, 0.2],
      "肽链出口路径（示意）",
      "Peptide exit path (schematic)",
      1,
    ),
    k.label([1.36, 3.17, 0.2], "N 端", "N terminus", 2),
    k.label([-0.05, -1.62, 0.1], "E", "E", 4),
    k.label([1.3, -1.76, 0.1], "P", "P", 5),
    k.label([2.65, -1.62, 0.1], "A", "A", 5),
    k.label([-1.28, -2.55, 0], "5′", "5′", 5),
    k.label([4.65, -2.55, 0], "3′", "3′", 5),
    k.label(
      [3.13, 0.27, 0.3],
      "释放因子（示意）",
      "Release factor (schematic)",
      1,
    ),
    k.label(
      [-3.65, -1.98, 0],
      "蓝灰：rRNA · 金色：核糖体蛋白",
      "Blue-grey: rRNA · gold: proteins",
      1,
    ),
    k.label(
      [1.35, -2.1, 0],
      "固定核糖体视角：mRNA 向左移位",
      "Ribosome-fixed view: mRNA shifts left",
      1,
    ),
  ];
  labels[0].priority = 6;
  labels[0].compactText = { zh: "人 80S 实验结构", en: "Human 80S structure" };
  labels[2].priority = 6;
  labels[2].compactText = { zh: "核糖体内反应示意", en: "Reaction inside 80S" };
  labels[1].priority = -1;
  labels[12].priority = 0;
  labels[13].priority = 0;
  const pTip = new THREE.Vector3(),
    aTip = new THREE.Vector3();
  function update(progress) {
    const p = clamp(progress),
      dock = ease(p, 0.1, 0.28),
      trans = ease(p, 0.53, 0.68),
      exit = ease(p, 0.68, 0.81),
      release = ease(p, 0.86, 0.98),
      drift = ease(p, 0.98, 1);
    const transferred = p >= 0.41,
      hydrolyzed = p >= 0.86;
    mRNA.position.x = -1.35 * trans;
    labels[9].position[0] = -1.28 - 1.35 * trans;
    // Keep the terminal 3′ callout to the right of A after the codon shift.
    labels[10].position[0] = 4.65 - 1.35 * trans + 0.8 * ease(p, 0.68, 0.83);
    pTip.set(-1.35 * trans - 1.35 * exit, 1 - 0.7 * exit, 0.0);
    aTip.set(
      0.45 * (1 - trans) + 1.6 * (1 - dock),
      0.98 + 0.32 * (1 - dock) + 0.02 * trans,
      0,
    );
    pRNA.set(-1.35 * trans - 1.35 * exit, pTip, exit);
    aRNA.set(1.35 * (1 - trans) + 1.6 * (1 - dock), aTip);
    pRNA.body.visible = p < 0.81;
    aRNA.body.visible = p < 0.99;
    for (let i = 0; i < 26; i++) {
      const t = i / 25,
        y = 1.32 + 1.85 * t;
      peptide.points[i].set(
        t < 0.72
          ? 0.035 * Math.sin(t * 12)
          : 0.035 * Math.sin(t * 12) + 0.35 * Math.sin((t - 0.72) * 8),
        y + 1.6 * release,
        0.035 * Math.sin(t * 9),
      );
      peptide.points[i].x += 0.45 * drift;
    }
    peptide.commit();
    aa.position.copy(aTip).add(new THREE.Vector3(0, 0.2, 0));
    if (transferred) {
      aa.position.x = 0.45 * (1 - trans) + 0.45 * drift;
      aa.position.y = 1.18 + 1.6 * release;
    }
    pEster.set(pTip, peptide.points[0]);
    pEster.mesh.visible = !transferred;
    aEster.set(aTip, aa.position);
    aEster.mesh.visible = !hydrolyzed;
    newBond.set(peptide.points[0], aa.position);
    newBond.mesh.visible = transferred;
    factor.visible = p >= 0.71 && p < 0.99;
    factor.position.set(0.7 * (1 - ease(p, 0.71, 0.83)), 0, 0);
    labels[5].position = [
      1.3 + peptide.points[25].x,
      peptide.points[25].y + 0.2,
      0.2,
    ];
    labels[11].active = factor.visible;
    group.userData = {
      process: "translation",
      rootId,
      compartment: "cytosol",
      ribosome: "80S",
      readingDirection: "5to3",
      siteOrder: "E-P-A",
      peptideGrowth: "NtoC",
      frame: "ribosome-fixed",
      peptideSite: transferred ? (trans === 1 ? "P" : "A") : "P",
      released: release === 1,
      representation: "registered human 4UG0 plus separate reaction schematic",
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0.1, 1.3, 11.6], target: [0, 0.9, 0] },
  };
}
