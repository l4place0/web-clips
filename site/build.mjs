import { spawn } from "node:child_process"
import { randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import YAML from "yaml"

import { build as buildPublication, validate as validatePublication } from "../publishing/publisher.mjs"

const SITE_DIR = path.dirname(fileURLToPath(import.meta.url))
const REPOSITORY_ROOT = path.dirname(SITE_DIR)
const PINNED_PLUGIN_VERSION = "0.1.0"
const RID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const HEADERS = `# Cloudflare Pages static response headers
/raw/*.md
  Content-Type: text/markdown; charset=utf-8
  Content-Disposition: inline
  X-Content-Type-Options: nosniff

/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
`

function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate))
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)
}

function assertManagedPath(root, candidate, expectedPrefix) {
  const resolvedRoot = path.resolve(root)
  const resolved = path.resolve(candidate)
  if (!isInside(resolvedRoot, resolved) || !path.basename(resolved).startsWith(expectedPrefix)) {
    throw new Error(`Refusing unmanaged path: ${expectedPrefix}`)
  }
  return resolved
}

async function pathExists(target) {
  try {
    await fs.lstat(target)
    return true
  } catch (error) {
    if (error?.code === "ENOENT") return false
    throw error
  }
}

async function rejectSymlink(target, label) {
  if (!(await pathExists(target))) return
  const stat = await fs.lstat(target)
  if (stat.isSymbolicLink()) throw new Error(`Refusing symbolic link at ${label}`)
}

async function removeManaged(root, candidate, prefix) {
  const resolved = assertManagedPath(root, candidate, prefix)
  await rejectSymlink(resolved, prefix)
  await fs.rm(resolved, { recursive: true, force: true })
}

async function copyTreeSecure(sourceRoot, destinationRoot) {
  if (!(await pathExists(sourceRoot))) {
    await fs.mkdir(destinationRoot, { recursive: true })
    return
  }

  await rejectSymlink(sourceRoot, "published content root")
  const sourceReal = await fs.realpath(sourceRoot)
  const entries = await fs.readdir(sourceRoot, { withFileTypes: true })
  await fs.mkdir(destinationRoot, { recursive: true })

  for (const entry of entries) {
    const source = path.join(sourceRoot, entry.name)
    const destination = path.join(destinationRoot, entry.name)
    const stat = await fs.lstat(source)
    if (stat.isSymbolicLink()) throw new Error("Published content must not contain symbolic links")
    const real = await fs.realpath(source)
    if (real !== sourceReal && !isInside(sourceReal, real)) {
      throw new Error("Published content escaped its staging root")
    }
    if (stat.isDirectory()) {
      await copyTreeSecure(source, destination)
    } else if (stat.isFile()) {
      await fs.mkdir(path.dirname(destination), { recursive: true })
      await fs.copyFile(source, destination)
    } else {
      throw new Error("Published content contains an unsupported filesystem entry")
    }
  }
}

async function copyStagedPages(stageContentRoot, destinationRoot, manifest) {
  await fs.mkdir(path.join(destinationRoot, "r"), { recursive: true })
  for (const resource of manifest.resources) {
    if (!RID_PATTERN.test(resource.rid)) throw new Error("Manifest contains an invalid RID")
    const source = path.join(stageContentRoot, "r", `${resource.rid}.md`)
    const destination = path.join(destinationRoot, "r", `${resource.rid}.md`)
    await rejectSymlink(source, "staged Quartz page")
    if (!(await pathExists(source))) throw new Error(`Missing staged page for ${resource.rid}`)
    await fs.copyFile(source, destination)
  }
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---")) return {}
  const match = markdown.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/)
  if (!match) return {}
  const value = YAML.parse(match[1])
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function escapeMarkdownLabel(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]")
}

async function writeSafeIndex(contentRoot, manifest) {
  const resources = []
  for (const resource of manifest.resources) {
    if (!RID_PATTERN.test(resource.rid)) throw new Error("Manifest contains an invalid RID")
    if (typeof resource.title !== "string" || !resource.title.trim()) {
      throw new Error(`Manifest contains an invalid title for ${resource.rid}`)
    }
    const title = resource.title.trim()
    resources.push({ rid: resource.rid, title })
  }
  resources.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"))

  const status = resources.length === 0
    ? "当前暂无公开内容。私有剪藏不会进入本站。"
    : `当前公开资源：${resources.length} 条。`
  const links = resources.length === 0
    ? ""
    : `\n## 公开资源\n\n${resources
      .map(({ rid, title }) => `- [${escapeMarkdownLabel(title)}](/r/${rid})`)
      .join("\n")}\n`

  const markdown = `---
title: L4P 剪藏馆
---

# L4P 剪藏馆

${status}

[浏览标签](/tags)
${links}`
  await fs.writeFile(path.join(contentRoot, "index.md"), markdown, "utf8")
}

function runNode(args, { cwd, label }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd,
      env: { ...process.env, NO_COLOR: "1" },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    })
    let stdout = ""
    let stderr = ""
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk) => {
      stdout += chunk
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk
    })
    child.on("error", reject)
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr })
      } else {
        const detail = `${stdout}\n${stderr}`.trim()
        reject(new Error(`${label} failed with exit code ${code}${detail ? `\n${detail}` : ""}`))
      }
    })
  })
}

async function prepareQuartzEngine() {
  const engineRoot = path.join(REPOSITORY_ROOT, "node_modules", "@jackyzha0", "quartz")
  const bootstrap = path.join(engineRoot, "quartz", "bootstrap-cli.mjs")
  if (!(await pathExists(bootstrap))) {
    throw new Error("Pinned Quartz engine is missing; run npm ci first")
  }

  await fs.copyFile(path.join(SITE_DIR, "quartz.config.yaml"), path.join(engineRoot, "quartz.config.yaml"))
  await fs.copyFile(path.join(SITE_DIR, "quartz.lock.json"), path.join(engineRoot, "quartz.lock.json"))

  const loaderPath = path.join(engineRoot, "quartz", "plugins", "loader", "gitLoader.ts")
  const loader = await fs.readFile(loaderPath, "utf8")
  const marker = "M4_PINNED_NPM_PLUGIN"
  if (!loader.includes(marker)) {
    const pattern = /    } catch \{\r?\n      \/\/ If git operations fail, re-clone\r?\n    \}/
    if (!pattern.test(loader)) throw new Error("Quartz plugin loader compatibility point changed")
    const compatible = loader.replace(
      pattern,
      `    } catch {
      // ${marker}: package-lock pinned plugin snapshots are valid without nested Git metadata.
      if (
        fs.existsSync(path.join(pluginDir, "package.json")) &&
        fs.existsSync(path.join(pluginDir, "dist"))
      ) {
        return pluginDir
      }
    }`,
    )
    await fs.writeFile(loaderPath, compatible, "utf8")
  }
  return { engineRoot, bootstrap }
}

async function preparePinnedPlugins(engineRoot) {
  const lock = JSON.parse(await fs.readFile(path.join(SITE_DIR, "quartz.lock.json"), "utf8"))
  if (lock?.version !== "1.0.0" || !lock.plugins || typeof lock.plugins !== "object") {
    throw new Error("Quartz plugin lock is invalid")
  }
  const pluginRoot = path.join(engineRoot, ".quartz", "plugins")
  if (!isInside(engineRoot, pluginRoot)) throw new Error("Unsafe Quartz plugin cache path")
  await rejectSymlink(pluginRoot, "Quartz plugin cache")
  await fs.rm(pluginRoot, { recursive: true, force: true })
  await fs.mkdir(pluginRoot, { recursive: true })

  for (const [name, entry] of Object.entries(lock.plugins)) {
    if (
      entry?.source !== `github:quartz-community/${name}` ||
      !/^[0-9a-f]{40}$/.test(entry.commit ?? "")
    ) {
      throw new Error(`Invalid pinned plugin entry: ${name}`)
    }
    const packageRoot = path.join(REPOSITORY_ROOT, "node_modules", "@quartz-community", name)
    const packageJsonPath = path.join(packageRoot, "package.json")
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"))
    if (packageJson.name !== `@quartz-community/${name}` || packageJson.version !== PINNED_PLUGIN_VERSION) {
      throw new Error(`Unexpected pinned plugin package: ${name}`)
    }
    const destination = path.join(pluginRoot, name)
    await fs.mkdir(destination, { recursive: true })
    await fs.copyFile(packageJsonPath, path.join(destination, "package.json"))
    await copyTreeSecure(path.join(packageRoot, "dist"), path.join(destination, "dist"))
  }

  await fs.writeFile(
    path.join(pluginRoot, "index.ts"),
    `export { ContentDetails } from "./content-index"
// Quartz v5.0.0 core imports this optional plugin symbol unconditionally.
export const CustomOgImagesEmitterName = "__disabled_custom_og_images__"
`,
    "utf8",
  )
}

async function copyRawFiles(stageRoot, outputRoot, manifest) {
  const rawRoot = path.join(stageRoot, "raw")
  for (const resource of manifest.resources) {
    if (!RID_PATTERN.test(resource.rid)) throw new Error("Manifest contains an invalid RID")
    const source = path.join(rawRoot, `${resource.rid}.md`)
    const destination = path.join(outputRoot, "raw", `${resource.rid}.md`)
    await rejectSymlink(source, "raw Markdown")
    if (!(await pathExists(source))) throw new Error(`Missing staged raw Markdown for ${resource.rid}`)
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.copyFile(source, destination)
  }
}

function publicPath(outputRoot, route) {
  const segments = route.replace(/^\/+/, "").split("/").map((segment) => {
    const decoded = decodeURIComponent(segment)
    if (!decoded || decoded === "." || decoded === ".." || decoded.includes("/") || decoded.includes("\\")) {
      throw new Error("Manifest route contains an unsafe segment")
    }
    return decoded
  })
  const relative = segments.join(path.sep)
  const resolved = path.resolve(outputRoot, relative)
  if (!isInside(outputRoot, resolved)) throw new Error("Manifest route escaped public output")
  return resolved
}

async function copyDeclaredAssets(stageContentRoot, outputRoot, manifest) {
  for (const resource of manifest.resources) {
    for (const asset of resource.assets) {
      if (!asset.startsWith(`/assets/${resource.rid}/`)) {
        throw new Error(`Asset route does not belong to ${resource.rid}`)
      }
      const source = publicPath(stageContentRoot, asset)
      const destination = publicPath(outputRoot, asset)
      await rejectSymlink(source, "staged public asset")
      if (!(await pathExists(source))) throw new Error(`Missing staged asset for ${resource.rid}`)
      await fs.mkdir(path.dirname(destination), { recursive: true })
      await fs.copyFile(source, destination)
    }
  }
}

async function verifyOutput(outputRoot, manifest) {
  if (!(await pathExists(path.join(outputRoot, "index.html")))) {
    throw new Error("Quartz did not generate the empty-safe homepage")
  }
  for (const resource of manifest.resources) {
    const page = path.join(outputRoot, "r", `${resource.rid}.html`)
    const raw = path.join(outputRoot, "raw", `${resource.rid}.md`)
    if (!(await pathExists(page))) throw new Error(`Missing page output for ${resource.rid}`)
    if (!(await pathExists(raw))) throw new Error(`Missing raw output for ${resource.rid}`)
    for (const asset of resource.assets) {
      if (!(await pathExists(publicPath(outputRoot, asset)))) {
        throw new Error(`Missing public asset for ${resource.rid}`)
      }
    }
  }
}

async function commitPublicOutput(root, temporaryOutput) {
  const finalOutput = path.join(root, "public")
  const transactionId = randomUUID()
  const backupOutput = path.join(root, `public.backup-${transactionId}`)
  await rejectSymlink(finalOutput, "public output")
  let backedUp = false
  try {
    if (await pathExists(finalOutput)) {
      await fs.rename(finalOutput, backupOutput)
      backedUp = true
    }
    await fs.rename(temporaryOutput, finalOutput)
    if (backedUp) await removeManaged(root, backupOutput, "public.backup-")
  } catch (error) {
    if (await pathExists(finalOutput)) await fs.rm(finalOutput, { recursive: true, force: true })
    if (backedUp && (await pathExists(backupOutput))) await fs.rename(backupOutput, finalOutput)
    throw error
  }
}

export async function buildSite(root = REPOSITORY_ROOT) {
  root = path.resolve(root)
  const transactionId = randomUUID()
  const workRoot = assertManagedPath(
    os.tmpdir(),
    await fs.mkdtemp(path.join(os.tmpdir(), "web-clips-quartz-")),
    "web-clips-quartz-",
  )
  const temporaryOutput = assertManagedPath(root, path.join(root, `public.tmp-${transactionId}`), "public.tmp-")
  const stageRoot = path.join(root, ".publish-stage")

  try {
    const validation = await validatePublication(root)
    if (!validation.ok) {
      const codes = [...new Set(validation.diagnostics.map((item) => item.code))].join(", ")
      throw new Error(`Publication validation failed (${codes || "unknown diagnostic"})`)
    }
    const publication = await buildPublication(root)
    if (!publication.ok || !publication.manifest) {
      const codes = [...new Set((publication.diagnostics ?? []).map((item) => item.code))].join(", ")
      throw new Error(`Publication build failed (${codes || "unknown diagnostic"})`)
    }
    await rejectSymlink(stageRoot, "publication staging root")
    const stagedContent = path.join(stageRoot, "quartz", "content")
    if (await pathExists(stagedContent)) {
      const stageReal = await fs.realpath(stageRoot)
      const contentReal = await fs.realpath(stagedContent)
      if (!isInside(stageReal, contentReal)) throw new Error("Quartz content escaped publication staging")
    }

    const contentRoot = path.join(workRoot, "content")
    await copyStagedPages(stagedContent, contentRoot, publication.manifest)
    await writeSafeIndex(contentRoot, publication.manifest)

    const engine = await prepareQuartzEngine()
    await preparePinnedPlugins(engine.engineRoot)
    const bootstrapRelative = path.relative(engine.engineRoot, engine.bootstrap)
    await runNode(
      [
        bootstrapRelative,
        "build",
        "--directory",
        contentRoot,
        "--output",
        temporaryOutput,
        "--concurrency",
        "1",
      ],
      { cwd: engine.engineRoot, label: "Quartz build" },
    )

    await copyTreeSecure(path.join(engine.engineRoot, "quartz", "static"), path.join(temporaryOutput, "static"))
    await copyRawFiles(stageRoot, temporaryOutput, publication.manifest)
    await copyDeclaredAssets(stagedContent, temporaryOutput, publication.manifest)
    await fs.writeFile(path.join(temporaryOutput, "_headers"), HEADERS, "utf8")
    await verifyOutput(temporaryOutput, publication.manifest)
    await commitPublicOutput(root, temporaryOutput)

    return {
      published: publication.manifest.resources.length,
      output: path.join(root, "public"),
      routes: publication.manifest.resources.map(({ rid, page, raw, assets }) => ({
        rid,
        page,
        raw,
        assets,
      })),
    }
  } finally {
    if (await pathExists(workRoot)) await removeManaged(os.tmpdir(), workRoot, "web-clips-quartz-")
    if (await pathExists(temporaryOutput)) await removeManaged(root, temporaryOutput, "public.tmp-")
  }
}

async function main() {
  const result = await buildSite(REPOSITORY_ROOT)
  process.stdout.write(`${JSON.stringify({
    status: "ok",
    published: result.published,
    output: "public",
  })}\n`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`Site build failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exitCode = 1
  })
}
