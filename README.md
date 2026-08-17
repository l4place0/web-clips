# Web Clips 内容库

公开的 Markdown 剪藏内容仓库。轻文档和发布元数据保存在 GitHub；重媒体发布到阿里云
OSS；展示站代码位于独立仓库
[`l4place0/web-clips-publish`](https://github.com/l4place0/web-clips-publish)。

- 内容根：`clips/`
- 本地媒体缓存：`clips/assets/`
- OSS 媒体基地址：`https://assets.l4p.site/`
- 展示站：<https://l4place0.github.io/web-clips-publish/>

本地仍然只维护这一套文档库。`clips/assets/` 在全库媒体迁移完成前继续由 Git 跟踪；
迁移完成后只停止 Git 跟踪，不删除本地文件。

## 内容发布链路

```text
Obsidian 保存
→ Obsidian Git 频繁提交和推送内容仓库
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

## 内容校验

首次克隆后配置 Git hooks：

```powershell
git config core.hooksPath .githooks
```

常用命令：

```powershell
npm.cmd run publish:prepare
npm.cmd run publish:annotate-urls
npm.cmd run publish:validate
npm.cmd run publish:dry-run
npm.cmd test
```

`prepare` 显式分配缺失 RID；普通校验和构建不会隐式改变文档身份。

## 媒体发布

`publish-media-assets` Skill 编排同名 CLI。CLI 支持 Markdown 图片、Obsidian 图片嵌入、
HTML `img` 和 frontmatter `cover`，并以 SHA-256 生成不可变对象键。

检查和预览：

```powershell
npm.cmd run media -- check "clips/笔记.md"
npm.cmd run media -- publish "clips/笔记.md" --dry-run
```

执行发布并验证：

```powershell
npm.cmd run media -- publish "clips/笔记.md"
npm.cmd run media -- status "clips/笔记.md"
npm.cmd run media:verify
```

发布顺序固定为：扫描、路径校验、哈希、OSS 存在性检查、上传或复用、单对象
`public-read`、公网 HTTPS 校验、原子改写 Markdown 与 `publishing/assets/<rid>.json`。
任何上传或公网验证错误都不会改写本地文档。

CLI 优先使用 `OSS_ACCESS_KEY_ID` 和 `OSS_ACCESS_KEY_SECRET`；未设置时复用本机已经登录的
`ossutil`。任何命令都不应输出或提交凭据。

## 仓库边界

当前迁移期间仍保留旧 `site/`，只用于回滚和并行验收；生产展示由
`web-clips-publish` 构建。新展示仓库稳定后，才从本仓库删除 Quartz 和展示依赖。

详细契约：

- [发布身份与内容边界](publishing/contract.md)
- [双仓库与媒体架构](publishing/architecture-v2.md)
- [媒体机器配置](publishing/media.config.json)
