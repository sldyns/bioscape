import { cellTypes } from "../catalog/cellTypes.js";
import { getNode, modelNotes } from "../hierarchy.js";
import { specializedSpecimens, specializedSpecimenIds } from "./specimens.js";

const text = (zh, en) => ({ zh, en });
const biology = (section, title) => ({
  title: `OpenStax · Biology 2e · ${title}`,
  url: `https://openstax.org/books/biology-2e/pages/${section}`,
});
const eukaryotes = biology("4-3-eukaryotic-cells", "Eukaryotic cells");
const bacteria = biology("4-2-prokaryotic-cells", "Prokaryotic cells");
const fungi = biology("24-1-characteristics-of-fungi", "Fungi");
const protists = biology("23-3-groups-of-protists", "Protists");
const viruses = biology(
  "21-1-viral-evolution-morphology-and-classification",
  "Viruses",
);

// These statements describe the selected examples, not every member of a taxon.
const rootFacts = {
  cell: {
    boundary: text("细胞膜；没有细胞壁。", "Plasma membrane; no cell wall."),
    genome: text("主要 DNA 位于细胞核内。", "Most DNA is within a nucleus."),
    organization: text(
      "具有线粒体和内膜系统。",
      "Mitochondria and an endomembrane system.",
    ),
    function: text(
      "一般化的动物细胞结构范例。",
      "A generalized animal-cell example.",
    ),
    sources: [eukaryotes],
  },
  plant: {
    boundary: text(
      "细胞膜外有富含纤维素的细胞壁。",
      "A cellulose-rich wall outside the plasma membrane.",
    ),
    genome: text(
      "主要 DNA 位于细胞核；叶绿体和线粒体也有 DNA。",
      "Nuclear DNA, plus DNA in chloroplasts and mitochondria.",
    ),
    organization: text(
      "此叶肉细胞含叶绿体和大液泡。",
      "This mesophyll example has chloroplasts and a large vacuole.",
    ),
    function: text(
      "进行光合作用；不代表所有植物细胞。",
      "Photosynthesis; not representative of every plant cell.",
    ),
    sources: [eukaryotes],
  },
  bacterium: {
    boundary: text(
      "本例有外膜、薄肽聚糖层及细胞膜。",
      "This example has an outer membrane, thin peptidoglycan, and plasma membrane.",
    ),
    genome: text(
      "拟核中的 DNA 不由核被膜包裹。",
      "Nucleoid DNA has no nuclear envelope.",
    ),
    organization: text(
      "有核糖体；没有细胞核。",
      "Ribosomes, without a membrane-bound nucleus.",
    ),
    function: text(
      "独立的原核细胞；以革兰阴性杆菌为例。",
      "A prokaryotic cell, represented by a Gram-negative rod.",
    ),
    sources: [bacteria],
  },
  yeast: {
    boundary: text(
      "细胞膜外有细胞壁；与植物壁的组成不同。",
      "A wall outside the membrane, with a different composition from plant walls.",
    ),
    genome: text("细胞核内有 DNA。", "DNA enclosed in a nucleus."),
    organization: text(
      "有线粒体和液泡，没有叶绿体。",
      "Mitochondria and vacuoles, without chloroplasts.",
    ),
    function: text(
      "酿酒酵母范例，图中芽体表示出芽生殖。",
      "Budding yeast; the daughter bud illustrates asexual reproduction.",
    ),
    sources: [fungi],
  },
  paramecium: {
    boundary: text(
      "细胞膜及皮层支撑表面，外有纤毛。",
      "Membrane and cortex support a ciliated surface.",
    ),
    genome: text(
      "大核与小核承担不同的遗传功能。",
      "Macronucleus and micronucleus have distinct genetic roles.",
    ),
    organization: text(
      "食物泡参与消化，伸缩泡参与水分调节。",
      "Food vacuoles digest food; contractile vacuoles regulate water.",
    ),
    function: text(
      "一个能运动、取食的单细胞真核生物。",
      "A motile, feeding, single-celled eukaryote.",
    ),
    sources: [protists],
  },
  phage: {
    boundary: text(
      "蛋白质衣壳包裹基因组；此有尾噬菌体不是细胞。",
      "A protein capsid encloses the genome; this tailed phage is not a cell.",
    ),
    genome: text(
      "本例的 DNA 包装在头部衣壳中。",
      "In this example, DNA is packaged in the head capsid.",
    ),
    organization: text(
      "头部、尾部与附着结构；没有核糖体。",
      "Head, tail, and attachment structures; no ribosomes.",
    ),
    function: text(
      "感染细菌，繁殖依赖宿主细胞。",
      "Infects bacteria and requires host cells to reproduce.",
    ),
    sources: [viruses],
  },
};

const entries = [];
const seen = new Set();
const regularCellTypes = cellTypes.filter(
  (root) => !specializedSpecimenIds.has(root.id),
);
for (const root of regularCellTypes) {
  function visit(id, trail = []) {
    if (seen.has(id)) return;
    seen.add(id);
    const zh = getNode(id, "zh");
    const en = getNode(id, "en");
    entries.push({
      id,
      rootId: root.id,
      zh: zh.name,
      en: en.name,
      trail,
      summary: text(zh.desc, en.desc),
      scope:
        modelNotes[id] ||
        (id === "cell"
          ? text(
              "一般化的动物细胞；颜色、数量与比例经过教学调整。",
              "A generalized animal cell; colors, counts, and proportions are illustrative.",
            )
          : text(
              "局部结构经放大，颜色和比例用于观察；不表示统一的真实尺度。",
              "An enlarged structural view; colors and proportions aid observation, without a shared physical scale.",
            )),
      facts: rootFacts[id] || null,
      sources: rootFacts[id]?.sources || [],
      color: zh.color,
    });
    for (const child of zh.children || []) visit(child, [...trail, id]);
  }
  visit(root.id);
}
for (const specimen of specializedSpecimens) {
  entries.push({
    ...specimen,
    rootId: "specialized",
    trail: [],
    zh: specimen.zh || specimen.name?.zh || specimen.title?.zh,
    en: specimen.en || specimen.name?.en || specimen.title?.en,
  });
  for (const part of specimen.parts) {
    entries.push({
      ...part,
      rootId: "specialized",
      trail: [specimen.id],
      summary: part.desc,
      scope: specimen.scope,
      facts: null,
      sources: specimen.sources,
    });
  }
}

export const comparisonEntries = entries;
export const comparisonIds = entries.map((entry) => entry.id);
const entryById = new Map(entries.map((entry) => [entry.id, entry]));
export const getComparisonEntry = (id) =>
  entryById.get(id) || entryById.get("cell");
export const comparisonGroups = [
  ...regularCellTypes.map((type) => ({
    ...type,
    entries: entries.filter((entry) => entry.rootId === type.id),
  })),
  {
    id: "specialized",
    zh: "人体特化细胞",
    en: "Specialized human cells",
    entries: entries.filter((entry) => entry.rootId === "specialized"),
  },
];

export function comparisonRows(leftId, rightId, lang = "zh") {
  const left = getComparisonEntry(leftId);
  const right = getComparisonEntry(rightId);
  const language = lang === "en" ? "en" : "zh";
  const rows = [
    {
      key: "focus",
      label: language === "en" ? "Model focus" : "观察对象",
      left: left.summary[language],
      right: right.summary[language],
    },
  ];
  if (left.facts && right.facts)
    for (const [key, zh, en] of [
      ["boundary", "边界与表面", "Boundary & surface"],
      ["genome", "遗传物质", "Genetic material"],
      ["organization", "内部组织", "Organization"],
      ["function", "功能与形态", "Function & form"],
    ]) {
      if (left.facts[key]?.[language] && right.facts[key]?.[language])
        rows.push({
          key,
          label: language === "en" ? en : zh,
          left: left.facts[key][language],
          right: right.facts[key][language],
        });
    }
  rows.push({
    key: "scope",
    label: language === "en" ? "Scope of this model" : "模型范围",
    left: left.scope?.[language],
    right: right.scope?.[language],
  });
  return rows;
}

// Empty search starts with the nine whole models. A category reveals its parts;
// search matches bilingual names and complete ancestry without duplicating IDs.
export function searchComparisonEntries(query = "", group = "") {
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const results = entries.filter((entry) => {
    if (group && entry.rootId !== group) return false;
    if (!terms.length) return group || !entry.trail.length;
    const names = [entry, ...entry.trail.map((id) => entryById.get(id))]
      .filter(Boolean)
      .flatMap((item) => [item.zh, item.en])
      .join(" ")
      .toLocaleLowerCase();
    return terms.every((term) => names.includes(term));
  });
  if (!terms.length) return results;
  // Keep ancestry matches available, but lead with the structure actually named
  // by the query ("myelin" should not bury Myelin below every neuronal part).
  const phrase = terms.join(" ");
  const rank = (entry) => {
    const names = [entry.zh, entry.en].map((name) => name.toLocaleLowerCase());
    const words = names.join(" ").split(/[^\p{L}\p{N}]+/u);
    return (
      (names.includes(phrase) ? 20 : 0) +
      terms.reduce(
        (score, term) =>
          score +
          (words.includes(term)
            ? 4
            : names.some((name) => name.includes(term))
              ? 2
              : 0),
        0,
      )
    );
  };
  return results
    .map((entry) => ({ entry, rank: rank(entry) }))
    .sort((a, b) => b.rank - a.rank)
    .map(({ entry }) => entry);
}
