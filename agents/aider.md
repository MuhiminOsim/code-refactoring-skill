# Setup: Aider

## Option A: System Prompt Flag

Pass `PROMPT.md` as a system prompt on every session:

```bash
aider --system-prompt "$(curl -s https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md)"
```

Or clone first and reference locally:

```bash
git clone https://github.com/MuhiminOsim/code-refactoring-skill ~/.aider-refactor-skill

aider --system-prompt "$(cat ~/.aider-refactor-skill/PROMPT.md)"
```

## Option B: .aider.conf.yml

Add to your project's `.aider.conf.yml`:

```yaml
system-prompt: |
  # paste PROMPT.md contents here
```

Or reference a file (if your aider version supports it):

```yaml
read:
  - ~/.aider-refactor-skill/PROMPT.md
```

## Option C: CONVENTIONS.md

Aider automatically reads `CONVENTIONS.md` if present in the project root:

```bash
cp ~/.aider-refactor-skill/PROMPT.md CONVENTIONS.md
```

## Usage

```
aider src/orders.py

> Refactor the process_order function — it's too long

> Extract the discount calculation into a separate function

> Replace these nested if-statements with guard clauses
```

Aider will follow the full 5-phase process and run `pytest` (or your detected test command) after each step.

## With Reference Files

Add specific catalog files to the aider session as needed:

```bash
aider src/orders.py ~/.aider-refactor-skill/references/catalog-composing.md
```
