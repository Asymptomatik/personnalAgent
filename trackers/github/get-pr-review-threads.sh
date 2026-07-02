#!/usr/bin/env bash
# Fetch all review threads (resolved and unresolved) for a GitHub PR, including
# each thread's id (needed to resolve it later) and each comment's databaseId
# (needed to reply to it later). Uses the GraphQL API — the REST API does not
# expose thread resolution state or thread ids.
#
# Usage: get-pr-review-threads.sh <pr-number> [owner/repo]
# If [owner/repo] is omitted, uses the repo of the current working directory.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <pr-number> [owner/repo]" >&2
  exit 1
fi

PR_NUMBER="$1"
REPO="${2:-}"

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: gh CLI is not installed or not on PATH." >&2
  exit 1
fi

if [ -z "$REPO" ]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

OWNER="${REPO%%/*}"
NAME="${REPO##*/}"

QUERY='
query($owner: String!, $name: String!, $pr: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          comments(first: 50) {
            nodes {
              id
              databaseId
              author { login }
              body
              url
              createdAt
            }
          }
        }
      }
    }
  }
}'

gh api graphql \
  -f query="$QUERY" \
  -f owner="$OWNER" \
  -f name="$NAME" \
  -F pr="$PR_NUMBER" \
  --jq '.data.repository.pullRequest.reviewThreads.nodes'
