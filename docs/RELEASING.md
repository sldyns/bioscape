# GitHub 发布指南

仓库：[sldyns/bioscape](https://github.com/sldyns/bioscape) · 网站：[BioScape](https://sldyns.github.io/bioscape/) · [更新日志](../CHANGELOG.md)

## 保持同一版本

一次完整发布包括源码、版本与文档、自动检查、网站部署、正式标签和 GitHub Release。只推送 main 不能说明网站或 Release 已更新。

版本号同时维护在 package.json、package-lock.json 顶层及根包、CITATION.cff；引用信息中的发布日期与正式版本对应。同步中英文 README、CHANGELOG.md 和 docs/releases/ 下的版本说明。保留既有科学边界、许可和第三方署名。

| 项目        | 完成依据                                                 |
| ----------- | -------------------------------------------------------- |
| GitHub 源码 | origin/main 等于本轮已审查的提交，相关产品文件无遗漏     |
| 自动检查    | 同一提交的 Verify 成功                                   |
| 网站        | 同一提交的 Pages 部署成功，实际入口和关键资源匹配构建    |
| 正式版本    | 标签指向已验证提交，Release 已公开，版本号和引用信息一致 |
| 交付附件    | 实际产物可下载，校验和匹配；说明区分测试结果与适用范围   |

## 准备与提交

```sh
git status --short
git fetch origin
npm ci
npm run check
```

统一检查包括格式、模型与科学回归、生产构建、84 个过程的缩略图及项目子路径资源检查。生产输出只有 dist/。依赖、构建输出、环境文件和临时验收日志留在本地；package-lock.json 必须提交。

只暂存本轮逐项审查过的文件，检查暂存差异后创建提交，正常推送 main。不要使用无差别暂存覆盖无关工作，也不对共享 main 强制推送。当前项目已有 origin 和历史，无需重新初始化或替换远端。

本项目没有后端、部署密钥或数据库配置。坐标、公共图片与源码是项目的一部分，不能只上传 HTML。

## 自动检查与网站

普通 main 推送触发 Verify，PR 和手动运行同样可触发。GitHub runner 的结果必须独立核对，不能用本机通过代替。

网站发布是显式动作。Pages 使用 GitHub Actions，手动运行 Publish GitHub Pages，选择 main：

```sh
gh run list --repo sldyns/bioscape --workflow ci.yml --branch main --limit 5
gh workflow run pages.yml --repo sldyns/bioscape --ref main
gh run list --repo sldyns/bioscape --workflow pages.yml --branch main --limit 5
```

Pages 工作流先完整检查并上传 dist/，再部署到 github-pages 环境。核对两条流程的 head SHA，确认其对应目标提交。默认相对资源路径支持项目子目录，浏览路径使用 hash。

上线后检查实际公共入口、关键文件和 Worker；从结构进入过程，检查语言、时间轴、视角恢复以及本轮改动涉及的导出或交互。真实手机触控和 GPU 检查单独记录，窄视口不能代替。失败、未完成和旧基线材料保留，不能为了得到通过记录而改写历史。

## 标签与 GitHub Release

确认版本、验证及网站状态后，用明确的完整提交 SHA 创建 annotated tag，并只推送该标签。不要移动已有正式标签。Release 草稿可先准备，检查和网站通过后再公开；说明应包含变化、验证范围、网站入口和许可。

以下以目标 v1.1.0 标签为例：

```sh
gh release create v1.1.0 --repo sldyns/bioscape --verify-tag --draft --title "BioScape v1.1.0" --notes-file docs/releases/v1.1.0.md
gh release view v1.1.0 --repo sldyns/bioscape
gh release edit v1.1.0 --repo sldyns/bioscape --draft=false --latest
```

附件使用实际验收的产品输出，并提供 SHA-256。不要上传本机路径、私人截图、凭据、原始调试日志或未经许可的素材。源代码 ZIP/TAR 由 GitHub 按标签提供，无需把 node_modules 或临时构建提交到仓库。

项目原创部分使用 BioScape Noncommercial License 1.0，作者为 Kun Qian；商业授权另行书面取得，不标为 OSI 开源。复核 LICENSE、docs/legal/NOTICE、CITATION.cff 和第三方声明，保留作者与数据来源。

## 回退

通过新的 revert 提交恢复已知版本，再手动发布 Pages。不要强推共享 main 或移动已公开版本标签。网站、源码和 Release 的回退状态分别记录，最终以实际部署与可访问内容为准。
