#!/usr/bin/env node
/**
 * Interactive installer for the personnalAgent two-mode harness.
 *
 * Copies agents/, the relevant skills/ (Solo and/or Enterprise), hooks/,
 * rules/, templates/tasks/, and (Enterprise only) trackers/github/ into a
 * Claude Code global (~/.claude) or project (<project>/.claude) directory.
 *
 * No npm dependencies — Node.js standard library only.
 *
 * Usage:
 *   node install/install.js
 *   node install/install.js --scope=global --mode=both
 *   node install/install.js --scope=project --mode=solo --target=/path/to/project
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const REPO_ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {};
  for (const raw of argv.slice(2)) {
    const match = raw.match(/^--([^=]+)=(.*)$/);
    if (match) args[match[1]] = match[2];
  }
  return args;
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())));
}

async function askChoice(rl, question, choices, defaultKey) {
  const label = Object.entries(choices)
    .map(([key, desc]) => `  ${key}) ${desc}`)
    .join('\n');
  while (true) {
    const answer = (await ask(rl, `${question}\n${label}\n> `)) || defaultKey;
    const normalized = answer.toLowerCase();
    if (choices[normalized]) return normalized;
    console.log(`Please enter one of: ${Object.keys(choices).join(', ')}`);
  }
}

function copyDirRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyDirRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function copyMarkdownFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return [];
  fs.mkdirSync(destDir, { recursive: true });
  const copied = [];
  for (const entry of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, entry);
    if (fs.statSync(srcPath).isFile() && entry.endsWith('.md')) {
      fs.copyFileSync(srcPath, path.join(destDir, entry));
      copied.push(entry);
    }
  }
  return copied;
}

function copySkill(name, destRoot) {
  const src = path.join(REPO_ROOT, 'skills', name);
  const dest = path.join(destRoot, 'skills', name);
  if (!fs.existsSync(src)) {
    console.log(`  ! skills/${name} not found, skipping`);
    return;
  }
  copyDirRecursive(src, dest);
  console.log(`  + skills/${name}/`);
}

async function main() {
  const cliArgs = parseArgs(process.argv);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('personnalAgent installer\n');

  const SCOPE_CHOICES = {
    global: 'Global — available in every project (~/.claude)',
    project: 'Project — this project only (<project>/.claude)',
  };
  const MODE_CHOICES = {
    solo: 'Solo — /build only, lightweight day-to-day workflow',
    enterprise: 'Enterprise — /story, /babysit-pr, GitHub tracker adapter',
    both: 'Both',
  };

  if (cliArgs.scope && !SCOPE_CHOICES[cliArgs.scope]) {
    rl.close();
    console.error(`Invalid --scope="${cliArgs.scope}". Must be one of: ${Object.keys(SCOPE_CHOICES).join(', ')}`);
    process.exit(1);
  }
  if (cliArgs.mode && !MODE_CHOICES[cliArgs.mode]) {
    rl.close();
    console.error(`Invalid --mode="${cliArgs.mode}". Must be one of: ${Object.keys(MODE_CHOICES).join(', ')}`);
    process.exit(1);
  }

  const scope = cliArgs.scope || (await askChoice(rl, 'Install scope?', SCOPE_CHOICES, 'global'));

  let targetProjectPath = process.cwd();
  if (scope === 'project') {
    const answer =
      cliArgs.target || (await ask(rl, `Project path [default: ${targetProjectPath}]: `));
    if (answer) targetProjectPath = path.resolve(answer);
  }

  const mode = cliArgs.mode || (await askChoice(rl, 'Install which mode(s)?', MODE_CHOICES, 'both'));

  rl.close();

  const destRoot =
    scope === 'global' ? path.join(os.homedir(), '.claude') : path.join(targetProjectPath, '.claude');

  console.log(`\nInstalling to: ${destRoot}\n`);

  // Agents — shared by both modes, always installed.
  const agentsCopied = copyMarkdownFiles(path.join(REPO_ROOT, 'agents'), path.join(destRoot, 'agents'));
  console.log(`  + agents/ (${agentsCopied.length} files)`);

  // Skills — /resume is shared; /build and /story+/babysit-pr are mode-specific.
  copySkill('resume', destRoot);
  if (mode === 'solo' || mode === 'both') {
    copySkill('build', destRoot);
  }
  if (mode === 'enterprise' || mode === 'both') {
    copySkill('story', destRoot);
    copySkill('babysit-pr', destRoot);
  }

  // Hooks and rules — always installed; hooks still require manual registration (see hooks/README.md).
  const hooksSrc = path.join(REPO_ROOT, 'hooks');
  const hooksDest = path.join(destRoot, 'hooks');
  copyDirRecursive(hooksSrc, hooksDest);
  console.log('  + hooks/');

  const rulesSrc = path.join(REPO_ROOT, 'rules');
  const rulesDest = path.join(destRoot, 'rules');
  copyDirRecursive(rulesSrc, rulesDest);
  console.log('  + rules/');

  // Handoff contract templates — always installed (both variants; small, no reason to filter).
  const templatesSrc = path.join(REPO_ROOT, 'templates', 'tasks');
  const templatesDest = path.join(destRoot, 'templates', 'tasks');
  copyDirRecursive(templatesSrc, templatesDest);
  console.log('  + templates/tasks/');

  // GitHub tracker adapter — Enterprise only.
  if (mode === 'enterprise' || mode === 'both') {
    const trackersSrc = path.join(REPO_ROOT, 'trackers', 'github');
    const trackersDest = path.join(destRoot, 'trackers', 'github');
    copyDirRecursive(trackersSrc, trackersDest);
    console.log('  + trackers/github/');
  }

  console.log(`
Done.

Next steps:
  - Hooks are copied but not yet active: register hooks/safety-check.js in
    settings.json manually — see ${path.join(hooksDest, 'README.md')}.
  - Rules (${rulesDest}) are reference guidance, not yet auto-enforced by any
    agent prompt — see rules/README.md.
  - See docs/HANDOFF_CONTRACTS.md in the source repo for the tasks/ schema
    used by /build, /story, and /resume.
`);
}

main().catch((err) => {
  console.error('Install failed:', err.message);
  process.exit(1);
});
