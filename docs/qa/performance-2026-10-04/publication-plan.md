# 发布文件集与证据保留方案

本报告只做只读梳理。没有修改产品、Git 索引、提交、远端、工作流或浏览器，也没有运行测试。用户本次已授权发布上一轮 84 个过程的 164 项修复及本轮新优化；执行发布由主代理负责。本方案不增加重复审批。

## 当前快照与约束

检查时分支为 `main`，HEAD 为 `be81aa5ac4e2ed05ed057fbbdd5dade930188ec0`，远端配置为 `https://github.com/sldyns/bioscape.git`。本地缓存的 `origin/main` 指向同一提交；没有访问远端核实它是否仍最新。当前产品/测试/runner 候选为 198 个文件：135 个已跟踪文件修改、63 个新文件。它们尚未提交。性能代理仍可能继续写入，最终文件清单须在新优化冻结后重新生成。

上一轮审计目录有 4,672 个文件、261,894,481 字节（261.9 MB）；其中 `evidence/browser/` 占 250,469,950 字节。`audits/` 的 47 份文件约 607 KB，`resolutions/` 的 112 份文件约 831 KB。项目已有 906 个被跟踪的 `docs/qa` 文件，包含历史图像和验证用清单；本轮不删除、不取消跟踪这些历史内容。

[维护指南](../../../.github/CONTRIBUTING.md)要求：保留物种机制与几何回归、原初审不改写、修复追加到结案记录；提交排除依赖、构建、环境配置、日志、临时截图和密钥。已有 `npm run check` 成功收据是上一轮 198 文件快照的记录，不自动覆盖之后落盘的性能优化。

## 建议提交的文件集

采用**显式白名单**，不要对整个仓库或整个 QA 目录笼统暂存。建议本次形成一条完整整合提交，包含旧修复、新优化及其回归；这些修改共享入口和测试链，单独提交新优化会遗落已授权的过程修复。提交说明分别列明“164 项过程修复”和“本轮性能变化及测量边界”。如果另拆提交，每条都必须能独立构建、核对其测试依赖，不能靠倒推旧工作树凑出未经验证的中间状态。

| 集合 | 纳入策略与理由 |
| --- | --- |
| 产品源码 | 当前改动的 `src/processes/modules/`、四个原始过程，以及共享 `ProcessExperience.jsx`、`ProcessScene.jsx`、`playbackClock.js`、`src/exploration/conditionNotes.js`、`src/scene/sceneCapture.js`。这些共同实现修复后的行为、标签和播放器，不能只挑最显眼的模块。新优化的实际依赖按最终 diff 追加。 |
| 正式回归与 runner | 模块旁新增/修改的测试、相关 smoke、`tests/` 的 9 个当前改动文件及 `scripts/verify.mjs`。现有静态覆盖记录为 66/66 新增或修改测试接入；新优化增加的测试也须接入实际执行链，不能仅提交文件而未执行。 |
| 可维护的性能工具 | 只有具备明确入口、相对路径、稳定输入和合理输出位置的可复用 benchmark 工具才作为工具提交。会写临时记录的脚本应与产品入口隔离。一次性的浏览器探针、旧版本复制件不属于正式工具。 |
| 配置与资源 | `.github` 工作流、`.gitignore`、`package.json`、锁文件、模型数据和公共资源目前没有本轮改动；不为发布顺手改写。若新优化确实修改依赖、worker 或资源路径，成对纳入对应配置、锁文件和回归。既有实验坐标、署名和许可保持完整。 |
| 过程审计正文 | `README.md`、`WORKPLAN.md`、`inventory.json`、两份 reconciliation JSON、`audits/*.{md,json}`、`resolutions/*.{md,json}`。保留初审原文及逐项结案，以 issueId 连接修复和测试。 |
| 补充发现 | **必须纳入** `evidence/*/repair-discoveries.{json,md}` 和 `repair-discoveries/*.{json,md}`。当前共 44 份、约199 KB；`reconcile.mjs` 直接读取它们。只提交初审和结案会使新增问题失去来源，并让 164 项核对无法复现。 |
| 小型验收收据 | `evidence/final-check.json`、`final-code-before-check.json`、`final-code-after-check.json`、`final-artifact-check.json`、`test-runner-coverage.{json,md}`、`playback-summary.json`、`condition-summary.json`。后两份为约59 KB和452 KB的按过程/按 case 汇总，不含逐帧运行日志，应保留其完整统计口径与限制。 |
| 审计生成入口 | `inventory.mjs`、`reconcile.mjs`、`write-final-report.mjs` 及其上述输入可一起纳入；它们保留审计表格/问题核对的重建路径。生成器只能重建文字与汇总，不能重建当时的浏览器原图。 |
| 新性能摘要与发布记录 | 本文件、最终优化说明、测量方法/环境/样本与前后摘要、精度和固定视角对比结论、新整合检查收据及最终发布记录。新记录引用此次发布 SHA，保留旧审计的历史 baseline。 |

按当前候选估算，上一轮可追溯的文字、结构化摘要和小收据约219个文件、2.5 MB，远小于整个原始证据目录。这个估算不包含新性能结果与未来证据索引，不应被当作最终暂存清单。

## 默认不进入 Git 的原始证据

以下内容**保留原文件，不删除**，只从本次提交文件集中排除：

- `evidence/browser/` 的原始 WEBP/PNG、JPG contact sheets、各轮 HTML 画廊、原始运行/时间线/截图 manifest。旧版、中断版和失败对照均保持历史状态，不覆盖为成功记录。
- 完整 `.log`、原始 DOM/API/trace/逐帧数组、浏览器录制、CPU/GPU profile、heap snapshot、未汇总 benchmark 输出。例如 `evidence/rna/npc-label-visibility-probe.json` 为约1.8 MB原始探针；正文只需要其结论与定位信息。
- 作为研究输入下载的 PDB/XML 和临时数据，例如 `evidence/plantSignals/4MN8.pdb`。保留来源/许可/哈希，产品真正使用的来源数据仍按正式源码依赖提交，不能把两类混淆。
- 诊断专用的 `.mjs/.js/.jsx/.html/.patch`、旧版本源码、mutation/baseline fixture 和构建 bundle。例如 `evidence/yeastLife/nuclear-handoff-baseline/`、`evidence/division/*.baseline.mjs`、`review-sink.mjs`、`test-runner-verify.snapshot.mjs`。正式测试需要的最小 fixture 必须独立纳入测试目录，不能依赖开发机的整个诊断树。
- `node_modules/`、`dist/`、缓存、环境文件、临时 ZIP/归档及密钥。把原始截图/日志改为压缩包不会改变其排除边界。

当前 [.gitignore](../../../.gitignore) 已排除 `node_modules/`、`dist/`、`*.log`、环境文件等，但**没有**排除新 QA 图像、原始 JSON、PDB 或临时源码。实际 `git check-ignore` 已确认上述截图、原始探针和 PDB 均未被忽略，因此不能把“未被忽略”视为“应该提交”。本报告不修改 ignore 规则；显式暂存白名单即可避免误入。如后续增加规则，应只针对本轮原始输出目录，并保留小收据/发现文件的例外，不使用全局 `*.png`、`*.json` 或 `docs/qa/**` 排除。

## 保持证据可追溯

推荐在性能发布摘要中新增一份**证据位置说明和文件哈希索引**：记录相对路径、大小、SHA256、原始 case/条件、捕获轮次、所关联的 issueId，以及“随 Git 提交”或“完整原件仅本地保留”。大原件继续位于原 QA 目录；如以后建立长期归档，再追加真实归档位置和整体哈希，不先虚构可下载地址。

现有审计正文有指向截图、原始记录及完整日志的链接。精简提交后，这些链接在纯 Git checkout 中不会自动可用，必须在发布摘要/审计入口追加明确的“原始证据未随 Git 分发”说明与定位索引，不能宣称所有链接仍可跨机器访问。不要改写原初审以隐藏此差别。旧 README 中“未提交、未部署”等文字描述的是审查时状态，发布后追加一条带 SHA/时间/工作流链接的新状态记录，保留历史结论。

不要一刀切清理旧 QA。`scripts/check-release.mjs` 当前读取已跟踪的 `docs/qa/homepage/model-capture-manifest.json`、`process-motion-manifest.json` 和 `docs/process-rendered-previews.json`；这些是正式发布检查的依赖。现有缩略图、许可文本、主页视频和实验坐标同样不属于本次临时证据。

## 发布流程与完成标准

本次未运行以下动作，供主代理执行时使用：

1. 新优化及对应测试冻结后，重新生成源码/测试/runner 白名单和哈希，核对保留模型精度、固定视角及性能测量条件。先前审计通过记录继续作为旧快照；新版本取得自己的整合收据。
2. 对最终候选运行项目要求的 `npm run check`，保存退出状态、源码前后哈希和精简测量摘要。检查实际暂存集合的文件数、体积、diff 与所有新增依赖；确认没有上述大原件，也没有漏掉正式测试/导入链。完整日志留在原证据目录。
3. 提交并推送实际发布 SHA；记录 `main` 与远端的一致性。现有 [CI](../../../.github/workflows/ci.yml) 会在 main push、PR 或手动触发时执行 Node 22、`npm ci`、`npm run check`。
4. [Pages 工作流](../../../.github/workflows/pages.yml) **仅支持手动 `workflow_dispatch`**，且 build job 限制 `refs/heads/main`。普通 push 不会部署。主代理按当前用户发布授权单独触发 Pages，核对运行的 head SHA；它会再次 `npm ci`/`npm run check`，上传 `dist` artifact，再部署到 `github-pages`。
5. 等待 Pages deploy 成功，记录工作流、部署 URL 和实际 SHA；核对线上入口及资源对应此次产物，再进行线上关键路由/条件/语言/导出检查。Git push、CI 成功、Pages 部署、线上交互分别记录；不能把其中一个替代后续状态。

生产构建由 Vite 输出 `dist`，无需把 `dist` 提交到源码仓库，也无需新建 `gh-pages` 分支。现有 `base: "./"` 和 `assetUrl()`/发布资源检查共同处理项目子路径；本轮不能为了预览方便绕过这些检查。上线成功也不等于物理手机或所有 GPU 性能验收。
