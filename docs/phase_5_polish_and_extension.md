# Phase 5: Polish & Extension

## Objective
Add features that mimic production React, making the custom renderer more robust and feature-complete.

## Steps to Execute

1. **The `useEffect` Hook**
   - Extend the hook infrastructure to support effects.
   - Store the effect callback and its dependency array in a hook.
   - Create a global `pendingEffects` array.
   - **Post-commit phase:** Iterate over `pendingEffects`. If dependencies changed, run the previous effect's cleanup function, then run the new effect callback.

2. **Keyed Reconciliation (List Optimization)**
   - Update the `reconcileChildren` function to recognize a `key` prop.
   - Instead of strictly comparing children by index position, create a map of old children by key.
   - When iterating over new children, look them up by key in the map to find matches, minimizing node destruction and recreation when list items are reordered.

3. **Synthetic Events (Optional)**
   - Instead of attaching raw DOM event listeners in `updateDom`, implement an Event Delegation system.
   - Attach a single listener for each event type (e.g., 'click') at the root container.
   - Intercept the event and traverse the Fiber tree up from the target node, executing any registered `onClick` handlers and mimicking `stopPropagation()`.

4. **Fragments**
   - Add support for `<Fragment>` (`<>...</>`).
   - Like function components, Fragments don't have a physical DOM node but instead group children together logically.

## Validation
- Build a Todo List application using `useState`, `useEffect` (to sync with `localStorage`), and list rendering with `keys` to ensure the library can handle standard reactive UI patterns gracefully.
