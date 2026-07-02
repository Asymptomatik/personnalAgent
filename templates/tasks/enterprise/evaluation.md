<!--
Append-only log written by Code Reviewer, once per task attempt.
Never overwrite a previous entry — append a new "## Task [N] — Attempt [X]" section
per attempt so the retry history stays visible on disk. The in-context report
returned to Jarvis remains the source Jarvis evaluates; this file is the durable copy.
-->

# Evaluation Log

## Task [N] — Attempt [X] — [YYYY-MM-DD HH:MM]

## Code Review Report

### Summary
- Verdict: PASS / FAIL
- Scope adherence: [Within scope / Scope drift detected]
- Key concern: [short summary or `None`]

### 🔴 Blockers
- [issue title]
  - File: [path + line(s) if possible]
  - Why it matters: [clear explanation]
  - Suggestion: [practical fix direction]
- [or `None`]

### 🟡 Warnings
- [issue title]
  - File: [path + line(s) if possible]
  - Why it matters: [clear explanation]
  - Suggestion: [practical fix direction]
- [or `None`]

### 💭 Suggestions
- [issue title]
  - File: [path + line(s) if possible]
  - Why it matters: [clear explanation]
  - Suggestion: [practical improvement]
- [or `None`]

### ✅ Looks Good
- [specific good implementation decision]
- [specific good pattern]
- [or `None noted`]

### Review Decision
- Final decision: PASS / FAIL
- Reason:
  - [short explanation]
- Retry guidance for developer:
  - [clear instructions Jarvis can pass back on retry]
  - [or `None`]
