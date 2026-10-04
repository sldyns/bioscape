import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Download,
  Film,
  Image,
  Link,
  LoaderCircle,
  Pause,
  Play,
  RefreshCw,
  X,
} from "lucide-react";
import {
  exportFilename,
  changePreference,
  loadPreferences,
  outputDimensions,
  savePreferences,
} from "./config.js";
import { canvasBlob, drawComposition } from "./composition.js";
import { preferredVideoFormat, recordVideo } from "./recordVideo.js";
import { createPreviewPlayback, previewScale } from "./previewPlayback.js";
import "./studio.css";

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function errorText(error, en) {
  if (error?.message === "VIDEO_UNSUPPORTED")
    return en
      ? "This browser cannot record canvas video. Try a current desktop browser; PNG export is still available."
      : "当前浏览器不支持模型视频录制。可使用新版桌面浏览器，或继续导出 PNG 图片";
  if (error?.message === "SCENE_NOT_READY")
    return en
      ? "The model is unavailable. Close the studio and reopen it after the model has loaded."
      : "模型暂不可用。请关闭工作台，待模型恢复后重新打开";
  return en
    ? "The export could not finish. Refresh the preview and try again, or choose a lower resolution."
    : "本次导出未能完成。请刷新预览后重试，或选择较低分辨率";
}

function ChoiceGroup({
  legend,
  value,
  options,
  onChange,
  disabled = false,
  className = "",
}) {
  return (
    <fieldset className={`studio-field ${className}`} disabled={disabled}>
      <legend>{legend}</legend>
      <div className="studio-choices">
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            aria-pressed={value === option.value}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            title={option.description}
          >
            {option.icon}
            {option.label}
            {option.detail && <small>{option.detail}</small>}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Export UI for a live, ready renderer. Capture never includes application controls. */
export default function Studio({ source, onClose, lang = "zh", onShare }) {
  const en = lang === "en";
  const t = (zh, english) => (en ? english : zh);
  const id = useId();
  const originalSource = useRef(source).current;
  const dialog = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const mounted = useRef(false);
  const recording = useRef(null);
  const imageResource = useRef(null);
  const videoResource = useRef(null);
  const previewCanvas = useRef(null);
  const previewStage = useRef(null);
  const playback = useRef(null);
  const fraction = useRef(0);
  const scrubber = useRef(null);
  const timeOutput = useRef(null);
  const [preferences, setPreferences] = useState(() =>
    loadPreferences(storage(), originalSource),
  );
  const [mode, setMode] = useState("image");
  const [previewReady, setPreviewReady] = useState(false);
  const [previewBounds, setPreviewBounds] = useState({
    width: 800,
    height: 600,
  });
  const [video, setVideo] = useState(null);
  const [playingPreview, setPlayingPreview] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [previewBusy, setPreviewBusy] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [shareBusy, setShareBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const format = useMemo(() => preferredVideoFormat(), []);
  const canRecord = Boolean(
    format && globalThis.HTMLCanvasElement?.prototype.captureStream,
  );
  const effectivePreferences = useMemo(
    () => ({
      ...preferences,
      background:
        mode === "video" && preferences.background === "transparent"
          ? "light"
          : preferences.background,
    }),
    [preferences, mode],
  );
  const { width, height } = outputDimensions(effectivePreferences);
  // A larger stage can retain the same pixel cap; keep its preview clock alive.
  const scale = previewScale(
    { width, height },
    previewBounds,
    window.devicePixelRatio,
  );
  const canExplode = Boolean(
    originalSource.canExplode || originalSource.api?.canExplode,
  );
  const exportBusy = isRecording || isExportingImage;

  const release = (ref) => {
    if (ref.current) URL.revokeObjectURL(ref.current.url);
    ref.current = null;
  };
  const releaseCapture = () => {
    try {
      originalSource.api?.releaseCapture?.();
    } catch {
      // Navigation may have already disposed the scene.
    }
  };

  useEffect(() => {
    mounted.current = true;
    const focused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const appRoot = document.getElementById("root");
    const previousInert = appRoot?.inert;
    if (appRoot) appRoot.inert = true;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector(".studio-close")?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeRef.current();
      } else if (event.key === "Tab") {
        const elements = [
          ...(dialog.current?.querySelectorAll(
            "button:not(:disabled), a[href], input:not(:disabled), video[controls], [tabindex='0']",
          ) || []),
        ].filter(
          (element) =>
            element.getClientRects().length &&
            !element.closest("fieldset:disabled"),
        );
        const first = elements[0],
          last = elements.at(-1);
        if (!first) return;
        if (
          !dialog.current.contains(document.activeElement) ||
          (!event.shiftKey && document.activeElement === last)
        ) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKey, true);
    return () => {
      mounted.current = false;
      recording.current?.abort();
      release(imageResource);
      release(videoResource);
      releaseCapture();
      window.removeEventListener("keydown", handleKey, true);
      document.body.style.overflow = previousOverflow;
      if (appRoot) appRoot.inert = previousInert;
      if (focused?.isConnected) focused.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => savePreferences(storage(), preferences), [preferences]);

  useEffect(() => {
    const stage = previewStage.current;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setPreviewBounds((previous) =>
        Math.abs(previous.width - width) < 1 &&
        Math.abs(previous.height - height) < 1
          ? previous
          : { width, height },
      );
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (exportBusy || (mode === "video" && video)) return;
    const canvas = previewCanvas.current;
    let firstFrame = true;
    setPreviewBusy(true);
    setPlayingPreview(false);
    setError("");
    const clock = createPreviewPlayback({
      duration: preferences.duration,
      initialFraction: fraction.current,
      drawFrame(value) {
        const started = performance.now();
        drawComposition(canvas, originalSource, effectivePreferences, {
          lang,
          fraction: mode === "video" ? value : undefined,
          scale,
          reuseFrame: true,
        });
        canvas.dataset.frames = String(Number(canvas.dataset.frames || 0) + 1);
        canvas.dataset.drawMs = String(performance.now() - started);
        canvas.dataset.fraction = String(value);
        if (firstFrame) {
          firstFrame = false;
          setPreviewReady(true);
          setPreviewBusy(false);
        }
      },
      onProgress(value) {
        fraction.current = value;
        if (scrubber.current)
          scrubber.current.value = String(Math.round(value * 1000));
        if (timeOutput.current)
          timeOutput.current.textContent = `${(value * preferences.duration).toFixed(1)} / ${preferences.duration}s`;
      },
      onPlayingChange: setPlayingPreview,
      onError(cause) {
        setPreviewReady(false);
        setPreviewBusy(false);
        setError(errorText(cause, en));
      },
    });
    playback.current = clock;
    const handleVisibility = () => {
      if (document.hidden) clock.pause();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clock.dispose();
      if (playback.current === clock) playback.current = null;
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [
    effectivePreferences,
    originalSource,
    lang,
    en,
    mode,
    refresh,
    exportBusy,
    video,
    scale,
    width,
    height,
  ]);

  async function downloadImage() {
    if (exportBusy) return;
    playback.current?.pause();
    setIsExportingImage(true);
    setError("");
    const canvas = document.createElement("canvas");
    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      if (!mounted.current) return;
      drawComposition(canvas, originalSource, effectivePreferences, {
        lang,
        reuseFrame: true,
      });
      const blob = await canvasBlob(canvas);
      if (!mounted.current) return;
      release(imageResource);
      const next = { url: URL.createObjectURL(blob), blob };
      imageResource.current = next;
      const link = document.createElement("a");
      link.href = next.url;
      link.download = exportFilename(originalSource.title, "png");
      link.click();
    } catch (cause) {
      if (mounted.current) setError(errorText(cause, en));
    } finally {
      canvas.width = canvas.height = 0;
      releaseCapture();
      if (mounted.current) setIsExportingImage(false);
    }
  }

  function update(key, value) {
    if (exportBusy) return;
    const next = changePreference(
      preferences,
      key,
      value,
      originalSource,
      mode,
    );
    if (next === preferences) return;
    setNotice("");
    playback.current?.pause();
    release(videoResource);
    setVideo(null);
    setPreferences(next);
  }

  async function startRecording() {
    if (recording.current || !canRecord) return;
    const controller = new AbortController();
    recording.current = controller;
    release(videoResource);
    setVideo(null);
    setError("");
    setNotice("");
    setProgress(0);
    playback.current?.pause();
    setIsRecording(true);
    const canvas = document.createElement("canvas");
    try {
      const result = await recordVideo({
        canvas,
        duration: preferences.duration,
        signal: controller.signal,
        drawFrame: (fraction) =>
          drawComposition(canvas, originalSource, effectivePreferences, {
            fraction,
            lang,
            reuseFrame: true,
          }),
        onProgress: (value) => {
          if (mounted.current) setProgress(value);
        },
      });
      if (!mounted.current || controller.signal.aborted) return;
      const next = { ...result, url: URL.createObjectURL(result.blob) };
      videoResource.current = next;
      setVideo(next);
      setNotice(
        t(
          "视频已完成，可以播放检查并下载",
          "Your video is ready to play and download.",
        ),
      );
    } catch (cause) {
      if (mounted.current) {
        if (cause.name === "AbortError")
          setNotice(t("录制已取消", "Recording cancelled."));
        else setError(errorText(cause, en));
      }
    } finally {
      canvas.width = canvas.height = 0;
      releaseCapture();
      if (recording.current === controller) recording.current = null;
      if (mounted.current) setIsRecording(false);
    }
  }

  async function share() {
    if (!onShare || shareBusy) return;
    setShareBusy(true);
    setCopied(false);
    try {
      const snapshot = await originalSource.getSnapshot?.();
      const url = await onShare(snapshot);
      if (!mounted.current) return;
      if (typeof url !== "string" || !url) throw new Error("SHARE_FAILED");
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        if (mounted.current) setCopied(true);
      } catch {
        /* The visible link remains available for manual copying. */
      }
    } catch {
      if (mounted.current)
        setError(
          t(
            "场景链接生成失败，请重试",
            "The scene link could not be created. Try again.",
          ),
        );
    } finally {
      if (mounted.current) setShareBusy(false);
    }
  }

  const motionOptions = [
    ...(originalSource.kind === "process"
      ? [{ value: "process", label: t("完整过程", "Full process") }]
      : []),
    { value: "turn", label: t("环绕旋转", "Orbit") },
    ...(canExplode
      ? [{ value: "explode", label: t("展开与复原", "Disassemble") }]
      : []),
  ];
  const extension = video?.extension;
  return createPortal(
    <div
      className="studio-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="studio-dialog"
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-description`}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <header className="studio-header">
          <div>
            <p className="studio-eyebrow">BIOSCAPE STUDIO</p>
            <h2 id={`${id}-title`}>
              {t("影像工作台", "Image & motion studio")}
            </h2>
            <p id={`${id}-description`}>{originalSource.title}</p>
          </div>
          <button
            type="button"
            className="studio-close"
            onClick={onClose}
            aria-label={t("关闭工作台", "Close studio")}
          >
            <X size={20} />
          </button>
        </header>
        <div className="studio-body">
          <div className="studio-preview-column">
            <div className="studio-preview-heading">
              <span>
                {mode === "video" && video
                  ? t("视频预览", "Video preview")
                  : t("导出预览", "Export preview")}
              </span>
              <div className="studio-preview-tools">
                <span>
                  {width} × {height}
                </span>
                <button
                  type="button"
                  onClick={() => setRefresh((value) => value + 1)}
                  disabled={
                    exportBusy ||
                    previewBusy ||
                    Boolean(video && mode === "video")
                  }
                  aria-label={t("刷新预览", "Refresh preview")}
                  title={t("刷新预览", "Refresh preview")}
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
            <div
              className={`studio-preview-stage ${effectivePreferences.background === "transparent" ? "studio-transparent" : ""}`}
              ref={previewStage}
              aria-busy={previewBusy || exportBusy}
            >
              <canvas
                ref={previewCanvas}
                role="img"
                aria-label={t(
                  `${originalSource.title}的导出预览`,
                  `Export preview of ${originalSource.title}`,
                )}
                style={{
                  display:
                    !previewReady || (mode === "video" && video)
                      ? "none"
                      : "block",
                }}
              />
              {mode === "video" && video ? (
                <video
                  key={video.url}
                  src={video.url}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={t("已录制的视频", "Recorded video")}
                />
              ) : !previewReady ? (
                <div className="studio-empty">
                  <Image size={32} strokeWidth={1.25} />
                  <span>
                    {previewBusy
                      ? t("正在准备画面", "Preparing your composition")
                      : t("预览暂不可用", "Preview unavailable")}
                  </span>
                </div>
              ) : null}
              {(previewBusy || exportBusy) && (
                <div className="studio-preview-status">
                  <LoaderCircle className="studio-spinner" size={15} />
                  <span>
                    {isRecording
                      ? t(
                          `录制中 ${Math.round(progress * 100)}%`,
                          `Recording ${Math.round(progress * 100)}%`,
                        )
                      : isExportingImage
                        ? t("正在导出图片", "Exporting image")
                        : t("正在更新预览", "Updating preview")}
                  </span>
                </div>
              )}
            </div>
            {mode === "video" && !video && (
              <div className="studio-scrubber">
                <button
                  type="button"
                  onClick={() =>
                    playingPreview
                      ? playback.current?.pause()
                      : playback.current?.play()
                  }
                  disabled={exportBusy || !previewReady}
                  aria-pressed={playingPreview}
                  aria-label={
                    playingPreview
                      ? t("暂停预览", "Pause preview")
                      : t("播放预览", "Play preview")
                  }
                  title={
                    playingPreview
                      ? t("暂停预览", "Pause preview")
                      : t("播放预览", "Play preview")
                  }
                >
                  {playingPreview ? <Pause size={17} /> : <Play size={17} />}
                </button>
                <input
                  ref={scrubber}
                  type="range"
                  min="0"
                  max="1000"
                  defaultValue={Math.round(fraction.current * 1000)}
                  onChange={(event) =>
                    playback.current?.seek(Number(event.target.value) / 1000)
                  }
                  disabled={exportBusy || !previewReady}
                  aria-label={t("视频预览进度", "Video preview progress")}
                />
                <output ref={timeOutput}>
                  {(fraction.current * preferences.duration).toFixed(1)} /{" "}
                  {preferences.duration}s
                </output>
              </div>
            )}
          </div>
          <div className="studio-settings">
            <div
              className="studio-mode"
              aria-label={t("导出类型", "Export type")}
            >
              <button
                type="button"
                aria-pressed={mode === "image"}
                disabled={exportBusy}
                onClick={() => {
                  setMode("image");
                  playback.current?.pause();
                  setNotice("");
                }}
              >
                <Image size={16} />
                {t("图片", "Image")}
              </button>
              <button
                type="button"
                aria-pressed={mode === "video"}
                disabled={exportBusy}
                onClick={() => {
                  setMode("video");
                  setNotice("");
                }}
              >
                <Film size={16} />
                {t("短视频", "Video")}
              </button>
            </div>
            {mode === "video" && (
              <>
                <ChoiceGroup
                  legend={t("运动方式", "Motion")}
                  value={preferences.motion}
                  options={motionOptions}
                  disabled={exportBusy}
                  onChange={(value) => update("motion", value)}
                />
                <ChoiceGroup
                  legend={t("时长", "Duration")}
                  value={preferences.duration}
                  options={[6, 10, 15].map((value) => ({
                    value,
                    label: `${value} ${t("秒", "s")}`,
                  }))}
                  disabled={exportBusy}
                  onChange={(value) => update("duration", value)}
                />
                <p className="studio-format-note">
                  {canRecord
                    ? t(
                        `输出 ${format.extension.toUpperCase()} · 无声视频。录制时请保持此标签页可见`,
                        `${format.extension.toUpperCase()} output · silent video. Keep this tab visible while recording.`,
                      )
                    : errorText({ message: "VIDEO_UNSUPPORTED" }, en)}
                </p>
              </>
            )}
            <ChoiceGroup
              legend={t("画幅", "Composition")}
              value={preferences.composition}
              disabled={exportBusy}
              className="studio-compositions"
              onChange={(value) => update("composition", value)}
              options={[
                {
                  value: "landscape",
                  label: t("横屏", "Landscape"),
                  detail: "16:9",
                  icon: <span className="studio-shape studio-landscape" />,
                },
                {
                  value: "portrait",
                  label: t("竖屏", "Portrait"),
                  detail: "9:16",
                  icon: <span className="studio-shape studio-portrait" />,
                },
                {
                  value: "square",
                  label: t("方形", "Square"),
                  detail: "1:1",
                  icon: <span className="studio-shape studio-square" />,
                },
              ]}
            />
            <ChoiceGroup
              legend={t("构图留白", "Framing")}
              value={preferences.framing}
              disabled={exportBusy}
              onChange={(value) => update("framing", value)}
              options={[
                { value: "full", label: t("舒展", "Fitted") },
                { value: "airy", label: t("留白", "Spacious") },
              ]}
            />
            <ChoiceGroup
              legend={t("分辨率 · 长边", "Resolution · long edge")}
              value={preferences.resolution}
              disabled={exportBusy}
              onChange={(value) => update("resolution", value)}
              options={[
                { value: 1920, label: "1920 px" },
                { value: 2560, label: "2560 px" },
              ]}
            />
            <ChoiceGroup
              legend={t("背景", "Background")}
              value={effectivePreferences.background}
              disabled={exportBusy}
              className="studio-backgrounds"
              onChange={(value) => update("background", value)}
              options={[
                {
                  value: "light",
                  label: t("浅色", "Light"),
                  icon: <span className="studio-swatch studio-swatch-light" />,
                },
                {
                  value: "dark",
                  label: t("深色", "Dark"),
                  icon: <span className="studio-swatch studio-swatch-dark" />,
                },
                {
                  value: "transparent",
                  label: t("透明", "Clear"),
                  disabled: mode === "video",
                  description: t(
                    "透明背景适用于 PNG 图片",
                    "Transparency is available for PNG images",
                  ),
                  icon: <span className="studio-swatch studio-checkerboard" />,
                },
              ]}
            />
            <fieldset
              className="studio-field studio-toggles"
              disabled={exportBusy}
            >
              <legend>{t("画面内容", "Include in export")}</legend>
              {[
                ["labels", t("结构标签", "Structure labels")],
                ["title", t("标题与说明", "Title and subtitle")],
              ].map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    onChange={(event) => update(key, event.target.checked)}
                  />
                  <span className="studio-toggle" aria-hidden="true" />
                </label>
              ))}
            </fieldset>
          </div>
        </div>
        <footer className="studio-footer">
          <div className="studio-feedback" aria-live="polite">
            {error && (
              <p className="studio-error" role="alert">
                {error}
              </p>
            )}
            {notice && <p className="studio-notice">{notice}</p>}
            {isRecording && (
              <div className="studio-progress">
                <progress
                  value={progress}
                  max="1"
                  aria-label={t("录制进度", "Recording progress")}
                />
                <span>
                  {progress === 1
                    ? t("正在完成编码…", "Finishing encoding…")
                    : t(
                        `正在录制 · ${Math.round(progress * 100)}%`,
                        `Recording · ${Math.round(progress * 100)}%`,
                      )}
                </span>
              </div>
            )}
            {shareUrl && (
              <label className="studio-share-link">
                <span>
                  {copied
                    ? t("链接已复制", "Link copied")
                    : t("复制场景链接", "Copy scene link")}
                </span>
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  onFocus={(event) => event.target.select()}
                  aria-label={t("场景分享链接", "Scene share link")}
                />
              </label>
            )}
          </div>
          <div className="studio-actions">
            {onShare && (
              <button
                type="button"
                className="studio-secondary"
                onClick={share}
                disabled={shareBusy || exportBusy}
              >
                {shareBusy ? (
                  <LoaderCircle size={15} className="studio-spinner" />
                ) : copied ? (
                  <Check size={15} />
                ) : (
                  <Link size={15} />
                )}
                {t("分享场景", "Share scene")}
              </button>
            )}
            <div className="studio-export-actions">
              {mode === "video" &&
                (isRecording ? (
                  <button
                    type="button"
                    className="studio-secondary"
                    onClick={() => recording.current?.abort()}
                  >
                    {t("取消录制", "Cancel recording")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className={video ? "studio-secondary" : "studio-primary"}
                    disabled={!canRecord || previewBusy || !previewReady}
                    onClick={startRecording}
                  >
                    <Film size={15} />
                    {video
                      ? t("重新录制", "Record again")
                      : t("录制视频", "Record video")}
                  </button>
                ))}
              {mode === "image" && (
                <button
                  type="button"
                  className="studio-primary"
                  onClick={downloadImage}
                  disabled={exportBusy || previewBusy || !previewReady}
                >
                  {isExportingImage ? (
                    <LoaderCircle size={15} className="studio-spinner" />
                  ) : (
                    <Download size={15} />
                  )}
                  {t("下载 PNG", "Download PNG")}
                </button>
              )}
              {mode === "video" && video && !isRecording && (
                <a
                  className="studio-primary"
                  href={video.url}
                  download={exportFilename(originalSource.title, extension)}
                >
                  <Download size={15} />
                  {t(
                    `下载 ${extension.toUpperCase()}`,
                    `Download ${extension.toUpperCase()}`,
                  )}
                </a>
              )}
            </div>
          </div>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
