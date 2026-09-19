import {
  proteinDomain,
  helix,
  molecularInventory,
} from "./refinementGeometry.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
export default {
  id: "motorTransport",
  title: b(
    "马达运输：沿微管运送货物",
    "Motor transport: cargo on microtubules",
  ),
  duration: 32,
  intro: b(
    "动物细胞胞质中的极性微管与膜性货物示意。选择常规 kinesin-1 或活化的胞质 dynein–dynactin–适配体复合物；这里展示方向与构象耦联，不表示真实速度、步长或力。",
    "A polar microtubule and membrane cargo in animal cytosol. Select conventional kinesin-1 or an activated cytoplasmic dynein–dynactin–adaptor complex. Direction and conformational coupling are illustrated, not measured speed, step size or force.",
  ),
  controls: [
    {
      id: "motor",
      label: b("运输马达", "Transport motor"),
      default: "kinesin",
      options: [
        {
          value: "kinesin",
          label: b("Kinesin-1 → 正端", "Kinesin-1 → plus end"),
        },
        {
          value: "dynein",
          label: b("胞质 Dynein → 负端", "Cytoplasmic dynein → minus end"),
        },
      ],
    },
    {
      id: "atp",
      label: b("ATP 条件", "ATP condition"),
      default: "available",
      options: [
        { value: "available", label: b("可用 ATP", "ATP available") },
        { value: "depleted", label: b("缺少可用 ATP", "ATP unavailable") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("有极性的轨道", "A polar track"),
      description: b(
        "α/β 微管蛋白二聚体组成中空微管。图中左为负端、右为正端；这两个名称表示结构极性，不是电荷。",
        "α/β-tubulin dimers form a hollow microtubule. The minus end is at left and the plus end at right; these names indicate structural polarity, not electric charge.",
      ),
    },
    {
      at: 0.15,
      title: b("连接膜性货物", "Attach membrane cargo"),
      description: b(
        "货物通过适配体连接马达。kinesin-1 的双头与长柄不同于 dynein 的大型 AAA+ 马达环和微管结合柄；动物胞质 dynein 的持续运输通常需 dynactin 与活化适配体。",
        "Cargo connects through adaptors. Kinesin-1 has two heads and an extended stalk; dynein has large AAA+ motor rings and microtubule-binding stalks. Processive animal cytoplasmic dynein generally requires dynactin and an activating adaptor.",
      ),
    },
    {
      at: 0.3,
      title: b("ATP 循环改变构象", "ATP cycling changes conformation"),
      description: b(
        "核苷酸状态耦联马达与微管的亲和力及构象变化。kinesin-1 的颈连接区和 dynein 的连接结构工作方式不同；此图只示意其机械耦联。",
        "Nucleotide state couples microtubule affinity to conformational change. Kinesin-1 neck linkers and dynein linkers work differently; their mechanical coupling is represented schematically.",
      ),
    },
    {
      at: 0.48,
      title: b("有偏向的重复步进", "Repeated directional steps"),
      description: b(
        "kinesin-1 双头交替向正端前进；胞质 dynein 的净运动朝负端，此处示意不同步长、同一头连续迈步与一次后退，净运动仍朝负端。这是一段代表性轨迹，不表示测量得到的步进概率。",
        "Kinesin-1 alternates its heads toward the plus end. Dynein shows variable advances, repeated steps by one head and a backward step while moving net toward the minus end. This illustrative run does not encode measured step probabilities.",
      ),
    },
    {
      at: 0.7,
      title: b("货物随马达平移", "Cargo follows the motor"),
      description: b(
        "柔性连接将马达运动传递给货物，而微管轨道保持不动。此处正端向右；实际细胞中的空间方向由局部微管排列决定。",
        "Flexible connections transmit motor movement to cargo while the track stays fixed. The plus end points right here; spatial direction in a cell depends on local microtubule organization.",
      ),
    },
    {
      at: 0.9,
      title: b("方向与能量条件", "Direction and energy conditions"),
      description: b(
        "有 ATP 时所选马达完成一段运输；缺少 ATP 时本模型停在起始位置。不是所有 kinesin 都朝正端，也并非所有细胞的微管都以同一方向排列。",
        "With ATP the selected motor completes a transport run; without ATP this model remains at its starting position. Not all kinesins are plus-end-directed, and microtubules do not share one spatial orientation in every cell.",
      ),
    },
  ],
  sources: [
    {
      title: "The Cell: Microtubule Motors and Movements",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9833/",
    },
    {
      title: "Molecular Biology of the Cell: Molecular Motors",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26888/",
    },
    {
      title: "How Dynein Moves Along Microtubules",
      url: "https://pubmed.ncbi.nlm.nih.gov/26678005/",
    },
    {
      title:
        "Elshenawy et al. (2019): Cargo adaptors regulate stepping and force generation of mammalian dynein–dynactin",
      url: "https://www.nature.com/articles/s41589-019-0352-0",
    },
    {
      title: "Kinesin walks hand-over-hand",
      url: "https://pubmed.ncbi.nlm.nih.gov/14684828/",
    },
  ],
  create({ rootId = "cell" } = {}) {
    const k = sceneKit(),
      { group } = k,
      teal = k.material("#7daba3"),
      blue = k.material("#7596aa"),
      gold = k.material("#bb9965"),
      violet = k.material("#9684ab"),
      pale = k.material("#cbbbd4"),
      mem = k.material("#a9c3b0", { side: THREE.DoubleSide });
    const tubulinGeometry = new THREE.SphereGeometry(1, 24, 16);
    const tv = tubulinGeometry.attributes.position;
    for (let i = 0; i < tv.count; i++) {
      const x = tv.getX(i),
        y = tv.getY(i),
        z = tv.getZ(i),
        neck = 1 - 0.18 * Math.exp(-x * x * 18);
      tv.setXYZ(
        i,
        x * 1.06,
        y * neck,
        z * (1 - 0.12 * Math.exp(-((x - 0.3) ** 2) * 12)),
      );
    }
    tubulinGeometry.computeVertexNormals();
    const tubA = new THREE.InstancedMesh(tubulinGeometry, teal, 13 * 14),
      tubB = new THREE.InstancedMesh(tubulinGeometry, blue, 13 * 14),
      obj = new THREE.Object3D();
    let j = 0;
    for (let row = 0; row < 13; row++)
      for (let col = 0; col < 14; col++) {
        const a = (row / 13) * Math.PI * 2;
        obj.scale.set(0.135, 0.135, 0.135);
        obj.position.set(
          -3.64 + col * 0.52,
          -1.05 + Math.cos(a) * 0.51,
          Math.sin(a) * 0.51,
        );
        obj.updateMatrix();
        tubA.setMatrixAt(j, obj.matrix);
        obj.position.x += 0.26;
        obj.updateMatrix();
        tubB.setMatrixAt(j++, obj.matrix);
      }
    tubA.instanceMatrix.needsUpdate = true;
    tubB.instanceMatrix.needsUpdate = true;
    tubA.computeBoundingSphere();
    tubB.computeBoundingSphere();
    group.add(tubA, tubB);
    const kin = new THREE.Group(),
      dyn = new THREE.Group(),
      cargo = new THREE.Group();
    group.add(kin, dyn, cargo);
    kin.name = "kinesin";
    dyn.name = "dynein";
    cargo.name = "motor-cargo";
    // A vesicle cutaway has an opaque bilayer rim and a visible lumen.
    const vesicle = k.mesh(
      new THREE.SphereGeometry(0.64, 40, 28, 0.65, Math.PI * 2 - 1.3),
      mem,
      [0, 2, 0],
      cargo,
    );
    const lining = k.mesh(
      new THREE.SphereGeometry(0.595, 40, 28, 0.65, Math.PI * 2 - 1.3),
      k.material("#d4dfcd", { side: THREE.DoubleSide }),
      [0, 2, 0],
      cargo,
    );
    for (const a of [0.65, Math.PI * 2 - 0.65]) {
      const pts = [];
      for (let i = 0; i <= 36; i++) {
        const t = (i / 36) * Math.PI;
        pts.push([
          -0.62 * Math.cos(a) * Math.sin(t),
          2 + 0.62 * Math.cos(t),
          0.62 * Math.sin(a) * Math.sin(t),
        ]);
      }
      k.tube(pts, 0.026, gold, cargo, 64);
    }
    proteinDomain(
      k,
      cargo,
      [0.06, 1.97, -0.15],
      [0.3, 0.25, 0.26],
      k.material("#c4b69b"),
    );
    k.segment([0, 1.35, 0], [0, 1.14, 0], 0.09, gold, cargo);
    const kh = [];
    for (let i = 0; i < 2; i++) {
      const head = new THREE.Group();
      kin.add(head);
      kh.push(head);
      head.name = `kinesin-head-${i}`;
      proteinDomain(
        k,
        head,
        [0, 0, 0],
        [0.25, 0.18, 0.19],
        i ? pale : violet,
        i,
      );
      helix(
        k,
        head,
        [-0.13, 0.055, 0.16],
        [0.13, 0.07, 0.16],
        0.027,
        3,
        i ? violet : pale,
        0.019,
      );
      k.tube(
        [
          [-0.09, 0.15, 0.07],
          [0, 0.08, 0.16],
          [0.13, 0.13, 0.08],
        ],
        0.023,
        gold,
        head,
        28,
      );
      k.segment([-0.12, -0.1, 0], [0.13, -0.1, 0], 0.04, violet, head);
    }
    const kl = [
      k.segment([0, 0, 0], [0, 1, 0], 0.06, violet, kin),
      k.segment([0, 0, 0], [0, 1, 0], 0.06, pale, kin),
    ];
    for (let strand = 0; strand < 2; strand++) {
      const points = Array.from({ length: 81 }, (_, i) => {
        const t = i / 80,
          a = t * Math.PI * 8 + strand * Math.PI;
        return [Math.cos(a) * 0.065, 0.4 + t * 0.74, Math.sin(a) * 0.065];
      });
      k.tube(points, 0.035, strand ? pale : violet, kin, 120);
    }
    const dh = [],
      ds = [],
      dt = [];
    for (let i = 0; i < 2; i++) {
      const r = new THREE.Group();
      dyn.add(r);
      dh.push(r);
      for (let sub = 0; sub < 6; sub++) {
        const angle = (sub * Math.PI) / 3;
        const domain = proteinDomain(
          k,
          r,
          [Math.cos(angle) * 0.26, Math.sin(angle) * 0.26, 0],
          [0.135, 0.105, 0.105],
          sub === 0 ? gold : i ? pale : violet,
          sub,
        );
        domain.rotation.z = angle;
      }
      k.tube(
        [
          [-0.22, -0.13, 0.12],
          [-0.1, 0.11, 0.14],
          [0.18, 0.18, 0.12],
        ],
        0.045,
        pale,
        r,
        36,
      );
      ds.push(k.segment([0, 0, 0], [0, 1, 0], 0.044, violet, dyn));
      ds[i].name = `dynein-stalk-${i}`;
      dt.push(k.segment([0, 0, 0], [0, 1, 0], 0.072, pale, dyn));
    }
    k.segment([-0.58, 1.16, 0], [0.58, 1.16, 0], 0.065, teal, dyn);
    for (let i = 0; i < 7; i++)
      proteinDomain(
        k,
        dyn,
        [-0.5 + i * 0.16, 1.16, 0],
        [0.105, 0.085, 0.11],
        i % 2 ? teal : blue,
        i,
      );
    helix(k, dyn, [-0.5, 1.27, 0.06], [0.52, 1.27, 0.06], 0.04, 5, gold, 0.023);
    const lumen = k.mesh(
      new THREE.CylinderGeometry(0.365, 0.365, 7.02, 40, 1, true),
      k.material("#5d827d", { side: THREE.DoubleSide }),
      [-0.18, -1.05, 0],
    );
    lumen.rotation.z = Math.PI / 2;

    k.segment([0, 1.16, 0], [0, 1.38, 0], 0.075, gold, dyn);
    const a = new THREE.Vector3(),
      z = new THREE.Vector3(),
      dir = new THREE.Vector3(),
      up = new THREE.Vector3(0, 1, 0);
    function link(m, from, to, r) {
      a.set(...from);
      z.set(...to);
      dir.copy(z).sub(a);
      m.position.copy(a).add(z).multiplyScalar(0.5);
      m.scale.set(r, dir.length(), r);
      m.quaternion.setFromUnitVectors(up, dir.normalize());
    }
    const labels = [
      k.label([-3.55, -1.9, 0], "负端 −", "Minus end −", 2),
      k.label([3.4, -1.9, 0], "正端 +", "Plus end +", 2),
      k.label([0, 2.85, 0], "膜性货物", "Membrane cargo", 2),
      k.label(
        [0, -2.45, 0],
        "极性微管 · α/β 微管蛋白",
        "Polar microtubule · α/β tubulin",
        1,
      ),
      k.label([0, 0.58, 0.5], "Kinesin-1", "Kinesin-1", 2),
    ];
    // An illustrative mammalian dynein–dynactin run, not sampled kinetics.
    // Repeated-head events and a backward step distinguish it from kinesin.
    const dyneinEvents = [
      [0, 1.0],
      [1, 0.55],
      [1, 0.4],
      [0, 1.45],
      [1, 1.25],
      [0, 0.9],
      [0, -0.35],
      [1, 1.2],
      [0, 2.2],
      [1, 1.8],
    ];
    function update(value, parameters = {}) {
      const p = clamp(value),
        isDynein = parameters.motor === "dynein",
        hasATP = parameters.atp !== "depleted",
        sign = isDynein ? -1 : 1,
        t = hasATP ? ease(p, 0.29, 0.88) : 0,
        steps = t * (isDynein ? dyneinEvents.length : 6);
      kin.visible = !isDynein;
      dyn.visible = isDynein;
      const count = Math.floor(steps),
        fraction = steps - count,
        stride = 5.2 / 6;
      let foot, movingHead;
      if (isDynein) {
        foot = [-0.35, 0.35];
        for (
          let event = 0;
          event < Math.min(count, dyneinEvents.length);
          event++
        ) {
          const [head, advance] = dyneinEvents[event];
          foot[head] += advance;
        }
        movingHead = count < dyneinEvents.length ? dyneinEvents[count][0] : -1;
        if (movingHead >= 0)
          foot[movingHead] += dyneinEvents[count][1] * ease(fraction, 0, 1);
      } else {
        foot = [
          -stride / 2 + Math.floor((count + 1) / 2) * 2 * stride,
          stride / 2 + Math.floor(count / 2) * 2 * stride,
        ];
        movingHead = count < 6 ? count % 2 : -1;
        if (movingHead >= 0)
          foot[movingHead] += 2 * stride * ease(fraction, 0, 1);
      }
      const mean = (foot[0] + foot[1]) / 2;
      const center = sign * (-2.6 + mean);
      kin.position.x = center;
      dyn.position.x = center;
      cargo.position.x = center;
      cargo.position.y = 0.6 * (1 - ease(p, 0.1, 0.27));
      for (let i = 0; i < 2; i++) {
        const offset = sign * (foot[i] - mean),
          lift = i === movingHead ? Math.sin(fraction * Math.PI) * 0.28 : 0;
        kh[i].position.set(offset, -0.36 + lift, i ? 0.1 : -0.1);
        link(kl[i], [offset, -0.3 + lift, i ? 0.1 : -0.1], [0, 0.42, 0], 0.06);
        const dx = offset + sign * 0.23;
        dh[i].position.set(dx, 0.25 + lift, i ? 0.13 : -0.13);
        link(
          ds[i],
          [dx, 0.2 + lift, i ? 0.13 : -0.13],
          [offset, -0.42 + lift, i ? 0.13 : -0.13],
          0.044,
        );
        link(dt[i], [dx, 0.52 + lift, i ? 0.13 : -0.13], [0, 1.16, 0], 0.072);
      }
      labels[2].position[0] = center;
      labels[4].position[0] = center;
      labels[4].text = isDynein
        ? b("Dynein + dynactin", "Dynein + dynactin")
        : b("Kinesin-1", "Kinesin-1");
      group.userData = {
        rootId,
        motor: isDynein ? "cytoplasmic-dynein" : "kinesin-1",
        atpAvailable: hasATP,
        direction: isDynein ? "minus-end" : "plus-end",
        cargoX: center,
        trackStationary: true,
        transportCompleted: hasATP && t === 1,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      materials: molecularInventory(group),
      camera: { position: [1.8, 2.6, 11.2], target: [0, 0.3, 0] },
    };
  },
};
