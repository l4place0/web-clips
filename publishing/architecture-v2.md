# Web Clips 双仓库发布架构（v3）

本文描述 `web-clips` 内容仓库、`web-clips-publish` 展示仓库和阿里云 OSS 的当前边界。
Markdown 交付细则见 `publishing/contract.md`。

## 1. `l4place0/web-clips`：内容与创作

- 版本化保存 `clips/**/*.md` 及其稳定元数据。
- 通过轻量 Action 幂等维护 `rid`、`permalink`、`webClipUrl`。
- 在 Action 中检查真实图片嵌入是否仍指向本地 `clips/assets/`。
- `clips/assets/` 与 `.media-publish/` 仅保留为忽略的本地工作缓存。
- 仓库内 `publish-media-assets` Skill 属于创作侧媒体上传工具，不参与站点构建或 Git hooks。
- 不包含 Quartz、Pages 部署器、站点 registry/manifest 或发布运行时。

## 2. `l4place0/web-clips-publish`：校验、构建与展示

- 固定 checkout 内容仓库的一个完整 commit SHA。
- 对该 SHA 执行完整内容契约、安全和跨版本身份校验。
- 维护发布 registry、retired/tombstone 状态、暂存 manifest 与部署记录。
- 生成隔离的 Quartz 内容树和 raw Markdown 副本。
- 独立安装 Quartz、构建静态站并部署 GitHub Pages。
- 只有构建和部署成功后才登记内容 SHA；失败时保留上一次成功站点。

## 3. 阿里云 OSS：不可变媒体

- 公网基地址固定为 `https://assets.l4p.site/`。
- object key 由内容 SHA-256 决定：
  `media/<hash前2位>/<完整hash>.<规范扩展名>`。
- Bucket 保持 private，只把已验证的目标 object 设置为 `public-read`。
- 上传顺序为扫描、校验、哈希、HEAD/上传、ACL、公网验证、原子改写 Markdown。
- 展示仓库只消费 Markdown 中的 HTTPS URL，不读取本地 `clips/assets/`。

## 4. 发布链路

```text
本地创作
  -> 上传并验证 OSS 媒体
  -> Markdown 改写为 HTTPS URL
  -> 内容仓库 Action 维护元数据并做轻量就绪检查
  -> 展示仓库选择固定内容 SHA
  -> 完整校验与隔离暂存
  -> Quartz 构建
  -> GitHub Pages 部署
```

Obsidian Git 的频繁 push 不需要在内容仓库中执行站点构建。展示仓库自行调度、去重并记录已经
成功部署的内容 SHA。

## 5. 故障边界

- 媒体上传或公网验证失败：不得改写 Markdown。
- 内容就绪检查失败：报告文件与行号，不运行任何站点发布逻辑。
- 展示构建失败：不得把失败 SHA 标记为已发布。
- Pages 部署失败：保持上一次成功部署。
- 任一仓库都不得把 `clips/assets/`、`.media-publish/` 或整个私有工作树直接暴露为站点内容。
