# Web Clips 剪藏馆

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
   npm.cmd run publish -- assign-id "你的笔记.md"
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
   git add -- "你的笔记.md" "assets/这篇笔记引用的新图片.png" publishing/registry.json publishing/manifest.json
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
git add -- "你的笔记.md" publishing/registry.json publishing/manifest.json
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
| `E_ATTACHMENT_ESCAPE` | 附件路径越过允许的 `assets/` 边界 |
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

## 自动同步

自动同步只接纳仓库根目录中除 `README.md` 外的 Markdown 剪藏。新笔记若未声明
`publish`，会自动获得永久 RID，并写入严格布尔值 `publish: true`；显式
`publish: false` 表示取消发布。项目代码、说明、技能、缓存、凭据、未引用附件和
`assets` 中的 sidecar 数据均不会进入自动提交。

```powershell
# 只读查看本轮增量
npm.cmd run sync:check

# 立即执行一次：校验、构建、最小提交并推送
npm.cmd run sync:now

# 安装并检查每分钟计划任务
npm.cmd run sync:install
npm.cmd run sync:status
```

计划任务名为 `WebClipsAutoSync`，仅在当前用户已登录时运行。每分钟检查一次，
Markdown 和引用附件必须静默至少 30 秒，因此通常在保存后 1–3 分钟上线。
没有内容变化时会在构建前成功退出，不 commit、不 push。

运维命令：

```powershell
npm.cmd run sync:pause
npm.cmd run sync:resume
npm.cmd run sync:run-task
npm.cmd run sync:uninstall
```

日志和锁位于 `%LOCALAPPDATA%\WebClipsAutoSync\<仓库路径哈希>\`，不在 OneDrive
和 Git 中。日志只记录时间、结果、数量、相对路径和错误摘要，不记录正文或秘密值；
每日轮转，保留最近 14 天。卸载计划任务不会删除内容、发布状态或历史日志。

安全失败是预期行为：非内容工作树改动、已暂存文件、远端分叉、缺失附件、秘密模式
命中、校验/构建失败或 push 失败都不会推送半成品。push 失败产生的合法自动同步
提交会保留在本地，并在下一轮确认远端没有分叉后重试。若 `origin/main` 已发生
分叉，需人工处理；自动同步不会 merge、rebase 或 force push。
