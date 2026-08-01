# Web Clips 剪藏馆

> 内容目录：Markdown 剪藏统一存放在 `clips/`，本地附件统一存放在
> `clips/assets/`。Obsidian 的附件目录已配置为 `clips/assets`；video-sum
> 或其他剪藏工具也应将输出目录设为仓库内的 `clips`。

这是一个自动公开的 Markdown 剪藏馆。`clips/` 下通过校验的 Markdown 笔记都会进入
[公开站点](https://l4p-web-clips.pages.dev)。

稳定地址只由 `rid` 决定，与文件名、目录和标题无关：

- 阅读页面：`https://l4p-web-clips.pages.dev/r/<rid>`
- 原始 Markdown：`https://l4p-web-clips.pages.dev/raw/<rid>.md`

## 自动同步

日常使用只有一条链路：

```text
Obsidian 保存 → Obsidian Git 自动提交并推送 → Cloudflare Pages 自动构建
```

Obsidian Git 在文件变化稳定约 1 分钟后合并提交并推送。Git 提交钩子会自动为新笔记补齐稳定
RID、permalink 和可点击的 `webClipUrl` 公开地址，再执行发布校验。Cloudflare Pages 监听
`main` 分支，无需额外同步服务或 Windows 计划任务。

首次克隆后运行一次：

```powershell
git config core.hooksPath .githooks
```

并在 Obsidian 中安装、启用 Git 社区插件。仓库已经保存所需的插件设置。

## 手工发布与诊断

以下命令均在仓库根目录执行。Windows PowerShell 使用 `npm.cmd`，其他环境可以使用
`npm`。

1. 自动为新增笔记补齐永久 ID，并检查发布内容：

   ```powershell
   npm.cmd run publish:prepare
   npm.cmd run publish:annotate-urls
   npm.cmd run publish:validate
   npm.cmd run publish:dry-run
   ```

   `dry-run` 会列出公开笔记、引用图片和目标路由，不写入发布产物。

2. 本地执行与 Cloudflare 完全相同的生产构建：

   ```powershell
   npm.cmd run build:site
   ```

3. 如需手工提交并推送，把 `dry-run` 列出的新图片也逐一加入暂存；不要使用宽泛的
   `git add -A`。Cloudflare Pages 会从 `main` 自动构建：

   ```powershell
   git add -- "clips/你的笔记.md" "clips/assets/这篇笔记引用的新图片.png" publishing/registry.json publishing/manifest.json
   git status --short
   git diff --cached
   git commit -m "publish: add resource"
   git push
   ```

4. 笔记 frontmatter 中的 `webClipUrl` 是可直接点击和复制的展示地址。它由 RID 派生；文件
   以后改名、移动或改标题都不会改变该地址。

## 取消发布

从 `clips/` 删除笔记，然后提交和推送：

```powershell
git add -- "clips/你的笔记.md"
git commit -m "publish: retire resource"
git push
```

新部署完成后，原 `/r/<rid>` 和 `/raw/<rid>.md` 应返回 404。已公开过的 `rid` 会永久退休，
不能重新启用或转给另一篇笔记。

等待 Cloudflare 中对应 `main` 提交的生产部署显示 `Success` 后，可以用下面的只读命令验证：

```powershell
curl.exe -sS -o NUL -w "%{http_code}`n" "https://l4p-web-clips.pages.dev/r/<rid>"
curl.exe -sS -o NUL -w "%{http_code}`n" "https://l4p-web-clips.pages.dev/raw/<rid>.md"
```

两条命令都应输出 `404`。

## 验收与排错

本地完整 MVP 验收：

```powershell
npm.cmd run test:mvp
```

只读检查生产站点：

```powershell
npm.cmd run test:mvp:live
```

常见错误：

| 诊断码 | 含义与处理 |
| --- | --- |
| `E_FRONTMATTER_PARSE` | YAML frontmatter 无法解析；先修正语法 |
| `E_PUBLISH_TYPE` | `publish` 不是布尔值；使用不带引号的 `true` 或 `false` |
| `E_RID_MISSING` | 公开笔记没有 ID；先运行 `assign-id` |
| `E_RID_DUPLICATE` / `E_RID_REUSED` | ID 重复或已经退休；不要复制或手改 `rid` |
| `E_PERMALINK_MISSING` / `E_PERMALINK_MISMATCH` | `permalink` 缺失或漂移；不要手改，检查版本历史 |
| `E_ATTACHMENT_MISSING` | 引用的本地图片不存在或路径大小写不一致 |
| `E_ATTACHMENT_ESCAPE` | 附件路径越过允许的 `clips/assets/` 边界 |
| `E_ATTACHMENT_AMBIGUOUS` | 附件路径大小写不精确或解析不唯一 |
| `E_PRIVATE_EMBED` | 公开笔记嵌入了另一篇笔记；MVP 会阻止发布 |
| `E_FEATURE_DISABLED` | 使用了尚未启用的 PDF/OSS 功能 |

`W_REMOTE_ASSET` 和 `W_PRIVATE_LINK` 是警告：前者表示远程图片不会被本站镜像，后者表示
链接指向未公开笔记。警告默认不阻断构建，但应在推送前人工确认。

构建失败时不会替换上一版成功的 `public/`。不要提交 `.env`、OSS/Cloudflare 凭据、
`node_modules/`、`.publish-stage/` 或 `public/`；这些路径已由 `.gitignore` 隔离。

## 当前边界

- 已启用：Markdown、被公开笔记实际引用的本地图片、中文搜索、标签和目录。
- 尚未启用：PDF、阿里云 OSS、正式域名。
- GitHub 源仓库保持私有；Cloudflare GitHub App 仅能访问
  `l4place0/web-clips`。

完整身份、路由和安全契约见
[publishing/contract.md](publishing/contract.md)，站点构建细节见
[site/README.md](site/README.md)。
