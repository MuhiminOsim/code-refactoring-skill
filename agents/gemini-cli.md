# Setup: Gemini CLI

## Via GEMINI.md (recommended)

Gemini CLI automatically loads `GEMINI.md` from the project root (and parent directories).

```bash
curl -o GEMINI.md \
  https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md
```

## Via --system-instruction flag

```bash
gemini --system-instruction "$(cat PROMPT.md)" "refactor src/orders.ts"
```

Or set once as an alias:

```bash
alias gemini-refactor='gemini --system-instruction "$(cat ~/.refactor-skill/PROMPT.md)"'
gemini-refactor "extract the discount logic from processOrder"
```

## Via settings.json

Add to `~/.gemini/settings.json`:

```json
{
  "systemInstruction": "<paste PROMPT.md contents here>"
}
```

## Usage

```bash
# Interactive session
gemini

> Refactor processOrder in src/orders.ts — it's 200 lines

> Extract the validation logic into a separate function

> Replace this callback pyramid with async/await
```
