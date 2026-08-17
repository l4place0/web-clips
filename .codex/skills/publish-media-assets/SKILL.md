---
name: publish-media-assets
description: Publish local media referenced by Markdown notes in the web-clips vault to Alibaba Cloud OSS, verify public HTTPS delivery, atomically rewrite note references, and maintain per-note asset manifests. Use when the user asks to upload, publish, migrate, check, or verify local images, video, audio, or PDFs for web-clips; when a video-sum or clipping workflow has produced local assets that should become publicly displayable; or when diagnosing media publication drift. Do not use for generating or editing the media itself.
---

# Publish Media Assets

Use the repository CLI as the deterministic execution layer. Keep this Skill focused on intent,
sequencing, review, and failure reporting. Do not reimplement OSS operations in ad hoc shell commands.

## Locate the repository

Work from the `web-clips` root containing both `publishing/media.config.json` and
`publishing/media-cli.mjs`. Treat `clips/assets/` as a retained local working cache.

## Choose the operation

- For inspection, readiness, or diagnosis, run `check` and `status`; do not upload or edit.
- For an explicit publish, upload, or migration request, run the publish workflow below.
- For a request to verify already published media, run `media:verify`.
- For several notes or a repository-wide migration, use `--all`; it validates the complete batch
  before uploading, publishes notes independently, and preserves one atomic transaction per note.

## Inspect a note

Run:

```powershell
npm.cmd run media -- check "clips/<note>.md"
npm.cmd run media -- status "clips/<note>.md"
```

Report the RID, local reference count, unique asset count, total bytes, and any blocking diagnostic.
`check` is read-only. A `published` status requires a manifest whose URLs are present in the note.

## Publish a note

1. Run a dry run first:

   ```powershell
   npm.cmd run media -- publish "clips/<note>.md" --dry-run
   ```

2. Confirm the plan contains only intended files below `clips/assets/`. Never upload screenshots,
   credentials, private exports, or unrelated files merely because they are nearby.
3. If the user explicitly requested publishing, execute:

   ```powershell
   npm.cmd run media -- publish "clips/<note>.md"
   ```

   The CLI uses `OSS_ACCESS_KEY_ID`/`OSS_ACCESS_KEY_SECRET` when supplied; otherwise it reuses the
   authenticated `ossutil` CLI. Never print, copy, or inspect credential values.
4. Run all postconditions:

   ```powershell
   npm.cmd run media -- status "clips/<note>.md"
   npm.cmd run media:verify
   npm.cmd run publish:validate
   git diff -- "clips/<note>.md" "publishing/assets/<rid>.json"
   ```

5. Report uploaded versus reused objects, manifest path, verification count, and changed files.
   Do not commit or push unless the user also asked for it.

## Publish all pending notes

Run the repository-wide read-only preflight first:

```powershell
npm.cmd run media -- publish --all --dry-run
```

Review `notesPending`, `localReferences`, object count, and total bytes. For an explicitly requested
batch migration, run:

```powershell
npm.cmd run media -- publish --all
npm.cmd run media -- publish --all --dry-run
npm.cmd run media:verify
npm.cmd run publish:validate
```

The second dry run must report zero pending notes and zero local references. Report per-note failures;
do not retry by rewriting Markdown manually.

## Preserve safety invariants

- Keep the Bucket private. Set only declared media objects to `public-read`.
- Generate only `https://assets.l4p.site/...` Markdown URLs.
- Never delete OSS objects automatically, including apparent orphans.
- Never delete local cache files as part of publishing.
- Keep `clips/assets/` ignored and untracked after the repository-wide migration gate has passed.
- Treat uploads as immutable and content-addressed. An existing key must match SHA-256 and size.
- Rewrite Markdown and its per-note manifest only after every object passes public HTTPS validation.
- If upload or verification fails, leave Markdown and manifest unchanged and report the stable error code.
- Do not modify `video-sum`; invoke this Skill after video ingestion when publication is requested.

## Interpret common results

- `noop`: the note has no remaining local media references.
- `published`: the note was rewritten and its manifest committed locally.
- `pending`: local references still need publication.
- `drift`: a manifest URL is no longer present in the note; investigate before republishing.
- `E_MEDIA_REMOTE_CONFLICT`: stop; the immutable OSS key does not match local integrity metadata.
- `E_MEDIA_PUBLIC_VERIFY`: stop; keep local state unchanged and inspect ACL, domain, MIME, size, or
  `Content-Disposition`.
- Sandbox-only OneDrive `EPERM` during `publish:validate` is not content evidence; rerun that read-only
  validation outside the sandbox before concluding the note is invalid.
