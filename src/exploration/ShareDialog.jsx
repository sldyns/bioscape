import React, { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";

export default function ShareDialog({ url, lang, onClose }) {
  const root = useRef(),
    input = useRef();
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const en = lang === "en";
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    input.current?.focus();
    input.current?.select();
    const key = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onClose();
      }
      if (event.key === "Tab") {
        const elements = [
          ...root.current.querySelectorAll("button,input,a[href]"),
        ];
        const first = elements[0],
          last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", key, true);
    return () => {
      window.removeEventListener("keydown", key, true);
      document.body.style.overflow = overflow;
      previous?.isConnected && previous.focus();
    };
  }, [onClose]);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setFailed(false);
    } catch {
      input.current?.focus();
      input.current?.select();
      setFailed(true);
    }
  }
  return (
    <div
      className="share-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        ref={root}
        className="share-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
      >
        <button
          className="icon-button share-close"
          onClick={onClose}
          aria-label={en ? "Close" : "关闭"}
        >
          <X size={20} />
        </button>
        <p className="exploration-eyebrow">
          BIOSCAPE / {en ? "SCENE LINK" : "场景链接"}
        </p>
        <h2 id="share-title">{en ? "Share this view" : "分享此刻的视角"}</h2>
        <p>
          {en
            ? "This link saves the view, display settings and current process or comparison. Anyone opening it can continue exploring."
            : "链接会保存当前视角、显示方式，以及过程进度或对比对象。打开后，可以接着探索。"}
        </p>
        <label htmlFor="scene-link">{en ? "Scene link" : "场景链接"}</label>
        <input ref={input} id="scene-link" readOnly value={url} />
        <button className="share-copy" onClick={copy}>
          {copied ? <Check size={16} /> : <Copy size={16} />}{" "}
          {copied ? (en ? "Copied" : "已复制") : en ? "Copy link" : "复制链接"}
        </button>
        <span role="status">
          {failed
            ? en
              ? "Copy is unavailable here. Select the link and copy it manually."
              : "当前浏览器无法自动复制，请选中链接手动复制。"
            : copied
              ? en
                ? "Link copied to clipboard."
                : "链接已复制到剪贴板。"
              : ""}
        </span>
      </section>
    </div>
  );
}
