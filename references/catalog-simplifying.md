# Catalog: Simplifying Conditionals & Control Flow

Operations for untangling complex conditional logic. After composing methods, this is the second most common refactoring need.

Each entry: **Intent → Mechanics → Example → Inverse → Watch-outs**

---

## Decompose Conditional

**Intent:** Extract complex condition and branch bodies into named functions so the conditional reads like prose.

**When to use:**
- An `if` condition is complex enough that a reader must pause to parse it
- Branch bodies are long enough to obscure the overall structure
- The same condition appears multiple times

**Mechanics:**
1. Extract the condition into a named function (e.g., `isSummerRate()`)
2. Extract the then-branch into a named function (e.g., `summerCharge()`)
3. Extract the else-branch into a named function (e.g., `regularCharge()`)
4. Replace the original with calls to these functions
5. Run tests

**Example:**
```
// BEFORE
if (!date.isBefore(SUMMER_START) && !date.isAfter(SUMMER_END)) {
  charge = quantity * summerRate;
  if (quantity > SUMMER_VOLUME_THRESHOLD) charge -= quantity * summerDiscount;
} else {
  charge = quantity * regularRate + regularServiceCharge;
}

// AFTER
if (isSummer(date)) {
  charge = summerCharge(quantity);
} else {
  charge = regularCharge(quantity);
}
```

**Inverse:** Inline the extracted functions if they're only called once and the names add no clarity

**Watch-outs:**
- Don't decompose a condition that's already a single-word boolean — `if (isValid)` doesn't need further extraction
- After decomposition, each extracted function may reveal further smells (Long Method, Primitive Obsession)

---

## Consolidate Conditional Expression

**Intent:** Combine a sequence of conditions with the same result into a single expression.

**When to use:**
- Multiple `if` checks all return (or do) the same thing
- The sequence of checks reads as a single logical idea

**Mechanics:**
1. Check that all the conditions have no side effects
2. Combine the checks using `||` (or `and`/`or` in the appropriate language)
3. Extract the combined condition into a named function (Decompose Conditional) if it improves clarity
4. Run tests

**Example:**
```
// BEFORE
function disabilityAmount(employee) {
  if (employee.seniority < 2) return 0;
  if (employee.monthsDisabled > 12) return 0;
  if (employee.isPartTime) return 0;
  // ... actual calculation
}

// AFTER
function disabilityAmount(employee) {
  if (isNotEligibleForDisability(employee)) return 0;
  // ... actual calculation
}
function isNotEligibleForDisability(employee) {
  return employee.seniority < 2
    || employee.monthsDisabled > 12
    || employee.isPartTime;
}
```

**Inverse:** Decompose back into separate checks if each condition has different explanatory value

**Watch-outs:**
- Do not consolidate if the conditions are independent checks that happen to share a result — a reader would lose information about why each check exists
- Do not consolidate if any condition has side effects

---

## Remove Control Flag

**Intent:** Replace a flag variable used to control loop exit with `break`, `return`, or `throw`.

**When to use:**
- A boolean variable is set inside a loop and used as the loop exit condition
- The variable serves no purpose other than controlling flow

**Mechanics:**
1. Find the assignment that sets the flag to exit the loop
2. Replace that assignment with `break` (if in a loop) or `return` (if the function should exit)
3. Remove the flag variable and all references to it
4. Run tests

**Example:**
```
// BEFORE
let found = false;
for (const p of people) {
  if (!found) {
    if (p === "Don") { sendAlert(); found = true; }
    if (p === "John") { sendAlert(); found = true; }
  }
}

// AFTER
for (const p of people) {
  if (p === "Don" || p === "John") {
    sendAlert();
    break;
  }
}
```

**Watch-outs:**
- Some loops need to complete fully while tracking state — don't remove flags that serve as accumulators, only flags that solely control loop termination
- In languages without `break` in certain constructs, a `return` via Extract Method may be needed

---

## Replace Nested Conditional with Guard Clauses

**Intent:** Use early returns to handle special/edge cases at the top of a function, leaving the main logic unindented.

**When to use:**
- A function has deep nesting because every path is wrapped in conditions
- The "normal" path is buried under special-case handling
- The function has a single normal path and multiple error/edge cases

**Mechanics:**
1. Identify the conditions that handle special cases (nulls, errors, precondition failures)
2. Move these to the top of the function as early returns
3. The main logic now runs at the base indentation level
4. Run tests

**Example:**
```
// BEFORE
function getPayAmount(employee) {
  let result;
  if (employee.isSeparated) {
    result = separatedAmount();
  } else {
    if (employee.isRetired) {
      result = retiredAmount();
    } else {
      result = normalPayAmount();
    }
  }
  return result;
}

// AFTER
function getPayAmount(employee) {
  if (employee.isSeparated) return separatedAmount();
  if (employee.isRetired) return retiredAmount();
  return normalPayAmount();
}
```

**Inverse:** Remove guard clauses if the logic actually has equal-weight cases (use Consolidate Conditional instead)

**Watch-outs:**
- Works best when the "special" cases are clearly exceptional (error states, pre-conditions, null checks)
- If all conditions are equally valid business cases, this may make the code less clear — use Decompose Conditional instead
- Some style guides prefer a single return point — discuss with the team before applying widely

---

## Replace Conditional with Polymorphism

**Intent:** Move each branch of a type-based conditional into a method on the appropriate subclass or strategy object.

**When to use:**
- A `switch` or `if/else if` chain selects behavior based on an object's type
- The same switch appears in multiple places
- Adding a new type requires modifying multiple switch statements

**Mechanics:**
1. If the conditional is in a function that doesn't already belong to the type being switched on, use Move Method to put it there
2. Create a subclass (or strategy object) for each value of the type code
3. Move each branch body into the corresponding subclass as an override of a shared method
4. The base class (or interface) declares the method; each subclass overrides it
5. Replace the conditional with a polymorphic dispatch (calling the method on the object)
6. Run tests

**Example:**
```
// BEFORE
class Bird {
  getSpeed(type) {
    switch(type) {
      case "EUROPEAN": return baseSpeed();
      case "AFRICAN": return baseSpeed() - loadFactor() * numberOfCoconuts;
      case "NORWEGIAN_BLUE": return isNailed ? 0 : baseSpeed(voltage);
    }
  }
}

// AFTER
class EuropeanBird { getSpeed() { return baseSpeed(); } }
class AfricanBird { getSpeed() { return baseSpeed() - loadFactor() * this.numberOfCoconuts; } }
class NorwegianBlueBird { getSpeed() { return this.isNailed ? 0 : baseSpeed(this.voltage); } }
```

**Inverse:** Consolidate Conditional if the type variety is limited and unlikely to grow

**Watch-outs:**
- Only apply when you expect the type set to grow — don't over-engineer for 2 types
- In functional languages, exhaustive pattern matching is often clearer than polymorphism — check language-profiles.md
- This is a larger refactoring — do it in steps: Extract Method first, then create classes, then move methods

---

## Introduce Special Case / Null Object

**Intent:** Replace repeated null/undefined checks (or other special-case checks) with an object that handles the special case itself.

**When to use:**
- The same null check appears in multiple places across the codebase
- You repeatedly check `if (customer === null)` before using a customer object
- The special case always results in the same behavior (e.g., default values, no-ops)

**Mechanics:**
1. Create a "special case" class that implements the same interface as the normal class
2. Its methods return the default behavior for the special case (e.g., `getName()` returns "Guest")
3. Replace the creation of `null` (or the code that returns `null`) with creation of the special case object
4. Remove the null checks at each call site
5. Run tests

**Example:**
```
// BEFORE
let customerName;
if (customer === null) {
  customerName = "occupant";
} else {
  customerName = customer.name;
}

// AFTER (with NullCustomer object)
const customerName = customer.name; // NullCustomer.name returns "occupant"
```

**Watch-outs:**
- Only worthwhile when the same null check appears 3+ times with the same fallback behavior
- Do not use if different call sites want different behavior for the null case — conditional logic is clearer there
- The special case object must implement the full interface of the real object — don't create a partial stub

---

## Separate Query from Modifier (Command-Query Separation)

**Intent:** Ensure that a function either returns a value (query) or changes state (command) — never both.

**When to use:**
- A function both returns a value AND has a side effect
- Callers cannot call the function to check a value without also triggering the side effect
- Testing is complicated because calling the query changes state

**Mechanics:**
1. Create a new function that returns the value (the query) — copy the current function's body
2. Modify the original function to have no return value (the command) — it only performs the side effect
3. Update callers: for those that needed the value, call the query first, then the command
4. Run tests

**Example:**
```
// BEFORE
function getTotalOutstandingAndSendBill() {
  const result = customer.invoices.reduce((total, each) => each.amount + total, 0);
  sendBill();
  return result;
}

// AFTER
function totalOutstanding() {
  return customer.invoices.reduce((total, each) => each.amount + total, 0);
}
function sendBill() { /* side effect only */ }

// Callers:
const amount = totalOutstanding();
sendBill();
```

**Watch-outs:**
- In functional/reactive code, CQS is the default — this is most relevant in OO code
- Database queries that implicitly update a read-count or last-accessed field are a common violation — consider whether those side effects matter

---

## Introduce Assertion

**Intent:** Make an assumption explicit in the code so it fails loudly when violated.

**When to use:**
- Code assumes a value is within a range, non-null, or has a specific property, but never checks
- A comment says "this should never be negative" or "caller must ensure X"
- A hidden precondition exists that isn't visible from the function signature

**Mechanics:**
1. Identify the assumption
2. Add an assertion (language-appropriate: `assert`, `console.assert`, `Debug.Assert`, `invariant(...)`) at the point the assumption should hold
3. The assertion should throw or crash loudly in development, but may be disabled in production (language-dependent)
4. Run tests — make sure the assertion doesn't fire on valid inputs

**Example:**
```
// BEFORE
function applyDiscount(product, discount) {
  return product.price * (1 - discount);  // assumes discount is 0..1
}

// AFTER
function applyDiscount(product, discount) {
  console.assert(discount >= 0 && discount <= 1, `discount must be 0-1, got ${discount}`);
  return product.price * (1 - discount);
}
```

**Watch-outs:**
- Assertions are for programmer errors (invariants), not for user input validation
- Do not use assertions as error handling for runtime conditions (network failures, malformed input)
- In production systems, assertions may be stripped by build tools — document any critical invariants in tests as well

---

## Remove Dead Code

**Intent:** Delete code that can never be executed.

**When to use:**
- A branch of a conditional is provably unreachable
- A function has zero call sites (confirmed via Grep)
- A variable is assigned but never read
- Feature flags are always-on or always-off

**Mechanics:**
1. Confirm the code is truly unreachable — use Grep to verify no call sites, and check for dynamic dispatch or reflection
2. Delete the code
3. Run tests (including any tests specifically for the dead code — those should be deleted too)

**Watch-outs:**
- Do not delete code you're "pretty sure" is unreachable — confirm with Grep and git history
- Beware of dynamic dispatch (reflection, eval, string-based method calls) that makes Grep insufficient
- Public API methods may have zero internal call sites but external callers — check `safety.md` §3 before deleting

---

## Simplify Boolean Expression

**Intent:** Remove redundant boolean tests that add noise without adding information.

**Common patterns:**

```
// Pattern 1: Redundant comparison to boolean literal
if (isValid === true)   →   if (isValid)
if (found === false)    →   if (!found)
return x > 0 ? true : false   →   return x > 0

// Pattern 2: Double negation
if (!(!condition))   →   if (condition)
!!value   →   Boolean(value)  (or just value in a boolean context)

// Pattern 3: Redundant else after return
if (condition) {
  return x;
} else {       // else is unreachable after return
  return y;
}
→
if (condition) return x;
return y;

// Pattern 4: Ternary returning the condition itself
condition ? true : false   →   condition
condition ? false : true   →   !condition
```

**Mechanics:** Identify the pattern, apply the simplification, run tests.

**Watch-outs:**
- In languages with truthy/falsy semantics (JS, Python, Ruby), `!!value` has meaning beyond just simplification — it coerces to a strict boolean. Only simplify if the type is already boolean.
- `return x > 0 ? true : false` → `return x > 0` is only safe if the return type is boolean — if it can be `undefined` or `null`, the original may be intentional (though still worth questioning)
