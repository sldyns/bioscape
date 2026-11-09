import React, { useEffect, useId, useRef } from "react";
import { lockPageScroll } from "../scrollLock.js";

export default function StudioLoading({ lang, onClose, onReload }) {
  const id = useId();
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const reloadButton = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  const t = (zh, en) => (lang === "en" ? en : zh);
  useEffect(() => {
    const releaseScroll = lockPageScroll();
    closeButton.current?.focus({ preventScroll: true });
    const key = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close.current();
      } else if (event.key === "Tab") {
        const first = closeButton.current;
        const last = reloadButton.current ?? first;
        const active = document.activeElement;
        if (
          !dialog.current?.contains(active) ||
          active === (event.shiftKey ? first : last)
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first)?.focus({ preventScroll: true });
        }
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
        ref={dialog}
        className="share-dialog studio-loading-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-status`}
      >
        <h2 id={`${id}-title`}>{t("影像工作台", "Image & motion studio")}</h2>
        <p id={`${id}-status`} role={onReload ? "alert" : "status"}>
          {onReload
            ? t("工作台暂时无法打开。", "Studio could not be opened.")
            : t("正在准备工作台…", "Preparing Studio…")}
        </p>
        <div className="studio-loading-actions">
          <button
            type="button"
            className="share-copy"
            ref={closeButton}
            onClick={onClose}
          >
            {onReload ? t("关闭", "Close") : t("取消", "Cancel")}
          </button>
          {onReload && (
            <button
              type="button"
              className="share-copy"
              ref={reloadButton}
              onClick={onReload}
            >
              {t("重新加载页面", "Reload page")}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
