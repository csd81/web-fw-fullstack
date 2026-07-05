# Phase 5: Polish & Extension

## Objective
To elevate the library from a minimal proof-of-concept to a robust framework, we will implement the `useEffect` hook for side-effects, introduce keyed list reconciliation to prevent unnecessary DOM mutations, and structure a basic synthetic event system.

---

## 1. The `useEffect` Hook

Unlike `useState` which calculates values during the render phase (`performUnitOfWork`), `useEffect` must defer its execution until *after* the Commit Phase has successfully painted the DOM.

**Implementation Steps:**
1. **Hook Storage:** In the `wipFiber.hooks` array, alongside `useState` hooks, we store effect hooks containing the `callback`, `dependencies` array, and a `cleanup` function.
2. **Dependency Diffing:** When `useEffect` is called, compare the new `dependencies` array against the `oldHook.dependencies`. If they are identical, flag the effect to be skipped. If they differ (or if there is no array), flag it to run.
3. **Execution Queue:** Create a global array `pendingEffects: Fiber[]`. If a Fiber contains pending effects, push it to this array during `commitWork`.
4. **Post-Commit Execution:**
   - Immediately after `commitRoot()` finishes appending elements, iterate through `pendingEffects`.
   - **Cleanup Phase:** For each effect flagged to run, execute its *old* `cleanup` function (from the `alternate` Fiber).
   - **Effect Phase:** Execute the new `callback`. If the callback returns a function, store it as the new `cleanup` function.

---

## 2. Keyed Reconciliation (List Optimization)

Currently, our reconciliation (`reconcileChildren`) compares children sequentially by index. If an item is inserted at the top of a list, the reconciler sees a mismatch for every subsequent item, destroying and recreating the entire list.

**Implementation Steps:**
1. **Map Construction:** Inside `reconcileChildren`, before looping over the new `VNode` children, iterate over the `alternate.child` linked list. Construct a JavaScript `Map` where the key is `oldFiber.props.key` and the value is the `oldFiber`.
2. **Lookup:** When iterating through the new `VNode` children, instead of comparing against `oldFiber.sibling`, look up the VNode's `key` in the `Map`.
3. **Re-use and Move:** If a match is found in the Map, we mark it as an `"UPDATE"` and reuse the DOM node. If its index in the new list differs from its index in the old list, we flag it with a `"PLACEMENT"` tag as well, indicating the Commit Phase needs to call `insertBefore` to physically move the DOM node without recreating it.

---

## 3. Basic Synthetic Events

React doesn't actually attach `addEventListener` to every single button or div. It attaches a single event listener to the root container and delegates events, improving performance and memory usage.

**Implementation Steps:**
1. **Remove Inline Listeners:** Modify `updateDom` so it no longer calls `dom.addEventListener` for `onClick`, `onChange`, etc.
2. **Root Delegation:** Attach standard listeners (`click`, `input`, `keydown`) to the root container where `render` is called.
3. **Event Interception:** When a user clicks, the root listener captures the event object.
4. **Fiber Traversal:** Access `event.target`. We need a mechanism (e.g., adding a hidden property `dom.__fiber = fiber` during `createDom`) to map the raw DOM node back to its corresponding Fiber.
5. **Event Bubbling Simulation:** Traverse up the Fiber tree using the `parent` pointer. If any Fiber has an `onClick` prop, execute it, passing the synthetic event wrapper. Stop traversal if the user calls `event.stopPropagation()`.

---

With these polish features, the custom React implementation is capable of handling professional-grade applications!
