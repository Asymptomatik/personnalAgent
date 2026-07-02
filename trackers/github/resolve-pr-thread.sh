#!/usr/bin/env bash
# Mark a PR review thread as resolved.
#
# Usage: resolve-pr-thread.sh <thread-node-id>
#
# <thread-node-id> is the GraphQL "id" field of the thread (not a comment id)
# as returned by get-pr-review-threads.sh. Thread resolution has no REST
# equivalent — it requires the GraphQL mutation.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <thread-node-id>" >&2
  exit 1
fi

THREAD_ID="$1"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI is not installed or not on PATH." >&2
  exit 1
fi

MUTATION='
mutation($threadId: ID!) {
  resolveReviewThread(input: { threadId: $threadId }) {
    thread {
      id
      isResolved
    }
  }
}'

gh api graphql \
  -f query="$MUTATION" \
  -f threadId="$THREAD_ID" \
  --jq '.data.resolveReviewThread.thread'
