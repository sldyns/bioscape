# 共享渲染器与 15 秒导出验收

2026-11-06，基线为已发布的 v1.0.1。共享层接入现有异步双帧导出，未降低模型几何、纹理、抗锯齿、阴影、颜色、输出分辨率、帧率或编码目标码率。

## 共享资源与画面

- 九类结构根模型、六个过程上下文，各取四个固定姿态，共 60 组 1920×1080 全画幅 RGBA 对照；变更通道数为零。
- 再人为使候选渲染器的异步同步点持续等待，验证全质量兼容读取；另外 60 组全画幅对照同样为零差异。每组在内存中比较完整像素并记录 SHA-256，保留选定原尺寸 PNG；未对照缩略图。
- 该测试序列的基线创建 15 个渲染器和环境，候选跨结构与过程复用同一对资源，只创建一次。此为分配次数证据，不能换算为所有场景的耗时或帧率收益。
- 验证空闲上下文丢失后的重建、资源只释放一次、取消后 GPU 读取缓冲及同步对象归零；重新进入后完成 1440×2560 捕获。

待处理异步读取超出 500 ms 后，使用该捕获槽仍持有的原始输出目标执行完整质量读取，并为同一渲染器保留兼容路径。取消、上下文丢失和错误仍释放独立任务；正常设备继续使用异步路径。

## 入口和工作台

实际生产构建完成首页进入、结构与过程切换、动物与植物模型重入、双模型比较及返回。资源所有者退役后重新激活的生命周期另有回归检查。

受控慢 Worker 测试在首页 Worker 请求后、人工保留响应的 45 秒窗口内点击动物细胞。路由正常离开首页并显示准备状态，响应释放后模型完成；这不是自然加载耗时测试，不能把人工延迟计作产品首次加载性能。

实际工作台发现了异步读取等待超时及编码收尾卡住。保持其他代码与设置相同、关闭工作台背景模糊的诊断构建完成 15 秒导出。最终修复只在导出期间暂停工作台背景模糊合成，结束后恢复；背景装饰不进入成片。额外的编码器切换实验未纳入发布，原 quality 编码模式和 10 Mbps 目标码率保持不变。

最终版本完成“开始生成 → 取消 → 关闭 → 重新打开 → 完整生成”的蛋白质分泌长片，以及同一工作区切换后的 DNA 复制长片。两条都在实际工作台播放至 0:15，使用页面下载链接取得文件。

## 15 秒实际成片

| 文件 | 分辨率 | 帧数 | 时长 | 最大编码 PTS 间隔 | 超过 100 ms 的间隔 |
| --- | --- | --- | --- | --- | --- |
| BioScape-secretion-15s-1080p.mp4 | 1920×1080 | 450 | 15.0 s | 33.334 ms 以下 | 0 |
| BioScape-replication-15s-1080p.mp4 | 1920×1080 | 450 | 15.0 s | 33.334 ms 以下 | 0 |

SHA-256：

```text
712ae055116d7801e61e0658af6a2b5a0ddb88baa7e668afe4b5a405100d42a6  BioScape-secretion-15s-1080p.mp4
b81f6ceb26a2022845bdc563f0fb68ab727c048d328b98559905f961cd8e477b  BioScape-replication-15s-1080p.mp4
```

样例和 SHA256SUMS.txt 随 [v1.1.0 Release](https://github.com/sldyns/bioscape/releases/tag/v1.1.0) 提供。下载后的编码样本时间戳验证与页面完整播放分别留证；原始下载、失败记录和旧基线保留。

## 项目检查与范围

正式发布执行 `npm run check`，覆盖格式、模型与科学回归、生产构建及发布资源检查；并核对同一提交的 [Verify](https://github.com/sldyns/bioscape/actions/workflows/ci.yml) 和 [Pages](https://github.com/sldyns/bioscape/actions/workflows/pages.yml)。公开网站入口和关键资源须与验收构建一致。

本轮画面对照、资源分配和成片证据不等于全产品科学审查、所有视角状态字节相同、所有设备 GPU、真实手机触控或物理 60 FPS 验收。未覆盖范围不随发布改写。此前 6 秒导出提速的匹配测量见[原始记录](video-export-2026-11-05.md)，不能套用到本次 15 秒观察耗时。

## English

Sixty full-HD frame pairs across nine structure roots and six process contexts were pixel-identical to v1.0.1. A further sixty pairs remained exact under a forced asynchronous-readback stall. One shared renderer/environment replaced fifteen initializations in this test sequence. Lost-context recovery, cancellation cleanup and re-entry were checked separately.

Production Studio completed two fifteen-second 1080p exports with 450 samples each, exact 30 fps timing, end-to-end playback and actual downloads. The secretion flow included cancellation, closing and reopening Studio. GPU backdrop blur is suspended only while exporting and restored afterwards; exported visual settings and the quality encoding mode remain unchanged. These results do not establish universal scientific, device or physical-FPS acceptance.
