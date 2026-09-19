import { entryGenome } from "./entryGeometry.js";
import { duplex, ribosome } from "./refinedGeometry.js";
import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { hollowCylinder } from "./refinedGeometry.js";
import { hostCutaway, phage, chromosome } from "./geometry.js";
export default {
  id: "phageLytic",
  title: b("T4 噬菌体裂解周期", "T4 phage lytic cycle"),
  duration: 36,
  intro: b(
    "以易感大肠杆菌中的 T4 为例，从 DNA 进入到子代释放。剖面移除宿主前侧包膜以显示胞质；粒子数、结构尺度和时间均为示意。T4 在此模型中只走裂解途径。",
    "T4 in a susceptible Escherichia coli host, from DNA entry to progeny release. The front envelope is cut away to expose the cytoplasm; particle numbers, scales and timing are schematic. T4 follows the lytic pathway in this model.",
  ),
  stages: [
    {
      at: 0,
      title: b("吸附与 DNA 进入", "Attachment and DNA entry"),
      description: b(
        "T4 在大肠杆菌表面吸附；尾部介导 DNA 穿过包膜进入胞质，衣壳保留在外侧。此处只概览进入过程。",
        "T4 attaches to E. coli. Its tail mediates DNA passage through the envelope into the cytoplasm while the capsid stays outside. Entry is shown as an overview.",
      ),
    },
    {
      at: 0.17,
      title: b("早期表达", "Early expression"),
      description: b(
        "噬菌体基因在宿主胞质中被转录，宿主核糖体翻译 RNA。T4 重定向细胞资源，宿主 DNA 逐渐降解。",
        "Phage genes are transcribed in the cytoplasm and host ribosomes translate the RNA. T4 redirects cellular resources and host DNA is progressively degraded.",
      ),
    },
    {
      at: 0.34,
      title: b("基因组扩增", "Genome amplification"),
      description: b(
        "T4 复制蛋白扩增噬菌体 DNA，形成用于包装的连接体。金色曲线表示 DNA，不代表精确拷贝数。",
        "T4 replication proteins amplify phage DNA, generating concatemers for packaging. Gold strands represent DNA, not an exact copy number.",
      ),
    },
    {
      at: 0.52,
      title: b("分别装配头与尾", "Separate head and tail assembly"),
      description: b(
        "前头从内膜胞质侧起始装配后成熟；尾与尾纤维通过独立途径装配。分离组件在胞质内等待结合。",
        "Proheads begin assembly at the cytoplasmic face of the inner membrane and then mature. Tails and tail fibers assemble through separate pathways; components await joining inside the cytoplasm.",
      ),
    },
    {
      at: 0.67,
      title: b("DNA 包装与成熟", "DNA packaging and maturation"),
      description: b(
        "包装马达把 DNA 装入成熟前头并切割连接体；随后头部、尾和尾纤维结合，形成具感染性的子代。",
        "Packaging motors load DNA into mature proheads and cut the concatemer. Heads, tails and fibers then join to form infectious progeny.",
      ),
    },
    {
      at: 0.85,
      title: b("包膜破坏与释放", "Envelope disruption and release"),
      description: b(
        "晚期裂解系统破坏内膜、肽聚糖和外膜屏障，使胞内成熟粒子释放到细胞外。图中裂口是包膜破坏的示意。",
        "Late lysis functions disrupt the inner membrane, peptidoglycan and outer membrane barriers, releasing mature intracellular particles. Gaps schematically represent envelope failure.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Structural remodeling of bacteriophage T4 and host membranes during infection initiation",
      url: "https://pubmed.ncbi.nlm.nih.gov/26283379/",
    },
    {
      title: "Structure and function of bacteriophage T4",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4275845/",
    },
    {
      title: "Bacteriophage T4 Genome",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC150520/",
    },
    {
      title: "The Beauty of Bacteriophage T4 Research: T4 Head Assembly",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9026906/",
    },
  ],
  create({ rootId = "phage" } = {}) {
    const k = sceneKit(),
      { group } = k,
      host = hostCutaway(k, group);
    const hostDNA = chromosome(k, group, k.material("#9ca7a6"));
    const visitor = phage(k, group, { scale: 0.8 });
    // The fixed tip lies at the outer envelope; a schematic hollow channel
    // connects it to the exposed cytoplasm. Entry detail lives in infection.
    const attachmentY = 2.04;
    visitor.group.name = "T4-attached-visitor";
    visitor.group.position.set(-0.8, attachmentY, 0.08);
    visitor.genome.visible = false; // Replaced by the single continuous interval.
    const incoming = entryGenome(k, group, attachmentY);
    const channel = hollowCylinder(
      k,
      group,
      0.049,
      0.031,
      0.205,
      k.material("#93aca6", {
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
      [-0.8, 1.3375, 0.08],
    );
    channel.name = "T4-envelope-delivery-channel";
    const dnaTube = (points, radius, material, parent, samples) =>
      duplex(k, parent, points, {
        radius: 0.025,
        rail: 0.013,
        turns: samples / 5,
        samples: samples * 3,
        pairs: samples,
        colors: [material.color.getStyle(), "#d5b98a"],
      }).group;
    const amplifications = Array.from({ length: 3 }, (_, j) =>
      dnaTube(
        Array.from({ length: 65 }, (_, i) => [
          -1.75 + i * 0.055,
          -0.35 + j * 0.35 + 0.12 * Math.sin(i * 0.42 + j),
          0.24 + 0.05 * Math.cos(i * 0.42),
        ]),
        0.033,
        k.material("#c5a978"),
        group,
        70,
      ),
    );
    const expression = new THREE.Group();
    group.add(expression);
    const rnaMat = k.material("#8faca1"),
      proteins = [];
    for (let j = 0; j < 3; j++) {
      const x = -1.75 + j * 1.5,
        y = -0.58 + (j % 2) * 0.15;
      k.tube(
        [
          [x - 0.35, y, 0.22],
          [x - 0.1, y + 0.08, 0.22],
          [x + 0.15, y, 0.22],
          [x + 0.55, y + 0.03, 0.22],
        ],
        0.028,
        rnaMat,
        expression,
        24,
      );
      ribosome(k, expression, [x, y, 0.3], 0.26);
      proteins.push(
        k.tube(
          [
            [x + 0.05, y + 0.17, 0.3],
            [x + 0.15, y + 0.28, 0.3],
            [x + 0.05, y + 0.36, 0.3],
            [x + 0.23, y + 0.4, 0.3],
          ],
          0.028,
          k.material("#859cab"),
          expression,
          18,
        ),
      );
    }
    const sites = [
      [-2, 0.4],
      [-0.72, 0.48],
      [0.6, 0.45],
      [1.9, 0.38],
      [-1.6, -0.35],
      [-0.3, -0.43],
      [1.1, -0.37],
    ];
    const progeny = sites.map(([x, y], i) => {
      const v = phage(k, group, { scale: 0.36 });
      v.group.position.set(x, y, 0.27);
      v.group.rotation.z = ((i % 3) - 1) * 0.3;
      return v;
    });
    const portals = sites.map(([x, y]) => {
      const r = k.ring(
        [x, y - 0.02, 0.31],
        0.066,
        0.025,
        k.material("#c4a56e"),
      );
      return r;
    });
    const labels = [
      k.label(
        [-2.15, 1.85, 0],
        "大肠杆菌包膜剖面",
        "E. coli envelope cutaway",
        2,
      ),
      k.label([2.55, -1.35, 0], "胞质", "Cytoplasm", 2),
      k.label(
        [-1, 3.05, 0.1],
        "T4：衣壳留在胞外",
        "T4: capsid remains outside",
        2,
      ),
      k.label(
        [0, -1.06, 0.3],
        "宿主核糖体与噬菌体 RNA",
        "Host ribosomes and phage RNA",
        2,
      ),
      k.label(
        [0.3, 0.96, 0.2],
        "DNA 复制连接体",
        "Replicating DNA concatemers",
        2,
      ),
      k.label(
        [0.25, -1.17, 0.3],
        "前头 · 独立装配的尾",
        "Proheads · separate tails",
        2,
      ),
      k.label([0.3, 1.82, 0.3], "成熟子代释放", "Mature progeny released", 2),
    ];
    function update(progress) {
      const p = clamp(progress),
        entry = ease(p, 0, 0.17),
        assembly = ease(p, 0.51, 0.67),
        pack = ease(p, 0.67, 0.76),
        join = ease(p, 0.74, 0.84),
        release = ease(p, 0.85, 1);
      visitor.group.visible = p < 0.37;
      visitor.genome.visible = false;
      visitor.tail.scale.y = 1; // Entry is an overview; the rigid tube is not shortened.
      incoming.group.visible = p < 0.78;
      incoming.update(entry);
      channel.visible = p < 0.25;
      hostDNA.group.visible = p < 0.36;
      hostDNA.group.scale.setScalar(1 - 0.55 * ease(p, 0.19, 0.36));
      amplifications.forEach((m, i) => {
        m.visible = p > 0.34 + i * 0.045 && p < 0.77;
        m.scale.x = Math.max(0.02, ease(p, 0.34 + i * 0.045, 0.5 + i * 0.03));
      });
      expression.visible = p >= 0.17 && p < 0.55;
      proteins.forEach((m, i) => {
        m.scale.y = 0.3 + 0.7 * ease(p, 0.18 + i * 0.035, 0.36 + i * 0.035);
      });
      progeny.forEach((v, i) => {
        const [x, y] = sites[i],
          angle = (i * Math.PI * 2) / sites.length;
        v.group.visible = p > 0.51 + i * 0.008;
        v.head.scale.setScalar(Math.max(0.05, assembly));
        v.tail.visible = p > 0.56;
        v.tail.position.x = (1 - join) * 0.62;
        v.tail.position.y = -(1 - join) * 0.13;
        v.genome.visible = p > 0.67;
        v.genome.scale.setScalar(Math.max(0.01, pack));
        v.group.position.set(
          x + (4.05 * Math.cos(angle) - x) * release,
          y + (2.25 * Math.sin(angle) - y) * release,
          0.27 + release * 0.24,
        );
        v.group.rotation.z =
          ((i % 3) - 1) * 0.3 + release * (i % 2 ? -0.65 : 0.65);
        // Early proheads are positioned near the inner-envelope face, then detach.
        const innerY = 1.48 * 0.925 * Math.sqrt(1 - (x / (3.2 * 0.925)) ** 2);
        v.head.position.y =
          ((1 - ease(p, 0.55, 0.64)) * (innerY - 0.18 - y - 0.126)) / 0.36;
        portals[i].visible = p > 0.66 && p < 0.79;
        portals[i].position.set(x, y - 0.02, 0.31);
      });
      host.rupture(release);
      labels[2].active = p < 0.3;
      labels[3].active = expression.visible;
      labels[4].active = p >= 0.34 && p < 0.64;
      labels[5].active = p >= 0.52 && p < 0.85;
      labels[6].active = p >= 0.85;
      group.userData = {
        rootId,
        host: "Escherichia coli",
        phage: "T4",
        lifestyle: "obligately-lytic",
        compartment: "host-cytoplasm",
        assemblyProgress: assembly,
        packagingProgress: pack,
        tailJoiningProgress: join,
        capsidStaysOutside: true,
        genomeEntered: entry === 1,
        hostDNADegraded: p >= 0.36,
        concatemersVisible: p >= 0.34 && p < 0.77,
        separateHeadTail: assembly > 0 && join < 1,
        packaged: pack === 1,
        mature: join === 1,
        envelopeIntegrity: 1 - release,
        progenyReleased: release === 1,
        progenyCountSchematic: true,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0, 1.3, 11.8], target: [0, 0.35, 0] },
    };
  },
};
