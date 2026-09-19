import {
  annularBilayer,
  proteinDomain,
  helix,
  molecularInventory,
} from "./refinementGeometry.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
export default {
  id: "organelleImport",
  title: b(
    "叶绿体导入：跨越 TOC / TIC",
    "Chloroplast import: across TOC / TIC",
  ),
  duration: 35,
  intro: b(
    "以陆生植物叶绿体基质蛋白为例：核基因编码的前体在胞质合成，经过叶绿体两层包膜后成熟。通道、受体与伴侣均为功能示意；TIC 组成及导入马达存在物种与研究模型差异，本图不声称展示统一的原子结构。",
    "A land-plant chloroplast stromal protein example: a nuclear-encoded precursor is synthesized in the cytosol and matures after crossing both envelope membranes. Channels, receptors and chaperones are functional schematics. TIC composition and import motors vary among species and research models; no universal atomic structure is claimed.",
  ),
  controls: [
    {
      id: "transit",
      label: b("N 端转运肽", "N-terminal transit peptide"),
      default: "present",
      options: [
        { value: "present", label: b("具有转运肽", "Transit peptide present") },
        { value: "absent", label: b("缺少转运肽", "Transit peptide absent") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("胞质中的前体", "A cytosolic precursor"),
      description: b(
        "核编码前体蛋白在胞质翻译，N 端转运肽提供叶绿体靶向信息。伴侣可帮助维持适于导入的构象；本例目的地是基质，不是类囊体腔。",
        "The nuclear-encoded precursor is translated in the cytosol. An N-terminal transit peptide supplies chloroplast targeting information. Chaperones can help maintain import competence; the destination here is the stroma, not the thylakoid lumen.",
      ),
    },
    {
      at: 0.16,
      title: b("TOC 识别靶向信息", "TOC recognizes targeting information"),
      description: b(
        "外包膜 TOC 受体识别前体，受体的 GTP 酶循环参与早期导入。缺少转运肽时，此处的前体保留在胞质；并不意味着所有叶绿体蛋白都使用完全相同的靶向途径。",
        "Outer-envelope TOC receptors recognize the precursor; receptor GTPase cycling participates in early import. Without a transit peptide this precursor remains cytosolic. Not all chloroplast proteins use exactly the same targeting pathway.",
      ),
    },
    {
      at: 0.34,
      title: b("通过外膜与内膜", "Cross outer and inner membranes"),
      description: b(
        "多肽经 TOC 与 TIC 路径依次跨越外包膜、膜间隙和内包膜。图中的连续通路只表示功能衔接，不指定争议中的全部通道亚基或精确排列。",
        "The polypeptide passes through TOC and TIC across the outer envelope, intermembrane space and inner envelope. The continuous route represents functional coupling, without specifying all debated channel subunits or their exact arrangement.",
      ),
    },
    {
      at: 0.55,
      title: b(
        "基质侧 ATP 依赖性导入",
        "ATP-dependent import on the stromal side",
      ),
      description: b(
        "基质侧伴侣与导入马达利用 ATP 周期促进前体进入并限制回滑。通道内多肽以伸展构象表示；这不是一个完整折叠球体直接穿过膜的模型。",
        "Stromal chaperones and import motors use ATP cycling to promote entry and limit backsliding. The channel-threaded chain is represented as extended rather than as a folded globule crossing the membrane.",
      ),
    },
    {
      at: 0.76,
      title: b("切除转运肽", "Remove the transit peptide"),
      description: b(
        "基质加工肽酶切除 N 端转运肽，形成成熟蛋白的 N 端。切割可在导入过程中发生；此处为教学清晰而在链进入后强调这一事件。",
        "Stromal processing peptidase removes the N-terminal transit peptide, creating the mature N terminus. Cleavage can occur during import; it is highlighted after entry here for clarity.",
      ),
    },
    {
      at: 0.91,
      title: b("在基质中折叠", "Fold in the stroma"),
      description: b(
        "进入基质的成熟链在伴侣帮助下折叠。被切除的转运肽随后可被降解；若缺少靶向信号，本模型不会产生基质中的成熟蛋白。",
        "The imported mature chain folds with chaperone assistance in the stroma. The cleaved transit peptide can subsequently be degraded. Without the targeting signal, this model produces no mature stromal protein.",
      ),
    },
  ],
  sources: [
    {
      title: "Protein import into chloroplasts",
      url: "https://www.nature.com/articles/nrm1333",
    },
    {
      title: "Architecture of chloroplast TOC–TIC translocon supercomplex",
      url: "https://www.nature.com/articles/s41586-023-05744-y",
    },
    {
      title:
        "Stromal processing peptidase binds transit peptides and initiates their ATP-dependent turnover in chloroplasts",
      url: "https://pubmed.ncbi.nlm.nih.gov/10508853/",
    },
  ],
  create({ rootId = "plant" } = {}) {
    const k = sceneKit(),
      { group } = k,
      green = k.material("#9ab69b", {
        side: THREE.DoubleSide,
      }),
      tocMat = k.material("#7f9f93"),
      ticMat = k.material("#829ca9"),
      chainMat = k.material("#9984ac"),
      transitMat = k.material("#c2a06a"),
      chaperoneMat = k.material("#b8a8c4"),
      cleaveMat = k.material("#9eaf8d");
    // Both envelope membranes have paired leaflets and a front inspection wedge.
    const lipidCore = k.material("#c3c0a1", { side: THREE.DoubleSide });
    for (const [x, mat] of [
      [-0.55, tocMat],
      [0.55, ticMat],
    ]) {
      annularBilayer(k, group, {
        x,
        inner: 0.43,
        outer: 2.5,
        material: green,
        tailMaterial: lipidCore,
        cut: 1.3,
      });
      for (const edge of [x - 0.22, x + 0.22]) {
        const ring = k.ring([edge, 0, 0], 0.43, 0.065, mat);
        ring.rotation.y = Math.PI / 2;
      }
      // Repeated fold motifs indicate a channel wall, not measured subunit counts.
      if (x < 0) {
        for (let i = 0; i < 12; i++) {
          const a = (i * Math.PI) / 6;
          const pts = [];
          for (let j = 0; j <= 12; j++) {
            const t = j / 12,
              ang = a + (t - 0.5) * 0.3;
            pts.push([
              x - 0.23 + t * 0.46,
              Math.cos(ang) * 0.43,
              Math.sin(ang) * 0.43,
            ]);
          }
          k.tube(pts, 0.049, mat, group, 24);
        }
      } else {
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          helix(
            k,
            group,
            [x - 0.23, Math.cos(a) * 0.43, Math.sin(a) * 0.43],
            [x + 0.23, Math.cos(a + 0.12) * 0.43, Math.sin(a + 0.12) * 0.43],
            0.037,
            4,
            mat,
            0.025,
          );
        }
      }
    }
    // Intermembrane accessory scaffold is off-axis, leaving the substrate route open.
    k.tube(
      [
        [-0.32, -0.61, -0.15],
        [0, -0.7, -0.2],
        [0.32, -0.59, -0.15],
      ],
      0.073,
      tocMat,
      group,
      40,
    );
    const receptor = proteinDomain(
      k,
      group,
      [-0.9, 0.72, 0],
      [0.32, 0.36, 0.28],
      tocMat,
    );
    helix(
      k,
      group,
      [-1.09, 0.6, 0.24],
      [-0.8, 0.82, 0.23],
      0.04,
      4,
      k.material("#b9cec0"),
      0.021,
    );
    k.tube(
      [
        [-1.1, 0.56, 0.12],
        [-1.02, 0.42, 0.13],
        [-0.83, 0.46, 0.15],
      ],
      0.032,
      transitMat,
      group,
      32,
    );
    k.segment([-0.68, 0.43, 0], [-0.9, 0.62, 0], 0.1, tocMat);
    const chaperone = new THREE.Group();
    group.add(chaperone);
    proteinDomain(
      k,
      chaperone,
      [0, 0.32, -0.14],
      [0.34, 0.27, 0.3],
      chaperoneMat,
    );
    proteinDomain(
      k,
      chaperone,
      [0.16, -0.3, -0.11],
      [0.24, 0.22, 0.23],
      chaperoneMat,
      1,
    );
    k.tube(
      [
        [-0.1, 0.1, -0.2],
        [-0.24, -0.05, -0.16],
        [0.04, -0.23, -0.14],
      ],
      0.055,
      chaperoneMat,
      chaperone,
      40,
    );
    helix(
      k,
      chaperone,
      [-0.18, 0.4, 0.11],
      [0.21, 0.39, 0.1],
      0.049,
      4,
      ticMat,
      0.027,
    );
    chaperone.position.set(1.22, 0.05, -0.15);
    const spp = new THREE.Group();
    group.add(spp);
    proteinDomain(k, spp, [0, 0, 0], [0.3, 0.26, 0.22], cleaveMat);
    proteinDomain(k, spp, [0.3, 0, 0], [0.23, 0.2, 0.19], cleaveMat, 1);
    helix(k, spp, [-0.17, 0.1, 0.2], [0.1, 0.13, 0.2], 0.04, 3, ticMat, 0.021);
    const n = 76,
      segments = [],
      beads = [],
      sidechains = [],
      pts = Array.from({ length: n + 1 }, () => new THREE.Vector3());
    for (let i = 0; i < n; i++) {
      segments.push(
        k.segment([0, 0, 0], [0, 1, 0], 0.051, i < 9 ? transitMat : chainMat),
      );
      if (i % 3 === 0)
        beads.push({
          i,
          mesh: k.ball([0, 0, 0], 0.074, i < 9 ? transitMat : chainMat),
        });
    }
    for (let i = 0; i < n; i += 4)
      sidechains.push({
        i,
        mesh: k.segment(
          [0, 0, 0],
          [0, 1, 0],
          0.025,
          i < 9 ? transitMat : chainMat,
        ),
      });
    const sideEnd = new THREE.Vector3();
    const dir = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    const labels = [
      k.label([-2.8, 2.15, 0], "胞质", "Cytosol", 2),
      k.label([2.55, 2.15, 0], "叶绿体基质", "Chloroplast stroma", 2),
      k.label([-0.95, -1.2, 0], "TOC · 外包膜", "TOC · outer envelope", 2),
      k.label([0.95, -1.8, 0], "TIC · 内包膜", "TIC · inner envelope", 2),
      k.label([0, 1.45, 0], "膜间隙", "Intermembrane space", 1),
      k.label([-1.8, 0.9, 0], "N 端转运肽", "N-terminal transit peptide", 2),
      k.label(
        [1.45, 0.9, 0],
        "ATP 依赖性伴侣 / 马达",
        "ATP-dependent chaperone / motor",
        1,
      ),
      k.label([2.8, -1.1, 0], "成熟基质蛋白", "Mature stromal protein", 2),
    ];
    function update(value, parameters = {}) {
      const p = clamp(value),
        targeted = parameters.transit !== "absent",
        dock = targeted ? ease(p, 0.12, 0.3) : 0,
        thread = targeted ? ease(p, 0.3, 0.77) : 0,
        cleave = targeted ? ease(p, 0.77, 0.85) : 0,
        fold = targeted ? ease(p, 0.85, 1) : 0,
        lead = -1.25 + 0.58 * dock + 4.8 * thread;
      for (let i = 0; i <= n; i++) {
        const t = i / n,
          x = lead - 3.3 * t,
          outside =
            Math.abs(x) > 0.8 ? Math.min(1, (Math.abs(x) - 0.8) / 0.8) : 0;
        let y = 0.24 * Math.sin(t * Math.PI * 6) * outside,
          z = 0.23 * Math.sin(t * Math.PI * 7) * outside;
        let fx = x,
          fy = y,
          fz = z;
        if (i < 9) {
          fy += cleave * 1.15;
          fx += cleave * 0.25;
        } else {
          const q = (i - 9) / (n - 9),
            a = q * Math.PI * 8,
            rad = 0.34 + 0.16 * Math.sin(q * Math.PI * 3);
          const tx = 2.65 + 0.45 * Math.cos(a),
            ty =
              0.45 * Math.sin(a) * Math.sin(q * Math.PI) +
              0.25 * Math.cos(q * 7),
            tz = rad * Math.sin(a * 0.75);
          fx += (tx - fx) * fold;
          fy += (ty - fy) * fold;
          fz += (tz - fz) * fold;
        }
        pts[i].set(fx, fy, fz);
      }
      for (let i = 0; i < n; i++) {
        const m = segments[i];
        dir.copy(pts[i + 1]).sub(pts[i]);
        m.position
          .copy(pts[i])
          .add(pts[i + 1])
          .multiplyScalar(0.5);
        m.scale.set(0.051, Math.max(0.00001, dir.length()), 0.051);
        m.quaternion.setFromUnitVectors(up, dir.normalize());
        m.visible = !(i === 8 && cleave > 0.05) && !(i < 9 && !targeted);
      }
      for (const v of beads) {
        v.mesh.position.copy(pts[v.i]);
        v.mesh.visible = v.i >= 9 || targeted;
      }
      for (const item of sidechains) {
        const point = pts[item.i];
        sideEnd.copy(point);
        sideEnd.y += item.i % 8 ? 0.13 : -0.13;
        sideEnd.z += 0.08;
        dir.copy(sideEnd).sub(point);
        item.mesh.position.copy(point).add(sideEnd).multiplyScalar(0.5);
        item.mesh.scale.set(0.025, dir.length(), 0.025);
        item.mesh.quaternion.setFromUnitVectors(up, dir.normalize());
        item.mesh.visible = item.i >= 9 || targeted;
      }
      receptor.scale.set(0.32 + 0.03 * Math.sin(dock * Math.PI), 0.36, 0.28);
      chaperone.visible = targeted && thread > 0.05;
      chaperone.rotation.x = thread * Math.PI * 0.55;
      spp.position.set(3.65, 0.5, 0);
      spp.visible = targeted && p >= 0.73 && p < 0.89;
      labels[5].active = targeted;
      labels[5].position[0] = lead - 0.15 + cleave * 0.25;
      labels[5].position[1] = 0.65 + cleave * 1.15;
      labels[6].active = chaperone.visible;
      labels[7].active = fold > 0.2;
      group.userData = {
        rootId,
        destination: "chloroplast-stroma",
        transitPeptide: targeted ? "present" : "absent",
        direction: "cytosol-to-stroma",
        outerMembraneCrossed: targeted && lead > -0.39,
        innerMembraneCrossed: targeted && lead > 0.71,
        entireChainImported: targeted && lead - 3.3 > 0.71,
        transitCleaved: cleave === 1,
        folded: fold === 1,
        channelStructure: "functional-schematic",
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      materials: molecularInventory(group),
      camera: { position: [2.3, 2.6, 12.2], target: [0, 0, 0] },
    };
  },
};
