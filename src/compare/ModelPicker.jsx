import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  comparisonGroups,
  getComparisonEntry,
  searchComparisonEntries,
} from "./catalog.js";

export default function ModelPicker({
  value,
  contextPath,
  language,
  letter,
  onChange,
}) {
  const t = (zh, en) => (language === "en" ? en : zh);
  const dialog = useRef(null);
  const input = useRef(null);
  const trigger = useRef(null);
  const id = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [active, setActive] = useState(0);
  const selected = getComparisonEntry(value, contextPath);
  const results = useMemo(
    () => searchComparisonEntries(query, group),
    [query, group],
  );
  const path = (entry) =>
    entry.trail
      .map((ancestor) => getComparisonEntry(ancestor)[language])
      .join(" / ");
  const isSelected = (entry) =>
    entry.id === selected.id && entry.rootId === selected.rootId;
  useEffect(() => {
    if (open) {
      dialog.current.showModal();
      input.current?.focus();
    } else if (dialog.current.open) dialog.current.close();
  }, [open]);
  useEffect(() => {
    if (open)
      document
        .getElementById(`${id}-option-${active}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, id, open, query, group]);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  function choose(entry) {
    const chosen = isSelected(entry) ? selected : entry;
    onChange(chosen.id, [...chosen.trail, chosen.id]);
    close();
  }
  return (
    <div className="compare-model-picker">
      <button
        ref={trigger}
        className="compare-picker-trigger"
        aria-label={`${t("选择模型", "Choose a model")} ${letter}: ${selected[language]}${path(selected) ? ` · ${path(selected)}` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setQuery("");
          const initialGroup = selected.trail.length ? selected.rootId : "";
          setGroup(initialGroup);
          setActive(
            Math.max(
              0,
              searchComparisonEntries("", initialGroup).findIndex(
                (entry) => entry.id === value,
              ),
            ),
          );
          setOpen(true);
        }}
      >
        <span>
          <small>{path(selected) || t("完整模型", "Whole model")}</small>
          <strong>{selected[language]}</strong>
        </span>
        <ChevronDown size={16} />
      </button>
      <dialog
        ref={dialog}
        className="compare-picker-dialog"
        aria-labelledby={`${id}-title`}
        onCancel={close}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) close();
        }}
      >
        <div className="compare-picker-body">
          <header>
            <div>
              <span>
                {t("比较对象", "COMPARISON MODEL")} {letter}
              </span>
              <h2 id={`${id}-title`}>
                {t("选择一个观察对象", "Choose a structure")}
              </h2>
            </div>
            <button
              aria-label={t("关闭模型选择", "Close model picker")}
              onClick={close}
            >
              <X size={20} />
            </button>
          </header>
          <label className="compare-picker-search">
            <Search size={18} />
            <input
              ref={input}
              value={query}
              type="search"
              role="combobox"
              aria-expanded="true"
              aria-autocomplete="list"
              aria-controls={`${id}-results`}
              aria-activedescendant={
                results[active] ? `${id}-option-${active}` : undefined
              }
              aria-label={t("搜索模型名称或路径", "Search model name or path")}
              placeholder={t(
                "搜索细胞、细胞器或分子…",
                "Search cells, organelles, molecules…",
              )}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              onKeyDown={(event) => {
                if (["ArrowDown", "ArrowUp"].includes(event.key)) {
                  event.preventDefault();
                  setActive((current) =>
                    Math.max(
                      0,
                      Math.min(
                        results.length - 1,
                        current + (event.key === "ArrowDown" ? 1 : -1),
                      ),
                    ),
                  );
                }
                if (event.key === "Enter" && results[active]) {
                  event.preventDefault();
                  choose(results[active]);
                }
              }}
            />
          </label>
          <div className="compare-picker-layout">
            <nav aria-label={t("模型分类", "Model categories")}>
              <button
                aria-pressed={!group}
                onClick={() => {
                  setGroup("");
                  setActive(0);
                }}
              >
                {t("全部模型", "All models")}
              </button>
              {comparisonGroups.map((item) => (
                <button
                  key={item.id}
                  aria-pressed={group === item.id}
                  onClick={() => {
                    setGroup(item.id);
                    setActive(0);
                  }}
                >
                  {item[language]}
                </button>
              ))}
            </nav>
            <div className="compare-picker-results">
              <p className="compare-picker-count" role="status">
                {!query.trim() && !group
                  ? t(
                      "从完整模型开始，或搜索内部结构",
                      "Start with a whole model, or search its parts",
                    )
                  : `${results.length} ${t("个结果", "results")}`}
              </p>
              <div
                role="listbox"
                id={`${id}-results`}
                aria-label={t("可选模型", "Available models")}
              >
                {results.map((entry, index) => (
                  <button
                    role="option"
                    id={`${id}-option-${index}`}
                    key={[...entry.trail, entry.id].join("/")}
                    aria-selected={isSelected(entry)}
                    tabIndex={-1}
                    className={index === active ? "is-active" : ""}
                    onPointerMove={() => setActive(index)}
                    onClick={() => choose(entry)}
                  >
                    <span>
                      <strong>{entry[language]}</strong>
                      <small>
                        {path(entry) || t("完整模型", "Whole model")}
                      </small>
                    </span>
                    {isSelected(entry) && <Check size={16} />}
                  </button>
                ))}
                {!results.length && (
                  <p className="compare-picker-empty">
                    {t(
                      "没有找到匹配的结构。试试其他名称，或选择全部模型。",
                      "No matching structure. Try another name or select all models.",
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}
