---
name: refactor
description: >
  Safe, incremental, behavior-preserving code refactoring for ANY programming language.
  Detects code smells, applies operations from the Fowler catalog and modern patterns,
  makes one change at a time, verifies tests pass after each step.
  Trigger on: "refactor", "clean up", "clean this up", "extract", "rename", "simplify",
  "decompose", "restructure", "improve readability", "reduce complexity", "remove duplication",
  "pull this out", "break this apart", "this is too long", "hard to understand",
  "technical debt", "code smell", "too many parameters", "god class", "big function",
  "make this cleaner", "this needs work", "tidy up", "reorganize", "modernize".
---

# Refactoring Specialist

Safe, incremental, behavior-preserving code improvements for any language.

## Core Contract

1. **Behavior is preserved.** Every change leaves the program doing exactly the same thing externally. If a change alters behavior, it is not a refactoring — it is a feature change requiring explicit user opt-in.
2. **One operation at a time.** No bundling multiple logical changes into one step. Each step is independently verifiable and revertable.
3. **Tests gate every step.** Run tests after each edit. If tests fail, revert immediately — do not fix forward.

---

## Quick Reference

| What you need | Reference file |
|---|---|
| Step-by-step process to follow every time | [process.md](references/process.md) |
| Detect smells before choosing an operation | [smells.md](references/smells.md) |
| When to stop, warn, or ask | [safety.md](references/safety.md) |
| Extract, Inline, Split, Decompose | [catalog-composing.md](references/catalog-composing.md) |
| Conditionals, Guards, Polymorphism | [catalog-simplifying.md](references/catalog-simplifying.md) |
| Move, Organize, Encapsulate | [catalog-organizing.md](references/catalog-organizing.md) |
| Rename, Parameter Objects, Factory | [catalog-api.md](references/catalog-api.md) |
| Inheritance, Composition over Inheritance | [catalog-inheritance.md](references/catalog-inheritance.md) |
| FP, Async, Reactive, DI patterns | [catalog-modern.md](references/catalog-modern.md) |
| Language idioms and test commands | [language-profiles.md](references/language-profiles.md) |

---

## Decision Tree

**"Just refactor this" / "clean this up" / "this smells"** (no specific operation given)
→ Read `smells.md`. Diagnose. Present ranked findings. Confirm priority with user. Then follow `process.md`.

**Specific operation requested** (e.g., "extract this into a function", "rename X to Y")
→ Check `safety.md` for red lines. If clear, go directly to `process.md` §4 Execution Loop.

**Large file or large codebase** (file >500 lines, or change touches >3 files)
→ Read `safety.md` §6 Large Codebase Protocol before anything else.

**Language you haven't seen before in this session**
→ Check `language-profiles.md`. If language not listed, ask user: "What command runs your tests?" Then proceed.

**Something feels risky** (public API, serialization, concurrency, no tests)
→ Read `safety.md` §3 Red Lines before touching anything. Stop and ask if any red line applies.

---

## Refactoring in 30 Seconds

For experienced users who just want the loop:

1. Read target file(s) completely
2. Detect smells → present ranked list
3. Confirm operation order with user
4. For each step: state op → show diff → apply → run tests → confirm or revert
5. Summarize changes; suggest (but don't apply) follow-ons

Full detail: [process.md](references/process.md)

---

## What This Skill Does NOT Do

- Does not change external behavior without user approval
- Does not fix bugs while refactoring (separate concerns)
- Does not apply multiple operations in one edit
- Does not refactor code it hasn't read
- Does not skip tests "just this once"
