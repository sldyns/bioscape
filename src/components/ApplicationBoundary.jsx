import React, { Component, useEffect, useRef } from "react";
import { readSceneState } from "../exploration/state.js";
import { RESUME_STORAGE_KEY, safeSceneHash } from "../home/routes.js";

function RecoveryPage() {
  const heading = useRef(null);
  let savedLanguage;
  try {
    const stored = localStorage.getItem("cell-atlas-language");
    if (stored === "en" || stored === "zh") savedLanguage = stored;
  } catch {}
  const en =
    (readSceneState(window.location.hash)?.lang ||
      savedLanguage ||
      document.documentElement.lang) === "en";
  useEffect(() => {
    document.documentElement.lang = en ? "en" : "zh-CN";
    document.title = en ? "BioScape · Try again" : "BioScape · 重新加载";
    heading.current?.focus();
  }, [en]);

  function returnHome() {
    const hash = safeSceneHash(window.location.hash);
    if (hash) {
      try {
        sessionStorage.setItem(RESUME_STORAGE_KEY, hash);
      } catch {}
    }
    try {
      localStorage.setItem("cell-atlas-language", en ? "en" : "zh");
    } catch {}
    // A full reload clears rejected lazy imports, including nested process
    // modules. Keep the deployment path and query when returning home.
    window.history.replaceState(null, "", "#/");
    window.location.reload();
  }

  return (
    <main className="application-recovery">
      <div className="application-recovery-card">
        <p className="application-recovery-brand">BioScape</p>
        <h1 ref={heading} tabIndex={-1}>
          {en ? "This page could not be displayed" : "页面暂时无法显示"}
        </h1>
        <p>
          {en
            ? "Please try loading this page again, or return to the homepage and continue exploring."
            : "请尝试重新加载此页面，或返回首页继续探索。"}
        </p>
        <div className="application-recovery-actions">
          <button type="button" onClick={() => window.location.reload()}>
            {en ? "Reload page" : "重新加载"}
          </button>
          <button type="button" onClick={returnHome}>
            {en ? "Return to homepage" : "返回首页"}
          </button>
        </div>
      </div>
    </main>
  );
}

// Suspense handles pending imports; this boundary also handles their rejection
// and render failures so a failed scene cannot leave the entire site blank.
export default class ApplicationBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("BioScape could not display the page", error);
  }

  render() {
    return this.state.failed ? <RecoveryPage /> : this.props.children;
  }
}
