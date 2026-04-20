# Catalog: Modern & Post-Fowler Patterns

Refactorings for code written with modern languages and paradigms. These patterns post-date the original Fowler catalog and address functional programming, async/await, reactive, dependency injection, and contemporary language idioms.

---

## Functional Programming Patterns

---

### Replace Mutable Accumulator with Reduce

**Intent:** Replace an imperative accumulator loop with a functional fold/reduce.

**When to use:**
- A loop initializes a variable before the loop and accumulates into it inside
- The accumulation logic is a pure transformation (no side effects in the loop body)

**Example:**
```
// BEFORE
let total = 0;
for (const item of items) {
  total += item.price * item.quantity;
}

// AFTER
const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
```

**Watch-outs:**
- Do not use reduce when the loop body has side effects — reduce implies no side effects
- Complex multi-step reductions can be less readable than a loop — use a named reducing function instead of an inline lambda

---

### Introduce Pipeline Composition

**Intent:** Compose a sequence of pure functions into a pipeline, making the data transformation explicit and each step independently testable.

**When to use:**
- A function applies a series of transformations to data
- Each transformation step can be named and tested independently
- The sequence is the logic (the "what"), not the implementation (the "how")

**Example:**
```
// BEFORE
function processOrders(orders) {
  const result = [];
  for (const o of orders) {
    if (o.status === "paid") {
      const withTax = { ...o, total: o.subtotal * 1.1 };
      if (withTax.total > 100) {
        result.push({ id: withTax.id, total: withTax.total });
      }
    }
  }
  return result;
}

// AFTER
const processOrders = (orders) =>
  orders
    .filter(isPaid)
    .map(applyTax)
    .filter(isSignificant)
    .map(toSummary);

const isPaid = (o) => o.status === "paid";
const applyTax = (o) => ({ ...o, total: o.subtotal * 1.1 });
const isSignificant = (o) => o.total > 100;
const toSummary = (o) => ({ id: o.id, total: o.total });
```

**Watch-outs:**
- Pipelines over very large collections create intermediate arrays — in hot paths, consider a single-pass approach with a transducer or explicit loop
- Keep pipeline stages at ≤4 for readability; beyond that, name the intermediate result

---

### Replace Shared Mutable State with Immutable Data + Pure Functions

**Intent:** Remove shared mutable state by passing data through functions and returning new values.

**When to use:**
- Multiple functions share a mutable object and the order of mutations matters
- Code is hard to test because it depends on mutation sequence
- Bugs come from unexpected mutation of shared objects

**Mechanics:**
1. Identify the mutable shared state
2. Change functions to accept the state as input and return modified state as output
3. Replace in-place mutations with new object construction (`{...old, field: newValue}`)
4. Thread the state through function calls explicitly
5. Run tests

**Watch-outs:**
- This can make call signatures more complex — consider grouping state into a typed record
- In performance-critical code, structural sharing (immutable data structures) may be needed to avoid excessive copying

---

## Async & Concurrency Patterns

---

### Replace Callback Pyramid with async/await

**Intent:** Flatten deeply nested callbacks ("callback hell") into sequential async/await code.

**When to use:**
- Multiple nested callbacks where each depends on the result of the previous
- Error handling is duplicated at every nesting level
- The intent of the code is hard to see through the nesting

**Example:**
```
// BEFORE — callback pyramid
readFile(path, (err, data) => {
  if (err) return handleError(err);
  parseJSON(data, (err, parsed) => {
    if (err) return handleError(err);
    fetchUser(parsed.userId, (err, user) => {
      if (err) return handleError(err);
      respond(user);
    });
  });
});

// AFTER — async/await
async function process(path) {
  const data = await readFile(path);
  const parsed = await parseJSON(data);
  const user = await fetchUser(parsed.userId);
  respond(user);
}
```

**Watch-outs:**
- Use a single `try/catch` block for the whole async function, or individual `try/catch` per step if different errors need different handling
- Don't `await` in a loop when operations are independent — parallelize with `Promise.all` instead

---

### Consolidate Independent Async Operations

**Intent:** Run independent async operations in parallel instead of sequentially.

**When to use:**
- Multiple `await` calls in sequence where the second doesn't depend on the first
- Operations that could run concurrently are being run sequentially, adding unnecessary latency

**Example:**
```
// BEFORE — sequential (wasted time)
const user = await fetchUser(userId);
const settings = await fetchSettings(userId);
const posts = await fetchPosts(userId);

// AFTER — parallel
const [user, settings, posts] = await Promise.all([
  fetchUser(userId),
  fetchSettings(userId),
  fetchPosts(userId),
]);
```

**Language equivalents:**
- JS/TS: `Promise.all`
- Python: `asyncio.gather`
- Go: goroutines with a WaitGroup or errgroup
- C#: `Task.WhenAll`
- Rust: `tokio::join!` or `futures::join!`

**Watch-outs:**
- `Promise.all` rejects as soon as any promise rejects — if you need all results (including failures), use `Promise.allSettled`
- Beware of rate limits and resource contention when parallelizing many operations

---

### Avoid Async Void / Fire-and-Forget Without Error Handling

**Intent:** Ensure async operations either have their results awaited or have explicit error handling.

**When to use:**
- A function returns a Promise/Task but the caller ignores it (no `await`, no `.catch`)
- An async function has a `void` return type and is called without error handling

**Mechanics:**
1. Identify the fire-and-forget call
2. If the result doesn't matter but errors do: add `.catch(handleError)` or `try/catch` inside the async function
3. If the result does matter: await it or return the Promise to the caller
4. Run tests

**Watch-outs:**
- In some frameworks, fire-and-forget is intentional (background jobs, analytics) — add explicit error logging even then
- In Go, goroutines are fire-and-forget by default — always read from error channels or use a wait group

---

## Dependency Injection & Modularity

---

### Extract Interface for Testability (Introduce Seam)

**Intent:** Introduce an interface/protocol so a dependency can be replaced with a test double.

**When to use:**
- A class directly instantiates a dependency that is hard to test (database, network, time)
- You want to inject a mock, stub, or fake in tests

**Mechanics:**
1. Extract an interface from the concrete dependency (Extract Interface)
2. Change the class to depend on the interface, not the concrete type
3. Inject the dependency via constructor or factory
4. In tests, inject a test double; in production, inject the real implementation
5. Run tests

**Example:**
```
// BEFORE — hard dependency on real clock
class SubscriptionRenewal {
  isExpired() { return new Date() > this.expiryDate; }
}

// AFTER — clock injected
interface Clock { now(): Date; }
class SubscriptionRenewal {
  constructor(private clock: Clock) {}
  isExpired() { return this.clock.now() > this.expiryDate; }
}
```

---

### Replace Static Call with Injected Dependency

**Intent:** Remove calls to static methods or singletons and inject the dependency instead.

**When to use:**
- Code calls `Logger.log()`, `Config.get()`, `Database.query()` statically
- Static calls make testing and swapping implementations impossible

**Mechanics:**
1. Extract an interface from the static class
2. Add a constructor parameter of the interface type
3. Replace static calls with instance calls on the injected dependency
4. Update all constructors and factories to pass the real implementation
5. Run tests

**Watch-outs:**
- Don't inject everything — only dependencies that have multiple implementations (test vs. prod) or that need to be mocked

---

### Consolidate Configuration into Typed Config Object

**Intent:** Replace scattered `process.env` / `os.environ` / `config.get()` calls with a single validated, typed config object loaded at startup.

**When to use:**
- Config values are read from the environment throughout the codebase
- Missing or wrong config is discovered at runtime deep in the call stack
- There's no clear picture of what config the app requires

**Mechanics:**
1. Create a `Config` class/record that reads all environment variables in one place
2. Validate and type them at construction time (throw at startup if required values are missing)
3. Inject the `Config` object through the dependency graph
4. Replace all scattered `process.env.X` reads with `config.X`
5. Run tests

---

## Reactive & Event-Driven

---

### Replace Polling with Observable/Event

**Intent:** Replace a polling loop that checks for state changes with an event/observable that fires when the state changes.

**When to use:**
- Code repeatedly checks `if (someCondition)` in a loop or timer
- The condition is controlled by an event that already exists or can be added

**Example:**
```
// BEFORE — polling
setInterval(() => {
  if (queue.hasMessages()) { processNext(queue.dequeue()); }
}, 100);

// AFTER — event-driven
queue.on("message", (msg) => { processNext(msg); });
```

**Watch-outs:**
- Events require the event source to be aware of listeners — consider decoupling via a message bus if the source and consumer should not know each other

---

### Replace Imperative State Mutation with State Machine

**Intent:** Replace scattered `if (status === X) { status = Y }` logic with an explicit state machine.

**When to use:**
- An object has a `status` or `state` field that transitions through values
- Invalid state transitions occur because there's no enforcement
- The transition logic is spread across multiple methods

**Mechanics:**
1. List all valid states and all valid transitions
2. Create a state machine (can be a simple table: `Map<State, Set<State>>` for allowed transitions)
3. Centralize all state transition logic through a single `transition(event)` method
4. Replace scattered state mutation with calls to `transition`
5. Run tests — including tests for invalid transitions

---

## Modern Language Idioms

---

### Prefer Exhaustive Pattern Matching

**Intent:** Use language-native pattern matching instead of if/else chains when the set of cases is known and finite.

**Languages:** Rust (`match`), Kotlin (`when`), C# (`switch expression`), Python 3.10+ (`match`), Swift (`switch`), Scala, Haskell

**Example (Kotlin):**
```
// BEFORE
fun describe(obj: Any): String {
  if (obj is Int) return "Int: $obj"
  else if (obj is String) return "String of length ${obj.length}"
  else return "Unknown"
}

// AFTER
fun describe(obj: Any) = when (obj) {
  is Int -> "Int: $obj"
  is String -> "String of length ${obj.length}"
  else -> "Unknown"
}
```

**Key benefit:** Exhaustiveness checking — if you add a new case to a sealed class/enum, the compiler warns about unhandled matches.

---

### Use Named Arguments / Keyword Arguments at Call Sites

**Intent:** Make call sites self-documenting by using named parameters, especially for boolean and numeric literals.

**Example:**
```
// BEFORE — what does `true` mean here?
createUser("Alice", true, false, 30);

// AFTER — clear
createUser(name: "Alice", isAdmin: true, isBanned: false, age: 30);
// Or in Python:
create_user("Alice", is_admin=True, is_banned=False, age=30)
```

**Watch-outs:**
- This is about clarity at the call site — if a function has only one parameter, named arguments are unnecessary
- In languages without native named arguments (Java, JS pre-destructuring), use a Parameter Object instead

---

### Prefer Value Types / Records / Data Classes for Immutable Data

**Intent:** Use language-native immutable data types instead of mutable objects when mutation is not needed.

| Language | Immutable data type |
|---|---|
| Kotlin | `data class` + `val` fields |
| C# | `record` |
| Python | `@dataclass(frozen=True)` or `NamedTuple` |
| Swift | `struct` |
| Rust | structs (immutable by default) |
| Java | `record` (Java 16+) |
| Scala | `case class` |

**When to use:**
- A class holds data with no behavior beyond equality and display
- The object represents a snapshot in time (event, measurement, config)
- You want structural equality (`==` compares fields, not identity)

**Watch-outs:**
- Value types are copied, not shared — be aware of performance implications for large structures
- If the type needs to evolve (add/remove fields) frequently, a mutable class may be easier to work with
