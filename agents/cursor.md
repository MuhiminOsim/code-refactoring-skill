# Setup: Cursor

Two options — project-scoped rules or global rules.

## Option A: Project Rules (recommended)

Create `.cursor/rules/refactor.mdc` in your project root:

```bash
mkdir -p .cursor/rules
curl -o .cursor/rules/refactor.mdc \
  https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md
```

Cursor automatically loads `.cursor/rules/*.mdc` for every conversation in that project.

## Option B: Global Rules

1. Open Cursor → Settings → General → Rules for AI
2. Paste the contents of [`PROMPT.md`](../PROMPT.md) into the rules field
3. The skill is now active for all projects

## Usage

Trigger with any natural phrase:
- "Refactor this function"
- "This is too long, clean it up"
- "Extract the discount logic"
- "Replace these callbacks with async/await"

Cursor will run the 5-phase process: read → diagnose → plan → execute (with tests) → summarize.

## With Reference Files

For the full knowledge base (Cursor supports `@file` references):

```bash
# Clone into your project or a shared location
git clone https://github.com/MuhiminOsim/code-refactoring-skill .cursor/refactor-skill
```

Then in conversation: `@.cursor/refactor-skill/references/catalog-composing.md` to pull in specific catalog sections.
