#!/usr/bin/env node

import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPOSITORY_ROOT = path.dirname(HERE)
const BASE_URL = new URL(process.argv[2] ?? "https://l4p-web-clips.pages.dev")
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bLTAI[A-Za-z0-9]{12,}\b/,
  /\bgh[oprsu]_[A-Za-z0-9_]{20,}\b/,
  /\b(?:AccessKeySecret|CF_API_TOKEN|CLOUDFLARE_API_TOKEN)\b/i,
]

async function fetchText(route) {
  const response = await fetch(new URL(route, BASE_URL), {
    redirect: "follow",
    headers: { "user-agent": "web-clips-mvp-acceptance/1" },
  })
  return { response, text: await response.text() }
}

async function privateNameCandidates() {
  const names = new Set()
  const excludedRoots = new Set([
    ".codex",
    ".git",
    ".obsidian",
    ".publish-stage",
    ".video-sum-cache",
    ".video-sum-temp",
    ".video-sum-work",
    "node_modules",
    "publishing",
    "public",
    "site",
  ])

  async function visit(directory, relative = "") {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      const childRelative = relative ? path.join(relative, entry.name) : entry.name
      const child = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        if (!relative && excludedRoots.has(entry.name)) continue
        await visit(child, childRelative)
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        names.add(path.basename(entry.name, ".md"))
      }
    }
  }

  async function visitAssets(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const child = path.join(directory, entry.name)
      if (entry.isDirectory()) await visitAssets(child)
      else if (entry.isFile()) names.add(entry.name)
    }
  }

  await visit(REPOSITORY_ROOT)
  const assets = path.join(REPOSITORY_ROOT, "assets")
  try {
    await visitAssets(assets)
  } catch (error) {
    if (error?.code !== "ENOENT") throw error
  }
  return [...names].filter((name) => name.length >= 8).sort((a, b) => a.localeCompare(b, "zh-CN"))
}

async function main() {
  assert.equal(BASE_URL.protocol, "https:", "Live acceptance requires HTTPS")

  const home = await fetchText("/")
  const tags = await fetchText("/tags/")
  const index = await fetchText("/static/contentIndex.json")
  assert.equal(home.response.status, 200, "Homepage must return 200")
  assert.equal(tags.response.status, 200, "Tags page must return 200")
  assert.equal(index.response.status, 200, "Search index must return 200")
  JSON.parse(index.text)

  assert.equal(home.response.headers.get("x-content-type-options"), "nosniff")
  assert.equal(home.response.headers.get("x-frame-options"), "SAMEORIGIN")
  assert.equal(home.response.headers.get("referrer-policy"), "strict-origin-when-cross-origin")

  const missingRid = randomUUID()
  const missingPage = await fetchText(`/r/${missingRid}`)
  const missingRaw = await fetchText(`/raw/${missingRid}.md`)
  assert.equal(missingPage.response.status, 404, "Unknown stable page must return 404")
  assert.equal(missingRaw.response.status, 404, "Unknown raw Markdown must return 404")

  const publicText = [home.text, tags.text, index.text, missingPage.text, missingRaw.text].join("\n")
  const candidates = await privateNameCandidates()
  const leakedNames = candidates.filter((name) => publicText.includes(name))
  assert.equal(leakedNames.length, 0, `Private source name leak count: ${leakedNames.length}`)
  for (const pattern of SECRET_PATTERNS) assert.doesNotMatch(publicText, pattern)

  const manifest = JSON.parse(
    await fs.readFile(path.join(REPOSITORY_ROOT, "publishing", "manifest.json"), "utf8"),
  )
  if (manifest.resources.length === 0) {
    assert.doesNotMatch(index.text, /"slug":"r\//)
  }

  return {
    ok: true,
    baseUrl: BASE_URL.origin,
    status: {
      home: home.response.status,
      tags: tags.response.status,
      searchIndex: index.response.status,
      missingStableRoute: missingPage.response.status,
      missingRawRoute: missingRaw.response.status,
    },
    securityHeaders: {
      contentTypeOptions: home.response.headers.get("x-content-type-options"),
      frameOptions: home.response.headers.get("x-frame-options"),
      referrerPolicy: home.response.headers.get("referrer-policy"),
    },
    privateNameCandidatesChecked: candidates.length,
    secretPatternMatches: 0,
  }
}

try {
  process.stdout.write(`${JSON.stringify(await main(), null, 2)}\n`)
} catch (error) {
  process.stderr.write(`${error.stack ?? error}\n`)
  process.exitCode = 1
}
