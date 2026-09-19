# GitHub 发布指南

## 本地准备

```sh
npm ci
npm run check
```

统一检查包括格式、结构与过程回归、生产构建、84 个过程的缩略图完整性及项目子路径资源检查。生产输出只有 `dist/`；`node_modules`、`dist`、环境文件及日志不提交。`package-lock.json` 必须提交。

本项目没有后端、密钥或数据库配置。坐标数据、图片与源码必须一起提交；只上传 HTML 会造成模型和图片丢失。

## 创建或连接 GitHub 仓库

先确定仓库所属账号、名称和可见性。当前原创项目采用 BioScape Noncommercial License 1.0，作者为 Kun Qian，商业使用须另行书面授权。发布前复核 LICENSE、NOTICE、CITATION.cff 与第三方声明；这是源码公开项目，不标为 OSI 开源。不要覆盖已有远端历史。

本地已初始化时无需再次 `git init`。检查拟提交文件后建立初始提交，再使用实际仓库地址连接：

```sh
git status --short
git add .
git commit -m "Prepare BioScape for GitHub"
git remote add origin <实际仓库地址>
git push -u origin main
```

`<实际仓库地址>` 是待替换占位符。若已有 origin，先查看现有地址，不要直接改写。提交身份由本机 Git 配置提供，不要编造作者。

## GitHub Actions 与 Pages

`.github/workflows/ci.yml` 在 main 推送、PR 和手动触发时运行 `npm ci` 与 `npm run check`。本地通过不代表 GitHub runner 已运行通过。

需要发布网站时，在仓库 Settings → Pages 选择 GitHub Actions，然后在 Actions 手动运行 **Publish GitHub Pages**，选择 main。工作流先完整检查并上传 `dist/`，再部署到 `github-pages` 环境；普通推送只跑 CI，不直接发布。

默认相对资源路径支持 `https://账号.github.io/仓库名/`，也支持根域名。深层浏览使用 hash，不需要 SPA 重写规则。具体平台要求参考 [GitHub 官方自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 上线验收与回退

打开 Actions 返回的实际 URL，检查目录图片、进入结构/过程、切换语言、时间轴、Worker 加载及刷新。还需真实手机验证触控与 GPU，浏览器窄视口不能替代。

回退时通过新的 revert 提交恢复已知版本，再手动运行发布工作流；不对共享 main 强制推送。上线状态以成功的部署记录和实际网页为准。
