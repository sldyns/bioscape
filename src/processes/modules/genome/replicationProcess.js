import { createReplication } from "./nuclearModels.js";
import { bilingual as b } from "../../kit.js";

const model = {
  id: "replication",
  title: b("DNA 复制叉", "DNA replication fork"),
  duration: 36,
  intro: b(
    "真核细胞核中一个向右推进的复制叉。两条亲本链反向平行；新 DNA 均以 5′→3′ 合成。模型展开局部 DNA，省略染色质和复制起始；长度、速度与酶大小不按比例。可关闭连接酶观察残留切口。",
    "One rightward-moving replication fork in a eukaryotic nucleus. Parental strands are antiparallel; both new strands grow 5′→3′. Local DNA is spread out; chromatin and initiation are omitted. Lengths, rates and enzyme sizes are schematic. Disable ligase to reveal persistent nicks.",
  ),
  controls: [
    {
      id: "ligase",
      label: b("DNA 连接酶", "DNA ligase"),
      default: "active",
      options: [
        { value: "active", label: b("正常工作", "Active") },
        { value: "absent", label: b("缺失：切口保留", "Absent: nicks remain") },
      ],
    },
  ],
  stages: [
    {
      at: 0,
      title: b("反向平行模板", "Antiparallel templates"),
      description: b(
        "从已建立的复制叉开始。上方模板从左到右为 3′→5′，下方模板为 5′→3′。",
        "Begin at an established fork. The upper template runs 3′→5′ from left to right; the lower template runs 5′→3′.",
      ),
    },
    {
      at: 0.12,
      title: b("解开双链", "Unwind the duplex"),
      description: b(
        "解旋酶打开亲本双链，暴露两个模板；复制叉向右推进。",
        "Helicase opens the parental duplex, exposing both templates as the fork advances rightward.",
      ),
    },
    {
      at: 0.28,
      title: b("连续与分段合成", "Continuous and discontinuous synthesis"),
      description: b(
        "前导链朝向复制叉连续延伸。后随链从靠近复制叉的新引物开始，向左形成冈崎片段；两者均为 5′→3′。",
        "The leading strand extends toward the fork. Each new lagging-strand primer starts an Okazaki fragment growing leftward, away from the fork. Both syntheses are 5′→3′.",
      ),
    },
    {
      at: 0.58,
      title: b("重复引发", "Repeated priming"),
      description: b(
        "引物酶与聚合酶 α 为新片段建立 RNA–DNA 起点。示意图用金色突出短 RNA 区段。",
        "Primase and polymerase α establish RNA–DNA starts for new fragments. Gold highlights their short RNA regions in this schematic.",
      ),
    },
    {
      at: 0.79,
      title: b("引物成熟", "Primer maturation"),
      description: b(
        "RNA 引物被移除，缺口由 DNA 补齐。片段间仍可能保留糖磷酸骨架上的切口。",
        "RNA primers are removed and replaced with DNA. Nicks can remain in the sugar–phosphate backbone between fragments.",
      ),
    },
    {
      at: 0.92,
      title: b("封口与半保留复制", "Ligation and semiconservative copying"),
      description: b(
        "连接酶封闭片段间切口；关闭连接酶时切口仍可见。每条子代双链包含一条亲本链和一条新链。这里只展示局部区段，并非整条染色体完成。",
        "Ligase seals fragment junctions; disabling it leaves visible nicks. Each daughter duplex contains one parental and one new strand. This is a local segment, not completion of an entire chromosome.",
      ),
    },
  ],
  sources: [
    {
      title: "RCSB PDB 5U8T — CMG helicase at a replication fork",
      url: "https://www.rcsb.org/structure/5U8T",
    },
    {
      title: "NCBI Bookshelf — DNA Replication Mechanisms",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26850/",
    },
    {
      title: "Eukaryotic DNA Replication Fork (2017)",
      url: "https://pubmed.ncbi.nlm.nih.gov/28301743/",
    },
    {
      title: "Mechanism of Lagging-Strand DNA Replication in Eukaryotes",
      url: "https://pubmed.ncbi.nlm.nih.gov/29357056/",
    },
  ],
  create: createReplication,
};
export default model;
