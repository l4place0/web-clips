# Web Clips 发布契约（v2）

当前仓库内容根为 `clips/`，本地媒体工作缓存根为 `clips/assets/`。公开 Markdown 不保留
指向该缓存的相对媒体引用；媒体先由 `publish-media-assets` 发布到 OSS，再改写为
`https://assets.l4p.site/media/...`。媒体对象与双仓库边界的详细契约见
`publishing/architecture-v2.md`。

本文件定义仓库从私有剪藏库生成公开站点时必须遵守的稳定身份、路由和隐私边界。`publishing/config.json` 是同一契约的机器可读版本；发生冲突时，发布器必须报 `E_CONFIG_INVALID`，不得自行猜测或发布。

## 1. 内容根即公开边界

- 当 `source.publishAll` 为 `true` 时，内容根目录中的所有 Markdown 都是公开候选。
- 本仓库以 `clips/` 作为公开边界，`publish` 字段不再控制公开状态。
- frontmatter 无法解析时应报 `E_FRONTMATTER_PARSE`，该次构建整体失败。
- `clips/` 中的笔记正文及其 frontmatter 均视为已获公开授权。发布前仍必须通过本契约的身份、附件和嵌入校验。
- 发布器只能把公开候选和它们明确引用的附件放入隔离暂存树。不得把整个私有仓库直接交给 Quartz；Quartz 的 Markdown 过滤不会自动保护同目录下的所有非 Markdown 文件。

## 2. 稳定资源身份

### 2.1 `rid`

`rid` 是资源的唯一身份源，与文件名、目录、标题、正文内容及来源 URL 完全解耦。

- 格式：canonical lowercase UUIDv4。
- 长度：精确 36 个字符。
- 正则：`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`。
- 生成：仅由显式的 `assign-id` 操作（或 M3 中同义命令）调用系统 CSPRNG/标准 UUIDv4 生成。
- `prepare`/`assign-id` 负责修改源笔记；普通 `validate`、`build` 和 `dry-run` 不得隐式修改源笔记。公开候选缺少 `rid` 时应报 `E_RID_MISSING`。
- 写入前必须重新扫描所有声明过 `rid` 的笔记及历史注册表。若候选 ID 冲突，丢弃候选并重新生成；绝不覆盖。
- 一旦 ID 经显式分配并登记，就永久不可更改、不可转让、不可复用。取消发布或删除源文件后也必须保留 retired/tombstone 记录。
- 不得自动将大写或其他 UUID 变体“修正”为规范值；不规范值应报 `E_RID_INVALID`，避免静默改变 URL。

M3 应创建并维护 `publishing/registry.json`。它是可版本控制、append-only 的身份账本，至少记录 RID、首次登记的资源归属、状态（active/retired）和最后已知源路径。扫描重复时必须覆盖内容根中的所有笔记。

### 2.2 `permalink`

`permalink` 是从 `rid` 派生的必填校验字段，不是第二身份源，也不是用户可自由选择的路径：

```text
permalink = "/r/" + rid
```

- 显式 `assign-id` 应一次写入 `rid` 和规范 `permalink`。
- 公开候选缺少 `permalink` 时应报 `E_PERMALINK_MISSING`。
- 值与派生结果不完全一致时应报 `E_PERMALINK_MISMATCH`，不得静默覆盖。
- 文件改名、移动或标题变化时，不修改 `rid` 或 `permalink`，公开 URL 因而保持稳定。

### 2.3 `webClipUrl`

`webClipUrl` 是供 Obsidian 属性面板直接点击、复制的完整公开展示地址：

```text
webClipUrl = routes.publicBaseUrl + permalink
```

该字段是派生值，不是新的身份来源。`annotate-urls` 命令负责幂等地添加或修正它；Git
`pre-commit` hook 在分配 RID 后调用该命令，并把变化重新加入本次提交。

Quartz v5 当前会把 frontmatter `permalink` 当作别名重定向入口，而不是直接改变 canonical 页面 slug。若暂存文件已经位于 `content/r/<rid>.md`，继续把相同 `permalink` 交给 Quartz 可能造成输出冲突或自重定向。因此 M3 必须先校验源字段，再从交给 Quartz 的暂存副本中移除 `permalink`。源笔记和 raw Markdown 中保留该字段。

## 3. 公开路由

对每个公开资源：

| 资源 | Canonical URL | 生成责任 |
| --- | --- | --- |
| 页面 | `/r/<rid>` | M3 把笔记放到 `content/r/<rid>.md`；Quartz 生成 `public/r/<rid>.html` |
| 原始 Markdown | `/raw/<rid>.md` | M3 生成经过发布过滤和链接规范化的 raw 副本，并在 Quartz 构建后旁路复制到 `public/raw/` |
| PDF（Post-MVP） | `/pdf/<rid>.pdf` | 仅保留契约；OSS 存储适配在 Post-MVP 实现 |

约束：

- RID 和路由都区分大小写，canonical URL 使用小写 RID。
- 页面 canonical URL 不带尾斜杠。M4/M5 可用 `_redirects` 兼容带尾斜杠或 `.html` 请求，但兼容入口不能成为身份源。
- raw 文件保留 `.md` 扩展名，并应由静态托管设置 `Content-Type: text/markdown; charset=utf-8`。
- raw 是公开候选的规范化副本，不是对整个私有源树的直出；其中的本地附件链接必须已重写为公开路径。

本项目的稳定性来自 RID 和确定性的暂存路径，不依赖 Quartz 默认的源文件路径 slug，也不依赖 Cloudflare 的重定向来维持身份。

## 4. 附件与嵌入

### 4.1 本地图片工作缓存

- 内容导出器只处理公开笔记正文实际引用的本地图片，以及 `cover` 明确引用的本地图片；
  不得整目录复制。正式发布前必须先运行媒体发布器，使全库本地媒体引用归零。
- 允许根目录由配置限定，当前仅允许 `clips/assets/`。
- 支持解析标准 Markdown image、Obsidian image embed；M3 还应识别 HTML `<img src>`，无法安全解析时 fail closed。
- 解析后的真实路径必须仍位于允许根内。绝对本地路径、`..` 越界、符号链接或 junction 逃逸一律报 `E_ATTACHMENT_ESCAPE`。
- 路径必须按实际目录条目做大小写精确匹配，即使在 Windows 上也不能放宽；缺失、大小写不符、类型非法或同名解析不唯一分别阻断发布。
- 允许的扩展名见 `publishing/config.json`。扩展名和检测到的文件类型必须一致；SVG、JSON 等未列入类型不得随图片目录泄漏。
- 远程 `http(s)` 图片在 MVP 中原样保留，不下载、不镜像，并报 `W_REMOTE_ASSET`；这意味着远端可用性不受本站保证。
- 旧的 `/assets/<rid>/...` 输出仅是导出器的兼容能力，不再是生产媒体路径。生产媒体使用
  内容哈希 OSS URL，源笔记改名或移动不会改变该 URL。

### 4.2 私有笔记链接与嵌入

- MVP 禁止把其他笔记作为内容嵌入。公开笔记出现笔记 transclusion 时应报 `E_PRIVATE_EMBED`，避免把私有正文带入公开页。
- 普通链接指向未发布笔记时，不得复制目标内容；报 `W_PRIVATE_LINK`，并由 M3 将链接降级为不泄露目标路径的文本或安全的失效链接。

### 4.3 PDF 与 OSS（Post-MVP）

frontmatter 预留一个主 PDF：

```yaml
pdf:
  path: clips/assets/documents/example.pdf
  title: 可选标题
```

`path` 必须是位于允许本地根内的仓库相对路径，文件扩展名和实际类型都必须是 PDF。v1 的 `features.pdf` 与 `features.oss` 均为 `false`；公开笔记出现 `pdf` 时应报 `E_FEATURE_DISABLED`，不得静默遗漏。

Post-MVP 启用时，逻辑地址固定为 `/pdf/<rid>.pdf`。阿里云 OSS 的 bucket、object key、默认域名、MIME、缓存与 CORS 是存储适配细节，不得取代 RID 成为资源身份源。

## 5. 取消发布与删除

- 每次成功构建都应产生 `publishing/manifest.json`，列出 RID 与其页面、raw、附件产物。
- 下一次成功构建根据上一次成功 manifest 做集合差，从全新暂存/输出中排除已经取消发布或删除的资源。
- 删除只能作用于声明的受控输出根和 manifest 中的精确路径，不得使用模糊 glob 删除。
- 取消发布或删除源文件后，RID 在注册表中标记 retired，永不重新分配。
- 若扫描、校验或构建失败，不更新 registry/manifest，不执行删除，也不部署不完整站点；上一次成功站点保持不变。
- 实际公开站点的旧文件由一次全新、原子化的 Pages 部署清除，而不是在生产环境逐文件修改。

## 6. 最小 frontmatter 示例

这是规范示例，不应自动写入任何现有笔记：

```yaml
---
title: 示例资源
rid: 5d3b8f6e-19c4-4c62-9a71-2f0e8d7b6c45
permalink: /r/5d3b8f6e-19c4-4c62-9a71-2f0e8d7b6c45
tags:
  - example
---
```

对应页面为 `/r/5d3b8f6e-19c4-4c62-9a71-2f0e8d7b6c45`，raw 为 `/raw/5d3b8f6e-19c4-4c62-9a71-2f0e8d7b6c45.md`。

## 7. M3 校验矩阵

| 条件 | 诊断码 | 级别 | 行为 |
| --- | --- | --- | --- |
| 配置不可解析或文档/配置关键约束不一致 | `E_CONFIG_INVALID` | error | 不发布，退出 2 |
| frontmatter YAML 解析失败 | `E_FRONTMATTER_PARSE` | error | 不发布，退出 3 |
| 公开候选缺少 RID | `E_RID_MISSING` | error | 提示运行 `prepare`，不由构建隐式修改源文件，退出 3 |
| RID 非 canonical lowercase UUIDv4 | `E_RID_INVALID` | error | 不自动修正，退出 3 |
| 任意笔记/注册表之间 RID 重复 | `E_RID_DUPLICATE` | error | 列出冲突路径，不显示正文，退出 3 |
| RID 试图转给其他资源或复用 retired ID | `E_RID_REUSED` | error | 退出 3 |
| 公开笔记缺少 `permalink` | `E_PERMALINK_MISSING` | error | 退出 3 |
| `permalink` 不等于 `/r/<rid>` | `E_PERMALINK_MISMATCH` | error | 退出 3 |
| 本地附件缺失 | `E_ATTACHMENT_MISSING` | error | 退出 3 |
| 本地附件越界 | `E_ATTACHMENT_ESCAPE` | error | 退出 3 |
| 本地附件扩展名/MIME 非允许类型 | `E_ATTACHMENT_TYPE` | error | 退出 3 |
| 本地附件解析不唯一或大小写不精确 | `E_ATTACHMENT_AMBIGUOUS` | error | 退出 3 |
| 内容嵌入私有或未识别笔记 | `E_PRIVATE_EMBED` | error | 退出 3 |
| 使用尚未启用的 PDF/OSS 功能 | `E_FEATURE_DISABLED` | error | 退出 3 |
| 远程图片未镜像 | `W_REMOTE_ASSET` | warning | 保留 URL，默认不阻断 |
| 链接到私有笔记 | `W_PRIVATE_LINK` | warning | 不复制目标内容，默认不阻断 |

进程退出码：

| 退出码 | 含义 |
| --- | --- |
| `0` | 成功；允许存在 warning |
| `2` | CLI 用法或发布契约/配置无效 |
| `3` | 内容校验失败 |
| `4` | 受控文件系统或暂存 I/O 失败 |
| `5` | 未预期的内部错误 |

机器可读输出必须包含稳定诊断码；测试与自动化不得依赖自然语言错误文本。

## 8. M3 必须实现的接口

M3 至少提供以下等价能力，具体命令名可调整：

1. `prepare`：为内容根中缺少身份的笔记批量生成并原子写入 `rid`、`permalink`。
2. `assign-id <note>`：为单篇笔记显式登记身份。
3. `validate`：只读全库扫描、身份/隐私/附件检查，生成机器可读诊断。
4. `build --dry-run`：展示候选、附件闭包、目标路由和将移除的旧产物，不修改源、manifest 或生产输出。
5. `build`：在全新 `.publish-stage/` 中生成 Quartz 内容树、raw 副本与附件闭包；全部成功后才原子更新 registry/manifest。
6. `clean`：只允许清理配置声明的受控暂存/输出根。

## 9. Quartz 与静态托管依据

- [Quartz v5 Authoring Content](https://quartz.jzhao.xyz/authoring-content)
- [Quartz v5 Private Pages](https://quartz.jzhao.xyz/features/private-pages)
- [Quartz v5 AliasRedirects](https://quartz.jzhao.xyz/plugins/AliasRedirects)
- [Quartz NoteProperties 的 `permalink` 转 alias 实现](https://github.com/quartz-community/note-properties/blob/main/src/transformer.ts)
- [Quartz PageTypeDispatcher 页面写出实现](https://github.com/jackyzha0/quartz/blob/v5/quartz/plugins/pageTypes/dispatcher.ts)
- [Quartz Static 固定输出到 `/static`](https://github.com/jackyzha0/quartz/blob/v5/quartz/plugins/emitters/static.ts)
- [Cloudflare Pages HTML 路由匹配](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Cloudflare Pages Redirects](https://developers.cloudflare.com/pages/configuration/redirects/)

这些资料说明实现可行，但不构成本项目的身份规则；本文件第 1～8 节才是稳定地址契约。
