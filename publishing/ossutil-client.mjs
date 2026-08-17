import { spawn } from "node:child_process"

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout.setEncoding("utf8")
    child.stderr.setEncoding("utf8")
    child.stdout.on("data", (chunk) => { stdout += chunk })
    child.stderr.on("data", (chunk) => { stderr += chunk })
    child.on("error", reject)
    child.on("close", (code) => {
      const output = `${stdout}\n${stderr}`.trim()
      if (code === 0) resolve({ stdout, stderr })
      else reject(Object.assign(new Error(output || `ossutil exited with ${code}`), { exitCode: code, output }))
    })
  })
}

function field(output, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return output.match(new RegExp(`^${escaped}\\s*:\\s*(.+?)\\s*$`, "im"))?.[1]
}

export class OssutilClient {
  constructor({ bucket, endpoint, executable = process.env.OSSUTIL_PATH || "ossutil" }) {
    this.bucket = bucket
    this.endpoint = endpoint
    this.executable = executable
  }

  url(key) {
    return `oss://${this.bucket}/${key}`
  }

  async head(key) {
    try {
      const result = await run(this.executable, ["stat", this.url(key), "--endpoint", this.endpoint])
      const size = Number(field(result.stdout, "Content-Length"))
      const sha256 = field(result.stdout, "X-Oss-Meta-Sha256")
      return { size, meta: { sha256 }, res: { headers: { "content-length": String(size), "x-oss-meta-sha256": sha256 } } }
    } catch (error) {
      if (/\b404\b|NoSuchKey|not exist/i.test(error.output ?? error.message)) {
        throw Object.assign(error, { status: 404, code: "NoSuchKey" })
      }
      throw error
    }
  }

  async put(key, file, options = {}) {
    const metadata = {
      ...options.headers,
      "X-Oss-Meta-Sha256": options.meta?.sha256,
    }
    const meta = Object.entries(metadata)
      .filter(([, value]) => value !== undefined)
      .map(([name, value]) => `${name}:${value}`)
      .join("#")
    return run(this.executable, [
      "cp",
      file,
      this.url(key),
      "--endpoint",
      this.endpoint,
      "--meta",
      meta,
    ])
  }

  async putACL(key, acl) {
    return run(this.executable, ["set-acl", this.url(key), acl, "--endpoint", this.endpoint])
  }
}
