# Video export measurement · 视频导出测量

2026-11-05，针对蛋白质分泌模型进行匹配的本机导出对照。实现见 [400e2bc6](https://github.com/sldyns/bioscape/commit/400e2bc6dac106e3f54a060dbc408aa6947b49bf)。

## 对照方法

两组使用同一个真实模型、测试界面、相机、标签、构图和浏览器环境。基线使用同步画面读取；候选使用最多两帧的异步准备。按“基线 → 候选 → 候选 → 基线”（ABBA）顺序，各生成两次 6 秒、1920 × 1080 的 MP4。

用 performance.now() 测量 exportVideo 调用的总耗时，包含画面生成、合成、编码和封装，排除完成后的文件保存。没有在渲染或编码内部插入计时代码。输出保持 30 fps、10 Mbps，以及原模型、抗锯齿、阴影、标签与教学说明。

环境记录：Apple M1、16 GiB 内存、Chrome 156.0.8078.80；普通浏览器窗口，未设置模拟视口或 DPR。原始计时、图片、MP4 及失败记录在本地验收材料中保留；公开记录列出必要的测量结果。

| 顺序 | 路径     |   生成耗时 |
| ---- | -------- | ---------: |
| A1   | 同步基线 |  4105.0 ms |
| B1   | 异步候选 |  2546.4 ms |
| B2   | 异步候选 |  2562.6 ms |
| A2   | 同步基线 |  3877.7 ms |
| 平均 | 同步基线 | 3991.35 ms |
| 平均 | 异步候选 | 2554.50 ms |

平均生成耗时减少 35.999%，按显示精度记为 **约 36%**。

## 输出和生命周期检查

| 检查                                   | 结果                                                                  |
| -------------------------------------- | --------------------------------------------------------------------- |
| 蛋白质分泌，1920 × 1080，4 个进度      | 同步与异步 RGBA 通道零差异                                            |
| 蛋白质分泌，1440 × 2560 竖屏，4 个进度 | 同步与异步 RGBA 通道零差异                                            |
| 动物细胞拆解，1920 × 1080，4 个状态    | 同步与异步 RGBA 通道零差异                                            |
| 取消与重新导出                         | 待处理像素缓冲和 fence 均归零，实时进度恢复，重试成功                 |
| 四个计时 MP4                           | 每个 180 帧，跨度 6 秒，编码时间戳无超过 100 ms 的间隙                |
| 实际线上导出                           | 中文界面生成、播放至 0:06、下载；下载的 1080p MP4 同样为 180 帧、6 秒 |

线上下载样例用于检查实际文件输出，采用产品界面的构图，不作为上表内部计时基准。浏览器 DOM 观测接口超时的尝试保留为未完成记录，最后通过原生控件完成下载；没有把工具失败记成通过。

## 复核入口与范围

```sh
node --test tests/async-pixel-readback.mjs tests/scene-capture.mjs tests/scene-capture-scratch.mjs tests/studio.mjs tests/studio-frame-export.mjs tests/studio-worker-export.mjs
npm run check
```

产品检查可从[蛋白质分泌](https://sldyns.github.io/bioscape/#/cell?view=process&process=secretion)进入影像工作台，选择“完整过程 / 6 秒 / 横屏 / 1920 px”，生成后播放并下载。界面观察耗时还包含加载和输入观察，不能直接与 SDK 调用计时混用。

这些结果证明该配置中的生成耗时收益和抽样画面一致性，不代表所有设备、模型、控制条件或每一帧均已接受，也不构成稳定物理 60 FPS 的证明。各模型的科学范围继续以[科学验证说明](../science-audit/acceptance/VALIDATION.md)为准。

The ABBA result is a matched local generation-time measurement, with two exports per arm. Twelve sampled captures were pixel-identical. This is not a universal speed guarantee, an all-scene scientific acceptance claim, or physical presentation FPS evidence.
