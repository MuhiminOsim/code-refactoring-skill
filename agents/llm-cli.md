# Setup: llm, sgpt, shell_gpt, and other LLM CLIs

For any CLI tool that calls an LLM, the pattern is the same: provide `PROMPT.md` as the system prompt.

---

## llm (Simon Willison's llm)

```bash
# Install once globally
pip install llm

# Create a reusable template
llm --system "$(cat PROMPT.md)" --save refactor

# Use it
llm -t refactor "Refactor the processOrder function in orders.py"

# Or pipe a file
cat src/orders.py | llm -t refactor "This function is too long, extract the discount logic"
```

## sgpt / shell_gpt

```bash
pip install shell-gpt

# Set as a role
sgpt --create-role refactor
# When prompted for instructions, paste PROMPT.md contents

# Use it
sgpt --role refactor "Refactor src/orders.ts"
```

## openai (official CLI)

```bash
openai api chat.completions.create \
  -m gpt-4o \
  --message system "$(cat PROMPT.md)" \
  --message user "Refactor the processOrder function"
```

## Anthropic Claude CLI

```bash
# Using the Anthropic API directly
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d "{
    \"model\": \"claude-sonnet-4-6\",
    \"system\": $(jq -Rs . < PROMPT.md),
    \"messages\": [{\"role\": \"user\", \"content\": \"Refactor this function\"}],
    \"max_tokens\": 4096
  }"
```

## Ollama (local models)

```bash
# Start a session with system prompt
ollama run codellama --system "$(cat PROMPT.md)"

# Or via API
curl http://localhost:11434/api/generate -d "{
  \"model\": \"codellama\",
  \"system\": $(jq -Rs . < PROMPT.md),
  \"prompt\": \"Refactor the processOrder function\"
}"
```

## LM Studio (local models)

In the LM Studio chat interface:
1. Click the system prompt field
2. Paste contents of `PROMPT.md`
3. Start chatting

Via LM Studio's OpenAI-compatible API:

```python
from openai import OpenAI

client = OpenAI(base_url="http://localhost:1234/v1", api_key="lm-studio")

response = client.chat.completions.create(
    model="local-model",
    messages=[
        {"role": "system", "content": open("PROMPT.md").read()},
        {"role": "user", "content": "Refactor processOrder in orders.py"}
    ]
)
```

## Generic Shell Alias

Set up a universal alias that works with any model:

```bash
# Add to ~/.zshrc or ~/.bashrc
export REFACTOR_PROMPT="$(cat ~/.refactor-skill/PROMPT.md)"

# Then use with any CLI
alias refactor-claude='claude --system "$REFACTOR_PROMPT"'
alias refactor-gpt='sgpt --role refactor'
alias refactor-local='ollama run codellama --system "$REFACTOR_PROMPT"'
```

## One-Time Install

```bash
git clone https://github.com/MuhiminOsim/code-refactoring-skill ~/.refactor-skill

# Add to shell profile
echo 'export REFACTOR_PROMPT_PATH="$HOME/.refactor-skill/PROMPT.md"' >> ~/.zshrc
```
