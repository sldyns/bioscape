import React, { useEffect, useId, useRef } from "react";
import { lockPageScroll } from "../scrollLock.js";

export default function StudioLoading({ lang, onClose }) {
  const id = useId();
  const cancelButton = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  const en = lang === "en";
  useEffect(() => {
    const releaseScroll = lockPageScroll();
    cancelButton.current?.focus({ preventScroll: true });
    const key = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close.current();
      } else if (event.key === "Tab") {
        event.preventDefault();
        cancelButton.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("keydown", key, true);
      releaseScroll();
    };
  }, []);
  return (
    <div
      className="share-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <section
        className="share-dialog studio-loading-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-status`}
      >
        <h2 id={`${id}-title`}>
          {en ? "Image & motion studio" : "影像工作台"}
        </h2>
        <p id={`${id}-status`} role="status">
          {en ? "Preparing Studio…" : "正在准备工作台…"}
        </p>
        <button className="share-copy" ref={cancelButton} onClick={onClose}>
          {en ? "Cancel" : "取消"}
        </button>
      </section>
    </div>
  );
}
