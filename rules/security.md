---
name: security
scope: "**/*.{js,ts,jsx,tsx,py,cs}"
description: No hardcoded secrets, parameterized queries only, for source files across the stack.
---

# Security Rule

Applies to source files matched by `scope` above, wherever they live in the
target repository.

- **Never hardcode secrets.** API keys, tokens, passwords, connection strings
  with embedded credentials, and private keys must come from environment
  variables, a secrets manager, or an injected configuration object — never
  as a literal string in source. `hooks/safety-check.js` blocks the most
  common patterns at write-time as a backstop, but do not rely on the hook —
  write it correctly the first time.
- **Never build queries by string concatenation or interpolation** of
  untrusted input. Use parameterized queries / prepared statements (SQL),
  the ORM's query builder, or equivalent safe APIs for the target stack.
- **Never trust client-supplied input** for authorization decisions —
  re-validate on the server/service boundary even if the client already
  validated.
- **Never log secrets or full credential values**, even at debug level.

Adaptive Senior Developer and Code Reviewer both apply this rule when a task
or review touches a file matching the scope above.
