# Phase 3: The Commit Phase & Reconciliation

## Objective
Prevent incomplete UI updates during background rendering and implement an algorithm to diff the old VDOM against the new one for efficient updates.

## Steps to Execute

1. **The Commit Phase**
   - Introduce a `wipRoot` (work-in-progress root) global variable.
   - When the work loop finishes (i.e., `nextUnitOfWork` is null and `wipRoot` exists), trigger the `commitRoot` function.
   - Write `commitWork(fiber)` which recursively appends the fiber's DOM node to its parent's DOM node.
   - Stop modifying the DOM inside `performUnitOfWork`.

2. **Reconciliation (Diffing)**
   - Introduce `currentRoot` to store the last successfully committed Fiber tree.
   - Write a `reconcileChildren(wipFiber, elements)` function.
   - Iterate over the `wipFiber`'s old children (via `alternate`) and its new children (from `elements`).
   - Compare them by `type`:
     - **UPDATE:** If the type is the same, keep the DOM node and update the `props`. Set `effectTag: "UPDATE"`.
     - **PLACEMENT:** If the type is different and there is a new element, create a new DOM node. Set `effectTag: "PLACEMENT"`.
     - **DELETION:** If the type is different and there is an old element, mark it for deletion. Introduce a `deletions` array to track these.

3. **Updating DOM Properties**
   - Write `updateDom(dom, prevProps, nextProps)`.
   - Remove old or changed event listeners (props starting with `on`).
   - Remove old properties that are no longer present.
   - Set new or changed properties.
   - Add new event listeners.

4. **Updating `commitWork`**
   - Modify `commitWork` to handle `PLACEMENT` (append node), `UPDATE` (call `updateDom`), and `DELETION` (remove node).

## Validation
- We should be able to trigger a re-render by manually updating the DOM and observe that only the modified attributes or text nodes are updated, without the entire tree flashing or rebuilding.
