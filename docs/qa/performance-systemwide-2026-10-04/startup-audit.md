# 首页、路由与初始元数据加载审计

日期：2026-10-04。源码 HEAD：`ae697be5f252c1df58b34b57a6e9a8e1c014acf4`。

初稿为只读审查，已读 `.github/CONTRIBUTING.md`。审计阶段未运行浏览器、测试、构建、计时或模型实例化；以下优先级表示值得验证的候选，不表示已经测得性能收益。保留全部双语内容、模型、结构、过程、精度、材质、阴影和分辨率。后续授权实施状态见末尾追加记录。

## 最优先候选

### P1：让比较状态校验不再提前构造完整对比目录

- 证据链：`src/home/HomeRouter.jsx:21` 静态导入 `DEFAULT_COMPARISON_STATE`；`src/compare/state.js:1-4` 为合法 ID 集静态导入 `comparisonIds`；`src/compare/catalog.js:128-164` 对常规模型全树 DFS，逐节点调用两次 `getNode`，建立名字、摘要、scope、来源和 trail；`:165-202` 又建立特化细胞条目、索引与分类。
- 影响：首页、直接打开普通结构/过程，以及任何尚未打开比较功能的访问，都会求值这条入口链。`App.jsx:34` 同样依赖该状态模块，因此只改首页默认常量还不够。
- 最小改法：将 `comparisonIds`/合法 ID 判定拆为轻量 ID 模块，状态规范化只依赖 ID 模块；完整 `comparisonEntries`、来源、分组和搜索仍由惰性的 `CompareWorkspace` 导入。优先从稳定的轻量层级/根 ID 生成 ID 集，避免复制另一套手写 ID；保留现有对比目录首次出现 ID 的去重/顺序语义。
- 等价验证：全量 `comparisonIds` 与旧目录一致；所有合法结构和特化部件的 `normalizeComparisonState` 输出一致；未知 ID、旧链接、左右独立相机、缺省值和范围边界一致。复用 `tests/comparison.mjs`、`tests/exploration-state.mjs`；生产入口依赖检查必须确认不再静态包含完整 `compare/catalog.js`，单纯换 chunk 名不算隔离。
- 收益边界：只证明能移走不必要的全树条目构造及对应依赖，实际冷启动改善须由统一基线量化。

### P1/P2：切开轻量导航索引与完整结构说明的依赖

- 证据：`HomeRouter.jsx:18-19` 直接依赖导航和层级；`home/catalog.js:1-8,80-96` 为 9 类模型的名称、颜色、层级计数依赖完整 hierarchy。`navigation.js:1-3` 为验证 root/path 同样依赖 `cellTypes` 和 hierarchy。`hierarchy.js:1-4` 引入双语结构数据、全部 extraDefinitions/extraNotes、特化样本；`:466-490` 构造定义数组和索引，`:491-548` 每次查节点新建对象。`catalog/cellTypes.js:1-12` 为根 ID 导入特化样本和微生物定义，`:575-581` 又把定义/说明混在同一模块。
- 规模仅为源码字节参考：hierarchy 55,785 B、cellTypes 41,730 B、microbes 24,493 B、data/data-en 共 19,141 B、specimens 11,198 B、三个 specimen metadata 共 12,738 B。这些不是网络传输量，也不是可以直接相加得出的构建节省量。
- 影响：首页首屏、首页恢复入口、每个深链接路径的验证都耦合完整说明数据。Hero 后续确实会用到部分说明，故将它们从首屏移走主要改变关键路径，不能假称整次访问不再下载。
- 最小分步改法：先将根 ID/双语名称列表从完整 `cellTypes` 定义拆开，并完成上一项 comparison state 隔离；随后统一提取只含 ID、children、双语名称、颜色的导航索引，让 navigation、首页目录、恢复标题消费索引。完整描述、features、modelNotes、科学来源留给 App/scene/compare。可由现有单一权威数据在构建时生成并加一致性检查，避免手工维护重复目录。
- 等价验证：逐节点 children、名字、颜色相等；全部合法/非法/截断路径、动物细胞 cytoplasm 别名、过程根约束完全相同；首页结构计数、9 类入口、所有过程标题摘要/缩略图/路由不变。复用 `tests/home-catalog.mjs`、`tests/home-navigation.mjs`、`tests/comparison.mjs`，追加独立入口图断言；不能把测试本身同时导入旧全目录的 metafile 当作新入口体积依据。
- 优先级说明：这是比拆 comparison state 更大的结构性改动，应在基线显示入口解析/求值占比值得处理后实施。

### P2：同一结构路径仅推导一次相关过程

- 证据：`App.jsx:1145` 调用 `getProcessesForStructure(path).length`，紧接着 `:1148` 再调用一次同函数。`exploration/relationships.js:980-1044` 每次校验路径、遍历根下过程及目的地、复制路径/条件并排序。其结果只依赖路径和静态目录，与剖面、拆解滑杆、标签、缩放按钮、弹窗和语言无关。
- 影响：所有结构页在这些状态触发 React 重渲染时，重复执行两遍相同查询；它不是每帧自动旋转开销，不能据此宣称持续 FPS 提升。
- 最小改法：`useMemo(() => getProcessesForStructure(path), [path])`，将结果复用于存在性检查和渲染；可再按是否处于结构模式跳过不需要的推导。不得把结果全局按 nodeId 缓存：相同节点在不同根、路径和物种具有不同关系与返回位置。
- 等价验证：复用 `tests/exploration-relationships.mjs` 与 `tests/related-process-entry.mjs`；浏览器检查所有根、核/胞质两类路径、返回原结构位置、条件参数和顺序仍正确。记录滑杆/模式切换中的 React 工作和查询次数；不改关系表或几何。

## 网络与拆包候选

### P2：在已知目标的入口预取同一正式 loader，减少分层动态导入等待

- 当前链：`HomeRouter.jsx:23,132-145` 首次渲染 App 才请求 App；`App.jsx:22-25,789-820` App 就绪后请求 CellScene/ProcessExperience/CompareWorkspace；`ProcessExperience.jsx:31-55` 过程视图就绪后才触发目标 `processLoaders[id]`。正式 loader 位于 `processes/loaders.js:3-16`，已保持单过程动态导入。
- 最小改法：对初始深链接或实际点击的已验证目标，提前并行开始 App 和对应体验 chunk 的 import；在过程卡片明确 pointer/focus 意图下可仅预取该过程的正式 loader。共享 memoized promise 与现有 lazy loader，不创建 renderer/模型，不引入第二套模块 registry；请求失败必须允许实际导航重试，不能让预取 rejection 永久污染 lazy。
- 保留当前首次首页的完整实时 Hero；不全量预加载 84 个过程，也不同时创建多个模型/上下文。若首页 Hero 正在准备，预取应有优先级/并发边界，避免用更多后台工作抢占它。
- 验证：在生产子路径冷缓存下比较过程深链接、首页卡片进入、结构直达的请求瀑布及首个可交互帧；进入数量、媒体/JS 字节、峰值内存和取消后后台工作不得明显恶化；预取失败、快速切换、键盘焦点、浏览器返回必须能恢复。

### 当前拆包的已知边界

- `vite.config.js:35-40` 仅显式分 three-core、three-renderer、React；更改 manualChunks 并不能取消静态 import 的求值，也不自动缩短应用层的惰性瀑布。
- 读取到的现有 `dist`：index JS 226,221 B、App 72,336 B、CellScene 87,614 B、three-core 254,879 B、three-renderer 376,810 B、入口 CSS 38,131 B（未压缩文件长度）。这些是现存产物，未验证其构建身份，不当作 ae697be 正式基线或前后收益。
- 该产物入口仅静态依赖 React；App/CellScene 静态依赖 index，其中保留共享目录。源码没有首页静态导入几何模型的证据。多处导入同一个 hierarchy 或同一个 CellScene 不等于重复下载/求值；ESM 模块缓存和构建器解析应去重，不能按 import 行数计算浪费。
- `main.jsx:4` 入口加载全部 styles.css（源码 26,672 B），HomePage 又静态导入 home.css（22,131 B）；直接打开过程链接同样先加载首页 UI/CSS。将首页组件改为路由惰性加载、通用基础样式与 App 样式分离可作为次级候选，但应先处理共享元数据依赖，否则只改为 lazy 仍会通过其他导入拉回数据。必须验证冷首页、深链接 FOUC、字体/布局、返回首页完整视觉。

## 次级 React 与网络观察

- 首页搜索 `HomePage.jsx:89-115` 每次 query 变化重新拼接并 NFKD 归一化所有过程双语标题/摘要；`home/search.js:1-4` 的规则明确保留科学符号。可在目录生成时缓存 normalizedSearch 字符串，原样保留规则；`ProcessDirectory.jsx:29-40` 亦可预计算，但它使用不同的 lower-case 搜索语义，不能擅自统一成另一规则。先复用 `tests/home-search.mjs` 并比较类别、重音、下标、空结果。
- `HomePage.jsx:413-426` 过程卡片 hover 通过父级 activePreview 使所有可见卡片重渲染，`onDeactivate` 和 `follow` 每次创建新函数；若基线显示长任务，可用稳定回调及 memo 卡片把更新限于前后两张。总目录很小，不建议未经证据就引入虚拟列表并改变可访问性/布局。
- `HomeRouter.jsx:63` 的 `useRef(createSceneHistorySession())` 每次重渲染都创建随后被丢弃的 Map 和闭包；`App.jsx:212-217` 的 ref 初值也会重复 new Map。可以初始化一次，但比前述候选小得多，不应包装成系统级提速。
- Hero 已通过可见性/减少动态效果/暂停控制自动旋转（`HeroScene.jsx:71-90,136`）；它仍正常加载完整场景（`:128-144`）。过程卡片图片已 lazy/async（`ProcessCard.jsx:91-98`），仅活跃、可见且允许动态时挂载视频，视频 preload=none（`:50-51,99-107`）。没有证据支持通过降图像分辨率、停用实时 Hero、减少模型/过程或移除阴影获得“等价”优化。

## 集成验收

先由主审计完成冻结基线；候选逐个实施并与原基线分开记录。目录/路由改动通过已有专项回归后，依维护指南跑完整 verify/build/check:release。生产子路径浏览器覆盖：首页→模型→多层结构→相关过程→返回、目录搜索/分类、比较、工作台、语言、历史恢复；固定视角图像与现有资源哈希保持等价。分别记录入口 JS/解析求值、首个可交互场景、UI 响应、稳定播放和内存，不能用入口 chunk 变小替代全站渲染验收。

## 授权实施追加记录

主整合任务授权实施两项低风险改动，其他候选保持待评估：

- `src/compare/ids.js` 新增只建立有序 ID 的目录，直接消费原 children/根列表/特化样本；常规结构维持 DFS 首访去重，特化样本与部件维持原追加顺序，不创建另一份手写 ID 真值。`compare/state.js` 改从此模块导入；`compare/catalog.js` 保留原条目、来源、分类、搜索代码并 re-export 同名公共 ID 接口。`HomeRouter` 无须改动，已有静态 state 导入自然断开重目录。
- `App.jsx` 只在结构模式且未比较时推导相关过程，`useMemo` 完整依赖为 path/experience/comparison，存在性检查与显示共用结果。
- 新增 `tests/startup-catalog.mjs`，默认可在任意正常 checkout 独立运行：验证有序 ID 与完整目录逐项一致、全部合法 ID 分享/恢复、未知 ID 与 malformed state，以及 HomeRouter/App/state 的静态依赖图不包含完整比较目录或场景实现。
- 可选诊断参数 `node tests/startup-catalog.mjs /absolute/path/to/pre-optimization-checkout` 额外比较完整首页/对比元数据摘要、每个 ID 的归一化状态、URL 与恢复结果，并确认基线确有原 eager 依赖。永久默认测试不读取 `/tmp`、不依赖本次冻结树。
- 截至此记录：仅完成编辑，按整合任务要求等待全站基线结束后再运行验证；不宣称测试通过或性能提升。新增测试尚未加入共享 runner，由主整合者单写接入。

## 定向验证追加记录

主整合任务完成全 235 case 与 9 root × 3 基线后，放行本分支定向正确性检查。以下全部通过：

| 命令/回归                                                                           | 已确认结果                                                                                                                 |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `node tests/startup-catalog.mjs`                                                    | 默认 CI 独立模式；182 个有序 ID、有效/异常状态、分享/Resume；HomeRouter/App/state 的静态依赖不再包含完整对比目录或场景实现 |
| `node tests/startup-catalog.mjs /tmp/bioscape-systemwide-20261004-baseline-ae697be` | 完整首页/对比元数据摘要相等；每个 ID 的状态、URL、Resume 相等；84 个过程入口解析相等；冻结基线确有原 eager 依赖            |
| `tests/home-catalog.mjs`                                                            | 9 模型、182 结构、84 有效过程入口及缩略图；无 Three.js 依赖                                                                |
| `tests/home-navigation.mjs`                                                         | 首页路由、便携 Resume、部署 base、独立历史条目                                                                             |
| `tests/exploration-state.mjs`                                                       | 状态往返、重复状态、malformed/untrusted 输入                                                                               |
| `tests/history-session.mjs`                                                         | 最新编辑、前进/后退、同模型重复访问、fragment 隔离、reload fallback                                                        |
| `tests/comparison.mjs`                                                              | 独立保存相机、旧分享链接、搜索与导出布局                                                                                   |
| `tests/related-process-entry.mjs`                                                   | 条件参数、不同分支 seek、同分支续播、不修改输入                                                                            |
| `tests/exploration-relationships.mjs`                                               | 84 过程、114 根/过程组合、455 目的地、13 个限定 root-only 映射；3 个特化目录与 78 模型/条件状态                            |

静态依赖验证使用 esbuild 且保持所有 dynamic-import 为外部边界，针对真实 HomeRouter/App/state 静态链；它不是生产浏览器请求瀑布或 Vite 输出体积验收。未执行独立性能计时、浏览器、全仓 check 或正式 A/B。格式检查发现新测试换行不符，已用项目 Prettier 修正，之后默认与冻结对照两种模式均重新通过。

本次定向验证完成时 SHA-256（后续集成改动须更新）：

| 文件                        | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `src/App.jsx`               | `2b93b3fbf66be3dc5aa1ce28a1aa36bf1e018771665fd6c67bfb76714ad2bf12` |
| `src/compare/state.js`      | `714df88a3ae2315b15196311b58d061beb9b2ef34794ac1f00a21ebdf7851151` |
| `src/compare/catalog.js`    | `c3148c8aec61eeae785e6938e4a6b6245a455fe73069ac45dc041159543132ce` |
| `src/compare/ids.js`        | `dde913ba05f1590a602f0188b98ae41c8e38c3cd759664503055dac662339f6b` |
| `tests/startup-catalog.mjs` | `4ddcd5881774a61e0b81c9fb66363c112750e56ce281cd5cc25a1fcc257689cf` |

新测试入口固定为 `tests/startup-catalog.mjs`；默认不依赖任何冻结 checkout，额外 baseline 参数仅用于本轮严格对照。正式全站性能 A/B 及生产渲染验收仍交由主整合任务统一执行。
