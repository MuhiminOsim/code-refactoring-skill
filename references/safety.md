# Safety Protocols

Read this file in full before touching any refactoring that involves public APIs, shared state, concurrent code, or files without test coverage.

---

## The Prime Directive

> **Every refactoring leaves observable behavior identical.**

If a proposed change alters what the program does externally — its outputs, side effects, errors thrown, timing, or public contract — it is **not a refactoring**. It is a feature change. Feature changes require explicit user approval before proceeding.

When in doubt, ask. The cost of a 10-second question is lower than the cost of a broken production system.

---

## §1 Pre-Conditions

**All of the following must be true before making any edit:**

- [ ] A runnable test suite exists, OR the user has explicitly acknowledged "there are no tests — I accept the risk"
- [ ] Tests pass in their current state before any change (run them now if not just confirmed)
- [ ] The scope of the change is understood — which files, which call sites, which callers
- [ ] No database migrations, serialization format changes, or wire protocol changes are in scope
- [ ] You have read (not skimmed) every file you intend to modify

If any pre-condition is unmet, stop and resolve it before proceeding.

---

## §2 Pre-Edit Checklist (repeat before every single edit)

- [ ] I have read this file's current state (not relying on a read from earlier in the session)
- [ ] I know every call site of the function/class I am modifying (Grep confirmed)
- [ ] This edit is exactly one logical operation — nothing is piggybackling
- [ ] Tests will be runnable immediately after this edit — no edit leaves the code in a broken intermediate state
- [ ] I can describe in one sentence what this edit changes and why behavior is preserved

---

## §3 Red Lines — Stop and Ask

**These situations require explicit user confirmation before ANY change:**

### Public API Changes
Any change to:
- A function/method signature that is exported or part of a public interface
- An exported symbol name (class, function, constant, type)
- A module's public import path or export structure

*Why:* Callers outside the current codebase may depend on these. You cannot grep your way to safety here.

### Serialization Format Changes
Any change that alters:
- JSON key names or structure
- Protocol buffer field names or numbers
- Database column names, table names, or schema
- File format output (CSV headers, XML tag names)
- Environment variable names read by external systems

*Why:* Serialized data persists. Old data, external systems, and config files may break silently.

### Concurrency Behavior
Any change that affects:
- Lock acquisition order
- Goroutine/thread/async boundaries
- Where side effects occur relative to awaits
- Shared mutable state access patterns

*Why:* Concurrency bugs are non-deterministic and can pass all tests while causing production incidents.

### Error Contract Changes
Any change that alters:
- What error types are thrown or returned
- Error message strings (if callers match on them)
- Whether a function can now fail where it previously couldn't (or vice versa)

*Why:* Error handling in callers is often untested and fragile.

### No Test Coverage
Proceeding on a file with zero test coverage for the target code path.

*Why:* There is no automated way to verify behavior is preserved. State this explicitly and require user acknowledgment.

### Recent Concurrent Edits
The target file was modified by another contributor in the last 24 hours (check: `git log -1 --format="%ar" <file>`).

*Why:* Your understanding of the code may already be stale. Risk of merge conflict or semantic conflict.

### Blast Radius Unknown
Any operation on a file >1000 lines where you have not mapped all callers of the target symbol.

*Why:* You may be changing something with 50 call sites, 48 of which you haven't seen.

---

## §4 Yellow Lines — Warn and Proceed with Consent

State the risk explicitly and wait for user confirmation before proceeding:

| Situation | Warning to give |
|---|---|
| Renaming a symbol with >20 call sites | "This rename touches N call sites across M files. I will update all of them. Confirm?" |
| Splitting a class used in >5 modules | "This split requires updating N import sites. Confirm the new class names before I proceed." |
| Changing parameter order in a function with >10 callers | "Changing parameter order in a function called N times. I will update all call sites. Any callers I cannot find (e.g., dynamic calls, external packages) will break silently." |
| Inlining a function used in multiple files | "Inlining will delete this function. Any callers not in the current grep scope will break. Confirm?" |
| Refactoring test code | "I am modifying test code. Tests that previously caught bugs may now pass for the wrong reason. Review carefully after." |

---

## §5 Rollback Protocol

**When a test fails after an edit:**

1. **Stop immediately.** Do not attempt further edits.
2. **Revert the edit** — restore the exact previous content using Edit.
3. **State the revert explicitly:**
   > "Reverting: [operation name] — [test name] failed with: `[exact error message]`"
4. **Diagnose** before proposing a fix:
   - Was the operation itself wrong, or was the decomposition too coarse?
   - Is there a hidden dependency that wasn't visible in the pre-read?
   - Did the operation change observable behavior after all?
5. **Propose a safer decomposition.** Often the fix is to break the step into two smaller steps, or to fix a prerequisite first.
6. **Do not "fix forward"** — do not modify the test to make it pass, and do not modify other code to paper over the failure. Understand why the refactoring broke the test.

**Pre-edit state capture:**
Before any edit session begins, note the current state:
```
git status         # confirm clean working tree or know what's already modified
git stash list     # confirm no surprise stashed changes
```

---

## §6 Large Codebase Protocol

For files >500 lines, or changes that touch >3 files:

**Reading strategy:**
- Do not read the entire file — identify the target function/class first using Grep
- Read only the target and its immediate context (the surrounding 20–30 lines)
- If you need to understand the full class, read field declarations and method signatures only, then read method bodies on demand

**Caller mapping — required before any rename:**
```
# Before renaming any symbol, run:
grep -rn "symbolName" .
# Count: how many files, how many call sites?
# If >20 call sites: Yellow Line — warn user before proceeding
```

**Change ordering:**
Apply changes in dependency order:
1. Change the deepest dependency first (the function being extracted)
2. Update its callers next
3. Update importers last

Never change a caller before the callee exists in its new form.

**Context limit discipline:**
Hold at most 3 files open in working memory at once. Finish all edits to one file before opening the next. Re-read files you haven't touched in >10 minutes — they may have been changed by earlier steps.

---

## §7 Confidence Levels

Before each operation, assess your confidence:

| Level | Meaning | Action |
|---|---|---|
| **High** | Behavior preservation is obvious from the code and confirmed by tests | Proceed |
| **Medium** | Behavior preservation seems correct but there are untested paths | State assumption, proceed, flag for test review |
| **Low** | Not certain whether behavior is preserved | Stop. Either gain confidence (more reading, more test coverage) or ask the user |

Never proceed at Low confidence. A refactoring you're not sure about is worse than no refactoring.

---

## §8 Architectural Refactoring Protocol

Read this section in full before acting on any smell from **Family 6: Architectural Violations** in `smells.md`.

Architectural refactoring is the highest-risk category in this skill because:
- Multiple files are always affected
- Logic moves between layers — subtle behavioral differences can appear even when the code looks identical
- Cross-layer test coverage is often thin, meaning failures may not surface immediately
- The blast radius of a mistake is large: a misplaced responsibility can cascade into build failures or runtime errors across the codebase

---

### §8.1 Pre-Conditions (all must be true before touching a single file)

- [ ] **Current architecture is mapped.** You know which file is in which layer. Use Grep to trace imports and identify the actual layer structure — do not assume from directory names alone.
- [ ] **Target pattern is confirmed by user.** Never assume the user wants MVVM over MVP, or Clean Architecture over Layered. Ask explicitly: *"What target architecture pattern should I refactor toward?"*
- [ ] **Scope is bounded.** You know exactly which files will be touched and which will not.
- [ ] **Tests exist for the logic being moved.** If no tests cover the code path being relocated, stop. Either write tests first (with user approval) or require explicit user acknowledgment of the risk.
- [ ] **All call sites of the code being moved are mapped.** Run Grep before moving anything.

---

### §8.2 The Moving Invariant

**Never change logic AND location in the same step.**

Every architectural move uses this three-step sequence:

```
Step A — Introduce:  Create the new location. Old location delegates to new. Tests must pass.
Step B — Redirect:   All callers updated to use new location. Old location is now dead code. Tests must pass.
Step C — Remove:     Delete old location. Tests must pass.
```

If tests fail at any step, revert that step only — do not proceed. Do not fix forward.

This invariant applies at every granularity: moving a single method, a whole class, or a group of classes all follow this same sequence.

---

### §8.3 Architectural Red Lines — Stop and Ask

These require explicit user confirmation before any change:

**Moving code that has side effects (emails, payments, job queues, audit logs)**
Side effects must have a clear owner in the target architecture. Moving them to a different layer changes who is responsible for them and when they fire. Ask: *"After this move, which layer is responsible for triggering [side effect]?"*

**Introducing a new layer where none existed**
Adding a domain layer, a use case layer, or a repository layer to a codebase that lacks one is a large structural change. Map the full blast radius (how many files will need to import the new layer?) and confirm with user before proceeding.

**Moving code that participates in a transaction boundary**
If the code being moved is currently inside a database transaction, moving it to a different layer may place it outside the transaction scope. This can cause partial writes or lost updates. Stop and confirm transaction ownership before proceeding.

**Moving a type that is part of a serialization contract**
If the type being moved (e.g., an ORM entity) is serialized to JSON, written to a database, or shared over a protocol, moving it to a new layer or renaming it can break existing data or external consumers. This is a Red Line from §3 — treat it as such.

---

### §8.4 Architectural Yellow Lines — Warn and Proceed with Consent

| Situation | Warning to give |
|---|---|
| File crosses layer boundary in more than 3 import statements | "This file has N cross-layer imports. I will address them one at a time. Confirm the order?" |
| Introducing a Repository for an entity queried in >5 files | "The repository will affect N files. I will migrate callers one at a time. Confirm?" |
| Domain object gaining its first dependency on anything external | "This is the domain object's first external dependency. Confirm it belongs in domain and not application layer." |
| Adding a Use Case that spans more than 2 aggregate roots | "This Use Case touches multiple aggregates. That's a coordination concern — confirm it belongs in application layer, not domain." |

---

### §8.5 Architecture Mapping Protocol

Before any architectural refactoring, produce a layer map. Present it to the user before proceeding.

```
Architecture Map — [Project Name]:
┌─────────────────────────────────────────────┐
│ Presentation  │ controllers/, views/        │
│ Application   │ services/, use_cases/       │
│ Domain        │ models/, domain/            │
│ Infrastructure│ repositories/, db/, clients/│
└─────────────────────────────────────────────┘

Violations found:
- controllers/OrderController.ts imports from repositories/ (skips domain)
- models/User.ts imports from services/ (inverted dependency)

Target pattern: [confirmed by user]
```

Do not begin Step A of any operation until this map is presented and confirmed.

---

### §8.6 Confidence Standard for Architectural Refactoring

Architectural changes require **High** confidence before each step (see §7). Medium confidence is not sufficient because the blast radius is too large.

If you are not certain that moving a piece of logic preserves behavior exactly:
1. Read both the source and destination contexts again
2. Trace all callers in both layers
3. If still uncertain, do not move — ask the user to add a test that pins the behavior first
