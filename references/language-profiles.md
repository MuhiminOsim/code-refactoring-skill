# Language Profiles

Quick lookup for language-specific test commands, idioms, common smells, and formatters. When refactoring, check this file first to produce idiomatic output.

If the project's language isn't listed, ask the user: **"What command runs your tests?"** — then proceed.

---

## TypeScript / JavaScript

| | |
|---|---|
| **Test commands** | `npm test` · `npx jest` · `npx vitest run` · `npx mocha` |
| **Build/typecheck** | `npx tsc --noEmit` · `npx tsc --build` |
| **Formatter** | `npx prettier --write .` · `npx eslint --fix .` |
| **Project detection** | `package.json` exists |

**Idiomatic style:**
- `const` by default; `let` only when reassignment is needed; never `var`
- Arrow functions for callbacks and short expressions; `function` declarations for top-level named functions
- Destructuring for object/array unpacking: `const { id, name } = user`
- Named exports over default exports (better for tooling and refactoring)
- Template literals over string concatenation
- Optional chaining `?.` and nullish coalescing `??` over explicit null checks
- `async/await` over raw Promises or callbacks
- Types: `unknown` over `any`; use type guards to narrow

**Common smells unique to JS/TS:**
- `any` type erasing type safety
- Implicit `undefined` from missing optional properties (add `?` or default)
- `== null` vs `=== null` — always use `===`
- Mutating function parameters (especially arrays/objects)
- Not awaiting Promises (silent fire-and-forget)
- `var` hoisting issues masking scope bugs

**Module conventions:**
- ES modules (`import`/`export`); CommonJS (`require`) is legacy
- Barrel files (`index.ts`) for public API of a module; don't barrel-export everything

---

## Python

| | |
|---|---|
| **Test commands** | `pytest` · `python -m pytest` · `python -m unittest` |
| **Build/typecheck** | `mypy .` · `pyright` |
| **Formatter** | `black .` · `ruff check --fix .` |
| **Project detection** | `pyproject.toml` · `setup.py` · `requirements.txt` |

**Idiomatic style:**
- List/dict/set comprehensions over loops for building collections
- `dataclasses.dataclass` or `typing.NamedTuple` over plain classes for data containers
- Type hints everywhere (`def fn(x: int) -> str`)
- f-strings over `.format()` or `%` interpolation
- `pathlib.Path` over `os.path`
- Context managers (`with`) for resource management
- `@property` for computed attributes instead of `getX()` methods
- No mutable default arguments: `def fn(items=None): if items is None: items = []`
- `snake_case` for everything except classes (`PascalCase`)

**Common smells unique to Python:**
- Mutable default arguments: `def fn(x=[])` — the list is shared across all calls
- Bare `except:` clauses catching everything including `KeyboardInterrupt`
- Missing type hints making refactoring unsafe
- Using `dict` where a `dataclass` would be clearer
- `global` keyword — almost always a smell
- Long chains of `isinstance` checks — use `match` (3.10+) or polymorphism

---

## Go

| | |
|---|---|
| **Test commands** | `go test ./...` · `go test -v ./pkg/...` |
| **Build/typecheck** | `go build ./...` · `go vet ./...` |
| **Formatter** | `gofmt -w .` · `golangci-lint run` |
| **Project detection** | `go.mod` exists |

**Idiomatic style:**
- Interfaces are implicit — a type satisfies an interface by having its methods; no `implements` keyword
- Errors are values: always return `(T, error)` and check `if err != nil`
- Short, lowercase variable names in local scope (`i`, `n`, `buf`) — this is idiomatic
- Accept interfaces, return concrete types (caller decides, not callee)
- Prefer `struct` embedding for composition over deep inheritance (Go has no inheritance)
- Table-driven tests: `for _, tc := range testCases { ... }`
- Use `context.Context` as the first parameter of functions that do I/O
- Error wrapping: `fmt.Errorf("doing X: %w", err)` for stack traces

**Common smells unique to Go:**
- Ignoring errors: `result, _ := fn()` — almost always wrong
- Global package-level variables (hard to test)
- Using `interface{}` / `any` when a concrete type is available
- Not closing `io.ReadCloser` resources
- Goroutine leaks (goroutine started but never signaled to stop)
- Large structs passed by value instead of pointer

**Move mechanics:**
- Moving a function between packages changes its import path — update all imports
- Unexported identifiers (lowercase) cannot be used outside their package — may need to export on move

---

## Rust

| | |
|---|---|
| **Test commands** | `cargo test` · `cargo test -- --nocapture` |
| **Build/typecheck** | `cargo check` · `cargo build` |
| **Formatter** | `cargo fmt` · `cargo clippy --fix` |
| **Project detection** | `Cargo.toml` exists |

**Idiomatic style:**
- Ownership must be respected in all moves — transferring ownership vs. borrowing are different refactorings
- Prefer `?` operator over `match` for error propagation
- `impl Trait` return types over concrete types for flexibility
- Prefer iterators and combinators over manual loops (`iter().map().filter().collect()`)
- `derive(Debug, Clone, PartialEq)` for data types
- `Option` and `Result` — never use `unwrap()` in library code; use `expect("reason")` at minimum
- Match exhaustiveness is enforced by the compiler — adding a new enum variant will force updates everywhere

**Common smells unique to Rust:**
- Unnecessary `.clone()` — often signals a design issue with ownership
- `.unwrap()` in non-test code — use `?` or explicit error handling
- Storing `Rc<RefCell<T>>` everywhere — often signals mutable shared state that should be redesigned
- `unsafe` blocks without clear justification

**Move mechanics:**
- Moving code between modules changes the visibility rules (`pub`, `pub(crate)`) — update accordingly
- Trait implementations must be in the same crate as either the trait or the type

---

## Java

| | |
|---|---|
| **Test commands** | `./gradlew test` · `mvn test` · `./mvnw test` |
| **Build/typecheck** | `./gradlew build` · `mvn compile` |
| **Formatter** | Spotless (`./gradlew spotlessApply`) · google-java-format |
| **Project detection** | `pom.xml` · `build.gradle` · `build.gradle.kts` |

**Idiomatic style:**
- Interfaces over abstract classes for polymorphism
- Streams over imperative loops: `list.stream().filter().map().collect()`
- Builder pattern for constructors with >3 parameters
- `Optional<T>` instead of returning `null`
- `record` (Java 16+) for immutable data containers
- `var` for local variable type inference (Java 10+)
- Prefer composition over inheritance

**Common smells unique to Java:**
- Null overuse — replace with `Optional` or Null Object
- God classes (thousands of lines — Java culture has historically tolerated these)
- Checked exceptions propagated everywhere — sometimes better to wrap in unchecked
- `instanceof` checks in the middle of logic — use polymorphism

---

## Kotlin

| | |
|---|---|
| **Test commands** | `./gradlew test` · `./gradlew :module:test` |
| **Build/typecheck** | `./gradlew build` · `./gradlew compileKotlin` |
| **Formatter** | ktlint (`./gradlew ktlintFormat`) |
| **Project detection** | `build.gradle.kts` with Kotlin plugin · `.kt` files |

**Idiomatic style:**
- `data class` for value objects (auto-generates `equals`, `hashCode`, `copy`)
- Sealed classes for exhaustive type hierarchies
- Extension functions to add behavior to existing types without inheritance
- Null safety: `?.` (safe call), `?:` (Elvis), never `!!` in production code
- `when` expression for exhaustive matching (sealed classes + `when` = safe type checking)
- `val` by default; `var` only when mutation is needed
- Scope functions: `let`, `run`, `apply`, `also`, `with` — use the one that fits the intent

**Common smells unique to Kotlin:**
- Java-isms: using Java null patterns instead of Kotlin null safety
- `!!` operator (null assertion) — almost always indicates missing null handling
- Using `Unit` return type but not naming the side effect clearly

---

## C# / .NET

| | |
|---|---|
| **Test commands** | `dotnet test` · `dotnet test --filter TestName` |
| **Build/typecheck** | `dotnet build` |
| **Formatter** | `dotnet format` |
| **Project detection** | `.csproj` · `.sln` files |

**Idiomatic style:**
- `record` types for immutable data (C# 9+)
- Pattern matching with `switch` expressions (C# 8+)
- LINQ for collection transformations: `.Where().Select().ToList()`
- `async`/`await` throughout — avoid `.Result` and `.Wait()` which can deadlock
- Expression-bodied members for single-expression methods: `int Double(int x) => x * 2;`
- Nullable reference types enabled — use `?` annotations and null-conditional operators

**Common smells unique to C#:**
- Mutable class state where `record` would suffice
- `.Result`/`.Wait()` causing deadlocks in async contexts
- `object` type used instead of generics

---

## Swift

| | |
|---|---|
| **Test commands** | `swift test` · `xcodebuild test -scheme MyScheme` |
| **Build/typecheck** | `swift build` |
| **Formatter** | `swiftformat .` · `swiftlint --fix` |
| **Project detection** | `Package.swift` · `.xcodeproj` |

**Idiomatic style:**
- Value types (`struct`, `enum`) preferred over reference types (`class`) for data
- Protocol-oriented programming — prefer protocols to class inheritance
- `guard` for early exit / precondition checking
- `enum` with associated values for modeling sum types
- Forced unwrap `!` only when crash is truly the correct behavior (never in library code)
- `Codable` for serialization instead of custom parsing

---

## Ruby

| | |
|---|---|
| **Test commands** | `bundle exec rspec` · `bundle exec rake test` · `ruby -Itest test/test_*.rb` |
| **Build/typecheck** | `bundle exec rubocop` |
| **Formatter** | `bundle exec rubocop --autocorrect` |
| **Project detection** | `Gemfile` · `.ruby-version` |

**Idiomatic style:**
- Blocks and procs over callbacks and passing function objects
- `Enumerable` methods over manual loops
- Duck typing — check for method presence, not class type
- `attr_reader`/`attr_writer`/`attr_accessor` for instance variables
- `method_missing` is a smell, not a feature — use explicit delegation
- Frozen string literals where performance matters

---

## C / C++

| | |
|---|---|
| **Test commands** | `ctest` · `make test` · `./build/tests` |
| **Build/typecheck** | `cmake --build . && cmake --build . -- check` |
| **Formatter** | `clang-format -i **/*.cpp **/*.h` |
| **Project detection** | `CMakeLists.txt` · `Makefile` · `.cpp`/`.c` files |

**Idiomatic style (modern C++):**
- RAII: resource acquisition = initialization; destructors release resources
- `std::unique_ptr` / `std::shared_ptr` over raw owning pointers
- `const` by default for parameters and member functions
- Range-based for loops
- `[[nodiscard]]` on functions whose return value must be checked
- Header/source split maintained — declarations in `.h`, definitions in `.cpp`

**Common smells unique to C/C++:**
- Raw `new`/`delete` without RAII wrapper
- Global mutable state
- Long header files with implementation leaking in — check for `inline` abuse
- Manual memory management that could be `std::vector` or a smart pointer

---

## SQL

| | |
|---|---|
| **Test commands** | (manual review + `EXPLAIN ANALYZE`) |
| **Formatter** | `sqlfluff fix .` · pgFormatter |

**Idiomatic style:**
- CTEs (`WITH`) over nested subqueries for readability
- Avoid `SELECT *` — name columns explicitly
- Prefer `JOIN` over subquery when both work
- Index-aware rewrites: filter on indexed columns, avoid functions on indexed columns in WHERE
- Use window functions (`ROW_NUMBER`, `RANK`, `LAG`) over self-joins for row-ranking patterns
- Naming: `snake_case` for columns and tables; `UPPER_CASE` for SQL keywords

**Common smells unique to SQL:**
- `SELECT *` — fragile to schema changes
- Correlated subqueries in WHERE/SELECT that run once per row
- Missing indexes on join columns or high-cardinality filter columns
- N+1 query patterns (application-level loop with one query per row)
