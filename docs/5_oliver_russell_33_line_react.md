# ⚛️ 33 Line React — Oliver Russell

A summary of Oliver Russell's (leontrolski) extreme experiment implementing a React-like component rendering system in exactly 33 lines of clean JavaScript.

---

## 📖 Core Motivation & Philosophy
*   **Brutal Minimalism:** Strips away all boilerplate (classes, complex lifecycles, fibers, or state hook tracking) to demonstrate the absolute bare essentials of Virtual DOM reconciliation.
*   **Mithril Influence:** Inspired by Mithril's direct state-to-view pipeline, proving that complex framework ceremony is often optional.

---

## 🏗️ Technical Design

### 1. Opaque Virtual DOM
*   Uses a simple helper `m(tag, attrs, ...children)` (hyperscript wrapper) to produce clean JS objects describing the tree.
*   Replaces JSX configuration with direct nested function calls or simple Babel configurations.

### 2. Manual Re-renders
*   Rather than hook listeners or complex updaters, state changes are stored in standard mutable JS objects.
*   Updates are triggered by clearing the parent DOM node and executing the recursive renderer.

### 3. Core Constraints
*   **No production optimization:** It lacks keys, diff optimizations, or concurrent scheduling.
*   It serves purely as a mental model for understanding the state-to-view pipeline.

---

## 💻 The Entire 33-Line Library

```javascript
const m = (tag, attrs, ...children) => ({ tag, attrs, children });

const render = (vnode, parent) => {
  if (typeof vnode === 'string') {
    return parent.appendChild(document.createTextNode(vnode));
  }
  const el = parent.appendChild(document.createElement(vnode.tag));
  Object.entries(vnode.attrs || {}).forEach(([k, v]) => {
    if (k.startsWith('on')) {
      el.addEventListener(k.substring(2).toLowerCase(), v);
    } else {
      el.setAttribute(k, v);
    }
  });
  vnode.children.forEach(c => render(c, el));
};
```\n