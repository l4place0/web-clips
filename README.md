# Web Clips 剪藏馆

> 内容目录：Markdown 剪藏统一存放在 `clips/`，本地附件统一存放在
> `clips/assets/`。Obsidian 的附件目录已配置为 `clips/assets`；video-sum
> 或其他剪藏工具也应将输出目录设为仓库内的 `clips`。

这是一个“私有源仓库、选择性公开”的 Markdown 剪藏馆。只有 frontmatter 中严格写为
`publish: true` 且通过全部校验的笔记，才会进入
[公开站点](https://l4p-web-clips.pages.dev)。

稳定地址只由 `rid` 决定，与文件名、目录和标题无关：

- 阅读页面：`https://l4p-web-clips.pages.dev/r/<rid>`
- 原始 Markdown：`https://l4p-web-clips.pages.dev/raw/<rid>.md`

## 发布第一篇笔记

以下命令均在仓库根目录执行。Windows PowerShell 使用 `npm.cmd`，其他环境可以使用
`npm`。

1. 为指定笔记分配永久 ID：

   ```powershell
   npm.cmd run publish -- assign-id "clips/你的笔记.md"
   ```

   命令会写入 `rid` 和由它派生的 `permalink`，但不会公开笔记。不要手工修改或复用这两个
   字段。

2. 检查笔记内容，确认其中没有不希望公开的信息，然后在 frontmatter 中手工加入或修改：

   ```yaml
   publish: true
   ```

   必须是 YAML 布尔值 `true`，不能写成字符串 `"true"`。

3. 校验并预览将要发布的闭包：

   ```powershell
   npm.cmd run publish:validate
   npm.cmd run publish:dry-run
   ```

   `dry-run` 会列出公开笔记、引用图片和目标路由，不写入发布产物。

4. 本地执行与 Cloudflare 完全相同的生产构建：

   ```powershell
   npm.cmd run build:site
   ```

5. 提交并推送。把 `dry-run` 列出的新图片也逐一加入暂存；不要使用宽泛的
   `git add -A`。Cloudflare Pages 会从 `main` 自动构建：

   ```powershell
   git add -- "clips/你的笔记.md" "clips/assets/这篇笔记引用的新图片.png" publishing/registry.json publishing/manifest.json
   git status --short
   git diff --cached
   git commit -m "publish: add resource"
   git push
   ```

6. 从笔记 frontmatter 读取 `rid`，拼出稳定页面和 raw URL。文件以后改名、移动或改标题都
   不会改变这两个地址。

## 取消发布

把笔记的 `publish` 改为 `false`（或删除该字段），然后重新校验、构建、提交和推送：

```powershell
npm.cmd run publish:validate
npm.cmd run publish:dry-run
npm.cmd run build:site
git add -- "clips/你的笔记.md" publishing/registry.json publishing/manifest.json
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
