import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import {
  MediaPublishError,
  mediaStatus,
  planAllMedia,
  planMedia,
  publishAllMedia,
  publishMedia,
  verifyMediaManifests,
} from "./media.mjs"

const RID = "5d3b8f6e-19c4-4c62-9a71-2f0e8d7b6c45"
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=",
  "base64",
)

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "web-clips-media-"))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.mkdir(path.join(root, "clips", "assets"), { recursive: true })
  await fs.mkdir(path.join(root, "publishing"), { recursive: true })
  const sourceRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
  const config = JSON.parse(await fs.readFile(path.join(sourceRoot, "publishing", "media.config.json"), "utf8"))
  await fs.writeFile(path.join(root, "publishing", "media.config.json"), `${JSON.stringify(config, null, 2)}\n`)
  await fs.writeFile(path.join(root, "clips", "assets", "frame.png"), PNG)
  return root
}

function responseFor(asset, overrides = {}) {
  const headers = new Headers({
    "content-length": String(asset.size),
    "content-type": asset.mimeType,
    "content-disposition": "inline",
    ...overrides,
  })
  return { ok: true, status: 200, headers }
}

class FakeOss {
  objects = new Map()
  puts = []
  acls = []

  async head(key) {
    if (!this.objects.has(key)) throw Object.assign(new Error("missing"), { status: 404, code: "NoSuchKey" })
    return this.objects.get(key)
  }

  async put(key, file, options) {
    const stat = await fs.stat(file)
    this.puts.push({ key, file, options })
    this.objects.set(key, { size: stat.size, meta: { sha256: options.meta.sha256 } })
  }

  async putACL(key, acl) {
    this.acls.push({ key, acl })
  }
}

test("plan hashes and deduplicates Markdown, Obsidian, HTML, and cover references", async (t) => {
  const root = await fixture(t)
  const note = path.join(root, "clips", "note.md")
  await fs.writeFile(note, `---\nrid: ${RID}\ncover: assets/frame.png\n---\n![a](assets/frame.png)\n![[frame.png|b]]\n<img src="assets/frame.png">\n![remote](https://example.com/x.png)\n`)
  const plan = await planMedia(root, "clips/note.md")
  assert.equal(plan.references.length, 4)
  assert.equal(plan.assets.length, 1)
  assert.match(plan.assets[0].objectKey, /^media\/[0-9a-f]{2}\/[0-9a-f]{64}\.png$/)
  assert.equal(plan.assets[0].url, `https://assets.l4p.site/${plan.assets[0].objectKey}`)
})

test("publish uploads once, verifies public metadata, and atomically rewrites note plus manifest", async (t) => {
  const root = await fixture(t)
  const notePath = path.join(root, "clips", "note.md")
  const original = `---\nrid: ${RID}\n---\n![a](assets/frame.png)\n![again](assets/frame.png)\n`
  await fs.writeFile(notePath, original)
  const client = new FakeOss()
  let plannedAsset
  const result = await publishMedia(root, "clips/note.md", {
    client,
    now: () => "2026-08-17T00:00:00.000Z",
    fetchImpl: async () => responseFor(plannedAsset ?? (plannedAsset = (await planMedia(root, "clips/note.md")).assets[0])),
  })
  assert.equal(result.status, "published")
  assert.equal(result.uploaded, 1)
  assert.equal(client.puts.length, 1)
  assert.equal(client.acls[0].acl, "public-read")
  assert.equal(client.puts[0].options.headers["Content-Disposition"], "inline")
  assert.equal(client.puts[0].options.headers["x-oss-forbid-overwrite"], "true")
  const rewritten = await fs.readFile(notePath, "utf8")
  assert.equal((rewritten.match(/https:\/\/assets\.l4p\.site\//g) ?? []).length, 2)
  assert.equal(rewritten.includes("assets/frame.png"), false)
  const manifest = JSON.parse(await fs.readFile(path.join(root, "publishing", "assets", `${RID}.json`), "utf8"))
  assert.equal(manifest.assets.length, 1)
  assert.equal(manifest.publishedAt, "2026-08-17T00:00:00.000Z")
  const status = await mediaStatus(root, "clips/note.md")
  assert.equal(status.status, "published")
  assert.equal(status.uniqueAssets, 1)
  const second = await publishMedia(root, "clips/note.md", { dryRun: true })
  assert.equal(second.status, "noop")
})

test("existing hash object is reused only when size and sha metadata match", async (t) => {
  const root = await fixture(t)
  await fs.writeFile(path.join(root, "clips", "note.md"), `---\nrid: ${RID}\n---\n![](assets/frame.png)\n`)
  const plan = await planMedia(root, "clips/note.md")
  const asset = plan.assets[0]
  const client = new FakeOss()
  client.objects.set(asset.objectKey, { size: asset.size, meta: { sha256: asset.sha256 } })
  const result = await publishMedia(root, "clips/note.md", {
    client,
    fetchImpl: async () => responseFor(asset),
  })
  assert.equal(result.uploaded, 0)
  assert.equal(result.reused, 1)
  assert.equal(client.puts.length, 0)
  assert.equal(client.acls.length, 1)
})

test("upload or public verification failure leaves Markdown and manifest untouched", async (t) => {
  const root = await fixture(t)
  const notePath = path.join(root, "clips", "note.md")
  const original = `---\nrid: ${RID}\n---\n![](assets/frame.png)\n`
  await fs.writeFile(notePath, original)
  const client = new FakeOss()
  await assert.rejects(
    () => publishMedia(root, "clips/note.md", {
      client,
      fetchImpl: async () => ({ ok: false, status: 403, headers: new Headers() }),
    }),
    (error) => error instanceof MediaPublishError && error.code === "E_MEDIA_PUBLIC_VERIFY",
  )
  assert.equal(await fs.readFile(notePath, "utf8"), original)
  assert.equal(await fs.stat(path.join(root, "publishing", "assets")).then(() => true, () => false), false)
})

test("manifest verification reports broken public assets", async (t) => {
  const root = await fixture(t)
  await fs.mkdir(path.join(root, "publishing", "assets"), { recursive: true })
  await fs.writeFile(path.join(root, "publishing", "assets", `${RID}.json`), JSON.stringify({
    version: 1,
    rid: RID,
    assets: [{ url: "https://assets.l4p.site/media/x.png", size: 1, mimeType: "image/png" }],
  }))
  const result = await verifyMediaManifests(root, {
    fetchImpl: async () => ({ ok: false, status: 404, headers: new Headers() }),
  })
  assert.equal(result.ok, false)
  assert.equal(result.checked, 1)
  assert.equal(result.failures[0].code, "E_MEDIA_PUBLIC_VERIFY")
})

test("batch planning validates all notes before publishing pending notes", async (t) => {
  const root = await fixture(t)
  await fs.writeFile(path.join(root, "clips", "one.md"), `---\nrid: ${RID}\n---\n![](assets/frame.png)\n`)
  await fs.writeFile(
    path.join(root, "clips", "two.md"),
    "---\nrid: 6f6903e3-2b0e-4b66-9d5a-12f0e6b9d62b\n---\nNo media.\n",
  )
  const batch = await planAllMedia(root)
  assert.equal(batch.notesScanned, 2)
  assert.equal(batch.notesPending, 1)
  const dryRun = await publishAllMedia(root, { dryRun: true })
  assert.equal(dryRun.notesPending, 1)
  assert.equal(dryRun.notes[0].note, "clips/one.md")
})
