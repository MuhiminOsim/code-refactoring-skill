# Catalog: Architectural Refactoring

Operations for moving code between architectural layers — safely, incrementally, and without changing behavior.

**Before using any operation here:** Read `safety.md` §8 in full. Architectural refactoring always triggers §8 and Large Codebase Protocol (§6). You must map the current architecture before touching anything.

Each entry: **Intent → When to use → Pre-conditions → Mechanics → Example → Watch-outs**

---

## The Moving Invariant

**Never change logic AND location in the same step.**

Every architectural move follows this three-step sequence:

```
Step A — Introduce: Create new location. Old location delegates to new. Tests pass.
Step B — Redirect: All callers use new location. Old location is now dead. Tests pass.
Step C — Remove: Delete old location. Tests pass.
```

If tests fail at any step, revert that step only. Do not proceed to the next step.

---

## Extract ViewModel

**Intent:** Move state derivation, formatting, and display logic from a View/Activity/Fragment/Component into a dedicated ViewModel, making the view a passive renderer.

**When to use:**
- A View/Activity/Fragment computes derived state (e.g., formats currency, filters lists, computes visibility)
- Business or presentation logic lives in event handlers / lifecycle methods
- The View is hard to unit test because it mixes UI and logic
- Pattern target: MVVM

**Pre-conditions (all must be true before starting):**
- [ ] Current view file read in full
- [ ] All logic that will move is identified and listed (no surprises mid-move)
- [ ] Existing tests cover the logic being moved
- [ ] Target platform's ViewModel mechanism identified (Android: `ViewModel` + `StateFlow`/`LiveData`; iOS: `ObservableObject`; web: component state hook / store)

**Mechanics:**
1. Create a new `[FeatureName]ViewModel` class/file adjacent to the view
2. Add a field/property for each piece of state the view currently computes
3. **Step A (Introduce):** Move the first logic unit to the ViewModel. View delegates: calls ViewModel, renders result. Run tests.
4. **Step B (Redirect):** Update the view to observe the ViewModel's state (binding, StateFlow, reactive subscription). Run tests.
5. **Step C (Remove):** Delete the logic from the view. Run tests.
6. Repeat steps A–C for each additional logic unit — one at a time.

**Example:**
```kotlin
// BEFORE — Activity doing too much
class OrderActivity : AppCompatActivity() {
    override fun onCreate(...) {
        val subtotal = order.items.sumOf { it.price * it.quantity }
        val tax = subtotal * 0.1
        val total = subtotal + tax
        val label = if (total > 100) "Free shipping!" else "Add ${100 - total} for free shipping"
        totalTextView.text = "$${"%.2f".format(total)}"
        shippingLabel.text = label
    }
}

// AFTER — ViewModel owns the logic
class OrderViewModel(private val order: Order) : ViewModel() {
    val total: Double get() = order.items.sumOf { it.price * it.quantity } * 1.1
    val shippingLabel: String get() =
        if (total > 100) "Free shipping!" else "Add ${"%.2f".format(100 - total)} for free shipping"
    val formattedTotal: String get() = "$${"%.2f".format(total)}"
}

class OrderActivity : AppCompatActivity() {
    private val viewModel: OrderViewModel by viewModels()
    override fun onCreate(...) {
        totalTextView.text = viewModel.formattedTotal
        shippingLabel.text = viewModel.shippingLabel
    }
}
```

**Watch-outs:**
- ViewModel must not hold a reference to the View or Activity context — this causes memory leaks
- If ViewModel needs async data, use coroutines / Combine / RxJava scoped to ViewModel, not the View
- Platform lifecycle matters: Android ViewModel survives rotation; SwiftUI StateObject does not persist across navigation by default
- Do not move navigation logic into the ViewModel — navigation is a View concern in most patterns

---

## Introduce Presenter

**Intent:** Extract a Presenter from a Controller/Activity/ViewController so that all presentation logic can be unit tested without a UI framework.

**When to use:**
- Controller/Activity is hard to test because it directly calls UI methods
- Logic is entangled with lifecycle callbacks
- You need to swap UI implementations (e.g., different form factor, A/B test)
- Pattern target: MVP

**Pre-conditions:**
- [ ] Current controller/activity read in full
- [ ] All UI interactions catalogued (what does the UI need to display? what does the controller respond to?)
- [ ] Test double mechanism confirmed (mock View interface via framework or manual stub)

**Mechanics:**
1. Define a `[Feature]View` interface listing every display action the controller performs on the UI (e.g., `showLoading()`, `showError(message)`, `displayResult(data)`)
2. Make the real View/Activity implement the interface
3. Create `[Feature]Presenter` class; inject the View interface via constructor
4. **Step A:** Move the first logic unit into Presenter. Controller/Activity delegates to Presenter. Run tests.
5. **Step B:** Write a unit test for the moved logic using a stub/mock View. Confirm test passes.
6. **Step C:** Remove logic from Controller/Activity. Run all tests.
7. Repeat A–C per logic unit.

**Example:**
```typescript
// BEFORE — controller couples logic and UI
class LoginController {
  async onSubmit(email: string, password: string) {
    this.view.showLoading();
    try {
      const user = await this.authService.login(email, password);
      this.view.navigateTo('/dashboard');
    } catch (e) {
      this.view.showError(e.message);
    } finally {
      this.view.hideLoading();
    }
  }
}

// AFTER
interface LoginView {
  showLoading(): void;
  hideLoading(): void;
  showError(message: string): void;
  navigateTo(path: string): void;
}

class LoginPresenter {
  constructor(private view: LoginView, private authService: AuthService) {}

  async onSubmit(email: string, password: string) {
    this.view.showLoading();
    try {
      await this.authService.login(email, password);
      this.view.navigateTo('/dashboard');
    } catch (e) {
      this.view.showError(e.message);
    } finally {
      this.view.hideLoading();
    }
  }
}

// Real view implements LoginView; test stubs it
```

**Watch-outs:**
- The View interface should only contain display commands, never business logic
- Avoid letting Presenter hold a strong reference to View in languages/environments where the View can be destroyed — use weak references or explicit detach
- If Presenter needs to call back into the view asynchronously after destruction, you'll crash — scope coroutines/tasks to the view's lifecycle

---

## Push Business Logic to Domain Layer

**Intent:** Move domain rules out of service/controller classes into the domain objects that own the data, making the domain model rich instead of anemic.

**When to use:**
- A `*Service` or `*Manager` contains logic that operates on a single domain object (not cross-aggregate)
- Domain objects are pure data containers (getters/setters only)
- The same rule is duplicated across multiple services
- Smell detected: Anemic Domain Model

**Pre-conditions:**
- [ ] The rule operates on data owned by a single domain object
- [ ] Moving the rule does not introduce a dependency from the domain layer to an outer layer (no importing repositories, HTTP clients, or UI types into domain)
- [ ] Tests exist for the rule in its current location

**Mechanics:**
1. Identify the rule and confirm it belongs to a single domain object
2. **Step A:** Add the method to the domain object. Service delegates: calls domain method. Run tests.
3. **Step B:** Update all services that duplicate this rule to call the domain method instead. Run tests after each service update.
4. **Step C:** Delete the original service method. Run tests.

**Example:**
```python
# BEFORE — anemic Order, fat OrderService
class Order:
    def __init__(self, items, customer_tier):
        self.items = items
        self.customer_tier = customer_tier

class OrderService:
    def calculate_discount(self, order: Order) -> float:
        subtotal = sum(i.price * i.qty for i in order.items)
        if order.customer_tier == "premium":
            return subtotal * 0.2
        return subtotal * 0.05

# AFTER — rich Order
class Order:
    def __init__(self, items, customer_tier):
        self.items = items
        self.customer_tier = customer_tier

    def discount(self) -> float:
        subtotal = sum(i.price * i.qty for i in self.items)
        return subtotal * (0.2 if self.customer_tier == "premium" else 0.05)

class OrderService:
    def calculate_discount(self, order: Order) -> float:
        return order.discount()  # Step A: delegate; Step C: remove this method
```

**Watch-outs:**
- Do NOT move logic that requires a repository, external API, or side effect into the domain object — those are application-layer concerns
- If the rule spans two domain objects (cross-aggregate), it belongs in a domain service, not either object
- Check all places the service method is called — all callers need updating in Step B

---

## Introduce Repository

**Intent:** Centralize all data access for a domain entity behind a single Repository, eliminating scattered query/mutation code across layers.

**When to use:**
- SQL queries, ORM calls, or HTTP client calls appear in controllers, services, AND/OR presenters
- No single owner of data access for a given entity
- Switching data source (e.g., cache, test database) requires touching many files
- Smell detected: Scattered Data Access

**Pre-conditions:**
- [ ] All existing data access points for the entity are mapped using Grep
- [ ] Target interface designed (what operations does the repository need?)
- [ ] Test double strategy confirmed (in-memory fake, mock, or test database)

**Mechanics:**
1. Create a `[Entity]Repository` interface with method signatures for all needed operations
2. Create a concrete implementation (`[Entity]RepositoryImpl`) that wraps existing data access
3. **Step A:** Inject the repository into the first consumer (controller/service). Consumer calls repository. Repository delegates to original data access code. Run tests.
4. **Step B:** Move actual data access code from the original location into `RepositoryImpl`. Run tests.
5. **Step C:** Remove data access from original location. Run tests.
6. Repeat A–C for each additional consumer.

**Example:**
```go
// BEFORE — data access in handler
func GetUserHandler(db *sql.DB) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        id := r.PathValue("id")
        var user User
        db.QueryRow("SELECT id, name, email FROM users WHERE id = ?", id).
            Scan(&user.ID, &user.Name, &user.Email)
        json.NewEncoder(w).Encode(user)
    }
}

// AFTER
type UserRepository interface {
    FindByID(ctx context.Context, id string) (User, error)
}

type SQLUserRepository struct{ db *sql.DB }

func (r *SQLUserRepository) FindByID(ctx context.Context, id string) (User, error) {
    var user User
    err := r.db.QueryRowContext(ctx, "SELECT id, name, email FROM users WHERE id = ?", id).
        Scan(&user.ID, &user.Name, &user.Email)
    return user, err
}

func GetUserHandler(repo UserRepository) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        user, err := repo.FindByID(r.Context(), r.PathValue("id"))
        if err != nil { http.Error(w, err.Error(), 500); return }
        json.NewEncoder(w).Encode(user)
    }
}
```

**Watch-outs:**
- Repository interface belongs to the domain/application layer, not the data layer — the data layer implements it, not owns it (Dependency Inversion Principle)
- Do not put transaction management inside the repository — transactions are an application-layer concern (unit of work)
- Avoid generic repositories (`Repository[T]`) unless the pattern is already established — they leak data-layer concepts (query objects, specifications) into the domain

---

## Extract Use Case / Interactor

**Intent:** Extract a cross-cutting business flow that is duplicated across multiple controllers or presenters into a single, independently testable Use Case class.

**When to use:**
- The same business flow (e.g., "place order", "register user") appears in multiple controllers
- A controller/presenter calls 4+ services in sequence to accomplish one action
- The flow cannot be unit tested without mocking the entire web/API framework
- Pattern target: Clean Architecture, Hexagonal Architecture

**Pre-conditions:**
- [ ] All call sites of the duplicated flow are identified via Grep
- [ ] The flow's inputs and outputs are clearly defined
- [ ] The flow has no direct UI dependency (if it does, extract that first)

**Mechanics:**
1. Define the Use Case: one class, one public `execute(input)` method
2. Identify all dependencies the flow needs (repositories, services, external gateways)
3. **Step A:** Create `[Action]UseCase` class. First controller delegates to it. Run tests.
4. **Step B:** Write unit tests for the Use Case with mocked dependencies. Confirm they pass.
5. **Step C:** Remove duplicated logic from the first controller. Run tests.
6. Repeat C for each remaining controller that duplicates the flow.

**Example:**
```csharp
// BEFORE — PlaceOrder logic duplicated in WebController and MobileController

// AFTER
public class PlaceOrderUseCase
{
    private readonly IOrderRepository _orders;
    private readonly IInventoryService _inventory;
    private readonly IPaymentGateway _payments;

    public PlaceOrderUseCase(IOrderRepository orders,
        IInventoryService inventory, IPaymentGateway payments)
    {
        _orders = orders; _inventory = inventory; _payments = payments;
    }

    public async Task<OrderResult> Execute(PlaceOrderInput input)
    {
        await _inventory.Reserve(input.Items);
        var order = Order.Create(input.CustomerId, input.Items);
        var payment = await _payments.Charge(order.Total, input.PaymentToken);
        order.ConfirmPayment(payment.TransactionId);
        await _orders.Save(order);
        return new OrderResult(order.Id, order.Total);
    }
}

// Both WebController and MobileController now inject and call PlaceOrderUseCase
```

**Watch-outs:**
- Use Case input/output types (DTOs) must not be framework types (e.g., `HttpRequest`, `Intent`) — keep them plain data objects
- One Use Case = one business action. Do not create a "God Use Case" that handles multiple flows with a flag parameter
- If the Use Case grows beyond ~50 lines, it is doing too much — decompose it

---

## Fix Layer Violation

**Intent:** Remove a direct dependency from an outer layer to an inner-than-allowed layer, restoring clean layering by introducing the correct abstraction.

**When to use:**
- Presentation layer imports from a data/repository package directly
- Controller imports a concrete ORM entity or database model type
- A domain object imports a service or repository (inverted dependency direction)
- Smell detected: Layer Violation

**Pre-conditions:**
- [ ] All layer-crossing imports in the offending file are identified (Grep for import statements)
- [ ] The intended layer boundary is confirmed with the user

**Mechanics:**
1. Identify the type being imported across the boundary
2. Create a domain-level interface or DTO that the outer layer should use instead
3. **Step A:** Update the outer layer to use the new type. Inner layer converts to/from the domain type. Run tests.
4. **Step B:** Remove the boundary-crossing import from the outer layer. Run tests.
5. If multiple files have the same violation, repeat per file.

**Watch-outs:**
- Red Line: if the boundary-crossing type is a serialization format (ORM entity mapped to DB columns), changing it may require a data migration — stop and confirm with user
- Mapping between layers adds boilerplate — this is intentional; the alternative is tight coupling

---

## Separate Read Model from Write Model

**Intent:** Split a single model that serves both complex queries and mutations into a focused write model (command side) and lightweight read models (query side).

**When to use:**
- A domain entity has >10 fields but most queries use only 2–3
- Complex joins are required to build a single entity
- Performance of reads is poor because the write model is too heavy to query
- Pattern target: CQRS (command/query separation at the model level)

**When NOT to use:**
- Simple CRUD with no complex query requirements — this is over-engineering
- Team is not familiar with CQRS — start with Extract Use Case or Push Business Logic first

**Mechanics:**
1. Identify the query use cases that are suffering (which specific queries?)
2. Create a read-only `[Entity]Summary` / `[Entity]View` DTO for each query pattern
3. Create a query handler / repository method that returns the DTO directly (no domain object construction)
4. **Step A:** Add the new read path. Existing read path still works. Run tests.
5. **Step B:** Migrate callers to the new read path. Run tests after each caller migration.
6. **Step C:** Remove the old query path if all callers migrated. Run tests.

**Watch-outs:**
- Read models may become stale if the write side changes — maintain read model projections carefully
- Do not add write logic (validation, state transitions) to read models — they must be read-only
- This operation can be done without event sourcing — pure CQRS at the model level is far simpler
