# Changelog · 更新日志

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
