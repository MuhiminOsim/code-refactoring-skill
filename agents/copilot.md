# Setup: GitHub Copilot

## Via Copilot Instructions File (recommended)

GitHub Copilot Chat reads `.github/copilot-instructions.md` for workspace-level custom instructions.

```bash
mkdir -p .github
curl -o .github/copilot-instructions.md \
  https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md
```

Commit this file to your repo — all team members get the refactoring skill automatically.

## Via VS Code Settings

1. Open VS Code → Settings → search "copilot instructions"
2. Add to `settings.json`:

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "file": ".github/copilot-instructions.md"
    }
  ]
}
```

Or paste inline (shorter prompts work better inline):

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "text": "You are a code refactoring specialist. Preserve behavior, one operation at a time, tests gate every step. Detect smells before acting. Revert immediately on test failure."
    }
  ]
}
```

## Usage in Copilot Chat

```
@workspace Refactor the processOrder function in src/orders.ts

/explain what smells does this class have?

Refactor: extract the discount logic into a separate function
```

## Limitations

Copilot Chat does not have direct file system access to run tests — it generates code changes that you apply manually or via the editor. Verify tests pass yourself after each suggested change.

For full automated test-gating, use an agent with shell access (Aider, Claude Code, Cursor Agent mode).
