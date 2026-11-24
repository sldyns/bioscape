import React, { useLayoutEffect, useRef, useState } from "react";

export default function PlateComparison({
  frames,
  scene,
  tiles,
  initialIndex,
  lang,
  onChoose,
}) {
  const en = lang === "en";
  const first = Math.min(initialIndex, frames.length - 2);
  const [pair, setPair] = useState([first, first + 1]);
  const [split, setSplit] = useState(50);
  const copies = useRef(new Map());
  const imageArea = useRef(null);
  const range = useRef(null);
  const [width, setWidth] = useState(0);
  const [refining, setRefining] = useState(false);
  const lower = Math.min(...pair),
    upper = Math.max(...pair);
  useLayoutEffect(() => {
    const area = imageArea.current;
    const measure = () => {
      const deviceWidth = area.clientWidth * (window.devicePixelRatio || 1);
      // Multiples of eight preserve the 8:5 camera framing at both resolutions.
      setWidth(Math.min(1536, Math.ceil(deviceWidth / 8) * 8));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const pending = [];
    for (const index of [lower, upper]) {
      const target = copies.current.get(index);
      const tile = tiles.current[index];
      if (!target.dataset.populated) {
        target.width = tile.width;
        target.height = tile.height;
        target.getContext("2d").drawImage(tile, 0, 0);
        target.dataset.populated = "true";
      }
      if (target.width < width) pending.push([index, target]);
    }
    setRefining(Boolean(pending.length));
    async function refine() {
      // The grid stays available immediately. Only the selected photographs
      // are resampled for a large or Retina display, using one capture slot.
      for (const [index, target] of pending) {
        if (signal.aborted) return;
        const height = (width * 5) / 8;
        const capture = scene.prepareCaptureFrame({
          ...frames[index].options,
          width,
          height,
          labels: false,
          background: "transparent",
          signal,
        });
        try {
          const photo = await capture.ready;
          if (signal.aborted) return;
          target.width = width;
          target.height = height;
          target.getContext("2d").drawImage(photo, 0, 0);
        } finally {
          capture.release();
        }
      }
    }
    // A device that cannot allocate the larger target keeps its grid-size photos.
    refine()
      .catch(() => {})
      .finally(() => {
        if (!signal.aborted) setRefining(false);
      });
    return () => controller.abort();
  }, [lower, upper, width, frames, scene, tiles]);
  const sides = en ? ["Left", "Right"] : ["左图", "右图"];
  function select(side, index) {
    setPair((current) => {
      const other = 1 - side;
      if (current[other] === index) return [current[1], current[0]];
      const next = [...current];
      next[side] = index;
      return next;
    });
  }
  function moveDivider(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    setSplit(
      Math.max(
        0,
        Math.min(
          100,
          Math.round((100 * (event.clientX - rect.left)) / rect.width),
        ),
      ),
    );
  }
  return (
    <section
      className="plate-comparison"
      aria-label={en ? "Image comparison" : "图像对照"}
    >
      <div className="plate-comparison-choices">
        {pair.map((index, side) => (
          <label key={side}>
            <span>{sides[side]}</span>
            <select
              value={index}
              onChange={(event) => select(side, Number(event.target.value))}
            >
              {frames.map((frame, i) => (
                <option key={frame.key} value={i}>
                  {frame.label} · {frame.detail}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <div
        className="plate-comparison-image"
        ref={imageArea}
        aria-busy={refining}
        style={{ "--split": split + "%" }}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          range.current.focus({ preventScroll: true });
          moveDivider(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            moveDivider(event);
        }}
      >
        {pair.map((index) => (
          <canvas
            key={frames[index].key}
            ref={(node) => {
              if (node) copies.current.set(index, node);
              else copies.current.delete(index);
            }}
            aria-hidden="true"
          />
        ))}
        <span className="plate-divider" aria-hidden="true" />
      </div>
      <label className="plate-comparison-slider">
        <span>{en ? "Divider" : "分界线"}</span>
        <input
          type="range"
          min="0"
          max="100"
          value={split}
          ref={range}
          aria-valuetext={en ? `Left image ${split}%` : `左图占 ${split}%`}
          onChange={(event) => setSplit(Number(event.target.value))}
        />
        <output aria-hidden="true">{split}%</output>
      </label>
      <div className="plate-comparison-open">
        {pair.map((index, side) => (
          <button
            type="button"
            key={side}
            onClick={() => onChoose(frames[index])}
          >
            {en
              ? `Open ${sides[side].toLowerCase()} view`
              : `打开${sides[side]}`}
          </button>
        ))}
      </div>
    </section>
  );
}
