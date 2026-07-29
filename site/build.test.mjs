import assert from "node:assert/strict"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

import { buildSite } from "./build.mjs"
import { assignId } from "../publishing/publisher.mjs"

const RID = "5d3b8f6e-19c4-4c62-9a71-2f0e8d7b6c45"
const PRIVATE_SENTINEL = "PRIVATE_SENTINEL_DO_NOT_PUBLISH_9a4f"
const SEARCH_TERM = "量子剪藏检索词"
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=",
  "base64",
)

async function write(root, relative, content) {
  const target = path.join(root, relative)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, content)
}

async function listFiles(root) {
  const result = []
  async function visit(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name)
      if (entry.isDirectory()) await visit(full)
      else result.push(full)
    }
  }
  await visit(root)
  return result
}

test("production pipeline publishes only the staged closure with stable routes", async (t) => {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), "web-clips-site-"))
  t.after(async () => fs.rm(fixture, { recursive: true, force: true }))

  const repositoryRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
  await fs.mkdir(path.join(fixture, "publishing"), { recursive: true })
  await fs.copyFile(
    path.join(repositoryRoot, "publishing", "config.json"),
    path.join(fixture, "publishing", "config.json"),
  )
  await write(fixture, "assets/图片 空格.png", PNG)
  await write(fixture, "assets/未引用.png", PRIVATE_SENTINEL)
  await write(
    fixture,
    "公开 笔记.md",
    `---
title: 中文公开笔记
publish: false
tags:
  - 中文标签
---

# 中文公开笔记

${SEARCH_TERM}

## 第一节

公开正文。

## 第二节

![示例](<assets/图片 空格.png>)
`,
  )
  await write(
    fixture,
    "私人 sentinel.md",
    `---
title: 私人内容
publish: false
---

${PRIVATE_SENTINEL}
`,
  )

  await assignId(fixture, "公开 笔记.md", { uuid: () => RID })
  const assigned = await fs.readFile(path.join(fixture, "公开 笔记.md"), "utf8")
  await fs.writeFile(path.join(fixture, "公开 笔记.md"), assigned.replace("publish: false", "publish: true"), "utf8")

  const result = await buildSite(fixture)
  assert.equal(result.published, 1)

  const output = path.join(fixture, "public")
  const page = await fs.readFile(path.join(output, "r", `${RID}.html`), "utf8")
  const raw = await fs.readFile(path.join(output, "raw", `${RID}.md`), "utf8")
  const headers = await fs.readFile(path.join(output, "_headers"), "utf8")
  const contentIndex = await fs.readFile(path.join(output, "static", "contentIndex.json"), "utf8")
  const files = await listFiles(output)
  const textFiles = files.filter((file) => /\.(?:html|json|js|md|txt)$/i.test(file))
  const publicText = (await Promise.all(textFiles.map((file) => fs.readFile(file, "utf8")))).join("\n")

  assert.equal(await fs.stat(path.join(output, "assets", RID, "图片 空格.png")).then(() => true), true)
  assert.equal(files.some((file) => file.endsWith(path.join("r", RID, "index.html"))), false)
  assert.match(page, /<title>中文公开笔记<\/title>/)
  assert.match(page, /中文公开笔记/)
  assert.match(page, /第一节/)
  assert.match(page, /第二节/)
  assert.match(page, /(?:toc|table-of-contents)/i)
  assert.match(page, new RegExp(`/assets/${RID}/%E5%9B%BE%E7%89%87%20%E7%A9%BA%E6%A0%BC\\.png`))
  assert.doesNotMatch(page, /%25E[0-9A-F]{1}/i)
  assert.doesNotMatch(page, /permalink:\s*\/r\//)
  assert.match(raw, new RegExp(`permalink: "?/r/${RID}"?`))
  assert.match(raw, new RegExp(`/assets/${RID}/%E5%9B%BE%E7%89%87%20%E7%A9%BA%E6%A0%BC\\.png`))
  assert.match(contentIndex, new RegExp(SEARCH_TERM))
  assert.match(contentIndex, /中文公开笔记/)
  assert.match(contentIndex, /中文标签/)
  assert.doesNotMatch(contentIndex, new RegExp(PRIVATE_SENTINEL))
  assert.doesNotMatch(publicText, new RegExp(PRIVATE_SENTINEL))
  assert.doesNotMatch(publicText, /私人 sentinel\.md/)
  assert.equal(files.some((file) => file.includes(".publishing-state")), false)
  assert.equal(files.some((file) => file.endsWith("未引用.png")), false)
  assert.match(headers, /\/raw\/\*\.md/)
  assert.match(headers, /Content-Type: text\/markdown; charset=utf-8/)
  assert.match(headers, /X-Content-Type-Options: nosniff/)
  assert.equal(await fs.stat(path.join(output, "static", "icon.png")).then(() => true), true)
  assert.equal(await fs.stat(path.join(output, "static", "og-image.png")).then(() => true), true)
  const tagFiles = files.filter((file) => {
    const relative = path.relative(output, file)
    return relative.startsWith(`tags${path.sep}`) && relative.endsWith(".html")
  })
  assert.ok(tagFiles.length >= 2)
  const tagText = (await Promise.all(tagFiles.map((file) => fs.readFile(file, "utf8")))).join("\n")
  assert.match(tagText, /中文标签/)
  assert.match(tagText, /中文公开笔记/)
})
