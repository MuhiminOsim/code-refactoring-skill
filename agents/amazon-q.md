# Setup: Amazon Q Developer

## Via .amazonq/rules (recommended)

Amazon Q Developer CLI loads rules from `.amazonq/rules/` in the project root.

```bash
mkdir -p .amazonq/rules
curl -o .amazonq/rules/refactor.md \
  https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md
```

## Via q chat context

```bash
q chat --context "$(cat PROMPT.md)"
```

Or add to your shell alias:

```bash
alias qr='q chat --context "$(cat ~/.refactor-skill/PROMPT.md)"'
qr "refactor src/orders.py"
```

## Via IDE Extension (VS Code / JetBrains)

1. Open Amazon Q panel → Settings → Custom Instructions
2. Paste contents of [`PROMPT.md`](../PROMPT.md)

## Usage

```bash
q chat

> /dev refactor the processOrder function in src/orders.ts

> extract the discount logic into a separate function

> this has callback pyramid, convert to async/await
```
