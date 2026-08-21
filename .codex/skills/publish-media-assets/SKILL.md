---
name: publish-media-assets
description: Publish local media referenced by Markdown notes in the web-clips vault to Alibaba Cloud OSS, verify public HTTPS delivery, atomically rewrite note references, and maintain ignored local manifests. Use when the user asks to upload, publish, migrate, check, or verify local media for web-clips.
---

# Publish Media Assets

This is a repository-local Skill for the `web-clips` Vault. Use its bundled CLI as the deterministic execution layer. The media runtime is isolated inside this Skill and is never part of Git commit/push hooks, so ordinary document synchronization does not depend on Node, npm, OSS, or this Skill being available.

## Locate the Vault and CLI

Run commands from the `web-clips` Vault root. Resolve the repository-local CLI:

```powershell
$mediaCli = ".codex/skills/publish-media-assets/scripts/media-cli.mjs"
node $mediaCli check "clips/<note>.md"
```

The CLI treats the current directory as the Vault root unless `WEB_CLIPS_VAULT_ROOT` is set. Its package dependency is scoped to this Skill directory; `node_modules/` remains ignored. `clips/assets/` is the retained ignored media cache; `.media-publish/manifests/` is the ignored local manifest cache.

## Inspect and publish

```powershell
node $mediaCli check "clips/<note>.md"
node $mediaCli status "clips/<note>.md"
node $mediaCli publish "clips/<note>.md" --dry-run
node $mediaCli publish "clips/<note>.md"
node $mediaCli verify
```

For a repository-wide operation, use `check --all`, `publish --all --dry-run`, or `publish --all`. Always dry-run first. Review only files below `clips/assets/`, never print credentials, never delete local cache files or OSS objects, and never commit/push unless explicitly requested.

The CLI prefers `OSS_ACCESS_KEY_ID` and `OSS_ACCESS_KEY_SECRET`; otherwise it reuses authenticated `ossutil`. After publishing, verify status, run `verify`, and inspect `git diff -- "clips/<note>.md"`. Content metadata and full publication validation run remotely through GitHub Actions / `web-clips-publish`.

## Safety invariants

- Keep the Bucket private and set only declared immutable objects to `public-read`.
- Generate only `https://assets.l4p.site/...` URLs.
- Rewrite Markdown only after every object passes public HTTPS verification.
- Existing object keys must match SHA-256 and size.
- Upload or verification failure must leave Markdown and manifests unchanged.
- Treat `.media-publish/` as local cache, never as content Git history.
