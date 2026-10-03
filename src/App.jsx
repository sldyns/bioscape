import { project } from "./project";
import AboutModel from "./components/AboutModel";
import ProcessDirectory from "./processes/ProcessDirectory";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  lazy,
  Suspense,
} from "react";
import {
  ArrowLeft,
  ChevronRight,
  Info,
  Minus,
  Plus,
  RotateCcw,
  Tag,
  Rotate3D,
} from "lucide-react";
const CellScene = lazy(() => import("./CellScene"));
const ProcessExperience = lazy(() => import("./processes/ProcessExperience"));
const CompareWorkspace = lazy(() => import("./compare/CompareWorkspace.jsx"));
const Studio = lazy(() => import("./studio/Studio.jsx"));
import SceneActions from "./exploration/SceneActions.jsx";
import ViewerHeading from "./exploration/ViewerHeading.jsx";
import ShareDialog from "./exploration/ShareDialog.jsx";
import { createSceneHistorySession } from "./exploration/historySession.js";
import { isHomeHash } from "./home/routes.js";
import { readSceneState, sceneHash, sceneUrl } from "./exploration/state.js";
import { getProcessesForStructure } from "./exploration/relationships.js";
import { prepareRelatedProcessEntry } from "./exploration/relatedProcessEntry.js";
import { normalizeComparisonState, isComparisonId } from "./compare/state.js";
import "./exploration/exploration.css";

import { getNode, modelNotes } from "./hierarchy";
import { specializedSpecimens } from "./compare/specimens.js";
import { cellTypes, rootIds, contextNotes } from "./catalog/cellTypes";

import {
  parsePath,
  parseExperience,
  parseProcess,
  experienceHash,
  processRoots,
} from "./navigation";
import { processCatalog, resolveProcess } from "./processes/catalog";
import { describeView } from "./viewContext";
const readPath = () => parsePath(window.location.hash);
function moveControlFocus(event, vertical = false) {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const buttons = Array.from(event.currentTarget.querySelectorAll("button"));
  const current = buttons.indexOf(document.activeElement);
  if (current < 0 || !buttons.length) return;
  const forward =
    event.key === "ArrowRight" || (vertical && event.key === "ArrowDown");
  const backward =
    event.key === "ArrowLeft" || (vertical && event.key === "ArrowUp");
  const next = forward
    ? (current + 1) % buttons.length
    : backward
      ? (current - 1 + buttons.length) % buttons.length
      : event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : null;
  if (next !== null) {
    event.preventDefault();
    buttons[next].focus();
  }
}
export default function App({ historySession, onHome, onSceneLeave }) {
  const [sharedState] = useState(
    () =>
      historySession?.recall(location.hash, history.state) ||
      readSceneState(location.hash),
  );
  const [lang, setLang] = useState(() => {
    if (sharedState) return sharedState.lang;
    try {
      return localStorage.getItem("cell-atlas-language") === "en" ? "en" : "zh";
    } catch {
      return "zh";
    }
  });
  const [path, setPath] = useState(readPath),
    [experience, setExperience] = useState(() =>
      parseExperience(location.hash),
    ),
    [processId, setProcessId] = useState(() => parseProcess(location.hash)),
    [mode, setMode] = useState(
      sharedState?.origin?.mode || sharedState?.mode || "section",
    ),
    [explode, setExplode] = useState(
      sharedState?.origin?.explode ?? sharedState?.explode ?? 60,
    ),
    [labels, setLabels] = useState(
      sharedState?.origin?.labels ?? sharedState?.labels ?? false,
    ),
    [rotate, setRotate] = useState(false),
    [resetKey, setResetKey] = useState(0),
    [zoom, setZoom] = useState({ direction: null, key: 0 }),
    [about, setAbout] = useState(false),
    [highlight, setHighlight] = useState(null),
    [contracted, setContracted] = useState(
      sharedState?.origin?.contracted ?? sharedState?.contracted ?? false,
    ),
    [sceneCapabilities, setCapabilities] = useState({}),
    [initialView, setInitialView] = useState(sharedState?.camera),
    [sessionKey, setSessionKey] = useState(0),
    [comparison, setComparison] = useState(
      sharedState?.compare
        ? normalizeComparisonState(sharedState.compare)
        : null,
    ),
    [sceneReady, setSceneReady] = useState(false),
    [studio, setStudio] = useState(null),
    [share, setShare] = useState(null),
    [lastProcesses, setLastProcesses] = useState(() =>
      parseProcess(location.hash)
        ? {
            [readPath()[0]]: {
              path: readPath(),
              id: parseProcess(location.hash),
            },
          }
        : {},
    );
  const entrySession = useRef(historySession || createSceneHistorySession()),
    studioFocus = useRef(null),
    sceneActive = useRef(true),
    sceneUrlTimer = useRef(null);
  const sceneApi = useRef(null),
    comparisonState = useRef(comparison),
    processState = useRef({
      ...sharedState?.process,
      camera: sharedState?.camera,
    }),
    processStates = useRef(new Map()),
    structureCamera = useRef(
      sharedState?.origin?.camera || sharedState?.camera,
    );
  const modalOpen = about || Boolean(studio) || Boolean(share);
  const receiveScene = useCallback((api) => {
    sceneApi.current = api;
    setSceneReady(Boolean(api?.ready));
  }, []);
  const flushSceneUrl = useCallback(() => {
    clearTimeout(sceneUrlTimer.current);
    if (!sceneActive.current || isHomeHash(location.hash)) return;
    const current = navigation.current;
    if (!current) return;
    const state = current.snapshot();
    const hash = sceneHash(
      experienceHash(current.path, current.experience, current.processId),
      state,
    );
    entrySession.current.remember(state);
    if (location.hash !== hash)
      history.replaceState(entrySession.current.updateHash(hash), "", hash);
  }, []);
  const scheduleSceneUrl = useCallback(() => {
    clearTimeout(sceneUrlTimer.current);
    if (!sceneActive.current) return;
    sceneUrlTimer.current = setTimeout(flushSceneUrl, 200);
  }, [flushSceneUrl]);
  const receiveView = useCallback(
    (camera) => {
      structureCamera.current = camera;
      scheduleSceneUrl();
    },
    [scheduleSceneUrl],
  );
  const receiveProcessState = useCallback(
    (value, { immediate = false } = {}) => {
      processState.current = value;
      // A reload can commit its destination before pagehide. Discrete user
      // controls therefore publish their URL in the input event itself.
      if (immediate) flushSceneUrl();
      else scheduleSceneUrl();
    },
    [flushSceneUrl, scheduleSceneUrl],
  );
  const receiveComparison = useCallback(
    (value) => {
      comparisonState.current = value;
      scheduleSceneUrl();
    },
    [scheduleSceneUrl],
  );
  useEffect(() => {
    sceneActive.current = true;
    // Reload must keep the latest view even while the debounce is still pending.
    window.addEventListener("pagehide", flushSceneUrl);
    return () => {
      sceneActive.current = false;
      clearTimeout(sceneUrlTimer.current);
      window.removeEventListener("pagehide", flushSceneUrl);
    };
  }, [flushSceneUrl]);
  useEffect(() => {
    scheduleSceneUrl();
  }, [lang, mode, explode, labels, contracted, scheduleSceneUrl]);
  const closeShare = useCallback(() => setShare(null), []);
  const aboutRef = useRef(),
    selectedType = useRef(),
    catalogTitle = useRef(),
    restoreCatalogFocus = useRef(false),
    previousFocus = useRef(),
    viewStates = useRef(
      new Map(
        sharedState
          ? [[readPath().join("/"), sharedState.origin || sharedState]]
          : [],
      ),
    ),
    navigation = useRef();
  const en = lang === "en",
    t = (zh, english) => (en ? english : zh),
    lastProcess = lastProcesses[path[0]];
  const id = path.at(-1),
    node = getNode(id, lang),
    scopePath = node.children.length ? path : path.slice(0, -1),
    scopeId = scopePath.at(-1) || path[0],
    scope = getNode(scopeId, lang),
    note = (contextNotes[path[0]]?.[id] || modelNotes[id])?.[lang];
  const capabilities = sceneCapabilities.nodeId === id ? sceneCapabilities : {};
  const labelsAvailable =
    capabilities.labels &&
    (!capabilities.labelModes || capabilities.labelModes.includes(mode));
  const viewContext = describeView(path, lang);
  function receiveCapabilities(next) {
    if (next.nodeId !== id) return;
    setCapabilities(next);
    if (
      (!next.cutaway && mode === "section") ||
      (!next.explode && mode === "explode")
    )
      setMode("whole");
  }
  function structureSnapshot() {
    return {
      mode,
      explode,
      labels,
      contracted,
      camera:
        experience === "structure" && !comparison
          ? sceneApi.current?.getView() || structureCamera.current
          : viewStates.current.get(path.join("/"))?.camera,
    };
  }
  function snapshot() {
    const structure = structureSnapshot();
    return {
      v: 1,
      lang,
      ...structure,
      ...(experience === "process" && processId
        ? {
            process: processState.current,
            camera:
              (!comparison && sceneApi.current?.getView()) ||
              processState.current.camera,
            origin: viewStates.current.get(path.join("/")) || structure,
          }
        : {}),
      ...(comparison ? { compare: comparisonState.current } : {}),
    };
  }
  function saveCurrent() {
    entrySession.current.remember(snapshot());
    if (experience === "structure" && !comparison)
      viewStates.current.set(path.join("/"), structureSnapshot());
    if (experience === "process" && processId && !comparison)
      processStates.current.set(`${path[0]}:${processId}`, {
        ...processState.current,
        camera: sceneApi.current?.getView() || processState.current.camera,
      });
  }
  function leaveForHome() {
    saveCurrent();
    flushSceneUrl();
    sceneActive.current = false;
    onHome?.(location.hash);
  }
  function navigate(
    next,
    push = true,
    nextExperience = "structure",
    nextProcess = null,
    restored = null,
    restoreEntry = false,
    captured = false,
  ) {
    nextProcess =
      nextExperience === "process"
        ? resolveProcess(next[0], nextProcess)
        : null;
    if (!processRoots.has(next[0])) nextExperience = "structure";
    if (
      !restored &&
      !restoreEntry &&
      !comparison &&
      next.join("/") === path.join("/") &&
      experience === nextExperience &&
      processId === nextProcess
    )
      return;
    restoreCatalogFocus.current =
      document.activeElement?.matches(":focus-visible") ?? false;
    if (!captured) saveCurrent();
    if (push) {
      const hash = sceneHash(
        experienceHash(path, experience, processId),
        snapshot(),
      );
      history.replaceState(entrySession.current.updateHash(hash), "", hash);
    }
    if (restored?.origin)
      viewStates.current.set(next.join("/"), restored.origin);
    const saved =
      restored && nextExperience === "structure"
        ? restored
        : viewStates.current.get(next.join("/"));
    const nextSession = restored?.process
      ? { ...restored.process, camera: restored.camera }
      : processStates.current.get(`${next[0]}:${nextProcess}`) || {};
    processState.current = nextSession;
    structureCamera.current = saved?.camera;
    comparisonState.current = restored?.compare
      ? normalizeComparisonState(restored.compare)
      : null;
    setComparison(comparisonState.current);
    setStudio(null);
    setShare(null);
    setAbout(false);
    if (restored) setLang(restored.lang);
    setHighlight(null);
    setRotate(false);
    setSceneReady(false);
    sceneApi.current = null;
    setPath(next);
    setExperience(nextExperience);
    setProcessId(nextProcess);
    setMode(saved?.mode || "section");
    setExplode(saved?.explode ?? 60);
    setLabels(saved?.labels ?? false);
    setContracted(saved?.contracted ?? false);
    setInitialView(saved?.camera);
    if (restoreEntry) setSessionKey((key) => key + 1);
    if (nextExperience === "process" && nextProcess)
      setLastProcesses((previous) => ({
        ...previous,
        [next[0]]: { path: next, id: nextProcess },
      }));
    if (push) {
      const hash = experienceHash(next, nextExperience, nextProcess);
      history.pushState(entrySession.current.begin(hash), "", hash);
    }
  }
  function openRelatedProcess(item) {
    const key = `${path[0]}:${item.id}`;
    processStates.current.set(
      key,
      prepareRelatedProcessEntry(processStates.current.get(key), item),
    );
    navigate(path, true, "process", item.id);
  }
  function openComparison() {
    saveCurrent();
    const underlying = snapshot();
    const previousHash = sceneHash(
      experienceHash(path, experience, processId),
      underlying,
    );
    history.replaceState(
      entrySession.current.updateHash(previousHash),
      "",
      previousHash,
    );
    const next = normalizeComparisonState({
      left: {
        id: isComparisonId(id) ? id : path[0],
        mode,
        explode,
        labels,
        view: sceneApi.current?.getView(),
      },
      right: {
        id:
          {
            cell: "plant",
            plant: "cell",
            bacterium: "cell",
            yeast: "plant",
            paramecium: "cell",
            phage: "bacterium",
            erythrocyte: "neuron",
            neuron: "muscleFibre",
            muscleFibre: "neuron",
          }[path[0]] || "plant",
        mode: "whole",
        labels: false,
      },
    });
    comparisonState.current = next;
    setComparison(next);
    setRotate(false);
    setSceneReady(false);
    sceneApi.current = null;
    const hash = sceneHash(experienceHash(path, experience, processId), {
      ...underlying,
      compare: next,
    });
    history.pushState(entrySession.current.begin(hash), "", hash);
  }
  const createShareUrl = () =>
    sceneUrl(experienceHash(path, experience, processId), snapshot());
  function shareScene() {
    const url = createShareUrl();
    setShare(url);
    return url;
  }
  function openStudio() {
    const api = sceneApi.current;
    if (!api?.ready) return;
    studioFocus.current = document.activeElement;
    setRotate(false);
    setStudio({
      api,
      kind: comparison ? "comparison" : experience,
      title: comparison
        ? t("结构对比", "Structure comparison")
        : experience === "process"
          ? processCatalog[processId].title[lang]
          : node.name,
      subtitle: comparison
        ? [comparisonState.current.left.id, comparisonState.current.right.id]
            .map((key) => getNode(key, lang).name)
            .join(" · ")
        : experience === "process"
          ? processCatalog[processId].summary?.[lang] || ""
          : viewContext,
      processId: experience === "process" && !comparison ? processId : null,
      rootId: path[0],
      getFrameCaption: api.getFrameCaption?.bind(api),
      scientificNote: api.getScientificNote?.(),
      canExplode:
        !comparison && experience === "structure" && Boolean(api.canExplode),
      getSnapshot: snapshot,
    });
  }
  navigation.current = {
    saveCurrent,
    snapshot,
    navigate,
    path,
    about: modalOpen,
    experience,
    processId,
    comparison,
  };
  function enter(next) {
    if (node.children.includes(next)) navigate([...path, next]);
  }
  useEffect(() => {
    const canonical = (state) =>
      sceneHash(
        experienceHash(
          readPath(),
          parseExperience(location.hash),
          parseProcess(location.hash),
        ),
        state,
      );
    const pop = () => {
      const originalHash = location.hash;
      clearTimeout(sceneUrlTimer.current);
      if (isHomeHash(originalHash)) {
        sceneActive.current = false;
        const current = navigation.current;
        current.saveCurrent();
        onSceneLeave?.(
          sceneHash(
            experienceHash(current.path, current.experience, current.processId),
            current.snapshot(),
          ),
        );
        return;
      }
      sceneActive.current = true;
      if (entrySession.current.isCurrent(originalHash, history.state)) return;
      navigation.current.saveCurrent();
      const state =
        entrySession.current.recall(originalHash, history.state) ||
        readSceneState(originalHash);
      const next = readPath(),
        nextExperience = parseExperience(originalHash),
        nextProcess = parseProcess(originalHash);
      const metadata = entrySession.current.activate(
        originalHash,
        history.state,
      );
      const hash = canonical(state);
      // Publish the latest local snapshot so a subsequent reload restores it too.
      history.replaceState(
        { bioscape: { ...metadata.bioscape, hash } },
        "",
        hash,
      );
      navigation.current.navigate(
        next,
        false,
        nextExperience,
        nextProcess,
        state,
        true,
        true,
      );
    };
    const hash = canonical(sharedState);
    history.replaceState(
      entrySession.current.activate(hash, history.state),
      "",
      hash,
    );
    const key = (e) => {
      if (
        e.key === "Escape" &&
        !e.defaultPrevented &&
        !e.target.closest?.("dialog[open]") &&
        !navigation.current.about &&
        (navigation.current.comparison ||
          navigation.current.path.length > 1 ||
          navigation.current.experience === "process") &&
        !e.target.isContentEditable &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)
      ) {
        e.preventDefault();
        const current = navigation.current;
        if (current.comparison)
          current.navigate(
            current.path,
            true,
            current.experience,
            current.processId,
          );
        else if (current.experience === "process")
          current.navigate(
            current.path,
            true,
            current.processId ? "process" : "structure",
            null,
          );
        else current.navigate(current.path.slice(0, -1));
      }
    };
    window.addEventListener("popstate", pop);
    window.addEventListener("hashchange", pop);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("popstate", pop);
      window.removeEventListener("hashchange", pop);
      window.removeEventListener("keydown", key);
    };
  }, []);
  useEffect(() => {
    if (matchMedia("(max-width:700px)").matches)
      window.scrollTo({ top: 0, behavior: "instant" });
    if (restoreCatalogFocus.current && catalogTitle.current) {
      catalogTitle.current?.focus({ preventScroll: true });
      restoreCatalogFocus.current = false;
    }
  }, [path, experience, processId]);
  useEffect(() => {
    const button = selectedType.current,
      rail = button?.parentElement;
    if (rail)
      rail.scrollTo({
        left:
          button.offsetLeft -
          rail.offsetLeft -
          (rail.clientWidth - button.offsetWidth) / 2,
        behavior: "instant",
      });
  }, [path[0], lang]);
  useEffect(() => {
    document.documentElement.lang = en ? "en" : "zh-CN";
    document.title = `${comparison ? t("结构对比", "Structure comparison") : experience === "process" ? (processCatalog[processId]?.title[lang] ?? t("生物学过程", "Biological processes")) : node.name} · ${project.name}`;
    try {
      localStorage.setItem("cell-atlas-language", lang);
    } catch {}
  }, [lang, en, node.name, experience, path, processId, comparison]);
  useEffect(() => {
    if (!about) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    aboutRef.current?.querySelector("button")?.focus();
    const key = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setAbout(false);
      }
      if (e.key === "Tab") {
        const items = aboutRef.current?.querySelectorAll("button,a[href]");
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (!aboutRef.current.contains(document.activeElement)) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
      const focusTarget = previousFocus.current?.isConnected
        ? previousFocus.current
        : catalogTitle.current;
      focusTarget?.focus({ preventScroll: true });
    };
  }, [about]);
  useEffect(() => {
    if (!studio && studioFocus.current) {
      const target = studioFocus.current;
      studioFocus.current = null;
      (target.isConnected ? target : catalogTitle.current)?.focus({
        preventScroll: true,
      });
    }
  }, [studio]);
  const openAbout = () => {
    previousFocus.current = document.activeElement;
    setAbout(true);
  };
  const reset = () => {
    setRotate(false);
    setResetKey((k) => k + 1);
  };
  const ProcessView = processId ? ProcessExperience : ProcessDirectory;
  return (
    <div className={`atlas${comparison ? " is-comparing" : ""}`}>
      <header className="app-header" inert={modalOpen ? true : undefined}>
        <button
          className="wordmark"
          onClick={leaveForHome}
          aria-label={t("返回首页", "Go to homepage")}
        >
          {project.name}
          <span>{t(project.nameZh, "")}</span>
        </button>
        <nav className="breadcrumbs" aria-label={t("当前位置", "Location")}>
          {comparison ? (
            <span className="breadcrumb-current" aria-current="page">
              {t("结构比较", "Structure comparison")}
            </span>
          ) : (
            (experience === "process" ? path.slice(0, 1) : path).map(
              (key, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight size={13} />}
                  <button
                    aria-current={
                      (experience === "structure" && i === path.length - 1) ||
                      (experience === "process" && !processId)
                        ? "page"
                        : undefined
                    }
                    onClick={() =>
                      navigate(path.slice(0, i + 1), true, experience, null)
                    }
                  >
                    {i === 0
                      ? (cellTypes.find((type) => type.id === key)?.[lang] ??
                        getNode(key, lang).name)
                      : getNode(key, lang).name}
                  </button>
                </React.Fragment>
              ),
            )
          )}
          {!comparison && experience === "process" && processId && (
            <>
              <ChevronRight size={13} />
              <span className="breadcrumb-current" aria-current="page">
                {processCatalog[processId]?.title[lang]}
              </span>
            </>
          )}
        </nav>
        <div className="header-actions">
          <button
            className="language"
            onClick={() => setLang(en ? "zh" : "en")}
            aria-label={en ? "切换为中文" : "Switch to English"}
          >
            <span className={!en ? "active" : ""}>中</span>
            <span className="separator">/</span>
            <span className={en ? "active" : ""}>EN</span>
          </button>
          <button
            className="icon-button"
            onClick={openAbout}
            aria-label={t("关于模型", "About this model")}
            title={t("关于模型", "About this model")}
          >
            <Info size={19} />
          </button>
        </div>
      </header>
      {!comparison && (
        <nav
          className="cell-type-switch"
          aria-label={t("模型类型", "Model type")}
          inert={modalOpen ? true : undefined}
          onKeyDown={moveControlFocus}
        >
          {cellTypes.map((type) => (
            <button
              key={type.id}
              ref={path[0] === type.id ? selectedType : null}
              aria-pressed={path[0] === type.id}
              onClick={() => navigate([type.id], true, experience)}
            >
              {type[lang]}
            </button>
          ))}
        </nav>
      )}
      {!comparison && processRoots.has(path[0]) && (
        <div className="experience-bar" inert={modalOpen ? true : undefined}>
          <div
            className="experience-switch"
            role="group"
            onKeyDown={moveControlFocus}
            aria-label={t("学习方式", "Learning view")}
          >
            <button
              aria-pressed={experience === "structure"}
              onClick={() => navigate(path, true, "structure")}
            >
              {t("结构", "Structure")}
            </button>
            <button
              aria-pressed={experience === "process"}
              onClick={() =>
                experience !== "process" &&
                navigate(path, true, "process", null)
              }
            >
              {t("生物学过程", "Biological processes")}
            </button>
          </div>
        </div>
      )}
      {comparison ? (
        <div inert={modalOpen ? true : undefined}>
          <Suspense
            fallback={
              <div className="process-loading" role="status">
                {t("正在准备对比…", "Preparing comparison…")}
              </div>
            }
          >
            <CompareWorkspace
              key={sessionKey}
              lang={lang}
              initialState={comparison}
              onStateChange={receiveComparison}
              onClose={() => navigate(path, true, experience, processId)}
              onSceneReady={receiveScene}
              suspended={modalOpen}
              onShare={shareScene}
              onStudio={openStudio}
            />
          </Suspense>
        </div>
      ) : experience === "process" ? (
        <div inert={modalOpen ? true : undefined}>
          <Suspense
            fallback={
              <div className="process-loading" role="status">
                {t("正在准备", "Preparing ")}
                {processCatalog[processId]?.title[lang] ??
                  t("过程目录", "process catalog")}
                …
              </div>
            }
          >
            <ProcessView
              key={`${path[0]}:${processId}:${sessionKey}`}
              processId={processId}
              rootId={path[0]}
              lang={lang}
              suspended={modalOpen}
              onSelect={(key) => navigate(path, true, "process", key)}
              onBack={() => navigate(path, true, "process", null)}
              onStructure={() => navigate(path, true, "structure")}
              originPath={path}
              onExploreStructure={(next) => navigate(next)}
              initialState={processState.current}
              onStateChange={receiveProcessState}
              onSceneReady={receiveScene}
              onStudio={openStudio}
              onShare={shareScene}
              titleRef={catalogTitle}
              restoreFocus={restoreCatalogFocus}
            />
          </Suspense>
        </div>
      ) : (
        <main
          className="anatomy-workspace"
          inert={modalOpen ? true : undefined}
        >
          <aside
            className="catalog"
            aria-label={t("结构目录", "Structure catalog")}
          >
            <div className="catalog-heading">
              {path.length > 1 ? (
                <button
                  className="back-button"
                  title={t("返回上一级（Esc）", "Go up one level (Esc)")}
                  onClick={() => navigate(path.slice(0, -1))}
                >
                  <ArrowLeft size={16} />
                  {path.length === 2
                    ? t(
                        `返回${getNode(path[0]).name}`,
                        `Back to ${getNode(path[0], "en").name}`,
                      )
                    : t("返回", "Back")}
                </button>
              ) : (
                <span className="catalog-caption">
                  {t("结构目录", "Structures")}
                </span>
              )}
              <h1 ref={catalogTitle} tabIndex={-1}>
                {scope.name}
              </h1>
            </div>
            <nav
              className="catalog-list"
              aria-label={t("当前层级结构", "Structures at this level")}
              onKeyDown={(event) => moveControlFocus(event, true)}
            >
              <button
                className={
                  "catalog-item overview " + (id === scopeId ? "active" : "")
                }
                aria-current={id === scopeId ? "page" : undefined}
                onClick={() =>
                  navigate(scopePath.length ? scopePath : [path[0]])
                }
              >
                {t("总览", "Overview")}
              </button>
              {scope.children.map((key) => {
                const child = getNode(key, lang);
                return (
                  <button
                    className={"catalog-item " + (id === key ? "active" : "")}
                    key={key}
                    onPointerEnter={() => setHighlight(key)}
                    onPointerLeave={() => setHighlight(null)}
                    onFocus={() => setHighlight(key)}
                    onBlur={() => setHighlight(null)}
                    aria-current={id === key ? "page" : undefined}
                    onClick={() => navigate([...scopePath, key])}
                  >
                    <span
                      className="structure-mark"
                      style={{ background: child.color }}
                    />
                    <span>{child.name}</span>
                    <ChevronRight size={15} />
                  </button>
                );
              })}
            </nav>
          </aside>
          <section
            className={`viewer${id === "phageTail" ? " has-mechanism" : ""}${mode === "explode" ? " is-exploded" : ""}`}
            aria-label={t("模型视图", "Model view")}
          >
            <Suspense
              fallback={
                <div className="model-loading" role="status">
                  {t("正在准备模型…", "Preparing model…")}
                </div>
              }
            >
              <CellScene
                key={sessionKey}
                nodeId={id}
                viewKey={path.join("/")}
                highlight={highlight}
                onEnter={enter}
                mode={mode}
                explode={explode}
                labels={labels}
                rotate={rotate && !modalOpen}
                resetKey={resetKey}
                zoom={zoom}
                lang={lang}
                contracted={contracted}
                onCapabilities={receiveCapabilities}
                onSceneReady={receiveScene}
                initialView={initialView}
                onViewChange={receiveView}
              />
            </Suspense>
            <ViewerHeading
              title={node.name}
              subtitle={path.length > 1 ? getNode(path[0], lang).name : ""}
            >
              <SceneActions
                lang={lang}
                ready={sceneReady}
                onStudio={openStudio}
                onShare={shareScene}
                onCompare={openComparison}
              />
            </ViewerHeading>
            <div className="zoom-tools">
              <button
                className="icon-button"
                onClick={() => setZoom({ direction: "in", key: Date.now() })}
                aria-label={t("放大", "Zoom in")}
                title={t("放大", "Zoom in")}
              >
                <Plus size={17} />
              </button>
              <button
                className="icon-button"
                onClick={() => setZoom({ direction: "out", key: Date.now() })}
                aria-label={t("缩小", "Zoom out")}
                title={t("缩小", "Zoom out")}
              >
                <Minus size={17} />
              </button>
            </div>
            <div className="viewer-controls">
              {id === "phageTail" && mode !== "explode" && (
                <div className="mechanism-switch">
                  <span>{t("尾鞘", "Sheath")}</span>
                  <div
                    className="view-modes"
                    role="group"
                    aria-label={t("尾鞘状态", "Sheath state")}
                  >
                    <button
                      aria-pressed={!contracted}
                      className={!contracted ? "active" : ""}
                      onClick={() => setContracted(false)}
                    >
                      {t("伸展", "Extended")}
                    </button>
                    <button
                      aria-pressed={contracted}
                      className={contracted ? "active" : ""}
                      onClick={() => setContracted(true)}
                    >
                      {t("收缩", "Contracted")}
                    </button>
                  </div>
                </div>
              )}
              {mode === "explode" && capabilities.explode && (
                <div className="separation">
                  <label htmlFor="separation">
                    {t("分离程度", "Separation")}
                  </label>
                  <input
                    id="separation"
                    type="range"
                    min="0"
                    max="100"
                    value={explode}
                    aria-valuetext={`${explode}%`}
                    onChange={(e) => setExplode(+e.target.value)}
                  />
                </div>
              )}
              <div className="control-row">
                {(capabilities.cutaway || capabilities.explode) && (
                  <div
                    className="view-modes"
                    role="group"
                    aria-label={t("显示方式", "Display mode")}
                  >
                    {[
                      ["whole", t("整体", "Whole")],
                      ...(capabilities.cutaway
                        ? [["section", t("剖面", "Cutaway")]]
                        : []),
                      ...(capabilities.explode
                        ? [["explode", t("拆解", "Exploded")]]
                        : []),
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        aria-pressed={
                          mode === value ||
                          (!capabilities.cutaway &&
                            mode === "section" &&
                            value === "whole")
                        }
                        className={
                          mode === value ||
                          (!capabilities.cutaway &&
                            mode === "section" &&
                            value === "whole")
                            ? "active"
                            : ""
                        }
                        onClick={() => setMode(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
                <div className="utility-controls">
                  <button
                    className="icon-button"
                    onClick={reset}
                    aria-label={t("重置视角", "Reset view")}
                    title={t("重置视角", "Reset view")}
                  >
                    <RotateCcw size={17} />
                  </button>
                  {capabilities.labels && (
                    <button
                      className={
                        "icon-button " +
                        (labels && labelsAvailable ? "active" : "")
                      }
                      aria-pressed={labels && Boolean(labelsAvailable)}
                      disabled={!labelsAvailable}
                      onClick={() => setLabels(!labels)}
                      aria-label={t("显示标签", "Show labels")}
                      title={
                        labelsAvailable
                          ? t("显示标签", "Show labels")
                          : t(
                              "切换到剖面查看内部标签",
                              "Use Cutaway to see internal labels",
                            )
                      }
                    >
                      <Tag size={17} />
                    </button>
                  )}
                  <button
                    className={"icon-button " + (rotate ? "active" : "")}
                    aria-pressed={rotate}
                    onClick={() => setRotate(!rotate)}
                    aria-label={t("自动旋转", "Auto rotate")}
                    title={t("自动旋转", "Auto rotate")}
                  >
                    <Rotate3D size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="viewer-footnote">
              <span>
                {t(
                  "拖动旋转 · 双指缩放",
                  "Drag to rotate · Pinch or scroll to zoom",
                )}
              </span>
              <span>
                {t("教学示意，非真实比例", "Schematic · Not to scale")}
              </span>
            </div>
          </section>
          <aside
            className="details"
            aria-label={t("结构说明", "Structure details")}
            key={id}
          >
            {viewContext && <p className="detail-context">{viewContext}</p>}
            <h2>{node.name}</h2>
            {!en && <p className="latin-name">{node.en}</p>}
            <p className="node-description">{node.desc}</p>
            {note && <p className="model-note">{note}</p>}
            {lastProcess && lastProcess.path[0] === path[0] && (
              <button
                className="resume-process"
                onClick={() =>
                  navigate(lastProcess.path, true, "process", lastProcess.id)
                }
              >
                <span>{t("接着观察过程", "Resume process")}</span>
                <strong>{processCatalog[lastProcess.id].title[lang]}</strong>
                <ChevronRight size={14} />
              </button>
            )}
            {id === "phageTail" && (
              <div className="mechanism-control">
                <h3>{t("观察尾鞘收缩", "Observe sheath contraction")}</h3>
                <p aria-live="polite">
                  {mode === "explode"
                    ? t(
                        "拆解以伸展构型展示；返回整体模式可继续比较尾鞘收缩。",
                        "The exploded view uses the extended configuration. Return to Whole mode to compare sheath contraction.",
                      )
                    : contracted
                      ? t(
                          "尾鞘缩短、增粗，露出中央尾管。比例为示意，未模拟整个感染过程。",
                          "The sheath shortens and widens, exposing the central tube. Proportions are schematic; the full infection process is not simulated.",
                        )
                      : t(
                          "尾鞘包围尾管。在整体模式中，用模型下方的按钮对比伸展与收缩。",
                          "The sheath surrounds the tube. In Whole mode, use the buttons beneath the model to compare extension and contraction.",
                        )}
                </p>
              </div>
            )}
            {node.features.length > 0 && (
              <div className="feature-list">
                {node.features.map(([title, text]) => (
                  <section key={title}>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </section>
                ))}
              </div>
            )}
            {getProcessesForStructure(path).length > 0 && (
              <section className="structure-processes">
                <h3>{t("相关生物学过程", "Explore related processes")}</h3>
                {getProcessesForStructure(path)
                  .slice(0, path.length > 1 ? 6 : 3)
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => openRelatedProcess(item)}
                    >
                      <span>{processCatalog[item.id].title[lang]}</span>
                      <ChevronRight size={14} />
                    </button>
                  ))}
                <button
                  className="all-processes"
                  onClick={() => navigate(path, true, "process", null)}
                >
                  {t("浏览全部过程", "Browse all processes")}{" "}
                  <ChevronRight size={12} />
                </button>
              </section>
            )}
            {rootIds.includes(id) && (
              <div className="root-guide">
                <h3>{t("从整体，到内部", "From the whole to its parts")}</h3>
                <p>
                  {t(
                    "点击结构即可进入。左侧目录会随层级更新；顶部路径可返回任意一级。",
                    "Click a structure to open it. The catalog changes with each level; use the path above to return to any earlier level.",
                  )}
                </p>
              </div>
            )}
            {node.children.length > 0 && (
              <p className="next-level-note">
                {t(
                  "从左侧选择内部结构，继续查看。",
                  "Choose an internal structure in the catalog to continue.",
                )}
              </p>
            )}
            {node.children.length === 0 && (
              <p className="next-level-note">
                {t(
                  "可旋转查看此结构，或通过顶部路径返回。",
                  "Rotate to inspect this structure, or return using the path above.",
                )}
              </p>
            )}
            {specializedSpecimens.find(
              (specimen) => specimen.id === path[0],
            ) && (
              <details className="specimen-references">
                <summary>
                  {t("此细胞的参考资料", "References for this cell")}
                </summary>
                {specializedSpecimens
                  .find((specimen) => specimen.id === path[0])
                  .sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.title} ↗
                    </a>
                  ))}
              </details>
            )}
            <button className="source-link" onClick={openAbout}>
              {t("模型说明与参考", "Model notes & references")}
              <ChevronRight size={12} />
            </button>
          </aside>
        </main>
      )}
      {studio && (
        <Suspense
          fallback={
            <div className="share-backdrop" role="status">
              {t("正在准备工作台…", "Preparing Studio…")}
            </div>
          }
        >
          <Studio
            source={studio}
            lang={lang}
            onClose={() => setStudio(null)}
            onShare={async () => createShareUrl()}
          />
        </Suspense>
      )}
      {share && <ShareDialog url={share} lang={lang} onClose={closeShare} />}
      {about && (
        <AboutModel t={t} aboutRef={aboutRef} onClose={() => setAbout(false)} />
      )}
    </div>
  );
}
