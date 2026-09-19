import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { molecularDetail } from "./molecularDetail.js";

export default {
  id: "crispr",
  title: b("Cas9 · CRISPR 干扰", "Cas9 · CRISPR interference"),
  duration: 32,
  intro: b(
    "以化脓性链球菌的 II-A 型系统为例，仅展示干扰阶段：成熟 crRNA、tracrRNA 与 Cas9 识别外源 DNA。不展示新间隔序列获取、CRISPR 转录或 RNA 加工。比较 NGG PAM、引导配对与切割。",
    "This Streptococcus pyogenes type II-A example shows interference only: mature crRNA, tracrRNA, and Cas9 recognize foreign DNA. Spacer acquisition, CRISPR transcription, and RNA processing are omitted. Compare NGG PAM recognition, guide pairing, and cleavage.",
  ),
  controls: [
    {
      id: "target",
      label: b("外源 DNA 靶位点", "Foreign DNA target"),
      default: "matched",
      options: [
        {
          value: "matched",
          label: b("NGG PAM + 匹配引导", "NGG PAM + matching guide"),
        },
        { value: "noPam", label: b("缺少兼容 PAM", "No compatible PAM") },
        {
          value: "mismatch",
          label: b(
            "PAM 邻近种子区多处错配",
            "Multiple PAM-proximal seed mismatches",
          ),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("已组装的干扰复合物", "Assembled interference complex"),
      description: b(
        "crRNA 提供靶向序列；其重复区与 tracrRNA 反重复区配对形成支架。两条天然 RNA 以不同颜色显示，支架为拓扑示意，不是工程化单引导 RNA。",
        "crRNA supplies the targeting sequence; its repeat pairs with the tracrRNA anti-repeat to form the scaffold. The two natural RNAs have distinct colors. The scaffold shows topology schematically and is not an engineered single-guide RNA.",
      ),
    },
    {
      at: 0.18,
      title: b("先识别 PAM", "Recognize the PAM first"),
      description: b(
        "SpCas9 首先识别非靶链上的 5′-NGG-3′ PAM。此示例缺少兼容 PAM 时不能建立稳定 R-loop。",
        "SpCas9 first recognizes a 5′-NGG-3′ PAM on the non-target strand. Without a compatible PAM, this example does not form a stable R-loop.",
      ),
    },
    {
      at: 0.36,
      title: b("局部解链与配对", "Unwind and pair"),
      description: b(
        "从 PAM 邻近处开始，引导 RNA 与反向平行的靶 DNA 链配对；另一条 DNA 链被置换。本例多处种子区错配阻止稳定延伸。",
        "Starting near the PAM, the guide pairs antiparallel with the target DNA strand and displaces the other DNA strand. Multiple seed mismatches in this example prevent stable propagation.",
      ),
    },
    {
      at: 0.56,
      title: b("R-loop 触发构象激活", "R-loop activates cleavage"),
      description: b(
        "充分配对的 R-loop 支持核酸酶结构域进入催化构象。错配容忍度依赖位置及序列；这里的对照不代表任何单个错配均完全阻断切割。",
        "A sufficiently paired R-loop supports catalytic nuclease conformations. Mismatch tolerance depends on position and sequence; this comparison does not mean that every single mismatch blocks cleavage.",
      ),
    },
    {
      at: 0.76,
      title: b("分别切开两条 DNA 链", "Cleave both DNA strands"),
      description: b(
        "HNH 切割靶链，RuvC 切割非靶链，形成 PAM 上游附近的双链断裂。图中用局部间隙标出断点；Cas9 可继续结合产物。",
        "HNH cleaves the target strand and RuvC cleaves the non-target strand, producing a double-strand break upstream of the PAM. Local gaps mark the cuts; Cas9 can remain bound to the products.",
      ),
    },
  ],
  sources: [
    {
      title: "Jinek et al. 2012: programmable dual-RNA-guided DNA endonuclease",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6286148/",
    },
    {
      title:
        "R-loop formation and conformational activation mechanisms of Cas9",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9433323/",
    },
    {
      title:
        "Structures of a CRISPR-Cas9 R-loop complex primed for DNA cleavage",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC5111852/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k,
      dnaMat = k.material("#a7b7b9"),
      targetMat = k.material("#7c9d99"),
      crMat = k.material("#b48b9f"),
      trMat = k.material("#b5aa7d"),
      casMat = k.material("#91a6b7"),
      casDark = k.material("#6e899d"),
      pamMat = k.material("#c7a064"),
      bondMat = k.material("#bdc3b5"),
      hnhMat = k.material("#ba8b76");
    const cas = new THREE.Group();
    group.add(cas);
    const detail = molecularDetail(k),
      targetBase = k.material("#b2cec3"),
      otherBase = k.material("#c5ccd1"),
      rnaBase = k.material("#d7b6c7");
    detail.fold(
      cas,
      "REC1 guide-recognition domain",
      [-1.05, 0.66, -0.65],
      [0.78, 0.86, 0.55],
      casMat,
      casDark,
      { sheetCount: 2, helixCount: 4, rotation: -0.28 },
    );
    detail.fold(
      cas,
      "REC2 domain",
      [-1.66, 1.02, -0.57],
      [0.49, 0.64, 0.4],
      casMat,
      casDark,
      { sheetCount: 1, helixCount: 3, rotation: 0.4 },
    );
    detail.fold(
      cas,
      "REC3 proofreading domain",
      [-0.1, 1.18, -0.66],
      [0.83, 0.65, 0.51],
      casMat,
      casDark,
      { sheetCount: 3, helixCount: 3, rotation: 0.28 },
    );
    detail.fold(
      cas,
      "NUC lobe scaffold",
      [1.1, 0.4, -0.71],
      [0.82, 0.85, 0.51],
      casDark,
      casMat,
      { sheetCount: 4, helixCount: 3 },
    );
    k.tube(
      [
        [-1.72, 0.1, -0.55],
        [-1.1, -0.8, -0.58],
        [0.2, -0.85, -0.62],
        [1.26, -0.56, -0.6],
      ],
      0.14,
      casMat,
      cas,
    );
    const bridge = k.mesh(detail.helix, casDark, [-0.68, -0.58, -0.28], cas);
    bridge.rotation.z = -Math.PI / 2;
    bridge.scale.set(0.8, 1.22, 0.8);
    const pamDomain = detail.fold(
      cas,
      "PAM-interacting pocket",
      [1.64, 0.32, -0.13],
      [0.44, 0.55, 0.38],
      trMat,
      pamMat,
      { sheetCount: 3, helixCount: 2 },
    );
    k.tube(
      [
        [1.37, 0.44, 0.1],
        [1.51, 0.58, 0.08],
        [1.77, 0.48, 0.1],
      ],
      0.045,
      pamMat,
      cas,
    );
    const hnh = detail.fold(
        cas,
        "HNH target-strand nuclease",
        [0.52, -0.69, 0],
        [0.36, 0.31, 0.28],
        hnhMat,
        trMat,
        { sheetCount: 2, helixCount: 2 },
      ),
      ruvc = detail.fold(
        cas,
        "RuvC non-target nuclease",
        [0.65, 0.68, -0.06],
        [0.4, 0.28, 0.28],
        casDark,
        casMat,
        { sheetCount: 3, helixCount: 2 },
      );
    // Separate native RNAs: crRNA repeat and tracrRNA anti-repeat share a stem.
    // These coarse backbone anchors indicate topology, not an atomic RNA fold.
    const repeatStem = Array.from({ length: 7 }, (_, i) => [
      1.48 + i * 0.11,
      -0.48 - i * 0.12,
      0.38,
    ]);
    const antiStem = repeatStem.map(([x, y]) => [x, y, 0.65]).reverse();
    const crPoints = [
      [1.205, -0.25, 0.38],
      [1.35, -0.33, 0.38],
      ...repeatStem,
      [2.29, -1.34, 0.38],
    ];
    const trPoints = [
      [2.31, -1.4, 0.65],
      ...antiStem,
      [1.14, -0.66, 0.65],
      [0.96, -1.13, 0.55],
      [1.22, -1.48, 0.5],
      [1.5, -1.29, 0.5],
      [1.35, -1.87, 0.5],
      [0.98, -2.0, 0.5],
      [0.81, -1.66, 0.5],
    ];
    const crScaffold = k.tube(crPoints, 0.057, crMat, cas);
    const trScaffold = k.tube(trPoints, 0.057, trMat, cas);
    crScaffold.name = "crRNA repeat scaffold";
    trScaffold.name = "tracrRNA anti-repeat scaffold";
    for (let i = 0; i < repeatStem.length; i++) {
      const a = crScaffold.geometry.parameters.path.getPoint(
        (i + 2) / (crPoints.length - 1),
      );
      const z = trScaffold.geometry.parameters.path.getPoint(
        (7 - i) / (trPoints.length - 1),
      );
      k.segment(a.toArray(), z.toArray(), 0.017, bondMat, cas).name =
        `repeat anti-repeat contact ${i}`;
    }
    const n = 52,
      pitch = 0.155,
      first = 15,
      last = first + 19,
      pamStart = last + 1,
      cutIndex = last - 3,
      dnaX = (i) => -4.065 + i * pitch,
      localOpen = new Float64Array(n + 1),
      duplexPhase = new Float64Array(n + 1),
      baseTips = [
        Array.from({ length: n + 1 }, () => new THREE.Vector3()),
        Array.from({ length: n + 1 }, () => new THREE.Vector3()),
      ],
      rows = [[], []],
      points = [[], []],
      pairs = [],
      guide = [],
      hybrid = [];
    for (let s = 0; s < 2; s++) {
      for (let i = 0; i <= n; i++) points[s].push(new THREE.Vector3());
      for (let i = 0; i < n; i++)
        rows[s].push(
          k.segment([0, 0, 0], [0.1, 0, 0], 0.048, s ? targetMat : dnaMat),
        );
    }
    for (let i = 0; i <= n; i++)
      pairs.push(k.segment([0, 0, 0], [0.1, 0, 0], 0.021, bondMat));
    for (let i = 0; i < 20; i++) {
      guide.push(
        k.segment(
          [dnaX(first + i), -0.25, 0.38],
          [dnaX(first + Math.min(i + 1, 19)), -0.25, 0.38],
          0.052,
          crMat,
          cas,
        ),
      );
      hybrid.push(
        k.segment(
          [-1.69 + i * 0.155, -0.25, 0.38],
          [-1.69 + i * 0.155, -0.45, 0.2],
          0.017,
          bondMat,
        ),
      );
    }
    const pam = [];
    for (let i = 0; i < 3; i++)
      pam.push(
        k.mesh(new THREE.BoxGeometry(0.16, 0.18, 0.16), pamMat, [
          dnaX(pamStart + i),
          0.4,
          0.12,
        ]),
      );
    const labels = [
      k.label(
        [-0.7, 2.0, 0],
        "SpCas9 · 干扰阶段",
        "SpCas9 · interference stage",
        3,
      ),
      k.label([-4, -0.6, 0], "非靶链 5′ → 3′", "Non-target 5′ → 3′", 2),
      k.label([-4, -1.1, 0], "靶链 3′ → 5′", "Target 3′ → 5′", 2),
      k.label([2.1, 0.94, 0.2], "PAM · 5′-NGG-3′", "PAM · 5′-NGG-3′", 3),
      k.label([-1.1, -0.55, 0.6], "crRNA · 5′ → 3′", "crRNA · 5′ → 3′", 2),
      k.label([1.65, -2.45, 0.2], "tracrRNA", "tracrRNA", 2),
      k.label([0.65, -1.25, 0.4], "HNH · 靶链", "HNH · target", 2),
      k.label([0.75, 1.0, 0.4], "RuvC · 非靶链", "RuvC · non-target", 2),
      k.label(
        [-0.3, 1.45, 0.5],
        "置换的非靶链",
        "Displaced non-target strand",
        2,
      ),
    ];
    const delta = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    const connect = (m, a, z, r) => {
      delta.copy(z).sub(a);
      m.position.copy(a).add(z).multiplyScalar(0.5);
      m.scale.set(r, Math.max(delta.length(), 1e-6), r);
      m.quaternion.setFromUnitVectors(up, delta.normalize());
    };
    const phosphates = [dnaMat, targetMat].map((mat, i) =>
        detail.instances(
          detail.sphere,
          mat,
          n + 1,
          group,
          `DNA strand ${i} phosphates`,
        ),
      ),
      sugars = [otherBase, targetBase].map((mat, i) =>
        detail.instances(
          detail.sugar,
          mat,
          n + 1,
          group,
          `DNA strand ${i} deoxyribose`,
        ),
      ),
      nucleotideBases = [otherBase, targetBase].map((mat, i) =>
        detail.instances(
          detail.base,
          mat,
          n + 1,
          group,
          `DNA strand ${i} exposed bases`,
        ),
      );
    const guidePhosphate = detail.instances(
        detail.sphere,
        crMat,
        20,
        cas,
        "crRNA phosphate",
      ),
      guideSugar = detail.instances(
        detail.sugar,
        rnaBase,
        20,
        cas,
        "crRNA ribose",
      ),
      guideBase = detail.instances(
        detail.base,
        rnaBase,
        20,
        cas,
        "crRNA guide bases",
      );
    const da = new THREE.Vector3(),
      db = new THREE.Vector3();
    for (let i = 0; i < 20; i++) {
      da.set(dnaX(first + i), -0.25, 0.38);
      detail.bead(guidePhosphate, i, da, 0.057);
      da.x += 0;
      detail.bead(guideSugar, i, da, [0.047, 0.044, 0.042]);
      db.copy(da);
      db.y -= 0.12;
      detail.bar(guideBase, i, da, db, 0.07, 0.052);
    }
    guide.forEach((m, i) => {
      m.name = `Cas9 guide backbone ${i}`;
    });
    hybrid.forEach((m, i) => {
      m.name = `Cas9 RNA DNA pair ${i}`;
    });
    pairs.forEach((m, i) => {
      m.name = `Cas9 DNA pair ${i}`;
    });
    rows.forEach((row, strand) =>
      row.forEach((m, i) => {
        m.name = `Cas9 DNA backbone ${strand} ${i}`;
      }),
    );
    detail.finish(guidePhosphate, guideSugar, guideBase);
    for (const [index, scaffold] of [crScaffold, trScaffold].entries()) {
      const beads = detail.instances(
        detail.sugar,
        index ? trMat : crMat,
        34,
        cas,
        `${index ? "tracrRNA" : "crRNA repeat"} ribose backbone`,
      );
      for (let i = 0; i < 34; i++)
        detail.bead(
          beads,
          i,
          scaffold.geometry.parameters.path.getPoint(i / 33),
          0.062,
        );
      detail.finish(beads);
    }
    const update = (value, parameters = {}) => {
      const p = clamp(value),
        condition = ["noPam", "mismatch"].includes(parameters.target)
          ? parameters.target
          : "matched",
        hasPam = condition !== "noPam",
        matched = condition === "matched";
      const dock = ease(p, 0.05, 0.27),
        open = matched
          ? ease(p, 0.32, 0.61)
          : hasPam
            ? 0.18 * ease(p, 0.3, 0.42) * (1 - ease(p, 0.5, 0.65))
            : 0,
        cut = matched ? ease(p, 0.76, 0.86) : 0;
      cas.position.set(
        hasPam ? 0 : ease(p, 0.38, 0.8) * 0.55,
        (1 - dock) * 1.65 + (!hasPam ? ease(p, 0.38, 0.8) * 1.25 : 0),
        0,
      );
      for (let i = 0; i <= n; i++) {
        const guideIndex = i - first;
        localOpen[i] =
          i >= first && i <= last
            ? ease(open, (19 - guideIndex) / 20, (20 - guideIndex) / 20)
            : 0;
      }
      // Integrate the remaining twist rather than blending opposed Cartesian rails.
      // Every interval retains 0..0.44 rad of twist; opening never collapses radius.
      // Free flanks rotate continuously as the PAM-proximal region unwinds.
      const openPhase = Math.atan2(-0.08, 0.755) + 4 * Math.PI;
      duplexPhase[last] =
        last * 0.44 + (openPhase - last * 0.44) * localOpen[last];
      for (let i = last - 1; i >= 0; i--)
        duplexPhase[i] =
          duplexPhase[i + 1] -
          0.44 * (1 - (localOpen[i] + localOpen[i + 1]) / 2);
      for (let i = last + 1; i <= n; i++)
        duplexPhase[i] =
          duplexPhase[i - 1] +
          0.44 * (1 - (localOpen[i] + localOpen[i - 1]) / 2);
      for (let i = 0; i <= n; i++) {
        const local = localOpen[i],
          radius = 0.26 * (1 - local) + Math.hypot(0.755, 0.08) * local;
        for (let s = 0; s < 2; s++) {
          const sign = s ? -1 : 1;
          points[s][i].set(
            dnaX(i) + (i > cutIndex ? cut * 0.06 : -cut * 0.06),
            0.195 * local + sign * radius * Math.cos(duplexPhase[i]),
            0.3 * local + sign * radius * Math.sin(duplexPhase[i]),
          );
        }
      }
      rows.forEach((row, s) =>
        row.forEach((m, i) => {
          connect(m, points[s][i], points[s][i + 1], 0.048);
          m.visible = !(cut > 0 && i === cutIndex);
        }),
      );
      for (let strand = 0; strand < 2; strand++) {
        for (let i = 0; i <= n; i++) {
          da.copy(points[strand][i]);
          detail.bead(phosphates[strand], i, da, 0.059);
          detail.bead(sugars[strand], i, da, [0.049, 0.05, 0.045]);
          const duplexTip = da.clone().lerp(points[1 - strand][i], 0.3);
          const openTip = da
            .clone()
            .add(new THREE.Vector3(0, strand ? 0.12 : -0.12, 0));
          baseTips[strand][i].copy(duplexTip).lerp(openTip, localOpen[i]);
          detail.bar(
            nucleotideBases[strand],
            i,
            da,
            baseTips[strand][i],
            0.061,
            0.051,
          );
        }
        detail.finish(
          phosphates[strand],
          sugars[strand],
          nucleotideBases[strand],
        );
      }
      pairs.forEach((m, i) => {
        connect(m, baseTips[0][i], baseTips[1][i], 0.021);
        m.visible = localOpen[i] === 0;
      });
      guide.forEach((m, i) => {
        m.visible = i < 19;
      });
      hybrid.forEach((m, i) => {
        const dnaIndex = first + i;
        da.set(dnaX(dnaIndex), -0.37, 0.38).add(cas.position);
        connect(m, da, baseTips[1][dnaIndex], 0.017);
        m.visible = matched && localOpen[dnaIndex] === 1;
      });
      pam.forEach((m, i) => {
        m.material = hasPam ? pamMat : dnaMat;
        m.position.copy(points[0][pamStart + i]);
      });
      hnh.position.set(
        0.52 + open * 0.5,
        -0.69 + open * 0.16,
        0.0 + open * 0.22,
      );
      ruvc.position.set(
        0.65 + open * 0.4,
        0.68 + open * 0.1,
        -0.06 + open * 0.24,
      );
      labels[0].position[1] = 2 + cas.position.y;
      labels[4].position[1] = -0.65 + cas.position.y;
      labels[5].position[1] = -2.4 + cas.position.y;
      labels[3].text = hasPam
        ? b("PAM · 5′-NGG-3′", "PAM · 5′-NGG-3′")
        : b("无兼容 PAM", "No compatible PAM");
      labels[8].active = open > 0.4;
      group.userData = {
        structuralDetail:
          "REC1 REC2 REC3 NUC PAM HNH RuvC domains, bridge helix, sugar phosphate base detail",
        process: "crispr",
        organism: "Streptococcus pyogenes",
        type: "II-A",
        phase: "interference only",
        condition,
        pamRecognized: hasPam && p > 0.27,
        rLoop: open > 0.9,
        guideDirection: "crRNA antiparallel to target DNA",
        hnhCuts: "target strand",
        ruvcCuts: "non-target strand",
        doubleStrandBreak: cut > 0.2,
        cas9RetainsProducts: true,
      };
    };
    update(0);
    return {
      group,
      materials: detail.inventory(group),
      update,
      labels,
      camera: { position: [0, 2.0, 11], target: [0, 0.3, 0] },
    };
  },
};
