import { THREE, sceneKit, clamp, ease, bilingual as B } from "../../kit.js";

import {
  helix,
  betaSheet,
  membraneWall,
  rearShell,
  chromatinFiber,
  materialInventory,
} from "./structuralKit.js";

import { continuousMembrane } from "./continuousMembrane.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  group.name = "Mammalian intrinsic apoptosis with membrane-enclosed packaging";
  const cell = new THREE.Group();
  group.add(cell);
  const shellMat = k.material("#a4bcb4", {
    transparent: true,
    opacity: 0.17,
    depthWrite: false,
  });
  const plasma = continuousMembrane(cell, shellMat, [
    [-4, -3.6, -1.4],
    [4, 3.6, 1.4],
  ]);
  const nuclearMat = k.material("#b0abc1", {
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  });
  const nucleus = k.ball([-0.9, -0.38, 0], [1, 0.92, 0.48], nuclearMat, cell);
  const nuclearRim = k.ring(
    [-0.9, -0.38, 0.05],
    0.96,
    0.04,
    k.material("#a39db6"),
    cell,
  );
  nuclearRim.scale.y = 0.92;
  const nuclearBack = rearShell(
    k,
    cell,
    [-0.9, -0.38, 0],
    [1, 0.92, 0.48],
    "#b9b0ca",
    0.55,
  );
  const chromatin = [];
  for (let i = 0; i < 5; i++) {
    const cargo = new THREE.Group();
    cargo.name = `apoptotic-cargo-${i}`;
    cell.add(cargo);
    const x = -0.9 + 0.46 * Math.cos((i * Math.PI * 2) / 5),
      y = -0.38 + 0.42 * Math.sin((i * Math.PI * 2) / 5);
    cargo.position.set(x, y, 0.09);
    chromatinFiber(k, cargo, [
      [-0.15, -0.08, 0],
      [-0.08, 0.12, 0.02],
      [0.08, 0.1, 0.04],
      [0.16, -0.06, 0],
    ]).scale.setScalar(0.7);
    chromatin.push({ cargo, x, y });
  }
  const mito = new THREE.Group();
  cell.add(mito);
  mito.position.set(1.26, 0.91, 0.02);
  const outerMat = k.material("#ad9584"),
    innerMat = k.material("#c5ad97");
  // Elliptic tubes are membrane section edges; the right-hand aperture is real.
  const arc = (rx, ry, start, end) =>
    Array.from({ length: 57 }, (_, i) => {
      const a = start + ((end - start) * i) / 56;
      return [Math.cos(a) * rx, Math.sin(a) * ry, 0];
    });
  k.tube(arc(0.99, 0.57, 0.28, Math.PI * 2 - 0.28), 0.075, outerMat, mito);
  const closure = k.tube(arc(0.99, 0.57, -0.28, 0.28), 0.075, outerMat, mito);
  const mitoWall = membraneWall(
    k,
    mito,
    arc(0.99, 0.57, 0.28, Math.PI * 2 - 0.28),
    outerMat,
    { thickness: 0.055, depth: 0.21 },
  );
  const mitoClosure = membraneWall(
    k,
    mito,
    arc(0.99, 0.57, -0.28, 0.28),
    outerMat,
    { thickness: 0.055, depth: 0.21 },
  );
  // A single indented contour: each crista lumen opens into the IMS.
  // The lower inner boundary is replaced by folds, never covered by a second ellipse.
  const innerPath = arc(0.83, 0.43, 0, Math.PI);
  for (let i = 0; i <= 160; i++) {
    const a = Math.PI + (i * Math.PI) / 160,
      x = 0.83 * Math.cos(a),
      base = 0.43 * Math.sin(a);
    let y = base;
    for (const c of [-0.52, -0.26, 0, 0.26, 0.52]) {
      const u = Math.abs(x - c) / 0.09;
      if (u < 1)
        y = Math.max(
          y,
          base + (0.24 - base) * Math.pow(Math.cos((u * Math.PI) / 2), 2),
        );
    }
    innerPath.push([x, y, 0]);
  }
  const innerWall = membraneWall(k, mito, innerPath, innerMat, {
    thickness: 0.027,
    depth: 0.19,
    heads: false,
  });
  innerWall.name = "connected-crista-inner-membrane";
  const innerEdge = k.tube(innerPath, 0.02, innerMat, mito, 240);
  innerEdge.name = "inner-membrane-contour";
  // Outer rear cutaway is not a membrane across the cytochrome-c exit.
  const bax = new THREE.Group();
  mito.add(bax);
  bax.position.set(0.97, 0, 0.02);
  const baxMat = k.material("#a47772");
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    k.ball(
      [0.06 * Math.cos(a), 0.17 * Math.sin(a), 0.16 * Math.cos(a)],
      0.075,
      baxMat,
      bax,
    );
  }
  const cytMat = k.material("#c69a55"),
    cyto = [];
  for (let i = 0; i < 9; i++) {
    const a = ((i + 1) * Math.PI * 2) / 10;
    cyto.push({
      mesh: k.ball([0, 0, 0], 0.045, cytMat, cell),
      angle: a,
      sx: 1.26 + 0.91 * Math.cos(a),
      sy: 0.91 + 0.49 * Math.sin(a),
      tx: 0.9 + (i % 3) * 0.25,
      ty: -0.6 - Math.floor(i / 3) * 0.16,
    });
  }
  const apoptosome = new THREE.Group();
  cell.add(apoptosome);
  apoptosome.position.set(1.25, -0.88, 0.1);
  const apaf = k.material("#879da8"),
    arms = [];
  for (let i = 0; i < 7; i++) {
    const a = (i * Math.PI * 2) / 7,
      arm = new THREE.Group();
    apoptosome.add(arm);
    arm.rotation.z = a;
    k.segment([0.13, 0, 0], [0.42, 0, 0], 0.062, apaf, arm);
    k.ball([0.45, 0, 0], [0.15, 0.12, 0.1], apaf, arm);
    k.ball([0.17, 0, 0], [0.13, 0.12, 0.12], apaf, arm);
    helix(
      k,
      arm,
      [0.32, 0, 0.11],
      0.25,
      0.035,
      k.material("#b7c7ca"),
      4,
      "x",
      0.013,
    );
    for (const [px, py, blades] of [
      [0.52, -0.085, 7],
      [0.59, 0.085, 8],
    ]) {
      k.ring([px, py, 0.06], 0.09, 0.024, k.material("#a7b8bc"), arm);
      for (let b = 0; b < blades; b++) {
        const a = (b * Math.PI * 2) / blades;
        const blade = k.mesh(
          new THREE.BoxGeometry(0.073, 0.025, 0.05),
          apaf,
          [px + Math.cos(a) * 0.076, py + Math.sin(a) * 0.076, 0.08],
          arm,
        );
        blade.rotation.z = a;
        blade.name = `Apaf-propeller-${blades}-blade`;
      }
    }
    arms.push(arm);
  }
  const hub = k.ring([0, 0, 0], 0.16, 0.075, apaf, apoptosome);
  const casp9 = k.ball(
    [0, 0, 0.16],
    [0.17, 0.13, 0.15],
    k.material("#bb8f78"),
    apoptosome,
  );
  const caspases = [];
  const caspMat = k.material("#b48b76"),
    activeMat = k.material("#ca9c54");
  for (let i = 0; i < 3; i++) {
    const enzyme = new THREE.Group();
    cell.add(enzyme);
    const left = k.ball([-0.1, 0, 0], [0.16, 0.13, 0.15], caspMat, enzyme);
    const right = k.ball([0.1, 0, 0], [0.16, 0.13, 0.15], caspMat, enzyme);
    const linker = k.segment(
      [-0.13, 0, 0.03],
      [0.13, 0, 0.03],
      0.03,
      k.material("#b6a398"),
      enzyme,
    );
    for (const x of [-0.11, 0.11]) {
      betaSheet(k, enzyme, [x, 0.03, 0.14], 0.16, k.material("#d4bbaa"), 3);
      helix(k, enzyme, [x, -0.07, 0.13], 0.16, 0.025, caspMat, 3, "x", 0.012);
    }
    caspases.push({ enzyme, left, right, linker });
  }
  const labels = [
    k.label([-2.5, 2.22, 0], "哺乳动物细胞", "Mammalian cell", 2),
    k.label([1.23, 1.82, 0], "线粒体双膜", "Mitochondrial membranes", 2),
    k.label([2.72, 0.72, 0.05], "BAX / BAK 膜孔", "BAX / BAK pore", 2),
    k.label([1.38, -1.66, 0.1], "Apaf-1 凋亡小体", "Apaf-1 apoptosome", 2),
    k.label(
      [-0.6, -1.77, 0.12],
      "执行者 caspase-3/7",
      "Executioner caspase-3/7",
      1,
    ),
    k.label(
      [-1.22, 0.83, 0.1],
      "染色质与核膜",
      "Chromatin and nuclear envelope",
      1,
    ),
    k.label(
      [-0.2, -2.95, 0],
      "膜包裹的凋亡小体",
      "Membrane-enclosed apoptotic bodies",
      2,
    ),
  ];
  function update(progress, parameters = {}) {
    const p = clamp(progress),
      trigger = parameters.condition !== "noStress";
    const t = trigger ? p : 0,
      momp = ease(t, 0.16, 0.29),
      release = ease(t, 0.29, 0.43),
      assembly = ease(t, 0.43, 0.56),
      execute = ease(t, 0.62, 0.78),
      pack = ease(t, 0.81, 1);
    cell.scale.setScalar(1 - 0.19 * execute);
    mito.position.set(1.26 * (1 - 0.24 * pack), 0.91 * (1 - 0.24 * pack), 0.02);
    mito.scale.setScalar(1 - 0.25 * pack);
    nuclearBack.scale.set(1 - 0.35 * execute, 0.92 - 0.3 * execute, 0.48);
    nuclearBack.visible = execute < 0.95;
    mitoClosure.visible = momp < 0.75;
    closure.visible = momp < 0.75;
    bax.visible = momp > 0.1;
    bax.scale.setScalar(0.4 + 0.6 * momp);
    cyto.forEach((c, i) => {
      // Release goes through the opened right end before spreading in cytosol.
      const initialAngle = c.angle > Math.PI ? c.angle - Math.PI * 2 : c.angle;
      if (release < 0.35) {
        const a = initialAngle * (1 - release / 0.35);
        c.mesh.position.set(
          1.26 + 0.91 * Math.cos(a),
          0.91 + 0.49 * Math.sin(a),
          0.12,
        );
      } else if (release < 0.55) {
        const u = (release - 0.35) / 0.2;
        c.mesh.position.set(2.17 + 0.48 * u, 0.91, 0.12);
      } else if (release < 0.78) {
        const u = (release - 0.55) / 0.23;
        c.mesh.position.set(2.65, 0.91 + (-0.5 - 0.91) * u, 0.12);
      } else {
        const u = (release - 0.78) / 0.22;
        c.mesh.position.set(
          2.65 + (c.tx - 2.65) * u,
          -0.5 + (c.ty + 0.5) * u,
          0.12,
        );
      }
      c.mesh.visible = t < 0.61;
    });
    arms.forEach((arm, i) => {
      const a = (i * Math.PI * 2) / 7;
      arm.position.set(
        Math.cos(a) * 0.72 * (1 - assembly),
        Math.sin(a) * 0.72 * (1 - assembly),
        0,
      );
    });
    apoptosome.visible = t >= 0.36;
    hub.visible = assembly > 0.8;
    casp9.visible = assembly > 0.9;
    apoptosome.scale.setScalar(1 - 0.18 * pack);
    caspases.forEach((c, i) => {
      const active = ease(t, 0.56 + i * 0.025, 0.66 + i * 0.025);
      c.enzyme.position.set(0.68 - i * 0.56, -1.2 + i * 0.21, 0.16);
      c.left.material = active > 0.7 ? activeMat : caspMat;
      c.right.material = active > 0.7 ? activeMat : caspMat;
      c.linker.visible = active < 0.7;
      c.left.position.x = -0.1 - 0.045 * active;
      c.right.position.x = 0.1 + 0.045 * active;
    });
    nucleus.scale.set(1 - 0.35 * execute, 0.92 - 0.3 * execute, 0.48);
    nucleus.visible = execute < 0.95;
    nuclearRim.visible = execute < 0.8;
    const lobes = [
      {
        center: [0, 0, 0],
        radii: [3.15 * (1 - 0.32 * pack), 2.65 * (1 - 0.32 * pack), 0.92],
      },
    ];
    chromatin.forEach(({ cargo, x, y }, i) => {
      const a = 0.35 + (i * Math.PI * 2) / 5,
        move = ease(t, 0.77, 0.97);
      const tx = Math.cos(a) * 3.34,
        ty = Math.sin(a) * 2.87;
      cargo.position.set(x + (tx - x) * move, y + (ty - y) * move, 0.09);
      cargo.scale.setScalar(1 - 0.15 * execute);
      // The same pre-existing DNA enters each bleb. No copied body cargo.
      lobes.push({
        center: [cargo.position.x, cargo.position.y, 0],
        radii: [0.49, 0.44, 0.38],
      });
    });
    plasma.update(lobes, 0.14);
    labels[2].active = t >= 0.16 && t < 0.81;
    labels[3].active = t >= 0.36 && t < 0.85;
    labels[4].active = t >= 0.57 && t < 0.85;
    labels[6].active = t >= 0.81;
    labels[5].active = t < 0.78;
    group.userData = {
      organism: "mammalian",
      mechanism: "intrinsic mitochondrial apoptosis",
      condition: parameters.condition || "stress",
      outerMembranePermeabilized: momp > 0.75,
      cytochromeCCompartment:
        release > 0.5 ? "cytosol" : "mitochondrial intermembrane space",
      apoptosomeAssembled: assembly > 0.9,
      caspase9Active: assembly > 0.9,
      executionerCaspasesActive: t >= 0.66,
      apoptoticBodies: pack > 0.9 ? 5 : 0,
      plasmaMembraneRupture: false,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    science: { plasma, chromatin, mito, innerPath },
    materials: materialInventory(group, [activeMat, caspMat].filter(Boolean)),
    camera: { position: [0, 1.1, 11.8], target: [0, 0, 0] },
  };
}
export default {
  id: "apoptosis",
  title: B("线粒体内源性凋亡", "Intrinsic mitochondrial apoptosis"),
  duration: 34,
  intro: B(
    "示意哺乳动物细胞在不可恢复应激下的内源性凋亡：线粒体外膜通透化、caspase 激活、细胞收缩和膜包裹。无应激条件保持结构完整。分子形状和时程经过简化；不模拟所有死亡路线或后续吞噬。",
    "A mammalian cell undergoing intrinsic apoptosis after irrecoverable stress: mitochondrial outer-membrane permeabilization, caspase activation, shrinkage and membrane-enclosed packaging. Without stress, structures remain intact. Molecular shapes and timing are simplified; other death pathways and later engulfment are omitted.",
  ),
  controls: [
    {
      id: "condition",
      label: B("内源性触发", "Intrinsic trigger"),
      default: "stress",
      options: [
        { value: "stress", label: B("不可恢复应激", "Irrecoverable stress") },
        { value: "noStress", label: B("无触发应激", "No triggering stress") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: B("完整细胞与线粒体", "Intact cell and mitochondrion"),
      description: B(
        "双膜线粒体中，细胞色素 c 位于膜间隙一侧。细胞核和质膜保持完整；本场景限定为动物细胞的内源性路线。",
        "Cytochrome c lies on the intermembrane-space side of the mitochondrial inner membrane. The nucleus and plasma membrane remain intact. This scene is restricted to the animal intrinsic pathway.",
      ),
    },
    {
      at: 0.16,
      title: B("线粒体外膜通透化", "Outer-membrane permeabilization"),
      description: B(
        "在持续应激下，BCL-2 家族的调控可使 BAX / BAK 形成外膜孔。这里省略上游应激传感与各调控蛋白之间的结合。",
        "Under sustained stress, BCL-2-family regulation can allow BAX / BAK to form outer-membrane pores. Upstream stress sensing and regulatory binding interactions are omitted.",
      ),
    },
    {
      at: 0.29,
      title: B("细胞色素 c 释放", "Cytochrome c release"),
      description: B(
        "细胞色素 c 从线粒体膜间隙经外膜孔进入胞质，并促进 Apaf-1 活化。质膜并未破裂，线粒体内膜与外膜也不是同一层膜。",
        "Cytochrome c exits the intermembrane space through outer-membrane pores into the cytosol and promotes Apaf-1 activation. The plasma membrane has not ruptured; the two mitochondrial membranes are distinct.",
      ),
    },
    {
      at: 0.43,
      title: B("组装凋亡小体", "Assembling the apoptosome"),
      description: B(
        "Apaf-1 在细胞色素 c 和核苷酸参与下组装成七聚体复合物，招募并激活起始 caspase-9；核苷酸未单独画出。",
        "With cytochrome c and nucleotide participation, Apaf-1 forms a heptameric complex that recruits and activates initiator caspase-9. Nucleotides are not drawn separately.",
      ),
    },
    {
      at: 0.59,
      title: B("蛋白水解执行", "Proteolytic execution"),
      description: B(
        "caspase-9 激活执行者 caspase-3/7；其底物切割促进核膜解体和染色质凝聚，并解除核酸酶抑制。caspase 本身不是切割 DNA 的核酸酶。",
        "Caspase-9 activates executioner caspase-3/7. Substrate cleavage promotes nuclear-envelope breakdown, chromatin condensation and release of nuclease inhibition. Caspases are not DNA-cleaving nucleases.",
      ),
    },
    {
      at: 0.81,
      title: B("收缩、出泡与包裹", "Shrinkage, blebbing and packaging"),
      description: B(
        "细胞收缩并形成膜包裹的凋亡小体，供邻近细胞或吞噬细胞清除。这里显示的是凋亡早期的膜完整性；若清除失败，之后可能发生继发性坏死。",
        "The cell shrinks and forms membrane-enclosed apoptotic bodies for clearance by neighboring cells or phagocytes. This depicts membrane integrity during apoptosis; failed clearance can later lead to secondary necrosis.",
      ),
    },
  ],
  sources: [
    {
      title: "Active human apoptosome (PDB 5JUY)",
      url: "https://www.rcsb.org/structure/5JUY",
    },
    {
      title: "ROCK I, membrane blebbing and DNA redistribution",
      url: "https://mcb.berkeley.edu/courses/mcb230/jk_pdfs/15_coleman_rock_blebbing.pdf",
    },
    {
      title: "Nucleosome core particle (PDB 1AOI)",
      url: "https://www.rcsb.org/structure/1AOI",
    },
    {
      title:
        "Molecular Biology of the Cell — Programmed Cell Death (Apoptosis)",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26873/",
    },
    {
      title:
        "Atomic structure of the apoptosome: mechanism of cytochrome c- and dATP-mediated activation of Apaf-1",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4691890/",
    },
  ],
  create,
};
