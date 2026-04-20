# Setup: OpenHands (formerly OpenDevin)

OpenHands is a fully autonomous agent with terminal access — it can run tests automatically, making it ideal for the full refactoring workflow with test-gating.

## Via System Prompt Configuration

In `config.toml` (OpenHands config):

```toml
[core]
system_prompt = """
<paste PROMPT.md contents here>
"""
```

Or reference a file:

```toml
[core]
system_prompt_file = "/path/to/PROMPT.md"
```

## Via Runtime Task Description

When starting a task, include the skill instructions in your initial message:

```
[paste PROMPT.md contents]

---

Now refactor the processOrder function in src/orders.ts. It's 200 lines and does too many things. Run tests after each step.
```

## Why OpenHands Works Well

OpenHands has a full bash terminal — it can:
- Run your test suite after every edit
- Revert via `git checkout` on failure
- Grep for call sites before renaming
- Read multiple files in sequence

The skill's 5-phase process and rollback protocol map directly to what OpenHands can do autonomously.

## Usage

```
Refactor src/orders.ts following safe refactoring practices:
1. Read the file
2. Detect code smells
3. Show me the plan
4. Execute one step at a time, running npm test after each change
5. Revert immediately if any test fails
```
