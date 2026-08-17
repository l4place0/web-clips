# Web Clips 双仓库发布架构（v2）

本文是 `web-clips` 内容仓库、`web-clips-publish` 展示仓库和阿里云 OSS 之间的边界契约。
身份与 Markdown 校验仍以 `publishing/contract.md` 为准；若旧文档中出现 Cloudflare Pages、
同仓库站点构建或复制媒体到站点输出等描述，以本文为迁移后的目标状态。

## 1. 仓库职责

### `l4place0/web-clips`

- 公开保存 `clips/**/*.md`、RID 注册表和轻量发布元数据。
- `clips/assets/` 是本地工作缓存；媒体迁移完成后不再由 Git 跟踪。
- 提供确定性的内容校验与导出接口，但不包含 Quartz、页面主题或 Pages 部署逻辑。
- 提供 `publish-media-assets` CLI/Skill，将本地媒体上传到 OSS 后原子改写 Markdown。

### `l4place0/web-clips-publish`

- 固定 checkout 内容仓库的一个完整 commit SHA，不跟随构建过程中的浮动分支。
- 调用该 SHA 自带的内容导出器，消费 `.publish-stage` 和 manifest。
- 独立安装 Quartz、构建静态站，并部署到 GitHub Pages。
- 站点失败时不改变上一次成功部署。

## 2. 内容到展示站

- Obsidian Git 的频繁 push 不直接触发展示站构建。
- 展示仓库每 30 分钟轮询内容仓库 `main`，也支持 `workflow_dispatch`。
- workflow 先解析远端 SHA；已经成功部署过相同 SHA 时直接结束。
- 构建和部署成功后才登记该 SHA。任何失败都不得把失败 SHA 标记为已发布。
- 初始站点基地址为 `https://l4place0.github.io/web-clips-publish`。

## 3. 媒体发布

- 公网媒体基地址固定为 `https://assets.l4p.site/`，Markdown 不生成 HTTP URL。
- OSS Bucket 为 `l4p-web-clips-hk`，region/endpoint 为 `oss-cn-hongkong`。
- Bucket ACL 保持 private；发布器只把已验证的目标 object 设置为 `public-read`。
- object key 由内容 SHA-256 决定：`media/<hash前2位>/<完整hash>.<规范扩展名>`。
- 同一字节内容只对应一个 object；文件名、笔记标题和本地路径不参与公网身份。
- 上传顺序为：扫描 → 校验 → 哈希 → HEAD/上传 → ACL → 公网 HEAD → 原子改写
  Markdown 与 per-note manifest。
- 上传成功但本地提交失败时允许留下不可变孤儿 object；不得自动删除远端 object。
- dry-run、check、status 都必须是只读操作。

## 4. 媒体 manifest

每篇带 RID 的笔记使用 `publishing/assets/<rid>.json`，该文件纳入 Git。每项至少记录：

- 原仓库相对路径；
- SHA-256、字节数和 MIME；
- OSS object key 与 HTTPS URL；
- 最近一次成功发布时间。

manifest 是审计和幂等状态，不是资源身份源。Markdown 中的 HTTPS URL 是展示构建唯一需要的
媒体引用；展示仓库不读取本地 `clips/assets/`。

## 5. 切换门槛

只有同时满足以下条件才停止 Git 跟踪 `clips/assets/`：

1. 全库扫描没有未发布的本地媒体引用；
2. 所有 manifest 与 Markdown URL 一致；
3. 所有 OSS URL 通过 HTTPS HEAD/GET 校验；
4. GitHub Pages 使用固定内容 SHA 构建成功；
5. 本地 `clips/assets/` 文件仍保留，且已加入 `.gitignore`。

旧 `site/` 只在新仓库完成并行验收后删除。
