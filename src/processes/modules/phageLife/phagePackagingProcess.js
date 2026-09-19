import { pocketDomain } from "./refinedGeometry.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { cutawayHead } from "./assemblyGeometry.js";
export default {
  id: "phagePackaging",
  title: b("T4 DNA 包装马达", "T4 DNA packaging motor"),
  duration: 34,
  intro: b(
    "放大 T4 成熟前头的门户与包装系统。gp20 是十二聚体通道，gp17 是五聚体 ATP 酶／终止酶马达。切面露出头腔；DNA 路径、尺度、ATP 循环和速度均为示意，不代表精确折叠结构或步长。选择无 ATP 可观察转位停滞。",
    "A close view of the T4 processed prohead portal and packaging machine. gp20 forms a dodecameric channel; gp17 forms the pentameric ATPase/terminase motor. A cutaway exposes the lumen. DNA routing, scales, ATP cycling and rates are schematic, not exact packing structure or step size. Removing ATP stalls translocation.",
  ),
  controls: [
    {
      id: "atp",
      label: b("可水解的 ATP", "Hydrolysable ATP"),
      default: "present",
      options: [
        {
          value: "present",
          label: b("有 ATP：包装推进", "ATP present: packaging"),
        },
        {
          value: "absent",
          label: b("无 ATP：转位停滞", "No ATP: translocation stalled"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("DNA 与包装系统对接", "DNA and packaging-machine docking"),
      description: b(
        "起点是已经清除主要支架的前头。终止酶系统使 DNA 与门户相遇，gp17 组装成五聚体马达。小终止酶 gp16 的起始识别作用在此省略。",
        "The starting prohead has had its major scaffold removed. The terminase system brings DNA to the portal and gp17 assembles into a pentameric motor. The initiating recognition role of small terminase gp16 is omitted.",
      ),
    },
    {
      at: 0.16,
      title: b("门户与马达各司其职", "Distinct portal and motor roles"),
      description: b(
        "十二聚体 gp20 形成进入头腔的通道；外侧 gp17 结合并水解 ATP。图中门户保持固定，动力来自马达构象循环而非门户作为转子旋转。",
        "Dodecameric gp20 forms the channel into the lumen; external gp17 binds and hydrolyses ATP. The portal remains fixed in this scene: motor conformational cycling supplies force, not a portal rotor.",
      ),
    },
    {
      at: 0.3,
      title: b("ATP 驱动 DNA 转位", "ATP-driven DNA translocation"),
      description: b(
        "gp17 将双链 DNA 经门户送入头腔。金色核苷酸位点示意 ATP 循环；无 ATP 分支保留对接结构但不增加腔内 DNA。",
        "gp17 translocates double-stranded DNA through the portal into the lumen. Gold nucleotide sites indicate ATP cycling. Without ATP, the docked machinery remains but lumen DNA does not increase.",
      ),
    },
    {
      at: 0.51,
      title: b("壳体扩张与持续装填", "Shell expansion and continued loading"),
      description: b(
        "包装早期壳体扩张；DNA 在腔内逐渐积累。可见卷曲路径只用于表现空间占据，不指定唯一的基因组排列方式。",
        "The shell expands early in packaging and DNA accumulates inside. The visible coiled path illustrates occupancy without prescribing a unique genome arrangement.",
      ),
    },
    {
      at: 0.78,
      title: b("头满终止与切割", "Headful termination and cleavage"),
      description: b(
        "包装达到头满状态后，gp17 的核酸酶功能将已包装 DNA 与外部连接体分开；包装马达随后离开门户。无 ATP 时不发生这一终止步骤。",
        "At headful completion, the gp17 nuclease function separates packaged DNA from the external concatemer. The packaging motor then leaves the portal. Without ATP, this completion step is not reached.",
      ),
    },
    {
      at: 0.92,
      title: b("颈部封口", "Neck sealing"),
      description: b(
        "gp13／gp14 在门户处组装，封闭含 DNA 的头并为尾部连接准备位点。本模型到封口结束，不把包装马达保留为尾部。",
        "gp13/gp14 assemble at the portal, sealing the DNA-filled head and preparing a tail docking site. The model ends with sealing; the packaging motor is not retained as the tail.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Cryo-EM structure of the bacteriophage T4 portal protein assembly",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4493910/",
    },
    {
      title:
        "Portal–Large Terminase Interactions of the Bacteriophage T4 DNA Packaging Machine",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3318623/",
    },
    {
      title: "Bacteriophage T4 Head: Structure, Assembly, and Genome Packaging",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9958956/",
    },
  ],
  create({ rootId = "phage" } = {}) {
    const k = sceneKit(),
      { group } = k,
      head = cutawayHead(k, group);
    head.scaffolding.visible = false;
    const entryDNA = k.segment(
      [0, -1.6, 0],
      [0, -1.35, 0],
      0.038,
      k.material("#c2a062"),
      head.group,
    );
    const motor = new THREE.Group();
    group.add(motor);
    motor.position.y = -1.48;
    const subunits = [],
      nucleotides = [];
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5,
        g = new THREE.Group();
      motor.add(g);
      g.position.set(0.53 * Math.cos(a), 0, 0.53 * Math.sin(a));
      const atpase = pocketDomain(
        k,
        g,
        [0, -0.1, 0],
        [0.26, 0.28, 0.24],
        ["#88a299", "#adbbb0"],
      );
      atpase.rotation.y = -a;
      const nuclease = pocketDomain(
        k,
        g,
        [0, 0.22, 0],
        [0.22, 0.25, 0.21],
        ["#7d9897", "#a3b7b3"],
      );
      nuclease.rotation.y = -a;
      k.segment([0, -0.03, 0], [0, 0.12, 0], 0.062, k.material("#a8b8b0"), g);
      const nucleotide = new THREE.Group();
      g.add(nucleotide);
      nucleotide.position.set(0.18 * Math.cos(a), -0.1, 0.18 * Math.sin(a));
      for (let n = 0; n < 3; n++) {
        k.ball(
          [0, -0.045 * n, 0.03],
          [0.037, 0.032, 0.029],
          k.material(n === 2 ? "#e0c28a" : "#cbae70"),
          nucleotide,
        );
        if (n < 2)
          k.segment(
            [0, -0.045 * n, 0.03],
            [0, -0.045 * (n + 1), 0.03],
            0.014,
            k.material("#c5ab7b"),
            nucleotide,
          );
      }
      const adenine = k.mesh(
        new THREE.CylinderGeometry(0.048, 0.048, 0.021, 6),
        k.material("#baa681"),
        [0, 0.047, 0.03],
        nucleotide,
      );
      adenine.rotation.x = Math.PI / 2;
      subunits.push({ g, atpase, a });
      nucleotides.push(nucleotide);
    }
    const dsDNA = new THREE.Group();
    group.add(dsDNA);
    const rails = [[], []],
      rungs = [];
    const strand0 = k.material("#bb975f"),
      strand1 = k.material("#d2b47d"),
      bonds = k.material("#d5c8a9");
    for (let i = 0; i < 54; i++) {
      for (let s = 0; s < 2; s++)
        rails[s].push(
          k.segment([0, 0, 0], [0, 1, 0], 0.033, s ? strand1 : strand0, dsDNA),
        );
      rungs.push(k.segment([0, 0, 0], [1, 0, 0], 0.018, bonds, dsDNA));
    }
    const up = new THREE.Vector3(0, 1, 0),
      delta = new THREE.Vector3();
    function pose(m, x1, y1, z1, x2, y2, z2, r) {
      delta.set(x2 - x1, y2 - y1, z2 - z1);
      m.position.set((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2);
      m.scale.set(r, Math.max(1e-6, delta.length()), r);
      m.quaternion.setFromUnitVectors(up, delta.normalize());
    }
    const guide = k.mesh(
      new THREE.ConeGeometry(0.12, 0.33, 20),
      k.material("#b69963"),
      [0.6, -2.64, 0.25],
    );
    const cutMarker = k.ring(
      [0, -1.04, 0.18],
      0.19,
      0.035,
      k.material("#b3897a"),
    );
    cutMarker.rotation.x = Math.PI / 2;
    const labels = [
      k.label(
        [2.15, 2.8, 0.2],
        "前头腔：剖开显示",
        "Prohead lumen: cutaway",
        2,
      ),
      k.label(
        [-1.65, -0.84, 0.3],
        "gp20 门户：12 亚基",
        "gp20 portal: 12 subunits",
        2,
      ),
      k.label(
        [1.6, -1.65, 0.3],
        "gp17 马达：5 亚基",
        "gp17 motor: 5 subunits",
        2,
      ),
      k.label(
        [1.12, -2.66, 0.3],
        "ATP 驱动向内转位",
        "ATP-driven inward translocation",
        2,
      ),
      k.label(
        [-0.75, -3.78, 0.15],
        "外部双链 DNA",
        "External double-stranded DNA",
        2,
      ),
      k.label(
        [1.35, -1.05, 0.25],
        "切割并释放马达",
        "Cleavage and motor release",
        2,
      ),
      k.label([1.3, -1.4, 0.2], "gp13 / gp14 封口", "gp13 / gp14 seal", 2),
      k.label(
        [0, -2.48, 0.35],
        "无 ATP：已对接，转位停滞",
        "No ATP: docked, translocation stalled",
        2,
      ),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        atp = parameters.atp !== "absent",
        dock = ease(p, 0, 0.17),
        load = atp ? ease(p, 0.25, 0.78) : 0,
        expand = 1 + 0.12 * ease(load, 0.12, 0.35),
        detach = atp ? ease(p, 0.82, 0.92) : 0,
        seal = atp ? ease(p, 0.92, 1) : 0,
        scale = 1.27 * expand;
      head.group.position.set(0, 1.12, 0);
      head.group.scale.setScalar(scale);
      head.portal.rotation.set(0, 0, 0);
      head.scaffolding.visible = false;
      entryDNA.visible = load > 0;
      head.genome.visible = load > 0;
      head.setGenomeFraction(load);
      head.neck.visible = seal > 0;
      head.neck.scale.setScalar(Math.max(0.03, seal));
      const portalY = 1.12 - 1.6 * scale;
      motor.position.set(detach * 2.3, portalY - 0.52 - (1 - dock) * 0.65, 0);
      motor.visible = detach < 1;
      subunits.forEach(({ g, atpase, a }, i) => {
        const cycle =
          atp && p > 0.25 && p < 0.78
            ? 0.5 + 0.5 * Math.sin(p * 90 + i * 1.26)
            : 0;
        g.position.set(
          (0.53 - 0.055 * cycle) * Math.cos(a),
          0.05 * cycle,
          (0.53 - 0.055 * cycle) * Math.sin(a),
        );
        atpase.scale.set(0.26, 0.28 - 0.035 * cycle, 0.24);
        nucleotides[i].visible = atp && p > 0.15 && p < 0.81;
        nucleotides[i].scale.setScalar(0.7 + 0.3 * cycle);
      });
      const bottom = -4.1 + load * 0.72,
        top = portalY + 0.13,
        gap = atp ? ease(p, 0.79, 0.85) : 0;
      for (let i = 0; i < 54; i++) {
        const y = -4.1 + (i * 3.35) / 54,
          ny = y + 3.35 / 54,
          a = i * 0.42;
        const visible = y >= bottom && ny <= top - gap * 0.28;
        for (let s = 0; s < 2; s++) {
          const sign = s ? -1 : 1;
          rails[s][i].visible = visible;
          pose(
            rails[s][i],
            sign * 0.09 * Math.cos(a),
            y,
            sign * 0.09 * Math.sin(a),
            sign * 0.09 * Math.cos(a + 0.42),
            ny,
            sign * 0.09 * Math.sin(a + 0.42),
            0.033,
          );
        }
        rungs[i].visible = visible && i % 2 === 0;
        pose(
          rungs[i],
          0.09 * Math.cos(a),
          y,
          0.09 * Math.sin(a),
          -0.09 * Math.cos(a),
          y,
          -0.09 * Math.sin(a),
          0.018,
        );
      }
      dsDNA.position.y = -detach * 0.3;
      guide.visible = atp && p > 0.25 && p < 0.78;
      guide.position.y = -2.7 + 0.25 * Math.sin(load * Math.PI * 6);
      cutMarker.visible = atp && p > 0.78 && p < 0.87;
      cutMarker.position.y = portalY - 0.15;
      labels[1].position[1] = portalY + 0.03;
      labels[2].active = detach < 1;
      labels[3].active = guide.visible;
      labels[4].active = p < 0.93 || !atp;
      labels[5].active = atp && p >= 0.78 && p < 0.92;
      labels[6].active = atp && p >= 0.92;
      labels[7].active = !atp && p >= 0.25;
      group.userData = {
        rootId,
        phage: "T4",
        compartment: "E-coli-cytoplasm",
        ATPAvailable: atp,
        portalSubunits: 12,
        motorSubunits: 5,
        portalRotates: false,
        docked: dock === 1,
        packagedFraction: load,
        capsidExpansion: expand,
        concatemerCut: atp && p >= 0.85,
        motorReleased: detach === 1,
        neckSealed: seal === 1,
        tailPresent: false,
        blockedStep: atp ? null : "ATP-dependent-DNA-translocation",
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0, 0.6, 13.5], target: [0, -0.3, 0] },
    };
  },
};
