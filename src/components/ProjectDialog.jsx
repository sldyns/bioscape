import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Mail, X } from "lucide-react";
import { project } from "../project.js";
import { assetUrl } from "../assetUrl.js";
import "./projectDialog.css";

const pages = [
  ["about", "项目介绍", "The project"],
  ["license", "使用许可", "License"],
  ["notices", "第三方声明", "Third-party notices"],
];
const commercialContact = `mailto:${project.email}?subject=BioScape%20commercial%20permission`;

function LegalDocument({ filename, t }) {
  const [document, setDocument] = useState({ status: "loading", text: "" });
  const [attempt, setAttempt] = useState(0);
  const url = assetUrl(filename);
  useEffect(() => {
    const controller = new AbortController();
    setDocument({ status: "loading", text: "" });
    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("DOCUMENT_UNAVAILABLE");
        return response.text();
      })
      .then((text) => {
        if (!controller.signal.aborted) setDocument({ status: "ready", text });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setDocument({ status: "error", text: "" });
      });
    return () => controller.abort();
  }, [url, attempt]);
  return (
    <section
      className="project-document"
      aria-busy={document.status === "loading"}
    >
      <div className="project-document-heading">
        <h3>{t("完整原文", "Full text")}</h3>
        <a href={url} target="_blank" rel="noreferrer">
          {t("单独打开", "Open separately")}
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
      {document.status === "loading" ? (
        <p role="status">{t("正在载入原文…", "Loading the full text…")}</p>
      ) : document.status === "error" ? (
        <div role="alert">
          <p>
            {t(
              "原文暂时无法载入，可重试或单独打开。",
              "The text could not be loaded. Retry or open it separately.",
            )}
          </p>
          <button onClick={() => setAttempt((value) => value + 1)}>
            {t("重新加载", "Retry")}
          </button>
        </div>
      ) : (
        <pre>{document.text}</pre>
      )}
    </section>
  );
}

export default function ProjectDialog({
  lang,
  initialPage = "about",
  onClose,
}) {
  const t = (zh, en) => (lang === "en" ? en : zh);
  const [page, setPage] = useState(initialPage);
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [page]);
  return createPortal(
    <dialog
      className="project-dialog"
      ref={dialogRef}
      aria-labelledby="project-dialog-title"
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const items = [
          ...event.currentTarget.querySelectorAll(
            'button:not([disabled]), a[href], [tabindex="0"]',
          ),
        ];
        const index = items.indexOf(document.activeElement);
        if (event.shiftKey && index <= 0) {
          event.preventDefault();
          items.at(-1)?.focus();
        } else if (!event.shiftKey && index === items.length - 1) {
          event.preventDefault();
          items[0]?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          onClose();
      }}
    >
      <div className="project-dialog-inner">
        <header className="project-dialog-header">
          <div>
            <p className="project-dialog-eyebrow">
              BioScape · {t("生物图景", "Explore life in 3D")}
            </p>
            <h2 id="project-dialog-title" tabIndex={-1} ref={titleRef}>
              {t("项目与使用说明", "About & usage")}
            </h2>
          </div>
          <button
            className="project-dialog-close"
            onClick={onClose}
            aria-label={t("关闭项目说明", "Close project information")}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <nav
          className="project-dialog-nav"
          aria-label={t("项目说明栏目", "Project information sections")}
        >
          {pages.map(([id, zh, en]) => (
            <button
              key={id}
              aria-pressed={page === id}
              onClick={() => setPage(id)}
            >
              {t(zh, en)}
            </button>
          ))}
        </nav>
        <div
          className="project-dialog-body"
          ref={bodyRef}
          tabIndex={0}
          aria-label={t(
            pages.find(([id]) => id === page)[1],
            pages.find(([id]) => id === page)[2],
          )}
        >
          {page === "about" ? (
            <>
              <h3 className="project-intro-title">
                {t(
                  "交互式三维生物教学项目",
                  "An interactive 3D biology project",
                )}
              </h3>
              <p>
                {t(
                  "从细胞到分子，观察结构怎样组成生命，过程怎样发生。通过旋转、剖视、拆解、并排比较和连续动画，理解书本里的生物学。",
                  "Explore how biological structures fit together and how living processes unfold, from cells to molecules. Rotate, cut away, take apart, compare and follow continuous animations.",
                )}
              </p>
              <div className="project-creator">
                <div>
                  <span>{t("设计与开发", "Designed & developed by")}</span>
                  <a href={project.homepage} target="_blank" rel="noreferrer">
                    {project.author}
                    <ArrowUpRight size={20} aria-hidden="true" />
                  </a>
                </div>
                <small>{project.copyright}</small>
              </div>
              <h3>{t("模型的用途与范围", "What the models represent")}</h3>
              <p>
                {t(
                  "这些模型用于学习和教学。颜色、比例、数量与运动节奏经过示意化处理，不是某个真实细胞的完整重建。具体模型和过程内附范围说明、科学参考与数据来源。",
                  "These models support learning and teaching. Colors, proportions, counts and timing are adapted for explanation; they are not complete reconstructions of individual cells. Each model and process includes its scope, scientific references and data sources.",
                )}
              </p>
              <h3>{t("使用与分享", "Using and sharing")}</h3>
              <p>
                {t(
                  "项目原创内容依非商业许可开放使用。分享时请保留项目与作者署名、许可和适用的第三方声明；商业使用须事先获得书面授权。",
                  "Original project content is available under a noncommercial license. When sharing, retain the project and author credit, license and applicable third-party notices. Commercial use requires prior written permission.",
                )}
              </p>
            </>
          ) : page === "license" ? (
            <>
              <h3 className="project-intro-title">
                {t(
                  "非商业使用开放，商用须授权",
                  "Noncommercial use; commercial permission required",
                )}
              </h3>
              <div className="project-permissions">
                <section>
                  <h4>
                    {t("学习、研究与教学", "Learning, research & teaching")}
                  </h4>
                  <p>
                    {t(
                      "允许非商业使用、修改与分享。分发时须保留作者署名、许可和适用的第三方声明。",
                      "Noncommercial use, modification and sharing are permitted. Distributions must retain author credit, the license and applicable third-party notices.",
                    )}
                  </p>
                </section>
                <section>
                  <h4>{t("商业用途", "Commercial use")}</h4>
                  <p>
                    {t(
                      "用于商业产品、付费服务、付费课程等，须事先获得 Kun Qian 的单独书面授权。",
                      "Commercial products, paid services, paid courses and other commercial uses require separate prior written permission from Kun Qian.",
                    )}
                  </p>
                  <a href={commercialContact}>
                    {t("联系商用授权", "Request commercial permission")}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                </section>
              </div>
              <h3>{t("图片与视频的署名", "Credit for images and videos")}</h3>
              <p>
                {t(
                  "导出画面不添加作者姓名水印。对外分享时，请在配文、视频简介或致谢中注明 BioScape — Kun Qian，并附作者主页；同时保留适用的许可与第三方声明。",
                  "Exports do not include an author-name watermark. When sharing, credit BioScape — Kun Qian and link to the author's homepage in the caption, video description or credits, while retaining applicable license and third-party notices.",
                )}
              </p>
              <p className="project-legal-summary">
                {t(
                  "以上为简要说明，具体权利义务以英文许可原文为准。第三方代码与数据遵循各自许可。",
                  "This is a summary; the English license text governs. Third-party code and data remain under their own licenses.",
                )}
              </p>
              <LegalDocument key="license" filename="LICENSE.txt" t={t} />
            </>
          ) : (
            <>
              <h3 className="project-intro-title">
                {t("第三方代码与数据", "Third-party code and data")}
              </h3>
              <p>
                {t(
                  "BioScape 的非商业许可适用于项目原创部分。第三方库、实验结构数据及其他单独注明来源的材料保留各自许可和引用要求。",
                  "BioScape's noncommercial license applies to its original work. Third-party libraries, experimental structure data and other separately identified materials retain their own licenses and citation requirements.",
                )}
              </p>
              <LegalDocument
                key="notices"
                filename="THIRD_PARTY_NOTICES.txt"
                t={t}
              />
            </>
          )}
        </div>
        <footer className="project-dialog-footer">
          <span>
            {t(
              "商用授权与项目交流",
              "Commercial permission & project enquiries",
            )}
          </span>
          <a href={commercialContact}>
            <Mail size={15} aria-hidden="true" />
            {project.email}
          </a>
        </footer>
      </div>
    </dialog>,
    document.body,
  );
}
