import React from "react";
import { project } from "../project";
import { assetUrl } from "../assetUrl";
import { X } from "lucide-react";
import { microbeNuclearSources } from "../catalog/microbes";
export default function AboutModel({ t, aboutRef, onClose }) {
  return (
    <div className="modal-backdrop" onClick={() => onClose()}>
      <section
        className="about-modal"
        ref={aboutRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close-button icon-button"
          onClick={() => onClose()}
          aria-label={t("关闭", "Close")}
        >
          <X size={20} />
        </button>
        <p className="about-eyebrow">
          {t("从结构，到生命活动", "From structure to living processes")}
        </p>
        <h2 id="about-title">
          {project.name}
          <span className="about-subtitle">
            {t(project.nameZh, "Interactive biology in 3D")}
          </span>
        </h2>
        <div className="about-authorship">
          <span>{t("设计与开发", "Created by")}</span>
          <a href={project.homepage} target="_blank" rel="noreferrer">
            {project.author} ↗
          </a>
          <small>{project.copyright}</small>
        </div>
        <p>
          {t(
            "一个探索生物结构与生命过程的交互式三维教学项目。",
            "An interactive 3D learning project exploring biological structures and processes.",
          )}
        </p>
        <section
          className="about-license"
          aria-label={t("使用许可", "License")}
        >
          <h3>
            {t(
              "非商业使用开放 · 商用须授权",
              "Noncommercial use · commercial permission required",
            )}
          </h3>
          <p>
            {t(
              "允许非商业学习、研究、教学、修改和分享，请保留作者署名与许可。商业使用须事先获得 Kun Qian 的书面授权。第三方代码与数据遵循各自许可。",
              "Noncommercial study, research, teaching, modification and sharing are permitted with attribution and license notices retained. Commercial use requires prior written permission from Kun Qian. Third-party code and data retain their own licenses.",
            )}
          </p>
          <div className="about-license-links">
            <a href={assetUrl("LICENSE.txt")} target="_blank" rel="noreferrer">
              {t("完整许可", "Full license")} ↗
            </a>
            <a
              href={assetUrl("THIRD_PARTY_NOTICES.txt")}
              target="_blank"
              rel="noreferrer"
            >
              {t("第三方声明", "Third-party notices")} ↗
            </a>
            <a
              href={`mailto:${project.email}?subject=BioScape%20commercial%20permission`}
            >
              {t("联系授权", "Request permission")} ↗
            </a>
          </div>
        </section>
        <h3>{t("模型说明", "About the models")}</h3>
        <p>
          {t(
            "这里有动物细胞、植物细胞、革兰阴性杆菌、酿酒酵母、尾草履虫和T₂噬菌体六类教学模型。噬菌体属于病毒，没有细胞结构。每类选取主要结构，不是某个个体的精确重建。",
            "Six teaching models represent an animal cell, a plant cell, a Gram-negative rod, Saccharomyces cerevisiae (budding yeast), Paramecium caudatum and a T2 bacteriophage. The phage is a virus without cellular structure. Each is a selected schematic, not an exact individual reconstruction.",
          )}
        </p>
        <p>
          {t(
            "颜色、透明度、数量与大小为教学目的调整。进入次级结构时会单独放大，不能跨层级比较尺寸。拆解仅用于观察结构关系；分子视图包括几何示意和注明来源的实验主链参考，均非完整全原子重建。",
            "Colors, transparency, counts, and sizes are adjusted for teaching. Each level is independently enlarged; sizes cannot be compared across levels. Exploded views explain spatial relationships, and molecular views include geometric schematics and attributed experimental backbone references; neither is a complete all-atom reconstruction.",
          )}
        </p>
        <p>
          {t(
            "粗面与光面内质网在真实细胞中相连续。不同动物细胞可能缺少某些结构；例如成熟哺乳动物红细胞没有细胞核和线粒体。",
            "Rough and smooth ER are continuous in real cells. Different animal cells can lack some structures; mature mammalian red blood cells, for example, have neither a nucleus nor mitochondria.",
          )}
        </p>
        <details className="about-references">
          <summary>{t("科学参考", "Scientific references")}</summary>
          {microbeNuclearSources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {source.title}
            </a>
          ))}
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/27402755/"
            target="_blank"
            rel="noreferrer"
          >
            Ciliate mitochondria and tubular cristae (2016)
          </a>
          <a
            href="https://doi.org/10.1534/genetics.112.144485"
            target="_blank"
            rel="noreferrer"
          >
            Orlean · Yeast cell wall architecture (2012)
          </a>
          <a
            href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10143506/"
            target="_blank"
            rel="noreferrer"
          >
            Paramecium as a modern model organism (2023)
          </a>
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/3198952/"
            target="_blank"
            rel="noreferrer"
          >
            Head structure of bacteriophages T2 and T4 (1988)
          </a>
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/14188166/"
            target="_blank"
            rel="noreferrer"
          >
            T2 contractile tail sheath (1964)
          </a>
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/3302275/"
            target="_blank"
            rel="noreferrer"
          >
            T2 tail fibers and receptor recognition (1987)
          </a>
          <a
            href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3213138/"
            target="_blank"
            rel="noreferrer"
          >
            Paramecium cortex and contractile vacuoles (2011)
          </a>
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/39066892/"
            target="_blank"
            rel="noreferrer"
          >
            Plant CRWN nuclear scaffold · 2024 ↗
          </a>
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/7987626/"
            target="_blank"
            rel="noreferrer"
          >
            Plant nucleolar organization ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK9905/"
            target="_blank"
            rel="noreferrer"
          >
            The Cell · Chloroplasts and plastids ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK26857/"
            target="_blank"
            rel="noreferrer"
          >
            Molecular Biology of the Cell · Plasmodesmata ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK1945/"
            target="_blank"
            rel="noreferrer"
          >
            Essentials of Glycobiology · Bacterial envelopes ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/1HTI"
            target="_blank"
            rel="noreferrer"
          >
            RCSB PDB · Human triosephosphate isomerase ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK6375/"
            target="_blank"
            rel="noreferrer"
          >
            Macromolecular crowding ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK26871/"
            target="_blank"
            rel="noreferrer"
          >
            Molecular Biology of the Cell · Lipid bilayer ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK9898/"
            target="_blank"
            rel="noreferrer"
          >
            The Cell · Plasma membrane ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK26907/"
            target="_blank"
            rel="noreferrer"
          >
            Molecular Biology of the Cell · Cellular compartments ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK9927/"
            target="_blank"
            rel="noreferrer"
          >
            The Cell · Nuclear envelope and transport ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK9939/"
            target="_blank"
            rel="noreferrer"
          >
            The Cell · Nucleolus ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK26834/"
            target="_blank"
            rel="noreferrer"
          >
            Molecular Biology of the Cell · Chromatin ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK26894/"
            target="_blank"
            rel="noreferrer"
          >
            Molecular Biology of the Cell · Mitochondria ↗
          </a>
          <a
            href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3406826/"
            target="_blank"
            rel="noreferrer"
          >
            PNAS · Mammalian ATP synthase structure ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK9889/"
            target="_blank"
            rel="noreferrer"
          >
            The Cell · Endoplasmic reticulum ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK26829/"
            target="_blank"
            rel="noreferrer"
          >
            Molecular Biology of the Cell · Translation ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/4UG0"
            target="_blank"
            rel="noreferrer"
          >
            RCSB PDB · Human 80S ribosome reference ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK26844/"
            target="_blank"
            rel="noreferrer"
          >
            Molecular Biology of the Cell · Lysosomes ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/1LYA"
            target="_blank"
            rel="noreferrer"
          >
            RCSB PDB · Human cathepsin D ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/6WM2"
            target="_blank"
            rel="noreferrer"
          >
            RCSB PDB · Human V-ATPase reference ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK26858/"
            target="_blank"
            rel="noreferrer"
          >
            Molecular Biology of the Cell · Peroxisomes ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/1DGF"
            target="_blank"
            rel="noreferrer"
          >
            RCSB PDB · Human catalase ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/7Q86"
            target="_blank"
            rel="noreferrer"
          >
            RCSB PDB · Human ACOX1 ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/1JFF"
            target="_blank"
            rel="noreferrer"
          >
            RCSB PDB · α/β tubulin backbone reference ↗
          </a>
          <a
            href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4113101/"
            target="_blank"
            rel="noreferrer"
          >
            Centriole structure ↗
          </a>
          <a
            href="https://pmc.ncbi.nlm.nih.gov/articles/PMC11156431/"
            target="_blank"
            rel="noreferrer"
          >
            The ABCs of centriole architecture ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK26862/"
            target="_blank"
            rel="noreferrer"
          >
            Molecular Biology of the Cell · Cytoskeletal filaments ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK26941/"
            target="_blank"
            rel="noreferrer"
          >
            Molecular Biology of the Cell · Golgi transport ↗
          </a>
          <a
            href="https://www.ncbi.nlm.nih.gov/books/NBK26928/"
            target="_blank"
            rel="noreferrer"
          >
            Plant cell wall and plasmodesmata ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/2B5F"
            target="_blank"
            rel="noreferrer"
          >
            Spinach aquaporin topology reference ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/5KSD"
            target="_blank"
            rel="noreferrer"
          >
            Plant plasma-membrane proton pump ↗
          </a>
          <a
            href="https://pmc.ncbi.nlm.nih.gov/articles/PMC3091084/"
            target="_blank"
            rel="noreferrer"
          >
            Thylakoid membrane junctions · Electron tomography ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/1RCX"
            target="_blank"
            rel="noreferrer"
          >
            Plant Rubisco L₈S₈ organization ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/8JIV"
            target="_blank"
            rel="noreferrer"
          >
            Wheat 60S backbone · PDB 8JIV ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/8JIW"
            target="_blank"
            rel="noreferrer"
          >
            Wheat 40S backbone · PDB 8JIW ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/7K00"
            target="_blank"
            rel="noreferrer"
          >
            E. coli 70S backbones · PDB 7K00 ↗
          </a>
          <a
            href="https://www.rcsb.org/structure/6E14"
            target="_blank"
            rel="noreferrer"
          >
            Type-1 pilus assembly and adhesive tip ↗
          </a>
          <a
            href="https://pubmed.ncbi.nlm.nih.gov/31757961/"
            target="_blank"
            rel="noreferrer"
          >
            Flagellar hook as a universal joint ↗
          </a>
          <a
            href="https://www.nature.com/articles/s41422-024-01017-z"
            target="_blank"
            rel="noreferrer"
          >
            Flagellar basal body and motor architecture ↗
          </a>
        </details>
      </section>
    </div>
  );
}
