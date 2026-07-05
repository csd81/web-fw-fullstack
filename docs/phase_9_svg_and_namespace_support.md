# Phase 9: SVG & Namespace Support

## Objective
Expand the library to support rendering SVGs and MathML by correctly utilizing XML namespaces when interacting with the DOM API.

---

## 1. The Namespace Problem

Our current engine uses `document.createElement(type)`. This creates an HTML element. If you try to render an `<svg>` or `<circle>`, the browser creates them as HTML elements, not SVG elements, causing them to silently fail to render on screen.

Similarly, we assign attributes via standard JS properties `dom[name] = value`. SVGs require `setAttributeNS`.

**Implementation Strategy:**
- **Detecting Namespaces:** 
  - As we traverse down the Fiber tree, if we encounter an element with `type === "svg"`, we switch the current "namespace context" to the SVG namespace (`http://www.w3.org/2000/svg`).
  - We pass this context down to all child Fibers until we exit the SVG.
- **Node Creation:** 
  - Update `createDom`. If the namespace context is SVG, use `document.createElementNS("http://www.w3.org/2000/svg", fiber.type)` instead of `document.createElement`.
- **Attribute Updates:**
  - Update `updateDom` to check if it's operating on an SVG element.
  - If it is, use `dom.setAttributeNS(null, name, value)` for standard attributes, and handle special attributes (like `xlink:href`) with their respective namespaces (`http://www.w3.org/1999/xlink`).
