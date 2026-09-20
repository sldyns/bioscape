# 维护指南

## 修改边界

结构层级放在 `catalog` / `hierarchy`，结构几何放在 `scene`；过程元数据保持轻量，过程几何放在对应 `processes/modules/<group>`。不要从目录组件静态导入全部模型，或把 Node 测试工具导入浏览器入口。

`loaders.js` 是正式播放页和预览工作台共用的入口。新增过程时同步 `entries.js`、适用根节点、双语内容及静态缩略图；参考 [过程实现规范](../docs/PROCESS_IMPLEMENTATION_STANDARD.md)。公共图片经 `assetUrl()` 解析，避免 GitHub 项目子路径下失效。

已有科学几何中的数值往往约束真实连接、包含或方向关系。不要为了缩短代码合并不同物种机制；重构后保留原几何回归及条件分支。

## 验证

```sh
npm run format
npm run verify
npm run build
npm run check:release
```

`npm run check` 顺序执行全部步骤（格式只检查，不修改）。`npm run test:science` 只跑各组科学回归；也可从根目录直接运行某组的 `science.test.mjs`。测试放在模块旁边，共享验证放在 `tests/`。

涉及界面的改动还需浏览器查看：目录 → 进入模型 → 条件/时间轴 → 返回 → 切换语言；涉及资源路径时需检查生产构建的项目子目录。不要把纯数据或单元测试当作视觉验收。

## 数据与文档

实验坐标保留来源、SHA256、共同坐标及缺失残基边界；提取脚本从显式输入文件生成，不在网站运行时下载。`scripts/preview/index.html` 是开发用截图工作台，默认生产构建不包含它。

审查初稿保留原始结论；修正追加至 resolutions 和 acceptance，不通过删除旧证据宣称通过。记录中的临时路径是历史证据位置，不能当作跨机器可运行依赖。运行科学审计汇总使用：

```sh
node docs/science-audit/aggregate.mjs --complete
node docs/science-audit/acceptance.mjs --complete
```

提交前排除依赖、构建输出、环境配置、日志、截图临时文件和密钥。不要替换模型数据、移除有效回归或修改历史审查结论来消除测试失败。

## 署名与许可

项目原创部分使用 [BioScape Noncommercial License 1.0](../LICENSE)。贡献者保留自己的著作权，只提交自己有权授权的内容，并列明新增第三方材料的来源及许可。提交贡献时应明确同意本项目的非商业分发条件；不能仅靠提交 PR 推断对 Kun Qian 的商业再授权。若贡献拟纳入商业许可，需另行取得贡献者明确的书面授权。

作者及授权联系见 [NOTICE](../docs/legal/NOTICE)。不要移除原作者、实验数据或依赖的署名。
