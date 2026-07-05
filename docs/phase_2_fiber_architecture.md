# Phase 2: Concurrent Mode & The Fiber Architecture

## Objective
Move away from recursive, blocking rendering by implementing an interruptible work loop using Fibers.

## Steps to Execute

1. **The Work Loop Setup**
   - Implement a continuous loop using `requestIdleCallback`.
   - The loop will check `deadline.timeRemaining()` and yield control back to the browser if it runs out of time.
   - Introduce a `nextUnitOfWork` global variable to keep track of the current Fiber being processed.

2. **Defining the `Fiber` Structure (`types.ts`)**
   - A Fiber represents a single unit of work (usually corresponding to one DOM node or component).
   - Extend the `VNode` concept to create the `Fiber` interface.
   - Add structural pointers: `parent`, `child`, `sibling`.
   - Add stateful pointers: `dom` (reference to physical node), `props`, `alternate` (previous fiber), `effectTag` (what kind of DOM mutation is needed).

3. **Writing `createDom(fiber)`**
   - Extract the DOM creation logic from the Phase 1 `render` function into a separate `createDom` utility.
   - This utility simply creates the node and assigns props, but does *not* recursively append children.

4. **Refactoring `render` and Implementing `performUnitOfWork`**
   - Update `render` to just set the `nextUnitOfWork` to the root Fiber.
   - Write `performUnitOfWork(fiber)` which does three things:
     1. Creates the DOM node for the fiber (if it doesn't have one).
     2. Iterates over the fiber's `children`, creating new Fibers for them and linking them up via `child` and `sibling` pointers.
     3. Returns the next fiber to process (search order: child -> sibling -> uncle).

## Validation
- The UI should still render the same static JSX as Phase 1, but the browser's main thread won't be blocked for large trees. We can verify this by rendering a deeply nested structure and checking the performance profiler.
