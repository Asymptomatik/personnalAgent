# Hooks

## `safety-check.js`

A `PreToolUse` hook for `Bash`, `Write`, and `Edit` that blocks:

- destructive git operations: `git push --force`/`-f`, `git branch -D` on a
  protected branch (`main`, `master`, `develop`, `release/*`, `production`) or
  deleting multiple branches at once, `git reset --hard` while on a protected
  branch;
- destructive deletions: `rm -rf` targeting root/home/`.git`/unscoped paths
  (`/`, `~`, `.`, `..`, `*`, a bare drive root, `.git`);
- hardcoded secrets written to a file: AWS keys, OpenAI/Anthropic-style API
  keys, Slack tokens, GitHub tokens, PEM private key blocks, and generic
  `api_key = "..."`-style assignments.

It never touches network or remote state itself — it only inspects the tool
call Claude Code is about to make and decides allow/block before it runs.

Requires **Node.js** on the machine running Claude Code (no npm dependencies —
uses only Node's standard library).

### Registering the hook

Add it to `hooks.PreToolUse` in `settings.json` (global: `~/.claude/settings.json`,
project: `.claude/settings.json`). Example matching `Bash` and `Write`/`Edit`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash|Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"/absolute/path/to/personnalAgent/hooks/safety-check.js\""
          }
        ]
      }
    ]
  }
}
```

Use an absolute path (or `%USERPROFILE%\...` / `$HOME/...` resolved by your
shell) — hook commands do not inherit the repo's working directory reliably
across every invocation context.

### Behavior contract

- Reads the hook JSON payload from stdin (`hook_event_name`, `tool_name`,
  `tool_input`, `cwd`).
- Exit code `0`: allow the tool call.
- Exit code `2`: block the tool call; stderr is surfaced back to Claude as the
  blocking reason so it can adjust its approach.
- Any payload that isn't a recognized `PreToolUse` call, or a tool call that
  matches none of the destructive patterns, is allowed through unchanged.

### Known limitation

`git reset --hard` protection relies on running `git rev-parse --abbrev-ref HEAD`
in the tool call's `cwd` — it only blocks when the *current* branch matches the
protected-branch list, not when a hard reset would affect a shared branch some
other way (e.g. via `git reset --hard <protected-branch>` while on a different
branch). Treat this hook as a safety net, not a substitute for reviewing
destructive commands before approving them.
