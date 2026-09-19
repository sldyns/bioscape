import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { membraneSurface, interpolateProfile } from "./membranes.js";
import {
  damagedEnzymeAggregate,
  lysosomalHydrolase,
  peptideFragment,
} from "./proteins.js";
import { acidPump } from "./molecules.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  const outerMat = k.material("#89a9a6", { side: THREE.DoubleSide }),
    innerMat = k.material("#c6c4a2", {
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
      depthWrite: false,
    });
  const lysMat = k.material("#a49bb6", { side: THREE.DoubleSide });
  const outer = membraneSurface(group, outerMat),
    inner = membraneSurface(group, innerMat);
  // The two cup faces join at the growing rim: one continuous phagophore cisterna.
  const rim = membraneSurface(
    group,
    k.material("#b0c0af", { side: THREE.DoubleSide }),
    9,
  );
  const lysosome = membraneSurface(group, lysMat, 65, 64, "x");
  const merged = membraneSurface(group, lysMat, 81, 64, "x");
  merged.mesh.name = "autolysosome-outer-membrane";
  const aggregate = damagedEnzymeAggregate(k);
  const fragments = Array.from({ length: 18 }, (_, i) => peptideFragment(k, i));
  const enzymeTemplate = lysosomalHydrolase(k),
    enzymes = [];
  for (let i = 0; i < 7; i++) {
    const enzyme = enzymeTemplate.clone(true);
    enzyme.rotation.set(i * 0.6, i * 0.43, i * 0.9);
    group.add(enzyme);
    enzymes.push(enzyme);
  }
  const pump = acidPump(k, group);
  const glycans = [];
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group();
    group.add(g);
    glycans.push(g);
    g.name = "luminal membrane glycan — protects the lysosomal surface";
    const mat = k.material("#b8c3a5");
    k.segment([0, 0, 0], [0, 0.12, 0], 0.012, mat, g);
    for (const side of [-1, 1]) {
      k.tube(
        [
          [0, 0.07, 0],
          [side * 0.035, 0.13, 0],
          [side * 0.058, 0.19, 0.018],
        ],
        0.01,
        mat,
        g,
        18,
      );
      k.ball([side * 0.058, 0.19, 0.018], 0.022, mat, g);
    }
  }
  const labels = [
    k.label([-2.8, 1.9, 0.5], "开放的隔离膜杯", "Open phagophore", 2),
    k.label(
      [-2.55, -1.9, 0.4],
      "受损胞质酶 · TPI 骨架示意",
      "Damaged cytosolic enzyme · TPI reference",
      2,
    ),
    k.label([-0.8, 1.9, 0.4], "两层独立膜", "Two separate membranes", 2),
    k.label([2.4, 1.5, 0.2], "溶酶体", "Lysosome", 2),
    k.label(
      [0.5, -2, 0.5],
      "外膜融合；内膜仍包围货物",
      "Outer membrane fuses; inner membrane encloses cargo",
      2,
    ),
    k.label([0.8, 1.8, 0.3], "自噬溶酶体", "Autolysosome", 2),
    k.label(
      [2.15, -1.15, 0.4],
      "组织蛋白酶 D · 腔内",
      "Cathepsin D · in the lumen",
      1,
    ),
  ];
  function update(progress) {
    const p = clamp(progress),
      growth = ease(p, 0, 0.44),
      closed = p >= 0.44,
      travel = ease(p, 0.47, 0.63),
      fused = p >= 0.65,
      breakdown = ease(p, 0.9, 0.995),
      innerRemoval = ease(p, 0.71, 0.8);
    const center = -1.35 + travel * 0.85,
      thetaMax = 0.42 + growth * (Math.PI - 0.42);
    outer.mesh.visible = !fused;
    outer.mesh.position.set(center, 0, 0);
    inner.mesh.position.set(center, 0, 0);
    inner.mesh.visible = p < 0.8;
    inner.mesh.name = "inner-autophagosomal-membrane";
    outer.set((t) => [
      -1.42 * Math.cos(t * thetaMax),
      1.42 * Math.sin(t * thetaMax),
    ]);
    const innerRadius = 1.24;
    const innerTheta = thetaMax * (1 - innerRemoval);
    inner.set((t) => [
      -innerRadius * Math.cos(t * innerTheta),
      innerRadius * Math.sin(t * innerTheta),
    ]);
    inner.setOpacity(1);
    rim.mesh.visible = !closed;
    rim.mesh.position.set(center, 0, 0);
    rim.set((t) => {
      const r = 1.24 + 0.18 * t;
      return [-r * Math.cos(thetaMax), r * Math.sin(thetaMax)];
    });
    lysosome.mesh.visible = !fused;
    lysosome.mesh.position.set(0, 0, 0);
    lysosome.set((t) => [
      2.02 - 0.92 * Math.cos(Math.PI * t),
      0.92 * Math.sin(Math.PI * t),
    ]);
    merged.mesh.visible = fused;
    const points = [
      [-1.92, 0],
      [-1.75, 0.68],
      [-1.27, 1.19],
      [-0.55, 1.42],
      [0.15, 1.18],
      [0.6, 0.64],
      [0.91, 0.56],
      [1.4, 0.81],
      [2.05, 0.92],
      [2.66, 0.64],
      [2.94, 0],
    ];
    const rounding = ease(p, 0.82, 0.96);
    merged.set((t) => {
      const [x, r] = interpolateProfile(points, t);
      return [
        x * (1 - rounding) + (0.48 - 2.05 * Math.cos(Math.PI * t)) * rounding,
        r * (1 - rounding) + 1.54 * Math.sin(Math.PI * t) * rounding,
      ];
    });
    aggregate.position.set(center, 0, 0);
    aggregate.scale.setScalar(1 - 0.94 * breakdown);
    aggregate.visible = p < 0.995;
    for (let i = 0; i < fragments.length; i++) {
      const a = i * 2.39996,
        r = 0.24 + (i % 7) * 0.13;
      fragments[i].visible = breakdown > 0.04;
      fragments[i].position.set(
        center + breakdown * (0.7 + r * Math.cos(a)),
        breakdown * r * Math.sin(a),
        -0.14 - 0.17 * Math.cos(i),
      );
      fragments[i].scale.setScalar(0.65 + 0.35 * breakdown);
      fragments[i].rotation.set(i * 0.47, i * 0.38, breakdown + i * 0.31);
    }
    for (let i = 0; i < enzymes.length; i++) {
      const a = i * 2.39996,
        q = ease(p, 0.8, 0.9),
        neckCentering = 1 - 0.86 * Math.sin(Math.PI * q);
      enzymes[i].position.set(
        (2.02 + 0.47 * Math.cos(a)) * (1 - q) +
          (center + 0.42 * Math.cos(a)) * q,
        (0.48 * Math.sin(a) * (1 - q) + 0.42 * Math.sin(a) * q) * neckCentering,
        (-0.2 - 0.18 * Math.cos(i)) * neckCentering,
      );
    }
    const pumpT = 0.76;
    let anchorX, anchorR;
    if (fused) {
      const [x, r] = interpolateProfile(points, pumpT);
      anchorX =
        x * (1 - rounding) +
        (0.48 - 2.05 * Math.cos(Math.PI * pumpT)) * rounding;
      anchorR =
        r * (1 - rounding) + 1.54 * Math.sin(Math.PI * pumpT) * rounding;
    } else {
      anchorX = 2.02 - 0.92 * Math.cos(Math.PI * pumpT);
      anchorR = 0.92 * Math.sin(Math.PI * pumpT);
    }
    pump.position.set(anchorX, anchorR * 0.85, -anchorR * 0.527);
    pump.rotation.set(-0.56, 0, 0);
    for (let i = 0; i < glycans.length; i++) {
      const t = 0.25 + i * 0.083,
        a = -1.6 + i * 0.49;
      let x, r;
      if (fused) {
        const values = interpolateProfile(points, t);
        x =
          values[0] * (1 - rounding) +
          (0.48 - 2.05 * Math.cos(Math.PI * t)) * rounding;
        r =
          values[1] * (1 - rounding) + 1.54 * Math.sin(Math.PI * t) * rounding;
      } else {
        x = 2.02 - 0.92 * Math.cos(Math.PI * t);
        r = 0.92 * Math.sin(Math.PI * t);
      }
      glycans[i].position.set(x, r * Math.sin(a), -r * Math.cos(a));
      glycans[i].quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, -Math.sin(a), Math.cos(a)),
      );
    }
    labels[0].active = !closed;
    labels[2].active = closed && !fused;
    labels[3].active = !fused;
    labels[4].active = fused && p < 0.71;
    labels[5].active = p >= 0.71;
    labels[6].position[0] = fused ? 1.1 : 2.15;
    labels[6].active = p < 0.98;
    group.userData = {
      process: "autophagy",
      specimen: "mammalian macroautophagy",
      phagophoreOpen: !closed,
      phagophoreClosure: growth,
      membraneCount: closed && !fused ? 2 : fused && p >= 0.8 ? 1 : 2,
      outerMembraneFused: fused,
      innerMembraneIntact: closed && p < 0.71,
      innerMembraneDegradation: innerRemoval,
      cargoCompartment: !closed
        ? "cytosol"
        : !fused
          ? "autophagosome interior"
          : p < 0.8
            ? "inner autophagosomal membrane"
            : "autolysosome lumen",
      cargoDegradation: breakdown,
      cutaway: true,
      leafletCountPerMembrane: 2,
      cargoBackboneReference: "1HTI",
      lysosomalProteaseReference: "1LYA",
      aggregateIsIllustrative: true,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0.2, 2.6, 10.4], target: [0.2, 0, 0] },
  };
}
export default {
  id: "autophagy",
  title: b("宏自噬", "Macroautophagy"),
  intro: b(
    "哺乳动物细胞中的宏自噬：隔离膜包围胞质蛋白聚集体，形成双膜自噬体，再与溶酶体融合。前侧切开以展示真实腔室；切口不是生理开口。膜来源与上游信号在此省略。货物以 TPI 的骨架作受损胞质酶示意，并非测定的聚集构象；腔内显示组织蛋白酶 D 的结构参考。",
    "Mammalian macroautophagy: a phagophore encloses a cytosolic protein aggregate, forms a double-membrane autophagosome and fuses with a lysosome. Front cutaways expose compartments; they are not physiological openings. Membrane sources and upstream signals are omitted. Cargo uses a TPI backbone to illustrate damaged cytosolic enzymes, not a measured aggregate conformation; luminal proteases use a cathepsin-D structural reference.",
  ),
  duration: 33,
  stages: [
    {
      at: 0,
      title: b("隔离膜起始", "Phagophore initiation"),
      description: b(
        "弯曲的膜囊在胞质形成。内外膜面在开放边缘连续，待包围货物此时仍位于胞质。",
        "A curved membrane cisterna forms in the cytosol. Its inner and outer faces connect at the open rim; cargo remains accessible to the cytosol.",
      ),
    },
    {
      at: 0.16,
      title: b("杯状膜延伸", "Cup expansion"),
      description: b(
        "隔离膜逐步包围蛋白聚集体；杯口尚未闭合，不能视为封闭自噬体。",
        "The phagophore grows around the protein aggregate. Its open mouth still connects the cargo space to the cytosol.",
      ),
    },
    {
      at: 0.44,
      title: b("闭合形成双膜自噬体", "Double-membrane closure"),
      description: b(
        "杯口闭合后形成两层独立膜，胞质货物被隔离在内膜以内。两膜之间保留狭窄空间。",
        "Closure creates two separate membranes. Captured cytosolic cargo lies inside the inner membrane, separated from the narrow intermembrane space.",
      ),
    },
    {
      at: 0.54,
      title: b("接近溶酶体", "Lysosome encounter"),
      description: b(
        "封闭自噬体接近含水解酶的溶酶体。货物此时仍被内膜保护。",
        "The sealed autophagosome approaches a hydrolase-containing lysosome. Its inner membrane still separates the cargo from those enzymes.",
      ),
    },
    {
      at: 0.65,
      title: b("外膜融合", "Outer-membrane fusion"),
      description: b(
        "自噬体外膜与溶酶体膜融合。内膜及其包围的货物进入融合后腔室，内膜并不直接与溶酶体膜融合。",
        "The outer autophagosomal membrane fuses with the lysosomal membrane, placing the intact inner membrane and its cargo within the shared lumen.",
      ),
    },
    {
      at: 0.73,
      title: b("先降解内膜屏障", "Remove the inner-membrane barrier first"),
      description: b(
        "内膜先出现扩大开口并被清除；此后腔内蛋白酶才能接近被包裹的货物。",
        "The inner membrane develops an expanding opening and is removed before luminal proteases approach the enclosed cargo.",
      ),
    },
    {
      at: 0.9,
      title: b("货物水解", "Cargo hydrolysis"),
      description: b(
        "屏障清除后蛋白酶接触货物，将其降解为短肽；产物回收至胞质的运输未显示。",
        "After barrier removal, proteases contact cargo and cleave it into peptides. Product transport back to the cytosol is not shown.",
      ),
    },
  ],
  legend: [
    {
      color: "#89a9a6",
      text: b("隔离膜／自噬体外膜", "Phagophore / outer membrane"),
    },
    {
      color: "#c6c4a2",
      text: b("自噬体内膜", "Inner autophagosomal membrane"),
    },
    { color: "#a49bb6", text: b("溶酶体膜", "Lysosomal membrane") },
    { color: "#b98970", text: b("胞质蛋白货物", "Cytosolic protein cargo") },
  ],
  sources: [
    {
      title:
        "RCSB PDB 1HTI — Human triosephosphate isomerase, structural reference for illustrative cargo",
      url: "https://www.rcsb.org/structure/1HTI",
    },
    {
      title: "RCSB PDB 1LYA — Human lysosomal cathepsin D",
      url: "https://www.rcsb.org/structure/1LYA",
    },
    {
      title: "The Mechanism and Physiological Function of Macroautophagy",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6741458/",
    },
    {
      title: "An Overview of Autophagy: Morphology, Mechanism, and Regulation",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3894687/",
    },
  ],
  create,
};
