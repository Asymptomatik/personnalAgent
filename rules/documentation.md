---
name: documentation
scope: "docs/**,*.md"
description: Do not modify architecture docs or top-level markdown without an explicit request.
---

# Documentation Rule

Applies to `docs/**` and any top-level `*.md` file (READMEs, CHANGELOGs,
architecture notes) in the target repository.

- **Never modify architecture or process documentation as a side effect** of
  an unrelated task. If a task's implementation makes a doc factually wrong,
  flag it in the report's "Concerns / Trade-offs" section instead of editing
  it silently.
- **Only edit docs when the brief or plan explicitly calls for a doc change**,
  or when the user directly asks for it in the current request.
- **Do not create new top-level `*.md` files** (README-style, guides,
  changelogs) unless the brief or the user explicitly asked for one.

Adaptive Senior Developer applies this rule for any task whose scope touches
`docs/**` or a top-level `*.md` file.
