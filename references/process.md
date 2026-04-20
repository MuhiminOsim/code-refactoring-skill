# Universal Refactoring Process

Follow this process for every refactoring session, regardless of language or operation. Phases are sequential — do not skip ahead.

---

## Phase 1: Intake

**Goal:** Understand the code before touching it.

1. **Read all target files completely** using the Read tool. Do not skim. If a file is >500 lines, read the relevant function/class only — but note the file boundaries.
2. **Detect the language.** Check `language-profiles.md` for the matching entry. If not listed, ask: *"What command runs your tests?"* — one question, then proceed.
3. **Find the test harness.** Use Glob to search for test files (`**/*.test.*`, `**/*_test.*`, `**/test_*.*, `**/*.spec.*`, `tests/`, `spec/`). Note the test command.
4. **Ask ONE clarifying question** if scope is genuinely ambiguous (e.g., "Should I refactor just this function or the whole class?"). Do not ask multiple questions. If scope is clear, skip this step.

Do not make any edits in this phase.

---

## Phase 2: Smell Detection

**Goal:** Diagnose before prescribing.

1. Work through the smell families in `smells.md` against the code you just read.
2. Rank detected smells:
   - **Blocker** — prevents understanding or modification (e.g., 200-line function, god class)
   - **Major** — significant duplication, coupling, or complexity
   - **Minor** — naming, small structural issues
3. Present findings as a numbered list before doing anything:

```
Detected smells (ranked):
1. [Blocker] Long Method — processOrder() at orders.ts:45 (142 lines). Recommend: Extract Method.
2. [Major] Duplicate Code — discount logic repeated at orders.ts:67 and cart.ts:23. Recommend: Extract Function.
3. [Minor] Primitive Obsession — price passed as raw float. Recommend: Replace with Money value object.
```

4. **Do not change any code yet.** If user gave a specific operation (not "clean this up"), skip smell detection and go to Phase 4 directly.

---

## Phase 3: Planning

**Goal:** Agree on a safe, ordered sequence before touching anything.

1. Decompose the agreed work into **atomic steps** — each step is one refactoring operation.
2. Each step must be:
   - Independently verifiable (tests can confirm it after this step alone)
   - Non-breaking on its own (not half of an operation)
   - Scoped to the minimum required change
3. State the sequence explicitly before starting:

```
Plan:
1. Extract calculateDiscount() from processOrder() (lines 67–89)
2. Extract applyTaxes() from processOrder() (lines 91–110)
3. Inline the remaining processOrder() body — now only 15 lines
```

4. **Flag any step that touches the public API, serialization, or concurrency.** Ask for explicit confirmation before including it.
5. Check `safety.md` §3 Red Lines. If any apply, stop and resolve before proceeding.

---

## Phase 4: Execution Loop

**Repeat this loop for each step in the plan:**

### Before each edit — Atomic Step Checklist
Verify all of these before writing a single character:
- [ ] Scope defined (exactly which function/class/lines)
- [ ] Tests exist and currently pass (run them now if not verified recently)
- [ ] This change preserves the public API and external behavior
- [ ] This is exactly one logical change — nothing piggybacks
- [ ] The resulting diff will be reviewable in under 2 minutes

### During each edit
1. **State the operation**: *"Performing: Extract Method — extracting lines 67–89 into `calculateDiscount()`"*
2. **Show before/after** in a code block:
```
BEFORE:
  // lines 67-89 inline in processOrder()
  let discount = 0;
  if (user.isPremium) { discount = price * 0.2; }
  ...

AFTER:
  function calculateDiscount(user, price) { ... }
  // processOrder() now calls calculateDiscount(user, price)
```
3. **Apply the change** using Edit.
4. **Run tests** using Bash. Show the exact command and output.
5. **On test failure:**
   - Revert the edit immediately (restore original content with Edit)
   - State: *"Reverting: [operation name] — [test name] failed with: [exact error]"*
   - Diagnose root cause. Propose a safer decomposition.
   - Do NOT attempt to fix forward. Do NOT proceed to the next step.
6. **On test pass:** Confirm: *"Step 1 complete. Tests pass."* Then proceed to next step.

### Special cases
- **No test suite:** Before starting, state: *"No tests found. Proceeding at user's explicit acknowledgment that behavior verification is manual."* Require user confirmation.
- **Tests take >30s:** Identify a subset (e.g., `pytest tests/orders/`) and run that. Note which tests were skipped.
- **Compiled language:** Run build/typecheck (`tsc --noEmit`, `go build ./...`, `cargo check`) in addition to tests.

---

## Phase 5: Wrap-Up

**Goal:** Leave the user with a complete picture of what changed and what's next.

1. **Summary table:**

```
Changes applied:
┌─────────────────────────────────────┬──────────────┬──────────────┐
│ Operation                           │ File         │ Line delta   │
├─────────────────────────────────────┼──────────────┼──────────────┤
│ Extract Method → calculateDiscount  │ orders.ts    │ +12 / -14    │
│ Extract Method → applyTaxes         │ orders.ts    │ +10 / -11    │
└─────────────────────────────────────┴──────────────┴──────────────┘
Net: processOrder() reduced from 142 to 38 lines.
```

2. **Scope discipline statement:** *"I did not touch: cart.ts, user.ts — the duplicate discount logic there is a separate smell (item #2 from detection). Recommend addressing in a follow-on."*

3. **Follow-on suggestions** (list only — do not act on these without user request):
   - Remaining smells from Phase 2 that were not addressed
   - New smells introduced or revealed by the refactoring
   - Related improvements in adjacent files

---

## Quick Rules (always active)

- Never read a file and immediately edit it — always state the plan first
- Never apply two logical changes in one Edit call
- Never add new behavior while refactoring (no "while I'm here" bug fixes)
- Never skip tests because "it's just a rename" — renames break callers
- Never assume a file hasn't changed since you last read it in a long session — re-read before editing
