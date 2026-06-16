# personnalAgent

A collection of custom Claude Code agents tailored for structured delivery workflows, code quality, and debugging.

---

## Agents

| Agent | Emoji | Role | User-invocable |
|-------|-------|------|----------------|
| [Jarvis](jarvis.md) | 🎛️ | Autonomous delivery orchestrator — turns a request into a full delivery pipeline (brief → plan → implement → review → validate) | ✅ |
| [Adaptive Senior Developer](adaptive-senior-developer.md) | 💎 | Implements one approved task at a time, following the brief and plan strictly | ✅ (or via Jarvis) |
| [Code Reviewer](code-reviewer.md) | 👁️ | Reviews implemented changes for correctness, security, maintainability, and test coverage | via Jarvis |
| [Brief Validator](brief-validator.md) | ✅ | Cross-checks delivered code against the approved brief requirement by requirement | via Jarvis |
| [Debug Specialist](debug-specialist.md) | 🐛 | Reproduces failures, traces root causes, maps blast radius, and produces a structured diagnosis with a fix plan | ✅ |
| [Review Closure Orchestrator](review-closure-orchestrator.md) | 🧭 | Collects external review feedback (GitHub, GitLab, manual) and orchestrates fix-and-close workflows | ✅ |
| [Review Intake Specialist](review-intake-specialist.md) | 📥 | Normalizes and deduplicates raw review comments into structured findings | via Review Closure Orchestrator |
| [Obsidian Specialist](obsidian-specialist.md) | 🗒️ | Reads, creates, appends, and searches Obsidian notes via the `obsidian` CLI — called by orchestrators to persist delivery outputs, or invoked directly for note operations | ✅ (or via orchestrators) |

---

## Installation

Agents are `.md` files with a YAML frontmatter block that Claude Code reads as agent definitions.  
There are two installation scopes:

- **Global** — available in every project on your machine
- **Project** — available only in a specific project (committed alongside the code)

### Global installation (recommended for personal agents)

Clone or download this repo, then copy the agent files into your Claude Code global agents directory.

**macOS / Linux**
```bash
git clone https://github.com/Asymptomatik/personnalAgent.git
cp personnalAgent/*.md ~/.claude/agents/
```

**Windows (PowerShell)**
```powershell
git clone https://github.com/Asymptomatik/personnalAgent.git
Copy-Item personnalAgent\*.md "$env:USERPROFILE\.claude\agents\"
```

> The `~/.claude/agents/` directory (or `%USERPROFILE%\.claude\agents\` on Windows) is automatically created by Claude Code. Create it manually if it does not exist yet.

### Project-level installation

Copy the agent files into a `.claude/agents/` directory at the root of your project:

```bash
mkdir -p .claude/agents
cp path/to/personnalAgent/*.md .claude/agents/
```

Project-level agents are only active when Claude Code is running inside that project directory.  
They take precedence over global agents of the same name.

### Installing a single agent

You can install only the agents you need. For example, to install only the Debug Specialist:

**macOS / Linux**
```bash
curl -o ~/.claude/agents/debug-specialist.md \
  https://raw.githubusercontent.com/Asymptomatik/personnalAgent/main/debug-specialist.md
```

**Windows (PowerShell)**
```powershell
Invoke-WebRequest `
  -Uri "https://raw.githubusercontent.com/Asymptomatik/personnalAgent/main/debug-specialist.md" `
  -OutFile "$env:USERPROFILE\.claude\agents\debug-specialist.md"
```

---

## Usage

Once installed, agents appear in Claude Code in two ways:

### From the chat prompt

Type `/` followed by the agent name (or a keyword) to invoke an agent directly.

Examples:
```
/debug-specialist There's a crash in the payment flow when the cart is empty
/jarvis Add a CSV export to the reporting dashboard
/adaptive-senior-developer Implement task 2 from the approved plan
```

### From the agent selector

In Claude Code's UI, open the agent picker (`@` or the agent icon) and select the agent by name.

### As sub-agents (orchestrated)

Some agents are designed to be called by orchestrators (Jarvis, Review Closure Orchestrator) and are not meant to be invoked directly. These are marked as "via [orchestrator]" in the table above.

---

## Updating agents

To update to the latest version:

```bash
cd personnalAgent
git pull
cp *.md ~/.claude/agents/
```

---

## Obsidian integration

The Obsidian Specialist agent persists agent outputs (delivery reports, debug diagnoses, review closures) as structured Markdown notes in an Obsidian vault.

It is called automatically at the end of a Jarvis pipeline, a Debug Specialist session, or a Review Closure Orchestrator run. You can also invoke it directly to read, create, append, or search notes.

Notes are organized under an `AI Agents/` top-level folder inside the vault, grouped by type: `AI Agents/Delivery Reports/`, `AI Agents/Debug Reports/`, `AI Agents/Review Closures/`, and `AI Agents/Briefs/`.

**Requirements for Obsidian integration:**
- The Obsidian desktop app must be open when a note write is attempted.
- The `obsidian` CLI must be installed and available in your system `PATH`.

If either condition is not met, the Obsidian Specialist reports the error gracefully and returns control to the calling orchestrator without interrupting the pipeline.

---

## Requirements

- [Claude Code](https://claude.ai/code) CLI or desktop app
- An Anthropic API key with access to Claude Sonnet and/or Claude Opus (agents use `sonnet` by default; Jarvis uses `opus`)
