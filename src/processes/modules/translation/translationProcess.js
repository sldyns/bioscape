import { bilingual as b } from "../../kit.js";
import { createTranslation as create } from "./translationReaction.js";

export default {
  id: "translation",
  title: b("核糖体翻译", "Ribosomal translation"),
  duration: 32,
  intro: b(
    "左侧为人 80S 核糖体 4UG0 实验骨架，蓝灰色为 rRNA、金色为蛋白；两个亚基保持共同坐标。右侧单独放大末轮延长与终止的连接关系，并非拟合到左侧的原子运动。其他真核场景采用此人源结构作代表。读码为 5′→3′，肽链增长为 N→C。",
    "Left: human 80S experimental backbone 4UG0, with blue-grey rRNA and gold proteins in one registered assembly. Right: a separate enlargement of the connectivity and order of the final elongation round and termination, not fitted atomic motion. Other eukaryotic contexts use this human structure as a representative. Reading is 5′→3′; growth is N→C.",
  ),
  stages: [
    {
      at: 0,
      title: b("带肽 tRNA 位于 P 位点", "Peptidyl-tRNA occupies P"),
      description: b(
        "场景从延长中途开始。P 位点 tRNA 承载已有肽链，A 位点等待下一个氨酰 tRNA。",
        "The scene begins during elongation. P-site tRNA carries the growing peptide; the A site awaits an aminoacyl-tRNA.",
      ),
    },
    {
      at: 0.13,
      title: b("密码子与反密码子配对", "Codon–anticodon pairing"),
      description: b(
        "氨酰 tRNA 进入 A 位点，在小亚基侧与 mRNA 配对；携带氨基酸的末端朝向大亚基催化中心。选择与因子循环经过简化。",
        "An aminoacyl-tRNA pairs with the mRNA at the small subunit; its aminoacyl end approaches the large-subunit catalytic center. Selection and factor cycling are simplified.",
      ),
    },
    {
      at: 0.33,
      title: b("肽链从 P 转移到 A", "Peptide transfer from P to A"),
      description: b(
        "大亚基 rRNA 催化肽键形成。原有肽链转移到 A 位点 tRNA 所带氨基酸上，新增残基成为链的 C 端。",
        "Large-subunit rRNA catalyzes peptide-bond formation. The existing peptide transfers to the A-site amino acid, adding a new C-terminal residue.",
      ),
    },
    {
      at: 0.53,
      title: b("移位一个密码子", "Translocate by one codon"),
      description: b(
        "tRNA 从 A→P、P→E 移动，随后空载 tRNA 离开。采用核糖体固定视角，mRNA 向左移动一个密码子；核糖体相对 mRNA 向 3′ 端推进。",
        "tRNAs shift A→P and P→E, then deacylated tRNA exits. In this ribosome-fixed view, mRNA moves left by one codon: the ribosome advances toward its 3′ end.",
      ),
    },
    {
      at: 0.73,
      title: b("释放因子识别终止信号", "Release factor recognizes termination"),
      description: b(
        "所选末轮后，终止信号到达 A 位点，释放因子代替 tRNA 进入。终止密码子的含义取决于遗传密码表；草履虫核编码基因中 UAA/UAG 可编码谷氨酰胺。",
        "After this selected final round, a stop signal reaches A and a release factor enters instead of tRNA. Stop assignments depend on the genetic code; in Paramecium nuclear genes, UAA/UAG can encode glutamine.",
      ),
    },
    {
      at: 0.88,
      title: b("肽链水解释放", "Hydrolytic peptide release"),
      description: b(
        "释放因子促使肽酰 tRNA 的酯键水解，完整肽链从出口通道离开。左侧实验结构保持静止作为参考；后续亚基回收不在本段动画中展开。",
        "Release-factor action hydrolyzes the peptidyl-tRNA ester bond and the intact chain leaves the exit path. The experimental assembly remains a static reference; subsequent subunit recycling is outside this animation.",
      ),
    },
  ],
  legend: [
    {
      color: "#bd9969",
      text: b("mRNA 与三联体位置", "mRNA and codon positions"),
    },
    { color: "#709b94", text: b("原 P 位点 tRNA", "Original P-site tRNA") },
    { color: "#b78eac", text: b("进入的氨酰 tRNA", "Incoming aminoacyl-tRNA") },
    { color: "#d59a6e", text: b("多肽", "Polypeptide") },
  ],
  sources: [
    {
      title: "RCSB 4UG0 · Human 80S ribosome",
      url: "https://www.rcsb.org/structure/4UG0",
    },
    {
      title: "Structure of the actively translating plant 80S ribosome",
      url: "https://www.nature.com/articles/s41477-023-01407-y",
    },
    {
      title: "NCBI Bookshelf · From RNA to Protein",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK26829/",
    },
    {
      title: "NCBI · Ciliate nuclear genetic code",
      url: "https://www.ncbi.nlm.nih.gov/Taxonomy/Utils/wprintgc.cgi",
    },
    {
      title: "NCBI Bookshelf · Translation of mRNA",
      url: "https://www.ncbi.nlm.nih.gov/books/NBK9849/",
    },
    {
      title: "Noncanonical usage of stop codons in ciliates",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10942620/",
    },
  ],
  create,
};
