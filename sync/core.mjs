import crypto from "node:crypto"
import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import {
  analyzeWorkspace,
  assignId,
  internals,
  loadConfig,
  optInForAutomaticPublishing,
} from "../publishing/publisher.mjs"

const execFileAsync = promisify(execFile)
const STATE_PATH = "publishing/sync-state.json"
const REGISTRY_PATH = "publishing/registry.json"
const MANIFEST_PATH = "publishing/manifest.json"
const STRONG_SECRET_PATTERNS = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["github-token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ["openai-key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ["aws-access-key", /\bAKIA[0-9A-Z]{16}\b/],
  ["aliyun-access-key", /\bLTAI[0-9A-Za-z]{16,}\b/],
  ["cloudflare-token", /\b(?:CF_API_TOKEN|CLOUDFLARE_API_TOKEN)\s*[:=]\s*[^\s"'`]{20,}/i],
]

function posix(value) {
  return value.split(path.sep).join("/")
}

function native(value) {
  return value.split("/").join(path.sep)
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

function localStateRoot(root) {
  if (process.env.WEB_CLIPS_SYNC_LOCAL_ROOT) {
    return path.resolve(process.env.WEB_CLIPS_SYNC_LOCAL_ROOT)
  }
  const base = process.env.LOCALAPPDATA || path.join(root, ".publish-sync")
  return path.join(base, "WebClipsAutoSync", sha256(Buffer.from(path.resolve(root))).slice(0, 16))
}

async function exists(file) {
  try {
    await fs.access(file)
    return true
  } catch (error) {
    if (error.code === "ENOENT") return false
    throw error
  }
}

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"))
  } catch (error) {
    if (error.code === "ENOENT") return fallback
    throw error
  }
}

function excluded(config, relativePath) {
  const value = posix(relativePath)
  return config.source.exclude.some((pattern) => {
    if (pattern.endsWith("*/**")) return value.startsWith(pattern.slice(0, -4))
    if (pattern.endsWith("/**")) {
      const prefix = pattern.slice(0, -3)
      return value === prefix || value.startsWith(`${prefix}/`)
    }
    return value === pattern
  })
}

async function walkNotes(root, config) {
  if (config.autoSync?.rootMarkdownOnly !== true) {
    throw new Error("automatic sync requires autoSync.rootMarkdownOnly=true")
  }
  const result = []
  async function visit(directory, relativeDirectory = "") {
    const entries = await fs.readdir(directory, { withFileTypes: true })
    entries.sort((a, b) => a.name.localeCompare(b.name, "en"))
    for (const entry of entries) {
      const relative = relativeDirectory ? path.join(relativeDirectory, entry.name) : entry.name
      if (entry.isSymbolicLink()) continue
      if (entry.isDirectory()) {
        if (!relativeDirectory && config.autoSync.rootMarkdownOnly) continue
        if (!excluded(config, relative)) await visit(path.join(directory, entry.name), relative)
      } else if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith(".md") &&
        !excluded(config, relative)
      ) {
        result.push(posix(relative))
      }
    }
  }
  await visit(root)
  return result
}

export async function readStableFile(
  file,
  { quietMs = 30_000, nowMs = Date.now(), retries = 4, retryMs = 250 } = {},
) {
  let lastReason = "unstable"
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const before = await fs.stat(file)
      if (nowMs - before.mtimeMs < quietMs) {
        return { ok: false, reason: "quiet-window", mtimeMs: before.mtimeMs }
      }
      const buffer = await fs.readFile(file)
      const after = await fs.stat(file)
      if (before.size === after.size && before.mtimeMs === after.mtimeMs) {
        return { ok: true, buffer, mtimeMs: after.mtimeMs }
      }
      lastReason = "changed-during-read"
    } catch (error) {
      if (error.code === "ENOENT") return { ok: false, reason: "missing" }
      lastReason = error.code ?? "read-failed"
    }
    if (attempt + 1 < retries) await new Promise((resolve) => setTimeout(resolve, retryMs))
  }
  return { ok: false, reason: lastReason }
}

async function discoverCurrentNotes(root, config, options) {
  const notes = []
  for (const relativePath of await walkNotes(root, config)) {
    const absolutePath = path.join(root, native(relativePath))
    const stable = await readStableFile(absolutePath, options)
    const buffer = stable.buffer ?? (await fs.readFile(absolutePath))
    const text = buffer.toString("utf8")
    let parsed
    try {
      parsed = internals.parseFrontmatter(text, relativePath)
    } catch {
      parsed = null
    }
    notes.push({
      relativePath,
      absolutePath,
      buffer,
      hash: sha256(buffer),
      stable,
      parsed,
      rid: parsed?.data?.rid,
      publish: parsed?.data?.publish,
    })
  }
  return notes
}

function stateByPath(state) {
  return new Map(
    Object.entries(state?.resources ?? {}).map(([rid, item]) => [item.sourcePath, { rid, ...item }]),
  )
}

export async function planIncrementalSync(
  rootInput,
  { quietMs = 30_000, nowMs = Date.now(), retryMs = 250 } = {},
) {
  const root = path.resolve(rootInput)
  const config = await loadConfig(root)
  const state = await readJson(path.join(root, native(STATE_PATH)), null)
  const notes = await discoverCurrentNotes(root, config, { quietMs, nowMs, retryMs })
  const previousByPath = stateByPath(state)
  const currentByPath = new Map(notes.map((note) => [note.relativePath, note]))
  const changedNotes = []
  const deletedNotes = []
  const deferred = []

  for (const note of notes) {
    const previous = previousByPath.get(note.relativePath)
    if (!previous || previous.noteSha256 !== note.hash) {
      changedNotes.push(note.relativePath)
      if (!note.stable.ok) deferred.push({ path: note.relativePath, reason: note.stable.reason })
    }
  }
  for (const [sourcePath] of previousByPath) {
    if (!currentByPath.has(sourcePath)) deletedNotes.push(sourcePath)
  }

  const changedAssets = []
  const missingAssets = []
  const assetOwners = new Map()
  for (const [rid, resource] of Object.entries(state?.resources ?? {})) {
    for (const [assetPath, previousHash] of Object.entries(resource.assets ?? {})) {
      const owners = assetOwners.get(assetPath) ?? new Set()
      owners.add(resource.sourcePath)
      assetOwners.set(assetPath, owners)
      const absolutePath = path.join(root, native(assetPath))
      const stable = await readStableFile(absolutePath, { quietMs, nowMs, retryMs })
      if (stable.reason === "missing") {
        changedAssets.push(assetPath)
        missingAssets.push(assetPath)
      } else if (stable.ok && sha256(stable.buffer) !== previousHash) {
        changedAssets.push(assetPath)
      } else if (!stable.ok) {
        changedAssets.push(assetPath)
        deferred.push({ path: assetPath, reason: stable.reason })
      }
    }
  }

  return {
    version: 1,
    initialized: state !== null,
    notesScanned: notes.length,
    changedNotes: [...new Set(changedNotes)].sort(),
    deletedNotes: [...new Set(deletedNotes)].sort(),
    changedAssets: [...new Set(changedAssets)].sort(),
    missingAssets: [...new Set(missingAssets)].sort(),
    affectedNotes: [
      ...new Set([
        ...changedNotes,
        ...deletedNotes,
        ...changedAssets.flatMap((item) => [...(assetOwners.get(item) ?? [])]),
      ]),
    ].sort(),
    deferred,
    hasChanges:
      state === null || changedNotes.length > 0 || deletedNotes.length > 0 || changedAssets.length > 0,
  }
}

async function run(file, args, { cwd, env = process.env, allowFailure = false } = {}) {
  try {
    const result = await execFileAsync(file, args, {
      cwd,
      env,
      encoding: "utf8",
      windowsHide: true,
      maxBuffer: 32 * 1024 * 1024,
    })
    return { ok: true, stdout: result.stdout, stderr: result.stderr, exitCode: 0 }
  } catch (error) {
    const result = {
      ok: false,
      stdout: error.stdout ?? "",
      stderr: error.stderr ?? "",
      exitCode: Number.isInteger(error.code) ? error.code : 1,
    }
    if (allowFailure) return result
    const message = (result.stderr || result.stdout || "command failed").trim().split(/\r?\n/).slice(-1)[0]
    throw new Error(`${path.basename(file)} failed (${result.exitCode}): ${message}`)
  }
}

async function git(root, args, options = {}) {
  return run(
    "git",
    ["-c", `safe.directory=${posix(root)}`, "-c", "core.quotepath=false", "-C", root, ...args],
    { cwd: root, ...options },
  )
}

function parseStatus(output) {
  const parts = output.split("\0")
  const entries = []
  for (let index = 0; index < parts.length; index += 1) {
    const item = parts[index]
    if (!item) continue
    const status = item.slice(0, 2)
    const itemPath = posix(item.slice(3))
    const entry = { status, path: itemPath }
    if (status.includes("R") || status.includes("C")) entry.originalPath = posix(parts[++index] ?? "")
    entries.push(entry)
  }
  return entries
}

async function gitStatus(root) {
  const result = await git(root, ["status", "--porcelain=v1", "-z", "--untracked-files=all"])
  return parseStatus(result.stdout)
}

function isPublishingState(value) {
  return [STATE_PATH, REGISTRY_PATH, MANIFEST_PATH].includes(value)
}

function isContentPath(value, notePaths) {
  return notePaths.has(value) || value.startsWith("assets/") || isPublishingState(value)
}

async function assertSafeWorktree(root, notePaths) {
  const entries = await gitStatus(root)
  const staged = entries.filter((item) => item.status[0] !== " " && item.status[0] !== "?")
  if (staged.length > 0) {
    throw new Error(`staged changes block automatic sync: ${staged.map((item) => item.path).join(", ")}`)
  }
  const unsafe = entries.filter(
    (item) =>
      !isContentPath(item.path, notePaths) ||
      (item.originalPath && !isContentPath(item.originalPath, notePaths)),
  )
  if (unsafe.length > 0) {
    throw new Error(`non-content changes block automatic sync: ${unsafe.map((item) => item.path).join(", ")}`)
  }
  return entries
}

async function assertOrRecoverRemote(root) {
  await git(root, ["fetch", "--quiet", "origin", "main"])
  const head = (await git(root, ["rev-parse", "HEAD"])).stdout.trim()
  const remote = (await git(root, ["rev-parse", "origin/main"])).stdout.trim()
  if (head === remote) return { recoveredPush: false }
  const base = (await git(root, ["merge-base", "HEAD", "origin/main"])).stdout.trim()
  if (base === head) {
    const status = await gitStatus(root)
    if (status.length !== 0) throw new Error("origin/main is ahead; fast-forward requires a clean worktree")
    await git(root, ["merge", "--ff-only", "origin/main"])
    return { recoveredPush: false, fastForwarded: true }
  }
  if (base === remote) {
    const subjects = (
      await git(root, ["log", "--format=%s", "origin/main..HEAD"])
    ).stdout
      .split(/\r?\n/)
      .filter(Boolean)
    if (subjects.length > 0 && subjects.every((item) => item.startsWith("sync(web-clips):"))) {
      await git(root, ["push", "origin", "HEAD:main"])
      return { recoveredPush: true }
    }
    throw new Error("local main is ahead with a commit not created by automatic sync")
  }
  throw new Error("main and origin/main have diverged; automatic merge/rebase is disabled")
}

function scanSecrets(items) {
  const matches = []
  for (const item of items) {
    const text = item.buffer.toString("utf8")
    for (const [name, expression] of STRONG_SECRET_PATTERNS) {
      if (expression.test(text)) matches.push({ path: item.path, pattern: name })
    }
  }
  return matches
}

async function buildDeterministicState(root, analysis) {
  const resources = {}
  const renderedByRid = new Map(analysis.rendered.map((item) => [item.note.rid, item]))
  const identified = analysis.scan.notes
    .filter((note) => typeof note.rid === "string")
    .sort((a, b) => a.rid.localeCompare(b.rid, "en"))
  for (const note of identified) {
    const rendered = renderedByRid.get(note.rid)
    const assets = {}
    for (const asset of rendered?.assets ?? []) {
      const buffer = await fs.readFile(path.join(root, native(asset.sourceRelativePath)))
      assets[asset.sourceRelativePath] = sha256(buffer)
    }
    resources[note.rid] = {
      sourcePath: note.relativePath,
      published: note.published,
      noteSha256: sha256(Buffer.from(note.text, "utf8")),
      assets,
    }
  }
  return { version: 1, resources }
}

async function writeStateIfChanged(root, state) {
  const target = path.join(root, native(STATE_PATH))
  const content = `${JSON.stringify(state, null, 2)}\n`
  const previous = (await exists(target)) ? await fs.readFile(target, "utf8") : null
  if (previous === content) return false
  await fs.writeFile(target, content, "utf8")
  return true
}

async function acquireLock(root, { staleMs = 15 * 60_000 } = {}) {
  const localRoot = localStateRoot(root)
  const lock = path.join(localRoot, "lock")
  await fs.mkdir(localRoot, { recursive: true })
  const runId = crypto.randomUUID()
  try {
    await fs.mkdir(lock)
  } catch (error) {
    if (error.code !== "EEXIST") throw error
    const stat = await fs.stat(lock)
    let owner = null
    try {
      owner = JSON.parse(await fs.readFile(path.join(lock, "owner.json"), "utf8"))
    } catch {}
    let ownerAlive = false
    if (Number.isInteger(owner?.pid)) {
      try {
        process.kill(owner.pid, 0)
        ownerAlive = true
      } catch {}
    }
    if (Date.now() - stat.mtimeMs <= staleMs || ownerAlive) return null
    const stale = `${lock}.stale-${crypto.randomUUID()}`
    try {
      await fs.rename(lock, stale)
    } catch (renameError) {
      if (renameError.code === "ENOENT" || renameError.code === "EEXIST") return null
      throw renameError
    }
    await fs.rm(stale, { recursive: true, force: true })
    await fs.mkdir(lock)
  }
  await fs.writeFile(
    path.join(lock, "owner.json"),
    `${JSON.stringify({ pid: process.pid, runId, startedAt: new Date().toISOString() })}\n`,
    "utf8",
  )
  return async () => {
    try {
      const owner = JSON.parse(await fs.readFile(path.join(lock, "owner.json"), "utf8"))
      if (owner.runId === runId) await fs.rm(lock, { recursive: true, force: true })
    } catch (error) {
      if (error.code !== "ENOENT") throw error
    }
  }
}

async function appendLog(root, event) {
  const directory = path.join(localStateRoot(root), "logs")
  await fs.mkdir(directory, { recursive: true })
  const day = new Date().toISOString().slice(0, 10)
  await fs.appendFile(
    path.join(directory, `sync-${day}.jsonl`),
    `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`,
    "utf8",
  )
  const files = (await fs.readdir(directory))
    .filter((item) => /^sync-\d{4}-\d{2}-\d{2}\.jsonl$/.test(item))
    .sort()
  for (const item of files.slice(0, Math.max(0, files.length - 14))) {
    await fs.rm(path.join(directory, item), { force: true })
  }
}

async function runGate(root, script) {
  const commands = {
    "publish:validate": [path.join(root, "publishing", "cli.mjs"), "validate"],
    "publish:dry-run": [path.join(root, "publishing", "cli.mjs"), "build", "--dry-run"],
    "build:site": [path.join(root, "site", "build.mjs")],
  }
  const args = commands[script]
  if (!args) throw new Error(`unknown sync gate: ${script}`)
  return run(process.execPath, args, { cwd: root })
}

function affectedAssetPaths(previousState, analysis, affectedNotes) {
  const result = new Set()
  for (const resource of Object.values(previousState?.resources ?? {})) {
    if (affectedNotes.has(resource.sourcePath)) {
      for (const assetPath of Object.keys(resource.assets ?? {})) result.add(assetPath)
    }
  }
  for (const item of analysis.rendered) {
    if (affectedNotes.has(item.note.relativePath)) {
      for (const asset of item.assets) result.add(asset.sourceRelativePath)
    }
  }
  return result
}

async function preflightChangedNotes(root, config, currentByPath, changedNotes, options) {
  const inputs = []
  const assets = new Set()
  for (const sourcePath of changedNotes) {
    const note = currentByPath.get(sourcePath)
    if (!note) continue
    if (!note.parsed) throw new Error(`frontmatter parse failed before mutation: ${sourcePath}`)
    inputs.push({ path: sourcePath, buffer: note.buffer })
    if (note.publish === false) continue
    const references = internals.collectMarkupReferences(note.parsed.body)
    const cover = note.parsed.data.cover
    if (typeof cover === "string") references.push({ target: cover, kind: "image" })
    for (const reference of references) {
      const targetPath = reference.target.split(/[?#]/, 1)[0].toLowerCase()
      const isImage =
        ["image", "html-image", "obsidian-embed"].includes(reference.kind) ||
        config.attachments.localImages.extensions.some((extension) => targetPath.endsWith(extension))
      if (!isImage) continue
      const resolved = await internals.resolveAttachment(
        root,
        config,
        { relativePath: sourcePath, rid: note.rid ?? "00000000-0000-4000-8000-000000000000" },
        reference.target,
      )
      if (resolved.diagnostic?.level === "error") {
        throw new Error(`${resolved.diagnostic.code} before mutation: ${sourcePath}`)
      }
      if (!resolved.remote && resolved.sourceRelativePath) assets.add(resolved.sourceRelativePath)
    }
  }
  for (const assetPath of assets) {
    const stable = await readStableFile(path.join(root, native(assetPath)), options)
    if (!stable.ok) throw new Error(`attachment is not stable: ${assetPath} (${stable.reason})`)
    inputs.push({ path: assetPath, buffer: stable.buffer })
  }
  const secrets = scanSecrets(inputs)
  if (secrets.length > 0) {
    throw new Error(
      `secret scan blocked ${secrets.length} file(s): ${secrets.map((item) => `${item.path}(${item.pattern})`).join(", ")}`,
    )
  }
  return assets
}

async function stageAndVerify(root, expected) {
  const candidates = [...expected].sort()
  if (candidates.length > 0) await git(root, ["add", "--", ...candidates])
  const staged = (
    await git(root, ["diff", "--cached", "--name-only", "-z", "--diff-filter=ACDMRTUXB"])
  ).stdout
    .split("\0")
    .filter(Boolean)
    .map(posix)
    .sort()
  const unexpected = staged.filter((item) => !expected.has(item))
  if (unexpected.length > 0) throw new Error(`unexpected staged paths: ${unexpected.join(", ")}`)
  return staged
}

async function snapshotFiles(root, relativePaths) {
  const result = new Map()
  for (const relativePath of [...relativePaths].sort()) {
    const file = path.join(root, native(relativePath))
    if (await exists(file)) result.set(relativePath, sha256(await fs.readFile(file)))
    else result.set(relativePath, null)
  }
  return result
}

async function assertSnapshotUnchanged(root, snapshot) {
  const current = await snapshotFiles(root, snapshot.keys())
  const changed = [...snapshot].filter(([itemPath, digest]) => current.get(itemPath) !== digest)
  if (changed.length > 0) {
    throw new Error(`content changed during sync: ${changed.map(([itemPath]) => itemPath).join(", ")}`)
  }
}

export async function syncCheck(rootInput, options = {}) {
  const root = path.resolve(rootInput)
  const plan = await planIncrementalSync(root, options)
  return {
    ok: true,
    command: "sync:check",
    ...plan,
    action: plan.deferred.length > 0 ? "deferred" : plan.hasChanges ? "sync" : "none",
  }
}

export async function syncNow(
  rootInput,
  { quietMs = 30_000, nowMs = Date.now(), skipGates = false, skipGit = false } = {},
) {
  const root = path.resolve(rootInput)
  const release = await acquireLock(root)
  if (!release) {
    const result = { ok: true, command: "sync:now", action: "locked", changed: false }
    await appendLog(root, result)
    return result
  }
  try {
    const config = await loadConfig(root)
    const notePaths = new Set(await walkNotes(root, config))
    let remote = { recoveredPush: false }
    let initialStatus = []
    if (!skipGit) {
      initialStatus = await assertSafeWorktree(root, notePaths)
      remote = await assertOrRecoverRemote(root)
    }
    const previousState = await readJson(path.join(root, native(STATE_PATH)), null)
    const plan = await planIncrementalSync(root, { quietMs, nowMs })
    const stateDirty = initialStatus.some((item) => isPublishingState(item.path))
    if (plan.deferred.length > 0) {
      const result = {
        ok: true,
        command: "sync:now",
        action: "deferred",
        changed: false,
        deferred: plan.deferred,
        recoveredPush: remote.recoveredPush,
      }
      await appendLog(root, result)
      return result
    }
    if (!plan.hasChanges && !stateDirty) {
      const result = {
        ok: true,
        command: "sync:now",
        action: remote.recoveredPush ? "recovered-push" : "none",
        changed: false,
        buildRan: false,
        commitCreated: false,
        pushRan: remote.recoveredPush,
      }
      await appendLog(root, result)
      return result
    }

    const currentByPath = new Map(
      (await discoverCurrentNotes(root, config, { quietMs: 0, nowMs })).map((note) => [
        note.relativePath,
        note,
      ]),
    )
    await preflightChangedNotes(root, config, currentByPath, plan.changedNotes, { quietMs, nowMs })
    for (const sourcePath of plan.changedNotes) {
      const note = currentByPath.get(sourcePath)
      if (!note || note.publish === false) continue
      if (note.publish === undefined) await optInForAutomaticPublishing(root, sourcePath)
      await assignId(root, sourcePath)
    }

    const analysis = await analyzeWorkspace(root, { includeRendered: true })
    const errors = analysis.diagnostics.filter((item) => item.level === "error")
    if (errors.length > 0) {
      throw new Error(`publishing validation failed: ${errors.map((item) => `${item.code}:${item.path ?? ""}`).join(", ")}`)
    }
    const affectedNotes = new Set(plan.affectedNotes)
    const affectedAssets = affectedAssetPaths(previousState, analysis, affectedNotes)
    const secretInputs = []
    for (const sourcePath of affectedNotes) {
      const note = analysis.scan.notes.find((item) => item.relativePath === sourcePath)
      if (note) secretInputs.push({ path: sourcePath, buffer: Buffer.from(note.text, "utf8") })
    }
    for (const assetPath of affectedAssets) {
      const file = path.join(root, native(assetPath))
      if (await exists(file)) secretInputs.push({ path: assetPath, buffer: await fs.readFile(file) })
    }
    const secrets = scanSecrets(secretInputs)
    if (secrets.length > 0) {
      throw new Error(`secret scan blocked ${secrets.length} file(s): ${secrets.map((item) => `${item.path}(${item.pattern})`).join(", ")}`)
    }
    const sourceSnapshot = await snapshotFiles(root, new Set([...affectedNotes, ...affectedAssets]))

    if (!skipGates) {
      await runGate(root, "publish:validate")
      await runGate(root, "publish:dry-run")
      await runGate(root, "build:site")
    }
    await assertSnapshotUnchanged(root, sourceSnapshot)
    const finalAnalysis = await analyzeWorkspace(root, { includeRendered: true })
    const nextState = await buildDeterministicState(root, finalAnalysis)
    await writeStateIfChanged(root, nextState)

    const expected = new Set([
      ...plan.changedNotes,
      ...plan.deletedNotes,
      ...affectedAssets,
      REGISTRY_PATH,
      MANIFEST_PATH,
      STATE_PATH,
    ])
    let staged = []
    let commit = null
    if (!skipGit) {
      staged = await stageAndVerify(root, expected)
      if (staged.length === 0) {
        const result = {
          ok: true,
          command: "sync:now",
          action: "none",
          changed: false,
          buildRan: !skipGates,
          commitCreated: false,
          pushRan: false,
          secretsFound: 0,
        }
        await appendLog(root, result)
        return result
      }
      const timestamp = new Date(nowMs).toISOString().replace("T", " ").slice(0, 16)
      await git(root, ["commit", "-m", `sync(web-clips): publish content delta ${timestamp}`])
      commit = (await git(root, ["rev-parse", "HEAD"])).stdout.trim()
      await git(root, ["push", "origin", "HEAD:main"])
    }
    const result = {
      ok: true,
      command: "sync:now",
      action: "synced",
      changed: true,
      buildRan: !skipGates,
      commitCreated: !skipGit,
      pushRan: !skipGit,
      commit,
      staged,
      changedNotes: plan.changedNotes,
      deletedNotes: plan.deletedNotes,
      changedAssets: plan.changedAssets,
      publishedCount: finalAnalysis.published.length,
      attachmentCount: finalAnalysis.rendered.reduce((sum, item) => sum + item.assets.length, 0),
      secretsFound: 0,
    }
    await appendLog(root, result)
    return result
  } catch (error) {
    await appendLog(root, { ok: false, command: "sync:now", error: error.message })
    throw error
  } finally {
    await release()
  }
}

export const syncInternals = {
  STATE_PATH,
  localStateRoot,
  parseStatus,
  scanSecrets,
  buildDeterministicState,
  acquireLock,
  assertSafeWorktree,
  assertOrRecoverRemote,
  stageAndVerify,
}
