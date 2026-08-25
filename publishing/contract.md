# Web Clips 内容交付契约（v3）

本仓库是 `web-clips` **内容仓库**。它向展示仓库 `web-clips-publish` 交付 Markdown 与稳定元数据，
但不负责生成 Quartz 暂存树、构建站点或部署 GitHub Pages。双仓库职责见
`publishing/architecture-v2.md`。

本文件是内容交付的人类可读契约，不对应本仓库中的机器配置文件。完整内容校验、发布状态、
暂存 manifest 和部署记录均由展示仓库维护。

## 1. 内容边界

- 公开内容根为 `clips/`，交付对象为其中的 `**/*.md`。
- `clips/assets/` 仅是被 `.gitignore` 排除的本地创作缓存，不属于内容交付物。
- `.media-publish/` 是本地媒体发布状态缓存，不加入 Git，也不供展示仓库消费。
- 内容仓库不包含 Quartz、Pages 构建逻辑或站点发布器。
- 展示仓库必须固定读取内容仓库的完整 commit SHA，不得在一次构建中跟随浮动分支。

## 2. 稳定资源元数据

每篇公开 Markdown 必须在 YAML frontmatter 中提供以下字段：

```yaml
---
rid: 5d3b8f6e-19c4-4c62-9a71-2f0e8d7b6c45
permalink: /r/5d3b8f6e-19c4-4c62-9a71-2f0e8d7b6c45
webClipUrl: https://l4place0.github.io/web-clips-publish/r/5d3b8f6e-19c4-4c62-9a71-2f0e8d7b6c45
---
```

### `rid`

- 是与文件名、目录、标题和来源 URL 解耦的稳定资源身份。
- 必须是 canonical lowercase UUIDv4：
  `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`。
- 在当前内容快照中必须唯一；文件改名或移动时不得改变。

### `permalink`

- 必须精确等于 `/r/<rid>`。
- 是从 `rid` 派生的校验字段，不是第二身份源。

### `webClipUrl`

- 必须精确等于
  `https://l4place0.github.io/web-clips-publish/r/<rid>`。
- 供 Obsidian 属性面板直接打开公开页面；它同样是派生字段。

内容 Action 可幂等补齐或规范化这些字段。展示仓库仍须对收到的 commit 做完整、只读校验，
不能假设上游 Action 一定成功。

## 3. 媒体就绪条件

提交给展示仓库的 Markdown 不得再引用本地媒体缓存。发布视频笔记时，先用仓库内的
`publish-media-assets` Skill 将媒体上传至 OSS，并在远端验证成功后把笔记引用原子改写为：

```text
https://assets.l4p.site/media/<sha256-prefix>/<sha256>.<ext>
```

内容就绪检查只检查**真实图片嵌入**：

- Markdown 图片：`![alt](assets/example.png)`
- Obsidian 图片嵌入：`![[assets/example.png]]`
- HTML 图片元素：`<img src="assets/example.png">`

普通 Markdown 链接、HTML 超链接、JSON 数据链接和代码示例不属于图片嵌入，不应因路径中出现
`assets/` 而被误报。远程 `https://` 图片不由此轻量检查阻断；其可用性和安全策略由展示仓库
完整校验。

## 4. 内容 Action 的有限职责

本仓库的 Action 只做两件事：

1. 幂等维护 `rid`、`permalink`、`webClipUrl`；
2. 扫描 Markdown 中仍指向 `clips/assets/` 的真实本地图片嵌入，发现时失败并列出文件与行号。

该检查是快速门禁，不是站点发布器，也不生成发布 registry、manifest 或 Quartz 暂存树。

## 5. 展示仓库职责

`web-clips-publish` 负责：

- 对固定内容 commit 执行完整 frontmatter、身份、链接和安全校验；
- 维护跨版本资源状态、retired/tombstone 与发布 manifest；
- 生成隔离的 Quartz 内容暂存树及 raw Markdown 副本；
- 构建 Quartz，部署 GitHub Pages，并仅在成功后记录已发布 commit；
- 失败时保留上一次成功站点。

内容仓库不恢复根级发布 `package.json`、站点 Node 依赖、Quartz 配置或 Pages 工作流。

## 6. 路由契约

| 资源 | Canonical URL | 生成方 |
| --- | --- | --- |
| 页面 | `/r/<rid>` | 展示仓库 |
| 原始 Markdown | `/raw/<rid>.md` | 展示仓库 |
| 公网媒体 | `https://assets.l4p.site/media/...` | OSS 媒体发布流程 |

页面 canonical URL 不带尾斜杠。raw 是展示仓库从固定内容 commit 生成的规范化副本，不是整个
内容仓库的直接暴露。

## 7. 发布前最小判定

内容 commit 满足下列条件即可交给展示仓库：

1. `clips/**/*.md` 可读取且 frontmatter 可解析；
2. 每篇公开笔记具有一致的 `rid`、`permalink`、`webClipUrl`；
3. 没有指向 `clips/assets/` 的真实本地图片嵌入；
4. 媒体引用已经是公开 HTTPS URL。

展示仓库对上述条件做最终判定，并独立完成后续构建与部署。
