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
} from "lucide-react";
import ProcessScene from "./ProcessScene";
import { processCatalog, relatedStructures } from "./catalog";
import { getNode } from "../hierarchy";
import { pathHash } from "../navigation";
import "./processes.css";
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
}) {
  const definition = useMemo(
    () => ({ ...baseDefinition, ...baseDefinition.contexts?.[rootId] }),
    [baseDefinition, rootId],
  );
  const [parameters, setParameters] = useState(() =>
    Object.fromEntries(
      (definition.controls ?? []).map((control) => [
        control.id,
        control.default,
      ]),
    ),
  );
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [zoom, setZoom] = useState({ direction: null, key: 0 });
  const progressRef = useRef(0);
  const selectedStep = useRef(null);
  const en = lang === "en",
    t = (zh, english) => (en ? english : zh);
  const stageIndex = Math.max(
    0,
    definition.stages.findLastIndex((stage) => progress + 0.00001 >= stage.at),
  );
  const stage = definition.stages[stageIndex];

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
  }
  function togglePlayback() {
    if (progressRef.current >= 1) {
      progressRef.current = 0;
      setProgress(0);
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
        published = now;
      }
      if (progressRef.current >= 1) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, suspended, definition, speed]);

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
                onChange={(event) => setSpeed(Number(event.target.value))}
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
        <div aria-live="polite" aria-atomic="true">
          <p className="process-eyebrow">
            {t("当前步骤", "Current step")}{" "}
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
                    seek(0);
                    setParameters((current) => ({
                      ...current,
                      [control.id]: event.target.value,
                    }));
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
        {relatedStructures[definition.id]?.[rootId]?.length > 0 && (
          <nav
            className="process-related"
            aria-label={t("相关结构", "Related structures")}
          >
            <p>{t("看看相关结构", "Explore the structures")}</p>
            {(relatedStructures[definition.id]?.[rootId] ?? []).map((path) => (
              <a key={path.join("/")} href={pathHash([rootId, ...path])}>
                {getNode(path.at(-1), lang).name}
                <ChevronRight size={12} />
              </a>
            ))}
          </nav>
        )}
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
