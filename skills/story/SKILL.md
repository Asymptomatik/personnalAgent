---
name: story
description: Enterprise, full 5-phase delivery workflow (Understand, Plan, Execute in waves, Evaluate+Accept, Commit+PR) for team/enterprise work — a per-story-folder, in-conversation formalization of the Jarvis pipeline. Use when the user types /story, or explicitly asks for the full Enterprise pipeline rather than the lighter Solo /build.
---

# /story — Enterprise delivery workflow

`/story` is the exact same pipeline as `agents/jarvis.md`, run **directly in
this conversation** instead of as a spawned Agent-tool subagent. That
distinction matters for one practical reason: Jarvis's approval gates
(Phase 2 clarifying questions, Phase 3 brief approval, Phase 4 plan approval)
require multi-turn back-and-forth with the user — running in the main
conversation makes that natural instead of requiring an Agent/SendMessage
relay.

**Do not duplicate phase logic in this file.** `agents/jarvis.md` is the
single source of truth for what each phase does, its exact output formats,
its retry rules, its model-selection rules, and its Hard Rules. Read it now
if you have not already, and follow it phase by phase:

1. **Phase 0 — Resume check** — exactly as defined in `agents/jarvis.md`.
2. **Phase 1 — Understand the request** — exactly as defined in `agents/jarvis.md`, including deriving the `story-id`.
3. **Phase 2 — Ask clarifying questions** — mandatory, one message, exactly as defined.
4. **Phase 3 — Produce the executable brief** — write `tasks/stories/<story-id>/brief.md` on approval, exactly as defined.
5. **Phase 4 — Build the implementation plan** — write `tasks/stories/<story-id>/plan.md` on approval, exactly as defined.
6. **Phase 5 — Development loop with review gates** — delegate to Adaptive Senior Developer and Code Reviewer via the Agent tool, retry/escalation rules, `/simplify` pass, exactly as defined.
7. **Phase 6 — Final brief validation** — delegate to Brief Validator via the Agent tool, exactly as defined.
8. **Phase 6.5 — Behavioral verification with `/verify`** — exactly as defined.
9. **Phase 7 — Delivery report**, including both non-blocking Obsidian saves (delivery report, then review+acceptance consolidation) — exactly as defined.

Apply every Hard Rule from `agents/jarvis.md` as if you were Jarvis — you are
running its pipeline, just not as a spawned subagent. In particular: never
write implementation code yourself (always delegate to Adaptive Senior
Developer), never skip the clarification phase, never skip an approval gate,
never advance a task without a Code Reviewer result, never mark delivery
complete if Brief Validator reports a critical blocker.

## Difference from `/build`

`/story` is the heavier Enterprise pipeline: 7 phases (plus Phase 0 resume
and Phase 6.5 verify), a dedicated `tasks/stories/<story-id>/` folder,
mandatory 3-attempt retry-with-escalation per task, and a full Brief
Validator requirement-by-requirement acceptance pass. `/build`
(`skills/build/SKILL.md`) is the lighter 3-phase Solo alternative with a
single `tasks/current/` folder and exactly 3 human stops. Both delegate to
the same underlying agents — pick based on whether the work needs the full
Enterprise rigor or a quick solo pass.
