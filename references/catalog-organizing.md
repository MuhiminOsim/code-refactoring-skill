# Catalog: Organizing Data & Moving Features

Operations for moving code to where it belongs — the right class, the right module, the right abstraction level.

Each entry: **Intent → Mechanics → Example → Inverse → Watch-outs**

---

## Move Method / Move Function

**Intent:** Move a method to the class or module it actually uses most.

**When to use:**
- A method uses another class's data or methods more than its own (Feature Envy smell)
- The method logically belongs to a different abstraction
- Moving it reduces coupling between classes

**Mechanics:**
1. Grep for all callers of the method
2. Create the method on the target class (copy the body, adjust references to `this`/`self`)
3. Adjust the original method to delegate to the new location (for one-step migration)
4. Update all call sites to call the new location
5. Remove the original method (or the delegation shim)
6. Run tests

**Example:**
```
// BEFORE — Account has a method that really belongs on AccountType
class Account {
  overdraftCharge() {
    if (this.type.isPremium) {
      const baseCharge = 10;
      if (this.daysOverdrawn <= 7) return baseCharge;
      return baseCharge + (this.daysOverdrawn - 7) * 0.85;
    }
    return this.daysOverdrawn * 1.75;
  }
}

// AFTER
class AccountType {
  overdraftCharge(daysOverdrawn) {
    if (this.isPremium) {
      const baseCharge = 10;
      if (daysOverdrawn <= 7) return baseCharge;
      return baseCharge + (daysOverdrawn - 7) * 0.85;
    }
    return daysOverdrawn * 1.75;
  }
}
class Account {
  overdraftCharge() { return this.type.overdraftCharge(this.daysOverdrawn); }
}
```

**Watch-outs:**
- If the method references many fields of the original class, it may not belong anywhere else — reconsider
- Red Line: if the method is part of a public API, see safety.md §3
- Check for subclasses that override the method before moving

---

## Move Field

**Intent:** Move a field to the class that uses it most.

**When to use:**
- A field is used more by another class than by the class that owns it
- During Extract Class — fields need to move to the new class

**Mechanics:**
1. Encapsulate the field with accessors if not already done (Encapsulate Variable)
2. Add the field to the target class
3. Run tests to confirm the move doesn't break anything yet
4. Update the accessor in the source class to delegate to the target
5. Update all users of the field to use the target directly (if better for encapsulation)
6. Remove the original field
7. Run tests

**Watch-outs:**
- If both classes use the field equally, it may be a Data Clump — consider Introduce Parameter Object instead
- In concurrent code, moving a field changes what lock protects it — see safety.md §3

---

## Extract Class

**Intent:** Split a class that is doing two jobs into two classes, each with a clear responsibility.

**When to use:**
- A class has too many methods and fields (Large Class smell)
- A subset of the class's fields and methods form a coherent group
- Two clear "responsibilities" can be named separately

**Mechanics:**
1. Name the new class and identify which fields/methods belong to it
2. Create the new class
3. Move the identified fields to the new class (Move Field)
4. Move the identified methods to the new class (Move Method)
5. Decide the relationship: does the original class hold a reference to the new one?
6. Update all call sites
7. Run tests

**Example:**
```
// BEFORE — Person has both personal and contact info responsibilities
class Person {
  name; officeAreaCode; officeNumber;
  telephoneNumber() { return `(${this.officeAreaCode}) ${this.officeNumber}`; }
}

// AFTER
class TelephoneNumber {
  areaCode; number;
  toString() { return `(${this.areaCode}) ${this.number}`; }
}
class Person {
  name;
  officeTelephone = new TelephoneNumber();
  telephoneNumber() { return this.officeTelephone.toString(); }
}
```

**Inverse:** Inline Class

**Watch-outs:**
- This is a larger operation — do it incrementally (Move Field one at a time, Move Method one at a time)
- The new class may need its own tests
- Check whether the new class should be a value object (immutable) or an entity

---

## Inline Class

**Intent:** Collapse a class that isn't doing enough to justify its existence into another class.

**When to use:**
- The class has very few responsibilities left after other refactorings
- It's mostly a data container with no real behavior
- The abstraction it provides doesn't pay for the cognitive overhead of a separate class

**Mechanics:**
1. Declare the public interface of the class to be inlined on the absorbing class
2. Update all references to the inline class's methods to use the absorbing class
3. Move all fields and methods into the absorbing class
4. Delete the now-empty class
5. Run tests

**Inverse:** Extract Class

**Watch-outs:**
- Often done as a prelude to Extract Class in a different direction ("make it worse, then make it better")
- Don't inline a class that is used in multiple places — that's a strong signal it has value

---

## Hide Delegate

**Intent:** Create a method on a server class to hide the delegation to another object, removing a message chain.

**When to use:**
- Callers navigate through a chain: `person.getDepartment().getManager()`
- Changing the `Department` class forces changes to `Person` callers everywhere

**Mechanics:**
1. For each method of the delegate (Department) that clients call through the server (Person), create a delegating method on the server
2. Update clients to call the server's method instead of navigating through
3. If no clients access the delegate directly anymore, remove the accessor for the delegate
4. Run tests

**Example:**
```
// BEFORE
manager = person.getDepartment().getManager();

// AFTER
class Person {
  getManager() { return this.department.getManager(); }
}
manager = person.getManager();
```

**Inverse:** Remove Middle Man (when the delegation no longer simplifies things)

**Watch-outs:**
- Don't over-apply — if clients legitimately need to work with the Department object, hiding it adds accidental complexity
- If you need to hide many methods of the delegate, Extract Class may be a better move

---

## Remove Middle Man

**Intent:** Remove a class that only delegates, exposing the delegate directly.

**When to use:**
- A class has too many delegating methods that add no value
- The delegation has grown to the point where it's simpler for clients to call the delegate directly

**Mechanics:**
1. Expose an accessor for the delegate on the server class
2. For each delegating method, update clients to call the delegate directly
3. Remove the delegating methods
4. Run tests

**Inverse:** Hide Delegate

**Watch-outs:**
- The reverse of Hide Delegate — apply whichever reduces coupling for the specific clients
- Check whether removing the delegation exposes an internal type that should remain private

---

## Replace Data Value with Object / Value Object

**Intent:** Replace a primitive or data record with a proper object that encapsulates domain behavior.

**When to use:**
- A primitive value carries domain meaning (Money, PhoneNumber, Email, DateRange)
- The same validation or formatting logic appears in multiple places around the primitive
- You want to add behavior to the data in the future

**Mechanics:**
1. Create a new class with a field for the original primitive
2. Add a constructor and a getter
3. Add any validation, formatting, or comparison behavior
4. Replace all uses of the raw primitive with the new class
5. Run tests

**Example:**
```
// BEFORE
class Order {
  customerName: string;  // "John Smith" — used for display, sorting, comparison
}

// AFTER
class CustomerName {
  constructor(private readonly value: string) {
    if (!value.trim()) throw new Error("Name cannot be blank");
  }
  toString() { return this.value; }
  equals(other: CustomerName) { return this.value === other.value; }
}
class Order {
  customerName: CustomerName;
}
```

**Watch-outs:**
- Value objects should be immutable — if you need to "change" the value, create a new instance
- Do not make every primitive a value object — only those that carry domain meaning or repeated behavior
- Check serialization: value objects need to serialize/deserialize correctly (Red Line in safety.md §3)

---

## Replace Array/Tuple with Object

**Intent:** Replace a positional array/tuple with a named-field object when the positions have semantic meaning.

**When to use:**
- Code accesses array by index: `result[0]`, `result[1]`
- A tuple is used to return multiple values that have names

**Mechanics:**
1. Create an object/record/struct with named fields corresponding to each position
2. Replace array construction with object construction
3. Replace index access with field access
4. Run tests

**Example:**
```
// BEFORE
const result = [startDate, endDate, totalDays];
console.log(result[2]);

// AFTER
const result = { startDate, endDate, totalDays };
console.log(result.totalDays);
```

---

## Encapsulate Variable / Encapsulate Field

**Intent:** Privatize a public field and provide controlled access through methods.

**When to use:**
- A field is accessed directly from outside its class
- You want to add validation, notification, or lazy loading on access
- You need to intercept reads or writes to enable monitoring or caching

**Mechanics:**
1. Create get and set accessors for the field
2. Find all references to the field and replace with accessor calls
3. Make the field private
4. Run tests

**Watch-outs:**
- In languages with property syntax (Python, C#, Kotlin), this is a language feature — use it
- Do not add getters/setters blindly on every field — only when access control is needed

---

## Rename Field

**Intent:** Rename a field to better match its purpose or the ubiquitous language of the domain.

**When to use:**
- A field name is misleading, abbreviated, or doesn't match the domain language
- The field's meaning has evolved since it was named

**Mechanics:**
1. If field is used outside the class, encapsulate it first (Encapsulate Variable)
2. Rename the field
3. Update the accessor names to match
4. Update all call sites
5. Run tests

**Watch-outs:**
- Red Line if the field name is part of a serialized format (JSON, DB column, proto) — see safety.md §3
- For widely-used fields, use Grep to map all usage before renaming
