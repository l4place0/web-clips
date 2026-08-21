#!/usr/bin/env node

import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"

const ROOT = path.resolve(process.env.GITHUB_WORKSPACE || process.cwd())
const CLIPS_ROOT = path.join(ROOT, "clips")
const RID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const PUBLIC_BASE = "https://l4place0.github.io/web-clips-publish"

async function markdownFiles(directory) {
  const output = []
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.name === "assets") continue
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) output.push(...await markdownFiles(absolute))
    else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) output.push(absolute)
  }
  return output
}

function fieldIndex(lines, field) {
  const pattern = new RegExp(`^${field}:\\s*`)
  const matches = []
  lines.forEach((line, index) => {
    if (pattern.test(line)) matches.push(index)
  })
  if (matches.length > 1) throw new Error(`duplicate frontmatter field: ${field}`)
  return matches[0] ?? -1
}

function scalarValue(line) {
  const raw = line.slice(line.indexOf(":") + 1).trim()
  return raw.replace(/^(["'])(.*)\1$/, "$2")
}

function setField(lines, field, value, insertAfter = -1) {
  const index = fieldIndex(lines, field)
  const next = `${field}: ${value}`
  if (index >= 0) {
    if (lines[index] === next || scalarValue(lines[index]) === value) return false
    lines[index] = next
    return true
  }
  lines.splice(insertAfter >= 0 ? insertAfter + 1 : lines.length, 0, next)
  return true
}

function normalize(markdown, relativePath) {
  const eol = markdown.includes("\r\n") ? "\r\n" : "\n"
  let body = markdown
  let frontmatter = []
  let suffix = markdown

  if (markdown.startsWith(`---${eol}`)) {
    const end = markdown.indexOf(`${eol}---`, 4)
    if (end < 0) throw new Error(`${relativePath}: unclosed YAML frontmatter`)
    frontmatter = markdown.slice(4, end).split(eol)
    suffix = markdown.slice(end + eol.length + 3)
  }

  const publishIndex = fieldIndex(frontmatter, "publish")
  if (publishIndex >= 0 && scalarValue(frontmatter[publishIndex]).toLowerCase() === "false") {
    return { markdown, rid: null, changed: false, skipped: true }
  }

  const ridIndex = fieldIndex(frontmatter, "rid")
  let rid = ridIndex >= 0 ? scalarValue(frontmatter[ridIndex]).toLowerCase() : randomUUID()
  if (!RID_PATTERN.test(rid)) throw new Error(`${relativePath}: invalid rid ${rid}`)

  let changed = false
  changed = setField(frontmatter, "rid", rid, ridIndex) || changed
  const normalizedRidIndex = fieldIndex(frontmatter, "rid")
  changed = setField(frontmatter, "permalink", `/r/${rid}`, normalizedRidIndex) || changed
  const permalinkIndex = fieldIndex(frontmatter, "permalink")
  changed = setField(frontmatter, "webClipUrl", `${PUBLIC_BASE}/r/${rid}`, permalinkIndex) || changed

  if (markdown.startsWith(`---${eol}`)) {
    body = `---${eol}${frontmatter.join(eol)}${eol}---${suffix}`
  } else {
    const separator = suffix.startsWith(eol) ? "" : eol
    body = `---${eol}${frontmatter.join(eol)}${eol}---${eol}${separator}${suffix}`
    changed = true
  }
  return { markdown: body, rid, changed, skipped: false }
}

async function main() {
  const files = await markdownFiles(CLIPS_ROOT)
  const seen = new Map()
  const changed = []
  let skipped = 0

  for (const file of files.sort()) {
    const relative = path.relative(ROOT, file).replaceAll(path.sep, "/")
    const source = await fs.readFile(file, "utf8")
    const result = normalize(source, relative)
    if (result.skipped) {
      skipped += 1
      continue
    }
    if (seen.has(result.rid)) throw new Error(`duplicate rid ${result.rid}: ${seen.get(result.rid)} and ${relative}`)
    seen.set(result.rid, relative)
    if (result.changed) {
      await fs.writeFile(file, result.markdown, "utf8")
      changed.push(relative)
    }
  }

  process.stdout.write(`${JSON.stringify({ ok: true, scanned: files.length, skipped, changed }, null, 2)}\n`)
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
