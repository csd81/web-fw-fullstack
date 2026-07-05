# Phase 7: Subtree Rendering & Bailing Out

## Objective
Optimize the engine so that state updates do not trigger a complete top-to-bottom re-render of the entire application. Introduce mechanisms to bail out of rendering subtrees when props have not changed.

---

## 1. Subtree Re-rendering

Currently, when `setState` or `dispatch` is called, we set `wipRoot` to the `currentRoot` (the top of the application). This forces the engine to traverse every single node in the application.

**Implementation Strategy:**
- Modify the `setState`/`dispatch` hook to capture a reference to the **current Fiber** where the hook was called.
- Instead of setting `wipRoot = currentRoot`, set `wipRoot = currentFiber`.
- Ensure that the traversal logic in `performUnitOfWork` knows when it has reached the boundaries of the updated subtree so it stops traversing and triggers `commitRoot`.
- Ensure that `commitRoot` only processes the modified subtree and correctly patches the existing DOM without accidentally unmounting parent nodes.

---

## 2. Bailing Out with `React.memo`

Even within a subtree, many child components may receive the exact same props as before. Re-rendering them is wasteful.

**Implementation Strategy:**
- Create a Higher Order Component (HOC) `memo(Component, areEqual)`.
- When `updateFunctionComponent` processes a Fiber, check if the component is wrapped in `memo`.
- If it is, compare the new `fiber.props` with `fiber.alternate.props`.
- If the props are identical (shallow equality by default, or using the custom `areEqual` function), we **bail out**.
- Bailing out means we clone the children from `fiber.alternate` directly to the `wipFiber` without calling the component function, and we skip updating their `effectTag` to `"UPDATE"`.

---

## 3. Lane Priority Scheduling (Conceptual)

While a full lane model (React 18's bitmask architecture) is extremely complex, we can introduce a simplified priority queue.

**Implementation Strategy:**
- Assign a priority level to updates (e.g., `Immediate`, `Normal`, `Low`).
- Create an array of roots or a priority queue for `nextUnitOfWork`.
- Modify `workLoop` to always process the highest priority root first. If a high priority update (like an input typing event) comes in while a low priority update (like a data fetch render) is being processed, the low priority `wipRoot` is suspended or discarded in favor of the new high priority root.
