# Phase 3: The Commit Phase & Reconciliation

## Objective
If the browser interrupts `performUnitOfWork`, the user might see a partially rendered UI because we are currently appending nodes to the DOM as we traverse. We will solve this by introducing a **Commit Phase** that waits for all Fibers to be calculated before modifying the DOM. We will also introduce **Reconciliation** to diff the old tree against the new tree so we don't recreate DOM nodes from scratch on every state update.

---

## 1. The Commit Phase

**State Variables:**
```typescript
let wipRoot: Fiber | null = null;      // Work in progress root
let currentRoot: Fiber | null = null;  // The last committed root (for diffing)
let deletions: Fiber[] = [];           // Nodes marked for destruction
```

**Modifying `performUnitOfWork`:**
We must *stop* mutating `dom.appendChild` inside `performUnitOfWork`. We only construct the Fibers and their `dom` properties.

**Modifying `workLoop`:**
When `nextUnitOfWork` becomes `null` (meaning we've traversed the whole tree) AND we have a `wipRoot`, we know the background work is finished. We trigger `commitRoot()`.

```typescript
function commitRoot() {
  // First, remove deleted nodes
  deletions.forEach(commitWork);
  // Then recursively append/update the rest
  commitWork(wipRoot.child);
  
  currentRoot = wipRoot;
  wipRoot = null;
}
```

**Implementing `commitWork(fiber)`:**
This function takes a fiber, finds its parent DOM node, and applies the mutation specified by `fiber.effectTag`:
- `"PLACEMENT"`: Call `parentDom.appendChild(fiber.dom)`.
- `"UPDATE"`: Call `updateDom(fiber.dom, fiber.alternate.props, fiber.props)`.
- `"DELETION"`: Call `parentDom.removeChild(fiber.dom)`.
Then, recursively call `commitWork` on `fiber.child` and `fiber.sibling`.

---

## 2. Reconciliation (The Diffing Algorithm)

Inside `performUnitOfWork`, when we iterate over `fiber.props.children`, we must compare them against `fiber.alternate.child`.

**The Logic (`reconcileChildren` function):**
Iterate through the VNode elements while simultaneously walking the `alternate` Fiber linked list (`oldFiber = oldFiber.sibling`).

1. **Compare Types:** Does the new VNode have the same `type` (e.g., both are `'div'`) as the `oldFiber`?
2. **Match (UPDATE):**
   - Keep the existing physical `dom` node (`fiber.dom = oldFiber.dom`).
   - Create a new Fiber with `effectTag: "UPDATE"`.
   - Set `alternate: oldFiber`.
3. **Different Type, New Element exists (PLACEMENT):**
   - The element type changed (e.g., `'div'` to `'span'`) or it's a completely new child.
   - Create a new Fiber with `dom: null` and `effectTag: "PLACEMENT"`.
4. **Different Type, Old Element exists (DELETION):**
   - The element was removed or changed type.
   - Set `oldFiber.effectTag = "DELETION"`.
   - Push `oldFiber` into the global `deletions` array so the commit phase can destroy it.

---

## 3. Updating DOM Properties (`updateDom`)

When an `UPDATE` tag is processed, we need to efficiently update the actual HTML element.

**Function signature:** `updateDom(dom, prevProps, nextProps)`

1. **Remove Old Properties:**
   - Loop through `prevProps`. If a prop is not in `nextProps`, remove it from the DOM.
2. **Remove Old Event Listeners:**
   - Look for props starting with `"on"` (e.g., `onClick`). 
   - If it changed or was removed in `nextProps`, call `dom.removeEventListener`.
3. **Add New Properties:**
   - Loop through `nextProps`. If the value differs from `prevProps`, set it on the DOM.
4. **Add New Event Listeners:**
   - If a new/changed prop starts with `"on"`, call `dom.addEventListener(eventType, callback)`.

By the end of Phase 3, we have a highly efficient, non-blocking diffing engine that patches the DOM identically to React's core reconciler.
