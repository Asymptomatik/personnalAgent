---
name: babysit-pr
description: Loop on a GitHub PR's review threads until none remain unresolved — fetches threads via trackers/github/, delegates triage and fixes to Review Closure Orchestrator, then replies to and resolves each fixed thread. Use when the user types /babysit-pr, or asks to address/clear/resolve PR review comments end-to-end.
---

# /babysit-pr — Drive a PR's review threads to zero

Loops fetch → fix → reply → resolve → recheck on a GitHub pull request's
review threads until none remain unresolved, or until a safety cap is hit
and the remainder is handed back to the user. Reuses
`agents/review-closure-orchestrator.md` and `agents/review-intake-specialist.md`
verbatim for triage and remediation — this skill only adds the GitHub-specific
fetch/reply/resolve loop around them via `trackers/github/`.

**You do not write code yourself.** Fixes are always delegated through
Review Closure Orchestrator to Adaptive Senior Developer.

---

## Step 1 — Identify the PR

If the user gave a PR number or URL, use it. Otherwise run
`gh pr view --json number,url,title` (Bash) to find the PR associated with
the current branch. If none is found, ask the user for the PR number.

## Step 2 — Fetch review threads

Run `trackers/github/get-pr-review-threads.sh <pr-number>` (Bash). Filter the
result to threads where `isResolved` is `false`.

- If there are none: report `PR #<n> has no unresolved review threads.` and stop.
- If there are some: continue to Step 3.

## Step 3 — Delegate triage and remediation

Call the **Agent tool** with `subagent_type: "Review Closure Orchestrator"`.
Provide the unresolved threads as its **manual source** input (it natively
accepts pasted/manual review feedback in Phase 1 — see
`agents/review-closure-orchestrator.md`): for each thread, include the file
path, line, comment body, and comment `databaseId` (needed later in Step 4),
plus the thread's `id` (needed in Step 5).

Review Closure Orchestrator will run its own phases (intake normalization via
Review Intake Specialist, clarification if needed, remediation brief
approval, remediation plan approval, fix loop with Code Reviewer gates,
closure validation). Its brief/plan approval gates require the user's input —
relay each of its questions to the user and continue the orchestrator via
`SendMessage` with the user's answer, the same continuation pattern Jarvis
uses for retries. Wait for its full Review Closure Report before proceeding.

## Step 4 — Reply to each closed finding

For every finding in the Review Closure Report:

- **FIXED**: run `trackers/github/reply-pr-thread.sh <pr-number> <comment-database-id> "<summary of the fix, referencing files/commit>"`, then go to Step 5 for that thread.
- **REJECTED WITH RATIONALE**: run `reply-pr-thread.sh` with the rejection rationale. Do **not** resolve the thread — a rejection needs the human reviewer's acknowledgment, not a self-resolve.
- **DEFERRED**: run `reply-pr-thread.sh` noting it's deferred and why. Do **not** resolve the thread.
- **UNVERIFIABLE**: run `reply-pr-thread.sh` explaining why it couldn't be validated. Do **not** resolve the thread.

## Step 5 — Resolve fixed threads

For every thread whose finding was **FIXED** in Step 4, run
`trackers/github/resolve-pr-thread.sh <thread-node-id>`.

## Step 6 — Recheck and loop

Re-run Step 2. Compare the new unresolved set to before this pass:

- **Zero unresolved threads remain** → report success and stop:
  > ✅ **PR #<n> clean.** All review threads resolved.
- **Only threads left are ones this pass explicitly rejected/deferred/marked unverifiable (Step 4)** → stop looping (retrying won't change the outcome) and report:
  > 📌 **PR #<n>: 0 fixable threads remain.** [X] rejected, [Y] deferred, [Z] unverifiable — listed below, left open for the reviewer.
- **New or still-unaddressed fixable threads remain** (e.g. the reviewer replied again, or a new review was submitted) → go back to Step 3 for another pass.
- **Safety cap: after 5 passes**, stop regardless of remaining count and escalate to the user with the current unresolved list, asking how to proceed.

---

## Hard Rules

- Never resolve a thread that was rejected, deferred, or marked unverifiable — only FIXED findings get auto-resolved.
- Never silently drop a thread — every unresolved thread at the end of a run is either resolved or explicitly reported to the user.
- Never write implementation code yourself — always go through Review Closure Orchestrator → Adaptive Senior Developer.
- Never skip relaying Review Closure Orchestrator's approval gates to the user — it still requires explicit brief and plan approval, same as Jarvis.
- Never loop more than 5 passes without escalating to the user.
- Never duplicate Review Closure Orchestrator's or Review Intake Specialist's logic here — this skill only adds the GitHub fetch/reply/resolve loop around them.
