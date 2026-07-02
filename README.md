# personnalAgent

A two-mode delivery harness for Claude Code: a shared set of agents (implement,
review, validate, debug) orchestrated by either a lightweight **Solo** pipeline
(`/build`) or a full **Enterprise** pipeline (`/story`, or the `Jarvis` agent
directly), with pipeline state persisted to disk so runs are resumable
(`/resume`).

---

## Two modes

Both modes delegate to the exact same agents below — only the orchestration
differs. Pick based on how much rigor the work needs.

| | Solo (`/build`) | Enterprise (`/story` / `Jarvis`) |
|---|---|---|
| Phases | 3 (Understand+Plan, Execute, Evaluate+PR) | 7 (+ Phase 0 resume check, Phase 6.5 `/verify`) |
| Human stops | Exactly 3 | Brief approval, plan approval, each retry escalation |
| State | `tasks/current/` (single, overwritten per run) | `tasks/stories/<story-id>/` (one folder per story) |
| Retry handling | 3 attempts, then escalate to `/debug` | 3 attempts, then escalate to the user |
| Tracker / worktrees | None | GitHub tracker adapter (`trackers/github/`); no worktrees yet |
| Use for | Day-to-day solo work, quick passes | Team/enterprise work needing full audit trail |

See `docs/HANDOFF_CONTRACTS.md` for the full on-disk state schema both modes
write to.

---

## Skills

| Skill | Mode | Role |
|-------|------|------|
| [`/build`](skills/build/SKILL.md) | Solo | Understand+Plan → Execute → Evaluate+PR, 3 stops |
| [`/story`](skills/story/SKILL.md) | Enterprise | In-conversation formalization of the Jarvis pipeline, per-story folder |
| [`/resume`](skills/resume/SKILL.md) | Both | Picks an interrupted Solo run or Enterprise story back up from disk |
| [`/babysit-pr`](skills/babysit-pr/SKILL.md) | Enterprise | Loops a GitHub PR's review threads to zero via Review Closure Orchestrator |

Skills live in `skills/<name>/SKILL.md` and are invoked as `/<name>` once
installed (see Installation below).

---

## Agents

| Agent | Emoji | Role | User-invocable |
|-------|-------|------|----------------|
| [Jarvis](agents/jarvis.md) | 🎛️ | Autonomous delivery orchestrator — turns a request into a full delivery pipeline (brief → plan → implement → review → validate) | ✅ |
| [Adaptive Senior Developer](agents/adaptive-senior-developer.md) | 💎 | Implements one approved task at a time, following the brief and plan strictly | ✅ (or via Jarvis) |
| [Code Reviewer](agents/code-reviewer.md) | 👁️ | Adversarially reviews implemented changes — actively hunts for what breaks, not confirmation of the author's self-review | via Jarvis |
| [Brief Validator](agents/brief-validator.md) | ✅ | Cross-checks delivered code against the approved brief requirement by requirement | via Jarvis |
| [Debug Specialist](agents/debug-specialist.md) | 🐛 | Reproduces failures, traces root causes, maps blast radius, and produces a structured diagnosis with a fix plan | ✅ |
| [Review Closure Orchestrator](agents/review-closure-orchestrator.md) | 🧭 | Collects external review feedback (GitHub, GitLab, manual) and orchestrates fix-and-close workflows | ✅ |
| [Review Intake Specialist](agents/review-intake-specialist.md) | 📥 | Normalizes and deduplicates raw review comments into structured findings | via Review Closure Orchestrator |
| [Obsidian Specialist](agents/obsidian-specialist.md) | 🗒️ | Reads, creates, appends, and searches Obsidian notes via the `obsidian` CLI — called by orchestrators to persist delivery outputs, or invoked directly for note operations | ✅ (or via orchestrators) |

Both modes share these agents — implementation review, brief validation, and
debugging logic are never duplicated between Solo and Enterprise.

---

## Handoff contracts

Every phase's output is persisted to disk under `tasks/` — `brief.md`,
`plan.md`, `executor-state.md`, `evaluation.md`, `acceptance.md` (Enterprise,
one folder per story) or `plan.md`, `execution.md`, `review.md` (Solo, single
current run). This is additive: every agent still always returns its full
result in-context too — the files make the pipeline traceable and resumable,
they don't replace the live orchestration loop.

Blank templates for every contract file live in `templates/tasks/`. Full
schema and file-by-file responsibilities: [`docs/HANDOFF_CONTRACTS.md`](docs/HANDOFF_CONTRACTS.md).

---

## Hooks

[`hooks/safety-check.js`](hooks/safety-check.js) is a `PreToolUse` hook (Node,
no dependencies) that blocks force-push, deletion/hard-reset of protected
branches, unscoped `rm -rf`, and hardcoded secrets written to files —
independent of what any agent's prompt says. Copied by the installer but
**not auto-registered**: see [`hooks/README.md`](hooks/README.md) for the
`settings.json` entry.

---

## Rules

[`rules/`](rules/) holds path-scoped conventions (`security.md`,
`documentation.md`, `testing.md`) — a glob scope plus a short actionable body,
similar in spirit to `.ia/` project guidance. They're currently a reference
scaffold, not yet wired into any agent prompt except where `hooks/safety-check.js`
independently enforces the secrets/destructive-command portion of
`security.md`. See [`rules/README.md`](rules/README.md).

---

## Installation

There are two installation scopes:

- **Global** — available in every project on your machine (`~/.claude/`)
- **Project** — available only in a specific project (`<project>/.claude/`, committed alongside the code)

### Recommended: the installer

Clone this repo, then run the interactive installer (Node.js required — no
npm dependencies). It copies `agents/`, the skill(s) matching the mode you
pick, `hooks/`, `rules/`, and `templates/tasks/` (plus `trackers/github/` for
Enterprise) into the scope you choose.

```bash
git clone https://github.com/Asymptomatik/personnalAgent.git
node personnalAgent/install/install.js
```

It prompts for scope (global/project) and mode (solo/enterprise/both). To
skip the prompts, pass flags directly:

```bash
node personnalAgent/install/install.js --scope=global --mode=both
node personnalAgent/install/install.js --scope=project --mode=solo --target=/path/to/your/project
```

Hooks are copied but **not auto-registered** — see
[`hooks/README.md`](hooks/README.md) to add `safety-check.js` to
`settings.json`.

### Manual installation (agents only)

If you only want the agent `.md` files (no skills/hooks/rules/trackers), copy
them directly — they're plain YAML-frontmatter files Claude Code reads as
agent definitions.

**macOS / Linux**
```bash
git clone https://github.com/Asymptomatik/personnalAgent.git
cp personnalAgent/agents/*.md ~/.claude/agents/
```

**Windows (PowerShell)**
```powershell
git clone https://github.com/Asymptomatik/personnalAgent.git
Copy-Item personnalAgent\agents\*.md "$env:USERPROFILE\.claude\agents\"
```

> The `~/.claude/agents/` directory (or `%USERPROFILE%\.claude\agents\` on Windows) is automatically created by Claude Code. Create it manually if it does not exist yet.

For project-level instead of global, copy into `.claude/agents/` at the
project root instead of `~/.claude/agents/`. Project-level agents are only
active when Claude Code is running inside that project directory, and take
precedence over global agents of the same name.

### Installing a single agent

You can install only the agents you need. For example, to install only the Debug Specialist:

**macOS / Linux**
```bash
curl -o ~/.claude/agents/debug-specialist.md \
  https://raw.githubusercontent.com/Asymptomatik/personnalAgent/main/agents/debug-specialist.md
```

**Windows (PowerShell)**
```powershell
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/Asymptomatik/personnalAgent/main/agents/debug-specialist.md" `
  -OutFile "$env:USERPROFILE\.claude\agents\debug-specialist.md"
```

---

## Usage

Once installed, agents and skills appear in Claude Code from the chat prompt
or the agent selector.

### From the chat prompt

Type `/` followed by the agent or skill name to invoke it directly.

Examples:
```
/build Add a CSV export to the reporting dashboard
/story Add a CSV export to the reporting dashboard
/resume
/babysit-pr 42
/debug-specialist There's a crash in the payment flow when the cart is empty
/jarvis Add a CSV export to the reporting dashboard
/adaptive-senior-developer Implement task 2 from the approved plan
```

### From the agent selector

In Claude Code's UI, open the agent picker (`@` or the agent icon) and select the agent by name.

### As sub-agents (orchestrated)

Some agents are designed to be called by orchestrators (Jarvis, Review Closure Orchestrator) and are not meant to be invoked directly. These are marked as "via [orchestrator]" in the table above.

---

## Updating

To update to the latest version:

```bash
cd personnalAgent
git pull
node install/install.js   # re-run with the same scope/mode you installed with
```

Or, for an agents-only manual install:

```bash
cd personnalAgent
git pull
cp agents/*.md ~/.claude/agents/
```

---

## Obsidian integration

The Obsidian Specialist agent persists agent outputs (delivery reports, debug diagnoses, review closures) as structured Markdown notes in an Obsidian vault.

It is called automatically at the end of a Jarvis/`/story` pipeline (two notes: the delivery report, then a separate review+acceptance consolidation), a `/build` run, a Debug Specialist session, or a Review Closure Orchestrator run. You can also invoke it directly to read, create, append, or search notes.

Notes are organized under an `AI Agents/` top-level folder inside the vault, grouped by type: `AI Agents/Delivery Reports/`, `AI Agents/Debug Reports/`, `AI Agents/Review Closures/`, and `AI Agents/Briefs/`.

**Requirements for Obsidian integration:**
- The Obsidian desktop app must be open when a note write is attempted.
- The `obsidian` CLI must be installed and available in your system `PATH`.

If either condition is not met, the Obsidian Specialist reports the error gracefully and returns control to the calling orchestrator without interrupting the pipeline.

---

## Requirements

- [Claude Code](https://claude.ai/code) CLI or desktop app
- An Anthropic API key with access to Claude Sonnet (all agents, including Jarvis) and Claude Haiku (Brief Validator, Obsidian Specialist, and low-complexity tasks routed by Jarvis/`/build`)
- [Node.js](https://nodejs.org/) — only needed to run `install/install.js` and `hooks/safety-check.js`; not required to use the agents/skills themselves once installed
- [GitHub CLI (`gh`)](https://cli.github.com/), authenticated — only needed for `trackers/github/` and `/babysit-pr`
