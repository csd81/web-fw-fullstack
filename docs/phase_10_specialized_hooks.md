# Phase 10: Specialized Hooks

## Objective
Implement the remaining, more specialized hooks provided by modern React to give developers fine-grained control over layout rendering and concurrent scheduling.

---

## 1. `useLayoutEffect`

`useEffect` runs asynchronously *after* the browser has painted the screen. `useLayoutEffect` must run synchronously immediately after DOM mutations, but *before* the browser has a chance to paint.

**Implementation Strategy:**
- In `commitRoot`, after all `commitWork` DOM mutations are applied but *before* the function exits and yields control back to the event loop, traverse the tree to find all `useLayoutEffect` hooks.
- Execute them synchronously right then and there.
- This blocks the browser from painting, which is necessary if the effect measures DOM nodes and triggers a secondary state update to prevent visual flickering.

---

## 2. `useTransition`

`useTransition` allows developers to mark certain state updates as "non-urgent" (transitions), allowing them to be interrupted by urgent updates like user typing.

**Implementation Strategy:**
- Implement `useTransition()` which returns `[isPending, startTransition]`.
- When `startTransition(callback)` is called, it sets a global flag `isTransition = true`, executes the callback (which contains state setters), and resets the flag.
- Any state setter called while `isTransition = true` pushes its update to a low-priority queue (see Phase 7 Lane Priority).
- If a high-priority update arrives while the low-priority transition is rendering, the transition is paused/aborted.

---

## 3. `useDeferredValue`

Similar to `useTransition`, this hook defers updating a specific value until urgent updates have finished.

**Implementation Strategy:**
- Under the hood, `useDeferredValue(value)` can be implemented using `useState` and `useEffect`.
- When the `value` changes, the hook returns the *old* value immediately (allowing urgent renders to complete), but schedules a low-priority state update to eventually replace it with the *new* value.
