# GitHub tracker adapter

Shell scripts wrapping the GitHub `gh` CLI for the operations
`review-closure-orchestrator.md` and `skills/babysit-pr/SKILL.md` need:
fetching an issue, fetching PR review threads (with resolution state), and
replying to / resolving a specific thread.

Only a GitHub adapter exists here — no generic tracker abstraction layer and
no second provider (e.g. Azure DevOps) until a real second tracker is
actually needed. Building the abstraction now, for a single implementation,
would be speculative.

## Requirements

- [`gh` CLI](https://cli.github.com/) installed and on `PATH`.
- Authenticated: `gh auth status` should show a logged-in account with at
  least `repo` scope.
- Run from within a clone of the target repository (or pass `owner/repo`
  explicitly — see each script's usage).

## Scripts

| Script | Purpose | Notes |
|--------|---------|-------|
| `get-issue.sh <issue-number> [owner/repo]` | Fetch an issue (title, body, labels, state, comments) as JSON | REST via `gh issue view --json` |
| `get-pr-review-threads.sh <pr-number> [owner/repo]` | Fetch all review threads for a PR, resolved and unresolved, with each thread's `id` (needed to resolve it) and each comment's `databaseId` (needed to reply to it) | GraphQL — the REST API does not expose thread resolution state |
| `reply-pr-thread.sh <pr-number> <comment-database-id> <body> [owner/repo]` | Post a threaded reply to a specific review comment | REST, `in_reply_to` |
| `resolve-pr-thread.sh <thread-node-id>` | Mark a review thread as resolved | GraphQL mutation — no REST equivalent |

All scripts print raw JSON (from `gh --json` or `gh api --jq`) to stdout and
exit non-zero with a usage message on missing arguments, or with `gh`'s own
error output if the API call fails (e.g. not authenticated, PR not found).

## Typical flow (used by `/babysit-pr`)

```bash
threads=$(trackers/github/get-pr-review-threads.sh 42)
# ... filter for isResolved == false ...
trackers/github/reply-pr-thread.sh 42 3421432445 "Fixed in <commit>, see <files>."
trackers/github/resolve-pr-thread.sh "PRRT_kwDOS3lA8M6J6-Pg"
```

Note the two different id types: `databaseId` (numeric, for replying to a
comment) vs. the thread's `id` (GraphQL node id, for resolving the thread) —
they are not interchangeable.
