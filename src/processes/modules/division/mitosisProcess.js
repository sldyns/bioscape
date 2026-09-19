import { clamp, ease, bilingual as b } from "../../kit.js";
import { divisionKit } from "./divisionShapes.js";

function create() {
  const k = divisionKit();
  const cell = k.cell(3.2, 2.25, 1.38);
  const daughters = [-1, 1].map((side) => {
    const c = k.cell(1.62, 1.58, 1.22);
    c.mesh.position.x = side * 1.97;
    return c;
  });
  const initialNucleus = k.envelope([0, 0, 0], [2.1, 1.94, 1.03]);
  const nuclei = [-1, 1].map((side) =>
    k.envelope([side * 1.97, 0, 0], [1.05, 1.44, 0.8]),
  );
  const ring = k.contractileRing();
  ring.rotation.y = Math.PI / 2;
  const poles = [-1, 1].map((side) => {
    const pole = k.centrosome();
    pole.position.x = side * 2.6;
    return pole;
  });
  const astrals = [-1, 1].flatMap((side) =>
    Array.from({ length: 7 }, (_, i) => ({
      side,
      angle: (i * Math.PI * 2) / 7,
      mesh: k.line(),
    })),
  );
  const chromosomes = Array.from({ length: 4 }, (_, i) =>
    [-1, 1].map((side) => {
      const chromatid = k.chromatid(
        side,
        i % 2 ? 0.36 : 0.44,
        i < 2 ? k.green : k.purple,
      );
      return {
        ...chromatid,
        side,
        index: i,
        fibre: k.bundle(),
        cohesion: k.line(k.gold),
      };
    }),
  ).flat();
  const overlaps = Array.from({ length: 8 }, (_, i) =>
    [-1, 1].map((side) => ({
      mesh: Object.assign(k.bundle(k.group, 3), {
        name: "antiparallel-interpolar-half-bundle",
      }),
      side,
      y: (i - 3.5) * 0.14,
      z: -0.4 - (i % 2) * 0.08,
    })),
  ).flat();
  const labels = [
    k.label(
      [0, 2.5, 0],
      "动物体细胞 · 染色体子集",
      "Animal somatic cell · chromosome subset",
      10,
    ),
    k.label([-2.6, -0.45, 0.4], "纺锤体极", "Spindle pole", 3),
    k.label([0, 1.5, 0.5], "姐妹染色单体", "Sister chromatids", 6),
    k.label(
      [0, -2.35, 0.3],
      "收缩环与分裂沟",
      "Contractile ring and cleavage furrow",
      5,
    ),
    k.label(
      [0, 1.8, 0.6],
      "未附着动粒：检查点阻滞",
      "Unattached kinetochore: checkpoint arrest",
      9,
    ),
    k.label(
      [1.97, 1.75, 0.4],
      "子细胞：染色体组成保持",
      "Daughter cell: chromosome complement retained",
      7,
    ),
  ];
  function update(progress, parameters = {}) {
    const requested = clamp(progress);
    const blocked = parameters.attachment === "unattached";
    const p = blocked ? Math.min(requested, 0.43) : requested;
    const capture = ease(p, 0.08, 0.32),
      align = ease(p, 0.1, 0.36);
    const separate = ease(p, 0.48, 0.73),
      furrow = ease(p, 0.68, 0.93),
      exit = ease(p, 0.76, 0.94);
    const poleX = 2.45 + 0.35 * separate;
    const abscission = ease(p, 0.91, 0.97);
    cell.opacity(1 - abscission);
    cell.shape(furrow * 0.985, 1 + furrow * 0.16);
    daughters.forEach((c) => c.opacity(abscission));
    initialNucleus.reveal(1 - ease(p, 0.04, 0.19));
    nuclei.forEach((n) => n.reveal(exit));
    ring.visible = p >= 0.68 && p < 0.94;
    ring.scale.set(1.38 * (1 - furrow * 0.97), 2.25 * (1 - furrow * 0.97), 1);
    poles.forEach((pole, i) => {
      pole.position.x = (i ? 1 : -1) * poleX;
      pole.visible = true;
      pole.scale.setScalar(1 - 0.45 * exit);
    });
    astrals.forEach(({ side, angle, mesh }) => {
      mesh.visible = p < 0.83;
      k.setSegment(
        mesh,
        side * poleX,
        0,
        0,
        side * (poleX + 0.34),
        Math.cos(angle) * 0.42,
        Math.sin(angle) * 0.42,
        0.018,
      );
    });
    chromosomes.forEach((c) => {
      const i = c.index,
        side = c.side;
      const startX = [-0.68, 0.48, -0.25, 0.7][i];
      const y = (i - 1.5) * 0.87;
      const stalledOffset = blocked && i === 3 ? 0.55 * capture : 0;
      c.group.position.set(
        startX * (1 - align) + side * (0.12 + 1.82 * separate) + stalledOffset,
        y * (1 - 0.2 * exit),
        0.23 + (i % 2) * 0.13,
      );
      c.group.rotation.z = (1 - align) * (i % 2 ? -0.3 : 0.27);
      c.group.scale.setScalar(1 - exit * 0.12);
      const attached = !(blocked && i === 3 && side === 1);
      c.fibre.visible = p > 0.1 && p < 0.84;
      c.orientKinetochore(side, !attached);
      const { x: tx, y: ty, z: tz } = c.attachmentPoint();
      const reach = attached ? capture : capture * 0.58;
      k.setBundle(
        c.fibre,
        side * poleX,
        0,
        0,
        side * poleX + (tx - side * poleX) * reach,
        ty * reach,
        tz * reach,
        0.009 * (1 - ease(p, 0.74, 0.84)),
      );
      c.cohesion.visible = separate < 0.02 && side === -1;
      k.setSegment(
        c.cohesion,
        c.group.position.x,
        y,
        0.27,
        c.group.position.x + 0.24,
        y,
        0.27,
        0.045,
      );
    });
    overlaps.forEach(({ mesh, side, y, z }) => {
      mesh.visible = p > 0.1 && p < 0.84;
      k.setBundle(
        mesh,
        side * poleX * 0.94,
        y * 0.25,
        z + side * 0.022,
        -side * (0.72 - 0.3 * separate),
        y,
        z + side * 0.022,
        0.008 * (1 - ease(p, 0.74, 0.84)),
      );
    });
    labels[1].active = p < 0.83;
    labels[1].position[0] = -poleX;
    labels[2].active = p < 0.48;
    labels[3].active = p >= 0.68 && p < 0.94;
    labels[4].active = blocked && requested >= 0.4;
    labels[5].active = p >= 0.94;
    k.group.userData = {
      mechanism: "animal-mitosis",
      chromosomeScope:
        "four replicated chromosomes shown as a subset, not a karyotype",
      condition: blocked ? "unattached" : "bioriented",
      checkpointArrest: blocked && requested >= 0.43,
      effectiveProgress: p,
      sisterSeparation: separate,
      cytokinesisComplete: p >= 0.94,
      daughterCount: p >= 0.94 ? 2 : 1,
      spindleAttachments: blocked ? 7 : 8,
      microtubulesPerKinetochoreBundle: 5,
      chromosomeSurface:
        "schematic folded chromatin domains, not an atomic or 30-nm-fibre reconstruction",
      centrosomeArchitecture: "orthogonal centrioles with nine triplet sets",
      membraneRepresentation:
        "paired open-front shells with a visible cut edge",
      daughterEnvelopeAssembly: exit,
      abscissionTransition: abscission,
    };
  }
  update(0);
  return {
    group: k.group,
    materials: [...k.materials],
    update,
    labels,
    camera: { position: [0, 2.4, 11.5], target: [0, 0, 0] },
  };
}
export default {
  id: "mitosis",
  title: b("有丝分裂", "Mitosis"),
  duration: 32,
  intro: b(
    "哺乳动物体细胞的分裂示意。DNA 已复制，图中四条复制后的染色体只是子集，不代表物种核型。可保留一个未附着动粒，观察分离被检查点阻止；膜前侧剖开以观察内部，表面染色质组织不代表原子重建；时间和形状均经简化。",
    "A mammalian somatic cell after DNA replication. Four duplicated chromosomes are a schematic subset, not a species karyotype. Leave one kinetochore unattached to see the checkpoint block segregation. The membrane front is cut away; chromatin surface organization is schematic, not an atomic reconstruction. Shapes and timing are simplified.",
  ),
  controls: [
    {
      id: "attachment",
      label: b("动粒附着", "Kinetochore attachment"),
      default: "normal",
      options: [
        { value: "normal", label: b("完成双向附着", "Biorientation complete") },
        {
          value: "unattached",
          label: b("一个动粒未附着", "One unattached kinetochore"),
        },
      ],
    },
  ],
  legend: [
    {
      color: "#709895",
      text: b("复制后的染色体子集", "Subset of duplicated chromosomes"),
    },
    {
      color: "#caa060",
      text: b(
        "动粒、中心体与收缩环",
        "Kinetochores, centrosomes and contractile ring",
      ),
    },
    { color: "#9eafa9", text: b("纺锤体微管", "Spindle microtubules") },
  ],
  stages: [
    {
      at: 0,
      title: b("复制完成后的染色体", "Chromosomes after replication"),
      description: b(
        "每条染色体包含相连的两条姐妹染色单体，核膜开始解体，两个中心体建立纺锤体。",
        "Each chromosome has two joined sister chromatids. The nuclear envelope starts breaking down as two centrosomes organize the spindle.",
      ),
    },
    {
      at: 0.19,
      title: b("动粒捕获微管", "Kinetochore capture"),
      description: b(
        "微管连接到姐妹染色单体的动粒。正常情况下，两姐妹分别朝向相反的纺锤体极。",
        "Microtubules attach to sister kinetochores. Normally, the two sisters become oriented toward opposite spindle poles.",
      ),
    },
    {
      at: 0.37,
      title: b("中期与检查点", "Metaphase and checkpoint"),
      description: b(
        "染色体排列在赤道附近。若选中未附着条件，模型停留于此：姐妹不分离，也不完成胞质分裂。",
        "Chromosomes align near the equator. With an unattached kinetochore, the model arrests here: sisters remain joined and cytokinesis does not complete.",
      ),
    },
    {
      at: 0.49,
      title: b("姐妹分离", "Sister segregation"),
      description: b(
        "全部动粒正确附着后，姐妹间黏连被解除。姐妹分别成为子染色体，向两极移动。",
        "Once attachments are satisfied, sister cohesion is removed. Sisters become daughter chromosomes and move toward opposite poles.",
      ),
    },
    {
      at: 0.71,
      title: b("分裂沟内陷", "Cleavage furrow ingression"),
      description: b(
        "赤道处的肌动蛋白—肌球蛋白收缩环促使膜内陷。两个染色体集合周围重新形成核膜。",
        "An equatorial actomyosin ring drives membrane ingression. Nuclear envelopes re-form around the two chromosome sets.",
      ),
    },
    {
      at: 0.94,
      title: b("形成两个子细胞", "Two daughter cells"),
      description: b(
        "正常过程形成两个子细胞，各保留同样的染色体组成；检查点阻滞条件仍不进入此状态。",
        "Normal division yields two daughters with the same chromosome complement. The checkpoint-arrest condition never enters this state.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Mastronarde et al. (1993): Interpolar spindle microtubules in PTK cells",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2290872/",
    },
    {
      title: "Alberts et al. Molecular Biology of the Cell: Mitosis",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26934/",
    },
    {
      title: "Alberts et al. Molecular Biology of the Cell: Cytokinesis",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26831/",
    },
  ],
  create,
};
