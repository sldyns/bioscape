import React, { useEffect, useMemo, useState } from "react";
import "./processes.css";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { getNode } from "../hierarchy";
import { assetUrl } from "../assetUrl.js";
import { processCatalog, processesByRoot, processCategories } from "./catalog";

export default function ProcessDirectory({
  rootId,
  lang,
  onSelect,
  onStructure,
  titleRef,
  restoreFocus,
}) {
  const t = (zh, en) => (lang === "en" ? en : zh);
  const entries = processesByRoot[rootId] ?? [];
  const name =
    rootId === "phage"
      ? t("噬菌体", "Bacteriophages")
      : rootId === "yeast"
        ? t("真菌", "Fungi")
        : getNode(rootId, lang).name;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const categories = [
    ...new Set(entries.map((id) => processCatalog[id].category)),
  ];
  const visibleEntries = useMemo(
    () =>
      entries.filter((id) => {
        const entry = processCatalog[id];
        return (
          (category === "all" || entry.category === category) &&
          `${entry.title.zh} ${entry.title.en} ${entry.summary.zh} ${entry.summary.en}`
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase())
        );
      }),
    [entries, query, category],
  );
  useEffect(() => {
    if (restoreFocus?.current) {
      titleRef?.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [titleRef, restoreFocus]);
  return (
    <main
      className="process-workspace process-directory"
      data-process-directory={rootId}
    >
      <aside
        className="catalog"
        aria-label={t("生物学过程目录", "Biological process catalog")}
      >
        <div className="catalog-heading">
          <span className="catalog-caption">
            {t("生物学过程目录", "Biological processes")}
          </span>
          <h1 ref={titleRef} tabIndex={-1}>
            {name}
          </h1>
        </div>
        <nav
          className="catalog-list"
          aria-label={t("当前层级过程", "Processes at this level")}
        >
          <button className="catalog-item overview active" aria-current="page">
            {t("总览", "Overview")}
          </button>
          {entries.map((id) => (
            <button
              className="catalog-item"
              key={id}
              onClick={() => onSelect(id)}
            >
              <span
                className="structure-mark"
                style={{ background: processCatalog[id].color }}
              />
              <span>{processCatalog[id].title[lang]}</span>
              <ChevronRight size={15} />
            </button>
          ))}
        </nav>
      </aside>
      <section
        className="process-directory-content"
        aria-label={t("过程总览", "Process overview")}
      >
        <p className="process-eyebrow">{name}</p>
        <h2>{t("生物学过程", "Biological processes")}</h2>
        <p className="process-directory-intro">
          {entries.length
            ? t(
                "选择一个过程，逐步观察细胞如何工作。",
                "Choose a process and explore how the cell works, step by step.",
              )
            : t(
                "此类生物的过程演示尚未收录。",
                "Process demonstrations for this organism are not available yet.",
              )}
        </p>
        {entries.length > 6 && (
          <div className="process-directory-filter">
            <label className="sr-only" htmlFor="process-search">
              {t("搜索过程", "Search processes")}
            </label>
            <input
              id="process-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("搜索过程", "Search processes")}
            />
            <label className="sr-only" htmlFor="process-category">
              {t("过程类别", "Process category")}
            </label>
            <select
              id="process-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="all">{t("全部类别", "All categories")}</option>
              {categories.map((key) => (
                <option key={key} value={key}>
                  {processCategories[key]?.[lang] ?? key}
                </option>
              ))}
            </select>
          </div>
        )}
        {entries.length ? (
          <div className="process-directory-cards">
            {visibleEntries.map((id) => {
              const entry = processCatalog[id];
              return (
                <button
                  className="process-directory-card"
                  key={id}
                  onClick={() => onSelect(id)}
                >
                  <span className="process-directory-image">
                    <img
                      src={assetUrl(entry.renderedThumbnail)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      width="640"
                      height="640"
                    />
                  </span>
                  <span className="process-directory-card-copy">
                    <strong>
                      {entry.title[lang]}
                      <ChevronRight size={15} aria-hidden="true" />
                    </strong>
                    <span>{entry.summary[lang]}</span>
                  </span>
                </button>
              );
            })}
            {visibleEntries.length === 0 && (
              <p className="process-no-results">
                {t("没有找到匹配的过程。", "No matching processes.")}{" "}
                <button
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                  }}
                >
                  {t("清除筛选", "Clear filters")}
                </button>
              </p>
            )}
          </div>
        ) : (
          <button className="process-empty-link" onClick={onStructure}>
            {t("查看结构", "Explore structures")}
            <ArrowUpRight size={15} />
          </button>
        )}
      </section>
      <aside
        className="process-explanation"
        aria-label={t("目录说明", "About this catalog")}
      >
        <p className="process-eyebrow">
          {t("从结构，到活动", "From structure to function")}
        </p>
        <h2>{t("从过程到步骤", "From process to steps")}</h2>
        <p className="process-stage-description">
          {t(
            "进入一个过程后，左侧目录会显示它的具体步骤，中间呈现对应的交互模型。",
            "Open a process to see its steps in the catalog and explore the interactive model in the center.",
          )}
        </p>
        <p className="process-context">
          {t(
            "可以逐步查看，也可以播放或拖动时间线。用返回按钮或顶部路径回到过程目录。",
            "Explore one step at a time, play the sequence, or scrub the timeline. Return to this catalog using the back button or the path above.",
          )}
        </p>
      </aside>
    </main>
  );
}
