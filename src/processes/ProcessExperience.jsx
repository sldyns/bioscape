import React, {
  useEffect,
  useRef,
  useState,
  lazy,
  Suspense,
  useMemo,
} from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Tag,
} from "lucide-react";
import ProcessScene from "./ProcessScene";
import { processCatalog } from "./catalog";
import { getNode } from "../hierarchy";
import { groupProcessStructures } from "../exploration/relationships.js";
import { restoreProcessSession } from "../exploration/processSession.js";
import { getConditionNote } from "../exploration/conditionNotes.js";
import SceneActions from "../exploration/SceneActions.jsx";
import "./processes.css";
import "../exploration/processContinuity.css";
import { processLoaders } from "./loaders.js";
const players = Object.fromEntries(
  Object.entries(processLoaders).map(([id, load]) => [
    id,
    lazy(() =>
      load().then(({ default: definition }) => ({
        default: (props) => (
          <ProcessPlayer {...props} definition={definition} />
        ),
      })),
    ),
  ]),
);

export default function ProcessExperience({ processId, ...props }) {
  const Player = players[processId];
  return (
    <Suspense
      fallback={
        <div className="process-loading" role="status">
          {props.lang === "zh" ? "正在准备" : "Preparing "}
          {processCatalog[processId].title[props.lang]}…
        </div>
      }
    >
      <Player {...props} />
    </Suspense>
  );
}
const clock = (progress, duration) =>
  `0:${String(Math.round(progress * duration)).padStart(2, "0")}`;

function ProcessPlayer({
  definition: baseDefinition,
  rootId,
  lang,
  suspended = false,
  onBack,
  titleRef,
  restoreFocus,
  initialState,
  onStateChange,
  onSceneReady,
  originPath = [rootId],
  onStructure,
  onExploreStructure,
  onStudio,
  onShare,
}) {
  const definition = useMemo(
    () => ({ ...baseDefinition, ...baseDefinition.contexts?.[rootId] }),
    [baseDefinition, rootId],
  );
  const [initial] = useState(() =>
    restoreProcessSession(definition, initialState),
  );
  const [parameters, setParameters] = useState(initial.parameters);
  const [progress, setProgress] = useState(initial.progress);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(initial.speed);
  const [annotations, setAnnotations] = useState(initial.annotations);
  const [ready, setReady] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [zoom, setZoom] = useState({ direction: null, key: 0 });
  const progressRef = useRef(initial.progress);
  const cameraRef = useRef(initial.camera);
  const stateCallback = useRef(onStateChange);
  stateCallback.current = onStateChange;
  const latest = useRef(initial);
  const publishState = React.useCallback((patch, immediate = false) => {
    latest.current = { ...latest.current, ...patch };
    stateCallback.current?.(latest.current, { immediate });
  }, []);
  useEffect(() => {
    publishState({});
  }, [publishState]);
  const sceneReady = React.useCallback(
    (api) => {
      setReady(Boolean(api?.ready));
      onSceneReady?.(
        api
          ? Object.assign(Object.create(api), {
              getScientificNote: () =>
                [
                  groupProcessStructures(
                    rootId,
                    definition.id,
                    definition.stages,
                  ).scope?.label?.[lang],
                  getConditionNote(
                    definition.id,
                    latest.current.parameters,
                    lang,
                  )?.title,
                ]
                  .filter(Boolean)
                  .join(" · "),
              getFrameCaption: (fraction) => {
                const condition = getConditionNote(
                  definition.id,
                  latest.current.parameters,
                  lang,
                );
                if (condition?.kind === "reference") return condition.title;
                const value = Number.isFinite(fraction)
                  ? fraction
                  : progressRef.current;
                const index = Math.max(
                  0,
                  definition.stages.findLastIndex(
                    (item) => item.at <= value + 0.00001,
                  ),
                );
                return (
                  (lang === "zh" ? "步骤" : "Step") +
                  " " +
                  (index + 1) +
                  " / " +
                  definition.stages.length +
                  " · " +
                  definition.stages[index].title[lang]
                );
              },
            })
          : null,
      );
    },
    [onSceneReady, definition, lang, rootId],
  );
  const viewChanged = React.useCallback(
    (camera) => {
      cameraRef.current = camera;
      publishState({ camera });
    },
    [publishState],
  );
  const selectedStep = useRef(null);
  const en = lang === "en",
    t = (zh, english) => (en ? english : zh);
  const stageIndex = Math.max(
    0,
    definition.stages.findLastIndex((stage) => progress + 0.00001 >= stage.at),
  );
  const stage = definition.stages[stageIndex];
  const conditionNote = getConditionNote(definition.id, parameters, lang);
  const related = groupProcessStructures(
    rootId,
    definition.id,
    definition.stages,
    progress,
    parameters,
  );
  const locationButton = (item) => (
    <button
      key={item.path.join("/")}
      disabled={!onExploreStructure}
      onClick={() => {
        setPlaying(false);
        onExploreStructure?.(item.path);
      }}
    >
      <span>
        <strong>{getNode(item.path.at(-1), lang).name}</strong>
        {item.path.length > 2 && (
          <small className="continuity-path">
            {item.path
              .slice(1, -1)
              .map((id) => getNode(id, lang).name)
              .join(" / ")}
          </small>
        )}
        {item.label && <small>{item.label[lang]}</small>}
      </span>
      <ChevronRight size={13} aria-hidden="true" />
    </button>
  );

  useEffect(() => {
    if (restoreFocus?.current) {
      titleRef?.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [titleRef, restoreFocus]);

  useEffect(() => {
    const button = selectedStep.current,
      rail = button?.parentElement;
    if (rail && rail.scrollWidth > rail.clientWidth)
      rail.scrollTo({
        left:
          button.offsetLeft -
          rail.offsetLeft -
          (rail.clientWidth - button.offsetWidth) / 2,
        behavior: "instant",
      });
  }, [stageIndex, lang]);

  function seek(value) {
    setPlaying(false);
    progressRef.current = value;
    setProgress(value);
    publishState({ progress: value }, true);
  }
  function togglePlayback() {
    if (progressRef.current >= 1) {
      progressRef.current = 0;
      setProgress(0);
      publishState({ progress: 0 }, true);
    }
    setPlaying((value) => !value);
  }
  useEffect(() => {
    if (suspended) setPlaying(false);
  }, [suspended]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);
  useEffect(() => {
    if (!playing || suspended) return;
    let frame,
      last,
      published = 0;
    const tick = (now) => {
      if (last !== undefined)
        progressRef.current = Math.min(
          1,
          progressRef.current +
            (Math.min(now - last, 100) * speed) / (definition.duration * 1000),
        );
      last = now;
      if (now - published >= 30 || progressRef.current >= 1) {
        setProgress(progressRef.current);
        publishState({ progress: progressRef.current });
        published = now;
      }
      if (progressRef.current >= 1) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, suspended, definition, speed, publishState]);

  return (
    <main className="process-workspace" data-process={definition.id}>
      <aside
        className="process-catalog"
        aria-label={t("过程步骤", "Process steps")}
      >
        <button
          className="back-button process-catalog-back"
          onClick={onBack}
          title={t("返回过程目录（Esc）", "Back to process catalog (Esc)")}
        >
          <ArrowLeft size={15} />
          {t("返回过程目录", "Back to processes")}
        </button>
        <h1 ref={titleRef} tabIndex={-1}>
          {definition.title[lang]}
        </h1>
        <button
          className="process-origin"
          disabled={!onStructure}
          onClick={() => {
            setPlaying(false);
            onStructure?.();
          }}
        >
          <span>{t("来自结构", "From structure")}</span>
          <strong>
            {originPath.map((id) => getNode(id, lang).name).join(" / ")}
          </strong>
          <span>
            {t("返回，保留视角", "Return to saved view")}{" "}
            <ChevronRight size={12} />
          </span>
        </button>
        <nav
          className="process-steps"
          aria-label={t("讲解步骤", "Explanation steps")}
        >
          {definition.stages.map((item, index) => (
            <button
              key={item.at}
              ref={stageIndex === index ? selectedStep : null}
              aria-current={stageIndex === index ? "step" : undefined}
              onClick={() => seek(item.at)}
            >
              <span className="process-step-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item.title[lang]}</span>
            </button>
          ))}
        </nav>
      </aside>
      <section
        className="process-stage"
        aria-label={t("交互过程模型", "Interactive process model")}
      >
        <div className="process-visual">
          <div className="process-scene-toolbar">
            <SceneActions
              lang={lang}
              ready={ready}
              onStudio={() => {
                setPlaying(false);
                onStudio?.();
              }}
              onShare={onShare}
            />
            {definition.legend && (
              <div
                className="process-legend"
                aria-label={t("颜色图例", "Color key")}
              >
                {definition.legend.map((item) => (
                  <span key={item.color}>
                    <i style={{ background: item.color }} aria-hidden="true" />
                    {item.text[lang]}
                  </span>
                ))}
              </div>
            )}
            <div className="process-view-tools">
              <button
                className={"icon-button " + (annotations ? "active" : "")}
                aria-pressed={annotations}
                aria-label={t("显示标签", "Show labels")}
                onClick={() => {
                  const next = !latest.current.annotations;
                  setAnnotations(next);
                  publishState({ annotations: next }, true);
                }}
              >
                <Tag size={17} />
              </button>
              <button
                className="icon-button"
                aria-label={t("放大", "Zoom in")}
                onClick={() =>
                  setZoom((v) => ({ direction: "in", key: v.key + 1 }))
                }
              >
                <Plus size={17} />
              </button>
              <button
                className="icon-button"
                aria-label={t("缩小", "Zoom out")}
                onClick={() =>
                  setZoom((v) => ({ direction: "out", key: v.key + 1 }))
                }
              >
                <Minus size={17} />
              </button>
              <button
                className="icon-button"
                aria-label={t("重置视角", "Reset view")}
                onClick={() => setResetKey((v) => v + 1)}
              >
                <RotateCcw size={17} />
              </button>
            </div>
          </div>
          <ProcessScene
            definition={definition}
            rootId={rootId}
            parameters={parameters}
            progress={progress}
            lang={lang}
            resetKey={resetKey}
            zoom={zoom}
            annotations={annotations}
            initialView={initial.camera}
            onViewChange={viewChanged}
            onSceneReady={sceneReady}
          />
        </div>
        <div className="process-transport">
          <div className="process-playback">
            <button
              className="process-play"
              aria-label={
                playing
                  ? t("暂停", "Pause")
                  : progress >= 1
                    ? t("重新播放", "Replay")
                    : t("播放", "Play")
              }
              onClick={togglePlayback}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <label className="sr-only" htmlFor="process-timeline">
              {t("过程时间线", "Process timeline")}
            </label>
            <input
              id="process-timeline"
              type="range"
              min="0"
              max="1000"
              step="1"
              value={Math.round(progress * 1000)}
              aria-valuetext={`${stage.title[lang]}, ${clock(progress, definition.duration)}`}
              onChange={(e) => seek(Number(e.target.value) / 1000)}
            />
            <span className="process-time">
              {clock(progress, definition.duration)} /{" "}
              {clock(1, definition.duration)}
            </span>
          </div>
          <div className="process-reading-controls">
            <button onClick={() => seek(0)} disabled={progress === 0}>
              <RotateCcw size={13} />
              {t("回到开头", "Start over")}
            </button>
            <label>
              {t("播放速度", "Speed")}
              <select
                value={speed}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setSpeed(next);
                  publishState({ speed: next }, true);
                }}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={1.5}>1.5×</option>
              </select>
            </label>
          </div>
          <div className="process-step-controls">
            <button
              disabled={stageIndex === 0}
              onClick={() => seek(definition.stages[stageIndex - 1].at)}
            >
              <ChevronLeft size={14} />
              {t("上一步", "Previous")}
            </button>
            <span>
              {t(
                "拖动旋转 · 拖动时间线查看",
                "Drag to rotate · Scrub to explore",
              )}
            </span>
            <button
              disabled={stageIndex === definition.stages.length - 1}
              onClick={() => seek(definition.stages[stageIndex + 1].at)}
            >
              {t("下一步", "Next")}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </section>
      <aside
        className="process-explanation"
        aria-label={t("过程说明", "Process explanation")}
      >
        {conditionNote && (
          <section className="process-condition-note" aria-live="polite">
            <span>{t("当前条件的响应", "Response to this condition")}</span>
            <strong>{conditionNote.title}</strong>
            <p>{conditionNote.body}</p>
          </section>
        )}
        <div aria-live="polite" aria-atomic="true">
          <p className="process-eyebrow">
            {conditionNote?.kind === "reference"
              ? t("机制参考", "Mechanism reference")
              : t("当前步骤", "Current step")}{" "}
            {String(stageIndex + 1).padStart(2, "0")} /{" "}
            {String(definition.stages.length).padStart(2, "0")}
          </p>
          <h2>{stage.title[lang]}</h2>
          <p className="process-stage-description">{stage.description[lang]}</p>
        </div>
        {definition.controls?.length > 0 && (
          <fieldset className="process-conditions">
            <legend>{t("改变条件", "Change a condition")}</legend>
            {definition.controls.map((control) => (
              <label key={control.id}>
                <span>{control.label[lang]}</span>
                <select
                  value={parameters[control.id]}
                  onChange={(event) => {
                    const next = {
                      ...latest.current.parameters,
                      [control.id]: event.target.value,
                    };
                    setPlaying(false);
                    progressRef.current = 0;
                    setProgress(0);
                    setParameters(next);
                    publishState({ progress: 0, parameters: next }, true);
                  }}
                >
                  {control.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label[lang]}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </fieldset>
        )}
        <nav
          className="process-continuity"
          aria-label={t("相关结构", "Related structures")}
        >
          <div className="continuity-heading">
            <span>{t("连接结构与过程", "Connect structure & process")}</span>
            <h3>{t("在结构中观察", "Explore the structures")}</h3>
          </div>
          {related.scope?.label && (
            <p className="continuity-scope">{related.scope.label[lang]}</p>
          )}
          {related.current.length > 0 ? (
            <div className="continuity-current">
              <p>{t("本步骤的结构入口", "Structure links for this step")}</p>
              {related.current.map(locationButton)}
            </div>
          ) : (
            <p className="continuity-empty">
              {related.other.length
                ? t(
                    "本步骤暂无单独结构入口。可展开其他步骤的关联结构。",
                    "No separate structure link for this step. Explore links from other steps below.",
                  )
                : t(
                    "结构目录尚未单独呈现此过程的作用部位。",
                    "The structure catalogue does not yet show a separate location for this mechanism.",
                  )}
            </p>
          )}
          {related.other.length > 0 && (
            <details className="continuity-other">
              <summary>
                {t("其他步骤的关联结构", "Structures across other steps")}{" "}
                <span>
                  {related.other.reduce(
                    (count, group) => count + group.entries.length,
                    0,
                  )}
                </span>
              </summary>
              {related.other.map((group) => (
                <div className="continuity-group" key={group.stage.at}>
                  <p>
                    {String(group.stageIndex + 1).padStart(2, "0")} ·{" "}
                    {group.stage.title[lang]}
                  </p>
                  {group.entries.map(locationButton)}
                </div>
              ))}
            </details>
          )}
          {related.scope && originPath.length > 1 && (
            <button
              className="continuity-overview"
              disabled={!onExploreStructure}
              onClick={() => {
                setPlaying(false);
                onExploreStructure?.(related.scope.path);
              }}
            >
              {t("查看整体结构", "Whole structure")} ·{" "}
              {getNode(rootId, lang).name}
              <ChevronRight size={13} aria-hidden="true" />
            </button>
          )}
          <p className="continuity-return">
            {t(
              "查看结构后，可从「接着观察过程」回到此处。",
              "After exploring, use “Resume process” to return here.",
            )}
          </p>
        </nav>
        <p className="process-context">{definition.intro[lang]}</p>
        <p className="process-disclaimer">
          {t(
            "教学示意：尺寸、时间与分子数量不按真实比例。",
            "Teaching schematic: sizes, timing and molecule counts are not to scale.",
          )}
        </p>
        <details className="process-references">
          <summary>{t("参考资料", "References")}</summary>
          {definition.sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noreferrer"
            >
              {typeof source.title === "object"
                ? source.title[lang]
                : source.title}
              <span aria-hidden="true"> ↗</span>
            </a>
          ))}
        </details>
      </aside>
    </main>
  );
}
