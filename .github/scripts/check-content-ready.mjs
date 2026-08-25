#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"

const ROOT = path.resolve(process.env.GITHUB_WORKSPACE || process.cwd())
const CLIPS_ROOT = path.join(ROOT, "clips")

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

function withoutCode(markdown) {
  const lines = markdown.split(/\r?\n/)
  let fence = null
  return lines.map((line) => {
    const marker = line.match(/^\s*(```+|~~~+)/)?.[1]
    if (marker) {
      if (!fence) fence = marker[0]
      else if (marker[0] === fence) fence = null
      return ""
    }
    if (fence) return ""
    return line.replace(/`[^`\r\n]*`/g, "")
  })
}

function cleanTarget(raw) {
  let value = raw.trim().replace(/^<|>$/g, "")
  value = value.split(/[?#]/, 1)[0]
  try { value = decodeURIComponent(value) } catch {}
  return value.replaceAll("\\", "/")
}

function isLocalAsset(target, noteRelative) {
  const value = cleanTarget(target)
  if (!value || /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(value)) return false

  const noteDirectory = path.posix.dirname(noteRelative.replaceAll("\\", "/"))
  const resolved = path.posix.normalize(path.posix.join(noteDirectory, value.replace(/^\//, "")))
  return resolved === "clips/assets" || resolved.startsWith("clips/assets/")
}

function imageTargets(line) {
  const targets = []
  const patterns = [
    /!\[[^\]]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\s*\)/g,
    /!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g,
    /<img\b[^>]*\bsrc\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi,
  ]
  for (const pattern of patterns) {
    for (const match of line.matchAll(pattern)) targets.push(match[1] || match[2] || match[3])
  }
  return targets
}

function workflowEscape(value) {
  return String(value).replaceAll("%", "%25").replaceAll("\r", "%0D").replaceAll("\n", "%0A")
}

async function main() {
  const violations = []
  const files = await markdownFiles(CLIPS_ROOT)

  for (const file of files.sort()) {
    const relative = path.relative(ROOT, file).replaceAll(path.sep, "/")
    const source = await fs.readFile(file, "utf8")
    const lines = withoutCode(source)
    lines.forEach((line, index) => {
      for (const target of imageTargets(line)) {
        if (isLocalAsset(target, relative)) {
          violations.push({ file: relative, line: index + 1, target: cleanTarget(target) })
        }
      }
    })
  }

  const result = { ok: violations.length === 0, scanned: files.length, violations }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  if (violations.length) {
    if (process.env.GITHUB_ACTIONS === "true") {
      for (const violation of violations) {
        process.stderr.write(`::error file=${workflowEscape(violation.file)},line=${violation.line},title=Local media not published::${workflowEscape(violation.target)} still points to clips/assets; publish it to OSS first.\n`)
      }
    }
    process.stderr.write("Local image embeds remain. Publish them to OSS before content delivery.\n")
    process.exitCode = 1
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`)
  process.exitCode = 1
})
