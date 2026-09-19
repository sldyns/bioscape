# BioScape · 生物图景

**Created by [Kun Qian](https://sldyns.github.io/)** · 中英文交互式 3D 生物学学习网站。逐层探索生物结构，旋转、剖视、拆解模型；通过可拖动时间轴了解结构如何参与生命活动。

支持动物细胞、植物细胞、细菌、真菌、草履虫与噬菌体。每类都有「结构」和「生物学过程」目录；当前包含 84 个独立过程，按适用物种复用。React + Three.js + Vite，纯静态部署，无需账号、API 密钥或后端。

## 开始运行

使用 Node.js 22（见 [.nvmrc](.nvmrc)），在项目根目录执行：

```sh
npm ci
npm run dev
```

打开终端显示的本地地址。需要手机局域网访问时，使用终端的 Network 地址；手机上的 localhost 不指向电脑。

```sh
npm run check     # 格式、完整回归、生产构建、发布资源检查
npm run preview   # 预览已构建的 dist/
```

普通使用不需要 Python。重新提取实验坐标或生成缩略图时才使用 `scripts/*.py`；缩略图工具额外需要 Pillow。

## 探索方式

- 点击模型或左侧目录逐层进入，如「细胞核 → 染色质 → 核小体」。面包屑、返回按钮和浏览器历史均可返回。
- 结构支持适用的整体、剖面和拆解视图。鼠标拖动旋转、滚轮缩放；触屏支持手势和缩放按钮。
- 生物学过程支持搜索、分类、步骤跳转、播放速度及时间轴。部分过程提供条件对照。
- 中英切换保留当前位置；每个结构或过程都有可分享的 hash URL。

示例路径：`#/plant/chloroplast`、`#/cell?view=process&process=translation`。

## 代码结构

| 路径 | 职责 |
| --- | --- |
| `src/App.jsx`、`navigation.js` | 页面状态、结构/过程切换、路由与历史 |
| `src/catalog/`、`hierarchy.js` | 物种入口、结构层级、双语内容 |
| `src/CellScene.jsx`、`src/scene/` | 结构渲染、拾取、Worker、几何与参考坐标 |
| `src/processes/catalog.js`、`extensions.js` | 轻量过程元数据、分类、适用物种 |
| `src/processes/loaders.js` | 正式页面与缩略图工作台共用的按需加载入口 |
| `src/processes/modules/` | 22 组过程，含专属几何、双语步骤及科学回归 |
| `src/processes/ProcessScene.jsx` | 过程渲染、镜头、标签及资源释放 |
| `public/process-thumbnails/` | 示意图及实际模型渲染缩略图 |
| `tests/`、`scripts/` | 跨模块验证、构建检查和数据工具 |
| `docs/` | 维护规范、来源与可追溯的历史审查记录 |

模块内测试就近保留，生产打包只加载过程入口。结构 Worker、按需加载、实例合批和缓存保留模型精度；目录使用静态预览，不为每张卡片建立 WebGL 场景。

详见 [维护指南](CONTRIBUTING.md)、[文档索引](docs/README.md)。

## 科学范围与验证

这是有物种语境的教学示意，颜色、比例、时间和分子数量经过简化。剖视、拆解和放大不代表真实分离过程。实验骨架另注明 PDB 来源、选取范围与缺失残基；不将示意动画宣称为原子级运动。

[科学审查总表](docs/science-audit/acceptance/README.md)记录 84 个过程的初审、112 项初审修复及追加交叉复核；[验收范围](docs/science-audit/acceptance/VALIDATION.md)区分科学证据、几何回归和人工代表帧检查。历史结果不能自动作为后续改动的验收结论。

`npm run verify` 覆盖结构层级、双语内容、资源传输、过程条件、任意时间跳转及 22 组科学几何回归。通过测试不代表所有科学细节绝对无误。手机窄屏布局已检查，真实设备的触控、GPU 和后台恢复仍需实机验证。

## GitHub 与静态发布

生产产物在 `dist/`，可放在站点根目录或项目子目录。hash 路由无需服务器重写；资源使用相对路径。不要将源码目录当作生产站点。

仓库包含自动 CI，以及手动触发的 GitHub Pages 发布工作流。推送本身不会触发网站发布。配置和发布步骤见 [发布指南](docs/RELEASING.md)。当前仓库准备不代表远端仓库或公网网站已经上线。

## 授权与引用

© 2026 [Kun Qian](https://sldyns.github.io/)。项目原创部分采用 [BioScape Noncommercial License 1.0](LICENSE)，是**源码公开的非商业许可，不是 OSI 意义的开源许可证**。

- 允许非商业学习、研究、教学、使用、修改、部署和分享；无需公开自己的修改源码。
- 分享时保留作者署名、许可及第三方声明，说明实质修改。公开部署应在关于/致谢等可访问位置保留 `BioScape — Kun Qian` 和作者主页。
- **商业使用须事先获得 Kun Qian 的单独书面授权**，包括收费产品、付费课程/服务、商业内部使用及以营利为目的的广告或赞助部署。学校、科研机构身份不会自动豁免商业用途。
- 第三方代码、PDB 等实验数据保留各自许可；项目许可不对公共领域数据和科学事实增加限制。详见 [第三方声明](THIRD_PARTY_NOTICES.md)。

许可英文正文为准。以上为便于理解的中文摘要。授权联系：[kunqian@stu.pku.edu.cn](mailto:kunqian@stu.pku.edu.cn)。

推荐引用：Kun Qian. *BioScape: Interactive 3D Biological Structures and Processes*, version 1.0.0. 另请引用使用到的原始结构数据与文献。[CITATION.cff](CITATION.cff) 提供机器可读信息；引用不替代商业授权。
