# Rules

Path-scoped conventions, one file per topic. Each rule has a `scope` glob in
its frontmatter and a short, actionable body — same spirit as the `.ia/`
guidance files Adaptive Senior Developer already consults, but repo-agnostic
and shipped with the agent pack instead of living in the target repo.

| Rule | Scope |
|------|-------|
| [`security.md`](security.md) | `**/*.{js,ts,jsx,tsx,py,cs}` |
| [`documentation.md`](documentation.md) | `docs/**`, `*.md` |
| [`testing.md`](testing.md) | `tests/**`, `**/*.test.*`, `**/*.spec.*` |

## Current status

These files are a **scaffold, not yet wired into any agent prompt or hook**.
No agent currently reads `rules/` automatically — `agents/adaptive-senior-developer.md`
and `agents/code-reviewer.md` still only consult `.ia/` guidance in the target
repo. Connecting `rules/` into those prompts (path-scope matching against the
current task's files, the same way `.ia/` already works) is follow-up work,
not part of this step.

`hooks/safety-check.js` independently enforces the hardcoded-secret and
destructive-command parts of `security.md` at the tool-call level today —
that's the one part of these rules with actual automatic enforcement right
now.
