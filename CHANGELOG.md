# Changelog · 更新日志

## 1.1.3 — 2026-11-08

[正式版本 / Release](https://github.com/sldyns/bioscape/releases/tag/v1.1.3) · [在线体验 / Website](https://sldyns.github.io/bioscape/)

- 核糖体翻译画面移除常驻的坐标表示、重复配色和固定视角说明，细节保留在参考资料、过程介绍和对应章节中。
- 保留实验结构、独立放大示意、E/P/A 位点、链端和释放因子等生物学标签。
- 无可用关联入口时隐藏空关联区，保留当前步骤、其他步骤和返回整体结构的有效入口；清理四类范围说明中的内部目录提示。
- 四个根场景的 912 个正向及 912 个反向状态中，几何、法线、材质、相机、包围范围和保留标签的位置完全一致。
- 中英文、四个根场景共 96 组全高清无标签画面对比一致，另完成 96 次当前带标签导出；84 个过程、235 个条件的 2,768 个双语章节状态通过实际控件核查。[验证范围](docs/ui/process-annotations-2026-11-07.md)。
- 同步版本、引用信息、中英文 README 和发布附件。本次更新不引入新的性能结论。

Three duplicate technical notes have moved out of the permanent translation annotations. Biological targets and the distinction between the experimental assembly and enlarged reaction remain visible. Geometry, materials, camera and export quality are unchanged; see the [release notes](docs/releases/v1.1.3.md) for validation scope.

## 1.1.2 — 2026-11-07

[正式版本 / Release](https://github.com/sldyns/bioscape/releases/tag/v1.1.2) · [在线体验 / Website](https://sldyns.github.io/bioscape/)

- 删除结构页的常驻导航教学、重复进入/返回提示和泛化说明，保留生物学内容与模型范围。
- 过程目录移除整栏使用说明，卡片区扩展到可用空间；过程页的近义标题合并为“相关结构”。
- 精简对比页的重复提示和工作台的视频说明，中英文同步，保留必要状态、错误反馈及参考资料。
- 保持几何、材质、阴影、抗锯齿、共享渲染和原分辨率导出实现不变。
- 同步版本、引用信息、中英文 README、文档索引及发布记录。[版本说明](docs/releases/v1.1.2.md)。

Repeated navigation tutorials and duplicate headings have been removed across structure exploration, biological processes, comparison and Studio. Both languages retain biological context and essential feedback; rendering detail and export quality remain unchanged.

## 1.1.1 — 2026-11-06

[正式版本 / Release](https://github.com/sldyns/bioscape/releases/tag/v1.1.1) · [在线体验 / Website](https://sldyns.github.io/bioscape/)

- 溶原细胞分裂包膜、细菌分裂包膜和纤毛曲面复用已有的精确 Float32 法线计算器，保留每次累加和归一化的写入结果。
- 同一自然 DPR2 浏览器的 A-B-B-A 对照中，受测活动条件的模型更新 P95 耗时减少约 45%–66%；这是对应模型和条件的 CPU 测量，不是全站帧率承诺。
- 235 个根模型/条件组合、1,384 个章节条件通过 11,980 次正反向状态检查；候选与基线的 5,990 个状态一致，48 组全高清画面对照逐像素一致。
- 同步版本、引用信息、中英文说明和发布记录。[测量、方法及边界](docs/performance/exact-normal-hotpaths-2026-11-06.md)。

Three measured normal-update hotpaths reuse the existing exact Float32 implementation. A matched native-DPR2 ABBA trial reduced model-update p95 time by about 45%–66% in the declared active conditions, with exact geometry/normal snapshots and full-HD raster equivalence. This does not establish universal performance or physical 60 FPS.

## 1.1.0 — 2026-11-06

[正式版本 / Release](https://github.com/sldyns/bioscape/releases/tag/v1.1.0) · [在线体验 / Website](https://sldyns.github.io/bioscape/)

- 结构与过程视图共用一个空闲渲染器和环境资源；比较视图仍使用两个独立画布，离开工作区时退役资源。
- 切换时恢复各场景原有绘制状态，保留抗锯齿、阴影、分辨率、模型和标签；已丢失的图形上下文重新创建。
- 重新进入时恢复资源所有者的可用状态；保留异步双帧导出、取消释放和视角恢复接口。
- 导出期间暂停工作台背景模糊合成，避免 GPU 读回和编码收尾卡住；完成后恢复，成片画质不变。
- 补充当前组合版本的 120 组画面对照、入口回归以及两条 15 秒成片验证。[验证与边界](docs/performance/shared-renderer-2026-11-06.md)。

Structure and process scenes now share one idle renderer/environment pair. Each scene restores its original drawing settings; comparison keeps independent canvases. Re-entry reactivates ownership, while the existing asynchronous export and cancellation paths remain intact. See the [release notes](docs/releases/v1.1.0.md) for validation scope.

## 1.0.1 — 2026-11-05

[正式版本 / Release](https://github.com/sldyns/bioscape/releases/tag/v1.0.1) · [在线体验 / Website](https://sldyns.github.io/bioscape/)

### 视频导出 / Video export

- 异步读取渲染结果，最多准备两帧，按原顺序合成和编码；保留同步读取及浏览器兼容回退。
- 取消、错误和关闭时释放待处理画面及 GPU 读取资源，阻止取消后的迟到画面重新绘制。
- 保留分辨率、抗锯齿、阴影、模型细节、标签、30 fps 和原编码码率。
- 一次本机 ABBA 对照中，6 秒 1080p 蛋白质分泌视频平均生成时间从 3.99 秒降到 2.55 秒，耗时减少约 36%。[完整测量及范围](docs/performance/video-export-2026-11-05.md)。

Video export now prepares up to two independent frames asynchronously while composing and encoding them in order. Cancellation releases pending work, and the existing synchronous and browser compatibility paths remain available. A matched local six-second 1080p benchmark reduced mean generation time by 36%; the result is specific to that test configuration.

### 完整交付 / Release contents

- 包含此前已合入的场景细节、视角恢复、渲染器与 Worker 生命周期、过程连续性和导出响应改进。
- 统一软件版本、依赖锁文件根版本、引用信息、中英文 README、发布指南和正式版本记录。
- 提供实际线上导出的 MP4 样例与校验和；源码随正式标签提供。

This release also includes the scene, view-restoration, renderer/worker ownership and process-continuity refinements already merged before the export pipeline update. Version metadata, citation information, bilingual documentation and the GitHub release are maintained together.

### 验证 / Validation

完整检查包含格式、模型与科学回归、生产构建和发布资源检查。导出专项验证涵盖 12 组逐像素对照、取消与重试、完整播放，以及实际线上 MP4 下载与编码时间戳。[版本说明](docs/releases/v1.0.1.md)区分已验证范围和仍未覆盖的设备或场景。

The full check covers formatting, model/science regressions, the production build and release assets. Export-specific evidence includes 12 exact pixel comparisons, cancellation/retry, playback, and an actual online MP4 download with verified sample timing.
