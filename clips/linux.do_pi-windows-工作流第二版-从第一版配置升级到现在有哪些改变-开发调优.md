---
Title: "Pi Windows 工作流第二版：从第一版配置升级到现在有哪些改变？ - 开发调优"
Url: "https://linux.do/t/topic/2646075"
Origin: "LINUX DO"
Description: "Pi Windows工作流第二版更新内容：修正模型上下文窗口从1050000改为272000，最大输出128000，主压缩线调整为217600。新增pi-ultra-compact包进行分级压缩，结合原生compaction、pi-observational-memory和context-mode管理上下文。调整pi-permission-system权限策略，全局读工具默认allow，FFF作为额外工具并存。升级前建议查看各组件release和README。"
Tags:
  - "Pi Windows"
  - "工作流升级"
  - "配置更新"
  - "上下文管理"
  - "package改动"
Created: "2026-07-27 17:57:49"
Cover: "https://cdn3.ldstatic.com/original/4X/7/3/5/735fc9259e0a95b5a27e7578c2b6b573d6082c1f.png"
publish: true
rid: "07945d2c-9acb-4b99-ab99-97fd6f8e44dc"
permalink: "/r/07945d2c-9acb-4b99-ab99-97fd6f8e44dc"
webClipUrl: "https://l4place0.github.io/web-clips-publish/r/07945d2c-9acb-4b99-ab99-97fd6f8e44dc"
---

[xk128](https://linux.do/u/xk128) 骐骥驰骋

如果你还没看第一版，建议先回看同系列的 [《Pi 从零安装到入门配置：Windows 实战教程》](https://linux.do/t/topic/2560174)；这版是在经历了 Pi 和 package 迭代，结合第一版的工作流深入体验后遇到的一些问题的迭代更新。不过 package 和 Pi 本体更新很快，升级前仍建议先看各自的 release 和 README。

> 编写时 Pi 版本： `0.81.1`；

## 更正模型窗口和成本

第一版里我直接搬了 GPT-5.6 API 的最大上下文，把 `contextWindow` 写成了 `1050000`。然而许多中转站能不能真按官方 API 全量提供百万窗口。而且现在无论是 OpenAI 和 Pi 都不推荐超过 272k，所以后面经过迭代后把给 GPT-5.6 Luna、Terra、Sol 的信息都改成了 `272000` 上下文、 `128000` 最大输出。

同时调整主压缩线到 `217600`，因为 `272000 × 0.8 = 217600`。

models.json
```json
{
  "providers": {
    "openai": {
      "baseUrl": "<YOUR_OPENAI_COMPAT_BASE_URL>"
    },
    "anthropic": {
      "baseUrl": "<YOUR_ANTHROPIC_COMPAT_BASE_URL>"
    }
  }
}
```

### 上下文管理

现在我通过原生 + 三个额外 package 做上下文压缩管理

- Pi 原生 `compaction` 负责保留最近对话和输出空间；
- [pi-observational-memory](https://github.com/elpapi42/pi-observational-memory) 负责从长过程里提炼可复用的事实和决策；
- [context-mode](https://www.npmjs.com/package/context-mode) 尽量让无关内容别进窗口；
- `pi-ultra-compact` 则在中高占用阶段做分级收缩。

[pi-ultra-compact](https://www.npmjs.com/package/pi-ultra-compact) 是新增的 package，它会依据 Pi 当前模型 metadata 做分级压缩：中段优先丢弃低价值推理和工具输出，高占用时再做完整总结。它补的是长会话中的预压缩和缓存友好整理。

当前 compaction 与 observational-memory 配置
```json
{
  "compaction": {
    "enabled": true,
    "reserveTokens": 32768,
    "keepRecentTokens": 48000
  },
  "observational-memory": {
    "observeAfterTokens": 48000,
    "reflectAfterTokens": 144000,
    "compactAfterTokens": 217600,
    "compactAfterTokensMode": "ratio",
    "compactAfterTokensRatio": 0.8,
    "observationsPoolMaxTokens": 32000,
    "observationsPoolTargetTokens": 16000,
    "agentMaxTurns": 16,
    "model": {
      "provider": "openai",
      "id": "gpt-5.6-luna",
      "thinking": "low"
    },
    "passive": false,
    "debugLog": false
  }
}
```

温馨提醒：模型 id、上下文、输出上限和价格随时可能变，升级前优先看 [Pi 模型目录](https://pi.dev/models)。

## 一些 package 改动

### @gotgenes/pi-permission-system

第一版里我为了让 FFF 接管搜索，把原生 `grep` 和 `find` 直接设成 `deny`。后来发现 Plan Mode、常规只读审查和子agents都需要稳定（或者只支持）原生读工具，按原来设置会直接在plan mode和审核等子agents无法使用相关读工具。因此现在全局读工具默认 allow，FFF 作为额外高性能工具并存。

当前 pi-permission-system 脱敏配置
```json
{
  "$schema": "https://raw.githubusercontent.com/gotgenes/pi-packages/main/packages/pi-permission-system/schemas/permissions.schema.json",
  "debugLog": false,
  "permissionReviewLog": false,
  "yoloMode": false,
  "piInfrastructureReadPaths": [
    "~/.pi/agent",
    "~/.pi/agent/*",
    "~/AppData/Roaming/npm/node_modules/@earendil-works",
    "~/AppData/Roaming/npm/node_modules/@earendil-works/*"
  ],
  "permission": {
    "*": "allow",
    "read": "allow",
    "grep": "allow",
    "find": "allow",
    "ls": "allow",
    "external_directory": {
      "*": "ask",
      "~/.pi/agent": "allow",
      "~/.pi/agent/*": "allow"
    },
    "path": {
      "*": "allow",
      "*.env": "deny",
      "*.env.*": "deny",
      "*.env.example": "allow",
      "~/.ssh/*": "deny",
      "$HOME/.ssh/*": "deny",
      "~/.pi/agent/auth.json": "deny",
      "~/.pi/agent/models.json": "deny",
      "~/.codex/auth.json": "deny"
    },
    "bash": {
      "*": "allow",
      "Remove-Item *": "ask",
      "rm *": "ask",
      "del *": "ask",
      "erase *": "ask",
      "rd *": "ask",
      "rmdir *": "ask",
      "ri *": "ask",
      "mv *": "ask",
      "Move-Item *": "ask",
      "Rename-Item *": "ask",
      "Clear-Content *": "ask",
      "Set-Content *": "ask",
      "Out-File *": "ask",
      "cmd /c del *": "ask",
      "cmd /c erase *": "ask",
      "cmd /c rd *": "ask",
      "cmd /c rmdir *": "ask",
      "cmd.exe /c del *": "ask",
      "cmd.exe /c erase *": "ask",
      "cmd.exe /c rd *": "ask",
      "cmd.exe /c rmdir *": "ask",
      "powershell *Remove-Item*": "ask",
      "powershell.exe *Remove-Item*": "ask",
      "pwsh *Remove-Item*": "ask",
      "pwsh.exe *Remove-Item*": "ask",
      "powershell *Move-Item*": "ask",
      "powershell.exe *Move-Item*": "ask",
      "pwsh *Move-Item*": "ask",
      "pwsh.exe *Move-Item*": "ask",
      "powershell *Rename-Item*": "ask",
      "powershell.exe *Rename-Item*": "ask",
      "pwsh *Rename-Item*": "ask",
      "pwsh.exe *Rename-Item*": "ask",
      "powershell *Clear-Content*": "ask",
      "powershell.exe *Clear-Content*": "ask",
      "pwsh *Clear-Content*": "ask",
      "powershell.exe *Clear-Content*": "ask",
      "pwsh *Set-Content*": "ask",
      "powershell.exe *Set-Content*": "ask",
      "pwsh *Set-Content*": "ask",
      "pwsh.exe *Set-Content*": "ask",
      "powershell *Out-File*": "ask",
      "powershell.exe *Out-File*": "ask",
      "pwsh *Out-File*": "ask",
      "pwsh.exe *Out-File*": "ask",
      "git status": "allow",
      "git status *": "allow",
      "git diff *": "allow",
      "git log *": "allow",
      "git show *": "allow",
      "git blame *": "allow",
      "git ls-files *": "allow",
      "git ls-tree *": "allow",
      "git rev-parse *": "allow",
      "git describe *": "allow",
      "git merge-base *": "allow",
      "git cat-file *": "allow",
      "git check-ignore *": "allow",
      "git check-attr *": "allow",
      "git branch": "allow",
      "git branch --show-current": "allow",
      "git tag --list": "allow",
      "git tag --list *": "allow",
      "git remote -v": "allow",
      "git remote get-url *": "allow",
      "git config --get *": "allow",
      "git config --get-all *": "allow",
      "git config --list": "allow",
      "git config --show-origin --list": "allow",
      "git stash list": "allow",
      "git stash show *": "allow",
      "git worktree list": "allow",
      "git submodule status *": "allow",
      "git clean *": "ask",
      "git reset --hard *": "ask",
      "git checkout -- *": "ask",
      "git restore *": "ask"
    }
  }
}
```

### pi-subagents 和 @narumitw/pi-plan-mode

我最早装 `pi-subagents` 时，只是给每个内置角色分了模型和思考强度。但是会存在一个问题：我的工作流里子agents只负责读操作，给 Plan Mode 开放 subagents 工具以后，模型理论上也能叫到普通 `worker`；而 `worker` 为了正常开发本来就必须有 `bash`、 `edit` 和 `write`，把全局权限收紧则会毁掉常规工作流，单靠“Plan 不要进行写操作”原来只能靠提示词。但后面随着 pi-plan-mode 迭代新增了 `allowedPlanSubagents`，这个配置允许 Plan 里即便启用了 `subagent`，也只能启动我明确允许的只读角色。

因此现在我的解决方案变成了:

1. 启用 Plan Mode 的角色白名单；
2. 新增 `plan-scout`、 `plan-researcher`、 `plan-reviewer` 三个独立子 agent；
3. 通过每个 agent frontmatter 里的 `permission:` 默认给plan专属的三个独立子 agent 拒绝写操作。

这样 Plan 可以并行收集证据，但不能把任务偷换给普通可写角色。

pi-plan-mode.json
```json
{
  "thinkingLevel": "inherit",
  "defaultPlanTools": [
    "read",
    "bash",
    "grep",
    "find",
    "ls",
    "subagent"
  ],
  "allowedPlanSubagents": [
    "plan-scout",
    "plan-researcher",
    "plan-reviewer"
  ],
  "safeSubcommands": {
    "git": [
      "rev-parse",
      "blame",
      "describe",
      "merge-base",
      "ls-tree",
      "cat-file"
    ]
  }
}
```

注意 `allowedPlanSubagents` 是大小写敏感的精确名称匹配，Plan 会在 child process 启动前检查普通、并行、chain、fan-in 和 spawn 请求；不在名单里的角色会整次被拒绝。它不是 sandbox，所以白名单里的 agent 本身仍然必须保持只读。

~/.pi/agent/agents/plan-scout.md
```yaml
---
name: plan-scout
description: Fast, read-only codebase reconnaissance for a planning session.
tools: read, grep, find, ls
extensions:
model: openai/gpt-5.6-luna
thinking: low
systemPromptMode: replace
inheritProjectContext: true
inheritSkills: false
defaultContext: fresh
acceptanceRole: read-only
permission:
  "*": deny
  read: allow
  grep: allow
  find: allow
  ls: allow
  bash: deny
  edit: deny
  write: deny
  mcp: deny
  skill: deny
  external_directory: deny
  special: deny
---

Treat the assigned workspace as read-only. Map the relevant files, control flow,
data contracts, existing behavior, and constraints for the parent planner.
Return exact paths, evidence, unresolved questions, and no filesystem changes.
```
~/.pi/agent/agents/plan-researcher.md
```yaml
---
name: plan-researcher
description: Read-only technical investigation and evidence synthesis for planning.
tools: read, grep, find, ls
extensions:
model: openai/gpt-5.6-luna
thinking: medium
systemPromptMode: replace
inheritProjectContext: true
inheritSkills: false
defaultContext: fresh
acceptanceRole: read-only
permission:
  "*": deny
  read: allow
  grep: allow
  find: allow
  ls: allow
  bash: deny
  edit: deny
  write: deny
  mcp: deny
  skill: deny
  external_directory: deny
  special: deny
---

Treat the assigned workspace as read-only. Trace the requested technical
question through local code and configuration. Separate confirmed facts from
assumptions, then return evidence, risks, alternatives, and open questions.
```
~/.pi/agent/agents/plan-reviewer.md
```yaml
---
name: plan-reviewer
description: Read-only design and change-risk review for a planning session.
tools: read, grep, find, ls
extensions:
model: openai/gpt-5.6-terra
thinking: medium
systemPromptMode: replace
inheritProjectContext: true
inheritSkills: false
defaultContext: fresh
acceptanceRole: read-only
permission:
  "*": deny
  read: allow
  grep: allow
  find: allow
  ls: allow
  bash: deny
  edit: deny
  write: deny
  mcp: deny
  skill: deny
  external_directory: deny
  special: deny
---

Treat the assigned workspace as read-only. Review the proposed direction or
existing implementation for correctness, regressions, missing evidence, and
scope risks. Return exact paths and actionable findings without changing state.
```
settings.json 中的 subagents 配置
```json
{
  "subagents": {
    "defaultModel": "gpt-5.6-luna",
    "modelScope": {
      "allow": [
        "openai/gpt-5.5",
        "openai/gpt-5.6-*"
      ],
      "enforce": true
    },
    "agentOverrides": {
      "delegate": {
        "model": "gpt-5.6-luna",
        "thinking": "low",
        "fallbackModels": ["gpt-5.6-terra"],
        "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]
      },
      "scout": {
        "model": "gpt-5.6-luna",
        "thinking": "low",
        "fallbackModels": ["gpt-5.6-terra"],
        "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]
      },
      "context-builder": {
        "model": "gpt-5.6-luna",
        "thinking": "low",
        "fallbackModels": ["gpt-5.6-terra"],
        "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]
      },
      "researcher": {
        "model": "gpt-5.6-luna",
        "thinking": "low",
        "fallbackModels": ["gpt-5.6-terra"],
        "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]
      },
      "planner": {
        "model": "gpt-5.6-terra",
        "thinking": "medium",
        "inheritProjectContext": true,
        "fallbackModels": ["gpt-5.6-luna"],
        "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]
      },
      "worker": {
        "model": "gpt-5.6-terra",
        "thinking": "medium",
        "inheritProjectContext": true,
        "fallbackModels": ["gpt-5.6-luna"],
        "tools": ["read", "grep", "find", "ls", "bash", "edit", "write", "contact_supervisor"]
      },
      "reviewer": {
        "model": "gpt-5.6-luna",
        "thinking": "medium",
        "inheritProjectContext": true,
        "fallbackModels": ["gpt-5.6-terra"],
        "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]
      },
      "oracle": {
        "model": "gpt-5.6-terra",
        "thinking": "medium",
        "inheritProjectContext": true,
        "fallbackModels": ["gpt-5.6-luna"],
        "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]
      }
    }
  }
}
```
~/.pi/agent/extensions/subagent/config.json
```json
{
  "toolDescriptionMode": "compact",
  "asyncByDefault": false,
  "waitTool": {
    "enabled": true
  },
  "forceTopLevelAsync": false,
  "globalConcurrencyLimit": 6,
  "parallel": {
    "maxTasks": 6,
    "concurrency": 6
  },
  "maxSubagentSpawnsPerSession": 24,
  "maxSubagentDepth": 1,
  "completionBatch": {
    "enabled": true,
    "debounceMs": 150,
    "maxWaitMs": 1000,
    "stragglerDebounceMs": 75,
    "stragglerMaxWaitMs": 400,
    "stragglerWindowMs": 2000
  },
  "worktreeBaseDir": "C:\\Users\\<YOUR_USER>\\.pi\\agent\\repos\\subagents-worktrees"
}
```

## AGENTS.md 迭代

随着我从 codex 切到 Pi，AGENTS.md 就向着更加通用和精简的方向去迭代，完善了关于并行、子 agents 为什么只做只读调查、Skills/MCP 如何按任务主动调度、格式化噪声如何处理、什么时候只做静态核验的约束。

特别是使用 5.6 不约束清楚， 5.6 老是给我自作主张很烦人。

[AGENTS.md.txt](https://linux.do/uploads/short-url/6VCfN8zYyrZFaC761doWbX2sQqI.txt) (34.0 KB)

参考了

[5.6 Sol 必须知道的技巧 - 开发调优 - LINUX DO](https://linux.do/t/topic/2592785)

[【拯救 5.6 Sol（1）】开箱即用、快速高效、减少上下文腐烂的Codex子代理实践 - 开发调优 - LINUX DO](https://linux.do/t/topic/2578075)

## 完整 settings.json

完整脱敏 settings.json
```json
{
  "lastChangelogVersion": "0.81.1",
  "shellPath": "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
  "externalEditor": "code --wait",
  "defaultProvider": "openai",
  "defaultModel": "gpt-5.6-terra",
  "subagents": {
    "defaultModel": "gpt-5.6-luna",
    "modelScope": {
      "allow": ["openai/gpt-5.5", "openai/gpt-5.6-*"],
      "enforce": true
    },
    "agentOverrides": {
      "delegate": {"model": "gpt-5.6-luna", "thinking": "low", "fallbackModels": ["gpt-5.6-terra"], "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]},
      "scout": {"model": "gpt-5.6-luna", "thinking": "low", "fallbackModels": ["gpt-5.6-terra"], "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]},
      "context-builder": {"model": "gpt-5.6-luna", "thinking": "low", "fallbackModels": ["gpt-5.6-terra"], "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]},
      "researcher": {"model": "gpt-5.6-luna", "thinking": "low", "fallbackModels": ["gpt-5.6-terra"], "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]},
      "planner": {"model": "gpt-5.6-terra", "thinking": "medium", "inheritProjectContext": true, "fallbackModels": ["gpt-5.6-luna"], "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]},
      "worker": {"model": "gpt-5.6-terra", "thinking": "medium", "inheritProjectContext": true, "fallbackModels": ["gpt-5.6-luna"], "tools": ["read", "grep", "find", "ls", "bash", "edit", "write", "contact_supervisor"]},
      "reviewer": {"model": "gpt-5.6-luna", "thinking": "medium", "inheritProjectContext": true, "fallbackModels": ["gpt-5.6-terra"], "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]},
      "oracle": {"model": "gpt-5.6-terra", "thinking": "medium", "inheritProjectContext": true, "fallbackModels": ["gpt-5.6-luna"], "tools": ["read", "grep", "find", "ls", "bash", "contact_supervisor"]}
    }
  },
  "defaultThinkingLevel": "high",
  "hideThinkingBlock": false,
  "theme": "codex-graphite",
  "quietStartup": true,
  "collapseChangelog": true,
  "outputPad": 1,
  "editorPaddingX": 1,
  "autocompleteMaxVisible": 8,
  "showHardwareCursor": true,
  "enabledModels": ["gpt-5.5", "gpt-5.6-luna", "gpt-5.6-terra", "gpt-5.6-sol"],
  "packages": [
    "npm:pi-mcp-adapter",
    "npm:context-mode",
    "npm:pi-until-done",
    "npm:@narumitw/pi-plan-mode",
    "git:github.com/daynin/nano-context",
    "npm:@juicesharp/rpiv-advisor",
    "npm:pi-simplify",
    "npm:pi-markdown-preview",
    "npm:@juicesharp/rpiv-ask-user-question",
    "npm:@juicesharp/rpiv-i18n",
    "npm:pi-rewind",
    "npm:@gotgenes/pi-permission-system",
    "npm:pi-ultra-compact",
    "npm:pi-observational-memory",
    "npm:pi-wtf",
    "npm:@ff-labs/pi-fff",
    "npm:pi-web-access",
    "npm:@juicesharp/rpiv-todo",
    "npm:pi-zentui",
    "npm:pi-subagents",
    "npm:pi-di18n",
    "npm:pi-lens"
  ],
  "compaction": {"enabled": true, "reserveTokens": 32768, "keepRecentTokens": 48000},
  "observational-memory": {"observeAfterTokens": 48000, "reflectAfterTokens": 144000, "compactAfterTokens": 217600, "compactAfterTokensMode": "ratio", "compactAfterTokensRatio": 0.8, "observationsPoolMaxTokens": 32000, "observationsPoolTargetTokens": 16000, "agentMaxTurns": 16, "model": {"provider": "openai", "id": "gpt-5.6-luna", "thinking": "low"}, "passive": false, "debugLog": false},
  "thinkingBudgets": {"minimal": 1024, "low": 4096, "medium": 12288, "high": 32768, "xhigh": 65536},
  "steeringMode": "one-at-a-time",
  "followUpMode": "one-at-a-time",
  "transport": "auto",
  "images": {"autoResize": true, "blockImages": false},
  "terminal": {"showImages": true, "imageWidthCells": 72, "clearOnShrink": false},
  "retry": {"enabled": true},
  "enableSkillCommands": true,
  "defaultProjectTrust": "ask",
  "treeFilterMode": "default",
  "doubleEscapeAction": "tree",
  "httpIdleTimeoutMs": 300000
}
```