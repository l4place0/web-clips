import assert from "node:assert/strict"
import crypto from "node:crypto"
import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import test from "node:test"
import { planIncrementalSync, syncInternals } from "./core.mjs"

const execFileAsync = promisify(execFile)
const sourceConfig = path.resolve("publishing/config.json")

function hash(value) {
  return crypto.createHash("sha256").update(value).digest("hex")
}

async function write(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, value)
  const old = new Date(Date.now() - 120_000)
  await fs.utimes(file, old, old)
}

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "web-clips-sync-"))
  await fs.mkdir(path.join(root, "publishing"), { recursive: true })
  await fs.copyFile(sourceConfig, path.join(root, "publishing", "config.json"))
  await write(
    path.join(root, "publishing", "registry.json"),
    `${JSON.stringify({ version: 1, resources: {}, events: [] })}\n`,
  )
  await write(
    path.join(root, "publishing", "manifest.json"),
    `${JSON.stringify({ version: 1, generatedAt: null, resources: [] })}\n`,
  )
  return root
}

async function git(root, ...args) {
  return execFileAsync("git", ["-c", `safe.directory=${root.split(path.sep).join("/")}`, "-C", root, ...args], {
    encoding: "utf8",
    windowsHide: true,
  })
}

async function initGit(root) {
  await git(root, "init", "-b", "main")
  await git(root, "config", "user.name", "Sync Test")
  await git(root, "config", "user.email", "sync@example.invalid")
}

test("first run plans every root clip but excludes README and nested project Markdown", async (t) => {
  const root = await fixture()
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await write(path.join(root, "a.md"), "# A\n")
  await write(path.join(root, "b.md"), "# B\n")
  await write(path.join(root, "README.md"), "# Project\n")
  await write(path.join(root, "docs", "README.md"), "# Nested project\n")
  const plan = await planIncrementalSync(root)
  assert.deepEqual(plan.changedNotes, ["a.md", "b.md"])
  assert.equal(plan.initialized, false)
})

test("single-note modification is the only note delta and repeat run is zero-change", async (t) => {
  const root = await fixture()
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const a = "---\nrid: 11111111-1111-4111-8111-111111111111\npublish: true\n---\nA\n"
  const b = "---\nrid: 22222222-2222-4222-8222-222222222222\npublish: true\n---\nB\n"
  await write(path.join(root, "a.md"), a)
  await write(path.join(root, "b.md"), b)
  const state = {
    version: 1,
    resources: {
      "11111111-1111-4111-8111-111111111111": {
        sourcePath: "a.md",
        published: true,
        noteSha256: hash(Buffer.from(a)),
        assets: {},
      },
      "22222222-2222-4222-8222-222222222222": {
        sourcePath: "b.md",
        published: true,
        noteSha256: hash(Buffer.from(b)),
        assets: {},
      },
    },
  }
  await write(path.join(root, "publishing", "sync-state.json"), `${JSON.stringify(state)}\n`)
  assert.equal((await planIncrementalSync(root)).hasChanges, false)
  await write(path.join(root, "a.md"), `${a}changed\n`)
  const changed = await planIncrementalSync(root)
  assert.deepEqual(changed.changedNotes, ["a.md"])
  assert.deepEqual(changed.affectedNotes, ["a.md"])
})

test("recent half-written note is deferred before any mutation", async (t) => {
  const root = await fixture()
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await fs.writeFile(path.join(root, "new.md"), "---\ntitle:")
  const plan = await planIncrementalSync(root, { quietMs: 30_000 })
  assert.equal(plan.deferred[0].path, "new.md")
  assert.equal(plan.deferred[0].reason, "quiet-window")
})

test("deleted and explicit cancellation are incremental note deltas", async (t) => {
  const root = await fixture()
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const oldA = "---\nrid: 11111111-1111-4111-8111-111111111111\npublish: true\n---\nA\n"
  const oldB = "---\nrid: 22222222-2222-4222-8222-222222222222\npublish: true\n---\nB\n"
  const canceledB = oldB.replace("publish: true", "publish: false")
  await write(path.join(root, "b.md"), canceledB)
  await write(
    path.join(root, "publishing", "sync-state.json"),
    `${JSON.stringify({
      version: 1,
      resources: {
        "11111111-1111-4111-8111-111111111111": {
          sourcePath: "a.md",
          published: true,
          noteSha256: hash(Buffer.from(oldA)),
          assets: {},
        },
        "22222222-2222-4222-8222-222222222222": {
          sourcePath: "b.md",
          published: true,
          noteSha256: hash(Buffer.from(oldB)),
          assets: {},
        },
      },
    })}\n`,
  )
  const plan = await planIncrementalSync(root)
  assert.deepEqual(plan.deletedNotes, ["a.md"])
  assert.deepEqual(plan.changedNotes, ["b.md"])
})

test("attachment change is detected and missing attachment fails closed", async (t) => {
  const root = await fixture()
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const note = "---\nrid: 11111111-1111-4111-8111-111111111111\npublish: true\n---\nA\n"
  await write(path.join(root, "a.md"), note)
  await write(path.join(root, "assets", "a.png"), Buffer.from("old"))
  const state = {
    version: 1,
    resources: {
      "11111111-1111-4111-8111-111111111111": {
        sourcePath: "a.md",
        published: true,
        noteSha256: hash(Buffer.from(note)),
        assets: { "assets/a.png": hash(Buffer.from("old")) },
      },
    },
  }
  await write(path.join(root, "publishing", "sync-state.json"), `${JSON.stringify(state)}\n`)
  await write(path.join(root, "assets", "a.png"), Buffer.from("new"))
  assert.deepEqual((await planIncrementalSync(root)).changedAssets, ["assets/a.png"])
  await fs.rm(path.join(root, "assets", "a.png"))
  const missing = await planIncrementalSync(root)
  assert.deepEqual(missing.missingAssets, ["assets/a.png"])
})

test("lock admits only one process and releases by ownership", async (t) => {
  const root = await fixture()
  const local = await fs.mkdtemp(path.join(os.tmpdir(), "web-clips-sync-local-"))
  const previous = process.env.WEB_CLIPS_SYNC_LOCAL_ROOT
  process.env.WEB_CLIPS_SYNC_LOCAL_ROOT = local
  t.after(async () => {
    if (previous === undefined) delete process.env.WEB_CLIPS_SYNC_LOCAL_ROOT
    else process.env.WEB_CLIPS_SYNC_LOCAL_ROOT = previous
    await fs.rm(root, { recursive: true, force: true })
    await fs.rm(local, { recursive: true, force: true })
  })
  const release = await syncInternals.acquireLock(root)
  assert.equal(typeof release, "function")
  assert.equal(await syncInternals.acquireLock(root), null)
  await release()
  const releaseAgain = await syncInternals.acquireLock(root)
  assert.equal(typeof releaseAgain, "function")
  await releaseAgain()
})

test("secret scanner blocks strong tokens but ignores placeholders", () => {
  const token = `ghp_${"A".repeat(24)}`
  assert.equal(
    syncInternals.scanSecrets([{ path: "a.md", buffer: Buffer.from(`token=${token}`) }]).length,
    1,
  )
  assert.equal(
    syncInternals.scanSecrets([
      { path: "a.md", buffer: Buffer.from("token=${GITHUB_TOKEN}\npassword=<your-password>") },
    ]).length,
    0,
  )
})

test("non-content dirty files block, while explicit staging is a minimal delta", async (t) => {
  const root = await fixture()
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  await initGit(root)
  await write(path.join(root, "a.md"), "A\n")
  await write(path.join(root, "b.md"), "B\n")
  await write(path.join(root, "assets", "a.png"), Buffer.from("image"))
  await write(path.join(root, "site", "code.mjs"), "export {}\n")
  await git(root, "add", ".")
  await git(root, "commit", "-m", "base")
  await write(path.join(root, "a.md"), "A changed\n")
  await write(path.join(root, "site", "code.mjs"), "export const changed = true\n")
  await assert.rejects(
    syncInternals.assertSafeWorktree(root, new Set(["a.md", "b.md"])),
    /non-content changes/,
  )
  await git(root, "restore", "site/code.mjs")
  const expected = new Set(["a.md", "publishing/sync-state.json"])
  await write(path.join(root, "publishing", "sync-state.json"), "{}\n")
  const staged = await syncInternals.stageAndVerify(root, expected)
  assert.deepEqual(staged, ["a.md", "publishing/sync-state.json"])
  const unchanged = (await git(root, "diff", "--cached", "--name-only")).stdout
  assert.doesNotMatch(unchanged, /b\.md|assets\/a\.png/)
})

async function createRemoteFixture() {
  const base = await fs.mkdtemp(path.join(os.tmpdir(), "web-clips-sync-git-"))
  const bare = path.join(base, "remote.git")
  const local = path.join(base, "local")
  const other = path.join(base, "other")
  await execFileAsync("git", ["init", "--bare", bare])
  await execFileAsync("git", ["clone", bare, local])
  await git(local, "config", "user.name", "Sync Test")
  await git(local, "config", "user.email", "sync@example.invalid")
  await write(path.join(local, "base.txt"), "base\n")
  await git(local, "add", "base.txt")
  await git(local, "commit", "-m", "base")
  await git(local, "branch", "-M", "main")
  await git(local, "push", "-u", "origin", "main")
  await execFileAsync("git", ["--git-dir", bare, "symbolic-ref", "HEAD", "refs/heads/main"])
  await execFileAsync("git", ["clone", bare, other])
  await git(other, "config", "user.name", "Other Test")
  await git(other, "config", "user.email", "other@example.invalid")
  return { base, bare, local, other }
}

test("push failure preserves the local sync commit for a later retry", async (t) => {
  const item = await createRemoteFixture()
  t.after(() => fs.rm(item.base, { recursive: true, force: true }))
  await write(path.join(item.local, "delta.txt"), "delta\n")
  await git(item.local, "add", "delta.txt")
  await git(item.local, "commit", "-m", "sync(web-clips): test retry")
  const head = (await git(item.local, "rev-parse", "HEAD")).stdout.trim()
  await git(item.local, "config", "remote.origin.pushurl", path.join(item.base, "missing.git"))
  await assert.rejects(syncInternals.assertOrRecoverRemote(item.local), /git failed/)
  assert.equal((await git(item.local, "rev-parse", "HEAD")).stdout.trim(), head)
})

test("remote divergence is blocked without merge or rebase", async (t) => {
  const item = await createRemoteFixture()
  t.after(() => fs.rm(item.base, { recursive: true, force: true }))
  await write(path.join(item.local, "local.txt"), "local\n")
  await git(item.local, "add", "local.txt")
  await git(item.local, "commit", "-m", "sync(web-clips): local")
  await write(path.join(item.other, "remote.txt"), "remote\n")
  await git(item.other, "add", "remote.txt")
  await git(item.other, "commit", "-m", "remote")
  await git(item.other, "push", "origin", "main")
  await assert.rejects(syncInternals.assertOrRecoverRemote(item.local), /diverged/)
})
