import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { membraneSurface, interpolateProfile } from "./membranes.js";
import {
  clathrinLattice,
  ldlReceptor,
  ldlParticle,
  acidPump,
} from "./molecules.js";

function create() {
  const k = sceneKit(),
    { group } = k;
  const membrane = k.material("#83a9a1", {
    side: THREE.DoubleSide,
    roughness: 0.62,
  });
  const coatMat = k.material("#77849b"),
    receptorMat = k.material("#b17b61"),
    cargoMat = k.material("#d4ad65");
  const plane = membraneSurface(group, membrane, 82);
  plane.mesh.position.x = -1.5;
  const carrier = membraneSurface(group, membrane);
  const endosome = membraneSurface(group, membrane, 65, 64, "x");
  const neck = k.ring([-1.5, 1.45, 0], 0.22, 0.035, k.material("#9c799b"));
  neck.rotation.x = Math.PI / 2;
  const coat = clathrinLattice(k, coatMat);
  const receptors = [],
    cargo = [],
    receptorParts = [];
  for (let i = 0; i < 3; i++) {
    const receptor = ldlReceptor(k, receptorMat);
    receptorParts.push(receptor);
    receptor.group.scale.setScalar(0.8);
    receptors.push(receptor.group);
    const particle = ldlParticle(k, cargoMat);
    particle.scale.setScalar(0.9);
    cargo.push(particle);
  }
  const pump = acidPump(k, group);
  const dynamin = new THREE.Group();
  group.add(dynamin);
  dynamin.name = "helical dynamin collar — oligomeric rungs";
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI) / 6;
    const d = k.ball(
      [0.22 * Math.cos(a), -0.1 + i * 0.009, 0.22 * Math.sin(a)],
      [0.039, 0.034, 0.053],
      k.material("#947ba5"),
      dynamin,
    );
    d.rotation.y = -a;
  }
  // Surface markers reveal membrane orientation without filling the lumen.
  const labels = [
    k.label([-3.55, 2.6, 0], "细胞外 · LDL", "Extracellular · LDL", 2),
    k.label([-3.4, -2.6, 0], "胞质", "Cytosol", 2),
    k.label([-2.9, 0.4, 0.6], "胞质侧网格蛋白", "Cytosolic clathrin", 2),
    k.label([2.1, -2.5, 0.5], "早期内体腔", "Early endosome lumen", 2),
    k.label([3.7, -0.5, 0.4], "受体回收分选", "Receptor recycling domain", 1),
    k.label([-1.4, 1.9, 0.3], "动力蛋白颈环", "Dynamin neck collar", 1),
  ];
  function update(progress) {
    const p = clamp(progress),
      bend = ease(p, 0.1, 0.39),
      detached = p >= 0.43,
      travel = ease(p, 0.49, 0.65),
      fused = p >= 0.67,
      sort = ease(p, 0.73, 0.96);
    const cx = -1.5 + travel * 1.85,
      cy = -0.3 - travel * 0.95;
    plane.set((t) => {
      if (detached) return [1.4, 2.5 * t];
      if (t < 0.7) {
        const q = t / 0.7,
          theta = q * Math.PI * 0.96;
        return [
          1.4 - bend * (1.7 + 0.96 * Math.cos(theta)),
          (1 - bend) * 1.15 * q + bend * 0.96 * Math.sin(theta),
        ];
      }
      const q = (t - 0.7) / 0.3,
        rr = (1 - bend) * 1.15 + bend * 0.96 * Math.sin(Math.PI * 0.96),
        yy = 1.4 - bend * (1.7 + 0.96 * Math.cos(Math.PI * 0.96));
      return [yy + (1.4 - yy) * Math.min(1, q * 5), rr + (2.5 - rr) * q];
    });
    carrier.mesh.visible = detached && !fused;
    for (const [surface, r] of [[carrier, 0.96]]) {
      surface.mesh.position.set(cx, cy, 0);
      surface.set((t) => [
        -r * Math.cos(Math.PI * t),
        r * Math.sin(Math.PI * t),
      ]);
    }
    neck.visible = p > 0.29 && p < 0.44;
    neck.scale.setScalar(1 - 0.67 * ease(p, 0.34, 0.43));
    neck.position.y = 0.65;
    dynamin.visible = neck.visible;
    dynamin.position.copy(neck.position);
    dynamin.scale.copy(neck.scale);
    coat.update({
      bend,
      detached,
      cx,
      cy,
      uncoat: ease(p, 0.45, 0.54),
      visible: p > 0.12 && p < 0.54,
    });
    const fusedShape = [
      [-0.61, 0],
      [-0.38, 0.65],
      [0.1, 0.96],
      [0.55, 0.91],
      [0.95, 0.62],
      [1.6, 0.85],
      [2.2, 1.05],
      [2.8, 0.96],
      [3.2, 0.57],
      [3.45, 0.23],
      [4.05, 0.2],
      [4.32, 0],
    ];
    endosome.mesh.position.y = -1.25;
    endosome.set((t) =>
      fused
        ? interpolateProfile(fusedShape, t)
        : [2.35 - 1.05 * Math.cos(Math.PI * t), 1.05 * Math.sin(Math.PI * t)],
    );
    for (let i = 0; i < 3; i++) {
      const theta = (0.48 + 0.06 * (i % 2)) * Math.PI,
        az = -1.05 + i * 1.05,
        r = 0.96;
      const rho =
        ((1 - bend) * 1.15 * theta) / (Math.PI * 0.96) +
        bend * r * Math.sin(theta);
      const x =
        (detached ? cx : -1.5) +
        (detached ? r * Math.sin(theta) : rho) * Math.sin(az);
      const y = detached
        ? cy - r * Math.cos(theta)
        : 1.4 - bend * (1.7 + r * Math.cos(theta));
      const z = -(detached ? r * Math.sin(theta) : rho) * Math.cos(az);
      const normal = new THREE.Vector3(
        -bend * Math.sin(theta) * Math.sin(az),
        1 - bend + bend * Math.cos(theta),
        bend * Math.sin(theta) * Math.cos(az),
      ).normalize();
      receptors[i].position.set(x, y, z);
      receptors[i].quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        normal,
      );
      cargo[i].position.set(
        x + 0.44 * normal.x,
        y + 0.44 * normal.y + 0.8 * (1 - ease(p, 0, 0.12)),
        z + 0.44 * normal.z,
      );
      if (fused) {
        const q = ease(p, 0.67, 0.76);
        // Preserve three independent membrane anchors across fusion. Each starts
        // on its own side of the carrier and sorts along a distinct path.
        const initialX = 0.35 + r * Math.sin(theta) * Math.sin(az);
        const xx = initialX * (1 - q) + (2.05 + i * 0.18) * q + sort * 1.24;
        let rr = 0.2,
          slope = 0;
        for (let j = 0; j < fusedShape.length - 1; j++) {
          const [ax, ar] = fusedShape[j],
            [bx, br] = fusedShape[j + 1];
          if (xx >= ax && xx <= bx) {
            slope = (br - ar) / (bx - ax);
            rr = ar + (xx - ax) * slope;
          }
        }
        const initialAngle = Math.atan2(
          -r * Math.cos(theta),
          r * Math.sin(theta) * Math.cos(az),
        );
        const angle = initialAngle * (1 - q) + (-0.2 + i * 0.2) * q;
        receptors[i].position.set(
          xx,
          -1.25 + rr * Math.sin(angle),
          -rr * Math.cos(angle),
        );
        receptors[i].quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(
            slope,
            -Math.sin(angle),
            Math.cos(angle),
          ).normalize(),
        );
        const targetX = 0.8 + q * 0.8 + sort * (0.22 + i * 0.16),
          targetY = -1.2 - 0.25 * Math.sin(i * 1.5),
          targetZ = -0.15 - 0.2 * Math.cos(i);
        cargo[i].position.set(
          cargo[i].position.x * (1 - q) + targetX * q,
          cargo[i].position.y * (1 - q) + targetY * q,
          cargo[i].position.z * (1 - q) + targetZ * q,
        );
      }
    }
    const pumpRadius = fused ? 1.005 : 1.05;
    pump.position.set(
      fused ? 2.5 : 2.35,
      -1.25 + pumpRadius * 0.96,
      -pumpRadius * 0.28,
    );
    pump.rotation.set(-0.284, 0, 0);
    for (const receptor of receptorParts) {
      receptor.adaptor.visible = p > 0.12 && p < 0.54;
      receptor.repeats.rotation.z = -0.9 * ease(p, 0.72, 0.9);
    }
    labels[2].active = p > 0.12 && p < 0.54;
    labels[4].active = fused;
    labels[5].active = neck.visible;
    group.userData = {
      process: "endocytosis",
      specimen: "mammalian LDL receptor",
      pitConnectedToExterior: !detached,
      membraneTopology: !detached
        ? "open invagination"
        : !fused
          ? "sealed single-membrane vesicle"
          : "continuous endosome lumen",
      clathrinOnCytosolicFace: p > 0.12 && p < 0.54,
      coatRemoved: p >= 0.54,
      cargoCompartment: !detached
        ? "extracellular"
        : !fused
          ? "vesicle lumen"
          : "early endosome lumen",
      receptorSorting: sort,
      clathrinCageVertices: coat.vertices,
      clathrinCageEdges: coat.edges,
      lipidBilayerLeaflets: 2,
      LDLMonolayer: true,
      LDLRAcidCompaction: sort,
    };
  }
  update(0);
  return {
    group,
    update,
    labels,
    camera: { position: [0.4, 2.9, 11.8], target: [0.2, -0.05, 0] },
  };
}
export default {
  id: "endocytosis",
  title: b("受体介导内吞", "Receptor-mediated endocytosis"),
  intro: b(
    "哺乳动物 LDL 受体示例。切开展示质膜凹陷、囊泡和内体的腔；切口用于观察，不是膜孔。仅演示进入早期内体后的初步分选。LDL 显示脂质核心、表面单层与 ApoB；受体结构域和网格为结构示意，非原子模型。",
    "A mammalian LDL-receptor example. Cutaways expose the pit, vesicle and endosome lumens; viewing cuts are not membrane pores. The sequence ends at initial early-endosome sorting. LDL shows its lipid core, surface monolayer and ApoB; receptor domains and the coat are structural schematics, not atomic models.",
  ),
  duration: 34,
  stages: [
    {
      at: 0,
      title: b("配体结合", "Ligand binding"),
      description: b(
        "细胞外 LDL 结合跨膜受体；受体的胞质尾仍面向胞质。",
        "Extracellular LDL binds transmembrane receptors, whose cytosolic tails remain cytosolic.",
      ),
    },
    {
      at: 0.14,
      title: b("包被窝内陷", "Coated-pit invagination"),
      description: b(
        "适配蛋白将受体与胞质侧的网格蛋白连接。内陷腔仍与细胞外相通。",
        "Adaptors couple receptors to cytosolic clathrin. The invaginating lumen is still continuous with the exterior.",
      ),
    },
    {
      at: 0.34,
      title: b("颈部收缩与断裂", "Neck constriction and scission"),
      description: b(
        "动力蛋白参与颈部断裂，形成封闭的单膜囊泡。LDL 留在囊泡腔内。",
        "Dynamin contributes to neck scission, forming a sealed single-membrane vesicle with LDL in its lumen.",
      ),
    },
    {
      at: 0.47,
      title: b("脱去包被", "Uncoating"),
      description: b(
        "网格蛋白包被从胞质侧解离，运输囊泡随后接近早期内体。",
        "Clathrin dissociates from the cytosolic surface before the carrier approaches the early endosome.",
      ),
    },
    {
      at: 0.67,
      title: b("膜融合", "Membrane fusion"),
      description: b(
        "去包被囊泡与早期内体融合，腔室连通；膜两侧的拓扑关系保持。",
        "The uncoated carrier fuses with the early endosome, joining their lumens while preserving membrane sidedness.",
      ),
    },
    {
      at: 0.8,
      title: b("酸性内体分选", "Sorting in the acidic endosome"),
      description: b(
        "LDL 与受体分离。受体进入回收膜域，LDL 留在内体腔，随后可经晚期内体送往溶酶体；后续运输未显示。",
        "LDL releases from its receptor. Receptors enter a recycling membrane domain; luminal LDL can later travel via late endosomes to lysosomes, a route not shown here.",
      ),
    },
  ],
  legend: [
    { color: "#83a9a1", text: b("膜与腔室切面", "Membrane cutaway") },
    { color: "#77849b", text: b("胞质侧网格蛋白", "Cytosolic clathrin") },
    { color: "#b17b61", text: b("LDL 受体", "LDL receptor") },
    { color: "#d4ad65", text: b("LDL", "LDL") },
  ],
  sources: [
    {
      title: "Molecular Biology of the Cell — Clathrin coat assembly",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26859/",
    },
    {
      title:
        "Mechanism of LDL binding and release probed by structure-based mutagenesis of the LDL receptor",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2803231/",
    },
    {
      title: "Three-Dimensional cryoEM Reconstruction of Native LDL Particles",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3090388/",
    },
    {
      title: "NCBI Bookshelf — The Cell: Endocytosis",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9831/",
    },
    {
      title:
        "Molecular Biology of the Cell — Transport into the Cell from the Plasma Membrane",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26870/",
    },
  ],
  create,
};
