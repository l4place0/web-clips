import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { annotatePublicUrls, assignId, build, clean, prepareAll, PublishError, validate } from "./publisher.mjs"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const SOURCE_CONFIG = path.join(HERE, "config.json")
const RID_A = "11111111-1111-4111-8111-111111111111"
const RID_B = "22222222-2222-4222-8222-222222222222"
const RID_C = "33333333-3333-4333-8333-333333333333"
const RID_D = "44444444-4444-4444-8444-444444444444"
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "web-clips-publisher-"))
  await fs.mkdir(path.join(root, "publishing"), { recursive: true })
  await fs.mkdir(path.join(root, "assets"), { recursive: true })
  const config = JSON.parse(await fs.readFile(SOURCE_CONFIG, "utf8"))
  config.source.root = "."
  config.source.publishAll = false
  config.attachments.allowedLocalRoots = ["assets"]
  await fs.writeFile(path.join(root, "publishing", "config.json"), `${JSON.stringify(config, null, 2)}\n`)
  t.after(async () => fs.rm(root, { recursive: true, force: true }))
  return root
}

async function write(root, relative, content) {
  const target = path.join(root, relative)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, content)
  return target
}

async function read(root, relative) {
  return fs.readFile(path.join(root, relative), "utf8")
}

function publishText(text, value = true) {
  const lineEnding = text.includes("\r\n") ? "\r\n" : "\n"
  const marker = `${lineEnding}---${lineEnding}`
  return text.replace(marker, `${lineEnding}publish: ${value}${lineEnding}---${lineEnding}`)
}

async function exists(file) {
  try {
    await fs.access(file)
    return true
  } catch {
    return false
  }
}

async function snapshotTree(root) {
  const items = []
  async function walk(directory, relative = "") {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    entries.sort((a, b) => a.name.localeCompare(b.name, "en"))
    for (const entry of entries) {
      const rel = relative ? path.join(relative, entry.name) : entry.name
      if (entry.isDirectory()) await walk(path.join(directory, entry.name), rel)
      else {
        const buffer = await fs.readFile(path.join(directory, entry.name))
        items.push([rel, buffer.toString("base64")])
      }
    }
  }
  await walk(root)
  return items
}

test("assign-id is explicit, format-preserving, private, and idempotent", async (t) => {
  const root = await fixture(t)
  const original = "\uFEFF---\r\ntitle: 私有笔记 # keep\r\ntags: [x]\r\n---\r\n正文\r\n"
  await write(root, "私有 笔记.md", original)

  const first = await assignId(root, "私有 笔记.md", {
    uuid: () => RID_A,
    now: () => "2026-01-01T00:00:00.000Z",
  })
  assert.equal(first.rid, RID_A)
  assert.equal(first.publishChanged, false)
  const once = await read(root, "私有 笔记.md")
  assert.match(once, /^\uFEFF---\r\n/)
  assert.match(once, /title: 私有笔记 # keep\r\n/)
  assert.match(once, new RegExp(`rid: "${RID_A}"\\r\\n`))
  assert.match(once, new RegExp(`permalink: "/r/${RID_A}"\\r\\n`))
  assert.doesNotMatch(once, /publish:/)
  assert.ok(once.endsWith("正文\r\n"))

  const registryOnce = await read(root, "publishing/registry.json")
  const second = await assignId(root, "私有 笔记.md", {
    uuid: () => RID_B,
    now: () => "2026-02-01T00:00:00.000Z",
  })
  assert.equal(second.rid, RID_A)
  assert.equal(second.changed, false)
  assert.equal(await read(root, "私有 笔记.md"), once)
  assert.equal(await read(root, "publishing/registry.json"), registryOnce)

  const validation = await validate(root)
  assert.equal(validation.ok, true)
  assert.equal(validation.publishedCount, 0)
})

test("validate is default-private and rejects non-boolean publish", async (t) => {
  const root = await fixture(t)
  await write(root, "private.md", "# private\n")
  let result = await validate(root)
  assert.equal(result.ok, true)
  assert.equal(result.publishedCount, 0)

  await write(root, "bad.md", "---\npublish: \"true\"\n---\n# bad\n")
  result = await validate(root)
  assert.equal(result.exitCode, 3)
  assert.ok(result.diagnostics.some((item) => item.code === "E_PUBLISH_TYPE"))
})

test("publishAll makes every source note public and prepare assigns missing identities", async (t) => {
  const root = await fixture(t)
  const configPath = path.join(root, "publishing", "config.json")
  const config = JSON.parse(await fs.readFile(configPath, "utf8"))
  config.source.publishAll = true
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
  await write(root, "open.md", "# Open by default\n")

  const prepared = await prepareAll(root)
  assert.equal(prepared.preparedCount, 1)
  assert.match(await read(root, "open.md"), /rid: "[0-9a-f-]{36}"/)

  const result = await validate(root)
  assert.equal(result.ok, true)
  assert.equal(result.publishedCount, 1)
})

test("annotate-urls adds, corrects, and preserves the derived public URL idempotently", async (t) => {
  const root = await fixture(t)
  const configPath = path.join(root, "publishing", "config.json")
  const config = JSON.parse(await fs.readFile(configPath, "utf8"))
  config.source.publishAll = true
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
  await write(root, "公开地址.md", "\uFEFF---\r\ntitle: 公开地址 # keep\r\ntags: [x]\r\n---\r\n正文\r\n")
  await assignId(root, "公开地址.md", { uuid: () => RID_A })

  const first = await annotatePublicUrls(root)
  assert.equal(first.annotatedCount, 1)
  assert.equal(first.annotated[0].action, "added")
  const expected = `https://l4place0.github.io/web-clips-publish/r/${RID_A}`
  const once = await read(root, "公开地址.md")
  assert.match(once, /^\uFEFF---\r\n/)
  assert.match(once, /title: 公开地址 # keep\r\n/)
  assert.match(once, new RegExp(`webClipUrl: "${expected}"\\r\\n`))
  assert.ok(once.endsWith("正文\r\n"))

  await write(root, "公开地址.md", once.replace(expected, "https://example.invalid/old"))
  const corrected = await annotatePublicUrls(root)
  assert.equal(corrected.annotatedCount, 1)
  assert.equal(corrected.annotated[0].action, "corrected")
  const correctedText = await read(root, "公开地址.md")
  assert.match(correctedText, new RegExp(`webClipUrl: "${expected}"\\r\\n`))

  const second = await annotatePublicUrls(root)
  assert.equal(second.annotatedCount, 0)
  assert.equal(await read(root, "公开地址.md"), correctedText)
})

test("display titles prefer frontmatter, then H1, then source basename and never fall back to RID", async (t) => {
  const root = await fixture(t)
  const notes = [
    ["frontmatter.md", "---\ntitle: Frontmatter title\n---\n# Ignored H1\n", RID_A, "Frontmatter title"],
    ["heading.md", "# 正文一级标题\n", RID_B, "正文一级标题"],
    ["中文文件名.md", "正文没有标题。\n", RID_C, "中文文件名"],
    ["空标题.md", "---\ntitle: \"\"\n---\n正文没有标题。\n", RID_D, "空标题"],
  ]
  for (const [relative, content, rid] of notes) {
    await write(root, relative, content)
    await assignId(root, relative, { uuid: () => rid })
    await write(root, relative, publishText(await read(root, relative)))
  }

  const result = await build(root)
  const titles = new Map(result.manifest.resources.map((resource) => [resource.rid, resource.title]))
  for (const [, , rid, expected] of notes) assert.equal(titles.get(rid), expected)
  for (const [, , rid] of notes) {
    const staged = await read(root, `.publish-stage/quartz/content/r/${rid}.md`)
    assert.match(staged, /title:/)
    assert.doesNotMatch(staged, new RegExp(`title: "?${rid}"?`))
  }
})

test("configured source root is enforced and missing roots fail closed", async (t) => {
  const root = await fixture(t)
  const configPath = path.join(root, "publishing", "config.json")
  const config = JSON.parse(await fs.readFile(configPath, "utf8"))
  config.source.root = "clips"
  config.attachments.allowedLocalRoots = ["clips/assets"]
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`)
  await fs.mkdir(path.join(root, "clips", "assets"), { recursive: true })
  await write(root, "root-note.md", "# Must stay outside the content root\n")
  await write(root, "clips/note.md", "# Published from clips\n")

  await assert.rejects(
    assignId(root, "root-note.md"),
    (error) =>
      error instanceof PublishError &&
      error.diagnostics.some((item) => item.detail === "excluded-note-path"),
  )
  await assignId(root, "clips/note.md", { uuid: () => RID_A })
  const assigned = await read(root, "clips/note.md")
  await write(root, "clips/note.md", publishText(assigned))

  const result = await validate(root)
  assert.equal(result.notesScanned, 1)
  assert.equal(result.publishedCount, 1)

  await fs.rm(path.join(root, "clips"), { recursive: true, force: true })
  await assert.rejects(
    validate(root),
    (error) =>
      error instanceof PublishError &&
      error.diagnostics.some((item) => item.detail === "missing-source-root"),
  )
})

test("build copies only the referenced image closure and rewrites all supported forms", async (t) => {
  const root = await fixture(t)
  await write(root, "assets/图片 空格.png", PNG)
  await write(root, "assets/unreferenced.json", "{}")
  await write(
    root,
    "公开.md",
    [
      "---",
      "title: 公开",
      "cover: assets/图片%20空格.png",
      "---",
      "![图](<assets/图片 空格.png>)",
      "![[assets/图片 空格.png|300x200]]",
      '<img src="assets/%E5%9B%BE%E7%89%87%20%E7%A9%BA%E6%A0%BC.png">',
      "[查看原图](assets/图片%20空格.png)",
      "",
    ].join("\n"),
  )
  await assignId(root, "公开.md", { uuid: () => RID_A, now: () => "2026-01-01T00:00:00.000Z" })
  await write(root, "公开.md", publishText(await read(root, "公开.md")))

  const beforeDryRun = await snapshotTree(root)
  const dryRun = await build(root, { dryRun: true })
  assert.equal(dryRun.ok, true)
  assert.equal(dryRun.plan.published.length, 1)
  assert.equal(dryRun.plan.published[0].assets.length, 1)
  assert.deepEqual(await snapshotTree(root), beforeDryRun)
  assert.equal(await exists(path.join(root, ".publish-stage")), false)

  const result = await build(root, { now: () => "2026-01-02T00:00:00.000Z" })
  assert.equal(result.ok, true)
  const pagePath = `.publish-stage/quartz/content/r/${RID_A}.md`
  const rawPath = `.publish-stage/raw/${RID_A}.md`
  const assetPath = `.publish-stage/quartz/content/assets/${RID_A}/图片 空格.png`
  const page = await read(root, pagePath)
  const raw = await read(root, rawPath)
  assert.doesNotMatch(page, /^permalink:/m)
  assert.match(raw, new RegExp(`^permalink: "?/r/${RID_A}"?$`, "m"))
  assert.match(page, new RegExp(`/assets/${RID_A}/%E5%9B%BE%E7%89%87%20%E7%A9%BA%E6%A0%BC.png`))
  assert.equal(await exists(path.join(root, assetPath)), true)
  assert.equal(await exists(path.join(root, ".publish-stage/quartz/content/assets/unreferenced.json")), false)
})

test("remote Markdown links remain external and are not treated as private notes", async (t) => {
  const root = await fixture(t)
  const external = "https://github.com/example/project/blob/main/README.md"
  await write(root, "公开.md", `---\ntitle: 公开\n---\n[上游文档](${external})\n`)
  await assignId(root, "公开.md", { uuid: () => RID_A, now: () => "2026-01-01T00:00:00.000Z" })
  await write(root, "公开.md", publishText(await read(root, "公开.md")))

  const result = await build(root, { now: () => "2026-01-02T00:00:00.000Z" })
  assert.equal(result.ok, true)
  assert.equal(result.diagnostics.some((item) => item.code === "W_PRIVATE_LINK"), false)
  const page = await read(root, `.publish-stage/quartz/content/r/${RID_A}.md`)
  const raw = await read(root, `.publish-stage/raw/${RID_A}.md`)
  assert.match(page, new RegExp(external.replaceAll(".", "\\.")))
  assert.match(raw, new RegExp(external.replaceAll(".", "\\.")))
})

test("rename keeps routes stable and updates only lastKnownSourcePath", async (t) => {
  const root = await fixture(t)
  await write(root, "note.md", "---\ntitle: move\n---\nbody\n")
  await assignId(root, "note.md", { uuid: () => RID_A, now: () => "2026-01-01T00:00:00.000Z" })
  await write(root, "note.md", publishText(await read(root, "note.md")))
  await build(root, { now: () => "2026-01-02T00:00:00.000Z" })

  await fs.mkdir(path.join(root, "移动 后"), { recursive: true })
  await fs.rename(path.join(root, "note.md"), path.join(root, "移动 后", "新名字.md"))
  const result = await build(root, { now: () => "2026-01-03T00:00:00.000Z" })
  assert.equal(result.ok, true)
  assert.equal(result.manifest.resources[0].page, `/r/${RID_A}`)
  assert.equal(result.manifest.resources[0].raw, `/raw/${RID_A}.md`)
  const registry = JSON.parse(await read(root, "publishing/registry.json"))
  assert.equal(registry.resources[RID_A].firstAssignedPath, "note.md")
  assert.equal(registry.resources[RID_A].lastKnownSourcePath, "移动 后/新名字.md")
  assert.ok(registry.events.some((event) => event.type === "moved" && event.rid === RID_A))
})

test("duplicate rid, permalink drift, missing attachment, and escape fail closed", async (t) => {
  await t.test("duplicate rid includes private notes", async (t) => {
    const root = await fixture(t)
    await write(root, "a.md", "# a\n")
    await assignId(root, "a.md", { uuid: () => RID_A })
    await fs.copyFile(path.join(root, "a.md"), path.join(root, "b.md"))
    const result = await validate(root)
    assert.equal(result.exitCode, 3)
    assert.ok(result.diagnostics.some((item) => item.code === "E_RID_DUPLICATE"))
  })

  await t.test("published permalink drift is rejected", async (t) => {
    const root = await fixture(t)
    await write(root, "a.md", "# a\n")
    await assignId(root, "a.md", { uuid: () => RID_A })
    let text = publishText(await read(root, "a.md"))
    text = text.replace(`/r/${RID_A}`, "/r/not-the-rid")
    await write(root, "a.md", text)
    const result = await validate(root)
    assert.ok(result.diagnostics.some((item) => item.code === "E_PERMALINK_MISMATCH"))
  })

  await t.test("missing and escaping attachments are rejected without stage writes", async (t) => {
    const root = await fixture(t)
    await write(root, "missing.md", "---\ntitle: x\n---\n![x](assets/missing.png)\n")
    await assignId(root, "missing.md", { uuid: () => RID_A })
    await write(root, "missing.md", publishText(await read(root, "missing.md")))
    let result = await build(root, { dryRun: true })
    assert.ok(result.diagnostics.some((item) => item.code === "E_ATTACHMENT_MISSING"))
    assert.equal(await exists(path.join(root, ".publish-stage")), false)

    await write(root, "missing.md", (await read(root, "missing.md")).replace("assets/missing.png", "../secret.png"))
    result = await validate(root)
    assert.ok(result.diagnostics.some((item) => item.code === "E_ATTACHMENT_ESCAPE"))
  })
})

test("clean is exact and boundary protected", async (t) => {
  const root = await fixture(t)
  await write(root, "source.md", "# keep\n")
  await write(root, ".publish-stage/nested/output.txt", "remove")
  const result = await clean(root)
  assert.deepEqual(result.removed, [".publish-stage"])
  assert.equal(await exists(path.join(root, ".publish-stage")), false)
  assert.equal(await read(root, "source.md"), "# keep\n")
  assert.deepEqual((await clean(root)).removed, [])

  const configPath = path.join(root, "publishing", "config.json")
  const config = JSON.parse(await fs.readFile(configPath, "utf8"))
  config.staging.root = "."
  await fs.writeFile(configPath, JSON.stringify(config))
  await assert.rejects(() => clean(root), (error) => error instanceof PublishError && error.exitCode === 2)
  assert.equal(await read(root, "source.md"), "# keep\n")
})

test("private embeds and disabled PDF fail closed", async (t) => {
  const root = await fixture(t)
  await write(
    root,
    "blocked.md",
    "---\npdf:\n  path: assets/document.pdf\n---\n![[secret-note#heading]]\n",
  )
  await assignId(root, "blocked.md", { uuid: () => RID_A })
  await write(root, "blocked.md", publishText(await read(root, "blocked.md")))
  const result = await validate(root)
  assert.equal(result.exitCode, 3)
  assert.ok(result.diagnostics.some((item) => item.code === "E_PRIVATE_EMBED"))
  assert.ok(result.diagnostics.some((item) => item.code === "E_FEATURE_DISABLED"))
  assert.equal(await exists(path.join(root, ".publish-stage")), false)
})

test("an interrupted prepared build transaction is rolled back before rebuilding", async (t) => {
  const root = await fixture(t)
  await write(root, "live.md", "# live\n")
  await assignId(root, "live.md", { uuid: () => RID_A, now: () => "2026-01-01T00:00:00.000Z" })
  await write(root, "live.md", publishText(await read(root, "live.md")))
  await build(root, { now: () => "2026-01-02T00:00:00.000Z" })

  const stage = path.join(root, ".publish-stage")
  const registry = path.join(root, "publishing", "registry.json")
  const manifest = path.join(root, "publishing", "manifest.json")
  await fs.rename(stage, `${stage}.backup-${RID_B}`)
  await fs.rename(registry, `${registry}.backup-${RID_B}`)
  await fs.rename(manifest, `${manifest}.backup-${RID_B}`)
  await write(root, ".publish-stage/partial.txt", "partial")
  await write(root, "publishing/registry.json", "{}")
  await write(
    root,
    "publishing/.publish-transaction.json",
    `${JSON.stringify({
      version: 1,
      id: RID_B,
      phase: "prepared",
      hadStage: true,
      hadRegistry: true,
      hadManifest: true,
    })}\n`,
  )

  const result = await build(root, { now: () => "2026-01-03T00:00:00.000Z" })
  assert.equal(result.ok, true)
  assert.equal(await exists(path.join(root, ".publish-stage", "partial.txt")), false)
  assert.equal(await exists(path.join(root, "publishing", ".publish-transaction.json")), false)
  assert.equal(await exists(`${stage}.backup-${RID_B}`), false)
  assert.equal(await exists(`${registry}.backup-${RID_B}`), false)
  assert.equal(await exists(`${manifest}.backup-${RID_B}`), false)
  assert.equal(
    await exists(path.join(root, `.publish-stage/quartz/content/r/${RID_A}.md`)),
    true,
  )
})

test("unpublish retires only ever-published ids and retired ids cannot return", async (t) => {
  const root = await fixture(t)
  await write(root, "reserved.md", "# reserved\n")
  await assignId(root, "reserved.md", { uuid: () => RID_B, now: () => "2026-01-01T00:00:00.000Z" })
  await write(root, "live.md", "# live\n")
  await assignId(root, "live.md", { uuid: () => RID_A, now: () => "2026-01-01T00:00:00.000Z" })
  await write(root, "live.md", publishText(await read(root, "live.md")))
  await build(root, { now: () => "2026-01-02T00:00:00.000Z" })

  await write(root, "live.md", (await read(root, "live.md")).replace("publish: true", "publish: false"))
  const second = await build(root, { now: () => "2026-01-03T00:00:00.000Z" })
  assert.equal(second.ok, true)
  assert.equal(second.manifest.resources.length, 0)
  const registry = JSON.parse(await read(root, "publishing/registry.json"))
  assert.equal(registry.resources[RID_A].status, "retired")
  assert.equal(registry.resources[RID_B].status, "active")
  assert.equal(registry.resources[RID_B].everPublished, false)

  await write(root, "live.md", (await read(root, "live.md")).replace("publish: false", "publish: true"))
  const validation = await validate(root)
  assert.equal(validation.exitCode, 3)
  assert.ok(validation.diagnostics.some((item) => item.code === "E_RID_REUSED"))
})
