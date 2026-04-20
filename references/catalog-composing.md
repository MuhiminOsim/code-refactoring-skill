# Catalog: Composing Methods

Operations for restructuring code within and between functions. These are the most frequently applied refactorings — master these first.

Each entry: **Intent → Mechanics → Example → Inverse → Watch-outs**

---

## Extract Method / Extract Function

**Intent:** Turn a fragment of code into a function whose name explains its purpose.

**When to use:**
- Code block that needs a comment to explain what it does
- Code used in more than one place
- A "section" within a long method (especially one with a comment header)
- Code that can be named with a single verb phrase

**Mechanics:**
1. Identify the code fragment to extract
2. Create a new function with a descriptive name
3. Copy the fragment into the new function
4. Identify local variables used by the fragment — these become parameters
5. Identify variables that the fragment modifies and are used afterward — these become return values
6. Replace the original fragment with a call to the new function
7. Run tests

**Example:**
```
// BEFORE
function printOwing(invoice) {
  let outstanding = 0;
  for (const o of invoice.orders) {
    outstanding += o.amount;
  }
  // print details
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
}

// AFTER
function printOwing(invoice) {
  const outstanding = calculateOutstanding(invoice);
  printDetails(invoice, outstanding);
}

function calculateOutstanding(invoice) {
  return invoice.orders.reduce((sum, o) => sum + o.amount, 0);
}

function printDetails(invoice, outstanding) {
  console.log(`name: ${invoice.customer}`);
  console.log(`amount: ${outstanding}`);
}
```

**Inverse:** Inline Method

**Watch-outs:**
- If the fragment modifies multiple local variables, it may not extract cleanly — consider Extract Variable first to reduce complexity
- If a temp variable is assigned in the fragment and used outside it, you'll need to return it
- Long parameter lists on the new function are a smell — it may need its own Extract Variable or Introduce Parameter Object

---

## Inline Method / Inline Function

**Intent:** Remove a function whose body is as clear as the function's name, or that adds no value by existing separately.

**When to use:**
- The function body is as obvious as its name (e.g., `isValid() { return this.score >= 0; }`)
- The function is only called once and the call site is just as readable with the body inlined
- You have too much indirection — methods that just delegate

**Mechanics:**
1. Check that the method is not polymorphic (overridden by subclasses) — if so, do not inline
2. Find all callers using Grep
3. Replace each call with the method body (substituting parameters for arguments)
4. Remove the method
5. Run tests

**Example:**
```
// BEFORE
function getRating(driver) {
  return moreThanFiveLateDeliveries(driver) ? 2 : 1;
}
function moreThanFiveLateDeliveries(driver) {
  return driver.numberOfLateDeliveries > 5;
}

// AFTER
function getRating(driver) {
  return driver.numberOfLateDeliveries > 5 ? 2 : 1;
}
```

**Inverse:** Extract Method

**Watch-outs:**
- Do not inline polymorphic methods
- Do not inline if the method is used in >5 places — Extract is usually the right direction there
- Watch for parameter side effects: if an argument expression has side effects, inlining changes evaluation order

---

## Extract Variable / Introduce Explaining Variable

**Intent:** Name a complex expression so the code becomes self-documenting.

**When to use:**
- A complex conditional expression that requires a comment to understand
- A calculated value used multiple times
- A subexpression with a non-obvious meaning

**Mechanics:**
1. Identify the expression to name
2. Create an immutable variable with a descriptive name, assigned to that expression
3. Replace the original expression (or its subsequent uses) with the variable
4. Run tests

**Example:**
```
// BEFORE
if (platform.toUpperCase().indexOf("MAC") > -1 &&
    browser.toUpperCase().indexOf("IE") > -1 &&
    wasInitialized() && resize > 0) { ... }

// AFTER
const isMacOs = platform.toUpperCase().indexOf("MAC") > -1;
const isIEBrowser = browser.toUpperCase().indexOf("IE") > -1;
const wasResized = resize > 0;
if (isMacOs && isIEBrowser && wasInitialized() && wasResized) { ... }
```

**Inverse:** Inline Variable

**Watch-outs:**
- Choose names that explain the domain meaning, not just what the expression computes
- If the expression appears in multiple methods, consider Extract Method instead for reuse

---

## Inline Variable

**Intent:** Remove a variable whose name doesn't communicate more than the expression itself.

**When to use:**
- The variable is assigned once and used exactly once right after
- The variable name is no clearer than the expression it holds
- The variable is being used as a stepping stone inside an Extract Method

**Mechanics:**
1. Confirm the variable is assigned exactly once
2. Replace the single use of the variable with the right-hand side expression
3. Remove the variable declaration
4. Run tests

**Example:**
```
// BEFORE
const basePrice = order.basePrice;
return basePrice > 1000;

// AFTER
return order.basePrice > 1000;
```

**Inverse:** Extract Variable

**Watch-outs:**
- Do not inline if the expression has side effects and is used multiple times
- Do not inline if removing the variable makes the code harder to debug (e.g., removing a clearly named intermediate in a calculation)

---

## Replace Temp with Query

**Intent:** Replace a local variable with a function call, so the calculation can be reused by other methods.

**When to use:**
- A temporary variable holds a calculation result that other methods in the same class need
- The variable is calculated from data available to the class (not from parameters unique to this method)
- The calculation is not trivially cheap (would benefit from being named and potentially cached)

**Mechanics:**
1. Extract the right-hand side expression into a new method
2. Replace the variable assignment with a call to the new method
3. Replace subsequent uses of the variable with calls to the method
4. Remove the now-unused variable
5. Run tests

**Example:**
```
// BEFORE
function getPrice() {
  const basePrice = quantity * itemPrice;
  const discountFactor = basePrice > 1000 ? 0.95 : 0.98;
  return basePrice * discountFactor;
}

// AFTER
function getPrice() {
  return basePrice() * discountFactor();
}
function basePrice() { return quantity * itemPrice; }
function discountFactor() { return basePrice() > 1000 ? 0.95 : 0.98; }
```

**Inverse:** Introduce Local Extension / cache the result

**Watch-outs:**
- Only valid when the value doesn't change within the method (variable assigned once)
- If performance is a concern with repeated calls, add a comment noting the tradeoff — do not prematurely optimize
- Check for side effects in the extracted expression before making it a function

---

## Split Temporary Variable

**Intent:** When a temp variable is re-assigned for two different purposes, give each purpose its own variable.

**When to use:**
- A variable is assigned more than once and the assignments serve different semantic purposes
- The variable's name no longer accurately describes all its uses
- Common for "accumulator" variables repurposed halfway through a function

**Mechanics:**
1. Rename the variable at its first assignment to reflect its first purpose
2. At the second assignment, introduce a new variable with a name reflecting the second purpose
3. Update all references between the two assignments to use the first name
4. Update all references after the second assignment to use the second name
5. Run tests

**Example:**
```
// BEFORE
let temp = 2 * (height + width);
console.log(temp);
temp = height * width;
console.log(temp);

// AFTER
const perimeter = 2 * (height + width);
console.log(perimeter);
const area = height * width;
console.log(area);
```

**Inverse:** (none — this is always correct direction)

**Watch-outs:**
- Common in code converted from procedural style — variables reused for unrelated purposes throughout a long function
- After splitting, each new variable is a candidate for Extract Variable

---

## Remove Assignments to Parameters

**Intent:** Never modify a parameter — use a local variable instead.

**When to use:**
- A function mutates one of its input parameters
- The modification is intended to affect only the local value, not the caller's copy (especially relevant in pass-by-reference languages)

**Mechanics:**
1. Create a local variable initialized to the parameter's value
2. Replace all modifications and uses of the parameter (after the initial read) with the local variable
3. Run tests

**Example:**
```
// BEFORE
function discount(inputVal, quantity) {
  if (inputVal > 50) inputVal -= 2;     // modifying param
  if (quantity > 100) inputVal -= 1;
  return inputVal;
}

// AFTER
function discount(inputVal, quantity) {
  let result = inputVal;
  if (result > 50) result -= 2;
  if (quantity > 100) result -= 1;
  return result;
}
```

**Watch-outs:**
- In languages where parameters are passed by value (most primitives in JS/Python/Go), this is a style issue
- In languages where objects are passed by reference, this is a correctness issue — mutating the parameter mutates the caller's object
- If the function receives an object and calls methods on it that mutate it, that is a different smell (Feature Envy or Inappropriate Intimacy)

---

## Substitute Algorithm

**Intent:** Replace a complex algorithm with a cleaner one that produces the same result.

**When to use:**
- A simpler algorithm exists (e.g., using built-in language features that weren't previously known)
- The current algorithm is hard to understand and a cleaner version is equally correct
- The algorithm was written before a library function existed that covers the case

**Mechanics:**
1. **Before touching anything:** write tests that exhaustively cover the outputs of the current algorithm (if they don't exist). This is the behavior baseline.
2. Implement the new algorithm (in a scratch location or as a new function)
3. Run the tests against the new algorithm to confirm they all pass
4. Replace the old algorithm with the new one
5. Run all tests again

**Example:**
```
// BEFORE — manual search
function foundPerson(people) {
  for (let i = 0; i < people.length; i++) {
    if (people[i] === "Don" || people[i] === "John" || people[i] === "Kent") {
      return people[i];
    }
  }
  return "";
}

// AFTER — using built-in
function foundPerson(people) {
  return people.find(p => ["Don", "John", "Kent"].includes(p)) ?? "";
}
```

**Watch-outs:**
- This is higher risk than structural refactorings — you are rewriting logic, not just reorganizing it
- Tests must be written **before** the substitution, not after
- If tests don't exist, do not proceed without user acknowledgment

---

## Split Loop

**Intent:** When a loop does two unrelated things, split it into two loops.

**When to use:**
- A loop accumulates two different results that serve different purposes
- Splitting allows each loop to be independently named, extracted, or optimized

**Mechanics:**
1. Copy the loop
2. Remove the second operation from the first copy
3. Remove the first operation from the second copy
4. Run tests

**Example:**
```
// BEFORE
let youngest = people[0];
let totalSalary = 0;
for (const p of people) {
  if (p.age < youngest.age) youngest = p;
  totalSalary += p.salary;
}

// AFTER
let youngest = people[0];
for (const p of people) {
  if (p.age < youngest.age) youngest = p;
}

let totalSalary = 0;
for (const p of people) {
  totalSalary += p.salary;
}
```

**Watch-outs:**
- This temporarily increases iteration count — for very large collections, note the performance tradeoff (though modern CPUs handle this well via cache)
- After splitting, each loop is a strong candidate for Extract Method → Replace Loop with Pipeline

---

## Replace Loop with Pipeline

**Intent:** Replace an imperative loop with a functional pipeline (map/filter/reduce).

**When to use:**
- The loop is building a collection or a single aggregate value
- The operations (filter, transform, aggregate) are clearly separable
- The language supports pipeline operations natively (JS/TS, Python, Ruby, Kotlin, C#, Rust, etc.)

**Mechanics:**
1. Identify the collection being iterated
2. Identify the operations: filtering elements? transforming them? accumulating a single value?
3. Map each operation to its pipeline equivalent: filter → `filter()`, transform → `map()`, aggregate → `reduce()`
4. Build the pipeline, assign to the final variable
5. Remove the loop
6. Run tests

**Example:**
```
// BEFORE
const names = [];
for (const i of input) {
  if (i.job === "programmer") {
    names.push(i.name);
  }
}

// AFTER
const names = input
  .filter(i => i.job === "programmer")
  .map(i => i.name);
```

**Inverse:** (replace with loop for performance-critical paths where allocation matters)

**Watch-outs:**
- Do not use pipelines for loops with complex early-exit logic — a `for` loop with `break` does not map cleanly to a pipeline
- In performance-critical inner loops, pipeline allocation can matter — leave a comment if you're aware of it
- Avoid >4-stage pipelines without intermediate variables — readability degrades
