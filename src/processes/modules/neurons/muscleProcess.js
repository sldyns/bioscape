import { motorHead } from "./structural.js";
import { THREE, sceneKit, clamp, phase, bilingual as b } from "../../kit.js";
export default {
  id: "muscle",
  title: b("骨骼肌滑动肌丝", "Skeletal muscle sliding filaments"),
  intro: b(
    "哺乳动物骨骼肌纤维的肌节放大示意。Ca²⁺ 解除细肌丝的抑制，ATP 驱动横桥循环；粗、细肌丝自身不缩短。此例省略神经肌肉接头和膜兴奋。",
    "Magnified schematic of a mammalian skeletal muscle sarcomere. Ca²⁺ releases thin-filament inhibition and ATP drives cross-bridge cycling; neither filament itself shortens. Neuromuscular transmission and membrane excitation are omitted.",
  ),
  duration: 34,
  controls: [
    {
      id: "calcium",
      label: b("肌浆 Ca²⁺", "Sarcoplasmic Ca²⁺"),
      default: "released",
      options: [
        { value: "released", label: b("短暂释放", "Transient release") },
        { value: "low", label: b("保持低水平", "Remain low") },
      ],
    },
  ],
  stages: [
    [
      0,
      "静息肌节",
      "Resting sarcomere",
      "两端 Z 盘锚定细肌丝。中央双极粗肌丝保留无头区；原肌球蛋白阻挡肌球蛋白结合位点。",
      "Z discs anchor thin filaments at both ends. The bipolar thick filament has a central bare zone; tropomyosin blocks myosin-binding sites.",
    ],
    [
      0.15,
      "钙解除抑制",
      "Calcium releases inhibition",
      "肌浆网释放的 Ca²⁺ 结合肌钙蛋白 C，使原肌球蛋白移位。低钙条件下位点持续受阻。",
      "Ca²⁺ released from the sarcoplasmic reticulum binds troponin C and shifts tropomyosin. Binding sites remain blocked in the low-calcium condition.",
    ],
    [
      0.31,
      "横桥结合",
      "Cross-bridges attach",
      "已结合 ADP 与无机磷酸的肌球蛋白头接触暴露的肌动蛋白位点。图中同步头部用于解释，真实肌节中的头部并不同步。",
      "Myosin heads carrying ADP and inorganic phosphate contact exposed actin sites. Heads are synchronized for explanation; real sarcomeres cycle asynchronously.",
    ],
    [
      0.43,
      "动力冲程",
      "Power stroke",
      "强结合、磷酸释放与头部构象变化耦联，推动两侧细肌丝向肌节中央滑动；Z 盘距离减小。",
      "Strong binding, phosphate release and head conformational changes are coupled, sliding thin filaments toward the center and bringing Z discs closer.",
    ],
    [
      0.65,
      "ATP 解离并重置头部",
      "ATP detaches and resets heads",
      "新 ATP 结合使肌球蛋白与肌动蛋白解离；ATP 水解形成 ADP 与磷酸，使头部重新准备。动态标签区分 ADP＋Pi、ADP、无核苷酸与 ATP；低 Ca²⁺ 对照保持 ADP＋Pi 预备态。小标记表示状态，不是数量。",
      "New ATP binding detaches myosin from actin. ATP hydrolysis yields ADP and phosphate and reprimes the head. The changing label distinguishes ADP + Pi, ADP, nucleotide-free and ATP. Low Ca²⁺ retains the ADP + Pi primed state. Markers indicate states, not quantities.",
    ],
    [
      0.85,
      "停止主动缩短",
      "Active shortening stops",
      "Ca²⁺ 经肌浆网钙泵回收，位点重新受阻。肌节保留已缩短长度；恢复长度需要外力或弹性回弹，此处未展示。",
      "Sarcoplasmic-reticulum pumps retrieve Ca²⁺ and binding sites become blocked again. The shortened length is retained; external forces or elastic recoil restore length and are not shown.",
    ],
  ].map(([at, z, e, dz, de]) => ({
    at,
    title: b(z, e),
    description: b(dz, de),
  })),
  sources: [
    {
      title: "OpenStax — Muscle Fiber Contraction and Relaxation",
      url: "https://openstax.org/books/anatomy-and-physiology-2e/pages/10-3-muscle-fiber-contraction-and-relaxation",
    },
    {
      title: "NCBI Bookshelf — Molecular Motors",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26888/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k,
      actin = k.material("#799f97"),
      myosin = k.material("#aa8693"),
      tropo = k.material("#bba272"),
      tn = k.material("#b5a5c6"),
      ca = k.material("#9479b2"),
      nucleotide = k.material("#d0ae62");
    const box = new THREE.BoxGeometry(1, 1, 1),
      thin = [],
      heads = [],
      tropos = [],
      troponins = [],
      ions = [];
    const thick = k.segment([-2.25, 0, 0], [2.25, 0, 0], 0.18, myosin);
    for (const strand of [0, Math.PI]) {
      const pts = [];
      for (let j = 0; j <= 140; j++) {
        const x = -2.25 + (4.5 * j) / 140,
          a = x * 14 + strand;
        pts.push([x, 0.15 * Math.cos(a), 0.15 * Math.sin(a)]);
      }
      k.tube(pts, 0.031, k.material("#bd9cac"), group, 160);
    }
    const mline = k.mesh(box, k.material("#a5aaa7"), [0, 0, -0.25]);
    mline.scale.set(0.07, 2.2, 0.16);
    for (const side of [-1, 1]) {
      const sideGroup = new THREE.Group();
      group.add(sideGroup);
      thin.push({ side, group: sideGroup });
      const z = k.mesh(
        box,
        k.material("#8e9792"),
        [side * 3.7, 0, 0],
        sideGroup,
      );
      z.scale.set(0.07, 2.45, 0.15);
      for (let j = 0; j < 8; j++)
        k.segment(
          [side * 3.68, -1.08 + j * 0.27, -0.2],
          [side * 3.68, -0.91 + j * 0.27, 0.2],
          0.028,
          k.material("#aab3a5"),
          sideGroup,
        );
      for (const y of [-0.79, 0.79]) {
        const first = side * 3.65,
          last = side * 0.88;
        // Two staggered actin protofilaments, each monomer drawn with a cleft.
        const monomers = new THREE.InstancedMesh(k.sphere, actin, 36 * 2 * 2);
        const domains = new THREE.InstancedMesh(
          k.sphere,
          k.material("#95b6a7"),
          36 * 2 * 2,
        );
        sideGroup.add(monomers, domains);
        const temp = new THREE.Object3D();
        let idx = 0;
        for (let j = 0; j < 36; j++)
          for (let strand = 0; strand < 2; strand++) {
            const a = j * 0.56 + strand * Math.PI,
              x = first + ((last - first) * (j + strand * 0.35)) / 35.35;
            for (const lobe of [-1, 1]) {
              temp.position.set(
                x + lobe * 0.024,
                y + 0.105 * Math.cos(a),
                0.105 * Math.sin(a),
              );
              temp.rotation.set(a, 0, 0.16 * lobe);
              temp.scale.set(0.05, 0.058, 0.045);
              temp.updateMatrix();
              monomers.setMatrixAt(idx, temp.matrix);
              temp.position.set(
                x + lobe * 0.022,
                y + 0.105 * Math.cos(a) + 0.046 * Math.cos(a + 0.5),
                0.105 * Math.sin(a) + 0.046 * Math.sin(a + 0.5),
              );
              temp.scale.set(0.035, 0.033, 0.035);
              temp.updateMatrix();
              domains.setMatrixAt(idx++, temp.matrix);
            }
          }
        monomers.instanceMatrix.needsUpdate =
          domains.instanceMatrix.needsUpdate = true;
        monomers.computeBoundingSphere();
        domains.computeBoundingSphere();
        const strand = new THREE.Group();
        strand.position.y = y;
        sideGroup.add(strand);
        for (const offset of [0, Math.PI]) {
          const points = [];
          for (let j = 0; j <= 120; j++) {
            const t = j / 120,
              a = t * 35 * 0.56 + offset;
            points.push([
              first + (last - first) * t,
              0.148 * Math.cos(a),
              0.148 * Math.sin(a),
            ]);
          }
          k.tube(points, 0.019, tropo, strand, 120);
        }
        tropos.push({ object: strand, y });
        for (const fraction of [0.25, 0.68]) {
          const x = first + (last - first) * fraction;
          const t = new THREE.Group();
          t.position.set(x, y, 0.19);
          sideGroup.add(t);
          // TnC two-lobe calcium pocket, inhibitory TnI arm and TnT anchor.
          k.ball([-0.055, 0, 0.02], [0.055, 0.07, 0.045], tn, t);
          k.ball([0.055, 0, 0.02], [0.055, 0.07, 0.045], tn, t);
          k.tube(
            [
              [-0.05, -0.03, 0],
              [0, -0.065, 0.03],
              [0.06, -0.02, 0.01],
            ],
            0.018,
            k.material("#9b8da9"),
            t,
            24,
          );
          k.segment(
            [-0.12, 0.035, -0.025],
            [0.13, 0.035, -0.025],
            0.021,
            k.material("#bdaec6"),
            t,
          );

          troponins.push({ object: t, y });
          const ion = k.ball(
            [x, y + Math.sign(y) * 0.6, 0.25],
            0.075,
            ca,
            sideGroup,
          );
          ions.push({ object: ion, y });
        }
        for (const anchor of [1.1, 1.62, 2.03]) {
          const pivot = new THREE.Group();
          pivot.position.set(side * anchor, 0, 0.12);
          group.add(pivot);
          const arm = k.segment(
            [0, 0, 0],
            [0, Math.sign(y) * 0.6, 0],
            0.065,
            myosin,
            pivot,
          );
          const head = motorHead(k, pivot, Math.sign(y), myosin);
          const atp = new THREE.Group();
          atp.name = "myosin nucleotide-state markers";
          atp.position.set(0.14, Math.sign(y) * 0.6, 0.16);
          pivot.add(atp);
          const ATP = k.ball([0, 0, 0], 0.07, nucleotide, atp);
          ATP.name = "ATP bound marker";
          const ADP = k.ball([-0.035, 0, 0], 0.052, k.material("#b7a365"), atp);
          ADP.name = "ADP bound marker";
          const Pi = k.ball([0.058, 0, 0], 0.031, k.material("#e0ceb0"), atp);
          Pi.name = "Pi bound marker";
          heads.push({
            pivot,
            arm,
            head,
            atp,
            ATP,
            ADP,
            Pi,
            side,
            sign: Math.sign(y),
          });
        }
      }
    }
    const sr = k.segment(
      [-2.6, 1.7, -0.1],
      [2.6, 1.7, -0.1],
      0.12,
      k.material("#b1b8c2"),
    );
    const labels = [
      k.label(
        [0, 2.33, 0],
        "骨骼肌 · 一个肌节",
        "Skeletal muscle · one sarcomere",
        2,
      ),
      k.label(
        [0, 1.92, 0],
        "肌浆网 Ca²⁺ 储库（示意）",
        "Sarcoplasmic reticulum · Ca²⁺ store",
        1,
      ),
      k.label([-3.75, -1.55, 0], "Z 盘", "Z disc", 1),
      k.label([3.75, -1.55, 0], "Z 盘", "Z disc", 1),
      k.label(
        [0, -1.65, 0.1],
        "肌丝长度不变 · 重叠增加",
        "Constant filament lengths · increasing overlap",
        2,
      ),
      k.label(
        [0, 0.33, 0.45],
        "双极肌球蛋白粗肌丝",
        "Bipolar myosin thick filament",
        1,
      ),
      k.label([-2.4, -1.13, 0.3], "肌动蛋白细肌丝", "Actin thin filament", 1),
      k.label([2.25, 1.16, 0.35], "Ca²⁺ → 肌钙蛋白", "Ca²⁺ → troponin", 1),
      k.label([1.6, -0.4, 0.45], "ATP / ADP + Pi", "ATP / ADP + Pi", 1),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        allowed = parameters.calcium !== "low";
      const active = allowed
        ? phase(p, 0.15, 0.27) * (1 - phase(p, 0.83, 0.94))
        : 0;
      const stroke = allowed ? phase(p, 0.43, 0.61) : 0,
        shift = 0.58 * stroke;
      const bound = allowed && p >= 0.31 && p < 0.65;
      const reset = phase(p, 0.72, 0.8);
      const nucleotideState =
        !allowed || p < 0.43 || p >= 0.72
          ? "ADP + Pi"
          : p < 0.57
            ? "ADP"
            : p < 0.65
              ? "empty"
              : "ATP";
      thin.forEach((t) => (t.group.position.x = -t.side * shift));
      tropos.forEach((t) => {
        t.object.rotation.x = 0.46 * active;
      });
      troponins.forEach((t) => (t.object.rotation.y = 0.25 * active));
      ions.forEach((t) => {
        t.object.visible = allowed && p >= 0.15 && p < 0.94;
        t.object.position.y = t.y + Math.sign(t.y) * (0.6 - 0.48 * active);
      });
      heads.forEach((h) => {
        const lean = allowed ? -0.45 + 0.82 * stroke - 0.82 * reset : -0.45;
        h.pivot.rotation.z = h.side * h.sign * lean;
        const reach = bound ? 1.08 : 0.77;
        h.pivot.scale.y = reach;
        h.atp.visible = true;
        h.ATP.visible = nucleotideState === "ATP";
        h.ADP.visible =
          nucleotideState === "ADP" || nucleotideState === "ADP + Pi";
        h.Pi.visible = nucleotideState === "ADP + Pi";
      });
      labels[8].text.zh =
        "核苷酸状态：" +
        (nucleotideState === "empty" ? "无核苷酸" : nucleotideState);
      labels[8].text.en =
        "Nucleotide state: " +
        (nucleotideState === "empty" ? "nucleotide-free" : nucleotideState);
      labels[2].position[0] = -3.75 + shift;
      labels[3].position[0] = 3.75 - shift;
      group.userData = {
        process: "muscle",
        specimen: "mammalian skeletal muscle sarcomere",
        calcium: allowed ? "transient release" : "low",
        bindingSitesExposed: active > 0.5,
        crossBridgesAttached: bound,
        sarcomereLength: 7.4 - 2 * shift,
        thinFilamentLength: 2.77,
        thickFilamentLength: 4.5,
        filamentLengthsConstant: true,
        cycle: !allowed
          ? "inactive"
          : p < 0.31
            ? "primed"
            : p < 0.43
              ? "binding"
              : p < 0.65
                ? "power stroke"
                : p < 0.8
                  ? "ATP detachment and hydrolysis"
                  : "inactive",
        ATPAvailable: true,
        nucleotideState,
      };
    }
    update(0);
    return {
      group,
      update,
      camera: { position: [0, 1, 10.8], target: [0, 0.15, 0] },
      labels,
    };
  },
};
