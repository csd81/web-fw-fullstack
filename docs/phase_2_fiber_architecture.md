# Phase 2: Concurrent Mode & The Fiber Architecture

## Objective
The recursive `render` function from Phase 1 blocks the browser's main thread. If the component tree is huge, the browser cannot render animations or handle user input until the recursion finishes. We will replace recursion with an interruptible work loop using the **Fiber architecture**.

---

## 1. The Fiber Data Structure (`src/types/index.ts`)

A Fiber is a data structure representing a single unit of work. Every `VNode` gets converted into a Fiber.

**Fiber Tree Structure:**
Instead of a simple array of children, Fibers form a singly-linked list tree to allow pausing and resuming traversal. Every Fiber points to:
- Its `child` (the first child).
- Its `sibling` (the next sibling).
- Its `parent`.

```typescript
export interface Fiber {
  type: string | Function;
  props: VNodeProps;
  dom: HTMLElement | Text | null; // The physical DOM node
  
  // Tree Pointers
  parent: Fiber | null;
  child: Fiber | null;
  sibling: Fiber | null;
  
  // State for diffing (added in Phase 3)
  alternate: Fiber | null;
  effectTag: "PLACEMENT" | "UPDATE" | "DELETION";
}
```

---

## 2. Setting Up the Concurrent Work Loop (`src/core/dom.ts`)

We use `requestIdleCallback` (or a `setTimeout` polyfill for Safari) to run work only when the browser main thread is idle.

**State Variables:**
```typescript
let nextUnitOfWork: Fiber | null = null;
```

**The Loop Mechanism:**
```typescript
function workLoop(deadline: IdleDeadline) {
  let shouldYield = false;
  
  while (nextUnitOfWork && !shouldYield) {
    // performUnitOfWork does the work and returns the NEXT fiber to process
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  
  // Continuously queue the next loop
  requestIdleCallback(workLoop);
}

requestIdleCallback(workLoop);
```

---

## 3. Extracting DOM Creation

We must remove DOM creation from the recursive `render` function and make it a standalone, pure function that only returns a physical node based on a Fiber.

```typescript
function createDom(fiber: Fiber): HTMLElement | Text {
  const dom =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type as string);

  updateDom(dom, {}, fiber.props); // We will define updateDom later
  return dom;
}
```

---

## 4. Implementing `performUnitOfWork`

This is the engine of Concurrent Mode. When given a Fiber, it does three things:

**Step A: Create the physical DOM node**
If `fiber.dom` is null, we generate it using `createDom(fiber)`. 
*(Note: We do NOT append it to the parent yet! If we append midway through processing, the user will see an incomplete UI. This is fixed in Phase 3 with the Commit Phase).*

**Step B: Construct Fibers for Children**
Iterate over `fiber.props.children`. For each child VNode, create a new Fiber.
- Set the new Fiber's `parent` to the current `fiber`.
- If it's the first child, attach it to `fiber.child`.
- For subsequent children, attach them to the previous child's `sibling` property.

**Step C: Select the Next Unit of Work**
Where do we go next?
1. Try the `child`. If it exists, return it.
2. If no child, try the `sibling`. If it exists, return it.
3. If no sibling, go up to the `parent` and try the parent's `sibling`. Keep going up until you find an uncle or reach the root.

---

## 5. Bootstrapping the Application

We update our main `render` function. Instead of recursively building the tree, it simply initializes the `nextUnitOfWork` as the root Fiber, pointing to the container.

```typescript
export function render(element: VNode, container: HTMLElement) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
    parent: null,
    child: null,
    sibling: null,
    alternate: null,
    effectTag: "PLACEMENT",
    type: "ROOT"
  };
}
```
When `render` is called, `nextUnitOfWork` is populated, and `requestIdleCallback` will naturally pick it up on the next browser idle frame.
