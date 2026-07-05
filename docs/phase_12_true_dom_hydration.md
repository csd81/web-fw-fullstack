# Phase 12: True DOM Hydration

## Objective
Replace the current soft fallback (`container.innerHTML = ""`) with a true DOM hydration algorithm. The engine will seamlessly reuse existing server-rendered HTML nodes, avoiding wasteful DOM destruction and recreation, and selectively attach the necessary event listeners to make the page interactive.

## Key Concepts
1. **Hydration State**: Introduce a global `isHydrating` flag. The `hydrateRoot` function will start the engine with this flag set to `true`.
2. **DOM Matching**: During `updateHostComponent`, instead of blindly calling `document.createElement`, the engine will inspect the physical DOM children of the parent container.
3. **Hydration Pointers**: The engine must track the `nextHydratableNode` corresponding to the current position in the Virtual DOM tree. As we build Fibers, we match them against this physical node.
4. **Client Takeover (De-optimization)**: If a mismatch occurs (e.g., the server rendered a `<div>` but the client Virtual DOM expects a `<span>`), the engine must gracefully de-opt, setting `isHydrating = false` for that specific subtree, and fall back to standard client-side `PLACEMENT`.
5. **Event Attachment**: When a node is successfully hydrated, we assign `fiber.dom = existingNode` and mark its `effectTag = "UPDATE"`. During the commit phase, `updateDom` will run naturally, attaching the client-side event listeners and properties to the pre-existing DOM nodes!

## Implementation Steps
1. Add global `isHydrating` and node-tracking state to `src/core/dom.ts`.
2. Update `hydrateRoot` to initialize the pointer to `container.firstChild`.
3. Modify `updateHostComponent` to attempt matching `fiber.type` against the physical `nodeName`.
4. Address text node normalization (browsers often merge adjacent text nodes, which can misalign with Virtual DOM `TEXT_ELEMENT`s).
5. Ensure `commitWork` accurately handles `UPDATE` on hydrated nodes to prevent jitter or accidental text replacement if the content perfectly matches.
