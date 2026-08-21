# Web Clips 内容库

公开的 Markdown 剪藏内容仓库。本地 Vault 只承担文档编辑与 Git 同步；重媒体发布到阿里云
OSS，内容校验、派生元数据和站点构建均由 GitHub Actions 或独立发布仓库负责。展示站代码位于
独立仓库
[`l4place0/web-clips-publish`](https://github.com/l4place0/web-clips-publish)。

- 内容根：`clips/`
- 本地媒体缓存：`clips/assets/`
- OSS 媒体基地址：`https://assets.l4p.site/`
- 展示站：<https://l4place0.github.io/web-clips-publish/>

本地仍然只维护这一套文档库。`clips/assets/` 是已加入 `.gitignore` 的工作缓存，不由 Git
跟踪，也不会被发布工具自动删除；公开 Markdown 只引用已经发布的 HTTPS 媒体 URL。

## 内容同步与发布链路

```text
Obsidian 保存
→ Obsidian Git 直接提交和推送 Markdown
→ 本仓库 Actions 为缺失的 `rid`、`permalink`、`webClipUrl` 补充稳定元数据
→ web-clips-publish 每 30 分钟检查内容 main SHA
→ SHA 变化时固定 checkout 该提交
→ 校验、构建并部署 GitHub Pages
```

频繁的内容 push 不直接触发站点构建。需要立即发布时，在 `web-clips-publish` 的 Actions
页面手动运行 `Deploy web clips`；选择 `force` 可重建相同内容 SHA。

页面稳定身份由 frontmatter 中的 `rid` 决定。展示地址为：

```text
https://l4place0.github.io/web-clips-publish/r/<rid>
```

## 内容元数据

内容同步不再使用仓库根级 Node 依赖，也不运行 Git hooks。`.github/workflows/content-metadata.yml` 在内容推送后：

1. 为缺失的公开笔记生成 UUID v4 `rid`；
2. 根据 `rid` 幂等更新 `permalink` 和 `webClipUrl`；
3. 检查 `rid` 格式与唯一性；
4. 仅在元数据发生变化时创建一次机器人提交。

已有 `rid` 不会因标题、路径或正文变化而改变。`publish: false` 的笔记不参与该流程。

## 媒体发布

`publish-media-assets` 是当前 Vault 专用的仓库级 Codex Skill，位于
`.codex/skills/publish-media-assets/`。它读取被 Git 忽略的 `clips/assets/`，上传并验证 OSS
对象，再把 Markdown 中的本地引用原子改写为公开 HTTPS URL。本地媒体清单保存在被忽略的
`.media-publish/`，不会进入内容 Git 历史。

该 Skill 自带独立的 `package.json`，依赖只安装在 Skill 目录且 `node_modules/` 不进入 Git。
它不会被任何 Git hook 调用；即使媒体运行时未安装或 OSS 不可用，Obsidian Git 仍只同步文档。

发布顺序固定为：扫描、路径校验、哈希、OSS 存在性检查、上传或复用、单对象
`public-read`、公网 HTTPS 校验、原子改写 Markdown 与本地媒体清单。
任何上传或公网验证错误都不会改写本地文档。

CLI 优先使用 `OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET`；未设置时复用本机已经登录的
`ossutil`。任何命令都不应输出或提交凭据。

## 仓库边界

本仓库不包含发布 CLI、站点主题、Quartz 或 Pages 部署代码；生产展示与完整内容校验由
[`web-clips-publish`](https://github.com/l4place0/web-clips-publish) 构建和部署。

本地 Git 同步不依赖 Node、npm、OSS 凭据或发布服务可用性。
