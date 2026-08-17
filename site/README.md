# Quartz 站点层

本站只消费 M3 生成的 `.publish-stage/quartz/content`，不会让 Quartz 扫描私人
vault。根级生产命令是：

```powershell
npm.cmd run build:site
```

该命令依次完成发布契约校验、隔离暂存构建、Quartz 构建、raw Markdown
旁路复制、Cloudflare `_headers` 写入和最终产物校验。任一步失败都不会替换上一版
`public/`。

## 固定版本

- Quartz `v5.0.0`
- 官方提交 `ab346fa66a895e12d63a308e70ce330ba795822a`
- 安装来源为该提交的 GitHub archive；`package-lock.json` 固定归档完整性和 npm
  依赖。
- `site/quartz.lock.json` 记录每个启用插件对应的官方 Git commit；实际构建从
  `package-lock.json` 带完整性校验的 `@quartz-community/*@0.1.0` 发布包生成
  Quartz 插件目录。
- Node `24.14.1` 由仓库根 `.node-version` 固定。

Quartz 不是 Git submodule，也不需要 Cloudflare 访问另一个私有仓库。升级必须显式
更换 tag/commit，并重新执行完整站点测试。

Quartz v5.0.0 的核心 `Head` 会无条件导入可选 OG 图片插件的名称。本站不启用动态
OG 图片生成；构建器会在生成插件目录后为这个可选符号写入一个禁用态兼容常量，避免
仅为该符号引入 `sharp` 图片处理链。

官方逐 Git 仓库的 `plugin restore` 会为每个插件单独安装和编译依赖，本机首次测试
超过 Cloudflare Pages 的 20 分钟构建上限。本站因此不在 CI 执行浮动 Git 恢复，而是
一次 `npm ci` 后从锁文件固定的已编译 npm 包生成插件缓存；无网络的站点构建回归约
15 秒。

M3 已把公开附件链接规范化为稳定的绝对 `/assets/<rid>/...` 路径，因此站点不启用
Quartz `crawl-links`：该插件会再次 slugify 中文/空格附件名，导致页面地址与 raw
Markdown、manifest 约定漂移。普通外链和已规范化的附件链接仍由 Markdown 渲染器
直接保留；公开笔记之间的稳定 RID 链接应由 M3 后续显式规范化。

## Cloudflare Pages（M5）

在控制台使用 **Connect to Git**，不要创建 Direct Upload 项目：

| 设置 | 值 |
| --- | --- |
| Framework preset | `None` |
| Root directory | 仓库根 |
| Build command | `npm run build:site` |
| Build output directory | `public` |
| Node | `.node-version` 的 `24.14.1`；也可额外设置 `NODE_VERSION=24.14.1` |

Quartz 会生成 `public/r/<rid>.html`。Cloudflare Pages 会把它作为
`/r/<rid>` 提供，并把显式 `.html` 请求跳转到无扩展名地址。raw 文件由构建器复制到
`public/raw/<rid>.md`；最终 `_headers` 将其声明为
`text/markdown; charset=utf-8`。不需要 Pages Functions 或 `_redirects`。

MVP 暂以 `l4p-web-clips.pages.dev` 作为 `baseUrl`，sitemap 与 RSS 保持关闭。
M5 创建 Pages 项目时应确认该项目名可用；若 Cloudflare 分配了不同的 `pages.dev`
地址，只需同步修改 `site/quartz.config.yaml`，不会改变 `/r/<rid>` 与
`/raw/<rid>.md` 的稳定路径。

建议在 Pages 项目设置中启用 Build cache；这会复用 npm 全局缓存，但不是构建正确性
所必需。

## 已知构建依赖风险

2026-07-29 的 `npm audit` 报告为 5 个 high、0 个 critical，来自 Quartz
v5.0.0 固定依赖中的 `serve-handler`/`minimatch` 链和 `sharp`。生产命令不使用
`--serve`，也不启用动态 OG 图片插件；附件由 M4 原样旁路复制，不交给 `sharp`
处理。Cloudflare 最终只部署 `public/` 静态文件，不部署 Node 依赖，因此这些项不构成
站点运行时攻击面。升级到后续 Quartz 正式版本时仍应优先复核并消除这些构建期告警。

官方依据：

- [Quartz v5.0.0](https://github.com/jackyzha0/quartz/releases/tag/v5.0.0)
- [Quartz 托管说明](https://quartz.jzhao.xyz/hosting)
- [Quartz 全文搜索](https://quartz.jzhao.xyz/features/full-text-search)
- [Cloudflare Pages 构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Cloudflare Pages 路由匹配](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Cloudflare Pages `_headers`](https://developers.cloudflare.com/pages/configuration/headers/)
