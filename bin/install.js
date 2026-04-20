#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const HOME = os.homedir();
const CWD = process.cwd();
const SRC = path.join(__dirname, '..');
const PROMPT_FILE = path.join(SRC, 'PROMPT.md');

// ── helpers ──────────────────────────────────────────────────────────────────

function readPrompt() {
  return fs.readFileSync(PROMPT_FILE, 'utf8');
}

function writeFile(dest, content) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}

function copySkillDir(dest) {
  const SKIP = new Set(['.git', 'node_modules', 'bin']);
  function copy(src, dst) {
    fs.mkdirSync(dst, { recursive: true });
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      if (SKIP.has(entry.name)) continue;
      const s = path.join(src, entry.name);
      const d = path.join(dst, entry.name);
      entry.isDirectory() ? copy(s, d) : fs.copyFileSync(s, d);
    }
  }
  copy(SRC, dest);
}

function homePath(p) {
  return p.replace(HOME, '~');
}

function green(s) { return `\x1b[32m${s}\x1b[0m`; }
function bold(s)  { return `\x1b[1m${s}\x1b[0m`; }
function dim(s)   { return `\x1b[2m${s}\x1b[0m`; }
function yellow(s){ return `\x1b[33m${s}\x1b[0m`; }
function cyan(s)  { return `\x1b[36m${s}\x1b[0m`; }

// ── agent definitions ────────────────────────────────────────────────────────

const AGENTS = [
  {
    id: 'generic',
    name: 'Generic / Any Agent',
    global: {
      label: '~/.agents/skills/refactor/',
      install() {
        const dest = path.join(HOME, '.agents', 'skills', 'refactor');
        copySkillDir(dest);
        return {
          dest,
          notes: [
            'Point your agent at PROMPT.md as its system prompt:',
            `  ${dest}/PROMPT.md`,
          ],
        };
      },
    },
    project: null,
  },
  {
    id: 'claude-code',
    name: 'Claude Code',
    global: {
      label: '~/.claude/skills/refactor/',
      install() {
        const dest = path.join(HOME, '.claude', 'skills', 'refactor');
        copySkillDir(dest);
        return { dest, notes: [] };
      },
    },
    project: null,
  },
  {
    id: 'aider',
    name: 'Aider',
    global: {
      label: '~/.aider-refactor-skill/',
      install() {
        const dest = path.join(HOME, '.aider-refactor-skill');
        copySkillDir(dest);
        const alias = `alias aider-refactor='aider --system-prompt "$(cat ${dest}/PROMPT.md)"'`;
        return {
          dest,
          notes: [
            'Add this alias to ~/.zshrc or ~/.bashrc:',
            `  ${alias}`,
          ],
        };
      },
    },
    project: {
      label: 'CONVENTIONS.md',
      install() {
        const dest = path.join(CWD, 'CONVENTIONS.md');
        writeFile(dest, readPrompt());
        return { dest, notes: [] };
      },
    },
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    global: {
      label: '~/.gemini/refactor-prompt.md',
      install() {
        const dest = path.join(HOME, '.gemini', 'refactor-prompt.md');
        writeFile(dest, readPrompt());
        return {
          dest,
          notes: [
            'Add to ~/.gemini/settings.json:',
            '  {',
            `    "systemInstruction": "${readPrompt().slice(0, 60).replace(/\n/g, ' ')}..."`,
            '  }',
            `Or use alias: alias gemini-refactor='gemini --system-instruction "$(cat ${dest})"'`,
          ],
        };
      },
    },
    project: {
      label: 'GEMINI.md',
      install() {
        const dest = path.join(CWD, 'GEMINI.md');
        writeFile(dest, readPrompt());
        return { dest, notes: [] };
      },
    },
  },
  {
    id: 'continue',
    name: 'Continue',
    global: {
      label: '~/.continue/refactor-prompt.md',
      install() {
        const dest = path.join(HOME, '.continue', 'refactor-prompt.md');
        writeFile(dest, readPrompt());
        return {
          dest,
          notes: [
            'Add systemMessage to your model in ~/.continue/config.json:',
            `  "systemMessage": "<contents of ${dest}>"`,
            'See agents/continue.md for full instructions.',
          ],
        };
      },
    },
    project: {
      label: '.continuerules',
      install() {
        const dest = path.join(CWD, '.continuerules');
        writeFile(dest, readPrompt());
        return { dest, notes: [] };
      },
    },
  },
  {
    id: 'cursor',
    name: 'Cursor',
    global: {
      label: '~/.cursor/rules/refactor.mdc  (Cursor global rules dir)',
      install() {
        const dest = path.join(HOME, '.cursor', 'rules', 'refactor.mdc');
        writeFile(dest, readPrompt());
        return {
          dest,
          notes: [
            'Enable in Cursor: Settings → General → Rules for AI → enable global rules directory.',
          ],
        };
      },
    },
    project: {
      label: '.cursor/rules/refactor.mdc',
      install() {
        const dest = path.join(CWD, '.cursor', 'rules', 'refactor.mdc');
        writeFile(dest, readPrompt());
        return { dest, notes: [] };
      },
    },
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    global: {
      label: '~/.codeium/windsurf/memories/refactor.md',
      install() {
        const dest = path.join(HOME, '.codeium', 'windsurf', 'memories', 'refactor.md');
        writeFile(dest, readPrompt());
        return {
          dest,
          notes: [
            'For true global rules, also paste PROMPT.md into Windsurf → Settings → AI Rules.',
          ],
        };
      },
    },
    project: {
      label: '.windsurfrules',
      install() {
        const dest = path.join(CWD, '.windsurfrules');
        writeFile(dest, readPrompt());
        return { dest, notes: [] };
      },
    },
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    global: {
      label: '~/.config/github-copilot/refactor-prompt.md',
      install() {
        const dest = path.join(HOME, '.config', 'github-copilot', 'refactor-prompt.md');
        writeFile(dest, readPrompt());
        return {
          dest,
          notes: [
            'Add to VS Code settings.json:',
            '  "github.copilot.chat.codeGeneration.instructions": [',
            `    { "file": "${dest}" }`,
            '  ]',
          ],
        };
      },
    },
    project: {
      label: '.github/copilot-instructions.md',
      install() {
        const dest = path.join(CWD, '.github', 'copilot-instructions.md');
        writeFile(dest, readPrompt());
        return { dest, notes: [] };
      },
    },
  },
  {
    id: 'zed',
    name: 'Zed',
    global: {
      label: '~/.config/zed/refactor-prompt.md',
      install() {
        const dest = path.join(HOME, '.config', 'zed', 'refactor-prompt.md');
        writeFile(dest, readPrompt());
        return {
          dest,
          notes: [
            'Paste PROMPT.md into Zed → Settings → assistant.system_prompt.',
            'See agents/zed.md for full instructions.',
          ],
        };
      },
    },
    project: {
      label: '.rules',
      install() {
        const dest = path.join(CWD, '.rules');
        writeFile(dest, readPrompt());
        return { dest, notes: [] };
      },
    },
  },
  {
    id: 'amazon-q',
    name: 'Amazon Q',
    global: {
      label: '~/.aws/amazonq/rules/refactor.md',
      install() {
        const dest = path.join(HOME, '.aws', 'amazonq', 'rules', 'refactor.md');
        writeFile(dest, readPrompt());
        return { dest, notes: ['Amazon Q CLI will pick this up automatically.'] };
      },
    },
    project: {
      label: '.amazonq/rules/refactor.md',
      install() {
        const dest = path.join(CWD, '.amazonq', 'rules', 'refactor.md');
        writeFile(dest, readPrompt());
        return { dest, notes: [] };
      },
    },
  },
  {
    id: 'openhands',
    name: 'OpenHands',
    global: null,
    project: {
      label: '.openhands/microagents/refactor.md',
      install() {
        const dest = path.join(CWD, '.openhands', 'microagents', 'refactor.md');
        const content = `---\nname: refactor\ntype: knowledge\n---\n\n${readPrompt()}`;
        writeFile(dest, content);
        return { dest, notes: [] };
      },
    },
  },
  {
    id: 'cody',
    name: 'Sourcegraph Cody',
    global: null,
    project: {
      label: '.cody/context.md',
      install() {
        const dest = path.join(CWD, '.cody', 'context.md');
        writeFile(dest, readPrompt());
        return { dest, notes: ['Add context.md to cody.contextFilePaths in .vscode/settings.json.'] };
      },
    },
  },
  {
    id: 'openai',
    name: 'OpenAI Assistants / ChatGPT',
    global: {
      label: '~/.openai-refactor-skill/PROMPT.md',
      install() {
        const dest = path.join(HOME, '.openai-refactor-skill', 'PROMPT.md');
        writeFile(dest, readPrompt());
        return {
          dest,
          notes: [
            'Paste contents into your Assistant system prompt on platform.openai.com,',
            'or into Custom Instructions in ChatGPT.',
          ],
        };
      },
    },
    project: null,
  },
];

// ── UI ───────────────────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

// Buffered readline: handles piped stdin where lines arrive before question() registers
const lineQueue = [];
const waitQueue = [];
rl.on('line', (line) => {
  if (waitQueue.length > 0) waitQueue.shift()(line);
  else lineQueue.push(line);
});

const ask = (prompt) => {
  process.stdout.write(prompt);
  return new Promise((resolve) => {
    if (lineQueue.length > 0) resolve(lineQueue.shift());
    else waitQueue.push(resolve);
  });
};

function printHeader() {
  console.log();
  console.log(bold('  Code Refactoring Skill — Installer'));
  console.log(dim('  Safe, incremental refactoring for any AI coding agent'));
  console.log();
}

function printAgentList(scope) {
  console.log(bold(`  Agents  `) + dim(`(${scope} install — current dir: ${homePath(CWD)})`));
  console.log();

  AGENTS.forEach((agent, i) => {
    const option = scope === 'global' ? (agent.global || agent.project) : (agent.project || agent.global);
    const fallback = scope === 'global' ? !agent.global : !agent.project;
    const n = String(i + 1).padStart(2);
    const label = option ? option.label : dim('(no automated install)');
    const tag = fallback ? yellow(' [fallback]') : '';
    console.log(`  ${cyan(n + '.')} ${bold(agent.name.padEnd(22))} ${dim(label)}${tag}`);
  });

  console.log();
  console.log(`  ${cyan('a.')}  ${bold('All agents')}`);
  console.log();
  if (scope === 'global') {
    console.log(dim('  [fallback] = agent has no global config; installs to project dir instead'));
  } else {
    console.log(dim('  [fallback] = agent is global-only; installs to ~/.../'));
  }
  console.log();
}

async function selectScope() {
  console.log(bold('  Install scope:'));
  console.log();
  console.log(`  ${cyan('1.')} ${bold('Global')}   — installs to your home dir, active for all projects`);
  console.log(`  ${cyan('2.')} ${bold('Project')}  — installs to current directory (${homePath(CWD)})`);
  console.log();
  const ans = await ask('  Enter choice [1/2]: ');
  return ans.trim() === '2' ? 'project' : 'global';
}

async function selectAgents() {
  const ans = await ask(`  Select agents [1-${AGENTS.length}, comma-separated, or "a" for all]: `);
  const raw = ans.trim().toLowerCase();
  if (raw === 'a' || raw === 'all') return AGENTS.map((_, i) => i);
  return raw
    .split(/[,\s]+/)
    .map((s) => parseInt(s, 10) - 1)
    .filter((n) => Number.isFinite(n) && n >= 0 && n < AGENTS.length);
}

function runInstalls(indices, scope) {
  console.log();
  let anyFailed = false;

  for (const idx of indices) {
    const agent = AGENTS[idx];
    const option = scope === 'global'
      ? (agent.global || agent.project)
      : (agent.project || agent.global);

    process.stdout.write(`  ${bold(agent.name.padEnd(22))} `);

    if (!option) {
      console.log(yellow('skip — no automated install available'));
      console.log(dim(`    See agents/${agent.id}.md for manual setup.`));
      continue;
    }

    try {
      const { dest, notes } = option.install();
      console.log(green('✓') + dim(` → ${homePath(dest)}`));
      for (const note of notes) {
        console.log(dim(`    ${note}`));
      }
    } catch (err) {
      console.log(`\x1b[31m✗ failed\x1b[0m`);
      console.log(`    ${err.message}`);
      anyFailed = true;
    }
  }

  console.log();
  if (!anyFailed) {
    console.log(green('  All done!') + ' Restart your agent — the refactoring skill is active.');
  } else {
    console.log(yellow('  Done with some errors.') + ' Check output above.');
  }
  console.log();
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  printHeader();

  const scope = await selectScope();
  console.log();
  printAgentList(scope);
  const indices = await selectAgents();

  if (indices.length === 0) {
    console.log('\n  No agents selected. Exiting.');
    rl.close();
    return;
  }

  console.log();
  runInstalls(indices, scope);
  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
