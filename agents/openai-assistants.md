# Setup: OpenAI Assistants API / ChatGPT Custom GPT

## OpenAI Assistants API

Set `PROMPT.md` as the system instruction when creating your assistant:

```python
from openai import OpenAI
from pathlib import Path

client = OpenAI()

system_prompt = Path("PROMPT.md").read_text()

assistant = client.beta.assistants.create(
    name="Code Refactoring Specialist",
    instructions=system_prompt,
    model="gpt-4o",
    tools=[{"type": "code_interpreter"}]  # optional: for running code
)
```

Or via the OpenAI Playground:
1. Go to [platform.openai.com/assistants](https://platform.openai.com/assistants)
2. Create new assistant
3. Paste `PROMPT.md` into the "Instructions" field

## ChatGPT Custom GPT

1. Go to [chatgpt.com/gpts/editor](https://chatgpt.com/gpts/editor)
2. In the "Instructions" field, paste the contents of `PROMPT.md`
3. Set name: "Code Refactoring Specialist"
4. Optionally upload the `references/` files as knowledge files

## ChatGPT System Prompt (Projects or Custom Instructions)

If you use ChatGPT Projects:
1. Open your project → Settings → Custom Instructions
2. Paste `PROMPT.md` contents

Or via Custom Instructions (global):
1. ChatGPT → Profile → Custom Instructions
2. In "How would you like ChatGPT to respond?" — paste the core rules from `PROMPT.md`

## Note on Test Execution

ChatGPT and the Assistants API (without code_interpreter + a connected environment) cannot run your actual test suite. The agent will suggest changes and describe what tests to run — you run them yourself and report results back.

For automated test-gating, use an agent with terminal access.
