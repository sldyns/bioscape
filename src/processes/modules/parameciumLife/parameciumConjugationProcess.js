import { THREE, sceneKit, clamp, ease, bilingual as b } from "../../kit.js";
import { nuclearCell } from "./nuclearCell.js";
import { nuclearDetail } from "./fineStructure.js";

export default {
  id: "parameciumConjugation",
  title: b(
    "草履虫接合：交换与核更新",
    "Paramecium conjugation: exchange and nuclear renewal",
  ),
  duration: 40,
  intro: b(
    "尾草履虫的相容配偶暂时接合，交换单倍体原核并各自形成合核。模型追踪到合核后代分化为大核原基与保留小核；末期单小核的选择展示恢复营养供给后的代表性过程；持续饥饿时多个候选小核可保留。后续两次细胞分裂未展开。颜色标示亲本来源，核数量依此物种。",
    "Compatible P. caudatum partners temporarily join, exchange haploid pronuclei and each form a synkaryon. The model ends with macronuclear anlagen and a retained micronucleus; the final selection of one micronucleus represents nutritionally supported postconjugational development; multiple candidates may persist under continued starvation. Two subsequent cell fissions are omitted. Colors identify parental origin and nuclear counts are species-specific.",
  ),
  stages: [
    {
      at: 0,
      title: b("相容配偶暂时连接", "Compatible partners join temporarily"),
      description: b(
        "两个细胞在口区接触并形成细胞间通路。接合本身不增加细胞数，配偶也不会融合成一个永久细胞。",
        "Two cells contact at their oral regions and establish an intercellular passage. Conjugation itself does not increase cell number or permanently fuse the partners.",
      ),
    },
    {
      at: 0.14,
      title: b("小核减数分裂", "Micronuclear meiosis"),
      description: b(
        "每个尾草履虫的一个二倍体小核经两次减数分裂产生四个单倍体核。大核不参加减数分裂。",
        "The single diploid micronucleus in each P. caudatum undergoes two meiotic divisions, producing four haploid nuclei. The macronucleus does not undergo meiosis.",
      ),
    },
    {
      at: 0.32,
      title: b("选择保留核", "One meiotic product is retained"),
      description: b(
        "靠近口区的一个单倍体核保留，另外三个退化。大核开始碎裂，其片段不会立即全部消失。",
        "One haploid nucleus near the oral region is retained while the other three degenerate. The old macronucleus fragments; its remnants do not all disappear immediately.",
      ),
    },
    {
      at: 0.44,
      title: b("形成两个原核", "Two pronuclei form"),
      description: b(
        "保留的单倍体核再有丝分裂一次，形成留居原核和迁移原核；两者仍为单倍体。",
        "The retained haploid nucleus divides mitotically to form stationary and migratory pronuclei; both remain haploid.",
      ),
    },
    {
      at: 0.55,
      title: b("双向交换迁移原核", "Reciprocal pronuclear exchange"),
      description: b(
        "每个配偶把迁移原核送给对方，自己的留居原核保留。通路内两种颜色分别表示两个亲本来源。",
        "Each partner transfers its migratory pronucleus while retaining its stationary one. The two colors in the passage represent the two parental origins.",
      ),
    },
    {
      at: 0.68,
      title: b("各自融合成二倍体合核", "Each cell forms a diploid synkaryon"),
      description: b(
        "外来的迁移原核与本地留居原核融合，恢复二倍体；随后配偶分离，各自保有来自双方的遗传材料。",
        "An incoming migratory pronucleus fuses with the resident stationary pronucleus, restoring diploidy. Partners separate, each retaining genetic contributions from both.",
      ),
    },
    {
      at: 0.8,
      title: b("核分化与大核更新", "Nuclear differentiation and renewal"),
      description: b(
        "合核连续分裂三次形成八个核：后部四个成为大核原基；恢复营养供给后，前部四个中选择保留一个小核。旧大核片段可继续存在，之后逐渐丢失。后续两次横裂分配新大核。",
        "Three synkaryon divisions produce eight nuclei: four posterior nuclei become macronuclear anlagen and, following nutrient provision, one of four anterior micronuclear candidates is retained. Old macronuclear fragments can persist before eventual loss. Two later fissions distribute the new macronuclei.",
      ),
    },
  ],
  sources: [
    {
      title:
        "Nutrient supply induces germinal nuclear selection in exconjugants of Paramecium caudatum",
      url: "https://www.jstage.jst.go.jp/article/pjab1977/76/7/76_7_87/_article/-char/en",
    },
    {
      title: "Microtubules mediate germ-nuclear behavior in P. caudatum (2002)",
      url: "https://pubmed.ncbi.nlm.nih.gov/11908901/",
    },
    {
      title: "Micromanipulation in Paramecium (2022): nuclear life cycle",
      url: "https://pubmed.ncbi.nlm.nih.gov/35318763/",
    },
    {
      title:
        "Mikami (1985): Nuclear differentiation in P. caudatum exconjugants",
      url: "https://pubmed.ncbi.nlm.nih.gov/37281122/",
    },
    {
      title:
        "Mikami et al. (2003): Persistence of maternal macronuclear fragments",
      url: "https://pubmed.ncbi.nlm.nih.gov/12919103/",
    },
  ],
  create() {
    const k = sceneKit(),
      { group } = k;
    const colors = ["#77a9a7", "#c6a075"],
      nuclearMats = colors.map((c) =>
        k.material(c, { transparent: true, opacity: 0.75 }),
      ),
      oldMat = k.material("#b3a7bd", { transparent: true, opacity: 0.48 });
    const halfGeometry = new THREE.SphereGeometry(
      1,
      20,
      14,
      Math.PI,
      Math.PI / 2,
    );
    function mixedNucleus(parent, r = 0.2) {
      const g = new THREE.Group();
      parent.add(g);
      for (let j = 0; j < 2; j++) {
        const o = k.mesh(halfGeometry, nuclearMats[j], [0, 0, 0], g);
        o.rotation.y = j * Math.PI;
      }
      const structure = k.ball([0, 0, 0], 0.96, k.material("#bda58d"), g);
      nuclearDetail(k, structure, false);
      g.children.slice(0, 2).forEach((o) => {
        o.geometry = halfGeometry;
        o.material = k.material(o.material.color.getHex(), {
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        });
      });
      g.scale.setScalar(r);
      return g;
    }
    const cells = [];
    for (let i = 0; i < 2; i++) {
      const cell = new THREE.Group();
      group.add(cell);
      cell.scale.x = i ? -1 : 1;
      nuclearCell(k, cell, {
        length: 2.65,
        width: 1.01,
        color: i ? "#c8bca4" : "#a8c3b4",
      });
      k.tube(
        [
          [0.74, 0.66, 0.43],
          [0.68, 0.18, 0.48],
          [0.59, -0.3, 0.49],
        ],
        0.1,
        k.material("#b6a17f"),
        cell,
      );
      const old = k.ball([-0.29, 0.65, 0.26], [0.38, 0.62, 0.25], oldMat, cell);
      const oldFragments = [];
      for (let j = 0; j < 8; j++)
        oldFragments.push(
          k.ball(
            [
              -0.4 + Math.cos(j * 2.4) * 0.32,
              0.65 + Math.sin(j * 2.4) * 0.57,
              0.28,
            ],
            [0.1, 0.14, 0.075],
            oldMat,
            cell,
          ),
        );
      const meiotic = [];
      for (let j = 0; j < 4; j++)
        meiotic.push(k.ball([0, 0, 0], 0.18, nuclearMats[i], cell));
      const stationary = k.ball(
        [0.36, -0.13, 0.54],
        0.18,
        nuclearMats[i],
        cell,
      );
      const syn = mixedNucleus(cell, 0.26);
      syn.position.set(0.3, 0, 0.54);
      const descendants = [];
      for (let j = 0; j < 8; j++) {
        const g = mixedNucleus(cell, 0.15);
        descendants.push(g);
      }
      const anlagen = [];
      for (let j = 0; j < 4; j++)
        anlagen.push(
          k.ball(
            [0, 0, 0],
            [0.23, 0.31, 0.2],
            k.material("#9d8bae", { transparent: true, opacity: 0.73 }),
            cell,
          ),
        );
      const retained = k.ball([0.17, 1.28, 0.48], 0.18, nuclearMats[i], cell);
      nuclearDetail(k, old, true);
      meiotic.forEach((o) => nuclearDetail(k, o, false));
      nuclearDetail(k, stationary, false);
      anlagen.forEach((o) => nuclearDetail(k, o, true));
      cells.push({
        cell,
        old,
        oldFragments,
        meiotic,
        stationary,
        syn,
        descendants,
        anlagen,
        retained,
      });
    }
    const passage = k.segment(
      [-0.45, 0, 0.35],
      [0.45, 0, 0.35],
      0.19,
      k.material("#c4bba0", {
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    );
    const passageRim = k.ring([0, 0, 0.35], 0.23, 0.033, k.material("#a99c80"));
    passageRim.rotation.y = Math.PI / 2;
    const migrants = [
      k.ball([0, 0, 0], 0.18, nuclearMats[0]),
      k.ball([0, 0, 0], 0.18, nuclearMats[1]),
    ];
    migrants.forEach((o) => nuclearDetail(k, o, false));
    const labels = [
      k.label([-2.1, 2.85, 0.4], "配偶 A", "Partner A", 2),
      k.label([2.1, 2.85, 0.4], "配偶 B", "Partner B", 2),
      k.label([-1.9, 1.0, 0.6], "旧大核", "Old macronucleus", 2),
      k.label([-0.85, 0.6, 0.7], "小核 · 二倍体", "Micronucleus · diploid", 3),
      k.label([0, -0.5, 0.75], "接合通路", "Conjugation passage", 3),
      k.label([-1.4, -1.7, 0.6], "新大核原基", "New macronuclear anlagen", 3),
    ];
    function update(progress) {
      const p = clamp(progress),
        approach = ease(p, 0, 0.12),
        leave = ease(p, 0.74, 0.84),
        cx = 1.55 - 0.48 * approach + 0.52 * leave;
      const first = ease(p, 0.14, 0.22),
        second = ease(p, 0.23, 0.3),
        selection = ease(p, 0.32, 0.42),
        pronuclear = ease(p, 0.44, 0.53),
        exchange = ease(p, 0.55, 0.67),
        fusion = ease(p, 0.68, 0.75),
        development = ease(p, 0.92, 0.975),
        selectMicro = ease(p, 0.975, 1);
      cells.forEach((c, i) => {
        c.cell.position.x = (i ? 1 : -1) * cx;
        c.old.visible = p < 0.37;
        c.old.scale.set(0.38 * (1 - 0.5 * selection), 0.62, 0.25);
        c.oldFragments.forEach((o) => {
          o.visible = p >= 0.37;
        });
        c.meiotic.forEach((o, j) => {
          o.visible =
            p < 0.445 && (j === 0 || (p >= 0.14 && (j < 2 || p >= 0.23)));
          const x = 0.2 + (j % 2 ? 0.18 : -0.18) * first,
            y = 0.05 + (j < 2 ? 1 : -1) * (0.18 + second * 0.22);
          o.position.set(x, y, 0.54);
          o.scale.setScalar(0.18 * (j === 0 ? 1 : 1 - selection));
          if (j === 0) {
            o.position.x = x + (0.36 - x) * selection;
            o.position.y = y + (-0.13 - y) * selection;
          }
        });
        c.stationary.visible = p >= 0.445 && p < 0.75;
        c.stationary.position.set(
          0.36 - 0.06 * fusion,
          -0.13 * (1 - fusion),
          0.54,
        );
        c.stationary.scale.setScalar(0.18 * (1 - 0.75 * fusion));
        c.syn.visible = p >= 0.72 && p < 0.82;
        c.syn.scale.setScalar(0.26 * ease(p, 0.7, 0.75));
        // Three divisions: one to two, two to four, four to eight. No new nuclei allocated during playback.
        const n = p < 0.85 ? 2 : p < 0.89 ? 4 : 8;
        c.descendants.forEach((o, j) => {
          o.visible =
            p >= 0.82 && j < n && (j < 4 ? p < 0.978 : p < 0.985 || j === 4);
          const side = j < 4 ? -1 : 1,
            index = j % 4;
          const targetX = (index % 2 ? 1 : -1) * 0.31,
            targetY = side * (0.87 + Math.floor(index / 2) * 0.49);
          const spread = ease(p, 0.82, 0.93);
          o.position.set(
            0.3 * (1 - spread) + targetX * spread,
            targetY * spread,
            0.48,
          );
          o.scale.setScalar(0.15 * (j >= 5 ? 1 - selectMicro : 1));
        });
        c.anlagen.forEach((o, j) => {
          o.visible = p >= 0.94;
          o.position.set(
            (j % 2 ? 1 : -1) * 0.31,
            -0.87 - Math.floor(j / 2) * 0.49,
            0.48,
          );
          o.scale.set(
            0.23 * development,
            0.31 * development,
            0.2 * development,
          );
        });
        c.retained.visible = false;
      });
      passage.visible = p >= 0.09 && p < 0.77;
      passageRim.visible = passage.visible;
      migrants.forEach((o, i) => {
        const sign = i ? 1 : -1,
          source = sign * (cx - 0.62),
          dest = -sign * (cx - 0.36);
        o.position.set(
          source + (dest - source) * exchange,
          sign * 0.12 * (1 - fusion),
          0.57,
        );
        o.scale.setScalar(
          0.18 * (0.45 + 0.55 * pronuclear) * (1 - 0.75 * fusion),
        );
        o.visible = p >= 0.445 && p < 0.75;
      });
      labels[0].position[0] = -cx;
      labels[1].position[0] = cx;
      labels[2].position[0] = -cx - 0.38;
      labels[2].text =
        p < 0.37
          ? b("旧大核", "Old macronucleus")
          : b("旧大核片段 · 暂时保留", "Old macronuclear fragments · persist");
      labels[3].position[0] = -cx + 0.25;
      labels[3].text =
        p < 0.14
          ? b("小核 · 二倍体", "Micronucleus · diploid")
          : p < 0.44
            ? b("减数产物 · 单倍体", "Meiotic products · haploid")
            : p < 0.68
              ? b("原核 · 单倍体", "Pronuclei · haploid")
              : p < 0.82
                ? b("合核 · 二倍体", "Synkaryon · diploid")
                : b("合核后代", "Synkaryon descendants");
      labels[4].active = p >= 0.09 && p < 0.77;
      labels[5].active = p >= 0.94;
      labels[5].position[0] = -cx;
      group.userData = {
        species: "Paramecium caudatum",
        cellCount: 2,
        meiosis: p >= 0.14 && p < 0.32,
        meioticProductsPerCell: p >= 0.3 ? 4 : p >= 0.22 ? 2 : 1,
        retainedHaploidPerCell: p >= 0.42 ? 1 : 0,
        reciprocalExchange: exchange,
        synkaryonDiploid: p >= 0.75,
        postzygoticDivisions: p < 0.82 ? 0 : p < 0.85 ? 1 : p < 0.89 ? 2 : 3,
        newMacronuclearAnlagenPerCell: p >= 0.975 ? 4 : 0,
        retainedMicronucleiPerExconjugant: p >= 0.999 ? 1 : 0,
        oldMacronuclearFragmentsPersist: p >= 0.37,
        subsequentFissionsOmitted: true,
        progress: p,
      };
    }
    update(0);
    return {
      group,
      update,
      labels,
      camera: { position: [0, 0.8, 12], target: [0, 0, 0] },
    };
  },
};
