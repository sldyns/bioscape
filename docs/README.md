# 文档索引

## 当前维护入口

- [发布指南](RELEASING.md)：本地发布检查、GitHub 初始化和 Pages 工作流。
- [过程实现规范](PROCESS_IMPLEMENTATION_STANDARD.md)：目录、模型、双语和条件契约。
- [模型精修规范](PROCESS_REFINEMENT_STANDARD.md)：几何与表现约束。
- [科学审查与闭环](science-audit/acceptance/README.md)：84 个过程逐项来源、缺陷、修复与复验。
- [验收边界](science-audit/acceptance/VALIDATION.md)：自动回归、实际画面和设备检查的范围。
- [渲染预览清单](process-rendered-previews.json)：每张静态缩略图的来源与时间点。

## 历史资料

`*PLAN*`、`*ROADMAP*`、早期设计图、`model-recheck/`、`process-refinement-audit/` 及旧 QA 文件记录开发时的状态。它们不覆盖最新科学审查，也不表示计划中的功能全部实现。保留这些资料供追溯；发布网站只打包 `dist/`，不包含历史截图或审查文档。

`science-audit` 的初审文件不可作为“当前仍存在这些错误”的清单，须联合 resolutions 与 acceptance 阅读。历史 `/tmp/` 路径在新机器上可能不存在，应用运行和统一回归不依赖这些文件。
