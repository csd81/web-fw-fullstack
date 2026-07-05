# Phase 8: Error Boundaries & Portals

## Objective
Implement structural safety nets for production applications and add the ability to render Virtual DOM nodes outside of their physical DOM hierarchy.

---

## 1. Error Boundaries

Currently, if a component throws an `Error` (unlike a `Promise` which we catch for Suspense), the entire `workLoop` crashes, leaving the user with a frozen or broken UI.

**Implementation Strategy:**
- Wrap `performUnitOfWork` in a `try/catch` block specifically looking for standard `Error` instances.
- If an error is caught, traverse *up* the Fiber tree to find a component that acts as an Error Boundary.
- In modern React, this is done via `static getDerivedStateFromError` or `componentDidCatch` on class components. Since we only have functional components, we can expose a special `CatchBoundary` component or a custom `useErrorBoundary` hook.
- Once the boundary is found, update its state to hold the error, and force a synchronous re-render from that boundary to display a fallback UI.

---

## 2. Portals

Portals allow rendering a component's children into a different part of the DOM (e.g., attaching a Modal directly to `document.body` instead of inside a deeply nested, `overflow: hidden` container).

**Implementation Strategy:**
- Create `createPortal(child, container)`.
- This function returns a special VNode, e.g., `{ type: "PORTAL", props: { child, container } }`.
- Modify `performUnitOfWork`: When processing a `PORTAL` type, traverse into its `child` but attach a special flag or reference indicating its physical DOM parent is different.
- Modify `commitWork`: When appending or removing a node, instead of traversing up to find the nearest Fiber with a DOM node, check if the parent chain goes through a `PORTAL`. If it does, use the Portal's `container` as the `domParent` for the physical DOM operations.
