# Code Smell Detection Catalog

Use this catalog in Phase 2 of the refactoring process. Work through each family systematically. Rank findings as Blocker / Major / Minor. Present all findings before changing anything.

---

## How to Use

1. Read the target code completely first
2. Check each smell family below — symptoms are grep-friendly where possible
3. Note: file path + line number + severity for each detected smell
4. Map each smell to its recommended refactoring operation(s)
5. Present ranked list to user before acting

---

## Family 1: Bloat

Code that has grown too large to understand or change safely.

---

### Long Method / Long Function
**Symptoms:**
- Function body exceeds ~20 lines of logic (excluding blank lines and comments)
- Multiple levels of nesting (indented >3 levels deep)
- Multiple `return` / `throw` paths doing different things
- Comments that say "step 1", "step 2" inside the function body
- Hard to name what the function "does" in one verb phrase

**Detection:** Count lines between function open `{` and close `}`. Look for comment headers like `// --- Part 2 ---`.

**Severity:** Blocker if >50 lines; Major if 20–50; Minor if 15–20.

**Recommended:** Extract Method/Function (catalog-composing.md), Decompose Conditional (catalog-simplifying.md)

---

### Large Class / God Object
**Symptoms:**
- Class exceeds ~200–300 lines
- More than 7 public methods that serve different conceptual purposes
- Fields used by only a subset of methods (split personality)
- Class name contains "Manager", "Handler", "Service", "Util", "Helper", or "God"
- The class "knows" about too many other classes

**Detection:** Count public methods. Group fields by which methods use them — if they fall into 2+ disjoint groups, it's two classes.

**Severity:** Blocker if >500 lines or clearly multiple responsibilities; Major if 200–500.

**Recommended:** Extract Class (catalog-organizing.md), Move Method (catalog-organizing.md)

---

### Long Parameter List
**Symptoms:**
- Function/method has more than 3 parameters
- One or more parameters are boolean flags
- Same set of parameters passed together across multiple call sites
- Parameters with similar names or types appearing multiple times

**Detection:** Grep for function signatures with 4+ comma-separated parameters.

**Severity:** Major if >4 params or includes boolean flags; Minor if 3–4 non-flag params.

**Recommended:** Introduce Parameter Object (catalog-api.md), Preserve Whole Object (catalog-api.md), Remove Flag Argument (catalog-api.md)

---

### Data Clumps
**Symptoms:**
- The same 3+ variables/fields appear together across multiple functions or classes
- Repeatedly passing the same group of primitives (e.g., `firstName, lastName, email` always together)
- Removing one variable from the group would make the others meaningless

**Detection:** Look for function calls where the same variable names appear together repeatedly.

**Severity:** Major.

**Recommended:** Introduce Parameter Object (catalog-api.md), Replace Data Value with Object (catalog-organizing.md)

---

### Primitive Obsession
**Symptoms:**
- Raw strings for concepts like phone numbers, emails, currency, coordinates, IDs
- Raw integers for constants that have domain meaning (status codes, types, priorities)
- Parallel arrays instead of an array of objects
- Type-checking code like `if (type === "premium")`

**Detection:** Look for string/number comparisons against literal values that represent domain concepts.

**Severity:** Major if business logic depends on it; Minor otherwise.

**Recommended:** Replace Primitive with Object / Value Object (catalog-organizing.md), Replace Type Code with Class/Enum

---

## Family 2: Object-Orientation Abusers

Improper application of OO principles.

---

### Switch on Type / Repeated Type Checks
**Symptoms:**
- `switch/case` or `if/else if` chains that check a type tag (`type`, `kind`, `role`)
- The same `switch` pattern appears in multiple places
- Adding a new "type" requires finding all switch statements and adding a case

**Detection:** Grep for `switch` or chains of `if (x.type ===` / `if (x instanceof`.

**Severity:** Major if same switch appears >2 places; Minor if isolated.

**Recommended:** Replace Conditional with Polymorphism (catalog-simplifying.md), Extract Class (catalog-organizing.md)

---

### Temporary Field
**Symptoms:**
- Instance field is only assigned in one method and is `null`/`undefined` elsewhere
- Field only makes sense for certain code paths
- Comments like "// only set when in batch mode"

**Severity:** Minor.

**Recommended:** Extract Class (catalog-organizing.md), Introduce Special Case (catalog-simplifying.md)

---

### Refused Bequest
**Symptoms:**
- Subclass overrides methods just to throw `NotImplementedException` or return no-ops
- Subclass uses only a small portion of what the parent provides
- Inheritance is used for code reuse, not for true is-a relationships

**Severity:** Major.

**Recommended:** Replace Subclass with Delegate (catalog-inheritance.md), Extract Interface (catalog-inheritance.md)

---

### Alternative Classes with Different Interfaces
**Symptoms:**
- Two classes do the same job but method names differ (`fetchUser` vs `getUser`, `UserLoader` vs `UserFetcher`)
- You could swap one for the other with just a rename

**Severity:** Minor.

**Recommended:** Rename Method (catalog-api.md), Extract Interface (catalog-inheritance.md)

---

## Family 3: Change Preventers

Code where one change forces other unrelated changes.

---

### Divergent Change
**Symptoms:**
- One class changes for multiple different reasons (e.g., a `User` class changes when auth changes AND when UI changes AND when data model changes)
- Multiple different "kinds" of changes land in the same file across git history

**Detection:** Check `git log --oneline <file>` — if commit messages span unrelated concerns, this smell exists.

**Severity:** Major.

**Recommended:** Extract Class (catalog-organizing.md), Move Method (catalog-organizing.md)

---

### Shotgun Surgery
**Symptoms:**
- One conceptual change requires edits across many files
- "Adding a new field" touches 8 files
- Changes are scattered in small pieces across the codebase

**Detection:** Ask "if I change X, what else breaks?" — use Grep to count files affected.

**Severity:** Major.

**Recommended:** Move Method (catalog-organizing.md), Inline Class (catalog-organizing.md), consolidate related logic

---

### Parallel Inheritance Hierarchies
**Symptoms:**
- Every time you create a subclass of A, you must also create a subclass of B
- Two class hierarchies mirror each other
- Class names share prefixes: `PremiumOrder`/`PremiumInvoice`, `StandardOrder`/`StandardInvoice`

**Severity:** Major.

**Recommended:** Move Method (catalog-organizing.md), collapse one hierarchy into the other

---

## Family 4: Dispensables

Code that serves no purpose and should be removed.

---

### Explanatory Comments Over Obvious Code
**Symptoms:**
- Comments describe WHAT the code does rather than WHY
- Comment re-states the code in English: `// increment i by 1` over `i++`
- Dense comment blocks before non-complex logic
- Commented-out code left in place

**Note:** Good comments explain WHY — a non-obvious constraint, a known bug workaround, a subtle invariant. Comments explaining WHAT are a sign the code itself is unclear.

**Severity:** Minor (but signals deeper clarity issue).

**Recommended:** Rename to make intent obvious, Extract Method with a descriptive name (catalog-composing.md), delete dead commented-out code

---

### Duplicate Code
**Symptoms:**
- Near-identical blocks differing only in variable names or literal values
- Copy-paste with minor variations
- Same algorithm implemented twice in different places
- Utility functions reimplemented per-file instead of shared

**Detection:** Search for distinctive sub-expressions from one location using Grep.

**Severity:** Major if logic-bearing; Minor if trivial.

**Recommended:** Extract Function (catalog-composing.md), Move Method (catalog-organizing.md), Parameterize Method (catalog-api.md)

---

### Lazy Class / Dead Code
**Symptoms:**
- Class with only 1–2 trivial methods that could be inlined
- Functions never called (use Grep to confirm zero call sites)
- Files imported but symbols never used
- Feature flags that are always-on or always-off

**Detection:** Grep for the class/function name — if zero call sites, it's dead.

**Severity:** Minor (clutter); Major if it creates false complexity.

**Recommended:** Inline Class (catalog-organizing.md), delete dead code outright

---

### Speculative Generality
**Symptoms:**
- Abstract base classes with only one concrete implementation
- Parameters that exist "for future use" but are always passed as `null`/`undefined`
- Hooks, callbacks, or extension points with zero callers
- "Generic" infrastructure built before the second use case exists

**Severity:** Minor.

**Recommended:** Collapse Hierarchy (catalog-inheritance.md), Remove Parameter (catalog-api.md), delete unused abstractions

---

## Family 5: Couplers

Inappropriate coupling between classes or modules.

---

### Feature Envy
**Symptoms:**
- A method uses another object's data or methods more than its own
- A function that takes an object and immediately reaches into its fields to do work the object should do
- Pattern: `function processPayment(order) { order.items.forEach(...); order.user.email...; order.discount... }`

**Severity:** Major.

**Recommended:** Move Method (catalog-organizing.md), Extract Method then Move (catalog-composing.md + catalog-organizing.md)

---

### Inappropriate Intimacy
**Symptoms:**
- Two classes access each other's private/internal state
- Bidirectional dependencies between two modules
- Class A passes `this` to class B so B can call back into A's internals

**Severity:** Major.

**Recommended:** Move Method/Field (catalog-organizing.md), Extract Class (catalog-organizing.md), Hide Delegate (catalog-organizing.md)

---

### Message Chains
**Symptoms:**
- `a.getB().getC().doThing()` — chaining through multiple objects
- Law of Demeter violations: you only know your immediate collaborators
- Change in the middle of a chain forces changes in every call site

**Detection:** Grep for `.(` appearing 3+ times on one line.

**Severity:** Major if in multiple places; Minor if isolated.

**Recommended:** Hide Delegate (catalog-organizing.md), Extract Method (catalog-composing.md)

---

### Middle Man
**Symptoms:**
- A class that only delegates — every method just calls the same method on another object
- Wrapper that adds no behavior, no translation, no protection
- You added it "for indirection" but the indirection serves no current purpose

**Severity:** Minor.

**Recommended:** Remove Middle Man (catalog-organizing.md), Inline Class (catalog-organizing.md)

---

## Smell Severity Reference

| Severity | Meaning | Action |
|---|---|---|
| **Blocker** | Prevents safe modification | Must fix before other work |
| **Major** | Significant risk or drag | Prioritize; fix in current session |
| **Minor** | Clutter or weak coupling | Fix opportunistically or in follow-on |

---

## Language-Agnostic Grep Patterns

```
# Long functions: count lines between braces (approximate)
# Look for functions with many internal blank-line-separated sections

# Boolean flag parameters:
grep -n "function.*true\|false" <file>
grep -n "def .*True\|False" <file>

# Message chains (3+ dots):
grep -n "\.\w\+().*\.\w\+()" <file>

# Switch on type:
grep -n "switch.*type\|switch.*kind\|switch.*role" <file>
grep -n "if.*\.type ===\|if.*\.kind ===" <file>

# Primitive type codes:
grep -n '"premium"\|"standard"\|"admin"\|"user"' <file>

# Commented-out code:
grep -n "^[[:space:]]*\/\/.*[;{}]" <file>    # JS/TS/Java
grep -n "^[[:space:]]*#.*[=:]" <file>         # Python/Ruby
```
