#!/usr/bin/env bash
# Post a threaded reply to a specific PR review comment.
#
# Usage: reply-pr-thread.sh <pr-number> <comment-database-id> <body> [owner/repo]
#
# <comment-database-id> is the numeric "databaseId" field of the comment
# (not the GraphQL node id) as returned by get-pr-review-threads.sh.
set -euo pipefail

if [ $# -lt 3 ]; then
  echo "Usage: $0 <pr-number> <comment-database-id> <body> [owner/repo]" >&2
  exit 1
fi

PR_NUMBER="$1"
COMMENT_ID="$2"
BODY="$3"
REPO="${4:-}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI is not installed or not on PATH." >&2
  exit 1
fi

if [ -z "$REPO" ]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

gh api \
  --method POST \
  "repos/${REPO}/pulls/${PR_NUMBER}/comments" \
  -f body="$BODY" \
  -F in_reply_to="$COMMENT_ID"
