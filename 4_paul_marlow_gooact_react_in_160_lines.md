# ⚛️ Gooact: React in 160 Lines of JavaScript — Paul Marlow

A summary of Paul Marlow's project, **Gooact**, which successfully packages a fully functional Virtual DOM, patching engine, and component lifecycles in only 160 lines of JavaScript.

---

## 📖 Core Motivation & Philosophy
*   **Extreme Compactness:** Showcases that the core mechanics of a Virtual DOM and rendering pipeline can be written in a single afternoon.
*   **JSX Compatibility:** Supports standard Babel transpilation settings, allowing it to act as a drop-in replacement for simple JSX projects.

---

## 🏗️ Technical Approach & Features

### 1. The Virtual DOM & Creation
Gooact defines its virtual DOM structure using a standard `createElement` helper:
*   Takes a `type`, `props`, and `children`.
*   Differentiates between string tags (e.g., `'div'`) and component references.

### 2. The Patching Engine (`patch`)
*   Compares the current Virtual DOM node with the new one.
*   If types differ, it replaces the entire element.
*   If types are the same, it updates properties (such as classes and event listeners) and recursively patches children.

### 3. Component Architecture
*   Implements a base class `Component` supporting `props`, `state`, and `setState`.
*   When `setState` is called, it re-renders the component and invokes the internal `patch` routine to apply updates.

---

## 💻 Key Code Snippet (Base Class and Patching)

```javascript
export class Component {
  constructor(props) {
    this.props = props || {};
    this.state = {};
  }
  
  setState(state) {
    this.state = Object.assign({}, this.state, state);
    const newVNode = this.render();
    // Reconcile the old virtual node with the new one
    patch(this._vnode, newVNode);
    this._vnode = newVNode;
  }
}
```\n