# Catalog: Inheritance & Hierarchy Refactorings

Operations for working with class hierarchies — pulling shared behavior up, pushing specialized behavior down, and replacing inheritance with composition when it has become a liability.

Each entry: **Intent → Mechanics → Example → Inverse → Watch-outs**

---

## Pull Up Method

**Intent:** Move a method that is identical (or near-identical) in multiple subclasses up to the superclass.

**When to use:**
- Two or more subclasses have methods that do the same thing
- Centralizing the method eliminates duplication

**Mechanics:**
1. Confirm the methods are truly identical (or can be made identical with a small refactoring)
2. If they refer to fields that are only in the subclasses, Pull Up Field first
3. Create the method in the superclass
4. Remove the duplicate methods from the subclasses
5. Run tests

**Watch-outs:**
- If the methods are "almost identical," use Form Template Method instead (see below)
- Check that the superclass has access to all fields/methods the pulled-up method needs
- If the method only makes sense in some subclasses, Pull Up may be the wrong direction — consider Extract Superclass

---

## Pull Up Field

**Intent:** Move a field that appears in multiple subclasses into the superclass.

**When to use:**
- Two or more subclasses have identically-named fields used the same way
- Eliminates duplication and allows Pull Up Method

**Mechanics:**
1. Declare the field in the superclass
2. Remove the field from all subclasses
3. Run tests

---

## Push Down Method

**Intent:** Move a method from the superclass to a subclass when it is only relevant to a specific subclass.

**When to use:**
- A method in the superclass is only ever called on one specific subclass
- Moving it down reduces noise in the base class and clarifies intent

**Mechanics:**
1. Copy the method to the relevant subclass(es)
2. Remove the method from the superclass
3. Update any calls that relied on the superclass type to use the subclass type
4. Run tests

---

## Push Down Field

**Intent:** Move a field from the superclass to the subclass(es) that actually use it.

**When to use:**
- A field in the superclass is only used by one subclass
- Other subclasses leave it null/unused

**Mechanics:**
1. Declare the field in the relevant subclass(es)
2. Remove the field from the superclass
3. Update all references
4. Run tests

---

## Extract Superclass

**Intent:** Create a new superclass and move shared behavior into it from two or more related classes.

**When to use:**
- Two classes do similar things but have no common parent
- You want to share implementation (not just interface) between them

**Mechanics:**
1. Create a new (abstract) superclass
2. Make the two classes subclasses of the new superclass
3. Use Pull Up Field and Pull Up Method to move the shared behavior
4. Run tests

**Watch-outs:**
- If you only want to share interface (not implementation), Extract Interface is more appropriate
- A class can only have one superclass (in most languages) — if the class already has a superclass, composition may be better

---

## Extract Interface / Extract Protocol

**Intent:** Define a contract (interface or protocol) that a set of classes implement, enabling polymorphic use without inheritance.

**When to use:**
- Multiple classes have methods with the same signatures but different implementations
- You want to accept any object that responds to certain messages, without requiring a common ancestor
- You want to define a seam for testing (inject a mock that satisfies the interface)

**Mechanics:**
1. Identify the methods that form the contract
2. Create an interface/protocol with those method signatures
3. Declare that the relevant classes implement the interface
4. Update code that refers to the concrete classes to refer to the interface instead (where appropriate)
5. Run tests

**Example:**
```
// BEFORE — two separate classes with no shared type
class Timesheet { getBillableWeeks(employee, start, end) { ... } }
class Employee { getRate() { ... } }

// AFTER — interface defines the contract used by billing
interface Billable {
  getBillableWeeks(start: Date, end: Date): number;
  getRate(): number;
}
```

**Watch-outs:**
- Don't extract an interface with a single implementor — it adds noise without benefit (Speculative Generality)
- In Go, interfaces are implicit — you don't need to declare that a type implements them; just use the interface type

---

## Collapse Hierarchy

**Intent:** Merge a superclass and subclass that are so similar that the distinction isn't worth maintaining.

**When to use:**
- A subclass adds almost nothing to its superclass
- There is only one subclass and it's unlikely there will be others
- The superclass was created speculatively and never fully justified

**Mechanics:**
1. Choose which class absorbs the other (usually the superclass absorbs the subclass)
2. Use Pull Up Method/Field to move everything from the subclass to the superclass
3. Update all references to the subclass to use the superclass
4. Remove the now-empty subclass
5. Run tests

**Inverse:** Extract Superclass (when more subclasses appear)

---

## Replace Subclass with Delegate

**Intent:** Replace an inheritance relationship with a composition relationship (has-a instead of is-a).

**When to use:**
- The subclass relationship no longer holds strictly ("is-a" is questionable)
- You need to change the "type" of an object at runtime (impossible with inheritance)
- The class already has another superclass it needs
- The subclass is used only to vary one aspect of behavior

**Mechanics:**
1. Create a delegate class (what was the subclass becomes a standalone class)
2. Add a field in the original class pointing to the delegate
3. Move the subclass-specific methods to the delegate
4. Update the original class to call the delegate for that behavior
5. Remove the subclass
6. Run tests

**Example:**
```
// BEFORE — PremiumBooking extends Booking
class PremiumBooking extends Booking {
  hasTalkback() { return this.show.hasOwnProperty("talkback"); }
}

// AFTER — PremiumBookingDelegate handles the premium behavior
class PremiumBookingDelegate {
  hasTalkback(show) { return show.hasOwnProperty("talkback"); }
}
class Booking {
  constructor(..., isPremium) {
    if (isPremium) this.premiumDelegate = new PremiumBookingDelegate();
  }
  hasTalkback() {
    return this.premiumDelegate
      ? this.premiumDelegate.hasTalkback(this.show)
      : false;
  }
}
```

**Inverse:** Replace Delegate with Subclass (if the class hierarchy was simpler)

**Watch-outs:**
- This is a larger refactoring — do it incrementally, one method at a time
- After the move, the delegate class may have Feature Envy — it may need its own fields from the original class

---

## Replace Superclass with Delegate

**Intent:** Replace inheritance of a superclass with a field (delegation) when the subclass doesn't truly represent an is-a relationship.

**When to use:**
- A class inherits from another only to reuse its methods, not because it truly is a subtype
- Callers of the subclass should not be able to use it as the superclass
- The Liskov Substitution Principle is violated

**Classic anti-pattern:**
```
// Stack extends List — but Stack should NOT be substitutable for List
class Stack extends List {
  push(item) { this.add(item); }
  pop() { return this.remove(this.lastElement()); }
}
// Problem: callers can call stack.remove(0) — which breaks stack semantics
```

**Mechanics:**
1. Create a field in the subclass that holds an instance of the superclass
2. For each method of the superclass used by the subclass, add a delegating method
3. Remove the extends/inherits declaration
4. Run tests

**Watch-outs:**
- This may create many small delegating methods — consider whether it's worth it vs. just using composition from the start
- If the superclass interface is genuinely useful, Extract Interface first so callers can still use the interface type

---

## Remove Subclass

**Intent:** Collapse a subclass that only exists to vary a constant value into a type code or factory.

**When to use:**
- A subclass exists only to return a different constant value or to hold different data
- There is no polymorphic behavior — just differentiation by data

**Mechanics:**
1. Add a type code field to the superclass
2. Move any constant methods into the superclass (returning based on the type code)
3. Update all code that creates subclass instances to create superclass instances with the type code
4. Remove the subclass
5. Run tests

**Example:**
```
// BEFORE
class Male extends Person { genderCode() { return "M"; } }
class Female extends Person { genderCode() { return "F"; } }

// AFTER
class Person {
  constructor(genderCode) { this.genderCode = genderCode; }
}
const male = new Person("M");
const female = new Person("F");
```
