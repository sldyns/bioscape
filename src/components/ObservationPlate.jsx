import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { lockPageScroll } from "../scrollLock.js";
import "./observationPlate.css";

const tileWidth = 576,
  tileHeight = 360;
export const plateAspect = tileWidth / tileHeight;

// Each tile owns its 2D copy. The capture slot can then serve the next pose,
// and closing the dialog can cancel readback without disturbing the live model.
export default function ObservationPlate({ plate, lang, onClose, onChoose }) {
  const { scene, frames, title, subtitle } = plate;
  const dialog = useRef(null);
  const tiles = useRef([]);
  const [finished, setFinished] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const en = lang === "en";
  useLayoutEffect(() => {
    const panel = dialog.current;
    const previous = document.activeElement;
    const unlock = lockPageScroll();
    panel.showModal();
    return () => {
      panel.close();
      unlock();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    async function render() {
      setFailed(false);
      setFinished(0);
      for (const [index, frame] of frames.entries()) {
        // A browser using synchronous pixel readback still gets an input and
        // paint opportunity between poses.
        if (index) await new Promise((resolve) => setTimeout(resolve, 0));
        if (signal.aborted) return;
        const capture = scene.prepareCaptureFrame({
          ...frame.options,
          width: tileWidth,
          height: tileHeight,
          labels: false,
          background: "transparent",
          signal,
        });
        try {
          const image = await capture.ready;
          if (signal.aborted) return;
          const context = tiles.current[index]?.getContext("2d");
          if (!context) throw new Error("Frame canvas unavailable");
          context.clearRect(0, 0, tileWidth, tileHeight);
          context.drawImage(image, 0, 0);
          setFinished(index + 1);
        } finally {
          capture.release();
        }
      }
    }
    render().catch(() => {
      if (!signal.aborted) setFailed(true);
    });
    return () => {
      controller.abort();
      // The tiles keep their 2D copies. Release the offscreen targets when
      // the visitor returns to the live specimen or retries the plate.
      scene.releaseCapture?.();
    };
  }, [scene, frames, attempt]);
  return (
    <dialog
      className="observation-plate"
      ref={dialog}
      aria-labelledby="observation-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== dialog.current) return;
        const rect = dialog.current.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onClose();
      }}
    >
      <header>
        <div>
          <h2 id="observation-title">{title}</h2>
          <p>{subtitle}</p>
        </div>
        <button
          autoFocus
          type="button"
          onClick={onClose}
          aria-label={en ? "Close views" : "关闭图版"}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>
      <div
        className="observation-frames"
        data-count={frames.length}
        aria-busy={!failed && finished < frames.length}
      >
        {frames.map((frame, index) => (
          <button
            type="button"
            key={frame.key}
            onClick={() => onChoose(frame)}
            className="observation-tile"
          >
            <span className="observation-image" data-ready={index < finished}>
              <canvas
                ref={(node) => {
                  tiles.current[index] = node;
                }}
                width={tileWidth}
                height={tileHeight}
                aria-hidden="true"
              />
              {index >= finished && (
                <span>
                  {failed
                    ? en
                      ? "Preview unavailable"
                      : "预览暂不可用"
                    : en
                      ? "Rendering…"
                      : "正在渲染…"}
                </span>
              )}
            </span>
            <span className="observation-caption">
              <strong>{frame.label}</strong>
              {frame.detail && <small>{frame.detail}</small>}
            </span>
          </button>
        ))}
      </div>
      {failed && (
        <button
          className="observation-retry"
          type="button"
          onClick={() => setAttempt((v) => v + 1)}
        >
          {en ? "Retry previews" : "重新生成预览"}
        </button>
      )}
    </dialog>
  );
}
