import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import HomePage from "./HomePage.jsx";
import {
  isHomeHash,
  RESUME_STORAGE_KEY,
  safeSceneHash,
  resumeSceneHash,
} from "./routes.js";
import { createSceneHistorySession } from "../exploration/historySession.js";
import { readSceneState, sceneHash } from "../exploration/state.js";
import { parsePath, parseExperience, parseProcess } from "../navigation";
import { getNode } from "../hierarchy";
import { processCatalog } from "../processes/catalog";
import { DEFAULT_COMPARISON_STATE } from "../compare/state.js";

const App = lazy(() => import("../App.jsx"));
const stored = (storage, key) => {
  try {
    return window[storage].getItem(key);
  } catch {
    return null;
  }
};

function describeResume(hash) {
  if (!hash) return null;
  const path = parsePath(hash);
  const processId = parseProcess(hash);
  const comparison = readSceneState(hash)?.compare;
  const label = comparison
    ? { zh: "结构对比", en: "Structure comparison" }
    : processId
      ? processCatalog[processId].title
      : {
          zh: getNode(path.at(-1), "zh").name,
          en: getNode(path.at(-1), "en").name,
        };
  return {
    hash,
    href: hash,
    rootId: path[0],
    processId,
    experience: parseExperience(hash),
    label,
  };
}

export default function HomeRouter() {
  const [home, setHome] = useState(() => isHomeHash(location.hash));
  const [lang, setLang] = useState(() =>
    stored("localStorage", "cell-atlas-language") === "en" ? "en" : "zh",
  );
  const [resumeHash, setResumeHash] = useState(() =>
    safeSceneHash(stored("sessionStorage", RESUME_STORAGE_KEY)),
  );
  const historySession = useRef(createSceneHistorySession());
  const remember = useCallback((hash) => {
    const safe = safeSceneHash(hash);
    if (!safe) return;
    setResumeHash(safe);
    try {
      sessionStorage.setItem(RESUME_STORAGE_KEY, safe);
    } catch {}
  }, []);
  useEffect(() => {
    const route = () => {
      const nextHome = isHomeHash(location.hash);
      setHome(nextHome);
      if (nextHome)
        setLang(
          stored("localStorage", "cell-atlas-language") === "en" ? "en" : "zh",
        );
    };
    window.addEventListener("popstate", route);
    window.addEventListener("hashchange", route);
    return () => {
      window.removeEventListener("popstate", route);
      window.removeEventListener("hashchange", route);
    };
  }, []);
  useEffect(() => {
    if (!home) return;
    document.documentElement.lang = lang === "en" ? "en" : "zh-CN";
    document.title =
      lang === "en"
        ? "BioScape · Explore life in 3D"
        : "BioScape · 探索生命的微观世界";
  }, [home, lang]);
  const onLangChange = (value) => {
    const next = value === "en" ? "en" : "zh";
    setLang(next);
    try {
      localStorage.setItem("cell-atlas-language", next);
    } catch {}
  };
  const explore = (hash) => {
    const safe = safeSceneHash(hash);
    if (!safe) return;
    history.pushState(null, "", safe);
    setHome(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const goHome = (hash) => {
    remember(hash);
    setLang(
      stored("localStorage", "cell-atlas-language") === "en" ? "en" : "zh",
    );
    history.pushState(null, "", "#/");
    setHome(true);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  return home ? (
    <HomePage
      lang={lang}
      onLangChange={onLangChange}
      onExplore={explore}
      onResume={() => explore(resumeSceneHash(resumeHash, lang))}
      resume={describeResume(resumeSceneHash(resumeHash, lang))}
      onCompare={() =>
        explore(
          sceneHash("#/cell", { lang, compare: DEFAULT_COMPARISON_STATE }),
        )
      }
    />
  ) : (
    <Suspense
      fallback={
        <div role="status">
          {lang === "en" ? "Loading scene…" : "正在载入场景…"}
        </div>
      }
    >
      <App
        historySession={historySession.current}
        onHome={goHome}
        onSceneLeave={remember}
      />
    </Suspense>
  );
}
