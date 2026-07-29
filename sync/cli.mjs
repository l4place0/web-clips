#!/usr/bin/env node

import path from "node:path"
import process from "node:process"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { syncCheck, syncNow } from "./core.mjs"

const execFileAsync = promisify(execFile)
const TASK_NAME = "WebClipsAutoSync"

function parse(argv) {
  const args = [...argv]
  let root = process.cwd()
  const rootIndex = args.indexOf("--root")
  if (rootIndex >= 0) {
    root = path.resolve(args[rootIndex + 1])
    args.splice(rootIndex, 2)
  }
  return { root, command: args[0], args: args.slice(1) }
}

async function powershell(root, action) {
  const script = path.join(root, "sync", "task.ps1")
  const executable =
    process.env.SystemRoot
      ? path.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
      : "powershell.exe"
  try {
    const result = await execFileAsync(
      executable,
      ["-NoLogo", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", script, action, "-Repository", root],
      { cwd: root, windowsHide: true, encoding: "utf8", maxBuffer: 1024 * 1024 },
    )
    const output = result.stdout.trim()
    return output ? JSON.parse(output) : { ok: true, action }
  } catch (error) {
    const detail = (error.stderr || error.stdout || error.message).trim()
    throw new Error(`scheduled task ${action} failed: ${detail}`)
  }
}

async function main() {
  const parsed = parse(process.argv.slice(2))
  if (parsed.command === "check" && parsed.args.length === 0) return syncCheck(parsed.root)
  if (parsed.command === "now" && parsed.args.every((item) => item === "--scheduled")) {
    return syncNow(parsed.root)
  }
  if (parsed.command === "install" && parsed.args.length === 0) return powershell(parsed.root, "install")
  if (parsed.command === "status" && parsed.args.length === 0) return powershell(parsed.root, "status")
  if (parsed.command === "pause" && parsed.args.length === 0) return powershell(parsed.root, "pause")
  if (parsed.command === "resume" && parsed.args.length === 0) return powershell(parsed.root, "resume")
  if (parsed.command === "run-task" && parsed.args.length === 0) return powershell(parsed.root, "run")
  if (parsed.command === "uninstall" && parsed.args.length === 0) return powershell(parsed.root, "uninstall")
  return {
    ok: false,
    error: `Usage: sync <check|now|install|status|pause|resume|run-task|uninstall> [--root <workspace>]`,
    taskName: TASK_NAME,
    exitCode: 2,
  }
}

try {
  const result = await main()
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
  process.exitCode = result.exitCode ?? (result.ok ? 0 : 1)
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: error.message }, null, 2)}\n`)
  process.exitCode = 1
}
