# Setup: Windsurf (Codeium)

## Via .windsurfrules (recommended)

Windsurf automatically loads `.windsurfrules` from the project root.

```bash
curl -o .windsurfrules \
  https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md
```

Commit this file so your whole team gets the skill.

## Via Global Rules

1. Open Windsurf → Settings → AI Rules
2. Paste the contents of [`PROMPT.md`](../PROMPT.md)

## Usage

In the Cascade panel:

```
Refactor the processOrder function — it's too long

Extract the discount calculation into a separate function

Replace these nested callbacks with async/await
```

Windsurf's Cascade has terminal access and can run your test suite after each step.
