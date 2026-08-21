#!/usr/bin/env node
import path from "node:path"

import OSS from "ali-oss"

import {
  MediaPublishError,
  loadMediaConfig,
  mediaStatus,
  planAllMedia,
  planMedia,
  publishAllMedia,
  publishMedia,
  verifyMediaManifests,
} from "./media.mjs"
import { OssutilClient } from "./ossutil-client.mjs"

const ROOT = path.resolve(process.env.WEB_CLIPS_VAULT_ROOT || process.cwd())

function usage() {
  return `Usage:
  node publishing/media-cli.mjs check <note>
  node publishing/media-cli.mjs check --all
  node publishing/media-cli.mjs publish <note> [--dry-run]
  node publishing/media-cli.mjs publish --all [--dry-run]
  node publishing/media-cli.mjs status <note>
  node publishing/media-cli.mjs verify
`
}

function createClient(config) {
  const accessKeyId = process.env.OSS_ACCESS_KEY_ID
  const accessKeySecret = process.env.OSS_ACCESS_KEY_SECRET
  if (!accessKeyId || !accessKeySecret) {
    return new OssutilClient({ bucket: config.oss.bucket, endpoint: config.oss.endpoint })
  }
  return new OSS({
    region: config.oss.region,
    endpoint: config.oss.endpoint,
    bucket: config.oss.bucket,
    accessKeyId,
    accessKeySecret,
    stsToken: process.env.OSS_STS_TOKEN,
    authorizationV4: true,
    secure: true,
  })
}

async function main(argv) {
  const [command, note, ...flags] = argv
  if (command === "check" && note === "--all") {
    const batch = await planAllMedia(ROOT)
    return {
      status: "ok",
      notesScanned: batch.notesScanned,
      notesPending: batch.notesPending,
      localReferences: batch.localReferences,
      uniqueAssetsByNote: batch.uniqueAssetsByNote,
      totalBytesByNote: batch.totalBytesByNote,
    }
  }
  if (command === "status") {
    if (!note) throw new MediaPublishError("E_MEDIA_USAGE", usage())
    return mediaStatus(ROOT, note)
  }
  if (command === "check") {
    if (!note) throw new MediaPublishError("E_MEDIA_USAGE", usage())
    const plan = await planMedia(ROOT, note)
    return {
      status: "ok",
      note: plan.noteRelativePath,
      rid: plan.rid,
      localReferences: plan.references.length,
      uniqueAssets: plan.assets.length,
      assets: plan.assets.map(({ absolutePath, ...asset }) => asset),
    }
  }
  if (command === "publish") {
    if (!note) throw new MediaPublishError("E_MEDIA_USAGE", usage())
    const dryRun = flags.includes("--dry-run")
    if (note === "--all") {
      const { config } = await loadMediaConfig(ROOT)
      return publishAllMedia(ROOT, {
        dryRun,
        client: dryRun ? undefined : createClient(config),
        onProgress: dryRun ? undefined : (progress) => {
          process.stderr.write(`${JSON.stringify({ status: "progress", ...progress })}\n`)
        },
      })
    }
    const plan = await planMedia(ROOT, note)
    return publishMedia(ROOT, note, {
      dryRun,
      client: dryRun || plan.assets.length === 0 ? undefined : createClient(plan.config),
    })
  }
  if (command === "verify") return verifyMediaManifests(ROOT)
  throw new MediaPublishError("E_MEDIA_USAGE", usage())
}

main(process.argv.slice(2)).then(
  (result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    if (result?.ok === false) process.exitCode = 3
  },
  (error) => {
    const code = error instanceof MediaPublishError ? error.code : "E_MEDIA_INTERNAL"
    process.stderr.write(`${JSON.stringify({ status: "error", code, message: error.message })}\n`)
    process.exitCode = code === "E_MEDIA_USAGE" ? 2 : 3
  },
)
