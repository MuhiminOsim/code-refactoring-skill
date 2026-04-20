# Code Refactoring Skill

A world-class refactoring skill for **any AI coding agent**. Safe, incremental, behavior-preserving code improvements for any programming language.

Works with Claude Code, Cursor, Aider, Continue, GitHub Copilot, OpenAI Assistants, or any LLM that accepts a system prompt.

Built on Martin Fowler's refactoring catalog, extended with modern patterns for functional programming, async/await, reactive systems, and dependency injection.

---

## What It Does

- **Detects code smells** across 5 families (Bloat, OO Abusers, Change Preventers, Dispensables, Couplers)
- **Applies 60+ refactoring operations** from the complete Fowler catalog + modern patterns
- **Works in any language** — TypeScript, Python, Go, Rust, Java, Kotlin, C#, Swift, Ruby, C/C++, SQL, and more
- **Tests gate every step** — runs your test suite after each change; reverts immediately on failure
- **One operation at a time** — no bundled changes, every step is independently verifiable
- **Safety-first** — explicit red lines for public APIs, serialization formats, and concurrent code

---

## Installation

### Interactive installer

```bash
npx code-refactoring-skill
```

Prompts for:
1. **Scope** — Global (home dir, all projects) or Project (current directory)
2. **Agent(s)** — pick one, several, or all

| # | Agent | Global install path | Project install path |
|---|---|---|---|
| 1 | Any / Generic | `~/.agents/skills/refactor/` | — |
| 2 | Claude Code | `~/.claude/skills/refactor/` | — |
| 3 | Aider | `~/.aider-refactor-skill/` | `CONVENTIONS.md` |
| 4 | Gemini CLI | `~/.gemini/refactor-prompt.md` | `GEMINI.md` |
| 5 | Continue | `~/.continue/refactor-prompt.md` | `.continuerules` |
| 6 | Cursor | `~/.cursor/rules/refactor.mdc` | `.cursor/rules/refactor.mdc` |
| 7 | Windsurf | `~/.codeium/windsurf/memories/refactor.md` | `.windsurfrules` |
| 8 | GitHub Copilot | `~/.config/github-copilot/refactor-prompt.md` | `.github/copilot-instructions.md` |
| 9 | Zed | `~/.config/zed/refactor-prompt.md` | `.rules` |
| 10 | Amazon Q | `~/.aws/amazonq/rules/refactor.md` | `.amazonq/rules/refactor.md` |
| 11 | OpenHands | — | `.openhands/microagents/refactor.md` |
| 12 | Sourcegraph Cody | — | `.cody/context.md` |
| 13 | OpenAI Assistants | `~/.openai-refactor-skill/PROMPT.md` | — |

### Manual install (any agent)

Copy [`PROMPT.md`](PROMPT.md) into your agent's system prompt, custom instructions, or rules file. That's the complete self-contained skill — no other files needed.

```bash
curl -O https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md
```

For a generic global install:

```bash
mkdir -p ~/.agents/skills/refactor
curl -o ~/.agents/skills/refactor/PROMPT.md \
  https://raw.githubusercontent.com/MuhiminOsim/code-refactoring-skill/main/PROMPT.md
```

### Claude Code (git install)

```bash
git clone https://github.com/MuhiminOsim/code-refactoring-skill \
  ~/.claude/skills/refactor
```

The skill auto-activates — no configuration needed.

### Agent-specific setup guides

| Agent / CLI | Guide |
|---|---|
| **Any tool** (universal pattern) | [agents/generic.md](agents/generic.md) |
| Claude Code | [agents/claude-code.md](agents/claude-code.md) |
| Cursor | [agents/cursor.md](agents/cursor.md) |
| Windsurf | [agents/windsurf.md](agents/windsurf.md) |
| Aider | [agents/aider.md](agents/aider.md) |
| Continue | [agents/continue.md](agents/continue.md) |
| GitHub Copilot | [agents/copilot.md](agents/copilot.md) |
| Sourcegraph Cody | [agents/cody.md](agents/cody.md) |
| Zed | [agents/zed.md](agents/zed.md) |
| Gemini CLI | [agents/gemini-cli.md](agents/gemini-cli.md) |
| Amazon Q Developer | [agents/amazon-q.md](agents/amazon-q.md) |
| OpenHands | [agents/openhands.md](agents/openhands.md) |
| llm, sgpt, Ollama, LM Studio | [agents/llm-cli.md](agents/llm-cli.md) |
| OpenAI Assistants / ChatGPT | [agents/openai-assistants.md](agents/openai-assistants.md) |

---

## Usage

Trigger the skill by asking Claude Code to refactor, with any of these phrases:

| Trigger phrase | What happens |
|---|---|
| "refactor this" / "clean this up" | Detects smells, presents ranked findings, confirms before acting |
| "extract this into a function" | Goes directly to execution |
| "rename X to Y" | Renames with full call-site mapping via grep |
| "simplify these conditionals" | Applies guard clauses, consolidation, or polymorphism |
| "this function is too long" | Diagnoses, extracts methods, verifies tests |
| "remove this duplication" | Identifies shared logic, extracts and consolidates |
| "modernize this" | Applies async/await, pipelines, value types, DI patterns |

### Example session

```
You: This function is too long, clean it up

Claude: Reading processOrder() at orders.ts:45 (142 lines)...

Detected smells (ranked):
1. [Blocker] Long Method — processOrder() is 142 lines with 4 internal sections
2. [Major] Duplicate Code — discount logic at lines 67–89 also appears in cart.ts:23
3. [Minor] Primitive Obsession — price passed as raw float

Plan:
1. Extract calculateDiscount() from lines 67–89
2. Extract applyTaxes() from lines 91–110
3. Extract formatOrderSummary() from lines 112–130
Confirm? (tests will run after each step)

You: Yes, go

Claude: Step 1: Performing Extract Method — calculateDiscount()

BEFORE: [lines 67–89 inline in processOrder()]
AFTER:  [new calculateDiscount(user, price) function]

Running tests... npm test ✓ (all 47 tests pass)
Step 1 complete.

Step 2: Performing Extract Method — applyTaxes()
...
```

---

## How It Works

The skill follows a strict 5-phase process for every refactoring request:

```
Phase 1: Intake      → Read all target files, detect language, find test harness
Phase 2: Diagnose    → Detect and rank code smells
Phase 3: Plan        → Decompose into atomic, verifiable steps
Phase 4: Execute     → Apply one change at a time, run tests after each
Phase 5: Wrap-up     → Summarize changes, suggest (not apply) follow-ons
```

Full detail: [`references/process.md`](references/process.md)

---

## File Structure

```
.
├── SKILL.md                      ← Skill entry point (triggers, decision tree)
└── references/
    ├── process.md                ← Universal 5-phase workflow
    ├── smells.md                 ← Code smell catalog (5 families, 25+ smells)
    ├── safety.md                 ← Red lines, yellow lines, rollback protocol
    ├── catalog-composing.md      ← Extract, Inline, Split, Decompose
    ├── catalog-simplifying.md    ← Conditionals, Guards, Polymorphism
    ├── catalog-organizing.md     ← Move, Organize, Encapsulate
    ├── catalog-api.md            ← Rename, Parameter Objects, Factory
    ├── catalog-inheritance.md    ← Inheritance, Composition over Inheritance
    ├── catalog-modern.md         ← FP, Async, Reactive, DI patterns
    └── language-profiles.md      ← Per-language idioms, test commands, linters
```

---

## Refactoring Operations Covered

### Composing Methods
Extract Method/Function, Inline Method/Function, Extract Variable, Inline Variable, Replace Temp with Query, Split Temporary Variable, Remove Assignments to Parameters, Substitute Algorithm, Split Loop, Replace Loop with Pipeline

### Simplifying Conditionals
Decompose Conditional, Consolidate Conditional Expression, Remove Control Flag, Replace Nested Conditional with Guard Clauses, Replace Conditional with Polymorphism, Introduce Null Object, Introduce Assertion, Separate Query from Modifier (CQS), Remove Dead Code, Simplify Boolean

### Organizing Data & Moving Features
Move Method/Function, Move Field, Extract Class, Inline Class, Hide Delegate, Remove Middle Man, Replace Data Value with Object, Replace Array with Object, Encapsulate Variable/Field, Rename Field

### API & Method Signatures
Rename Function/Method/Variable/Class, Add/Remove Parameter, Parameterize Function, Remove Flag Argument, Preserve Whole Object, Replace Parameter with Query, Replace Query with Parameter, Introduce Parameter Object, Replace Constructor with Factory Function, Replace Error Code with Exception/Result Type, Return Modified Value

### Inheritance & Hierarchy
Pull Up/Push Down Method/Field, Extract Superclass, Extract Interface/Protocol, Collapse Hierarchy, Replace Subclass with Delegate, Replace Superclass with Delegate, Remove Subclass

### Modern Patterns
FP: Immutable Reduce, Pipeline Composition, Pure Functions  
Async: async/await migration, Parallel consolidation (Promise.all / Task.WhenAll)  
DI: Extract Interface for Testability, Replace Static with Injected Dependency, Repository Pattern  
Reactive: Replace Polling with Observable, State Machine, Command Object  
Idioms: Exhaustive Pattern Matching, Named Arguments, Value Types/Records

---

## Language Support

| Language | Test Command | Formatter |
|---|---|---|
| TypeScript/JavaScript | `npx jest` / `npx vitest` | prettier, eslint |
| Python | `pytest` | black, ruff |
| Go | `go test ./...` | gofmt, golangci-lint |
| Rust | `cargo test` | rustfmt, clippy |
| Java | `./gradlew test` | spotless |
| Kotlin | `./gradlew test` | ktlint |
| C# | `dotnet test` | dotnet format |
| Swift | `swift test` | swiftformat |
| Ruby | `bundle exec rspec` | rubocop |
| C/C++ | `ctest` | clang-format |
| SQL | manual + EXPLAIN ANALYZE | sqlfluff |

Don't see your language? The skill will ask you for the test command and proceed with language-agnostic operations.

---

## Safety Model

The skill has three tiers of safety enforcement:

### Red Lines (stop and ask before ANY change)
- Public API changes (exported symbols, function signatures, module paths)
- Serialization format changes (JSON keys, database columns, proto fields)
- Concurrency behavior changes (lock ordering, async boundaries)
- Error contract changes (types thrown, messages matched by callers)
- Files with no test coverage
- Files with recent concurrent edits

### Yellow Lines (warn, require confirmation)
- Renaming a symbol with >20 call sites
- Splitting a class used in >5 modules
- Changing parameter order with >10 callers
- Inlining a function present in multiple files

### Rollback Protocol
On any test failure after an edit:
1. Revert the edit immediately
2. State exactly which test failed and with which error
3. Diagnose root cause
4. Propose a safer decomposition

**The skill never fixes forward.** A refactoring that breaks a test is reverted, diagnosed, and re-approached safely.

Full detail: [`references/safety.md`](references/safety.md)

---

## Code Smell Detection

Before applying any operation (when no specific operation is requested), the skill diagnoses:

| Family | Examples |
|---|---|
| **Bloat** | Long Method, Large Class, Long Parameter List, Data Clumps, Primitive Obsession |
| **OO Abusers** | Switch on Type, Temporary Field, Refused Bequest, Alternative Classes |
| **Change Preventers** | Divergent Change, Shotgun Surgery, Parallel Inheritance Hierarchies |
| **Dispensables** | Duplicate Code, Dead Code, Lazy Class, Speculative Generality |
| **Couplers** | Feature Envy, Inappropriate Intimacy, Message Chains, Middle Man |

Full catalog with grep patterns: [`references/smells.md`](references/smells.md)

---

## Design Principles

**Why one operation at a time?**  
Bundling changes makes failures hard to diagnose and reverts destructive. Each atomic step can be verified independently, and any failure has a clear, minimal cause.

**Why smell detection before acting?**  
Jumping straight to a requested operation can optimize the wrong thing. Smells are diagnosed first so the most impactful change is done first — not the first one mentioned.

**Why separate catalog files?**  
A single 60-operation reference would consume too much context. The decision tree in `SKILL.md` routes to exactly the catalog file needed — a composing refactoring never loads inheritance knowledge.

**Why is safety.md standalone?**  
Safety protocols must be read in full and are not operation-specific. Scattering stop conditions across catalog files creates inconsistent behavior. A dedicated file makes the red lines impossible to miss.

---

## Contributing

Pull requests welcome. Areas that would strengthen the skill:

- Agent setup guides for additional tools (Amp, Cline, Goose, etc.)
- Additional language profiles (PHP, Dart, Elixir, Haskell, Scala)
- Domain-specific patterns (database query refactoring, API design patterns)
- More modern idioms per language as standards evolve
- Additional smell detection grep patterns

When contributing catalog entries, use the existing format:
**Intent → Mechanics (numbered steps) → Example (before/after) → Inverse → Watch-outs**

When contributing agent guides, follow the structure in [`agents/cursor.md`](agents/cursor.md).

---

## License

MIT — use freely in personal and commercial projects.
