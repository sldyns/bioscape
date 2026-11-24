import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  Camera,
  ChevronUp,
  RotateCcw,
  Share2,
  Tags,
  X,
} from "lucide-react";
import { getNode } from "../hierarchy.js";
import {
  comparisonRows,
  getComparisonChildPath,
  getComparisonEntry,
} from "./catalog.js";
import {
  isComparisonId,
  normalizeComparisonState,
  normalizeComparisonView,
  sameView,
} from "./state.js";
import {
  captureComparisonFrame,
  comparisonPaneCaptions,
  releaseComparisonCapture,
} from "./capture.js";
import "./comparison.css";
import ModelPicker from "./ModelPicker.jsx";
import ObservationLocator from "../exploration/ObservationLocator.jsx";
import {
  comparisonStudies,
  detailStudies,
  overviewStudies,
  studyForPanes,
} from "./studies.js";

const CellScene = lazy(() => import("../CellScene.jsx"));
const NO_ZOOM = { direction: null, key: 0 };
const sides = ["left", "right"];
const isParentOf = (parent, child) =>
  parent.length + 1 === child.length &&
  parent.every((id, i) => id === child[i]);

export default function CompareWorkspace({
  lang = "zh",
  initialState,
  onStateChange,
  onClose,
  onSceneReady,
  onShare,
  onStudio,
  suspended = false,
}) {
  const language = lang === "en" ? "en" : "zh";
  const t = (zh, en) => (language === "en" ? en : zh);
  const [state, setState] = useState(() =>
    normalizeComparisonState(initialState),
  );
  const stateRef = useRef(state);
  const live = useRef({ language, onStateChange, onSceneReady });
  live.current = { language, onStateChange, onSceneReady };
  const apis = useRef({ left: null, right: null });
  const emitFrame = useRef(0);
  const [capabilities, setCapabilities] = useState({ left: null, right: null });
  const [resets, setResets] = useState({ left: 0, right: 0 });
  // Instance identity travels with the specimen. Swapping columns must move the
  // existing WebGL canvas, including when both columns show the same model.
  const [paneIdentities, setPaneIdentities] = useState({
    left: "pane-a",
    right: "pane-b",
  });
  const [focused, setFocused] = useState({ left: null, right: null });
  const [ready, setReady] = useState(false);

  const publish = useCallback(() => {
    if (emitFrame.current) cancelAnimationFrame(emitFrame.current);
    emitFrame.current = 0;
    live.current.onStateChange?.(normalizeComparisonState(stateRef.current));
  }, []);
  const schedulePublish = useCallback(() => {
    if (!emitFrame.current) emitFrame.current = requestAnimationFrame(publish);
  }, [publish]);
  const replaceState = useCallback(
    (next) => {
      stateRef.current = normalizeComparisonState(next);
      setState(stateRef.current);
      publish();
    },
    [publish],
  );

  const composite = useMemo(
    () => ({
      get ready() {
        return Boolean(apis.current.left?.ready && apis.current.right?.ready);
      },
      getSnapshot() {
        const current = stateRef.current;
        return normalizeComparisonState(
          Object.fromEntries(
            sides.map((side) => [
              side,
              {
                ...current[side],
                view: apis.current[side]?.getView() || current[side].view,
              },
            ]),
          ),
        );
      },
      getSubtitle() {
        return comparisonPaneCaptions(stateRef.current, live.current.language)
          .map(({ name, context }) =>
            context ? name + " (" + context + ")" : name,
          )
          .join(" / ");
      },
      captureFrame(options) {
        return captureComparisonFrame(
          apis.current,
          stateRef.current,
          live.current.language,
          options,
        );
      },
      releaseCapture() {
        releaseComparisonCapture(apis.current);
        for (const side of sides) apis.current[side]?.releaseCapture?.();
      },
    }),
    [],
  );

  useEffect(() => {
    publish();
    return () => {
      if (emitFrame.current) cancelAnimationFrame(emitFrame.current);
      live.current.onSceneReady?.(null);
    };
  }, [publish]);

  const sceneReady = useCallback(
    (side, api) => {
      apis.current[side] = api;
      const loaded = Boolean(
        apis.current.left?.ready && apis.current.right?.ready,
      );
      setReady(loaded);
      live.current.onSceneReady?.(loaded ? composite : null);
    },
    [composite],
  );
  const viewChanged = useCallback(
    (side, view) => {
      if (!apis.current[side]?.ready) return;
      const normalized = normalizeComparisonView(view);
      if (!normalized || sameView(normalized, stateRef.current[side].view))
        return;
      stateRef.current = {
        ...stateRef.current,
        [side]: { ...stateRef.current[side], view: normalized },
      };
      schedulePublish();
    },
    [schedulePublish],
  );

  const updatePane = useCallback(
    (side, patch) => {
      replaceState({
        ...stateRef.current,
        [side]: { ...stateRef.current[side], ...patch },
      });
    },
    [replaceState],
  );
  const markPaneLoading = useCallback((side) => {
    apis.current[side] = null;
    setReady(false);
    live.current.onSceneReady?.(null);
    setCapabilities((previous) => ({ ...previous, [side]: null }));
    setFocused((previous) => ({ ...previous, [side]: null }));
  }, []);
  const selectModel = useCallback(
    (side, id, path) => {
      if (!isComparisonId(id)) return;
      const old = stateRef.current[side];
      const selected = getComparisonEntry(id, path);
      const nextPath = [...selected.trail, selected.id];
      if (old.id === id) {
        const previous = getComparisonEntry(old.id, old.path);
        if ([...previous.trail, previous.id].join("/") === nextPath.join("/"))
          return;
        // The same shared geometry can acquire a different specimen context
        // without replacing its canvas or interrupting scene readiness.
        updatePane(side, { path: nextPath });
        return;
      }
      markPaneLoading(side);
      updatePane(side, {
        id,
        path: nextPath,
        mode: "whole",
        view: old.view ? { ...old.view, target: [0, 0, 0] } : null,
      });
    },
    [markPaneLoading, updatePane],
  );
  const enterModel = useCallback(
    (side, id) => {
      const current = stateRef.current[side];
      if (id === current.id) return;
      const path = getComparisonChildPath(current.id, current.path, id);
      if (path) selectModel(side, id, path);
      else {
        try {
          const node = getNode(id, live.current.language);
          setFocused((previous) => ({ ...previous, [side]: { id: node.id } }));
        } catch {
          /* Non-navigable decorative geometry has no catalogue entry. */
        }
      }
    },
    [selectModel],
  );
  const capabilityChanged = useCallback(
    (side, next) => {
      if (next.nodeId !== stateRef.current[side].id) return;
      setCapabilities((previous) => ({ ...previous, [side]: next }));
      const mode = stateRef.current[side].mode;
      if (
        (mode === "section" && !next.cutaway) ||
        (mode === "explode" && !next.explode)
      )
        updatePane(side, { mode: "whole" });
    },
    [updatePane],
  );
  const handlers = useMemo(
    () =>
      Object.fromEntries(
        sides.map((side) => [
          side,
          {
            onSceneReady: (api) => sceneReady(side, api),
            onViewChange: (view) => viewChanged(side, view),
            onCapabilities: (next) => capabilityChanged(side, next),
            onEnter: (id) => enterModel(side, id),
          },
        ]),
      ),
    [sceneReady, viewChanged, capabilityChanged, enterModel],
  );

  function swap() {
    const previous = stateRef.current;
    // Camera, controls, focus and renderer all travel with their specimen.
    apis.current = { left: apis.current.right, right: apis.current.left };
    replaceState({ ...previous, left: previous.right, right: previous.left });
    setPaneIdentities((previous) => ({
      left: previous.right,
      right: previous.left,
    }));
    setResets((previous) => ({ left: previous.right, right: previous.left }));
    setCapabilities((previous) => ({
      left: previous.right,
      right: previous.left,
    }));
    setFocused((previous) => ({ left: previous.right, right: previous.left }));
  }
  function chooseStudy(id) {
    const study = comparisonStudies.find((item) => item.id === id);
    if (!study) return;
    const next = { ...stateRef.current };
    study.paths.forEach((path, index) => {
      const side = sides[index];
      const id = path.at(-1);
      if (next[side].id === id) {
        next[side] = { ...next[side], path };
      } else {
        markPaneLoading(side);
        next[side] = {
          id,
          path,
          mode: path.length > 1 ? "section" : "whole",
          labels: path.length === 1,
        };
      }
    });
    replaceState(next);
  }
  function reset(side) {
    const next = {
      ...stateRef.current,
      [side]: { ...stateRef.current[side], view: null },
    };
    replaceState(next);
    setResets((previous) => ({ ...previous, [side]: previous[side] + 1 }));
  }

  const left = getComparisonEntry(state.left.id, state.left.path);
  const right = getComparisonEntry(state.right.id, state.right.path);
  const leftPath = [...left.trail, left.id];
  const rightPath = [...right.trail, right.id];
  const study = studyForPanes(leftPath, rightPath);
  const parentAndChild =
    isParentOf(leftPath, rightPath) || isParentOf(rightPath, leftPath);
  const rows = comparisonRows(
    state.left.id,
    state.right.id,
    language,
    state.left.path,
    state.right.path,
  );
  const sources = [
    ...new Map(
      [...(left.sources || []), ...(right.sources || [])].map((source) => [
        source.url,
        source,
      ]),
    ).values(),
  ];

  return (
    <section
      className="compare-workspace"
      aria-label={t("结构比较工作区", "Structure comparison workspace")}
    >
      <header className="compare-heading">
        <div className="compare-title">
          {onClose && (
            <button
              className="compare-back"
              onClick={onClose}
              aria-label={t("返回结构探索", "Return to structures")}
            >
              <ArrowLeft size={17} />
            </button>
          )}
          <div>
            <h1>{t("结构对比", "Compare structures")}</h1>
          </div>
        </div>
        <div className="compare-actions">
          {onShare && (
            <button
              onClick={() =>
                onShare(normalizeComparisonState(stateRef.current))
              }
            >
              <Share2 size={15} />
              {t("分享比较", "Share")}
            </button>
          )}
          {onStudio && (
            <button
              className="compare-studio"
              disabled={!ready}
              onClick={() => onStudio()}
            >
              <Camera size={15} />
              {t("创作与导出", "Studio")}
            </button>
          )}
        </div>
      </header>

      <div className="compare-toolbar">
        <label className="compare-study-picker">
          <span>{t("对照主题", "Comparison study")}</span>
          <select
            value={study?.id || ""}
            onChange={(event) => chooseStudy(event.target.value)}
          >
            <option value="" disabled>
              {t("自选模型", "Custom pair")}
            </option>
            {[
              [t("局部结构", "Structural details"), detailStudies],
              [t("整体标本", "Whole specimens"), overviewStudies],
            ].map(([label, options]) => (
              <optgroup key={label} label={label}>
                {options.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title[language]}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="compare-tools">
          <button onClick={swap}>
            <ArrowLeftRight size={15} />
            {t("交换", "Swap")}
          </button>
        </div>
      </div>

      {(study?.observation || parentAndChild) && (
        <p className="compare-observation">
          {study?.observation?.[language] ||
            t(
              "一侧展示选中的部位，另一侧保留它在上一级结构中的位置。",
              "One view isolates the selected part. The other shows its position in the enclosing structure.",
            )}
        </p>
      )}
      <p className="compare-scale-note">
        {t("视图分别缩放，非同一比例。", "Views are scaled independently.")}
      </p>

      <div className="compare-panes">
        {sides.map((side, index) => {
          const pane = state[side];
          const entry = getComparisonEntry(pane.id, pane.path);
          const capability =
            capabilities[side]?.nodeId === pane.id ? capabilities[side] : null;
          const labelsAvailable =
            capability?.labels &&
            (!capability.labelModes ||
              capability.labelModes.includes(pane.mode));
          const focus = focused[side]
            ? getNode(focused[side].id, language)
            : null;
          const parent = entry.trail?.at(-1);
          return (
            <section
              className="compare-pane"
              key={paneIdentities[side]}
              aria-label={`${index === 0 ? "A" : "B"} · ${entry[language]}`}
            >
              <div className="compare-pane-heading">
                <span className="compare-pane-letter" aria-hidden="true">
                  {index === 0 ? "A" : "B"}
                </span>
                <ModelPicker
                  value={pane.id}
                  contextPath={pane.path}
                  language={language}
                  letter={index === 0 ? "A" : "B"}
                  onChange={(id, path) => selectModel(side, id, path)}
                />
                {parent && (
                  <button
                    className="compare-up"
                    onClick={() => selectModel(side, parent, entry.trail)}
                    title={t("返回上层结构", "View parent structure")}
                    aria-label={t("返回上层结构", "View parent structure")}
                  >
                    <ChevronUp size={17} />
                  </button>
                )}
              </div>
              <div
                className={`compare-canvas ${suspended ? "is-suspended" : ""}`}
                aria-hidden={suspended || undefined}
              >
                <Suspense
                  fallback={
                    <div className="compare-loading" role="status">
                      {t("正在准备三维视图…", "Preparing the 3D view…")}
                    </div>
                  }
                >
                  <CellScene
                    nodeId={pane.id}
                    viewKey={`comparison/${paneIdentities[side]}/${pane.id}`}
                    mode={pane.mode}
                    explode={pane.explode}
                    labels={pane.labels}
                    rotate={false}
                    resetKey={resets[side]}
                    zoom={NO_ZOOM}
                    lang={language}
                    highlight={focus?.id || null}
                    initialView={stateRef.current[side].view}
                    {...handlers[side]}
                  />
                </Suspense>
              </div>
              <div className="compare-pane-controls">
                <div
                  className="compare-mode"
                  role="group"
                  aria-label={`${index === 0 ? "A" : "B"} · ${t("显示方式", "Display mode")}`}
                >
                  {[
                    ["whole", t("整体", "Whole")],
                    ["section", t("剖面", "Cutaway")],
                    ["explode", t("拆解", "Exploded")],
                  ].map(([mode, title]) => (
                    <button
                      key={mode}
                      aria-pressed={pane.mode === mode}
                      disabled={
                        mode !== "whole" &&
                        (!capability ||
                          (mode === "section"
                            ? !capability.cutaway
                            : !capability.explode))
                      }
                      onClick={() => updatePane(side, { mode })}
                    >
                      {title}
                    </button>
                  ))}
                </div>
                <div className="compare-pane-utilities">
                  <button
                    aria-pressed={pane.labels && Boolean(labelsAvailable)}
                    disabled={!labelsAvailable}
                    title={
                      capability?.labels && !labelsAvailable
                        ? t(
                            "切换到剖面查看内部标签",
                            "Use Cutaway to see internal labels",
                          )
                        : undefined
                    }
                    onClick={() => updatePane(side, { labels: !pane.labels })}
                  >
                    <Tags size={14} />
                    {t("标注", "Labels")}
                  </button>
                  <button onClick={() => reset(side)}>
                    <RotateCcw size={14} />
                    {t("复位", "Reset")}
                  </button>
                </div>
                {pane.mode === "explode" && (
                  <label className="compare-separation">
                    <span>{t("分离程度", "Separation")}</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={pane.explode}
                      onChange={(event) =>
                        updatePane(side, {
                          explode: Number(event.target.value),
                        })
                      }
                    />
                    <output>{Math.round(pane.explode)}%</output>
                  </label>
                )}
              </div>
              <ObservationLocator
                key={`${pane.id}/${pane.mode}/${resets[side]}`}
                api={apis.current[side]}
                mode={pane.mode}
                lang={language}
                onFocus={(view) => viewChanged(side, view)}
                onReset={() => reset(side)}
              />
              {focus && (
                <div className="compare-focus" role="status">
                  <div>
                    <strong>{focus.name}</strong>
                    <p>{focus.desc}</p>
                  </div>
                  <button
                    onClick={() =>
                      setFocused((previous) => ({ ...previous, [side]: null }))
                    }
                    aria-label={t("关闭结构说明", "Dismiss structure note")}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="compare-pane-caption">
                <p>{entry.summary[language]}</p>
                {entry.size?.[language] && <span>{entry.size[language]}</span>}
              </div>
            </section>
          );
        })}
      </div>

      <section
        className="compare-differences"
        aria-labelledby="compare-differences-title"
      >
        <div className="compare-differences-heading">
          <h2 id="compare-differences-title">
            {state.left.id === state.right.id
              ? t("同一结构，比较不同视图", "Same structure, different views")
              : t("结构与功能", "Structure & function")}
          </h2>
        </div>
        {left.facts && right.facts && (
          <div
            className="compare-table"
            role="table"
            aria-label={t("结构差异", "Structural comparison")}
          >
            <div className="compare-table-head" role="row">
              <span role="columnheader">{t("观察角度", "Feature")}</span>
              <strong role="columnheader">A · {left[language]}</strong>
              <strong role="columnheader">B · {right[language]}</strong>
            </div>
            {rows
              .filter((row) => row.key !== "focus" && row.key !== "scope")
              .map((row) => (
                <div className="compare-table-row" role="row" key={row.key}>
                  <h3 role="rowheader">{row.label}</h3>
                  <p role="cell">
                    <span className="compare-mobile-column">
                      A · {left[language]}
                    </span>
                    {row.left}
                  </p>
                  <p role="cell">
                    <span className="compare-mobile-column">
                      B · {right[language]}
                    </span>
                    {row.right}
                  </p>
                </div>
              ))}
          </div>
        )}
        <div className="compare-scope-grid">
          {[left, right].map((entry, index) => (
            <details key={`${index}-${entry.id}`}>
              <summary>
                {index === 0 ? "A" : "B"} · {t("模型范围", "Model scope")}
              </summary>
              <p>{entry.scope?.[language]}</p>
            </details>
          ))}
        </div>
        {!!sources.length && (
          <details className="compare-sources">
            <summary>{t("参考资料", "References")}</summary>
            <p>
              {t(
                "文字与模型描述所选范例；细胞亚型、状态和物种之间存在差异。形状、颜色、数量及局部比例经过教学简化。",
                "Descriptions refer to the selected examples. Cell subtypes, states, and species vary. Shapes, colors, counts, and local proportions are simplified for teaching.",
              )}
            </p>
            <ul>
              {sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>
    </section>
  );
}
