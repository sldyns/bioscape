import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowRight,
  ArrowUpRight,
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
import "./home.css";

const ProjectDialog = lazy(() => import("../components/ProjectDialog.jsx"));

const modelDetails = {
  cell: [
    "细胞膜内，细胞器各司其职",
    "Organelles at work within the cell membrane.",
  ],
  plant: [
    "叶绿体与中央液泡组成的内部世界",
    "Chloroplasts and a large central vacuole.",
  ],
  bacterium: [
    "革兰阴性杆菌的包被、拟核与鞭毛",
    "The envelope, nucleoid and flagellum of a Gram-negative rod.",
  ],
  yeast: [
    "细胞壁包裹着出芽的单细胞真菌",
    "A budding unicellular fungus within its cell wall.",
  ],
  paramecium: [
    "纤毛、口沟与伸缩泡协同运作",
    "Cilia, an oral groove and contractile vacuoles.",
  ],
  phage: [
    "头部容纳遗传物质，尾部连接宿主",
    "A genome-filled head and a tail that attaches to bacteria.",
  ],
  erythrocyte: [
    "成熟后无核，以双凹形态运输氧气",
    "A nucleus-free, biconcave cell that carries oxygen.",
  ],
  neuron: [
    "从树突与胞体，沿有髓轴突延伸",
    "From dendrites and soma along a myelinated axon.",
  ],
  muscleFibre: [
    "一根多核细胞，容纳成束肌原纤维",
    "Bundles of myofibrils within one multinucleate cell.",
  ],
};

export default function HomePage({
  lang,
  onLangChange,
  onExplore,
  onResume,
  resume,
  onCompare,
}) {
  const t = (zh, en) => (lang === "en" ? en : zh);
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
          !normalized ||
          normalizeHomeSearch(
            `${entry.title.zh} ${entry.title.en} ${entry.summary.zh} ${entry.summary.en}`,
          ).includes(normalized);
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
          BioScape
          <span className="home-wordmark-dot" />
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
            {t("探索方式", "Ways to explore")}
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
        </div>
      </header>
      <main id="home-main" tabIndex={-1}>
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-inner home-container">
            <div className="home-hero-copy">
              <h1 id="home-title">
                {t("看见微观", "See the unseen.")}
                <br />
                <span>{t("理解生命", "Understand life.")}</span>
              </h1>
              <p className="home-hero-description">
                {t(
                  "从细胞到分子，亲手探索",
                  "From cells to molecules. Yours to explore.",
                )}
              </p>
              <div className="home-hero-actions">
                <a
                  className="home-primary"
                  href={resume?.href || "#/cell"}
                  title={resume?.label?.[lang]}
                  onClick={(event) =>
                    follow(
                      event,
                      resume?.href || "#/cell",
                      resume ? onResume : null,
                    )
                  }
                >
                  {resume
                    ? t("继续探索", "Continue exploring")
                    : t("开始探索", "Start exploring")}
                  <ArrowRight size={18} />
                </a>
                <button
                  className="home-secondary"
                  onClick={() => jump("home-processes")}
                >
                  {t("观看过程", "See life in motion")}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
            <HeroScene lang={lang} onExplore={onExplore} />
          </div>
          <div
            className="home-metrics home-container"
            aria-label={t("内容概览", "At a glance")}
          >
            <div>
              <strong>
                {homepageMetrics.modelCount.toString().padStart(2, "0")}
              </strong>
              <span>{t("类模型", "Models")}</span>
            </div>
            <div>
              <strong>{homepageMetrics.structureCount}</strong>
              <span>{t("个结构", "Structures")}</span>
            </div>
            <div>
              <strong>{homepageMetrics.processCount}</strong>
              <span>{t("个过程", "Processes")}</span>
            </div>
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
                {t("不同形态，新的发现", "Every form invites a closer look.")}
              </h2>
            </div>
          </div>
          <div className="home-model-grid">
            {homeModels.map((model) => (
              <a
                className={`home-model-card is-${model.id}`}
                href={model.href}
                key={model.id}
                onClick={(event) => follow(event, model.href)}
                style={{ "--model-accent": model.accent }}
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
                  <span className="home-card-open">
                    <ArrowUpRight size={20} />
                  </span>
                </div>
                <div className="home-model-info">
                  <h3>{model.title[lang]}</h3>
                  <p>{t(...modelDetails[model.id])}</p>
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
                  {t("让生命过程动起来", "See how life happens.")}
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
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
            {category === "featured" && !query.trim() && (
              <button className="home-browse-all" onClick={allProcesses}>
                {t(
                  `浏览全部 ${homepageMetrics.processCount} 个过程`,
                  `Browse all ${homepageMetrics.processCount} processes`,
                )}
                <ArrowRight size={17} />
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
              <h2 id="home-ways-title">
                {t(
                  "从一次观察，到自己的发现",
                  "From a closer look to your own discovery.",
                )}
              </h2>
            </div>
          </div>
          <div className="home-ways-grid">
            <a
              className="home-way"
              href="#/cell"
              onClick={(event) => follow(event, "#/cell")}
            >
              <div className="home-way-icon">
                <Layers3 size={25} />
              </div>
              <ArrowUpRight
                className="home-way-arrow"
                size={19}
                aria-hidden="true"
              />
              <h3>{t("深入结构", "Look inside")}</h3>
              <p>{t("旋转、剖视、拆解", "Rotate. Cut away. Take apart.")}</p>
            </a>
            <button className="home-way" onClick={onCompare}>
              <div className="home-way-icon">
                <Columns2 size={25} />
              </div>
              <ArrowUpRight
                className="home-way-arrow"
                size={19}
                aria-hidden="true"
              />
              <h3>{t("并排比较", "Compare")}</h3>
              <p>{t("两个模型，同屏观察", "Two models, side by side.")}</p>
            </button>
            <a
              className="home-way"
              href="#/neuron"
              onClick={(event) => follow(event, "#/neuron")}
            >
              <div className="home-way-icon">
                <Focus size={25} />
              </div>
              <ArrowUpRight
                className="home-way-arrow"
                size={19}
                aria-hidden="true"
              />
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
              <ArrowUpRight size={13} aria-hidden="true" />
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
            <ArrowUpRight size={17} aria-hidden="true" />
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
