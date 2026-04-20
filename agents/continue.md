# Setup: Continue

## Via config.json System Message

Edit your Continue config (`~/.continue/config.json`):

```json
{
  "models": [
    {
      "title": "Claude (Refactoring)",
      "provider": "anthropic",
      "model": "claude-sonnet-4-6",
      "systemMessage": "<paste PROMPT.md contents here>"
    }
  ]
}
```

Or fetch dynamically:

```bash
# Download the prompt
curl -o ~/.continue/refactor-prompt.md \
  https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md
```

Then reference in config:
```json
{
  "systemMessage": "$(cat ~/.continue/refactor-prompt.md)"
}
```

## Via .continuerules (project-scoped)

Create `.continuerules` in your project root:

```bash
curl -o .continuerules \
  https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md
```

Continue loads `.continuerules` automatically for projects that contain it.

## Usage

In the Continue sidebar:

```
@file src/orders.py Refactor the processOrder function

Extract the validation logic into its own method

These callbacks are callback hell, convert to async/await
```

## With Context Providers

Use Continue's `@file` context provider to include specific reference files:

```
@file ~/.continue/refactor-skill/references/catalog-simplifying.md
Replace these nested conditionals with guard clauses
```
