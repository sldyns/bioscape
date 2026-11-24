import { motorHead } from "./structural.js";
import { anchorObject, anchorInstance } from "./labelAnchors.js";
import {
  THREE,
  sceneKit,
  clamp,
  phase,
  ease,
  bilingual as b,
} from "../../kit.js";

// Select a material contact on the rendered helix, approached from the thick filament.
function actinContact(monomers, domains, x, y) {
  const sign = Math.sign(y);
  const target = new THREE.Vector3(x, y - sign * 0.18, 0.07);
  const center = new THREE.Vector3(),
    origin = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  let nearest = Infinity;
  for (let i = 0; i < monomers.count; i++) {
    monomers.getMatrixAt(i, matrix);
    center.setFromMatrixPosition(matrix);
    const distance = center.distanceToSquared(target);
    if (distance < nearest) {
      nearest = distance;
      origin.set(center.x, 0, center.z);
    }
  }
  const ray = new THREE.Raycaster(origin, new THREE.Vector3(0, sign, 0));
  return ray.intersectObjects([monomers, domains], false)[0].point;
}

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
      "携带 ADP 和无机磷酸的肌球蛋白头陆续接触暴露的肌动蛋白位点。为了看清一次冲程，图中的头部随后一起摆动。真实肌节中，各头部的循环彼此错开。",
      "Myosin heads carrying ADP and inorganic phosphate dock on exposed actin sites. The drawing groups their next stroke so it can be followed. Individual heads cycle asynchronously in muscle.",
    ],
    [
      0.43,
      "动力冲程",
      "Power stroke",
      "肌球蛋白头抓住同一肌动蛋白位点，杠杆臂摆动，两侧细肌丝向 M 线滑动，Z 盘靠近。磷酸释放与动力冲程耦联。",
      "Each motor stays on the same actin site as its lever arm swings. Both thin filaments slide toward the M line, bringing the Z discs closer. Phosphate release is coupled to the working stroke.",
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
      title:
        "Wang et al. (2021) — The molecular basis for sarcomere organization in vertebrate skeletal muscle",
      url: "https://pubmed.ncbi.nlm.nih.gov/33765442/",
    },
    {
      title:
        "Reconditi et al. (2004) — The myosin motor in muscle generates a smaller and slower working stroke at higher load",
      url: "https://pubmed.ncbi.nlm.nih.gov/15058307/",
    },
    {
      title:
        "Wakayama et al. (2004) — Structural transients of contractile proteins upon sudden ATP liberation in skeletal muscle fibers",
      url: "https://pubmed.ncbi.nlm.nih.gov/15240477/",
    },
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
    thick.name = "bipolar thick filament";
    let labelledActin;
    for (const strand of [0, Math.PI]) {
      const pts = [];
      for (let j = 0; j <= 140; j++) {
        const x = -2.25 + (4.5 * j) / 140,
          a = x * 14 + strand;
        pts.push([x, 0.177 * Math.cos(a), 0.177 * Math.sin(a)]);
      }
      k.tube(pts, 0.024, k.material("#bd9cac"), group, 160);
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
      z.name = side < 0 ? "left Z disc" : "right Z disc";
      thin.at(-1).zDisc = z;
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
        monomers.name = `actin thin filament ${side}:${y}`;
        if (side === -1 && y < 0) labelledActin = monomers;
        const domains = new THREE.InstancedMesh(
          k.sphere,
          k.material("#95b6a7"),
          36 * 2 * 2,
        );
        domains.name = `actin outer domains ${side}:${y}`;
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
          ion.name = `muscle calcium marker ${ions.length}`;
          ions.push({ object: ion, y });
        }
        for (const [anchor, dockStart, dockEnd] of [
          [1.1, 0.31, 0.37],
          [1.62, 0.31, 0.42],
          [2.03, 0.27, 0.31],
        ]) {
          const sign = Math.sign(y);
          const pivot = new THREE.Group();
          pivot.name = `myosin cross-bridge ${side}:${y}:${anchor}`;
          pivot.position.x = side * anchor;
          group.add(pivot);
          const base = new THREE.Vector3(0, sign * 0.08, -0.03);
          const stalk = k.segment(
            base.toArray(),
            [0, sign * 0.2, 0],
            0.039,
            myosin,
            pivot,
          );
          stalk.name = "myosin S2 tether";
          const { head, lever, shaft } = motorHead(k, pivot, sign, myosin);
          const site = actinContact(
            monomers,
            domains,
            side * (anchor + 0.29),
            y,
          );
          site.sub(pivot.position);
          const atp = new THREE.Group();
          atp.name = "myosin nucleotide-state markers";
          atp.position.set(0.025, -sign * 0.17, 0.145);
          head.add(atp);
          const ATP = k.ball([0, 0, 0], 0.07, nucleotide, atp);
          ATP.name = "ATP bound marker";
          const ADP = k.ball([-0.035, 0, 0], 0.052, k.material("#b7a365"), atp);
          ADP.name = "ADP bound marker";
          const Pi = k.ball([0.058, 0, 0], 0.031, k.material("#e0ceb0"), atp);
          Pi.name = "Pi bound marker";
          heads.push({
            base,
            stalk,
            head,
            lever,
            shaft,
            site,
            dockStart,
            dockEnd,
            inward: new THREE.Vector3(0, -sign, 0),
            ATP,
            ADP,
            Pi,
            side,
            sign,
          });
        }
      }
    }
    // A bounded cutaway through a connected SR cisterna exposes the lumen.
    // Its spacing and membrane thickness are illustrative, not ultrastructure.
    const sr = new THREE.Group();
    sr.position.set(0, 1.7, -0.1);
    sr.name = "sarcoplasmic reticulum calcium store";
    group.add(sr);
    const srOuter = k.material("#a7b5bc"),
      srInner = k.material("#c9d2cf");
    srOuter.side = srInner.side = THREE.DoubleSide;
    const cutStart = 0.9,
      cutArc = Math.PI * 2 - 1.8;
    function reservoirWall(radius, length, material, name) {
      const wall = k.mesh(
        new THREE.CylinderGeometry(
          radius,
          radius,
          length,
          24,
          1,
          true,
          cutStart,
          cutArc,
        ),
        material,
        [0, 0, 0],
        sr,
      );
      wall.rotation.z = Math.PI / 2;
      wall.name = name;
      return wall;
    }
    const srWall = reservoirWall(
      0.19,
      5.2,
      srOuter,
      "SR cutaway outer membrane",
    );
    reservoirWall(0.15, 5.2, srInner, "SR exposed luminal membrane");
    // Rim strips join the inner and outer surfaces along both open cut edges.
    for (const angle of [cutStart, cutStart + cutArc]) {
      const y = 0.17 * Math.sin(angle),
        z = 0.17 * Math.cos(angle);
      const rim = k.segment([-2.6, y, z], [2.6, y, z], 0.02, srInner, sr);
      rim.name = "SR longitudinal cut edge";
    }
    const endGeometry = new THREE.RingGeometry(
      0.15,
      0.19,
      24,
      1,
      Math.PI - cutStart - cutArc,
      cutArc,
    );
    for (const x of [-2.6, 2.6]) {
      const rim = k.mesh(endGeometry, srInner, [x, 0, 0], sr);
      rim.rotation.y = Math.PI / 2;
      rim.name = "SR open lumen rim";
    }
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
      k.label([-1.62, 0.6, 0.1], "横桥结合", "Cross-bridge attachment", 2),
    ];
    const observedBridge = heads[4];
    const lightChain = observedBridge.lever.getObjectByName(
      "essential light chain",
    );
    const leverOffset = new THREE.Vector3(),
      direction = new THREE.Vector3();
    const zAxis = new THREE.Vector3(0, 0, 1),
      up = new THREE.Vector3(0, 1, 0);
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        allowed = parameters.calcium !== "low";
      const active = allowed
        ? phase(p, 0.15, 0.27) * (1 - phase(p, 0.83, 0.94))
        : 0;
      const stroke = allowed ? phase(p, 0.43, 0.61) : 0,
        shift = 0.58 * stroke;
      const bound = allowed && p >= 0.31 && p < 0.65;
      const release = ease(p, 0.65, 0.675);
      const travel = stroke - (allowed ? ease(p, 0.72, 0.8) : 0);
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
        const contact = allowed
          ? ease(p, h.dockStart, h.dockEnd) * (1 - release)
          : 0;
        const clearance = 1 - contact;
        // While bound, the motor and its original actin subunit move together.
        h.head.position.copy(h.site);
        h.head.position.x -= h.side * 0.58 * travel;
        h.head.position.y -= h.sign * 0.28 * clearance;
        h.head.rotation.z =
          h.side * h.sign * 0.46 * (1 - 2 * travel) * clearance;

        // A rigid light-chain lever swings about the distal converter. Its
        // proximal end stays linked to the backbone by the flexible S2 tether.
        const axial = h.side * 0.29 * (2 * travel - 1);
        const depth = -0.31 * clearance;
        const length = h.shaft.scale.y;
        leverOffset.set(
          axial,
          -h.sign * Math.sqrt(length * length - axial * axial - depth * depth),
          depth,
        );
        direction
          .copy(leverOffset)
          .applyAxisAngle(zAxis, -h.head.rotation.z)
          .normalize();
        h.lever.quaternion.setFromUnitVectors(h.inward, direction);
        direction
          .copy(h.lever.position)
          .applyQuaternion(h.head.quaternion)
          .add(h.head.position)
          .add(leverOffset)
          .sub(h.base);
        h.stalk.position.copy(h.base).addScaledVector(direction, 0.5);
        h.stalk.scale.y = direction.length();
        h.stalk.quaternion.setFromUnitVectors(up, direction.normalize());
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
      anchorObject(labels[0], mline, 0, 0.45, 0.5);
      // The SR group is not a unit-radius primitive. Follow the actual open
      // wall edge halfway along its axis, including mesh/ancestor transforms.
      const srVertices = srWall.geometry.attributes.position;
      anchorObject(
        labels[1],
        srWall,
        srVertices.getX(0),
        0,
        srVertices.getZ(0),
      );
      const bridgeLabel = labels[9];
      bridgeLabel.active = !allowed || (p >= 0.31 && p < 0.8);
      if (!allowed) {
        bridgeLabel.text.zh = "低 Ca²⁺ · 横桥保持分离";
        bridgeLabel.text.en = "Low Ca²⁺ · head remains detached";
        anchorObject(bridgeLabel, observedBridge.head.children[2]);
      } else if (p < 0.43) {
        bridgeLabel.text.zh = "肌球蛋白头接触肌动蛋白";
        bridgeLabel.text.en = "Myosin docks on actin";
        anchorObject(
          bridgeLabel,
          observedBridge.head.children[2],
          0,
          observedBridge.sign,
          0,
        );
      } else if (p < 0.65) {
        bridgeLabel.text.zh = "已结合横桥 · 杠杆臂摆动";
        bridgeLabel.text.en = "Attached cross-bridge · lever swing";
        anchorObject(bridgeLabel, lightChain);
      } else if (p < 0.72) {
        bridgeLabel.text.zh = "ATP 结合 · 头部脱离";
        bridgeLabel.text.en = "ATP binds · head detaches";
        anchorObject(bridgeLabel, observedBridge.ATP);
      } else {
        bridgeLabel.text.zh = "ATP 水解后 · 杠杆臂复位";
        bridgeLabel.text.en = "After hydrolysis · lever resets";
        anchorObject(bridgeLabel, lightChain);
      }
      anchorObject(labels[2], thin[0].zDisc, 0, -0.45, 0.5);
      anchorObject(labels[3], thin[1].zDisc, 0, -0.45, 0.5);
      anchorInstance(labels[4], labelledActin, labelledActin.count - 1);
      labels[4].text.zh = !allowed
        ? "肌丝长度不变 · 未缩短"
        : stroke === 0
          ? "肌丝长度不变"
          : stroke < 1
            ? "肌丝长度不变 · 重叠增加"
            : "肌丝长度不变 · 保留增加的重叠";
      labels[4].text.en = !allowed
        ? "Constant filament lengths · no shortening"
        : stroke === 0
          ? "Constant filament lengths"
          : stroke < 1
            ? "Constant filament lengths · increasing overlap"
            : "Constant filament lengths · increased overlap retained";
      anchorObject(labels[5], thick, 0, 0, 1);
      anchorInstance(labels[6], labelledActin, 40);
      labels[7].active = ions[6].object.visible;
      labels[7].text.zh = p < 0.83 ? "Ca²⁺ → 肌钙蛋白" : "Ca²⁺ 与肌钙蛋白解离";
      labels[7].text.en = p < 0.83 ? "Ca²⁺ → troponin" : "Ca²⁺ leaves troponin";
      anchorObject(labels[7], ions[6].object);
      const labelledHead = heads[7];
      anchorObject(
        labels[8],
        labelledHead.ATP.visible
          ? labelledHead.ATP
          : labelledHead.ADP.visible
            ? labelledHead.ADP
            : labelledHead.head.children[2],
      );
      Object.assign(group.userData, {
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
      });
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
