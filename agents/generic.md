# Setup: Any Agent or CLI

If your tool accepts a system prompt, custom instructions, or a rules file — this skill works with it.

## The Universal Pattern

Every agent has one of these mechanisms:

### 1. System prompt / instructions field
Paste the contents of [`PROMPT.md`](../PROMPT.md) into whatever your tool calls its "system prompt", "instructions", "custom instructions", "rules", or "persona".

### 2. Rules / context file in the project
Many tools automatically load markdown files from your project:

| Tool | File to create |
|---|---|
| Cursor | `.cursor/rules/refactor.mdc` |
| Copilot | `.github/copilot-instructions.md` |
| Continue | `.continuerules` |
| Windsurf | `.windsurfrules` |
| Zed | `.rules` |
| Aider | `CONVENTIONS.md` |
| Any tool with auto-load | Check your tool's docs for the filename |

In all cases, the content is the same — paste or symlink `PROMPT.md`:

```bash
# Download once
curl -o PROMPT.md \
  https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md

# Then copy to the right location for your tool
cp PROMPT.md .github/copilot-instructions.md   # Copilot
cp PROMPT.md .cursor/rules/refactor.mdc        # Cursor
cp PROMPT.md .windsurfrules                    # Windsurf
cp PROMPT.md .continuerules                    # Continue
cp PROMPT.md CONVENTIONS.md                    # Aider
```

### 3. CLI flag
Many CLI tools accept a system prompt as a flag:

```bash
# Generic pattern
your-ai-cli --system-prompt "$(cat PROMPT.md)" "refactor src/orders.py"

# llm (Simon Willison's llm)
llm -s "$(cat PROMPT.md)" "refactor this function"

# sgpt / shell_gpt
sgpt --role refactor "extract the discount logic"

# Gemini CLI
gemini --system-instruction "$(cat PROMPT.md)" "refactor src/orders.ts"

# Amazon Q CLI
q chat --context "$(cat PROMPT.md)"
```

### 4. API call
If you're calling an LLM API directly:

```python
# Any OpenAI-compatible API
response = client.chat.completions.create(
    model="your-model",
    messages=[
        {"role": "system", "content": open("PROMPT.md").read()},
        {"role": "user", "content": "Refactor the processOrder function"}
    ]
)
```

```bash
# curl
curl https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d "{
    \"model\": \"gpt-4o\",
    \"messages\": [
      {\"role\": \"system\", \"content\": $(jq -Rs . < PROMPT.md)},
      {\"role\": \"user\", \"content\": \"Refactor this function\"}
    ]
  }"
```

## One-Time Setup Script

```bash
#!/bin/bash
# Install the refactoring skill for every tool you use

BASE_URL="https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md"
PROMPT=$(curl -s "$BASE_URL")

# Cursor
mkdir -p .cursor/rules && echo "$PROMPT" > .cursor/rules/refactor.mdc

# Copilot
mkdir -p .github && echo "$PROMPT" > .github/copilot-instructions.md

# Windsurf
echo "$PROMPT" > .windsurfrules

# Continue
echo "$PROMPT" > .continuerules

# Aider
echo "$PROMPT" > CONVENTIONS.md

echo "Refactoring skill installed for all detected tools."
```

## If Your Tool Isn't Listed

1. Find where your tool loads system instructions (check its docs)
2. Put the contents of `PROMPT.md` there
3. That's it — the skill is pure text, no plugins or extensions required

Open a PR to add a guide for your tool: [agents/](.)
