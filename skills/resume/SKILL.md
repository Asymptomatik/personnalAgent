---
name: resume
description: Resume an interrupted Jarvis (Enterprise) or /build (Solo) pipeline from its handoff contract files on disk, without redoing already-completed phases. Use when the user types /resume, or asks to continue/pick back up a previous build or story after an interruption, context compaction, or a new session.
---

# /resume — Continue a pipeline from disk

Handoff contracts (`docs/HANDOFF_CONTRACTS.md`) make every Jarvis story and
every `/build` run resumable: their state lives in `tasks/`, not only in a
prior conversation's context. This skill reads that state and picks the
pipeline back up at the correct phase — it never restarts a phase that
already produced a valid, approved contract file.

**You do not write code yourself.** Resuming into Phase 5 (Execute) still
delegates implementation to Adaptive Senior Developer, exactly as Jarvis and
`/build` already do.

---

## Step 1 — Find what's resumable

1. Check for a Solo run: does `tasks/current/` exist with any of `plan.md`, `execution.md`, `review.md`?
2. Check for Enterprise stories: `Glob` on `tasks/stories/*/` for directories containing at least `brief.md`.
3. If both exist, or multiple Enterprise stories exist, list them (Solo run, and each story-id with its most recent contract file's content summarized in one line) and ask the user which one to resume.
4. If nothing is found, tell the user there is nothing to resume and stop — do not invent a pipeline.

---

## Step 2 — Determine the resume point

Read whichever contract files exist for the chosen run, then apply this
precedence (same logic Jarvis uses internally at its own Phase 0):

**Enterprise (`tasks/stories/<story-id>/`):**
- `acceptance.md` exists → resume at Phase 7 (Delivery Report + Obsidian archiving). If `acceptance.md` shows a critical blocker, resume at the "Final validation blockers" error-handling path from `agents/jarvis.md` instead of writing a report.
- All tasks in `plan.md`'s Task Breakdown have a PASS as the latest entry in `evaluation.md`, but no `acceptance.md` → resume at Phase 6 (Brief Validator).
- `executor-state.md` has entries for some tasks but not all, or the latest entry for a task is a FAIL → resume at Phase 5, starting at the first incomplete or failing task. Reconstruct the retry count for that task from how many attempt entries exist in `executor-state.md`/`evaluation.md`.
- `plan.md` exists but `executor-state.md` does not → resume at Phase 5, task 1.
- `brief.md` exists but `plan.md` does not → resume at Phase 4 (re-present the brief, ask if it still holds, then build the plan).
- Only `brief.md` exists → resume at Phase 3 (re-present the brief for approval, or Phase 2 if the user wants to revise requirements).

**Solo (`tasks/current/`):**
- `review.md` is fully written (both Code Review and Brief Acceptance sections present) → resume at the STOP 3 point of `skills/build/SKILL.md` (present the commit/PR draft again, wait for "push").
- `execution.md` has entries for some but not all tasks in `plan.md`, or an unresolved FAIL → resume at Phase 2 of `/build`, at the first incomplete task.
- `plan.md` exists but `execution.md` does not → resume at Phase 2 of `/build`, task 1.
- Only nothing usable exists → tell the user and suggest starting fresh with `/build`.

---

## Step 3 — Resume execution

Once the resume point is determined:

1. Load the relevant contract files into context (do not re-derive the brief or plan — they are authoritative as written on disk).
2. Tell the user in one short message: `Resuming <story-id or "current build"> at Phase [N] — [M/N tasks already passed].`
3. Continue exactly as `agents/jarvis.md` (Enterprise) or `skills/build/SKILL.md` (Solo) specify from that phase onward, including their STOP points, retry logic, and Obsidian archiving — this skill does not redefine any of that behavior, it only locates the correct entry point.

---

## Hard Rules

- Never redo a phase whose contract file already shows a completed, non-failing result.
- Never guess which story to resume when more than one is plausible — ask.
- Never fabricate contract content that isn't actually on disk — read the files.
- Never skip re-presenting an approval gate (brief/plan) if resuming lands before Phase 5 — the user must still explicitly approve before execution proceeds, even on resume.
- Never duplicate Jarvis's or `/build`'s phase logic here — delegate to their existing definitions once the resume point is found.
