import { clamp, ease, bilingual as b } from "../../kit.js";
import { divisionKit } from "./divisionShapes.js";
import { germCellMembrane } from "./germCellMembrane.js";

function create() {
  const k = divisionKit();
  const membrane = germCellMembrane(k);
  const products = [-1, 1].flatMap((side) =>
    [-1, 1].map((up) => ({ side, up })),
  );
  const nuclei = products.map(({ side, up }) =>
    k.envelope([side * 2.05, up * 1.32, 0.05], [1.16, 0.8, 0.72]),
  );
  const parentalEnvelope = k.envelope([0, 0, 0], [2.05, 1.6, 0.9]);
  const firstRing = k.contractileRing();
  firstRing.rotation.y = Math.PI / 2;
  const secondRings = [-1, 1].map((side) => {
    const r = k.contractileRing();
    r.position.x = side * 2.05;
    r.rotation.x = Math.PI / 2;
    return r;
  });
  const polesI = [-1, 1].map((side) => {
    const pole = k.centrosome();
    pole.position.x = side * 2.7;
    pole.scale.setScalar(0.8);
    return pole;
  });
  const polesII = [-1, 1].flatMap((side) =>
    [-1, 1].map((up) => {
      const mesh = k.centrosome();
      mesh.scale.setScalar(0.67);
      mesh.position.set(side * 2.05, up * 1.9, 0);
      return { mesh, side, up };
    }),
  );
  const chromosomes = [0, 1].flatMap((pair) =>
    [-1, 1].flatMap((homolog) =>
      [-1, 1].map((sister) => {
        const mat = homolog === -1 ? k.green : k.purple;
        const c = k.chromatid(sister, pair ? 0.49 : 0.65, mat, k.group, {
          telocentric: true,
        });
        return {
          ...c,
          pair,
          homolog,
          sister,
          base: mat,
          exchanged: homolog === -1 ? k.purple : k.green,
          fibre: k.bundle(),
          cohesion: k.line(k.gold),
        };
      }),
    ),
  );
  const chiasmata = [0, 1].map((pair) => ({
    pair,
    marker: Object.assign(k.ring([0, 0, 0.24], 0.065, 0.014, k.gold), {
      name: "chiasma-at-reciprocal-exchange",
    }),
  }));
  const synapses = [0, 1].flatMap((pair) =>
    Array.from({ length: 15 }, (_, i) => (i - 7) / 7).map((rung) => ({
      pair,
      rung,
      mesh: k.line(k.gold),
    })),
  );
  const labels = [
    k.label(
      [0, 2.95, 0],
      "小鼠精母细胞 · 仅示两对常染色体",
      "Mouse spermatocyte · two autosomal pairs shown",
      10,
    ),
    k.label(
      [0, 1.6, 0.6],
      "同源配对与非姐妹间交换",
      "Homolog pairing and nonsister crossover",
      8,
    ),
    k.label(
      [0, -2.15, 0.5],
      "第一次分裂：同源染色体分离",
      "Meiosis I: homologs separate",
      7,
    ),
    k.label(
      [0, -2.8, 0.5],
      "第二次分裂：姐妹染色单体分离",
      "Meiosis II: sisters separate",
      7,
    ),
    k.label([0, 0, 0.8], "保留胞质桥", "Cytoplasmic bridges retained", 5),
    k.label([0, 2.85, 0.5], "四个单倍体精细胞", "Four haploid spermatids", 9),
  ];
  function update(progress) {
    const p = clamp(progress);
    const pair = ease(p, 0.02, 0.17),
      cross = ease(p, 0.17, 0.27);
    const separateI = ease(p, 0.35, 0.51),
      pinchI = ease(p, 0.43, 0.56);
    const rotate = ease(p, 0.55, 0.64),
      separateII = ease(p, 0.7, 0.86),
      pinchII = ease(p, 0.8, 0.93);
    const final = ease(p, 0.88, 0.96);
    membrane.update(pinchI, pinchII);
    nuclei.forEach((n) => n.reveal(final));
    parentalEnvelope.reveal(1 - ease(p, 0.23, 0.29));
    firstRing.visible = p >= 0.43 && p < 0.56;
    firstRing.scale.set(
      1.35 * (1 - pinchI * 0.95),
      2.15 * (1 - pinchI * 0.95),
      1,
    );
    secondRings.forEach((r) => {
      r.visible = p >= 0.8 && p < 0.94;
      r.scale.set(1.58 * (1 - pinchII * 0.95), 1.15 * (1 - pinchII * 0.95), 1);
    });
    polesI.forEach((pole) => {
      pole.visible = p >= 0.25 && p < 0.57;
      pole.scale.setScalar(
        0.8 * ease(p, 0.25, 0.28) * (1 - ease(p, 0.51, 0.57)),
      );
    });
    polesII.forEach(({ mesh, side, up }) => {
      mesh.visible = p >= 0.58;
      mesh.scale.setScalar(0.67 * ease(p, 0.58, 0.63) * (1 - 0.4 * final));
      mesh.position.set(side * 2.05, up * (1.6 + separateII * 0.4), 0);
    });
    chromosomes.forEach((c) => {
      const { homolog, sister } = c;
      const pairY = c.pair === 0 ? 0.64 : -0.78;
      const homologX = homolog * (1.02 - pair * 0.57 + separateI * 1.6);
      const localOffset = sister * (0.13 + separateII * 1.12);
      // Homologs move left/right in I. Each stays on its side while sisters move up/down in II.
      const x =
        (1 - rotate) * (homologX + sister * 0.13) +
        rotate * (homolog * 2.05 + (c.pair === 0 ? -0.48 : 0.48));
      const y = (1 - rotate) * pairY + rotate * localOffset;
      c.group.position.set(x, y, 0.24);
      c.group.rotation.z = (Math.PI / 2) * rotate;
      c.group.scale.setScalar(1 - final * 0.3);
      const recombinant =
        (homolog === -1 && sister === 1) || (homolog === 1 && sister === -1);
      c.setDeflection(0);
      const exchange = c.axisPoint(c.exchangeY);
      // The two nonsister paths meet at the same homologous coordinate. Beyond
      // this junction each path crosses to the opposite side; it relaxes in I.
      if (recombinant)
        c.setDeflection(-exchange.x * Math.min(1, cross * 2) * (1 - separateI));
      c.setDistalMaterial(recombinant && cross >= 0.5 ? c.exchanged : c.base);
      const aI = p >= 0.28 && p < 0.55,
        aII = p >= 0.62 && p < 0.91;
      c.fibre.visible = aI || aII;
      if (aI) {
        // Both sister kinetochores of each homolog face the same pole in meiosis I.
        c.orientKinetochore(homolog);
        const target = c.attachmentPoint();
        k.setBundle(
          c.fibre,
          homolog * 2.7,
          0,
          0,
          target.x,
          target.y,
          target.z,
          0.009 * (aI ? 1 - ease(p, 0.51, 0.55) : 1 - ease(p, 0.86, 0.91)),
        );
      } else {
        c.orientKinetochore(sister);
        const target = c.attachmentPoint();
        // Rotation maps local x to y, preserving sister biorientation.
        k.setBundle(
          c.fibre,
          homolog * 2.05,
          sister * (1.6 + separateII * 0.4),
          0,
          target.x,
          target.y,
          target.z,
          0.009 * (aI ? 1 - ease(p, 0.51, 0.55) : 1 - ease(p, 0.86, 0.91)),
        );
      }
      c.cohesion.visible = sister === -1 && p < 0.705;
      if (rotate < 1)
        k.setSegment(
          c.cohesion,
          x,
          y,
          0.3,
          x + 0.26 * (1 - rotate),
          y + 0.26 * rotate,
          0.3,
          0.038,
        );
      else k.setSegment(c.cohesion, x, y, 0.3, x, y + 0.26, 0.3, 0.038);
    });
    chiasmata.forEach(({ pair: idx, marker }) => {
      const c = chromosomes.find(
        (c) => c.pair === idx && c.homolog === -1 && c.sister === 1,
      );
      const junction = c.axisPoint(c.exchangeY);
      marker.visible = cross >= 0.5 && p < 0.35;
      marker.position.copy(junction);
    });
    synapses.forEach(({ pair: idx, rung, mesh }) => {
      mesh.visible = p >= 0.12 && p < 0.24;
      const pairChromatids = chromosomes.filter((c) => c.pair === idx);
      const y = (rung + 1) * 0.5 * (idx ? 0.49 : 0.65);
      const left = pairChromatids[0]
        .axisPoint(y)
        .add(pairChromatids[1].axisPoint(y))
        .multiplyScalar(0.5);
      const right = pairChromatids[2]
        .axisPoint(y)
        .add(pairChromatids[3].axisPoint(y))
        .multiplyScalar(0.5);
      k.setSegment(
        mesh,
        left.x,
        left.y,
        left.z,
        right.x,
        right.y,
        right.z,
        0.01,
      );
    });
    labels[0].active = p < 0.94;
    labels[1].active = p < 0.3;
    labels[2].active = p >= 0.3 && p < 0.57;
    labels[3].active = p >= 0.57 && p < 0.94;
    labels[4].active = p >= 0.94;
    labels[4].position[1] = 1.32 * pinchII;
    labels[5].active = p >= 0.94;
    k.group.userData = {
      mechanism: "mouse-spermatocyte-meiosis",
      species: "Mus musculus",
      chromosomeScope:
        "two selected autosomal homolog pairs; other autosomes and sex chromosomes omitted",
      crossovers: cross >= 0.5 ? 2 : 0,
      homologSeparation: separateI,
      sisterSeparation: separateII,
      dnaReplicationBetweenDivisions: false,
      products: p >= 0.94 ? 4 : p >= 0.56 ? 2 : 1,
      ploidy: p >= 0.56 ? "haploid" : "diploid",
      chromatidsPerShownChromosome: p >= 0.86 ? 1 : 2,
      cytoplasmicBridgesRetained: p >= 0.56,
      complete: p >= 0.94,
      chromosomeSurface: "schematic folded chromatin with layered kinetochores",
      spindleMicrotubulesPerBundle: 5,
      nuclearEnvelopeAssembly: final,
      membraneDivisionTransitions: [pinchI, pinchII],
    };
  }
  update(0);
  return {
    group: k.group,
    materials: [...k.materials],
    update,
    labels,
    camera: { position: [0, 2.8, 12.8], target: [0, 0, 0] },
  };
}
export default {
  id: "meiosis",
  title: b("减数分裂", "Meiosis"),
  duration: 38,
  intro: b(
    "小鼠初级精母细胞经历两次分裂，形成四个单倍体精细胞。仅显示两对端着丝粒型常染色体；其余常染色体及性染色体省略，图中数量不代表核型。两次分裂间不复制 DNA；精细胞保留胞质桥，尚未成为成熟精子。膜前侧为观察剖面，染色质表面组织为示意。",
    "A mouse primary spermatocyte divides twice to produce four haploid spermatids. Only two telocentric autosomal pairs are drawn; remaining autosomes and sex chromosomes are omitted, so the drawing is not a karyotype. There is no DNA replication between divisions. Spermatids retain cytoplasmic bridges and are not yet mature sperm. Membranes have open-front cutaways; surface chromatin organization is schematic.",
  ),
  legend: [
    {
      color: "#709895",
      text: b("一方亲本来源的同源染色体", "Homologs from one parent"),
    },
    {
      color: "#a293b5",
      text: b("另一方亲本来源的同源染色体", "Homologs from the other parent"),
    },
    {
      color: "#caa060",
      text: b(
        "交叉点、动粒与收缩环",
        "Chiasmata, kinetochores and contractile rings",
      ),
    },
  ],
  stages: [
    {
      at: 0,
      title: b("已复制的同源染色体", "Replicated homologs"),
      description: b(
        "DNA 复制已经完成。每条同源染色体由两条姐妹染色单体组成，细胞仍为二倍体。",
        "DNA replication has finished. Each homolog consists of two sister chromatids; the cell remains diploid.",
      ),
    },
    {
      at: 0.14,
      title: b("联会与交换", "Synapsis and crossover"),
      description: b(
        "同源染色体配对。非姐妹染色单体间的互惠交换产生重组片段；交叉点与黏连帮助同源染色体保持联系。",
        "Homologs pair. Reciprocal exchange between nonsister chromatids creates recombinant segments; chiasmata and cohesion hold homologs together.",
      ),
    },
    {
      at: 0.28,
      title: b("第一次分裂中期", "Metaphase I"),
      description: b(
        "同源染色体朝向相反的极；同一条染色体的姐妹动粒共同朝向同一极。这里只展示一种排列方式。",
        "Homologs face opposite poles, while sister kinetochores of each homolog face the same pole. One possible orientation is shown.",
      ),
    },
    {
      at: 0.36,
      title: b("同源染色体分离", "Homolog segregation"),
      description: b(
        "同源染色体分开，姐妹仍相连。第一次分裂完成后，每个细胞只保留每对同源染色体中的一个成员。",
        "Homologs separate while sisters remain joined. After division I, each cell retains one member of every homologous pair.",
      ),
    },
    {
      at: 0.58,
      title: b("第二次分裂准备", "Prepare for meiosis II"),
      description: b(
        "中间没有 DNA 复制。两侧细胞各自建立纺锤体，姐妹动粒转为朝向相反的极。",
        "No DNA replication intervenes. Each secondary spermatocyte builds a spindle with sister kinetochores facing opposite poles.",
      ),
    },
    {
      at: 0.71,
      title: b("姐妹染色单体分离", "Sister chromatid segregation"),
      description: b(
        "剩余姐妹黏连解除，姐妹染色单体分开。本图将第二次分裂画成上下方向，以显示两次分离的区别。",
        "Remaining sister cohesion is released and sisters separate. The second division is drawn vertically to distinguish the two segregation events.",
      ),
    },
    {
      at: 0.94,
      title: b("四个单倍体产物", "Four haploid products"),
      description: b(
        "形成四个单倍体精细胞，交换片段保留在相应染色体上。胞质分裂不完全，细胞之间保留有开放内腔的膜桥，胞质保持连通。",
        "Four haploid spermatids retain their exchanged segments. Cytokinesis is incomplete: membrane-lined bridges retain open lumens and cytoplasmic continuity.",
      ),
    },
  ],
  sources: [
    {
      title: "Mouse Genetics: The mouse karyotype",
      url: "https://www.informatics.jax.org/silver/chapters/5-2.shtml",
    },
    {
      title: "Cooper. The Cell: Meiosis and Fertilization",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9901/",
    },
    {
      title:
        "Greenbaum et al. TEX14 is essential for intercellular bridges and fertility in male mice",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC1458781/",
    },
  ],
  create,
};
