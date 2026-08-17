import { createHash, randomUUID } from "node:crypto"
import fs from "node:fs/promises"
import { createReadStream } from "node:fs"
import path from "node:path"

const RID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
const REMOTE_PATTERN = /^(?:https?:|data:|#)/i

export class MediaPublishError extends Error {
  constructor(code, message, details = {}) {
    super(message)
    this.name = "MediaPublishError"
    this.code = code
    this.details = details
  }
}

function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate))
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative))
}

async function exists(target) {
  try {
    await fs.lstat(target)
    return true
  } catch (error) {
    if (error?.code === "ENOENT") return false
    throw error
  }
}

function normalizeExtension(extension) {
  const lower = extension.toLowerCase()
  return lower === ".jpeg" ? ".jpg" : lower
}

export async function loadMediaConfig(rootInput) {
  const root = path.resolve(rootInput)
  const configPath = path.join(root, "publishing", "media.config.json")
  let config
  try {
    config = JSON.parse(await fs.readFile(configPath, "utf8"))
  } catch (error) {
    throw new MediaPublishError("E_MEDIA_CONFIG", `Cannot read media config: ${error.message}`)
  }
  if (
    config?.version !== 1 ||
    typeof config.localAssetRoot !== "string" ||
    typeof config.manifestRoot !== "string" ||
    typeof config.oss?.bucket !== "string" ||
    typeof config.oss?.region !== "string" ||
    typeof config.oss?.endpoint !== "string" ||
    typeof config.oss?.publicBaseUrl !== "string" ||
    !config.oss.publicBaseUrl.startsWith("https://") ||
    config.oss.objectAcl !== "public-read" ||
    !config.allowedMedia ||
    typeof config.allowedMedia !== "object"
  ) {
    throw new MediaPublishError("E_MEDIA_CONFIG", "publishing/media.config.json is invalid")
  }
  return { root, config }
}

function frontmatterRid(markdown) {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)
  if (!match) throw new MediaPublishError("E_MEDIA_RID", "The note has no YAML frontmatter")
  const rid = match[1].match(/^rid:\s*["']?([^"'\s]+)["']?\s*$/m)?.[1]
  if (!RID_PATTERN.test(rid ?? "")) {
    throw new MediaPublishError("E_MEDIA_RID", "The note does not have a canonical RID")
  }
  return { rid, frontmatterEnd: match[0].length }
}

function referenceSpans(markdown, frontmatterEnd) {
  const spans = []
  const patterns = [
    /!\[[^\]]*\]\(\s*(?:<(?<angle>[^>]+)>|(?<plain>[^\s)]+))(?:\s+["'][^)]*["'])?\s*\)/g,
    /!\[\[(?<wiki>[^\]|#]+)(?:#[^\]|]*)?(?:\|[^\]]*)?\]\]/g,
    /<img\b[^>]*?\bsrc\s*=\s*(?:"(?<double>[^"]+)"|'(?<single>[^']+)')[^>]*>/gi,
  ]
  for (const pattern of patterns) {
    for (const match of markdown.matchAll(pattern)) {
      const target = match.groups?.angle ?? match.groups?.plain ?? match.groups?.wiki ?? match.groups?.double ?? match.groups?.single
      if (!target || REMOTE_PATTERN.test(target.trim())) continue
      const offset = match[0].indexOf(target)
      spans.push({ start: match.index + offset, end: match.index + offset + target.length, target: target.trim() })
    }
  }

  const frontmatter = markdown.slice(0, frontmatterEnd)
  const coverPattern = /^cover:\s*(?:"(?<double>[^"]+)"|'(?<single>[^']+)'|(?<plain>[^\s]+))\s*$/gm
  for (const match of frontmatter.matchAll(coverPattern)) {
    const target = match.groups?.double ?? match.groups?.single ?? match.groups?.plain
    if (!target || REMOTE_PATTERN.test(target.trim())) continue
    const offset = match[0].indexOf(target)
    spans.push({ start: match.index + offset, end: match.index + offset + target.length, target: target.trim() })
  }

  spans.sort((a, b) => a.start - b.start)
  for (let index = 1; index < spans.length; index += 1) {
    if (spans[index].start < spans[index - 1].end) {
      throw new MediaPublishError("E_MEDIA_PARSE", "Overlapping media references are not supported")
    }
  }
  return spans
}

async function findByBasename(root, basename) {
  const matches = []
  async function visit(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) await visit(target)
      else if (entry.isFile() && entry.name === basename) matches.push(target)
    }
  }
  await visit(root)
  return matches
}

async function resolveReference({ root, assetRoot, notePath, target }) {
  let decoded
  try {
    decoded = decodeURIComponent(target).replaceAll("\\", "/")
  } catch {
    throw new MediaPublishError("E_MEDIA_PATH", `Invalid encoded media path: ${target}`)
  }
  if (path.isAbsolute(decoded) || /^[a-z]:/i.test(decoded)) {
    throw new MediaPublishError("E_MEDIA_ESCAPE", `Absolute media path is forbidden: ${target}`)
  }
  const withoutQuery = decoded.split(/[?#]/, 1)[0]
  let candidates
  if (!withoutQuery.includes("/")) {
    candidates = await findByBasename(assetRoot, withoutQuery)
  } else {
    candidates = [path.resolve(path.dirname(notePath), ...withoutQuery.split("/"))]
  }
  candidates = candidates.filter((candidate) => isInside(assetRoot, candidate))
  if (candidates.length === 0) {
    throw new MediaPublishError("E_MEDIA_MISSING", `Media file not found under ${path.relative(root, assetRoot)}: ${target}`)
  }
  if (candidates.length > 1) {
    throw new MediaPublishError("E_MEDIA_AMBIGUOUS", `Media filename is ambiguous: ${target}`)
  }
  const candidate = candidates[0]
  if (!(await exists(candidate))) {
    throw new MediaPublishError("E_MEDIA_MISSING", `Media file does not exist: ${target}`)
  }
  const assetReal = await fs.realpath(assetRoot)
  const candidateReal = await fs.realpath(candidate)
  if (!isInside(assetReal, candidateReal)) {
    throw new MediaPublishError("E_MEDIA_ESCAPE", `Media file escapes the configured root: ${target}`)
  }
  const stat = await fs.stat(candidateReal)
  if (!stat.isFile()) throw new MediaPublishError("E_MEDIA_TYPE", `Media reference is not a file: ${target}`)
  return { absolutePath: candidateReal, relativePath: path.relative(root, candidateReal).replaceAll("\\", "/") }
}

async function hashFile(file) {
  const hash = createHash("sha256")
  await new Promise((resolve, reject) => {
    const stream = createReadStream(file)
    stream.on("data", (chunk) => hash.update(chunk))
    stream.on("error", reject)
    stream.on("end", resolve)
  })
  return hash.digest("hex")
}

export async function planMedia(rootInput, noteInput) {
  const { root, config } = await loadMediaConfig(rootInput)
  const notePath = path.resolve(root, noteInput)
  if (!isInside(root, notePath) || path.extname(notePath).toLowerCase() !== ".md") {
    throw new MediaPublishError("E_MEDIA_NOTE", "The note must be a Markdown file inside the repository")
  }
  const noteText = await fs.readFile(notePath, "utf8")
  const { rid, frontmatterEnd } = frontmatterRid(noteText)
  const spans = referenceSpans(noteText, frontmatterEnd)
  const assetRoot = path.resolve(root, config.localAssetRoot)
  const assetRootReal = await fs.realpath(assetRoot)
  const byPath = new Map()
  const references = []

  for (const span of spans) {
    const resolved = await resolveReference({ root, assetRoot: assetRootReal, notePath, target: span.target })
    let asset = byPath.get(resolved.absolutePath)
    if (!asset) {
      const sourceExtension = path.extname(resolved.absolutePath).toLowerCase()
      const mimeType = config.allowedMedia[sourceExtension]
      if (!mimeType) throw new MediaPublishError("E_MEDIA_TYPE", `Unsupported media extension: ${sourceExtension}`)
      const sha256 = await hashFile(resolved.absolutePath)
      const extension = normalizeExtension(sourceExtension)
      const objectKey = config.oss.objectPattern
        .replace("{sha256Prefix}", sha256.slice(0, 2))
        .replace("{sha256}", sha256)
        .replace("{extension}", extension)
      asset = {
        sourcePath: resolved.relativePath,
        absolutePath: resolved.absolutePath,
        sha256,
        size: (await fs.stat(resolved.absolutePath)).size,
        mimeType,
        objectKey,
        url: `${config.oss.publicBaseUrl.replace(/\/+$/, "")}/${objectKey}`,
      }
      byPath.set(resolved.absolutePath, asset)
    }
    references.push({ ...span, asset })
  }

  return {
    root,
    config,
    notePath,
    noteRelativePath: path.relative(root, notePath).replaceAll("\\", "/"),
    noteText,
    rid,
    assets: [...byPath.values()].sort((a, b) => a.objectKey.localeCompare(b.objectKey)),
    references,
  }
}

function rewriteNote(plan) {
  let result = plan.noteText
  for (const reference of [...plan.references].sort((a, b) => b.start - a.start)) {
    result = `${result.slice(0, reference.start)}${reference.asset.url}${result.slice(reference.end)}`
  }
  return result
}

function isMissingObject(error) {
  return error?.status === 404 || error?.code === "NoSuchKey" || error?.name === "NoSuchKeyError"
}

function headMetadata(head) {
  const headers = head?.res?.headers ?? head?.headers ?? {}
  return {
    sha256: head?.meta?.sha256 ?? headers["x-oss-meta-sha256"],
    size: Number(head?.size ?? headers["content-length"]),
  }
}

async function ensureRemoteAsset(client, asset, config) {
  let existing
  try {
    existing = await client.head(asset.objectKey)
  } catch (error) {
    if (!isMissingObject(error)) throw error
  }
  if (existing) {
    const metadata = headMetadata(existing)
    if (metadata.sha256 !== asset.sha256 || metadata.size !== asset.size) {
      throw new MediaPublishError("E_MEDIA_REMOTE_CONFLICT", `Existing OSS object failed integrity checks: ${asset.objectKey}`)
    }
  } else {
    await client.put(asset.objectKey, asset.absolutePath, {
      headers: {
        "Content-Type": asset.mimeType,
        "Content-Disposition": config.oss.headers["Content-Disposition"],
        "Cache-Control": config.oss.headers["Cache-Control"],
        "x-oss-forbid-overwrite": "true",
      },
      meta: { sha256: asset.sha256 },
    })
  }
  await client.putACL(asset.objectKey, config.oss.objectAcl)
  return { uploaded: !existing }
}

async function verifyPublicAsset(asset, fetchImpl, attempts = 3) {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetchImpl(asset.url, { method: "HEAD", redirect: "follow", cache: "no-store" })
      const contentLength = Number(response.headers.get("content-length"))
      const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase()
      const disposition = response.headers.get("content-disposition")?.toLowerCase()
      if (response.ok && contentLength === asset.size && contentType === asset.mimeType && disposition !== "attachment") {
        return
      }
      lastError = new MediaPublishError("E_MEDIA_PUBLIC_VERIFY", `Public OSS verification failed: ${asset.url}`, {
        status: response.status,
        contentLength,
        contentType,
        disposition,
      })
    } catch (error) {
      lastError = error
    }
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 250))
  }
  throw lastError
}

async function commitLocalState(plan, rewritten, manifest) {
  const manifestRoot = path.resolve(plan.root, plan.config.manifestRoot)
  if (!isInside(plan.root, manifestRoot)) throw new MediaPublishError("E_MEDIA_CONFIG", "Unsafe manifest root")
  await fs.mkdir(manifestRoot, { recursive: true })
  const manifestPath = path.join(manifestRoot, `${plan.rid}.json`)
  const transaction = randomUUID()
  const noteTemp = `${plan.notePath}.tmp-${transaction}`
  const noteBackup = `${plan.notePath}.backup-${transaction}`
  const manifestTemp = `${manifestPath}.tmp-${transaction}`
  const manifestBackup = `${manifestPath}.backup-${transaction}`
  const hadManifest = await exists(manifestPath)
  await fs.writeFile(noteTemp, rewritten, "utf8")
  await fs.writeFile(manifestTemp, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")
  let noteMoved = false
  let manifestMoved = false
  try {
    await fs.rename(plan.notePath, noteBackup)
    noteMoved = true
    await fs.rename(noteTemp, plan.notePath)
    if (hadManifest) {
      await fs.rename(manifestPath, manifestBackup)
      manifestMoved = true
    }
    await fs.rename(manifestTemp, manifestPath)
    await fs.rm(noteBackup, { force: true })
    if (manifestMoved) await fs.rm(manifestBackup, { force: true })
  } catch (error) {
    await fs.rm(noteTemp, { force: true })
    await fs.rm(manifestTemp, { force: true })
    if (await exists(plan.notePath)) await fs.rm(plan.notePath, { force: true })
    if (noteMoved && (await exists(noteBackup))) await fs.rename(noteBackup, plan.notePath)
    if (manifestMoved && (await exists(manifestBackup))) {
      if (await exists(manifestPath)) await fs.rm(manifestPath, { force: true })
      await fs.rename(manifestBackup, manifestPath)
    }
    throw new MediaPublishError("E_MEDIA_COMMIT", `Failed to commit Markdown and manifest: ${error.message}`)
  }
  return manifestPath
}

export async function publishMedia(rootInput, noteInput, options = {}) {
  const plan = await planMedia(rootInput, noteInput)
  if (options.dryRun || plan.assets.length === 0) {
    return {
      status: plan.assets.length === 0 ? "noop" : "dry-run",
      note: plan.noteRelativePath,
      rid: plan.rid,
      assets: plan.assets.map(({ absolutePath, ...asset }) => asset),
    }
  }
  if (!options.client) throw new MediaPublishError("E_MEDIA_CLIENT", "An OSS client is required")
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  if (typeof fetchImpl !== "function") throw new MediaPublishError("E_MEDIA_CLIENT", "A fetch implementation is required")

  const concurrency = Math.max(1, Math.min(Number(options.concurrency ?? 6), 8))
  let uploaded = 0
  for (let index = 0; index < plan.assets.length; index += concurrency) {
    const group = plan.assets.slice(index, index + concurrency)
    const results = await Promise.all(group.map(async (asset) => {
      const result = await ensureRemoteAsset(options.client, asset, plan.config)
      await verifyPublicAsset(asset, fetchImpl)
      return result
    }))
    uploaded += results.filter((result) => result.uploaded).length
  }

  const publishedAt = (options.now ?? (() => new Date().toISOString()))()
  const manifest = {
    version: 1,
    rid: plan.rid,
    note: plan.noteRelativePath,
    publishedAt,
    assets: plan.assets.map(({ absolutePath, ...asset }) => asset),
  }
  const manifestPath = await commitLocalState(plan, rewriteNote(plan), manifest)
  return {
    status: "published",
    note: plan.noteRelativePath,
    rid: plan.rid,
    uploaded,
    reused: plan.assets.length - uploaded,
    manifest: path.relative(plan.root, manifestPath).replaceAll("\\", "/"),
    assets: manifest.assets,
  }
}

export async function mediaStatus(rootInput, noteInput) {
  const plan = await planMedia(rootInput, noteInput)
  const manifestPath = path.resolve(plan.root, plan.config.manifestRoot, `${plan.rid}.json`)
  if (plan.assets.length > 0) {
    return {
      status: "pending",
      note: plan.noteRelativePath,
      rid: plan.rid,
      localReferences: plan.references.length,
      uniqueAssets: plan.assets.length,
    }
  }
  if (!(await exists(manifestPath))) {
    return {
      status: "no-media",
      note: plan.noteRelativePath,
      rid: plan.rid,
      localReferences: 0,
      uniqueAssets: 0,
    }
  }
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"))
  const missingUrls = (manifest.assets ?? [])
    .map((asset) => asset.url)
    .filter((url) => typeof url !== "string" || !plan.noteText.includes(url))
  return {
    status: missingUrls.length === 0 ? "published" : "drift",
    note: plan.noteRelativePath,
    rid: plan.rid,
    localReferences: 0,
    uniqueAssets: manifest.assets?.length ?? 0,
    manifest: path.relative(plan.root, manifestPath).replaceAll("\\", "/"),
    missingUrls,
  }
}

export async function verifyMediaManifests(rootInput, options = {}) {
  const { root, config } = await loadMediaConfig(rootInput)
  const manifestRoot = path.resolve(root, config.manifestRoot)
  if (!(await exists(manifestRoot))) return { ok: true, checked: 0, failures: [] }
  const fetchImpl = options.fetchImpl ?? globalThis.fetch
  const failures = []
  const assets = []
  for (const entry of await fs.readdir(manifestRoot, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) continue
    const manifest = JSON.parse(await fs.readFile(path.join(manifestRoot, entry.name), "utf8"))
    for (const asset of manifest.assets ?? []) {
      assets.push({ manifest: entry.name, asset })
    }
  }
  const concurrency = Math.max(1, Math.min(Number(options.concurrency ?? 12), 24))
  for (let index = 0; index < assets.length; index += concurrency) {
    const group = assets.slice(index, index + concurrency)
    const results = await Promise.all(group.map(async ({ manifest, asset }) => {
      try {
        await verifyPublicAsset(asset, fetchImpl)
        return null
      } catch (error) {
        return { manifest, url: asset.url, code: error.code ?? "E_MEDIA_VERIFY" }
      }
    }))
    for (const failure of results) {
      if (failure) failures.push(failure)
    }
  }
  return { ok: failures.length === 0, checked: assets.length, failures }
}

export async function listMediaNotes(rootInput) {
  const { root, config } = await loadMediaConfig(rootInput)
  const sourceRoot = path.resolve(root, "clips")
  const notes = []
  async function visit(current) {
    for (const entry of await fs.readdir(current, { withFileTypes: true })) {
      const target = path.join(current, entry.name)
      if (entry.isDirectory()) {
        if (path.resolve(target) !== path.resolve(root, config.localAssetRoot)) await visit(target)
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".md") {
        notes.push(path.relative(root, target).replaceAll("\\", "/"))
      }
    }
  }
  await visit(sourceRoot)
  return notes.sort((a, b) => a.localeCompare(b, "zh-CN"))
}

export async function planAllMedia(rootInput) {
  const notes = await listMediaNotes(rootInput)
  const plans = []
  for (const note of notes) plans.push(await planMedia(rootInput, note))
  return {
    notesScanned: notes.length,
    notesPending: plans.filter((plan) => plan.assets.length > 0).length,
    localReferences: plans.reduce((sum, plan) => sum + plan.references.length, 0),
    uniqueAssetsByNote: plans.reduce((sum, plan) => sum + plan.assets.length, 0),
    totalBytesByNote: plans.reduce(
      (sum, plan) => sum + plan.assets.reduce((assetSum, asset) => assetSum + asset.size, 0),
      0,
    ),
    plans,
  }
}

export async function publishAllMedia(rootInput, options = {}) {
  const batch = await planAllMedia(rootInput)
  const pending = batch.plans.filter((plan) => plan.assets.length > 0)
  if (options.dryRun) {
    return {
      status: "dry-run",
      notesScanned: batch.notesScanned,
      notesPending: pending.length,
      localReferences: batch.localReferences,
      uniqueAssetsByNote: batch.uniqueAssetsByNote,
      totalBytesByNote: batch.totalBytesByNote,
      notes: pending.map((plan) => ({
        note: plan.noteRelativePath,
        rid: plan.rid,
        localReferences: plan.references.length,
        uniqueAssets: plan.assets.length,
        bytes: plan.assets.reduce((sum, asset) => sum + asset.size, 0),
      })),
    }
  }
  const results = []
  for (const plan of pending) {
    const result = await publishMedia(rootInput, plan.noteRelativePath, options)
    results.push(result)
    options.onProgress?.({
      completed: results.length,
      total: pending.length,
      note: result.note,
      uploaded: result.uploaded,
      reused: result.reused,
    })
  }
  return {
    status: "published",
    notesScanned: batch.notesScanned,
    notesPublished: results.length,
    uploaded: results.reduce((sum, result) => sum + result.uploaded, 0),
    reused: results.reduce((sum, result) => sum + result.reused, 0),
    results,
  }
}
