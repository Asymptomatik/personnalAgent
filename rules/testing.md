---
name: testing
scope: "tests/**,**/*.test.*,**/*.spec.*"
description: Test conventions — what to update, what to avoid, when a task touches test files.
---

# Testing Rule

Applies to files under `tests/**` and any `*.test.*` / `*.spec.*` file
alongside source, in the target repository.

- **Update or add tests only for behavior the current task actually changes.**
  Do not opportunistically rewrite unrelated existing tests.
- **Never weaken an existing test** (loosening an assertion, removing a case,
  increasing a timeout past what's needed) to make a task pass review —
  fix the implementation instead, or report the conflict as a blocker.
- **Never mark a test as skipped/pending** to work around a failure without
  explicitly flagging it in the task report's "Concerns / Trade-offs" section.
- **Follow the project's existing test framework and conventions** — do not
  introduce a second test runner or assertion library into a project that
  already has one.

Adaptive Senior Developer and Code Reviewer both apply this rule when a task
or review touches a file matching the scope above.
