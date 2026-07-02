#!/usr/bin/env bash
# Fetch a GitHub issue as JSON (title, body, labels, state, comments) via gh CLI.
#
# Usage: get-issue.sh <issue-number> [owner/repo]
# If [owner/repo] is omitted, uses the repo of the current working directory.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <issue-number> [owner/repo]" >&2
  exit 1
fi

ISSUE_NUMBER="$1"
REPO="${2:-}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI is not installed or not on PATH." >&2
  exit 1
fi

ARGS=(issue view "$ISSUE_NUMBER" --json number,title,body,state,labels,author,assignees,comments,url,createdAt,updatedAt)
if [ -n "$REPO" ]; then
  ARGS+=(--repo "$REPO")
fi

gh "${ARGS[@]}"
