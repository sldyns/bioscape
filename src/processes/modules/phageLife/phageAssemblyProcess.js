import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { cutawayHead, assemblyTail } from "./assemblyGeometry.js";
export default {
  id: "phageAssembly",
  title: b("T4 头尾装配与成熟", "T4 head–tail assembly and maturation"),
  duration: 35,
  intro: b(
    "放大易感大肠杆菌胞质内的 T4 装配。头、尾及长尾纤维由不同途径形成，经过成熟后结合。头部前侧切开显示支架和 DNA；省略许多辅助蛋白，形状、拷贝数及时间为示意。可关闭 gp21 蛋白酶观察前头停滞。",
    "A close view of T4 morphogenesis in susceptible E. coli cytoplasm. Heads, tails and long tail fibers follow distinct assembly pathways before joining. The head is cut open to expose scaffold and DNA. Many accessory proteins are omitted; shapes, copy numbers and timing are schematic. Disable gp21 protease to stall prohead maturation.",
  ),
  controls: [
    {
      id: "protease",
      label: b("gp21 成熟蛋白酶", "gp21 maturation protease"),
      default: "active",
      options: [
        { value: "active", label: b("有活性：正常成熟", "Active: maturation") },
        {
          value: "inactive",
          label: b("无活性：支架保留", "Inactive: scaffold retained"),
        },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("两条装配路线", "Separate assembly routes"),
      description: b(
        "左侧门户在内膜胞质面启动前头装配；右侧基板启动尾管与尾鞘装配。两套结构此时不相连。",
        "On the left, the portal at the cytoplasmic face of the inner membrane initiates prohead formation. On the right, the baseplate nucleates tail tube and sheath assembly. They are initially separate.",
      ),
    },
    {
      at: 0.15,
      title: b("支架指导前头形成", "Scaffold-guided prohead formation"),
      description: b(
        "衣壳蛋白围绕内部支架形成前头；尾管和延伸态尾鞘独立增长。前头支架还未清除，不能直接作为成熟的含 DNA 头部。",
        "Capsid proteins form a prohead around an internal scaffold while the tail tube and extended sheath grow independently. The uncleared scaffold distinguishes this prohead from a mature DNA-filled head.",
      ),
    },
    {
      at: 0.33,
      title: b("蛋白水解成熟", "Proteolytic maturation"),
      description: b(
        "gp21 清除主要支架组分并切割衣壳蛋白前肽，为 DNA 腾出空间。关闭 gp21 时支架保留，头部后续步骤停滞；尾部仍能继续装配。",
        "gp21 digests major scaffold components and cleaves capsid propeptides, making room for DNA. With gp21 inactive, scaffold remains and later head steps stall while tail assembly continues.",
      ),
    },
    {
      at: 0.5,
      title: b("包装与壳体扩张", "Packaging and shell expansion"),
      description: b(
        "成熟前头脱离内膜，ATP 驱动的包装系统装入 DNA，并伴随壳体扩张。此处概览包装；门户本身不作为旋转转子显示。",
        "The processed prohead leaves the membrane. ATP-powered packaging loads DNA while the shell expands. Packaging is summarized here; the portal is not shown as a rotating rotor.",
      ),
    },
    {
      at: 0.69,
      title: b("封口与组件完成", "Sealing and component completion"),
      description: b(
        "DNA 包装完成后，颈部蛋白封闭门户并建立尾部结合位点。独立的尾管、尾鞘和基板完成，长尾纤维等待安装。",
        "After DNA packaging, neck proteins seal the portal and establish the tail docking site. The independently assembled tube, sheath and baseplate are complete; long tail fibers await attachment.",
      ),
    },
    {
      at: 0.83,
      title: b(
        "头尾结合与尾纤维安装",
        "Head–tail joining and fiber attachment",
      ),
      description: b(
        "完成包装的头与尾结合，随后安装长尾纤维。所得尾鞘仍处于延伸态；收缩属于感染步骤，不属于装配。gp21 无活性时不会形成完整子代。",
        "The DNA-filled head joins the tail, followed by long tail fiber attachment. The sheath remains extended: contraction is an infection event, not an assembly step. Inactive gp21 prevents formation of a complete progeny particle.",
      ),
    },
  ],
  sources: [
    {
      title: "Structure and function of bacteriophage T4",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4275845/",
    },
    {
      title: "Bacteriophage T4 Head: Structure, Assembly, and Genome Packaging",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9958956/",
    },
    {
      title: "Morphogenesis of the T4 tail and tail fibers",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3004832/",
    },
  ],
  create({ rootId = "phage" } = {}) {
    const k = sceneKit(),
      { group } = k,
      head = cutawayHead(k, group),
      tail = assemblyTail(k, group);
    const membrane = new THREE.Group();
    group.add(membrane);
    for (let i = 0; i < 18; i++) {
      const x = -3.65 + i * 0.18;
      for (const y of [-0.61, -0.8])
        k.ball(
          [x, y, -0.12],
          [0.083, 0.055, 0.16],
          k.material("#a7bcad"),
          membrane,
        );
      k.segment(
        [x, -0.66, -0.12],
        [x, -0.75, -0.12],
        0.025,
        k.material("#c5b89b"),
        membrane,
      );
    }
    const fragments = Array.from({ length: 9 }, (_, i) =>
      k.ball([0, 0, 0], [0.055, 0.09, 0.05], k.material("#b8b19d")),
    );
    const motor = k.ring([-2, -0.79, 0.1], 0.36, 0.09, k.material("#849b99"));
    motor.rotation.x = Math.PI / 2;
    const fiberPreview = new THREE.Group();
    group.add(fiberPreview);
    for (let i = 0; i < 3; i++)
      k.tube(
        [
          [3.1 + i * 0.2, 1.2, 0.1],
          [3.5 + i * 0.2, 0.83, 0.1],
          [3.35 + i * 0.2, 0.25, 0.1],
        ],
        0.03,
        k.material("#819da8"),
        fiberPreview,
        20,
      );
    const labels = [
      k.label(
        [-2, 3.3, 0],
        "前头：支架与 gp21",
        "Prohead: scaffold and gp21",
        2,
      ),
      k.label([2.1, 1.2, 0], "独立装配的尾", "Independently assembled tail", 2),
      k.label(
        [-2, -1.22, 0.2],
        "宿主内膜：胞质侧在上",
        "Host inner membrane: cytoplasm above",
        2,
      ),
      k.label([-2, 0.04, 0.7], "支架清除", "Scaffold removal", 2),
      k.label(
        [-2, 3.38, 0.2],
        "DNA 包装与扩张",
        "DNA packaging and expansion",
        2,
      ),
      k.label([0.85, 0.1, 0.2], "封口后头尾结合", "Sealed head joins tail", 2),
      k.label(
        [0, 3.8, 0],
        "延伸态尾鞘 · 完整子代",
        "Extended sheath · mature progeny",
        2,
      ),
      k.label(
        [-2, 3.28, 0.2],
        "gp21 无活性：前头停滞",
        "Inactive gp21: prohead stalled",
        2,
      ),
    ];
    function update(progress, parameters = {}) {
      const p = clamp(progress),
        active = parameters.protease !== "inactive",
        shell = ease(p, 0.03, 0.26),
        clear = active ? ease(p, 0.33, 0.48) : 0,
        load = active ? ease(p, 0.51, 0.69) : 0,
        expand = 1 + 0.12 * ease(load, 0.12, 0.38),
        join = active ? ease(p, 0.83, 0.94) : 0,
        tailGrow = ease(p, 0.1, 0.57),
        seal = active ? ease(p, 0.69, 0.8) : 0;
      head.group.position.set(-2 + 2 * join, 1.05 + 0.64 * clear, 0);
      head.group.scale.setScalar(expand);
      head.panels.forEach((m, i) => {
        m.visible = shell > (i / head.panels.length) * 0.72;
        m.scale.setScalar(1 + (1 - shell) * 0.18);
      });
      head.scaffolding.visible = clear < 1;
      head.scaffolding.scale.setScalar(1 - 0.82 * clear);
      head.genome.visible = load > 0;
      head.setGenomeFraction(load);
      head.neck.visible = seal > 0;
      head.neck.scale.setScalar(Math.max(0.03, seal));
      tail.group.position.set(2 - 2 * join, -0.51 * join, 0);
      tail.tube.scale.y = Math.max(0.02, tailGrow * 2.12);
      tail.tube.position.y = -2.12 + tailGrow * 1.06;
      tail.lumen.scale.y = Math.max(0.02, tailGrow);
      tail.lumen.position.y = -2.12 + tailGrow * 1.06;
      tail.sheath.forEach((r, i) => {
        r.visible = tailGrow > (i + 1) / 19;
      });
      tail.terminator.visible = p > 0.59;
      tail.fibers.visible = active && p > 0.93;
      tail.fibers.scale.setScalar(0.72 + 0.28 * ease(p, 0.93, 0.99));
      fiberPreview.visible = p > 0.55 && (!active || p < 0.95);
      fiberPreview.position.x = -join * 0.9;
      membrane.visible = p < 0.56 || !active;
      fragments.forEach((m, i) => {
        m.visible = clear > 0 && clear < 1;
        const a = (i * Math.PI * 2) / 9;
        m.position.set(
          -2 + (0.5 + clear * 0.8) * Math.cos(a),
          1.05 + 0.85 * Math.sin(a) - clear * 0.4,
          0.25,
        );
        m.scale.setScalar(1 - clear * 0.7);
      });
      motor.visible = active && p > 0.51 && p < 0.73;
      motor.position.set(
        head.group.position.x,
        head.group.position.y - 1.82 * expand,
        0.1,
      );
      labels[0].active = p < 0.33;
      labels[1].active = p < 0.85 || !active;
      labels[2].active = membrane.visible;
      labels[3].active = active && p >= 0.33 && p < 0.5;
      labels[4].active = active && p >= 0.5 && p < 0.8;
      labels[5].active = active && p >= 0.8 && p < 0.95;
      labels[6].active = active && p >= 0.95;
      labels[7].active = !active && p >= 0.33;
      group.userData = {
        rootId,
        phage: "T4",
        compartment: "E-coli-cytoplasm",
        gp21Active: active,
        shellAssembly: shell,
        scaffoldRemoved: clear === 1,
        packagedFraction: load,
        portalRotates: false,
        neckSealed: seal === 1,
        tailAssembly: tailGrow,
        tailSheath: "extended",
        headTailJoined: join === 1,
        fibersAttached: active && p >= 0.99,
        matureVirion: active && p >= 0.99,
        blockedStep: active ? null : "prohead-proteolysis",
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0, 1, 12.8], target: [0, 0.2, 0] },
    };
  },
};
