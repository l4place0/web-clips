#!/usr/bin/env node

import path from "node:path"
import process from "node:process"
import { assignId, build, clean, formatFailure, prepareAll, validate } from "./publisher.mjs"

function usage(root) {
  return {
    ok: false,
    error: "Usage: publish <prepare|assign-id <note>|validate|build [--dry-run]|clean> [--root <workspace>]",
    root,
    diagnostics: [
      {
        code: "E_CONFIG_INVALID",
        level: "error",
        path: "publishing/cli.mjs",
        detail: "invalid-cli-usage",
      },
    ],
    exitCode: 2,
  }
}

function parseArguments(argv) {
  const args = [...argv]
  let root = process.cwd()
  const rootIndex = args.indexOf("--root")
  if (rootIndex >= 0) {
    const value = args[rootIndex + 1]
    if (!value) return { error: usage(root) }
    root = path.resolve(value)
    args.splice(rootIndex, 2)
  }
  return { root, args }
}

async function main() {
  const parsed = parseArguments(process.argv.slice(2))
  if (parsed.error) return parsed.error
  const { root, args } = parsed
  const command = args[0]

  if (command === "assign-id" && args.length === 2) {
    return assignId(root, args[1])
  }
  if (command === "prepare" && args.length === 1) {
    return prepareAll(root)
  }
  if (command === "validate" && args.length === 1) {
    return validate(root)
  }
  if (command === "build" && (args.length === 1 || (args.length === 2 && args[1] === "--dry-run"))) {
    return build(root, { dryRun: args[1] === "--dry-run" })
  }
  if (command === "clean" && args.length === 1) {
    return clean(root)
  }
  return usage(root)
}

let result
try {
  result = await main()
} catch (error) {
  result = formatFailure(error)
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
process.exitCode = result.exitCode ?? (result.ok ? 0 : 5)
