# Setup: Claude Code

The native installation method — Claude Code loads skills automatically from `~/.claude/skills/`.

## Install

```bash
git clone https://github.com/MuhiminOsim/code-refactoring-skill \
  ~/.claude/skills/refactor
```

No configuration needed. The skill is active immediately.

## How It Works

Claude Code reads `SKILL.md` at session start. The `description` field contains trigger phrases — Claude activates the skill automatically when you mention refactoring.

## Usage

Any of these trigger the skill automatically:

```
"Refactor this"
"Clean this up"
"Extract this into a function"
"This is too long"
"Remove this duplication"
"Simplify these conditionals"
"Replace callbacks with async/await"
"This smells, fix it"
```

## Updating

```bash
cd ~/.claude/skills/refactor && git pull
```

## Uninstalling

```bash
rm -rf ~/.claude/skills/refactor
```
