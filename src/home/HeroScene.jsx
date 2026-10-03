import React, {
  Component,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { assetUrl } from "../assetUrl.js";

const loadScene = () => import("../CellScene.jsx");
const CellScene = lazy(loadScene);
const featured = [
  { id: "cell", zh: "动物细胞", en: "Animal cell", mode: "section" },
  { id: "plant", zh: "植物细胞", en: "Plant cell", mode: "section" },
  { id: "neuron", zh: "神经元", en: "Neuron", mode: "whole" },
];
const defaultZoom = { direction: null, key: 0 };

class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure();
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const en = this.props.lang === "en";
    return (
      <div className="webgl-error home-hero-error" role="alert">
        <p>
          {en
            ? "The 3D preview could not load. You can still explore the model below."
            : "三维预览暂时未能加载，仍可通过下方入口探索模型。"}
        </p>
        <button type="button" onClick={this.props.onRetry}>
          {en ? "Try again" : "重新加载"}
        </button>
      </div>
    );
  }
}

export default function HeroScene({ lang, onExplore }) {
  const t = (zh, en) => (lang === "en" ? en : zh);
  const language = lang === "en" ? "en" : "zh";
  const [selected, setSelected] = useState("cell");
  const [Scene, setScene] = useState(() => CellScene);
  const [retryKey, setRetryKey] = useState(0);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const host = useRef(null);
  const model = featured.find(({ id }) => id === selected);
  // Keep this callback stable: CellScene also publishes its current API when
  // the callback changes, which must not dismiss a new model's poster early.
  const receiveScene = useCallback((api) => setReady(Boolean(api?.ready)), []);
  const failScene = useCallback(() => setReady(false), []);
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(preference.matches);
    preference.addEventListener("change", change);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) =>
              setVisible(
                entry.isIntersecting && entry.intersectionRatio >= 0.05,
              ),
            { threshold: [0, 0.05] },
          );
    if (host.current) observer?.observe(host.current);
    return () => {
      preference.removeEventListener("change", change);
      observer?.disconnect();
    };
  }, []);
  function choose(id) {
    if (id === selected) return;
    setReady(false);
    setSelected(id);
  }
  function retryScene() {
    setReady(false);
    // React.lazy caches rejected promises; a fresh lazy type permits retry.
    setScene(() => lazy(loadScene));
    setRetryKey((key) => key + 1);
  }
  return (
    <div className="home-hero-art" ref={host}>
      <div className="home-hero-orbit" aria-hidden="true" />
      <div
        className="home-hero-stage"
        data-ready={ready}
        role="region"
        aria-label={t(`${model.zh}三维预览`, `${model.en} 3D preview`)}
        onPointerDown={() => setPaused(true)}
      >
        {!ready && (
          <img
            className="home-hero-poster"
            src={assetUrl(`home/models/${selected}.webp`)}
            alt={model[language]}
            width="1400"
            height="1400"
            fetchPriority="high"
          />
        )}
        <SceneBoundary
          key={retryKey}
          lang={language}
          onFailure={failScene}
          onRetry={retryScene}
        >
          <Suspense fallback={null}>
            <Scene
              nodeId={selected}
              viewKey={`home-${selected}`}
              mode={model.mode}
              explode={0}
              labels={false}
              highlight={null}
              rotate={!paused && visible && !reduced}
              resetKey={0}
              zoom={defaultZoom}
              lang={language}
              allowZoom={false}
              autoRotateLimit={0.38}
              onSceneReady={receiveScene}
              onEnter={(id) => onExplore(`#/${selected}/${id}`)}
            />
          </Suspense>
        </SceneBoundary>
      </div>
      <div className="home-hero-controls">
        <div
          className="home-hero-switch"
          role="group"
          aria-label={t("首屏模型", "Featured model")}
        >
          {featured.map((item) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={selected === item.id}
              onClick={() => choose(item.id)}
            >
              {item[language]}
            </button>
          ))}
        </div>
        <div className="home-hero-tools">
          <button
            className="home-motion-toggle"
            type="button"
            onClick={() => setPaused((current) => !current)}
            disabled={reduced || !ready}
            aria-label={
              reduced
                ? t("已遵循减少动态效果设置", "Reduced motion is enabled")
                : t("自动旋转", "Automatic rotation")
            }
            aria-pressed={!paused && !reduced}
            title={
              reduced
                ? t("已遵循减少动态效果设置", "Reduced motion is enabled")
                : paused
                  ? t("开始自动旋转", "Start rotation")
                  : t("暂停自动旋转", "Pause rotation")
            }
          >
            {paused || reduced ? (
              <Play size={14} aria-hidden="true" />
            ) : (
              <Pause size={14} aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="home-hero-open"
            onClick={() => onExplore(`#/${selected}`)}
            aria-label={t(`探索${model.zh}`, `Explore ${model.en}`)}
            title={t(`探索${model.zh}`, `Explore ${model.en}`)}
          >
            <ArrowUpRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
