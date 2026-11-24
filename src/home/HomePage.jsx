import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  ChevronDown,
  Columns2,
  Focus,
  Layers3,
  Search,
  X,
} from "lucide-react";
import { assetUrl } from "../assetUrl.js";
import { project } from "../project.js";
import {
  homepageMetrics,
  homeModels,
  homeProcessCategories,
  homeProcesses,
  featuredProcessIds,
} from "./catalog.js";
import HeroScene from "./HeroScene.jsx";
import ProcessCard from "./ProcessCard.jsx";
import { normalizeHomeSearch } from "./search.js";
import { exploreSceneHash } from "./routes.js";
import "./home.css";

const ProjectDialog = lazy(() => import("../components/ProjectDialog.jsx"));

const processSearchText = new Map(
  homeProcesses.map((entry) => [
    entry.id,
    normalizeHomeSearch(
      `${entry.title.zh} ${entry.title.en} ${entry.summary.zh} ${entry.summary.en}`,
    ),
  ]),
);

export default function HomePage({
  lang,
  onLangChange,
  onExplore,
  onResume,
  resume,
  onCompare,
}) {
  const t = (zh, en) => (lang === "en" ? en : zh);
  const [specimenId, setSpecimenId] = useState("cell");
  const specimen = homeModels.find((model) => model.id === specimenId);
  const [category, setCategory] = useState("featured");
  const [query, setQuery] = useState("");
  const [activePreview, setActivePreview] = useState(null);
  const [projectPage, setProjectPage] = useState(null);
  useEffect(() => setActivePreview(null), [category, query]);
  const searchRef = useRef(null);
  const filtered = useMemo(() => {
    const normalized = normalizeHomeSearch(query);
    return homeProcesses
      .filter((entry) => {
        const matchesCategory =
          category === "all" ||
          category === "featured" ||
          entry.category === category;
        const matchesQuery =
          !normalized || processSearchText.get(entry.id).includes(normalized);
        return (
          matchesCategory &&
          matchesQuery &&
          (category !== "featured" ||
            normalized ||
            featuredProcessIds.includes(entry.id))
        );
      })
      .sort((a, b) =>
        category === "featured" && !normalized
          ? featuredProcessIds.indexOf(a.id) - featuredProcessIds.indexOf(b.id)
          : 0,
      );
  }, [category, query]);
  function jump(id) {
    const target = document.getElementById(id);
    target?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
    target?.focus({ preventScroll: true });
  }
  function follow(event, href, action) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.shiftKey
    )
      return;
    event.preventDefault();
    if (action) action();
    else onExplore(href);
  }
  function allProcesses() {
    setCategory("all");
    setQuery("");
    jump("home-processes");
  }
  const categories = [
    { id: "featured", title: { zh: "精选", en: "Featured" } },
    { id: "all", title: { zh: "全部", en: "All" } },
    ...homeProcessCategories,
  ];
  return (
    <div className={`home-page${lang === "en" ? " is-english" : ""}`}>
      <a
        href="#home-main"
        className="home-skip"
        onClick={(event) => {
          event.preventDefault();
          jump("home-main");
        }}
      >
        {t("跳至主要内容", "Skip to content")}
      </a>
      <header className="home-header">
        <button
          className="home-wordmark"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "instant"
                : "smooth",
            })
          }
          aria-label={t("BioScape 首页", "BioScape home")}
        >
          <span className="atlas-mark" aria-hidden="true" />
          BioScape
        </button>
        <nav
          className="home-nav"
          aria-label={t("主页导航", "Homepage navigation")}
        >
          <button onClick={() => jump("home-models")}>
            {t("模型图鉴", "Models")}
          </button>
          <button onClick={() => jump("home-processes")}>
            {t("生命过程", "Processes")}
          </button>
          <button onClick={() => jump("home-ways")}>
            {t("探索工具", "Exploration tools")}
          </button>
        </nav>
        <div className="home-header-actions">
          <button
            className="home-language"
            onClick={() => onLangChange(lang === "en" ? "zh" : "en")}
            aria-label={lang === "en" ? "切换为中文" : "Switch to English"}
          >
            <span className={lang === "zh" ? "active" : ""}>中</span>
            <span aria-hidden="true">/</span>
            <span className={lang === "en" ? "active" : ""}>EN</span>
          </button>
          {resume && (
            <a
              className="home-header-resume"
              href={resume.href}
              title={resume.label?.[lang]}
              onClick={(event) => follow(event, resume.href, onResume)}
            >
              {t("继续探索", "Continue exploring")}
            </a>
          )}
        </div>
      </header>
      <main id="home-main" tabIndex={-1}>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-inner home-container">
            <div className="home-hero-copy">
              <h1 id="home-title">
                {t("微观生命", "An atlas of")}
                <br />
                <em>{t("三维图鉴", "microscopic life.")}</em>
              </h1>
              <p className="home-hero-description">
                {t(
                  "旋转细胞，剖开膜层，沿时间轴观察生命过程。",
                  "Turn a cell in your hands, look inside a membrane, and follow a biological process through time.",
                )}
              </p>
              <div className="home-hero-actions">
                <a
                  className="home-primary"
                  href={exploreSceneHash(specimen.href, lang)}
                  onClick={(event) => follow(event, specimen.href)}
                >
                  <Box size={17} aria-hidden="true" />
                  {t(
                    `探索${specimen.title.zh}`,
                    `Explore the ${specimen.title.en.toLowerCase()}`,
                  )}
                </a>
                <button
                  className="home-secondary"
                  onClick={() => jump("home-processes")}
                >
                  {t("浏览生命过程", "Browse processes")}
                </button>
              </div>
              {resume && (
                <a
                  className="home-resume-inline"
                  href={resume.href}
                  onClick={(event) => follow(event, resume.href, onResume)}
                >
                  {t("继续探索", "Continue exploring")}{" "}
                  <span>{resume.label?.[lang]}</span>
                </a>
              )}
              <dl
                className="home-metrics"
                aria-label={t("图鉴内容", "Atlas contents")}
              >
                <div>
                  <dt>{t("模型", "Models")}</dt>
                  <dd>{homepageMetrics.modelCount}</dd>
                </div>
                <div>
                  <dt>{t("结构", "Structures")}</dt>
                  <dd>{homepageMetrics.structureCount}</dd>
                </div>
                <div>
                  <dt>{t("生命过程", "Processes")}</dt>
                  <dd>{homepageMetrics.processCount}</dd>
                </div>
              </dl>
            </div>
            <HeroScene
              lang={lang}
              selected={specimenId}
              onSelect={setSpecimenId}
              onExplore={onExplore}
            />
          </div>
        </section>
        <section
          id="home-models"
          className="home-section home-container"
          tabIndex={-1}
          aria-labelledby="home-models-title"
        >
          <div className="home-section-heading">
            <div>
              <h2 id="home-models-title">
                {t("模型图鉴", "The specimen collection")}
              </h2>
            </div>
          </div>
          <div className="home-model-grid">
            {homeModels.map((model) => (
              <a
                className={`home-model-card is-${model.id}`}
                href={exploreSceneHash(model.href, lang)}
                key={model.id}
                onClick={(event) => follow(event, model.href)}
              >
                <div className="home-model-media">
                  <img
                    src={assetUrl(model.image)}
                    alt=""
                    width="1000"
                    height="1000"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <div className="home-model-info">
                  <span className="home-model-type">{model.eyebrow[lang]}</span>
                  <h3>{model.title[lang]}</h3>
                  <p>{model.description[lang]}</p>
                </div>
              </a>
            ))}
          </div>
        </section>
        <section className="home-process-section">
          <div
            id="home-processes"
            className="home-section home-container"
            tabIndex={-1}
            aria-labelledby="home-processes-title"
          >
            <div className="home-section-heading">
              <div>
                <h2 id="home-processes-title">
                  {t("生命过程", "Biological processes")}
                </h2>
              </div>
            </div>
            <div className="home-process-tools">
              <div
                className="home-process-tabs"
                role="group"
                aria-label={t("过程分类", "Process categories")}
              >
                {categories.map((item) => (
                  <button
                    key={item.id}
                    aria-pressed={category === item.id}
                    onClick={() => setCategory(item.id)}
                  >
                    {item.title[lang]}
                  </button>
                ))}
              </div>
              <div className="home-search">
                <Search size={16} />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("寻找一个过程…", "Find a process…")}
                  aria-label={t("搜索生命过程", "Search biological processes")}
                />
                {query && (
                  <button
                    aria-label={t("清除搜索", "Clear search")}
                    onClick={() => {
                      setQuery("");
                      searchRef.current?.focus();
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            <p className="home-results-count" role="status">
              {query.trim()
                ? t(
                    `找到 ${filtered.length} 个相关过程`,
                    `${filtered.length} matching processes`,
                  )
                : category === "featured"
                  ? ""
                  : t(
                      `${filtered.length} 个过程`,
                      `${filtered.length} processes`,
                    )}
            </p>
            <div className="home-process-grid">
              {filtered.map((entry) => (
                <ProcessCard
                  key={entry.id}
                  entry={entry}
                  lang={lang}
                  active={activePreview === entry.id}
                  onActivate={setActivePreview}
                  onDeactivate={() =>
                    setActivePreview((current) =>
                      current === entry.id ? null : current,
                    )
                  }
                  onFollow={follow}
                />
              ))}
            </div>
            {!filtered.length && (
              <div className="home-empty">
                <Search size={26} />
                <h3>{t("还没有找到这个过程", "No matching process yet")}</h3>
                <p>
                  {t(
                    "换个关键词，或查看全部分类",
                    "Try another keyword or browse every category.",
                  )}
                </p>
                <button
                  onClick={() => {
                    setCategory("all");
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                >
                  {t("查看全部过程", "View all processes")}
                </button>
              </div>
            )}
            {category === "featured" && !query.trim() && (
              <button className="home-browse-all" onClick={allProcesses}>
                {t(
                  `浏览全部 ${homepageMetrics.processCount} 个过程`,
                  `Browse all ${homepageMetrics.processCount} processes`,
                )}
              </button>
            )}
            {category !== "featured" && !query.trim() && (
              <button
                className="home-browse-all"
                onClick={() => {
                  setCategory("featured");
                  jump("home-processes");
                }}
              >
                {t("收起，回到精选", "Back to featured processes")}
                <ChevronDown size={16} className="is-up" />
              </button>
            )}
          </div>
        </section>
        <section
          id="home-ways"
          className="home-section home-container home-ways"
          tabIndex={-1}
          aria-labelledby="home-ways-title"
        >
          <div className="home-section-heading">
            <div>
              <h2 id="home-ways-title">{t("探索工具", "Exploration tools")}</h2>
            </div>
          </div>
          <div className="home-ways-grid">
            <a
              className="home-way"
              href={exploreSceneHash("#/cell", lang)}
              onClick={(event) => follow(event, "#/cell")}
            >
              <div className="home-way-icon">
                <Layers3 size={25} />
              </div>
              <h3>{t("深入结构", "Look inside")}</h3>
              <p>{t("旋转、剖视、拆解", "Rotate. Cut away. Take apart.")}</p>
            </a>
            <button className="home-way" onClick={onCompare}>
              <div className="home-way-icon">
                <Columns2 size={25} />
              </div>
              <h3>{t("并排比较", "Compare")}</h3>
              <p>{t("两个模型，同屏观察", "Two models, side by side.")}</p>
            </button>
            <a
              className="home-way"
              href={exploreSceneHash("#/neuron", lang)}
              onClick={(event) => follow(event, "#/neuron")}
            >
              <div className="home-way-icon">
                <Focus size={25} />
              </div>
              <h3>{t("影像创作", "Create")}</h3>
              <p>
                {t(
                  "在模型中创作图片与短片",
                  "Open a model. Make images and films.",
                )}
              </p>
            </a>
          </div>
        </section>
      </main>
      <footer className="home-footer home-container">
        <div className="home-footer-brand">
          <strong>BioScape</strong>
          <p>{t("交互式三维生物教学项目", "Interactive biology in 3D")}</p>
        </div>
        <div className="home-footer-information">
          <nav
            className="home-footer-links"
            aria-label={t("项目与使用说明", "Project and usage information")}
          >
            <button
              onClick={() => setProjectPage("about")}
              aria-haspopup="dialog"
            >
              {t("关于项目", "About the project")}
            </button>
            <button
              onClick={() => setProjectPage("license")}
              aria-haspopup="dialog"
            >
              {t("使用许可", "License")}
            </button>
            <a
              href={`mailto:${project.email}?subject=BioScape%20commercial%20permission`}
            >
              {t("商用联系", "Commercial enquiries")}
            </a>
          </nav>
          <p>
            {t(
              "非商业使用开放 · 商用须事先授权",
              "Noncommercial use · Commercial permission required",
            )}
          </p>
        </div>
        <div className="home-credit">
          <span>{t("设计与开发", "Designed & developed by")}</span>
          <a href={project.homepage} target="_blank" rel="noreferrer">
            {project.author}
          </a>
          <small>{project.copyright}</small>
        </div>
      </footer>
      {projectPage && (
        <Suspense
          fallback={
            <p className="home-project-loading" role="status">
              {t("正在载入项目说明…", "Loading project information…")}
            </p>
          }
        >
          <ProjectDialog
            lang={lang}
            initialPage={projectPage}
            onClose={() => setProjectPage(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
