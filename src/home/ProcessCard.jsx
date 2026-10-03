import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Play } from "lucide-react";
import { assetUrl } from "../assetUrl.js";

export const processMotionIds = ["transcription", "mitosis", "photosynthesis"];

const featuredSummaries = {
  transcription: [
    "以 DNA 为模板，合成 RNA",
    "RNA synthesis from a DNA template.",
  ],
  mitosis: [
    "纺锤体连接染色体，分离姐妹染色单体",
    "Spindle attachment and sister chromatid separation.",
  ],
  photosynthesis: [
    "从吸收光能，到固定二氧化碳",
    "From harvesting light to fixing carbon dioxide.",
  ],
  actionPotential: [
    "钠、钾通道接力，让电信号沿轴突传播",
    "Sodium and potassium channels propagate an axonal signal.",
  ],
  respiration: [
    "电子传递建立质子梯度，驱动 ATP 合成",
    "Electron transfer builds the proton gradient for ATP synthesis.",
  ],
  phageLytic: [
    "在大肠杆菌内复制、组装，最终裂解释放",
    "Replication and assembly in E. coli, followed by lytic release.",
  ],
};

export default function ProcessCard({
  entry,
  lang,
  active,
  onActivate,
  onDeactivate,
  onFollow,
}) {
  const video = useRef(null);
  const card = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const hasMotion = processMotionIds.includes(entry.id);
  const showVideo = hasMotion && active && !reduced && visible;
  useEffect(() => {
    if (!hasMotion) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(preference.matches);
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, [hasMotion]);
  useEffect(() => {
    if (!hasMotion) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(card.current);
    return () => observer.disconnect();
  }, [hasMotion]);
  useEffect(() => {
    setPlaying(false);
    setEnded(false);
    if (!showVideo) return;
    const element = video.current;
    element?.play().catch(() => setPlaying(false));
    return () => element?.pause();
  }, [showVideo]);
  return (
    <a
      ref={card}
      className={`home-process-card${playing ? " is-playing" : ""}`}
      href={entry.href}
      onClick={(event) => onFollow(event, entry.href)}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch" && hasMotion) onActivate(entry.id);
      }}
      onPointerLeave={onDeactivate}
      onFocus={() => {
        if (hasMotion) onActivate(entry.id);
      }}
      onBlur={onDeactivate}
    >
      <div className="home-process-media">
        <img
          src={assetUrl(entry.image)}
          alt=""
          width="640"
          height="480"
          loading="lazy"
          decoding="async"
        />
        {showVideo && (
          <video
            ref={video}
            src={assetUrl(`home/processes/${entry.id}.webm`)}
            className={playing || ended ? "is-visible" : ""}
            muted
            playsInline
            preload="none"
            aria-hidden="true"
            onPlaying={() => setPlaying(true)}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
            }}
            onError={() => {
              setPlaying(false);
              setEnded(false);
            }}
          />
        )}
        <span className="home-play" aria-hidden="true">
          <Play size={17} fill="currentColor" />
        </span>
      </div>
      <div className="home-process-info">
        <h3>
          {entry.title[lang]}
          <ArrowUpRight size={17} />
        </h3>
        {featuredSummaries[entry.id] && (
          <p>{featuredSummaries[entry.id][lang === "en" ? 1 : 0]}</p>
        )}
      </div>
    </a>
  );
}
