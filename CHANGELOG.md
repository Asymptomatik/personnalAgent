# Changelog

## Two-mode harness migration

The repo moved from 8 flat agent `.md` files to a structured, two-mode
harness — a shared agent set orchestrated by either a lightweight **Solo**
pipeline or the full **Enterprise** pipeline, with pipeline state persisted
to disk between phases. See `README.md` for the current structure and
`docs/HANDOFF_CONTRACTS.md` for the on-disk state schema.

### Restructuring
- Moved the 8 agent files into `agents/` (`git mv`, history preserved).
- Scaffolded `skills/`, `rules/`, `hooks/`, `templates/tasks/`, `docs/`,
  `trackers/`, `install/`.

### Handoff contracts
- Introduced `tasks/stories/<story-id>/{brief,plan,executor-state,evaluation,acceptance}.md`
  (Enterprise) and `tasks/current/{plan,execution,review}.md` (Solo).
- `agents/jarvis.md`, `agents/adaptive-senior-developer.md`,
  `agents/code-reviewer.md`, and `agents/brief-validator.md` now write their
  phase output to these files in addition to returning it in context — the
  in-context result remains what every agent evaluates from.
- Obsidian stayed a non-blocking, end-of-pipeline archive only — never a
  handoff contract. Jarvis Phase 7 now writes two notes: the delivery
  report, and a separate review+acceptance consolidation.

### Solo mode
- Added `skills/build/SKILL.md` (`/build`): a 3-phase pipeline
  (Understand+Plan, Execute, Evaluate+PR) with exactly 3 human approval
  stops, reusing the same agents as Jarvis, no per-story folder, no
  worktrees, no tracker dependency.

### Adversarial review
- Rewrote `agents/code-reviewer.md`'s opening mission and review method so it
  actively hunts for what breaks the implementation instead of confirming
  the author's own self-review PASS. Output format unchanged.

### Safety net
- Added `hooks/safety-check.js` (`PreToolUse`, Node, no dependencies):
  blocks force-push, deletion/hard-reset of protected branches, unscoped
  `rm -rf`, and hardcoded secrets written to files.
- Added `rules/security.md`, `rules/documentation.md`, `rules/testing.md` —
  path-scoped conventions, currently a reference scaffold (not yet wired
  into any agent prompt beyond what the hook independently enforces).

### Resumability
- Added a Phase 0 resume check to `agents/jarvis.md`: looks for an existing
  `tasks/stories/<story-id>/` before starting a new one, and resumes from
  the furthest completed phase based on which contract files exist.
- Added `skills/resume/SKILL.md` (`/resume`) for both Solo and Enterprise
  runs.
- Relaxed Jarvis's execution model from "never return before Phase 7" to
  "never stop mid-delegation, but a phase boundary is a safe checkpoint" —
  handoff contracts make this safe.

### Enterprise formalization
- Added `skills/story/SKILL.md` (`/story`): the same Enterprise pipeline as
  `agents/jarvis.md`, run in-conversation instead of as a spawned subagent
  (better suited to the multi-turn approval gates). No phase logic
  duplicated — points to `agents/jarvis.md` as the source of truth.
- Added `trackers/github/` (`gh`-CLI-backed scripts: `get-issue.sh`,
  `get-pr-review-threads.sh`, `reply-pr-thread.sh`, `resolve-pr-thread.sh`).
  GitHub only — no generic tracker abstraction until a second provider is
  actually needed.
- Added `skills/babysit-pr/SKILL.md` (`/babysit-pr`): loops a PR's review
  threads to zero via `agents/review-closure-orchestrator.md`, with a
  5-pass safety cap and no auto-resolve of rejected/deferred/unverifiable
  findings.
- Skipped parallel git worktrees (optional in the plan; add only if
  parallel task execution becomes a real need).

### Installer
- Added `install/install.js`: interactive (or flag-driven) installer
  copying `agents/`, mode-matched `skills/`, `hooks/`, `rules/`,
  `templates/tasks/`, and (Enterprise) `trackers/github/` into a global or
  project Claude Code directory. Hooks are copied but never
  auto-registered in `settings.json`.
- Rewrote `README.md`: two-mode comparison table, skills table, handoff
  contracts, hooks, rules, and the new installer as the recommended
  install path (manual `cp`/`Copy-Item` retained as a fallback).

### Bug fixes found along the way
- `agents/jarvis.md`: added `Skill` to the frontmatter `tools` allowlist —
  the pipeline calls the Skill tool (`/simplify`, `/verify`) but it was
  never declared, which would fail under a strict tool allowlist.
- `agents/review-closure-orchestrator.md`: renamed all `Senior Developer`
  references to `Adaptive Senior Developer` — the repo only defines the
  latter, so delegation would have failed to resolve.
- Both were flagged by an unresolved Copilot review on PR #6, found while
  live-testing `trackers/github/get-pr-review-threads.sh` against this repo.
