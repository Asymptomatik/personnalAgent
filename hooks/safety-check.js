#!/usr/bin/env node
/**
 * PreToolUse safety hook for Bash and Write.
 * Reads the hook payload from stdin, blocks destructive git operations,
 * destructive deletions, and hardcoded secrets. Exit 2 blocks the tool call
 * (stderr is surfaced to Claude as the reason); exit 0 allows it.
 */

'use strict';

const fs = require('fs');
const { execSync } = require('child_process');

function readPayload() {
  try {
    const raw = fs.readFileSync(0, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function block(reason) {
  process.stderr.write(reason + '\n');
  process.exit(2);
}

function allow() {
  process.exit(0);
}

function currentBranch(cwd) {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { cwd, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

const PROTECTED_BRANCHES = /^(main|master|develop|release\/.+|production)$/i;

const DESTRUCTIVE_GIT_PATTERNS = [
  {
    // git push --force / --force-with-lease / -f (as its own flag)
    test: /\bgit\s+push\b(?:(?!&&|;|\|).)*(--force(-with-lease)?\b|(^|\s)-f\b)/i,
    reason: 'Blocked: force-push (git push --force/-f) can overwrite remote history. Re-run without --force if this was not intentional, or ask the user to confirm explicitly.',
  },
  {
    // git branch -D on a protected branch name, or deleting multiple branches at once
    test: /\bgit\s+branch\s+(-D|--delete\s+--force)\b/i,
    reason: null, // resolved dynamically below (needs arg inspection)
  },
];

function checkBashCommand(command, cwd) {
  if (!command || typeof command !== 'string') return null;

  for (const rule of DESTRUCTIVE_GIT_PATTERNS) {
    if (rule.test.test(command) && rule.reason) {
      return rule.reason;
    }
  }

  // git branch -D: block if it targets a protected branch or deletes more than one branch
  const branchDeleteMatch = command.match(/\bgit\s+branch\s+-D\s+(.+)/i);
  if (branchDeleteMatch) {
    const args = branchDeleteMatch[1]
      .split(/\s+/)
      .filter((a) => a && !a.startsWith('-'));
    const targetsProtected = args.some((a) => PROTECTED_BRANCHES.test(a));
    if (targetsProtected) {
      return `Blocked: "git branch -D" targets a protected branch (${args.join(', ')}). Confirm with the user before deleting it.`;
    }
    if (args.length > 1) {
      return `Blocked: "git branch -D" targets multiple branches at once (${args.join(', ')}). Delete branches individually with explicit confirmation.`;
    }
  }

  // git reset --hard on a protected branch
  if (/\bgit\s+reset\s+--hard\b/i.test(command)) {
    const branch = currentBranch(cwd);
    if (branch && PROTECTED_BRANCHES.test(branch)) {
      return `Blocked: "git reset --hard" while on protected branch "${branch}". This discards commits/changes on a shared branch — confirm with the user first.`;
    }
  }

  // rm -rf (or -fr, -r -f separately) targeting root-ish or unscoped paths
  const rmMatch = command.match(/\brm\s+(-[a-z]*r[a-z]*f[a-z]*|-[a-z]*f[a-z]*r[a-z]*)\s*(.*)/i);
  if (rmMatch) {
    const rest = rmMatch[2].trim();
    const targets = rest.split(/\s+/).filter((t) => t && !t.startsWith('-'));
    const dangerous = targets.length === 0 || targets.some((t) => isDangerousPath(t));
    if (dangerous) {
      return `Blocked: "rm -rf" targets a root, home, VCS, or unscoped path (${targets.join(', ') || '<none>'}). Narrow the path if this is intentional.`;
    }
  }

  return null;
}

function isDangerousPath(target) {
  const t = target.replace(/["']/g, '');
  if (['/', '~', '.', '..', '*', '.*'].includes(t)) return true;
  if (/^[a-zA-Z]:\\?$/.test(t)) return true; // C:\ or C:
  if (/^\/[a-zA-Z]\/?$/.test(t)) return true; // /c/ style Windows drive root in git-bash
  if (/(^|\/|\\)\.git(\/?$|\\?$)/.test(t)) return true; // deleting .git
  if (/^\$HOME\/?$/.test(t)) return true;
  return false;
}

const SECRET_PATTERNS = [
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'OpenAI-style API key', re: /sk-[A-Za-z0-9]{20,}/ },
  { name: 'Anthropic API key', re: /sk-ant-[A-Za-z0-9\-_]{20,}/ },
  { name: 'Slack token', re: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { name: 'GitHub token', re: /gh[pousr]_[A-Za-z0-9]{36,}/ },
  { name: 'private key block', re: /-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  {
    name: 'generic hardcoded secret assignment',
    re: /\b(api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)\s*[:=]\s*["'][A-Za-z0-9\-_./+=]{16,}["']/i,
  },
];

function checkWriteContent(content) {
  if (!content || typeof content !== 'string') return null;
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(content)) {
      return `Blocked: content appears to contain a hardcoded ${name}. Use an environment variable or secret manager instead, or confirm with the user this is a placeholder/test value.`;
    }
  }
  return null;
}

function main() {
  const payload = readPayload();
  if (!payload || payload.hook_event_name !== 'PreToolUse') {
    allow();
    return;
  }

  const { tool_name: toolName, tool_input: toolInput = {}, cwd } = payload;

  if (toolName === 'Bash') {
    const reason = checkBashCommand(toolInput.command, cwd);
    if (reason) return block(reason);
  }

  if (toolName === 'Write' || toolName === 'Edit') {
    const content = toolInput.content || toolInput.new_string || '';
    const reason = checkWriteContent(content);
    if (reason) return block(reason);
  }

  allow();
}

main();
