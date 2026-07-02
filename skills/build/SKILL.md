---
name: build
description: Solo, lightweight 3-phase delivery workflow (Understand+Plan, Execute, Evaluate+PR) for day-to-day solo work. Reuses the same Adaptive Senior Developer, Code Reviewer, Brief Validator, and Debug Specialist agents as Jarvis, but skips Jarvis's clarification phase, per-story folders, and worktrees. Use when the user types /build or asks for a quick end-to-end implementation without the full Enterprise pipeline.
---

# /build — Solo delivery workflow

You are running the **Solo** mode of the two-mode harness: a lightweight,
3-phase pipeline for day-to-day solo work. It reuses the exact same
implementation, review, and validation agents as Jarvis (`agents/jarvis.md`) —
only the orchestration is lighter. Never duplicate agent logic here; always
delegate to the existing agent files via the Agent tool.

**You do not write code yourself.** Implementation is always delegated to
Adaptive Senior Developer.

---

## What makes Solo different from Enterprise (Jarvis)

Deliberate simplifications — do not "fix" these, they are the point of Solo:

- No separate Understand phase — it's merged into Plan (Phase 1 below).
- No per-story folder. State lives in a single `tasks/current/` directory,
  overwritten each time `/build` starts a new run (not appended across runs).
- No git worktrees, no parallel task execution.
- No dependency on an external tracker (ADO, Jira). GitHub issues are read
  directly if the user references one; otherwise free-text description.
- Exactly **3 stops** for human approval — no more, no fewer.

See `docs/HANDOFF_CONTRACTS.md` for the full Solo contract schema.

---

## Phase 1 — UNDERSTAND + PLAN

1. Determine the input:
   - If the user referenced a GitHub issue (URL or `#123`), fetch it (`gh issue view` via Bash, or ask the user to paste it if `gh` is unavailable).
   - Otherwise, use the free-text description the user gave when invoking `/build`.
2. Explore the repository: find the source files likely relevant to the request (Glob/Grep), and read any project guidance (`.ia/`, `CLAUDE.md`, `README.md`) that applies.
3. In a single pass, produce:
   - a brief (objective, scope, expected behavior, acceptance criteria),
   - a task breakdown (numbered tasks with a complexity tag: low/medium/high),
   - a test strategy.
4. Write the combined brief+plan to `tasks/current/plan.md` using the Write tool, following the `templates/tasks/solo/plan.md` structure.
5. Show the plan to the user.

**STOP 1** — end your turn with exactly:
> 📋 **Plan ready.** Revois le plan ci-dessus. Dis "go" pour lancer le build.

Do not proceed to Phase 2 until the user responds. If they ask for changes, revise `tasks/current/plan.md` and re-present it.

---

## Phase 2 — EXECUTE

Process the task breakdown from `tasks/current/plan.md` in order. Group
independent tasks into waves if useful; dependent tasks run sequentially.

For each task:

1. Call the **Agent tool** with `subagent_type: "Adaptive Senior Developer"`. Prompt must include: the task only, the brief+plan from `tasks/current/plan.md`, the target stack, and the executor-state contract path `tasks/current/execution.md` (the agent appends its report there, same append-only contract as Enterprise — see `agents/adaptive-senior-developer.md`).
   - Select `model` from the task's complexity tag: `low` → `haiku`, `medium`/`high` → `sonnet` (same rule Jarvis uses).
2. Call the **Skill tool** with `skill: "simplify"` on the files just changed. Wait for the result before moving on.
3. Call the **Agent tool** with `subagent_type: "Code Reviewer"`, passing the task, the brief+plan, the files changed, the Adaptive Senior Developer report, and an evaluation contract path of `tasks/current/execution.md` (Solo has no separate evaluation.md — the review is appended to the same execution log, see `templates/tasks/solo/execution.md`).
4. If the review has no 🔴 blockers: mark the task PASS, move to the next task.
5. If blockers exist: retry via `SendMessage` to the same Adaptive Senior Developer instance, passing only the blocker feedback (do not resend the brief/plan — same rule as Jarvis Step 5a).
   - After **3 failed attempts** on the same task, do not keep retrying blindly. Call the **Agent tool** with `subagent_type: "Debug Specialist"`, passing the task description, the accumulated blocker history, and the relevant files. Debug Specialist diagnoses the root cause and delegates the fix back to Adaptive Senior Developer itself — wait for its full result, then re-run Code Reviewer once on the outcome.
   - If Debug Specialist also cannot resolve it, escalate to the user with the blocker history and ask: skip / manual fix / adjust plan.

**STOP 2** — after each wave of tasks completes (or after every task if you did not batch into waves), end your turn with exactly:
> ✅ **Wave complete: [N/M tasks passed].** Continuer ?

Do not start the next wave until the user responds.

---

## Phase 3 — EVALUATE + PR

Once all tasks pass:

1. Call the **Agent tool** with `subagent_type: "Code Reviewer"` for one final adversarial pass across the whole diff (not per-task) if the plan spans multiple files that interact — skip this if Phase 2's per-task reviews already covered the full diff coherently.
2. Call the **Agent tool** with `subagent_type: "Brief Validator"`, passing the brief+plan and the consolidated list of files changed. Write its report as the second half of `tasks/current/review.md` (see `templates/tasks/solo/review.md`).
3. **If the project has a runnable app**: call the **Skill tool** with `skill: "verify"` to confirm the feature actually works end-to-end. Log the result in `tasks/current/review.md`. If verification fails, surface it to the user before proceeding — do not silently continue to commit drafting.
4. Draft commit message(s) and a PR description from the approved brief and the task outcomes. Do not run `git commit` or `git push` yet.
5. Show the user: the review summary, the acceptance verdict, and the drafted commit/PR text.

### Obsidian archive (non-blocking)

After `tasks/current/review.md` is final, call the **Agent tool** with
`subagent_type: "Obsidian Specialist"` to archive a consolidated note (same
non-blocking contract as Jarvis Phase 7 — see `agents/jarvis.md`). Note type:
Review Closure, folder `AI Agents/Review Closures/`. If the save fails, log a
warning and continue — never block Phase 3 on this.

**STOP 3** — end your turn with exactly:
> 📦 **Ready to commit.** Revois le diff et le message de commit ci-dessus. Dis "push" quand prêt.

Do not run `git commit`, `git push`, or open a PR until the user explicitly says so.

---

## Hard Rules

- Never write implementation code yourself — always delegate to Adaptive Senior Developer.
- Never skip a STOP — there are exactly 3, no silent auto-continuation past any of them.
- Never create a per-story folder — Solo state is always `tasks/current/`.
- Never spawn git worktrees or run tasks in parallel branches.
- Never duplicate agent logic in this file — always call the existing agent files via the Agent tool.
- Never commit or push without explicit user confirmation at STOP 3.
- Never block Phase 3 on a failed Obsidian save.
- Always pass the executor-state / evaluation contract path to Adaptive Senior Developer and Code Reviewer, and always let them append/write it in addition to returning the result in this conversation.
- After 3 failed attempts on a task, always escalate to Debug Specialist before escalating to the user.
