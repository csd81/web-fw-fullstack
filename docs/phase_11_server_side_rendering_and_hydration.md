# Phase 11: Server-Side Rendering (SSR) & Hydration

## Objective
Support running the React clone on Node/Bun servers to generate HTML strings for SEO and faster First Contentful Paint (FCP), and "hydrate" those strings on the client without destroying the DOM.

---

## 1. Server-Side Rendering (`renderToString`)

We need a way to turn VNodes into HTML strings without a `document` or `window` object.

**Implementation Strategy:**
- Create `AntigravityReactDOMServer.renderToString(element)`.
- This is a synchronous, recursive function.
- It takes a VNode. If it's a function component, it executes it and recurses on the children.
- If it's an HTML tag, it constructs a string: `<div class="${props.className}">${childrenStrings}</div>`.
- This function bypasses the Fiber architecture entirely, as there is no interactive state or DOM to manage on the server.

---

## 2. Hydration (`hydrateRoot`)

When the browser receives the raw HTML from the server, running `render()` would destroy the existing DOM and recreate it from scratch. `hydrateRoot` attaches the Fiber tree to the existing DOM instead.

**Implementation Strategy:**
- Create `hydrateRoot(element, container)`.
- Start a `wipRoot` similar to `render`, but flag it for hydration.
- Modify `createDom`: Instead of calling `document.createElement`, it looks at `fiber.parent.dom.childNodes[index]` and verifies if the node type matches. 
- If the physical node matches the Virtual DOM type, it attaches the `fiber.dom` to that existing node.
- It then processes `updateDom` to attach event listeners (like `onClick`) to the pre-existing DOM node.
- If there is a mismatch (the server HTML doesn't match the client VNode), it falls back to destroying the node and creating a new one (client-side render fallback).
