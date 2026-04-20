# Catalog: API & Method Signature Refactorings

Operations for improving how functions and modules are called. These affect the contract between code units — read safety.md §3 before applying any of these to public APIs.

Each entry: **Intent → Mechanics → Example → Inverse → Watch-outs**

---

## Rename Function / Method / Variable / Class

**Intent:** Change a name to better communicate its purpose, aligned with the domain language.

**When to use:**
- The name is misleading, too abbreviated, or uses the wrong domain term
- The function's behavior has evolved beyond what its name implies
- Consistent naming across the codebase (e.g., all finders should be `findX`, not mixed with `getX`)

**Mechanics (safe, for internal/private symbols):**
1. Create a new function with the new name, with the same body
2. Update the old function to call the new one (delegation shim)
3. Gradually update all callers to use the new name (use Grep)
4. When all callers are updated, remove the old function
5. Run tests

**Mechanics (quick, for truly local scope):**
1. Rename in-place using your editor's rename tool or Grep+Edit
2. Run tests

**Watch-outs:**
- **Red Line:** Renaming an exported/public symbol — see safety.md §3
- Always use Grep to count call sites before renaming: `grep -rn "oldName" .`
- Yellow Line if >20 call sites — warn user before proceeding
- In dynamically typed languages (JS, Python, Ruby), there may be string-based references (`getattr(obj, "methodName")`) that Grep won't catch — search for string occurrences too

---

## Add Parameter

**Intent:** Add a new parameter to a function that needs additional context to compute its result.

**When to use:**
- A function currently reaches out to global state or an external dependency for a value that should be provided by callers
- You're introducing testability by injecting a dependency

**Mechanics:**
1. Add the parameter with a sensible default value if possible (for backwards compatibility)
2. Use Grep to find all call sites
3. Update all call sites to pass the new argument
4. Remove the default value once all sites are updated (if defaults were only a migration aid)
5. Run tests

**Watch-outs:**
- Adding a required parameter to a public API is a breaking change — Red Line (safety.md §3)
- If you add more than 1–2 parameters, consider Introduce Parameter Object instead

---

## Remove Parameter

**Intent:** Remove a parameter that is never used by the function.

**When to use:**
- A parameter is always passed but never actually used in the function body
- A refactoring made the parameter unnecessary

**Mechanics:**
1. Verify the parameter is truly unused (check all overrides in subclasses too)
2. Remove the parameter from the function signature
3. Use Grep to update all call sites to stop passing the argument
4. Run tests

**Watch-outs:**
- **Red Line:** Removing a parameter from a public API — see safety.md §3
- In dynamically typed languages, unused parameters may be part of an expected signature (callbacks, event handlers) — confirm before removing

---

## Parameterize Function

**Intent:** Unify two or more functions that perform similar logic with different values by adding a parameter.

**When to use:**
- Two functions do the same thing except for a literal value
- Adding a parameter lets you replace both with one function

**Mechanics:**
1. Identify the varying value between the two functions
2. Create one unified function with a parameter for that value
3. Replace calls to both original functions with calls to the new unified one
4. Remove both originals
5. Run tests

**Example:**
```
// BEFORE
function tenPercentRaise(person) { person.salary *= 1.10; }
function fivePercentRaise(person) { person.salary *= 1.05; }

// AFTER
function raise(person, factor) { person.salary *= (1 + factor); }
```

**Inverse:** Split if the unified function becomes too complex with too many code paths

**Watch-outs:**
- If the two functions differ in more than just a literal value (different logic paths), Parameterize is the wrong tool — Extract and then use polymorphism
- Adding a parameter to a public API is a Red Line

---

## Remove Flag Argument

**Intent:** Replace a boolean parameter that selects behavior with two separate, explicitly named functions.

**When to use:**
- A function has a boolean parameter that fundamentally changes what it does
- Callers read as: `process(order, true)` — the boolean is opaque at the call site
- The function body is an `if (flag)` at the top level

**Mechanics:**
1. Create two new functions, one for each path the flag controls
2. Move the corresponding body into each
3. Update all callers to call the correct named function
4. Remove the original function with the flag parameter
5. Run tests

**Example:**
```
// BEFORE
function setDimension(name, value) {
  if (name === "height") { this.height = value; return; }
  if (name === "width") { this.width = value; return; }
}
// Called as: setDimension("height", 10)  ← opaque

// AFTER
function setHeight(value) { this.height = value; }
function setWidth(value) { this.width = value; }
```

**Watch-outs:**
- Do not apply if the boolean flag is a legitimate domain parameter (e.g., `includeArchived: boolean` for a query)
- If the function has many flags, consider a Parameter Object or Builder pattern

---

## Preserve Whole Object

**Intent:** Pass the object to the function instead of extracting and passing multiple fields from it.

**When to use:**
- A function takes several values that all come from the same source object
- The same group of fields is always passed together (Data Clumps)
- The callee reaches into the caller's local state via parameters

**Mechanics:**
1. Change the function to accept the source object instead of the individual values
2. Update the function body to use the object's fields/methods
3. Update all call sites to pass the object
4. Run tests

**Example:**
```
// BEFORE
const low = room.daysTempRange.low;
const high = room.daysTempRange.high;
if (plan.withinRange(low, high)) { ... }

// AFTER
if (plan.withinRange(room.daysTempRange)) { ... }
```

**Inverse:** Replace Parameter with Query if the function shouldn't depend on the full object

**Watch-outs:**
- Creates a dependency between the function and the object's type — only worthwhile if that coupling makes sense
- If the function is in a different module, passing the whole object may introduce an unwanted dependency

---

## Replace Parameter with Query

**Intent:** Remove a parameter and have the function derive the value itself.

**When to use:**
- A parameter value can be derived from other information already available in the function
- Callers always compute the same expression to pass as this argument

**Mechanics:**
1. If the derived value is complex, Extract Method for the derivation first
2. Remove the parameter from the function signature
3. Update the function body to call the query instead
4. Update all call sites to stop passing the argument
5. Run tests

**Example:**
```
// BEFORE
function finalPrice(basePrice, discountLevel) {
  return basePrice - discountFor(discountLevel);
}
// called as: finalPrice(base, discountLevel(quantity))

// AFTER
function finalPrice(basePrice) {
  return basePrice - discountFor(discountLevel());
}
function discountLevel() { return quantity > 100 ? 2 : 1; }
```

**Inverse:** Replace Query with Parameter

**Watch-outs:**
- Only valid when the query has no side effects and is always deterministic in the function's context
- If the function is a pure computation that should not access external state, keep the parameter

---

## Replace Query with Parameter

**Intent:** Add a parameter to pass in a value the function currently derives internally — to improve purity and testability.

**When to use:**
- A function queries global state or an external dependency that you want to inject
- You want to make the function a pure function for easier testing
- Separating query from computation (related to CQS)

**Mechanics:**
1. Extract the internal query into a variable
2. Add a parameter for that value
3. Update the function body to use the parameter
4. Update all call sites to pass the value
5. Run tests

**Example:**
```
// BEFORE — function reaches out to global thermostat
function targetTemperature(plan) {
  const currentTemp = thermostat.currentTemperature;
  return plan.target > currentTemp ? "heat" : "cool";
}

// AFTER — pure, testable
function targetTemperature(plan, currentTemperature) {
  return plan.target > currentTemperature ? "heat" : "cool";
}
```

**Inverse:** Replace Parameter with Query

---

## Introduce Parameter Object

**Intent:** Replace a group of related parameters with a single object.

**When to use:**
- Multiple parameters always appear together (Data Clumps smell)
- Long Parameter List (>3–4 parameters)
- The parameter group represents a domain concept that deserves a name

**Mechanics:**
1. Create a new class/record/struct for the parameter group
2. Add a parameter of the new type to the function
3. Update the function body to use the object's fields
4. Update all call sites to construct and pass the object
5. Remove the original individual parameters
6. Run tests

**Example:**
```
// BEFORE
function amountInvoiced(startDate, endDate) { ... }
function amountReceived(startDate, endDate) { ... }
function amountOverdue(startDate, endDate) { ... }

// AFTER
class DateRange { constructor(startDate, endDate) { ... } }
function amountInvoiced(range) { ... }
function amountReceived(range) { ... }
function amountOverdue(range) { ... }
```

**Watch-outs:**
- The parameter object is a value object — make it immutable
- After creating the object, move behavior into it (Replace Temp with Query, Move Method) to get real domain value

---

## Replace Constructor with Factory Function

**Intent:** Replace a constructor with a named factory function for clarity and flexibility.

**When to use:**
- Multiple constructors with different meanings exist (overloading confusion)
- The constructor has a meaningless or confusing signature
- You need to return different subclasses based on input
- You want to cache or pool instances

**Mechanics:**
1. Create a static factory method (or top-level factory function)
2. Call the constructor from the factory
3. Update all call sites to use the factory
4. Optionally make the constructor private/protected
5. Run tests

**Example:**
```
// BEFORE
const employee = new Employee("full-time", name, salary);

// AFTER
const employee = Employee.createFullTime(name, salary);
```

**Watch-outs:**
- Factory functions are less amenable to subclassing — consider this if extension is likely
- Red Line: if the constructor is part of a public API, changing it to a factory is a breaking change

---

## Replace Error Code with Exception / Result Type

**Intent:** Use proper error-signaling mechanisms instead of magic return values.

**When to use:**
- A function returns `-1`, `null`, `""`, or `0` to signal failure
- Callers forget to check the error return (silent failure)
- The language supports exceptions, Result types, or Option types

**Mechanics:**
1. Create an exception class (or use Result/Option type if idiomatic in the language — see language-profiles.md)
2. Change the function to throw/return the exception or error type instead of the magic value
3. Update all callers to handle the exception/Result
4. Run tests

**Example:**
```
// BEFORE (error code)
function findCustomer(id) {
  const customer = db.lookup(id);
  if (!customer) return -1;  // caller must check for -1
  return customer;
}

// AFTER (exception)
function findCustomer(id) {
  const customer = db.lookup(id);
  if (!customer) throw new CustomerNotFoundError(id);
  return customer;
}
```

**Watch-outs:**
- **Red Line:** Changing the error contract of a public API — callers catching specific error values or types will break
- In Go and Rust, returned errors are idiomatic — don't force exceptions into these languages
- In TS/JS, consider returning `Result<T, E>` types for recoverable errors instead of exceptions

---

## Return Modified Value

**Intent:** Instead of mutating a parameter, return the new value and let the caller reassign.

**When to use:**
- A function takes a data structure, modifies it, and the caller expects the modification
- You want to move toward immutable data patterns
- The function currently modifies a parameter in place (Remove Assignments to Parameters smell)

**Mechanics:**
1. Change the function to return the modified value instead of mutating the parameter
2. Update all callers to capture the return value: `data = transform(data)`
3. Remove the in-place mutation from the function body
4. Run tests

**Example:**
```
// BEFORE — mutates the passed-in list
function addItem(list, item) {
  list.push(item);  // mutation
}
addItem(myList, newItem);

// AFTER — returns new value
function addItem(list, item) {
  return [...list, item];
}
myList = addItem(myList, newItem);
```

**Watch-outs:**
- In performance-critical code, creating new objects on every call has cost — note the tradeoff
- Ensure all callers reassign the return value; dropped returns are a common bug after this refactoring
