# Setup: Zed

## Via .rules file (recommended)

Zed loads `.rules` from the project root for AI context.

```bash
curl -o .rules \
  https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md
```

## Via Assistant System Prompt

1. Open Zed → Settings (`cmd+,`) → search "assistant"
2. Add to `settings.json`:

```json
{
  "assistant": {
    "default_model": {
      "provider": "anthropic",
      "model": "claude-sonnet-4-6"
    },
    "version": "2"
  }
}
```

Then in the Assistant panel, click the system prompt icon and paste [`PROMPT.md`](../PROMPT.md).

## Usage

Open the AI Assistant panel (`cmd+?`) and type:

```
Refactor the processOrder function — it's too long

Extract the discount logic into a separate function

Replace these nested if-statements with guard clauses
```

## Note

Zed's inline assistant (`ctrl+enter` on selection) does not use the full system prompt — it's for targeted edits. For full refactoring sessions with smell detection and test-gating, use the Assistant panel.
