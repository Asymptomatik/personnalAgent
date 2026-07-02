# Handoff Contracts

Handoff contracts are files written to disk between pipeline phases. They make
pipeline state traceable, inspectable after the fact, and (from a future step)
resumable after an interruption or context compaction.

**Rule:** handoff contracts always live under `tasks/` in the target repository.
Obsidian is never a handoff contract — it is a best-effort, non-blocking archive
written once at the end of a pipeline. No phase depends on a successful Obsidian
write to proceed. See each agent's own doc for its Obsidian behavior.

---

## Enterprise model (Jarvis)

One directory per story, identified by a `<story-id>` slug (kebab-case, derived
from the feature name established in Phase 1 — e.g. `csv-export-dashboard`).

```
tasks/stories/<story-id>/
├── brief.md            ← written by Jarvis at Phase 3 approval (Functional and Technical Brief)
├── plan.md             ← written by Jarvis at Phase 4 approval (Implementation Plan)
├── executor-state.md   ← written/updated by Adaptive Senior Developer, once per task, appended per retry
├── evaluation.md        ← written by Code Reviewer, once per task, appended per retry
└── acceptance.md        ← written by Brief Validator at Phase 6 (Brief Validation Report)
```

### File responsibilities

| File | Writer | When | Source of truth for |
|------|--------|------|----------------------|
| `brief.md` | Jarvis | Phase 3, on user approval | The approved brief — reused verbatim as context for every later delegation |
| `plan.md` | Jarvis | Phase 4, on user approval | The approved plan and task breakdown |
| `executor-state.md` | Adaptive Senior Developer | End of every task attempt | Task Implementation Report per task, per attempt |
| `evaluation.md` | Code Reviewer | End of every review | Code Review Report per task, per attempt |
| `acceptance.md` | Brief Validator | Phase 6 | Brief Validation Report (requirement-by-requirement) |

`executor-state.md` and `evaluation.md` are append-only logs: each task/attempt is
appended as a new dated section, never overwritten, so the retry history stays
visible on disk.

Sub-agents still **always** return their full result in context as well — writing
to `tasks/` is additive, not a replacement for the in-context report Jarvis
depends on to evaluate pass/fail.

---

## Solo model (`/build`, introduced in a later step)

A single current-pipeline directory, no per-story nesting:

```
tasks/current/
├── plan.md         ← brief + plan combined (Phase 1 of /build)
├── execution.md    ← execution state per task (Phase 2 of /build)
└── review.md       ← review + acceptance combined (Phase 3 of /build)
```

Solo intentionally merges brief+plan into one file and review+acceptance into
another — it is a lighter 3-phase workflow, not Enterprise with fewer folders.

---

## Templates

Blank templates for every contract file live in `templates/tasks/`:

```
templates/tasks/enterprise/brief.md
templates/tasks/enterprise/plan.md
templates/tasks/enterprise/executor-state.md
templates/tasks/enterprise/evaluation.md
templates/tasks/enterprise/acceptance.md
templates/tasks/solo/plan.md
templates/tasks/solo/execution.md
templates/tasks/solo/review.md
```

Each template only contains the section headers already used in the agents'
existing structured output formats (Functional and Technical Brief, Implementation
Plan, Task Implementation Report, Code Review Report, Brief Validation Report) —
no new structure is invented here.

---

## Obsidian archiving (non-blocking, end of pipeline only)

Obsidian receives two kinds of notes, both written **after** all `tasks/`
contracts are final, both **non-blocking**:

1. The Delivery Report (Jarvis Phase 7 — already existed before handoff contracts).
2. A consolidated review+acceptance note, built from the final `evaluation.md` and
   `acceptance.md` content, filed under `AI Agents/Review Closures/`.

A failed Obsidian write logs a warning and never blocks or fails the pipeline —
the `tasks/` files remain the authoritative record regardless of Obsidian's
availability.
